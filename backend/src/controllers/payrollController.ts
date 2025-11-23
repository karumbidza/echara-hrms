import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PAYEEngine } from '../utils/payeEngine';
import { NSSAEngine } from '../utils/nssaEngine';
import { CurrencyConverter } from '../utils/currencyConverter';

const prisma = new PrismaClient();

interface PayrollCalculation {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  grossSalary: number;
  preTaxDeductions: number;
  taxableIncome: number;
  paye: number;
  aidsLevy: number;
  nssaEmployee: number;
  nssaEmployer: number;
  otherDeductions: number;
  netSalary: number;
  currency: string;
  contractCurrency: string;
}

/**
 * Run payroll for specified period
 */
export const runPayroll = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { periodStart, periodEnd, employeeIds, allowances, bonuses, overtime, deductions } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Period start and end dates are required' });
    }

    // Create payroll run
    const payrollRun = await prisma.payrollRun.create({
      data: {
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: 'PROCESSING',
        tenantId: tenantId!,
        createdById: userId!
      }
    });

    // Get employees for payroll
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(employeeIds && employeeIds.length > 0 ? { id: { in: employeeIds } } : {})
      },
      include: {
        department: true
      }
    });

    if (employees.length === 0) {
      await prisma.payrollRun.update({
        where: { id: payrollRun.id },
        data: { status: 'FAILED' }
      });
      return res.status(400).json({ error: 'No active employees found for payroll' });
    }

    const calculations: PayrollCalculation[] = [];
    let totalGross = 0;
    let totalNet = 0;

    // Process each employee
    for (const employee of employees) {
      try {
        const calculation = await calculateEmployeePayroll({
          employee,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          allowances: allowances?.[employee.id] || 0,
          bonuses: bonuses?.[employee.id] || 0,
          overtime: overtime?.[employee.id] || 0,
          deductions: deductions?.[employee.id] || 0,
          tenantId: tenantId!
        });

        // Create payslip
        const payslip = await prisma.payslip.create({
          data: {
            employeeId: employee.id,
            payrollRunId: payrollRun.id,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            payDate: new Date(periodEnd),
            basicSalary: calculation.basicSalary,
            allowances: calculation.allowances,
            bonuses: calculation.bonuses,
            overtime: calculation.overtime,
            grossSalary: calculation.grossSalary,
            preTaxDeductions: calculation.preTaxDeductions,
            taxableIncome: calculation.taxableIncome,
            paye: calculation.paye,
            aidsLevy: calculation.aidsLevy,
            nssaEmployee: calculation.nssaEmployee,
            nssaEmployer: calculation.nssaEmployer,
            otherDeductions: calculation.otherDeductions,
            totalDeductions: calculation.paye + calculation.aidsLevy + calculation.nssaEmployee + calculation.otherDeductions,
            netSalary: calculation.netSalary,
            employerTotal: calculation.nssaEmployer,
            currency: calculation.currency,
            contractCurrency: calculation.contractCurrency,
            ytdGross: employee.ytdGross + calculation.grossSalary,
            ytdTaxable: employee.ytdTaxable + calculation.taxableIncome,
            ytdPaye: employee.ytdPaye + calculation.paye,
            ytdNssa: employee.ytdNssa + (calculation.nssaEmployee + calculation.nssaEmployer),
            ytdNetPay: employee.ytdNetPay + calculation.netSalary
          }
        });

        // Update employee YTD
        await prisma.employee.update({
          where: { id: employee.id },
          data: {
            ytdGross: { increment: calculation.grossSalary },
            ytdTaxable: { increment: calculation.taxableIncome },
            ytdPaye: { increment: calculation.paye },
            ytdNssa: { increment: calculation.nssaEmployee + calculation.nssaEmployer },
            ytdNetPay: { increment: calculation.netSalary },
            ytdYear: new Date(periodEnd).getFullYear()
          }
        });

        calculations.push(calculation);
        totalGross += calculation.grossSalary;
        totalNet += calculation.netSalary;

      } catch (error) {
        console.error(`Error processing employee ${employee.id}:`, error);
        // Continue with other employees
      }
    }

    // Update payroll run
    await prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: {
        status: 'COMPLETED',
        totalGross,
        totalNet
      }
    });

    res.json({
      message: 'Payroll processed successfully',
      payrollRun: {
        id: payrollRun.id,
        periodStart,
        periodEnd,
        employeesProcessed: calculations.length,
        totalGross,
        totalNet
      },
      calculations
    });

  } catch (error) {
    console.error('Run payroll error:', error);
    res.status(500).json({ error: 'Failed to process payroll' });
  }
};

