import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CurrencyConversionInput {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  date: Date;
  tenantId: string;
}

/**
 * Currency Conversion Utility
 * Converts amounts between currencies using historical rates
 */
export class CurrencyConverter {
  
  /**
   * Convert amount from one currency to another
   */
  static async convert(input: CurrencyConversionInput): Promise<number> {
    const { amount, fromCurrency, toCurrency, date, tenantId } = input;

    // If same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Get exchange rate
    const rate = await this.getExchangeRate(tenantId, fromCurrency, toCurrency, date);
    
    if (!rate) {
      throw new Error(`No exchange rate found for ${fromCurrency} to ${toCurrency} on ${date.toISOString()}`);
    }

    return Math.round(amount * rate.rate * 100) / 100;
  }

  /**
   * Get exchange rate for a specific date
   */
  private static async getExchangeRate(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string,
    date: Date
  ) {
    return await prisma.currencyRate.findFirst({
      where: {
        tenantId,
        fromCurrency,
        toCurrency,
        effectiveDate: { lte: date }
      },
      orderBy: { effectiveDate: 'desc' }
    });
  }

  /**
   * Get latest exchange rate
   */
  static async getLatestRate(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string
  ) {
    return await prisma.currencyRate.findFirst({
      where: {
        tenantId,
        fromCurrency,
        toCurrency
      },
      orderBy: { effectiveDate: 'desc' }
    });
  }
}
