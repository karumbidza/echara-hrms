const { PrismaClient } = require('@prisma/client');

async function seedProduction() {
  const prisma = new PrismaClient();
  try {
    // Get first tenant from production
    const tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.log('❌ No tenant found in production database');
      return;
    }
    
    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);
    
    // Check if tax tables exist
    const taxTables = await prisma.taxTable.findMany({
      where: { tenantId: tenant.id }
    });
    
    console.log(`Tax tables: ${taxTables.length}`);
    
    // Check if NSSA rates exist
    const nssaRates = await prisma.nSSARate.findMany({
      where: { tenantId: tenant.id }
    });
    
    console.log(`NSSA rates: ${nssaRates.length}`);
    
    // Check if currency rates exist
    const currencyRates = await prisma.currencyRate.findMany({
      where: { tenantId: tenant.id }
    });
    
    console.log(`Currency rates: ${currencyRates.length}`);
    
    if (taxTables.length === 0) {
      console.log('\n⚠️  No tax tables found. Running seed...\n');
      const { seedPayrollData } = require('./dist/utils/seedPayrollData');
      await seedPayrollData(tenant.id);
    } else {
      console.log('\n✅ Tax data already exists in production');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction();