/**
 * Calculate payroll for a single employee
 */
async function calculateEmployeePayroll(input: {
  employee: any;
  periodStart: Date;
  periodEnd: Date;
  allowances: number;
  bonuses: number;
  overtime: number;
  deductions: number;
  tenantId: string;
}): Promise<PayrollCalculation> {
  
  const { employee, periodStart, periodEnd, allowances, bonuses, overtime, deductions, tenantId } = input;

  // Step 1: Calculate gross salary
  const basicSalary = calculateBasicSalaryForPeriod(
    employee.basicSalary,
    employee.payFrequency,
    periodStart,
    periodEnd
  );

  const grossSalary = basicSalary + allowances + bonuses + overtime;

  // Step 2: Pre-tax deductions (none for now, but extensible)
  const preTaxDeductions = 0;

  // Step 3: Calculate taxable income
  const taxableIncome = grossSalary - preTaxDeductions;

  // Step 4: Calculate PAYE (using contract currency)
  const payeResult = await PAYEEngine.calculatePAYE({
    taxableIncome,
    currency: employee.contractCurrency || employee.currency,
    period: employee.payFrequency,
    ytdTaxable: employee.ytdTaxable || 0,
    ytdPaye: employee.ytdPaye || 0,
    periodDate: periodEnd,
    tenantId
  });

  const paye = payeResult.payeThisPeriod;
  const aidsLevy = PAYEEngine.calculateAIDSLevy(paye);

  // Step 5: Calculate NSSA
  const nssaResult = await NSSAEngine.calculateNSSA({
    grossSalary,
    currency: employee.contractCurrency || employee.currency,
    periodDate: periodEnd,
    tenantId
  });

  const nssaEmployee = nssaResult.employeeContribution;
  const nssaEmployer = nssaResult.employerContribution;

  // Step 6: Calculate net pay
  const totalDeductions = paye + aidsLevy + nssaEmployee + deductions;
  const netSalary = grossSalary - totalDeductions;

  return {
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    basicSalary,
    allowances,
    bonuses,
    overtime,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    paye,
    aidsLevy,
    nssaEmployee,
    nssaEmployer,
    otherDeductions: deductions,
    netSalary,
    currency: employee.currency,
    contractCurrency: employee.contractCurrency || employee.currency
  };
}

/**
 * Calculate basic salary based on pay frequency and period
 */
function calculateBasicSalaryForPeriod(
  annualOrMonthlySalary: number,
  payFrequency: string,
  periodStart: Date,
  periodEnd: Date
): number {
  // For simplicity, return the salary as-is based on frequency
  // In a real system, you'd calculate pro-rata for partial periods
  return annualOrMonthlySalary;
}

/**
 * Get payroll runs
 */
export const getPayrollRuns = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const payrollRuns = await prisma.payrollRun.findMany({
      where: { tenantId },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true }
        },
        _count: {
          select: { payslips: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payrollRuns });
  } catch (error) {
    console.error('Get payroll runs error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll runs' });
  }
};

/**
 * Get payroll run details
 */
export const getPayrollRun = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const payrollRun = await prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true }
        },
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                employeeNumber: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true
              }
            }
          }
        }
      }
    });

    if (!payrollRun) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    res.json({ payrollRun });
  } catch (error) {
    console.error('Get payroll run error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll run' });
  }
};

/**
 * Get employee payslips
 */
export const getEmployeePayslips = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const tenantId = req.user?.tenantId;

    const payslips = await prisma.payslip.findMany({
      where: {
        employeeId,
        employee: { tenantId }
      },
      include: {
        payrollRun: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payslips });
  } catch (error) {
    console.error('Get employee payslips error:', error);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
};

/**
 * Get single payslip
 */
export const getPayslip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const payslip = await prisma.payslip.findFirst({
      where: {
        id,
        employee: { tenantId }
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true,
            department: true
          }
        },
        payrollRun: true
      }
    });

    if (!payslip) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    res.json({ payslip });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ error: 'Failed to fetch payslip' });
  }
};

/**
 * Get employee salary history
 */
export const getSalaryHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const tenantId = req.user?.tenantId;

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const salaryHistory = await prisma.salaryHistory.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' }
    });

    res.json({ salaryHistory });
  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({ error: 'Failed to fetch salary history' });
  }
};
