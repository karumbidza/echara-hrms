import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate accrued leave days based on hire date
 * Leave accumulates at monthly rate (e.g., 1.83 days/month for 22 annual days)
 */
export const calculateAccruedLeave = (
  hireDate: Date,
  annualLeaveDays: number,
  currentDate: Date = new Date()
): number => {
  const monthlyAccrual = annualLeaveDays / 12;
  const currentYear = currentDate.getFullYear();
  
  // If hired this year, calculate prorated leave
  if (hireDate.getFullYear() === currentYear) {
    const monthsWorked = Math.max(0, 
      (currentDate.getFullYear() - hireDate.getFullYear()) * 12 + 
      (currentDate.getMonth() - hireDate.getMonth())
    );
    
    // Add partial month if more than 15 days into current month
    const daysIntoMonth = currentDate.getDate();
    const additionalMonthFraction = daysIntoMonth >= 15 ? 1 : 0;
    
    return (monthsWorked + additionalMonthFraction) * monthlyAccrual;
  }
  
  // If hired in previous year, full annual entitlement
  return annualLeaveDays;
};

/**
 * Calculate leave days deducted from monthly payroll
 * Based on defaultMonthlyLeaveRate field in employee record
 */
export const calculateMonthlyLeaveDeduction = (
  monthlyLeaveRate: number
): number => {
  // Monthly leave rate is the amount deducted each month
  // Convert from salary deduction to days (assume 1 day = 1/22 of monthly leave allowance)
  // This is configurable per employee
  return monthlyLeaveRate;
};

/**
 * Update leave balance for an employee
 * Call this after each payroll run to deduct monthly leave usage
 */
export const updateLeaveBalance = async (
  employeeId: string,
  year: number,
  leaveDaysUsed: number
): Promise<void> => {
  try {
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: { employeeId, year }
    });

    if (!leaveBalance) {
      console.warn(`No leave balance found for employee ${employeeId} in year ${year}`);
      return;
    }

    const newUsed = Number(leaveBalance.annualUsed) + leaveDaysUsed;
    const newBalance = Number(leaveBalance.annualTotal) - newUsed;

    await prisma.leaveBalance.update({
      where: { id: leaveBalance.id },
      data: {
        annualUsed: newUsed,
        annualBalance: Math.max(0, newBalance) // Don't go negative
      }
    });

    console.log(`✅ Updated leave balance for employee ${employeeId}: -${leaveDaysUsed} days, new balance: ${newBalance.toFixed(1)}`);
  } catch (error) {
    console.error('Error updating leave balance:', error);
    throw error;
  }
};

/**
 * Recalculate leave balance based on hire date and leave policy
 * Useful for correcting balances or initializing for existing employees
 */
export const recalculateLeaveBalance = async (
  employeeId: string,
  tenantId: string
): Promise<void> => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        hireDate: true,
        firstName: true,
        lastName: true
      }
    });

    if (!employee || !employee.hireDate) {
      console.warn(`Employee ${employeeId} not found or has no hire date`);
      return;
    }

    const policy = await prisma.leavePolicy.findUnique({
      where: { tenantId }
    });

    if (!policy) {
      console.warn(`No leave policy found for tenant ${tenantId}`);
      return;
    }

    const currentYear = new Date().getFullYear();
    const accruedLeave = calculateAccruedLeave(
      new Date(employee.hireDate),
      policy.annualLeaveDays,
      new Date()
    );

    // Get existing balance to preserve used days
    const existingBalance = await prisma.leaveBalance.findFirst({
      where: { employeeId, year: currentYear }
    });

    const usedDays = existingBalance ? Number(existingBalance.annualUsed) : 0;
    const newBalance = Math.max(0, accruedLeave - usedDays);

    if (existingBalance) {
      await prisma.leaveBalance.update({
        where: { id: existingBalance.id },
        data: {
          annualTotal: policy.annualLeaveDays,
          annualBalance: newBalance
        }
      });
      console.log(`✅ Recalculated leave for ${employee.firstName} ${employee.lastName}: ${accruedLeave.toFixed(1)} accrued, ${usedDays} used, ${newBalance.toFixed(1)} remaining`);
    } else {
      await prisma.leaveBalance.create({
        data: {
          employeeId,
          year: currentYear,
          annualTotal: policy.annualLeaveDays,
          annualUsed: 0,
          annualBalance: accruedLeave,
          annualCarryOver: 0,
          sickUsed: 0,
          maternityUsed: 0,
          paternityUsed: 0
        }
      });
      console.log(`✅ Created leave balance for ${employee.firstName} ${employee.lastName}: ${accruedLeave.toFixed(1)} days`);
    }
  } catch (error) {
    console.error('Error recalculating leave balance:', error);
    throw error;
  }
};

/**
 * Bulk recalculate leave balances for all employees in a tenant
 */
export const recalculateAllLeaveBalances = async (tenantId: string): Promise<void> => {
  try {
    const employees = await prisma.employee.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, firstName: true, lastName: true }
    });

    console.log(`🔄 Recalculating leave balances for ${employees.length} employees...`);

    for (const employee of employees) {
      await recalculateLeaveBalance(employee.id, tenantId);
    }

    console.log(`✅ Completed recalculation for all employees in tenant ${tenantId}`);
  } catch (error) {
    console.error('Error bulk recalculating leave balances:', error);
    throw error;
  }
};
