import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPayrollData() {
  try {
    console.log('Starting to clear all payroll data...\n');

    // Delete PayrollLines first (if exists, foreign key constraint)
    const deletedLines = await prisma.payrollLine.deleteMany({});
    console.log(`Deleted ${deletedLines.count} payroll lines`);

    // Delete Payslips (foreign key to PayrollRun)
    const deletedPayslips = await prisma.payslip.deleteMany({});
    console.log(`Deleted ${deletedPayslips.count} payslips`);

    // Delete TaxCalculations (foreign key to PayrollRun)
    const deletedTaxCalcs = await prisma.taxCalculation.deleteMany({});
    console.log(`Deleted ${deletedTaxCalcs.count} tax calculations`);

    // Delete PayrollRuns
    const deletedRuns = await prisma.payrollRun.deleteMany({});
    console.log(`Deleted ${deletedRuns.count} payroll runs`);

    console.log('\nSuccessfully cleared all payroll data!');
    console.log('Database is now ready for fresh payroll processing.\n');

  } catch (error) {
    console.error('Error clearing payroll data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearPayrollData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
