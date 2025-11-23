import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for tax tables, NSSA rates, and currency rates
 * Run with: npx ts-node src/utils/seedPayrollData.ts <tenantId>
 */

async function seedPayrollData(tenantId: string) {
  console.log('🌱 Seeding payroll data for tenant:', tenantId);

  // 1. Seed USD Tax Table (Zimbabwe PAYE 2025)
  const usdTaxTable = await prisma.taxTable.upsert({
    where: { id: `${tenantId}-usd-paye-2025` },
    update: {},
    create: {
      id: `${tenantId}-usd-paye-2025`,
      name: 'Zimbabwe PAYE 2025 - USD',
      type: 'PAYE',
      currency: 'USD',
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: null,
      brackets: [
        { min: 0, max: 7200, fixed: 0, rate: 0 },           // First $600/month ($7,200/year) - Tax Free
        { min: 7200, max: 14400, fixed: 0, rate: 0.20 },    // $600-$1,200/month - 20%
        { min: 14400, max: 36000, fixed: 1440, rate: 0.25 }, // $1,200-$3,000/month - 25%
        { min: 36000, max: null, fixed: 6840, rate: 0.30 }   // Above $3,000/month - 30%
      ],
      tenantId
    }
  });
  console.log('✅ Created USD Tax Table');

  // 2. Seed ZWL Tax Table (Zimbabwe PAYE 2025)
  const zwlTaxTable = await prisma.taxTable.upsert({
    where: { id: `${tenantId}-zwl-paye-2025` },
    update: {},
    create: {
      id: `${tenantId}-zwl-paye-2025`,
      name: 'Zimbabwe PAYE 2025 - ZWL',
      type: 'PAYE',
      currency: 'ZWL',
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: null,
      brackets: [
        { min: 0, max: 120000, fixed: 0, rate: 0 },          // First ZWL 10,000/month - Tax Free
        { min: 120000, max: 240000, fixed: 0, rate: 0.20 },  // ZWL 10,000-20,000/month - 20%
        { min: 240000, max: 600000, fixed: 24000, rate: 0.25 }, // ZWL 20,000-50,000/month - 25%
        { min: 600000, max: null, fixed: 114000, rate: 0.30 }  // Above ZWL 50,000/month - 30%
      ],
      tenantId
    }
  });
  console.log('✅ Created ZWL Tax Table');

  // 3. Seed NSSA Rates for USD
  const nssaUSD = await prisma.nSSARate.upsert({
    where: { id: `${tenantId}-nssa-usd-2025` },
    update: {},
    create: {
      id: `${tenantId}-nssa-usd-2025`,
      name: 'NSSA Rates 2025 - USD',
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: null,
      employeeRate: 0.03,   // 3% employee contribution
      employerRate: 0.04,   // 4% employer contribution
      maxCap: 1000,         // Maximum salary cap of $1,000 for NSSA
      currency: 'USD',
      tenantId
    }
  });
  console.log('✅ Created NSSA USD Rates');

  // 4. Seed NSSA Rates for ZWL
  const nssaZWL = await prisma.nSSARate.upsert({
    where: { id: `${tenantId}-nssa-zwl-2025` },
    update: {},
    create: {
      id: `${tenantId}-nssa-zwl-2025`,
      name: 'NSSA Rates 2025 - ZWL',
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: null,
      employeeRate: 0.03,   // 3% employee contribution
      employerRate: 0.04,   // 4% employer contribution
      maxCap: 25000,        // Maximum salary cap of ZWL 25,000 for NSSA
      currency: 'ZWL',
      tenantId
    }
  });
  console.log('✅ Created NSSA ZWL Rates');

  // 5. Seed Currency Rates (ZWL to USD)
  const currencyRates = [
    { date: '2025-01-01', rate: 0.00061 },  // 1 ZWL = 0.00061 USD (approx 1640 ZWL = 1 USD)
    { date: '2025-02-01', rate: 0.00059 },
    { date: '2025-03-01', rate: 0.00057 },
    { date: '2025-04-01', rate: 0.00055 },
    { date: '2025-05-01', rate: 0.00053 },
    { date: '2025-06-01', rate: 0.00051 },
    { date: '2025-07-01', rate: 0.00050 },
    { date: '2025-08-01', rate: 0.00048 },
    { date: '2025-09-01', rate: 0.00046 },
    { date: '2025-10-01', rate: 0.00045 },
    { date: '2025-11-01', rate: 0.00043 },
    { date: '2025-11-23', rate: 0.00042 }   // Current rate
  ];

  for (const rateData of currencyRates) {
    await prisma.currencyRate.upsert({
      where: { id: `${tenantId}-zwl-usd-${rateData.date}` },
      update: {},
      create: {
        id: `${tenantId}-zwl-usd-${rateData.date}`,
        fromCurrency: 'ZWL',
        toCurrency: 'USD',
        rate: rateData.rate,
        effectiveDate: new Date(rateData.date),
        source: 'RBZ',
        tenantId
      }
    });
  }
  console.log('✅ Created Currency Rates (ZWL to USD)');

  // Also add USD to ZWL rates (inverse)
  for (const rateData of currencyRates) {
    await prisma.currencyRate.upsert({
      where: { id: `${tenantId}-usd-zwl-${rateData.date}` },
      update: {},
      create: {
        id: `${tenantId}-usd-zwl-${rateData.date}`,
        fromCurrency: 'USD',
        toCurrency: 'ZWL',
        rate: 1 / rateData.rate,
        effectiveDate: new Date(rateData.date),
        source: 'RBZ',
        tenantId
      }
    });
  }
  console.log('✅ Created Currency Rates (USD to ZWL)');

  console.log('');
  console.log('🎉 Payroll data seeded successfully!');
  console.log('');
  console.log('Summary:');
  console.log('- Tax Tables: 2 (USD, ZWL)');
  console.log('- NSSA Rates: 2 (USD, ZWL)');
  console.log(`- Currency Rates: ${currencyRates.length * 2} (bidirectional)`);
  console.log('');
}

// Run the seed function
const tenantId = process.argv[2];

if (!tenantId) {
  console.error('❌ Error: Please provide a tenant ID');
  console.error('Usage: npx ts-node src/utils/seedPayrollData.ts <tenantId>');
  process.exit(1);
}

seedPayrollData(tenantId)
  .catch((error) => {
    console.error('❌ Error seeding payroll data:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

export { seedPayrollData };
