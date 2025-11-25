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
    // Format: Employee Number, Name, ID Number, Gross, Taxable, PAYE, AIDS Levy, Total Tax, Currency
    const csvRows = [
      ['Employee Number', 'Full Name', 'National ID', 'Gross Salary', 'Taxable Income', 'PAYE', 'AIDS Levy', 'Total Tax', 'Currency'].join(',')
    ];

    // Group by currency for better reporting
    const usdPayslips = payrollRun.payslips.filter(p => p.currency === 'USD');
    const zwlPayslips = payrollRun.payslips.filter(p => p.currency === 'ZWL');

    // USD Section
    if (usdPayslips.length > 0) {
      csvRows.push(['', '=== USD PAYMENTS ===', '', '', '', '', '', '', ''].join(','));
      usdPayslips.forEach(payslip => {
        const totalTax = payslip.paye + payslip.aidsLevy;
        csvRows.push([
          payslip.employee.employeeNumber,
          `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
          payslip.employee.nationalId || '',
          payslip.grossSalary.toFixed(2),
          payslip.taxableIncome.toFixed(2),
          payslip.paye.toFixed(2),
          payslip.aidsLevy.toFixed(2),
          totalTax.toFixed(2),
          'USD'
        ].join(','));
      });

      const usdTotals = usdPayslips.reduce((acc, p) => ({
        gross: acc.gross + p.grossSalary,
        taxable: acc.taxable + p.taxableIncome,
        paye: acc.paye + p.paye,
        aids: acc.aids + p.aidsLevy
      }), { gross: 0, taxable: 0, paye: 0, aids: 0 });

      csvRows.push(['', 'USD SUBTOTAL', '', usdTotals.gross.toFixed(2), usdTotals.taxable.toFixed(2), 
                     usdTotals.paye.toFixed(2), usdTotals.aids.toFixed(2), (usdTotals.paye + usdTotals.aids).toFixed(2), 'USD'].join(','));
      csvRows.push([''].join(','));
    }

    // ZWL Section
    if (zwlPayslips.length > 0) {
      csvRows.push(['', '=== ZWL PAYMENTS ===', '', '', '', '', '', '', ''].join(','));
      zwlPayslips.forEach(payslip => {
        const totalTax = payslip.paye + payslip.aidsLevy;
        csvRows.push([
          payslip.employee.employeeNumber,
          `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
          payslip.employee.nationalId || '',
          payslip.grossSalary.toFixed(2),
          payslip.taxableIncome.toFixed(2),
          payslip.paye.toFixed(2),
          payslip.aidsLevy.toFixed(2),
          totalTax.toFixed(2),
          'ZWL'
        ].join(','));
      });

      const zwlTotals = zwlPayslips.reduce((acc, p) => ({
        gross: acc.gross + p.grossSalary,
        taxable: acc.taxable + p.taxableIncome,
        paye: acc.paye + p.paye,
        aids: acc.aids + p.aidsLevy
      }), { gross: 0, taxable: 0, paye: 0, aids: 0 });

      csvRows.push(['', 'ZWL SUBTOTAL', '', zwlTotals.gross.toFixed(2), zwlTotals.taxable.toFixed(2), 
                     zwlTotals.paye.toFixed(2), zwlTotals.aids.toFixed(2), (zwlTotals.paye + zwlTotals.aids).toFixed(2), 'ZWL'].join(','));
    }

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
    // Format: Employee Number, Name, NSSA Number, Gross Salary, NSSA Employee (4.5%), NSSA Employer (4.5%), Total NSSA, Currency
    const csvRows = [
      ['Employee Number', 'Full Name', 'NSSA Number', 'Gross Salary', 'NSSA Employee', 'NSSA Employer', 'Total NSSA', 'Currency'].join(',')
    ];

    // Group by currency
    const usdPayslips = payrollRun.payslips.filter(p => p.currency === 'USD');
    const zwlPayslips = payrollRun.payslips.filter(p => p.currency === 'ZWL');

    // USD Section
    if (usdPayslips.length > 0) {
      csvRows.push(['', '=== USD PAYMENTS ===', '', '', '', '', '', ''].join(','));
      usdPayslips.forEach(payslip => {
        const totalNSSA = payslip.nssaEmployee + payslip.nssaEmployer;
        csvRows.push([
          payslip.employee.employeeNumber,
          `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
          payslip.employee.nssaNumber || '',
          payslip.grossSalary.toFixed(2),
          payslip.nssaEmployee.toFixed(2),
          payslip.nssaEmployer.toFixed(2),
          totalNSSA.toFixed(2),
          'USD'
        ].join(','));
      });

      const usdTotals = usdPayslips.reduce((acc, p) => ({
        gross: acc.gross + p.grossSalary,
        employee: acc.employee + p.nssaEmployee,
        employer: acc.employer + p.nssaEmployer
      }), { gross: 0, employee: 0, employer: 0 });

      csvRows.push(['', 'USD SUBTOTAL', '', usdTotals.gross.toFixed(2), usdTotals.employee.toFixed(2), 
                     usdTotals.employer.toFixed(2), (usdTotals.employee + usdTotals.employer).toFixed(2), 'USD'].join(','));
      csvRows.push(['', 'NSSA Caps: USD $1,000/month', '', '', '', '', '', ''].join(','));
      csvRows.push([''].join(','));
    }

    // ZWL Section
    if (zwlPayslips.length > 0) {
      csvRows.push(['', '=== ZWL PAYMENTS ===', '', '', '', '', '', ''].join(','));
      zwlPayslips.forEach(payslip => {
        const totalNSSA = payslip.nssaEmployee + payslip.nssaEmployer;
        csvRows.push([
          payslip.employee.employeeNumber,
          `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
          payslip.employee.nssaNumber || '',
          payslip.grossSalary.toFixed(2),
          payslip.nssaEmployee.toFixed(2),
          payslip.nssaEmployer.toFixed(2),
          totalNSSA.toFixed(2),
          'ZWL'
        ].join(','));
      });

      const zwlTotals = zwlPayslips.reduce((acc, p) => ({
        gross: acc.gross + p.grossSalary,
        employee: acc.employee + p.nssaEmployee,
        employer: acc.employer + p.nssaEmployer
      }), { gross: 0, employee: 0, employer: 0 });

      csvRows.push(['', 'ZWL SUBTOTAL', '', zwlTotals.gross.toFixed(2), zwlTotals.employee.toFixed(2), 
                     zwlTotals.employer.toFixed(2), (zwlTotals.employee + zwlTotals.employer).toFixed(2), 'ZWL'].join(','));
      csvRows.push(['', 'NSSA Caps: ZWL $30,000/month', '', '', '', '', '', ''].join(','));
    }

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
    // Format: Employee Number, Full Name, Bank Name, Account Number, Net Pay, Currency
    const csvRows = [
      ['Employee Number', 'Full Name', 'Bank Name', 'Account Number', 'Net Pay', 'Currency'].join(',')
    ];

    // Group by currency for separate bank uploads
    const usdPayslips = payrollRun.payslips.filter(p => p.currency === 'USD' && p.employee.bankAccount);
    const zwlPayslips = payrollRun.payslips.filter(p => p.currency === 'ZWL' && p.employee.bankAccount);

    // USD Section
    if (usdPayslips.length > 0) {
      csvRows.push(['', '=== USD PAYMENTS ===', '', '', '', ''].join(','));
      usdPayslips.forEach(payslip => {
        csvRows.push([
          payslip.employee.employeeNumber,
          `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
          `"${payslip.employee.bankName || ''}"`,
          payslip.employee.bankAccount,
          payslip.netSalary.toFixed(2),
          'USD'
        ].join(','));
      });

      const usdTotal = usdPayslips.reduce((sum, p) => sum + p.netSalary, 0);
      csvRows.push(['', 'USD TOTAL', '', '', usdTotal.toFixed(2), 'USD'].join(','));
      csvRows.push([''].join(','));
    }

    // ZWL Section
    if (zwlPayslips.length > 0) {
      csvRows.push(['', '=== ZWL PAYMENTS ===', '', '', '', ''].join(','));
      zwlPayslips.forEach(payslip => {
        csvRows.push([
          payslip.employee.employeeNumber,
          `"${payslip.employee.firstName} ${payslip.employee.lastName}"`,
          `"${payslip.employee.bankName || ''}"`,
          payslip.employee.bankAccount,
          payslip.netSalary.toFixed(2),
          'ZWL'
        ].join(','));
      });

      const zwlTotal = zwlPayslips.reduce((sum, p) => sum + p.netSalary, 0);
      csvRows.push(['', 'ZWL TOTAL', '', '', zwlTotal.toFixed(2), 'ZWL'].join(','));
    }

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Bank_Payments_${payrollRun.periodStart.toISOString().slice(0, 7)}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting bank payments:', error);
    res.status(500).json({ error: 'Failed to export bank payment data' });
  }
};
