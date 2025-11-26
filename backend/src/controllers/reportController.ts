import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * REPORT 1: Leave Liability Report
 * Shows total financial liability for accrued but unused leave
 */
export const getLeaveLiabilityReport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { departmentId, startDate, endDate } = req.query;

    // Get all active employees with their leave balances
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(departmentId && { departmentId: departmentId as string })
      },
      include: {
        department: {
          select: {
            name: true
          }
        },
        leaveBalances: {
          where: {
            year: new Date().getFullYear()
          }
        }
      }
    });

    // Calculate leave liability for each employee
    const liabilityBreakdown = employees.map(employee => {
      const leaveBalance = employee.leaveBalances[0];
      const accruedDays = leaveBalance ? parseFloat(leaveBalance.annualTotal.toString()) : 0;
      const usedDays = leaveBalance ? parseFloat(leaveBalance.annualUsed.toString()) : 0;
      const remainingDays = leaveBalance ? parseFloat(leaveBalance.annualBalance.toString()) : 0;

      // Calculate daily rate (monthly salary / 22 working days)
      const dailyRate = employee.basicSalary / 22;
      const liabilityAmount = remainingDays * dailyRate;

      return {
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department?.name || 'N/A',
        basicSalary: employee.basicSalary,
        currency: employee.currency,
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        accruedDays: parseFloat(accruedDays.toFixed(2)),
        usedDays: parseFloat(usedDays.toFixed(2)),
        remainingDays: parseFloat(remainingDays.toFixed(2)),
        liabilityAmount: parseFloat(liabilityAmount.toFixed(2))
      };
    });

    // Calculate totals by currency
    const totalsByCurrency = liabilityBreakdown.reduce((acc, item) => {
      if (!acc[item.currency]) {
        acc[item.currency] = {
          currency: item.currency,
          totalLiability: 0,
          totalEmployees: 0,
          totalDaysOwed: 0
        };
      }
      acc[item.currency].totalLiability += item.liabilityAmount;
      acc[item.currency].totalEmployees += 1;
      acc[item.currency].totalDaysOwed += item.remainingDays;
      return acc;
    }, {} as Record<string, any>);

    const summary = Object.values(totalsByCurrency).map(total => ({
      currency: total.currency,
      totalLiability: parseFloat(total.totalLiability.toFixed(2)),
      totalEmployees: total.totalEmployees,
      totalDaysOwed: parseFloat(total.totalDaysOwed.toFixed(2))
    }));

    res.json({
      reportName: 'Leave Liability Report',
      generatedAt: new Date(),
      filters: {
        departmentId: departmentId || 'All',
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'Current'
      },
      summary,
      breakdown: liabilityBreakdown
    });

  } catch (error) {
    console.error('Leave liability report error:', error);
    res.status(500).json({ error: 'Failed to generate leave liability report' });
  }
};

/**
 * REPORT 2: NSSA & PAYE Remittance Report
 * Calculates statutory deductions per department/site for ZIMRA submission
 */
