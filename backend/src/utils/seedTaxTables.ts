import { PrismaClient } from '@prisma/client';
import { DEFAULT_TAX_BRACKETS } from '../services/taxCalculationService';

const prisma = new PrismaClient();

async function seedTaxTables() {
  try {
    console.log('🌱 Seeding tax tables...\n');

    // Get the first tenant (you might need to modify this for multi-tenant)
    const tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.error('❌ No tenant found! Please create a tenant first.');
      return;
    }

    console.log(`📊 Seeding for tenant: ${tenant.name}\n`);

    const currencies = ['USD', 'ZWL'];
    const payFrequencies = ['MONTHLY', 'WEEKLY', 'FORTNIGHTLY'];
    
    let created = 0;

    for (const curr of currencies) {
      for (const frequency of payFrequencies) {
        const brackets = DEFAULT_TAX_BRACKETS[curr as keyof typeof DEFAULT_TAX_BRACKETS]?.[frequency as keyof typeof DEFAULT_TAX_BRACKETS.USD];
        
        if (brackets) {
          const existingTable = await prisma.taxTable.findFirst({
            where: {
              tenantId: tenant.id,
              currency: curr,
              payFrequency: frequency as any,
              name: `${curr} ${frequency} 2025`
            }
          });

          if (existingTable) {
            console.log(`⏭️  Skipping ${curr} ${frequency} - already exists`);
            continue;
          }

          await prisma.taxTable.create({
            data: {
              name: `${curr} ${frequency} 2025`,
              currency: curr,
              payFrequency: frequency as any,
              type: 'PAYE',
              effectiveFrom: new Date('2025-01-01'),
              effectiveTo: new Date('2025-12-31'),
              brackets: brackets as any,
              isActive: true,
              tenantId: tenant.id
            }
          });
          
          console.log(`✅ Created: ${curr} ${frequency} 2025`);
          created++;
        }
      }
    }

    console.log(`\n🎉 Successfully seeded ${created} tax tables!`);
    console.log('\n📋 Tax Table Summary:');
    console.log('   - USD: 3 frequencies (MONTHLY, WEEKLY, FORTNIGHTLY)');
    console.log('   - ZWL: 3 frequencies (MONTHLY, WEEKLY, FORTNIGHTLY)');
    console.log('   - NSSA Rate: 4.5% employee + 4.5% employer');
    console.log('   - AIDS Levy: 3% of PAYE');
    
  } catch (error) {
    console.error('❌ Error seeding tax tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTaxTables();
