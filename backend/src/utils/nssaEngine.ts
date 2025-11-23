import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NSSACalculationInput {
  grossSalary: number;
  currency: string;
  periodDate: Date;
  tenantId: string;
}

interface NSSACalculationResult {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  cappedSalary: number;
  effectiveEmployeeRate: number;
  effectiveEmployerRate: number;
  calculation: string;
}

/**
 * NSSA Calculation Engine
 * Implements Zimbabwe NSSA (National Social Security Authority) calculations
 */
export class NSSAEngine {
  
  /**
   * Main NSSA calculation function
   */
  static async calculateNSSA(input: NSSACalculationInput): Promise<NSSACalculationResult> {
    const { grossSalary, currency, periodDate, tenantId } = input;

    // Get active NSSA rates
    const nssaRate = await this.getActiveNSSARate(tenantId, currency, periodDate);
    
    if (!nssaRate) {
      throw new Error(`No active NSSA rate found for ${currency} on ${periodDate.toISOString()}`);
    }

    // Apply salary cap if configured
    const cappedSalary = nssaRate.maxCap && grossSalary > nssaRate.maxCap
      ? nssaRate.maxCap
      : grossSalary;

    // Calculate contributions
    const employeeContribution = Math.round(cappedSalary * nssaRate.employeeRate * 100) / 100;
    const employerContribution = Math.round(cappedSalary * nssaRate.employerRate * 100) / 100;
    const totalContribution = employeeContribution + employerContribution;

    // Calculate effective rates (actual rate after capping)
    const effectiveEmployeeRate = grossSalary > 0 ? (employeeContribution / grossSalary) * 100 : 0;
    const effectiveEmployerRate = grossSalary > 0 ? (employerContribution / grossSalary) * 100 : 0;

    // Generate calculation breakdown
    const calculation = this.generateCalculationBreakdown({
      grossSalary,
      cappedSalary,
      employeeRate: nssaRate.employeeRate,
      employerRate: nssaRate.employerRate,
      maxCap: nssaRate.maxCap,
      employeeContribution,
      employerContribution,
      totalContribution,
      effectiveEmployeeRate,
      effectiveEmployerRate
    });

    return {
      employeeContribution,
      employerContribution,
      totalContribution,
      cappedSalary,
      effectiveEmployeeRate: Math.round(effectiveEmployeeRate * 100) / 100,
      effectiveEmployerRate: Math.round(effectiveEmployerRate * 100) / 100,
      calculation
    };
  }

  /**
   * Get active NSSA rate for given currency and date
   */
  private static async getActiveNSSARate(tenantId: string, currency: string, date: Date) {
    return await prisma.nssaRate.findFirst({
      where: {
        tenantId,
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
   * Generate human-readable calculation breakdown
   */
  private static generateCalculationBreakdown(data: any): string {
    return `
NSSA Calculation Breakdown:
---------------------------
Gross Salary: ${data.grossSalary.toFixed(2)}
${data.maxCap && data.grossSalary > data.maxCap ? `Salary Cap Applied: ${data.maxCap.toFixed(2)}` : ''}
Contributory Salary: ${data.cappedSalary.toFixed(2)}

Employee Rate: ${(data.employeeRate * 100).toFixed(2)}%
Employee Contribution: ${data.employeeContribution.toFixed(2)}

Employer Rate: ${(data.employerRate * 100).toFixed(2)}%
Employer Contribution: ${data.employerContribution.toFixed(2)}

Total NSSA Contribution: ${data.totalContribution.toFixed(2)}

Effective Employee Rate: ${data.effectiveEmployeeRate.toFixed(2)}%
Effective Employer Rate: ${data.effectiveEmployerRate.toFixed(2)}%
`.trim();
  }
}
