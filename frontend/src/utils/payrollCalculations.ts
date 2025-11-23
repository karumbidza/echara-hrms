// Frontend PAYE calculation utility (mirrors backend logic)
// Zimbabwe 2025 tax rates

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  fixed: number;
}

const USD_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 600, rate: 0, fixed: 0 },           // $0-600/month - Tax Free
  { min: 600, max: 1200, rate: 0.20, fixed: 0 },     // $600-1200/month - 20%
  { min: 1200, max: 3000, rate: 0.25, fixed: 120 },  // $1200-3000/month - 25%
  { min: 3000, max: null, rate: 0.30, fixed: 570 }   // Above $3000/month - 30%
];

const ZWL_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 18000, rate: 0, fixed: 0 },              // ZWL 0-18000/month - Tax Free
  { min: 18000, max: 36000, rate: 0.20, fixed: 0 },       // ZWL 18000-36000/month - 20%
  { min: 36000, max: 90000, rate: 0.25, fixed: 3600 },    // ZWL 36000-90000/month - 25%
  { min: 90000, max: null, rate: 0.30, fixed: 17100 }     // Above ZWL 90000/month - 30%
];

/**
 * Calculate monthly PAYE for an employee
 */
export function calculatePAYE(taxableIncome: number, currency: string): number {
  const brackets = currency === 'USD' ? USD_TAX_BRACKETS : ZWL_TAX_BRACKETS;
  
  let paye = 0;
  
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) {
      break;
    }
    
    const taxableInBracket = bracket.max 
      ? Math.min(taxableIncome, bracket.max) - bracket.min
      : taxableIncome - bracket.min;
    
    paye = bracket.fixed + (taxableInBracket * bracket.rate);
  }
  
  return Math.max(0, paye);
}

/**
 * Calculate AIDS Levy (3% of PAYE)
 */
export function calculateAIDSLevy(paye: number): number {
  return paye * 0.03;
}

/**
 * Calculate NSSA Employee contribution (3% of gross, with cap)
 */
export function calculateNSSAEmployee(grossSalary: number, currency: string): number {
  const cap = currency === 'USD' ? 1000 : 30000; // Monthly caps
  const cappedSalary = Math.min(grossSalary, cap);
  return cappedSalary * 0.03;
}

/**
 * Calculate NSSA Employer contribution (3% of gross, with cap)
 */
export function calculateNSSAEmployer(grossSalary: number, currency: string): number {
  const cap = currency === 'USD' ? 1000 : 30000; // Monthly caps
  const cappedSalary = Math.min(grossSalary, cap);
  return cappedSalary * 0.03;
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
