const { PrismaClient } = require('@prisma/client');

async function checkUser() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      include: { tenant: true }
    });
    console.log('Users:', JSON.stringify(users, null, 2));
    
    const tenants = await prisma.tenant.findMany();
    console.log('\nTenants:', JSON.stringify(tenants, null, 2));
    
    const employees = await prisma.employee.findMany({
      include: { tenant: true }
    });
    console.log('\nEmployees:', JSON.stringify(employees, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
