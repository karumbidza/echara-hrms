import { Response } from 'express';
import { PrismaClient, PayrollStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { TaxCalculationService } from '../services/taxCalculationService';

const prisma = new PrismaClient();

interface EmployeePayrollData {
  employeeId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  otherAllowances: number;
  overtimePay: number;
  bonus: number;
  commission: number;
  pensionContribution: number;
  medicalAid: number;
  loanRepayment: number;
  salaryAdvance: number;
  otherDeductions: number;
  paymentCurrency: string;
}

/**
 * Run payroll for specified period
 * Zimbabwean payroll processing with proper tax calculations
 */
export const runPayroll = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { periodStart, periodEnd, exchangeRate, employees: employeeDataArray } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Period start and end dates are required' });
    }

    if (!exchangeRate || exchangeRate <= 0) {
      return res.status(400).json({ error: 'Valid exchange rate is required' });
    }

    if (!employeeDataArray || employeeDataArray.length === 0) {
      return res.status(400).json({ error: 'At least one employee must be selected' });
    }

    // Create payroll run
    const payrollRun = await prisma.payrollRun.create({
      data: {
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: PayrollStatus.DRAFT,
        tenantId: tenantId!,
        createdById: userId!
      }
    });

    // Save exchange rate for this period
    await prisma.currencyRate.create({
      data: {
        fromCurrency: 'USD',
        toCurrency: 'ZWL',
        rate: exchangeRate,
        effectiveDate: new Date(periodEnd),
        source: 'Manual',
        tenantId: tenantId!
      }
    });

    // Also save reverse rate
    await prisma.currencyRate.create({
      data: {
        fromCurrency: 'ZWL',
        toCurrency: 'USD',
        rate: 1 / exchangeRate,
        effectiveDate: new Date(periodEnd),
        source: 'Manual',
        tenantId: tenantId!
      }
    });

    let totalGross = 0;
    let totalNet = 0;
    const processedCount = 0;

    // Process each employee
    for (const empData of employeeDataArray) {
      try {
        // Get employee details
        const employee = await prisma.employee.findFirst({
          where: { id: empData.employeeId, tenantId },
          include: { department: true }
        });

        if (!employee) {
          console.error(`Employee ${empData.employeeId} not found`);
          continue;
        }

        // Calculate payroll for this employee
        const result = await calculateEmployeePayroll({
          employee,
          empData,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          exchangeRate,
          tenantId: tenantId!
        });

        // Create payslip
        await prisma.payslip.create({
          data: {
            employeeId: employee.id,
            payrollRunId: payrollRun.id,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            payDate: new Date(periodEnd),
            
            // Earnings
            basicSalary: result.basicSalary,
            allowances: result.totalAllowances,
            bonuses: result.totalBonuses,
            overtime: result.overtimePay,
            grossSalary: result.grossSalary,
            
            // Deductions
            preTaxDeductions: result.preTaxDeductions,
            taxableIncome: result.taxableIncome,
            paye: result.paye,
            aidsLevy: result.aidsLevy,
            nssaEmployee: result.nssaEmployee,
            nssaEmployer: result.nssaEmployer,
            otherDeductions: result.postTaxDeductions,
            totalDeductions: result.totalDeductions,
            netSalary: result.netSalary,
            employerTotal: result.nssaEmployer,
            
            // Currency
            currency: empData.paymentCurrency,
            contractCurrency: employee.contractCurrency,
            
            // YTD
            ytdGross: result.ytdGross,
            ytdTaxable: result.ytdTaxable,
            ytdPaye: result.ytdPaye,
            ytdNssa: result.ytdNssa,
            ytdNetPay: result.ytdNetPay,

            // Leave information
            leaveAccruedThisMonth: result.leaveAccruedThisMonth,
            leaveUsedYTD: result.leaveUsedYTD,
            leaveBalanceRemaining: result.leaveBalanceRemaining,

            // PDF password (national ID without spaces)
            pdfPassword: employee.nationalId?.replace(/[\s-]/g, '') || null
          }
        });

        // Update employee YTD
        await prisma.employee.update({
          where: { id: employee.id },
          data: {
            ytdGross: result.ytdGross,
            ytdTaxable: result.ytdTaxable,
            ytdPaye: result.ytdPaye,
            ytdNssa: result.ytdNssa,
            ytdNetPay: result.ytdNetPay,
            ytdYear: new Date(periodEnd).getFullYear()
          }
        });

        totalGross += result.grossSalary;
        totalNet += result.netSalary;

      } catch (error) {
        console.error(`Error processing employee ${empData.employeeId}:`, error);
      }
    }

    // Update payroll run with totals (keep as DRAFT for approval)
    await prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: {
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
        employeesProcessed: employeeDataArray.length,
        totalGross,
        totalNet,
        exchangeRate
      }
    });

  } catch (error) {
    console.error('Run payroll error:', error);
    res.status(500).json({ error: 'Failed to process payroll' });
  }
};

