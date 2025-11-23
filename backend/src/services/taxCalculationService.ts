import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TaxBracket {
  min: number;
  max: number | null; // null means infinity
  rate: number;
  deduct: number;
}

export interface TaxCalculationResult {
  paye: number;
  aidsLevy: number;
  totalTax: number;
  bracketsUsed: Array<{
    bracket: TaxBracket;
    taxableAmount: number;
    taxAmount: number;
  }>;
}

export interface NssaCalculationResult {
  employeeContribution: number;
  employerContribution: number;
  capped: boolean;
}

export class TaxCalculationService {
  /**
   * Calculate PAYE tax using the deduct method
   * Formula: Tax = (Taxable Income × Rate) - Deduct
   */
  static calculatePAYE(
    taxableIncome: number,
    brackets: TaxBracket[],
    currency: string = 'USD'
  ): TaxCalculationResult {
    // Sort brackets by min amount descending to find the right bracket
    const sortedBrackets = [...brackets].sort((a, b) => b.min - a.min);
    
    let paye = 0;
    let applicableBracket: TaxBracket | null = null;
    const bracketsUsed: Array<{
      bracket: TaxBracket;
      taxableAmount: number;
      taxAmount: number;
    }> = [];

    // Find the applicable bracket
    for (const bracket of sortedBrackets) {
      if (taxableIncome > bracket.min) {
        if (bracket.max === null || taxableIncome <= bracket.max) {
          applicableBracket = bracket;
          break;
        }
      }
    }

    if (applicableBracket) {
      // Apply the formula: (Taxable Income × Rate) - Deduct
      paye = (taxableIncome * applicableBracket.rate) - applicableBracket.deduct;
      paye = Math.max(0, paye); // Ensure tax is not negative

      bracketsUsed.push({
        bracket: applicableBracket,
        taxableAmount: taxableIncome,
        taxAmount: paye
      });
    }

    // Calculate AIDS Levy (3% of PAYE)
    const aidsLevy = paye * 0.03;

    return {
      paye,
      aidsLevy,
      totalTax: paye + aidsLevy,
      bracketsUsed
    };
  }

  /**
   * Calculate NSSA contributions (4.5% employee, 4.5% employer)
   */
  static calculateNSSA(
    grossSalary: number,
    currency: string = 'USD'
  ): NssaCalculationResult {
    // NSSA rates (4.5% employee, 4.5% employer)
    const nssaRate = 0.045;
    
    // Contribution caps based on currency
    const caps = {
      USD: 1000,    // $1,000 USD cap
      ZWL: 30000    // ZWL 30,000 cap
    };

    const cap = caps[currency as keyof typeof caps] || caps.USD;
    const cappedGross = Math.min(grossSalary, cap);
    
    const employeeContribution = cappedGross * nssaRate;
    const employerContribution = cappedGross * nssaRate;

    return {
      employeeContribution,
      employerContribution,
      capped: grossSalary > cap
    };
  }

  /**
   * Get active tax table for a specific currency and pay frequency
   */
  static async getActiveTaxTable(
    tenantId: string,
    currency: string,
    payFrequency: string
  ): Promise<{ brackets: TaxBracket[]; id: string; name: string } | null> {
    const now = new Date();
    
    const taxTable = await prisma.taxTable.findFirst({
      where: {
        tenantId,
        currency,
        payFrequency: payFrequency as 'MONTHLY' | 'WEEKLY' | 'FORTNIGHTLY',
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } }
        ]
      },
      orderBy: { effectiveFrom: 'desc' }
    });

    if (!taxTable) {
      return null;
    }

    return {
      brackets: taxTable.brackets as unknown as TaxBracket[],
      id: taxTable.id,
      name: taxTable.name
    };
  }

  /**
   * Calculate complete payroll for an employee
   */
  static async calculateEmployeePayroll(
    employee: any,
    grossSalary: number,
    allowances: number = 0,
    preTaxDeductions: number = 0,
    postTaxDeductions: number = 0,
    tenantId: string
  ) {
    // Calculate taxable income (gross + allowances - pre-tax deductions like pension, medical)
    const taxableIncome = grossSalary + allowances - preTaxDeductions;

    // Get appropriate tax table
    const taxTable = await this.getActiveTaxTable(
      tenantId,
      employee.currency,
      employee.payFrequency
    );

    if (!taxTable) {
      throw new Error(`No active tax table found for ${employee.currency} ${employee.payFrequency}`);
    }

    // Calculate PAYE and AIDS Levy
    const taxResult = this.calculatePAYE(taxableIncome, taxTable.brackets, employee.currency);

    // Calculate NSSA
    const nssaResult = this.calculateNSSA(grossSalary + allowances, employee.currency);

    // Calculate net salary
    const totalDeductions = 
      taxResult.totalTax + 
      nssaResult.employeeContribution + 
      preTaxDeductions +
      postTaxDeductions;
    
    const netSalary = grossSalary + allowances - totalDeductions;

    return {
      grossSalary,
      allowances,
      preTaxDeductions,
      postTaxDeductions,
      taxableIncome,
      paye: taxResult.paye,
      aidsLevy: taxResult.aidsLevy,
      nssaEmployee: nssaResult.employeeContribution,
      nssaEmployer: nssaResult.employerContribution,
      nssaCapped: nssaResult.capped,
      totalDeductions,
      netSalary,
      taxCalculation: taxResult,
      taxTableId: taxTable.id,
      taxTableName: taxTable.name
    };
  }
}

