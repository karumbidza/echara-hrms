// Frontend PAYE calculation utility (mirrors backend 2025 ZIMRA logic)
// Zimbabwe 2025 tax rates using DEDUCT METHOD

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  deduct: number;
}

const USD_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 100, rate: 0, deduct: 0 },           // $0-100/month - Tax Free
  { min: 100.01, max: 300, rate: 0.20, deduct: 20 },     // $100-300/month - 20%
  { min: 300.01, max: 1000, rate: 0.25, deduct: 35 },  // $300-1000/month - 25%
  { min: 1000.01, max: 2000, rate: 0.30, deduct: 85 },   // $1000-2000/month - 30%
  { min: 2000.01, max: 3000, rate: 0.35, deduct: 185 },  // $2000-3000/month - 35%
  { min: 3000.01, max: null, rate: 0.40, deduct: 335 }   // Above $3000/month - 40%
];

const ZWL_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 2800, rate: 0, deduct: 0 },              // ZWL 0-2800/month - Tax Free
  { min: 2800.01, max: 8400, rate: 0.20, deduct: 560 },       // ZWL 2800-8400/month - 20%
  { min: 8400.01, max: 28000, rate: 0.25, deduct: 980 },    // ZWL 8400-28000/month - 25%
  { min: 28000.01, max: 56000, rate: 0.30, deduct: 2380 },     // ZWL 28000-56000/month - 30%
  { min: 56000.01, max: 84000, rate: 0.35, deduct: 5180 },     // ZWL 56000-84000/month - 35%
  { min: 84000.01, max: null, rate: 0.40, deduct: 9380 }     // Above ZWL 84000/month - 40%
];

/**
 * Calculate monthly PAYE using DEDUCT METHOD
 * Formula: Tax = (Taxable Income × Rate) - Deduct
 */
export function calculatePAYE(taxableIncome: number, currency: string): number {
  const brackets = currency === 'USD' ? USD_TAX_BRACKETS : ZWL_TAX_BRACKETS;
  
  let paye = 0;
  let applicableBracket: TaxBracket | null = null;

  // Find the applicable bracket (check from highest to lowest)
  for (let i = brackets.length - 1; i >= 0; i--) {
    const bracket = brackets[i];
    if (taxableIncome > bracket.min) {
      if (bracket.max === null || taxableIncome <= bracket.max) {
        applicableBracket = bracket;
        break;
      }
    }
  }

  if (applicableBracket) {
    // Apply formula: (Taxable Income × Rate) - Deduct
    paye = (taxableIncome * applicableBracket.rate) - applicableBracket.deduct;
    paye = Math.max(0, paye); // Ensure tax is not negative
  }
  
  return paye;
}

/**
 * Calculate AIDS Levy (3% of PAYE)
 */
export function calculateAIDSLevy(paye: number): number {
  return paye * 0.03;
}

/**
 * Calculate NSSA Employee contribution (4.5% of gross, with cap)
 */
export function calculateNSSAEmployee(grossSalary: number, currency: string): number {
  const cap = currency === 'USD' ? 1000 : 30000; // Monthly caps
  const cappedSalary = Math.min(grossSalary, cap);
  return cappedSalary * 0.045; // 4.5%
}

/**
 * Calculate NSSA Employer contribution (4.5% of gross, with cap)
 */
export function calculateNSSAEmployer(grossSalary: number, currency: string): number {
  const cap = currency === 'USD' ? 1000 : 30000; // Monthly caps
  const cappedSalary = Math.min(grossSalary, cap);
  return cappedSalary * 0.045; // 4.5%
}

/**
 * Calculate complete payroll breakdown
 */
export interface PayrollCalculation {
  grossEarnings: number;
  preTaxDeductions: number;
  taxableIncome: number;
  paye: number;
  aidsLevy: number;
  nssaEmployee: number;
  nssaEmployer: number;
  postTaxDeductions: number;
  totalDeductions: number;
  netPay: number;
}

export function calculatePayroll(
  basicSalary: number,
  allowances: number,
  bonuses: number,
  overtime: number,
  pensionContribution: number,
  medicalAid: number,
  loanRepayment: number,
  salaryAdvance: number,
  otherDeductions: number,
  currency: string
): PayrollCalculation {
  // Step 1: Calculate Gross Earnings
  const grossEarnings = basicSalary + allowances + bonuses + overtime;
  
  // Step 2: Pre-tax Deductions
  const preTaxDeductions = pensionContribution + medicalAid;
  
  // Step 3: Taxable Income
  const taxableIncome = grossEarnings - preTaxDeductions;
  
  // Step 4: Calculate PAYE
  const paye = calculatePAYE(taxableIncome, currency);
  
  // Step 5: Calculate AIDS Levy
  const aidsLevy = calculateAIDSLevy(paye);
  
  // Step 6: Calculate NSSA
  const nssaEmployee = calculateNSSAEmployee(grossEarnings, currency);
  const nssaEmployer = calculateNSSAEmployer(grossEarnings, currency);
  
  // Step 7: Post-tax Deductions
  const postTaxDeductions = loanRepayment + salaryAdvance + otherDeductions;
  
  // Step 8: Calculate Net Pay
  const totalDeductions = paye + aidsLevy + nssaEmployee + postTaxDeductions;
  const netPay = grossEarnings - totalDeductions;
  
  return {
    grossEarnings,
    preTaxDeductions,
    taxableIncome,
    paye,
    aidsLevy,
    nssaEmployee,
    nssaEmployer,
    postTaxDeductions,
    totalDeductions,
    netPay
  };
}
