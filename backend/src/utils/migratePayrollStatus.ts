import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePayrollStatus() {
  try {
    console.log('🔄 Migrating payroll run statuses...');

    // Update QUEUED to COMPLETED (assuming old queued runs are done)
    const result = await prisma.$executeRaw`
      UPDATE "payroll_runs" 
      SET status = 'COMPLETED' 
      WHERE status = 'QUEUED'
    `;

    console.log(`✅ Updated ${result} payroll runs from QUEUED to COMPLETED`);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migratePayrollStatus();
