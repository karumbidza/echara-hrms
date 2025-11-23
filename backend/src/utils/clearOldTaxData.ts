import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearOldTaxData() {
  try {
    console.log('🗑️  Clearing old tax tables...');
    
    // Delete existing tax tables
    await prisma.taxTable.deleteMany({});
    console.log('✅ Old tax tables deleted');
    
    // Update NSSA rates to 4.5%
    await prisma.nSSARate.updateMany({
      data: {
        employeeRate: 0.045,
        employerRate: 0.045
      }
    });
    console.log('✅ NSSA rates updated to 4.5%');
    
    console.log('\n✅ Migration complete! Now run: npx prisma db push');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearOldTaxData();
