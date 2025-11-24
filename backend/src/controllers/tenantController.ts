import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register new company (multi-tenant signup)
export const registerCompany = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      fullName,
      email,
      password,
      planSlug,
      billingCycle,
      currency
    } = req.body;

    // Validation
    if (!companyName || !companyEmail || !fullName || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check if company email already exists
    const existingCompany = await prisma.tenant.findFirst({
      where: { companyEmail }
    });

    if (existingCompany) {
      return res.status(400).json({ error: 'Company email already registered' });
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create slug from company name
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug || 'professional' }
    });

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Calculate trial end date (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create tenant (company)
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        companyEmail,
        companyPhone,
        companyAddress,
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
        currency: currency || 'USD'
      }
    });

    // Create owner user (ADMIN role)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });

    // Create subscription
    const startDate = new Date();
    const endDate = new Date(trialEndsAt);
    endDate.setMonth(endDate.getMonth() + (billingCycle === 'ANNUAL' ? 12 : 1));

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        status: 'TRIAL',
        startDate,
        endDate,
        nextBillingDate: trialEndsAt,
        amountUSD: currency === 'USD' ? plan.priceUSD : 0,
        amountZWL: currency === 'ZWL' ? plan.priceZWL : 0,
        currency: currency || 'USD'
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, tenantId: tenant.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Company registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subscriptionStatus: tenant.subscriptionStatus
      },
      subscriptionId: subscription.id,
      trialEndsAt
    });

  } catch (error: any) {
    console.error('Company registration error:', error);
    res.status(500).json({ error: 'Failed to register company' });
  }
};

// Seed default plans
export const seedPlans = async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        name: 'Starter',
        slug: 'starter',
        description: 'Perfect for small teams',
        priceUSD: 29,
        priceZWL: 900,
        billingCycle: 'MONTHLY',
        maxEmployees: 10,
        maxUsers: 2,
        features: JSON.stringify([
          'Up to 10 employees',
          '2 user accounts',
          'Payroll processing',
          'Tax calculations',
          'Basic reports',
          'Email support'
        ]),
        isActive: true
      },
      {
        name: 'Professional',
        slug: 'professional',
        description: 'For growing businesses',
        priceUSD: 79,
        priceZWL: 2500,
        billingCycle: 'MONTHLY',
        maxEmployees: 50,
        maxUsers: 5,
        features: JSON.stringify([
          'Up to 50 employees',
          '5 user accounts',
          'All Starter features',
          'Approval workflows',
          'Leave management',
          'Advanced reports',
          'Priority support'
        ]),
        isActive: true
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'For large organizations',
        priceUSD: 0,
        priceZWL: 0,
        billingCycle: 'MONTHLY',
        maxEmployees: 999999,
        maxUsers: 999999,
        features: JSON.stringify([
          'Unlimited employees',
          'Unlimited users',
          'All Professional features',
          'Custom integrations',
          'Dedicated account manager',
          '24/7 phone support',
          'SLA guarantee'
        ]),
        isActive: true
      }
    ];

    for (const planData of plans) {
      await prisma.plan.upsert({
        where: { slug: planData.slug },
        update: planData,
        create: planData
      });
    }

    res.json({ message: 'Plans seeded successfully', count: plans.length });
  } catch (error) {
    console.error('Error seeding plans:', error);
    res.status(500).json({ error: 'Failed to seed plans' });
  }
};
