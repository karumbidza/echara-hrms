import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
}

// Export PAYE remittance CSV for ZIMRA
export const exportPAYE = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const payrollRun = await prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        payslips: {
          include: {
            employee: true
          }
        }
      }
    });

    if (!payrollRun) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    // Zimbabwe ZIMRA P.35 format
    // Format: Employee Number, Name, ID Number, Gross, Taxable, PAYE, AIDS Levy, Total Tax
    const csvRows = [
      ['Employee Number', 'Full Name', 'National ID', 'Gross Salary', 'Taxable Income', 'PAYE', 'AIDS Levy', 'Total Tax'].join(',')
    ];

    payrollRun.payslips.forEach(payslip => {
      const totalTax = payslip.paye + payslip.aidsLevy;
      csvRows.push([
        payslip.employee.employeeNumber,
        `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
        payslip.employee.nationalId || '',
        payslip.grossSalary.toFixed(2),
        payslip.taxableIncome.toFixed(2),
        payslip.paye.toFixed(2),
        payslip.aidsLevy.toFixed(2),
        totalTax.toFixed(2)
      ].join(','));
    });

    // Summary row
    const totals = payrollRun.payslips.reduce((acc, p) => ({
      gross: acc.gross + p.grossSalary,
      taxable: acc.taxable + p.taxableIncome,
      paye: acc.paye + p.paye,
      aids: acc.aids + p.aidsLevy
    }), { gross: 0, taxable: 0, paye: 0, aids: 0 });

    csvRows.push(['', 'TOTAL', '', totals.gross.toFixed(2), totals.taxable.toFixed(2), 
                   totals.paye.toFixed(2), totals.aids.toFixed(2), (totals.paye + totals.aids).toFixed(2)].join(','));

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=PAYE_${payrollRun.periodStart.toISOString().slice(0, 7)}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting PAYE:', error);
    res.status(500).json({ error: 'Failed to export PAYE data' });
  }
};

// Export NSSA remittance CSV
export const exportNSSA = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const payrollRun = await prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        payslips: {
          include: {
            employee: true
          }
        }
      }
    });

    if (!payrollRun) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    // NSSA remittance format
    // Format: Employee Number, Name, NSSA Number, Gross Salary, NSSA Employee (4.5%), NSSA Employer (4.5%), Total NSSA
    const csvRows = [
      ['Employee Number', 'Full Name', 'NSSA Number', 'Gross Salary', 'NSSA Employee', 'NSSA Employer', 'Total NSSA'].join(',')
    ];

    payrollRun.payslips.forEach(payslip => {
      const totalNSSA = payslip.nssaEmployee + payslip.nssaEmployer;
      csvRows.push([
        payslip.employee.employeeNumber,
        `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
        payslip.employee.nssaNumber || '',
        payslip.grossSalary.toFixed(2),
        payslip.nssaEmployee.toFixed(2),
        payslip.nssaEmployer.toFixed(2),
        totalNSSA.toFixed(2)
      ].join(','));
    });

    // Summary row
    const totals = payrollRun.payslips.reduce((acc, p) => ({
      gross: acc.gross + p.grossSalary,
      employee: acc.employee + p.nssaEmployee,
      employer: acc.employer + p.nssaEmployer
    }), { gross: 0, employee: 0, employer: 0 });

    csvRows.push(['', 'TOTAL', '', totals.gross.toFixed(2), totals.employee.toFixed(2), 
                   totals.employer.toFixed(2), (totals.employee + totals.employer).toFixed(2)].join(','));

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=NSSA_${payrollRun.periodStart.toISOString().slice(0, 7)}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting NSSA:', error);
    res.status(500).json({ error: 'Failed to export NSSA data' });
  }
};

// Export bank payment CSV
export const exportBankPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const payrollRun = await prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        payslips: {
          include: {
            employee: true
          }
        }
      }
    });

    if (!payrollRun) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    // Bank upload format (standard for Zimbabwe banks)
    // Format: Employee Number, Full Name, Bank Name, Account Number, Branch Code, Net Pay, Currency
    const csvRows = [
      ['Employee Number', 'Full Name', 'Bank Name', 'Account Number', 'Net Pay', 'Currency'].join(',')
    ];

    payrollRun.payslips.forEach(payslip => {
      if (payslip.employee.bankAccount) {
        csvRows.push([
          payslip.employee.employeeNumber,
          `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
          `"${payslip.employee.bankName || ''}"`,
          payslip.employee.bankAccount,
          payslip.netSalary.toFixed(2),
          payslip.currency
        ].join(','));
      }
    });

    // Summary row
    const totalNetPay = payrollRun.payslips.reduce((sum, p) => sum + p.netSalary, 0);
    csvRows.push(['', 'TOTAL', '', '', totalNetPay.toFixed(2), ''].join(','));

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Bank_Payments_${payrollRun.periodStart.toISOString().slice(0, 7)}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting bank payments:', error);
    res.status(500).json({ error: 'Failed to export bank payment data' });
  }
};
