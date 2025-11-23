import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TaxBracket {
  min: number;
  max: number | null;  // null means no upper limit
  fixed: number;       // Fixed tax amount
  rate: number;        // Marginal rate (e.g., 0.20 for 20%)
}

interface PAYECalculationInput {
  taxableIncome: number;
  currency: string;
  period: 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'FORTNIGHTLY';
  ytdTaxable: number;
  ytdPaye: number;
  periodDate: Date;
  tenantId: string;
}

interface PAYECalculationResult {
  payeThisPeriod: number;
  updatedYtdTaxable: number;
  updatedYtdPaye: number;
  effectiveTaxRate: number;
  appliedBracket?: TaxBracket;
  calculation: string;  // Human-readable calculation breakdown
}

/**
 * PAYE Calculation Engine
 * Implements progressive tax calculation with support for multiple currencies and periods
 */
export class PAYEEngine {
  
  /**
   * Main PAYE calculation function
   */
  static async calculatePAYE(input: PAYECalculationInput): Promise<PAYECalculationResult> {
    const { taxableIncome, currency, period, ytdTaxable, ytdPaye, periodDate, tenantId } = input;

    // Get active tax table for currency and date
    const taxTable = await this.getActiveTaxTable(tenantId, currency, periodDate);
    
    if (!taxTable) {
      throw new Error(`No active tax table found for ${currency} on ${periodDate.toISOString()}`);
    }

    const brackets = (taxTable.brackets as any) as TaxBracket[];

    // Annualize the income based on period
    const annualizedIncome = this.annualizeIncome(taxableIncome, period);
    const annualizedYTD = ytdTaxable + annualizedIncome;

    // Calculate annual tax
    const annualTax = this.calculateProgressiveTax(annualizedYTD, brackets);
    const previousAnnualTax = this.calculateProgressiveTax(ytdTaxable, brackets);

    // Tax for this period is the incremental difference
    const taxThisPeriod = annualTax - previousAnnualTax;

    // De-annualize to get period tax
    const payeThisPeriod = Math.max(0, this.deAnnualizeTax(taxThisPeriod, period));

    // Find which bracket applies
    const appliedBracket = this.findApplicableBracket(annualizedYTD, brackets);

    // Calculate effective tax rate
    const effectiveTaxRate = annualizedYTD > 0 ? (annualTax / annualizedYTD) * 100 : 0;

    // Generate calculation breakdown
    const calculation = this.generateCalculationBreakdown({
      taxableIncome,
      period,
      annualizedIncome,
      annualizedYTD,
      previousAnnualTax,
      annualTax,
      taxThisPeriod,
      payeThisPeriod,
      appliedBracket,
      effectiveTaxRate
    });

    return {
      payeThisPeriod: Math.round(payeThisPeriod * 100) / 100,  // Round to 2 decimal places
      updatedYtdTaxable: ytdTaxable + taxableIncome,
      updatedYtdPaye: ytdPaye + payeThisPeriod,
      effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
      appliedBracket,
      calculation
    };
  }

  /**
   * Calculate AIDS Levy (3% of PAYE in Zimbabwe)
   */
  static calculateAIDSLevy(paye: number): number {
    return Math.round(paye * 0.03 * 100) / 100;
  }

  /**
   * Get active tax table for given currency and date
   */
  private static async getActiveTaxTable(tenantId: string, currency: string, date: Date) {
    return await prisma.taxTable.findFirst({
      where: {
        tenantId,
        currency,
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: date } }
        ]
      },
      orderBy: { effectiveFrom: 'desc' }
    });
  }

  /**
   * Calculate progressive tax using brackets
   */
  private static calculateProgressiveTax(income: number, brackets: TaxBracket[]): number {
    let totalTax = 0;

    for (const bracket of brackets) {
      if (income <= bracket.min) {
        break;
      }

      const taxableInBracket = bracket.max !== null
        ? Math.min(income, bracket.max) - bracket.min
        : income - bracket.min;

      if (taxableInBracket > 0) {
        totalTax += bracket.fixed + (taxableInBracket * bracket.rate);
      }

      if (bracket.max !== null && income <= bracket.max) {
        break;
      }
    }

    return totalTax;
  }

  /**
   * Find which tax bracket applies to the income
   */
  private static findApplicableBracket(income: number, brackets: TaxBracket[]): TaxBracket | undefined {
    for (const bracket of brackets) {
      if (income >= bracket.min && (bracket.max === null || income < bracket.max)) {
        return bracket;
      }
    }
    return brackets[brackets.length - 1];  // Return highest bracket if above all
  }

  /**
   * Annualize income based on pay period
   */
  private static annualizeIncome(income: number, period: string): number {
    const multipliers: { [key: string]: number } = {
      'MONTHLY': 12,
      'FORTNIGHTLY': 26,
      'WEEKLY': 52,
      'DAILY': 260  // Assuming 260 working days per year
    };

    return income * (multipliers[period] || 12);
  }

  /**
   * De-annualize tax back to period amount
   */
  private static deAnnualizeTax(annualTax: number, period: string): number {
    const divisors: { [key: string]: number } = {
      'MONTHLY': 12,
      'FORTNIGHTLY': 26,
      'WEEKLY': 52,
      'DAILY': 260
    };

    return annualTax / (divisors[period] || 12);
  }

  /**
   * Generate human-readable calculation breakdown
   */
  private static generateCalculationBreakdown(data: any): string {
    return `
PAYE Calculation Breakdown:
---------------------------
Period Income: ${data.taxableIncome.toFixed(2)}
Pay Period: ${data.period}
Annualized Income: ${data.annualizedIncome.toFixed(2)}
YTD Annualized Total: ${data.annualizedYTD.toFixed(2)}

Previous Annual Tax: ${data.previousAnnualTax.toFixed(2)}
New Annual Tax: ${data.annualTax.toFixed(2)}
Incremental Tax: ${data.taxThisPeriod.toFixed(2)}

PAYE This Period: ${data.payeThisPeriod.toFixed(2)}
Effective Tax Rate: ${data.effectiveTaxRate.toFixed(2)}%

Applied Bracket: ${data.appliedBracket ? `${data.appliedBracket.min} - ${data.appliedBracket.max || '∞'} @ ${(data.appliedBracket.rate * 100).toFixed(0)}%` : 'None'}
`.trim();
  }
}