/**
 * Default tax brackets based on ZIMRA 2025 tables (using deduct method)
 */
export const DEFAULT_TAX_BRACKETS = {
  USD: {
    MONTHLY: [
      { min: 0, max: 100, rate: 0, deduct: 0 },
      { min: 100.01, max: 300, rate: 0.20, deduct: 20 },
      { min: 300.01, max: 1000, rate: 0.25, deduct: 35 },
      { min: 1000.01, max: 2000, rate: 0.30, deduct: 85 },
      { min: 2000.01, max: 3000, rate: 0.35, deduct: 185 },
      { min: 3000.01, max: null, rate: 0.40, deduct: 335 }
    ] as TaxBracket[],
    WEEKLY: [
      { min: 0, max: 23.08, rate: 0, deduct: 0 },
      { min: 23.09, max: 69.23, rate: 0.20, deduct: 4.62 },
      { min: 69.24, max: 230.77, rate: 0.25, deduct: 8.08 },
      { min: 230.78, max: 461.54, rate: 0.30, deduct: 19.62 },
      { min: 461.55, max: 692.31, rate: 0.35, deduct: 42.69 },
      { min: 692.32, max: null, rate: 0.40, deduct: 76.92 }
    ] as TaxBracket[],
    FORTNIGHTLY: [
      { min: 0, max: 46.15, rate: 0, deduct: 0 },
      { min: 46.16, max: 138.46, rate: 0.20, deduct: 9.23 },
      { min: 138.47, max: 461.54, rate: 0.25, deduct: 16.15 },
      { min: 461.55, max: 923.08, rate: 0.30, deduct: 39.23 },
      { min: 923.09, max: 1384.62, rate: 0.35, deduct: 85.38 },
      { min: 1384.63, max: null, rate: 0.40, deduct: 154.62 }
    ] as TaxBracket[]
  },
  ZWL: {
    MONTHLY: [
      { min: 0, max: 2800, rate: 0, deduct: 0 },
      { min: 2800.01, max: 8400, rate: 0.20, deduct: 560 },
      { min: 8400.01, max: 28000, rate: 0.25, deduct: 980 },
      { min: 28000.01, max: 56000, rate: 0.30, deduct: 2380 },
      { min: 56000.01, max: 84000, rate: 0.35, deduct: 5180 },
      { min: 84000.01, max: null, rate: 0.40, deduct: 9380 }
    ] as TaxBracket[],
    WEEKLY: [
      { min: 0, max: 646.15, rate: 0, deduct: 0 },
      { min: 646.16, max: 1938.46, rate: 0.20, deduct: 129.23 },
      { min: 1938.47, max: 6461.54, rate: 0.25, deduct: 226.15 },
      { min: 6461.55, max: 12923.08, rate: 0.30, deduct: 548.23 },
      { min: 12923.09, max: 19384.62, rate: 0.35, deduct: 1195.38 },
      { min: 19384.63, max: null, rate: 0.40, deduct: 2164.62 }
    ] as TaxBracket[],
    FORTNIGHTLY: [
      { min: 0, max: 1292.31, rate: 0, deduct: 0 },
      { min: 1292.32, max: 3876.92, rate: 0.20, deduct: 258.46 },
      { min: 3876.93, max: 12923.08, rate: 0.25, deduct: 452.31 },
      { min: 12923.09, max: 25846.15, rate: 0.30, deduct: 1096.46 },
      { min: 25846.16, max: 38769.23, rate: 0.35, deduct: 2390.77 },
      { min: 38769.24, max: null, rate: 0.40, deduct: 4329.23 }
    ] as TaxBracket[]
  }
};
