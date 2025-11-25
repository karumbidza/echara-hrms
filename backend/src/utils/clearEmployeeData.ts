import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearEmployeeData() {
  try {
    console.log('🗑️  Starting to clear employee data...');

    // Delete in correct order due to foreign key constraints
    
    // 1. Delete payroll-related data
    console.log('Deleting payslips...');
    await prisma.payslip.deleteMany({});
    
    console.log('Deleting payroll runs...');
    await prisma.payrollRun.deleteMany({});
    
    console.log('Deleting salary history...');
    await prisma.salaryHistory.deleteMany({});
    
    console.log('Deleting timesheets...');
    await prisma.timesheet.deleteMany({});
    
    console.log('Deleting leave requests...');
    await prisma.leaveRequest.deleteMany({});
    
    console.log('Deleting leave balances...');
    await prisma.leaveBalance.deleteMany({});
    
    // 2. Delete employees
    console.log('Deleting employees...');
    const deletedEmployees = await prisma.employee.deleteMany({});
    console.log(`✅ Deleted ${deletedEmployees.count} employees`);
    
    // 3. Optionally clear departments (uncomment if you want to remove these too)
    // console.log('Deleting departments...');
    // await prisma.department.deleteMany({});
    
    console.log('\n✅ Employee data cleared successfully!');
    console.log('You can now create new employees with the improved system.');
    
  } catch (error) {
    console.error('❌ Error clearing employee data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearEmployeeData();