export const getStatutoryRemittanceReport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { departmentId, month, year } = req.query;

    const reportMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Get active NSSA rate
    const nssaRate = await prisma.nSSARate.findFirst({
      where: {
        tenantId,
        effectiveFrom: {
          lte: new Date()
        },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      },
      orderBy: {
        effectiveFrom: 'desc'
      }
    });

    if (!nssaRate) {
      return res.status(404).json({ error: 'No active NSSA rate configuration found' });
    }

    // Get active tax table
    const taxTable = await prisma.taxTable.findFirst({
      where: {
        tenantId,
        isActive: true,
        effectiveFrom: {
          lte: new Date()
        },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      },
      orderBy: {
        effectiveFrom: 'desc'
      }
    });

    // Get payroll runs for the specified month
    const startOfMonth = new Date(reportYear, reportMonth - 1, 1);
    const endOfMonth = new Date(reportYear, reportMonth, 0);

    const payrollRuns = await prisma.payrollRun.findMany({
      where: {
        tenantId,
        periodStart: {
          gte: startOfMonth
        },
        periodEnd: {
          lte: endOfMonth
        },
        status: {
          in: ['APPROVED', 'COMPLETED']
        }
      },
      include: {
        payslips: {
          include: {
            employee: {
              include: {
                department: true
              }
            }
          }
        }
      }
    });

    // Group by department
    const departmentBreakdown: Record<string, any> = {};

    for (const payrollRun of payrollRuns) {
      for (const payslip of payrollRun.payslips) {
        const deptName = payslip.employee.department?.name || 'Unassigned';
        
        if (!departmentBreakdown[deptName]) {
          departmentBreakdown[deptName] = {
            department: deptName,
            employees: [],
            totalGrossPay: 0,
            totalNSSAEmployee: 0,
            totalNSSAEmployer: 0,
            totalNSSA: 0,
            totalPAYE: 0,
            currency: payslip.employee.currency
          };
        }

        // Calculate NSSA (4.5% employee + 4.5% employer)
        let nssaEmployee = payslip.basicSalary * nssaRate.employeeRate;
        let nssaEmployer = payslip.basicSalary * nssaRate.employerRate;

        // Apply max cap if exists
        if (nssaRate.maxCap && payslip.basicSalary > nssaRate.maxCap) {
          nssaEmployee = nssaRate.maxCap * nssaRate.employeeRate;
          nssaEmployer = nssaRate.maxCap * nssaRate.employerRate;
        }

        const totalNSSA = nssaEmployee + nssaEmployer;

        // Get PAYE from payslip (already calculated)
        const paye = payslip.paye || 0;

        departmentBreakdown[deptName].employees.push({
          employeeNumber: payslip.employee.employeeNumber,
          employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
          grossPay: parseFloat(payslip.basicSalary.toFixed(2)),
          nssaEmployee: parseFloat(nssaEmployee.toFixed(2)),
          nssaEmployer: parseFloat(nssaEmployer.toFixed(2)),
          totalNSSA: parseFloat(totalNSSA.toFixed(2)),
          paye: parseFloat(paye.toFixed(2))
        });

        departmentBreakdown[deptName].totalGrossPay += payslip.basicSalary;
        departmentBreakdown[deptName].totalNSSAEmployee += nssaEmployee;
        departmentBreakdown[deptName].totalNSSAEmployer += nssaEmployer;
        departmentBreakdown[deptName].totalNSSA += totalNSSA;
        departmentBreakdown[deptName].totalPAYE += paye;
      }
    }

    // Round totals
    Object.values(departmentBreakdown).forEach((dept: any) => {
      dept.totalGrossPay = parseFloat(dept.totalGrossPay.toFixed(2));
      dept.totalNSSAEmployee = parseFloat(dept.totalNSSAEmployee.toFixed(2));
      dept.totalNSSAEmployer = parseFloat(dept.totalNSSAEmployer.toFixed(2));
      dept.totalNSSA = parseFloat(dept.totalNSSA.toFixed(2));
      dept.totalPAYE = parseFloat(dept.totalPAYE.toFixed(2));
    });

    // Calculate grand totals
    const grandTotal = Object.values(departmentBreakdown).reduce((acc: any, dept: any) => {
      acc.totalGrossPay += dept.totalGrossPay;
      acc.totalNSSAEmployee += dept.totalNSSAEmployee;
      acc.totalNSSAEmployer += dept.totalNSSAEmployer;
      acc.totalNSSA += dept.totalNSSA;
      acc.totalPAYE += dept.totalPAYE;
      return acc;
    }, {
      totalGrossPay: 0,
      totalNSSAEmployee: 0,
      totalNSSAEmployer: 0,
      totalNSSA: 0,
      totalPAYE: 0
    });

    // Round grand totals
    grandTotal.totalGrossPay = parseFloat(grandTotal.totalGrossPay.toFixed(2));
    grandTotal.totalNSSAEmployee = parseFloat(grandTotal.totalNSSAEmployee.toFixed(2));
    grandTotal.totalNSSAEmployer = parseFloat(grandTotal.totalNSSAEmployer.toFixed(2));
    grandTotal.totalNSSA = parseFloat(grandTotal.totalNSSA.toFixed(2));
    grandTotal.totalPAYE = parseFloat(grandTotal.totalPAYE.toFixed(2));

    res.json({
      reportName: 'NSSA & PAYE Statutory Remittance Report',
      generatedAt: new Date(),
      period: {
        month: reportMonth,
        year: reportYear,
        monthName: new Date(reportYear, reportMonth - 1).toLocaleString('default', { month: 'long' })
      },
      nssaConfiguration: {
        employeeRate: `${(nssaRate.employeeRate * 100).toFixed(1)}%`,
        employerRate: `${(nssaRate.employerRate * 100).toFixed(1)}%`,
        maxCap: nssaRate.maxCap,
        currency: nssaRate.currency
      },
      grandTotal,
      departmentBreakdown: Object.values(departmentBreakdown)
    });

  } catch (error) {
    console.error('Statutory remittance report error:', error);
    res.status(500).json({ error: 'Failed to generate statutory remittance report' });
  }
};