/**
 * Calculate and update employee leave balance for the month
 */
async function processMonthlyLeaveAccrual(employeeId: string, periodEnd: Date) {
  const year = periodEnd.getFullYear();
  
  // Get or create leave balance for the year
  let leaveBalance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_year: {
        employeeId,
        year
      }
    }
  });

  if (!leaveBalance) {
    // Create new balance for the year (Zimbabwe default: 22 annual days)
    leaveBalance = await prisma.leaveBalance.create({
      data: {
        employeeId,
        year,
        annualTotal: 22, // Zimbabwe standard
        annualUsed: 0,
        annualBalance: 22,
        annualCarryOver: 0,
        sickUsed: 0,
        maternityUsed: 0,
        paternityUsed: 0
      }
    });
  }

  // Calculate monthly accrual (22 days / 12 months = 1.833...)
  const monthlyAccrual = 22 / 12;

  // Update annual balance with accrual
  const newAnnualBalance = Number(leaveBalance.annualBalance) + monthlyAccrual;
  
  await prisma.leaveBalance.update({
    where: { id: leaveBalance.id },
    data: {
      annualBalance: newAnnualBalance
    }
  });

  return {
    accruedThisMonth: monthlyAccrual,
    usedYTD: Number(leaveBalance.annualUsed),
    balanceRemaining: newAnnualBalance
  };
}

/**
 * Calculate payroll for a single employee (Zimbabwean style)
 */
async function calculateEmployeePayroll(input: {
  employee: any;
  empData: EmployeePayrollData;
  periodStart: Date;
  periodEnd: Date;
  exchangeRate: number;
  tenantId: string;
}) {
  const { employee, empData, periodEnd, tenantId } = input;

  // Step 1: Calculate Gross Earnings (all taxable)
  const basicSalary = empData.basicSalary;
  const totalAllowances = 
    empData.housingAllowance + 
    empData.transportAllowance + 
    empData.mealAllowance + 
    empData.otherAllowances;
  
  const totalBonuses = empData.bonus + empData.commission;
  const overtimePay = empData.overtimePay;

  const grossSalary = basicSalary + totalAllowances + totalBonuses + overtimePay;

  // Step 2: Pre-tax Deductions (reduce taxable income)
  const preTaxDeductions = empData.pensionContribution + empData.medicalAid;

  // Step 3: Calculate Taxable Income
  const taxableIncome = grossSalary - preTaxDeductions;

  // Step 4: Calculate Post-tax Deductions first (needed for service)
  const postTaxDeductions = 
    empData.loanRepayment + 
    empData.salaryAdvance + 
    empData.otherDeductions;

  // Step 5: Use new Tax Calculation Service
  const taxResult = await TaxCalculationService.calculateEmployeePayroll(
    employee,
    basicSalary,
    totalAllowances + totalBonuses + overtimePay,
    preTaxDeductions,
    postTaxDeductions,
    tenantId
  );

  const paye = taxResult.paye;
  const aidsLevy = taxResult.aidsLevy;
  const nssaEmployee = taxResult.nssaEmployee;
  const nssaEmployer = taxResult.nssaEmployer;

  // Step 6: Calculate Total Deductions and Net Pay
  const totalDeductions = paye + aidsLevy + nssaEmployee + postTaxDeductions;
  const netSalary = grossSalary - totalDeductions;

  // Step 7: Process monthly leave accrual
  const leaveData = await processMonthlyLeaveAccrual(employee.id, input.periodEnd);

  // Step 8: Update YTD
  const ytdGross = (employee.ytdGross || 0) + grossSalary;
  const ytdTaxable = (employee.ytdTaxable || 0) + taxableIncome;
  const ytdPaye = (employee.ytdPaye || 0) + paye;
  const ytdNssa = (employee.ytdNssa || 0) + (nssaEmployee + nssaEmployer);
  const ytdNetPay = (employee.ytdNetPay || 0) + netSalary;

  return {
    basicSalary,
    totalAllowances,
    totalBonuses,
    overtimePay,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    paye,
    aidsLevy,
    nssaEmployee,
    nssaEmployer,
    postTaxDeductions,
    totalDeductions,
    netSalary,
    ytdGross,
    ytdTaxable,
    ytdPaye,
    ytdNssa,
    ytdNetPay,
    leaveAccruedThisMonth: leaveData.accruedThisMonth,
    leaveUsedYTD: leaveData.usedYTD,
    leaveBalanceRemaining: leaveData.balanceRemaining
  };
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
