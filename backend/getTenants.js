const { PrismaClient } = require('@prisma/client');

async function getTenants() {
  const prisma = new PrismaClient();
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', JSON.stringify(tenants, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTenants();
