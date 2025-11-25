import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding subscription plans with features...');

  // Starter Plan - Basic features
  const starterPlan = await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {
      features: ['employees', 'departments', 'payroll', 'leave', 'documents']
    },
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small businesses getting started',
      features: ['employees', 'departments', 'payroll', 'leave', 'documents'],
      maxEmployees: 50,
      maxUsers: 5,
      priceUSD: 29.00,
      priceZWL: 435.00,
      billingCycle: 'MONTHLY',
      isActive: true
    }
  });

  // Professional Plan - Advanced features
  const professionalPlan = await prisma.plan.upsert({
    where: { slug: 'professional' },
    update: {
      features: [
        'employees',
        'departments',
        'payroll',
        'leave',
        'documents',
        'contracts',
        'leaveApprovals',
        'payrollApprovals'
      ]
    },
    create: {
      name: 'Professional',
      slug: 'professional',
      description: 'Advanced features for growing companies',
      features: [
        'employees',
        'departments',
        'payroll',
        'leave',
        'documents',
        'contracts',
        'leaveApprovals',
        'payrollApprovals'
      ],
      maxEmployees: 200,
      maxUsers: 20,
      priceUSD: 79.00,
      priceZWL: 1185.00,
      billingCycle: 'MONTHLY',
      isActive: true
    }
  });

  // Enterprise Plan - All features
  const enterprisePlan = await prisma.plan.upsert({
    where: { slug: 'enterprise' },
    update: {
      features: [
        'employees',
        'departments',
        'payroll',
        'leave',
        'documents',
        'contracts',
        'leaveApprovals',
        'payrollApprovals',
        'reports',
        'timesheets',
        'analytics',
        'customFields',
        'apiAccess'
      ]
    },
    create: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Complete HR solution with all features',
      features: [
        'employees',
        'departments',
        'payroll',
        'leave',
        'documents',
        'contracts',
        'leaveApprovals',
        'payrollApprovals',
        'reports',
        'timesheets',
        'analytics',
        'customFields',
        'apiAccess'
      ],
      maxEmployees: 999999,
      maxUsers: 999999,
      priceUSD: 199.00,
      priceZWL: 2985.00,
      billingCycle: 'MONTHLY',
      isActive: true
    }
  });

  console.log('Plans seeded:', {
    starter: starterPlan.id,
    professional: professionalPlan.id,
    enterprise: enterprisePlan.id
  });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
