import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_TAX_BRACKETS, TaxCalculationService } from '../services/taxCalculationService';

const prisma = new PrismaClient();

export const getTaxTables = async (req: AuthRequest, res: Response) => {
  try {
    const { currency, payFrequency, activeOnly } = req.query;
    
    const where: any = {
      tenantId: req.user!.tenantId
    };

    if (currency) where.currency = currency;
    if (payFrequency) where.payFrequency = payFrequency;

    if (activeOnly === 'true') {
      const now = new Date();
      where.isActive = true;
      where.effectiveFrom = { lte: now };
      where.OR = [{ effectiveTo: null }, { effectiveTo: { gte: now } }];
    }

    const taxTables = await prisma.taxTable.findMany({
      where,
      orderBy: [{ currency: 'asc' }, { payFrequency: 'asc' }, { effectiveFrom: 'desc' }]
    });

    res.json(taxTables);
  } catch (error) {
    console.error('Get tax tables error:', error);
    res.status(500).json({ error: 'Failed to fetch tax tables' });
  }
};

export const seedDefaultTaxTables = async (req: AuthRequest, res: Response) => {
  try {
    const { currency } = req.body;
    const currencies = currency ? [currency] : ['USD', 'ZWL'];
    const payFrequencies = ['MONTHLY', 'WEEKLY', 'FORTNIGHTLY'];
    
    const createdTables = [];

    for (const curr of currencies) {
      for (const frequency of payFrequencies) {
        const brackets = DEFAULT_TAX_BRACKETS[curr as keyof typeof DEFAULT_TAX_BRACKETS]?.[frequency as keyof typeof DEFAULT_TAX_BRACKETS.USD];
        
        if (brackets) {
          const taxTable = await prisma.taxTable.create({
            data: {
              name: `${curr} ${frequency} 2025`,
              currency: curr,
              payFrequency: frequency as 'MONTHLY' | 'WEEKLY' | 'FORTNIGHTLY',
              type: 'PAYE',
              effectiveFrom: new Date('2025-01-01'),
              effectiveTo: new Date('2025-12-31'),
              brackets: brackets as any,
              isActive: true,
              tenantId: req.user!.tenantId
            }
          });
          createdTables.push(taxTable);
        }
      }
    }

    res.status(201).json({
      message: 'Default tax tables seeded successfully',
      taxTables: createdTables
    });
  } catch (error) {
    console.error('Seed tax tables error:', error);
    res.status(500).json({ error: 'Failed to seed default tax tables' });
  }
};

export const testTaxCalculation = async (req: AuthRequest, res: Response) => {
  try {
    const { taxableIncome, currency, payFrequency } = req.body;

    const taxTable = await prisma.taxTable.findFirst({
      where: {
        tenantId: req.user!.tenantId,
        currency,
        payFrequency,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }]
      }
    });

    if (!taxTable) {
      return res.status(404).json({ error: 'No active tax table found' });
    }

    const result = TaxCalculationService.calculatePAYE(
      taxableIncome,
      taxTable.brackets as any,
      currency
    );

    res.json({
      taxableIncome,
      currency,
      payFrequency,
      taxTable: taxTable.name,
      calculation: result
    });
  } catch (error) {
    console.error('Test tax calculation error:', error);
    res.status(500).json({ error: 'Failed to test tax calculation' });
  }
};