/**
 * REPORT 3: Dual Currency Analysis Report
 * Tracks USD vs ZWL payments, exchange rates, currency splits
 */
export const getDualCurrencyReport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { month, year } = req.query;

    const reportMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();

    const startOfMonth = new Date(reportYear, reportMonth - 1, 1);
    const endOfMonth = new Date(reportYear, reportMonth, 0);

    // Get currency rates for the period
    const currencyRates = await prisma.currencyRate.findMany({
      where: {
        tenantId,
        effectiveDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });

    // Get payroll runs
    const payrollRuns = await prisma.payrollRun.findMany({
      where: {
        tenantId,
        periodStart: {
          gte: startOfMonth
        },
        periodEnd: {
          lte: endOfMonth
        },
        status: {
          in: ['APPROVED', 'COMPLETED']
        }
      },
      include: {
        payslips: {
          include: {
            employee: {
              include: {
                department: true
              }
            }
          }
        }
      }
    });

    // Analyze by currency
    const currencyAnalysis: Record<string, any> = {
      USD: { currency: 'USD', employees: 0, totalGross: 0, totalNet: 0, departments: {} },
      ZWL: { currency: 'ZWL', employees: 0, totalGross: 0, totalNet: 0, departments: {} }
    };

    const employeeSet = new Set();

    for (const payrollRun of payrollRuns) {
      for (const payslip of payrollRun.payslips) {
        const currency = payslip.employee.currency || 'USD';
        const empKey = `${payslip.employeeId}-${currency}`;
        
        if (!employeeSet.has(empKey)) {
          currencyAnalysis[currency].employees++;
          employeeSet.add(empKey);
        }

        currencyAnalysis[currency].totalGross += payslip.grossSalary;
        currencyAnalysis[currency].totalNet += payslip.netSalary || 0;

        const deptName = payslip.employee.department?.name || 'Unassigned';
        if (!currencyAnalysis[currency].departments[deptName]) {
          currencyAnalysis[currency].departments[deptName] = {
            department: deptName,
            employees: 0,
            totalGross: 0,
            totalNet: 0
          };
        }
        currencyAnalysis[currency].departments[deptName].totalGross += payslip.grossSalary;
        currencyAnalysis[currency].departments[deptName].totalNet += payslip.netSalary || 0;
      }
    }

    // Round and convert departments to arrays
    Object.keys(currencyAnalysis).forEach(currency => {
      currencyAnalysis[currency].totalGross = parseFloat(currencyAnalysis[currency].totalGross.toFixed(2));
      currencyAnalysis[currency].totalNet = parseFloat(currencyAnalysis[currency].totalNet.toFixed(2));
      
      const depts = Object.values(currencyAnalysis[currency].departments).map((dept: any) => ({
        department: dept.department,
        employees: dept.employees,
        totalGross: parseFloat(dept.totalGross.toFixed(2)),
        totalNet: parseFloat(dept.totalNet.toFixed(2))
      }));
      
      currencyAnalysis[currency].departments = depts;
    });

    // Get latest exchange rate
    const latestRate = currencyRates[0];
    let combinedUSDEquivalent = 0;

    if (latestRate) {
      const zwlInUSD = currencyAnalysis.ZWL.totalNet / latestRate.rate;
      combinedUSDEquivalent = currencyAnalysis.USD.totalNet + zwlInUSD;
    }

    res.json({
      reportName: 'Dual Currency Analysis Report',
      generatedAt: new Date(),
      period: {
        month: reportMonth,
        year: reportYear,
        monthName: new Date(reportYear, reportMonth - 1).toLocaleString('default', { month: 'long' })
      },
      exchangeRates: currencyRates.map(rate => ({
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: rate.rate,
        effectiveDate: rate.effectiveDate,
        source: rate.source
      })),
      currencyBreakdown: Object.values(currencyAnalysis),
      combinedUSDEquivalent: parseFloat(combinedUSDEquivalent.toFixed(2))
    });

  } catch (error) {
    console.error('Dual currency report error:', error);
    res.status(500).json({ error: 'Failed to generate dual currency report' });
  }
};
