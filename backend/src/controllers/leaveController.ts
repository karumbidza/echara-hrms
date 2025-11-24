import { Response } from 'express';
import { PrismaClient, LeaveStatus, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Get or create leave policy for tenant (Admin only)
 */
export const getLeavePolicy = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    let policy = await prisma.leavePolicy.findUnique({
      where: { tenantId }
    });

    // Create default policy if doesn't exist
    if (!policy) {
      policy = await prisma.leavePolicy.create({
        data: {
          tenantId,
          annualLeaveDays: 22,
          carryOverDays: 5,
          sickLeaveDaysBeforeCert: 2,
          maternityLeaveDays: 98,
          paternityLeaveDays: 7
        }
      });
    }

    res.json({ policy });
  } catch (error) {
    console.error('Get leave policy error:', error);
    res.status(500).json({ error: 'Failed to fetch leave policy' });
  }
};

/**
 * Update leave policy (Admin only)
 */
export const updateLeavePolicy = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { annualLeaveDays, carryOverDays, sickLeaveDaysBeforeCert, maternityLeaveDays, paternityLeaveDays } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update leave policy' });
    }

    const policy = await prisma.leavePolicy.upsert({
      where: { tenantId },
      update: {
        annualLeaveDays,
        carryOverDays,
        sickLeaveDaysBeforeCert,
        maternityLeaveDays,
        paternityLeaveDays
      },
      create: {
        tenantId,
        annualLeaveDays,
        carryOverDays,
        sickLeaveDaysBeforeCert,
        maternityLeaveDays,
        paternityLeaveDays
      }
    });

    res.json({ message: 'Leave policy updated', policy });
  } catch (error) {
    console.error('Update leave policy error:', error);
    res.status(500).json({ error: 'Failed to update leave policy' });
  }
};

/**
 * Get leave balance for an employee
 */
export const getLeaveBalance = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get or create balance for the year
    let balance = await prisma.leaveBalance.findUnique({
      where: { 
        employeeId_year: { employeeId, year }
      }
    });

    if (!balance) {
      // Create initial balance for the year
      const policy = await prisma.leavePolicy.findUnique({
        where: { tenantId }
      });

      const annualTotal = policy?.annualLeaveDays || 22;

      balance = await prisma.leaveBalance.create({
        data: {
          employeeId,
          year,
          annualTotal: new Prisma.Decimal(annualTotal),
          annualUsed: new Prisma.Decimal(0),
          annualBalance: new Prisma.Decimal(annualTotal),
          annualCarryOver: new Prisma.Decimal(0),
          sickUsed: new Prisma.Decimal(0),
          maternityUsed: new Prisma.Decimal(0),
          paternityUsed: new Prisma.Decimal(0)
        }
      });
    }

    res.json({ balance });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
};

/**
 * Initialize leave balances for all employees (Admin only)
 */
export const initializeLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const year = parseInt(req.body.year) || new Date().getFullYear();

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can initialize leave balances' });
    }

    // Get policy
    const policy = await prisma.leavePolicy.findUnique({
      where: { tenantId }
    });

    const annualTotal = policy?.annualLeaveDays || 22;

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { tenantId, isActive: true }
    });

    let created = 0;
    let skipped = 0;

    for (const employee of employees) {
      const existing = await prisma.leaveBalance.findUnique({
        where: { employeeId_year: { employeeId: employee.id, year } }
      });

      if (!existing) {
        await prisma.leaveBalance.create({
          data: {
            employeeId: employee.id,
            year,
            annualTotal: new Prisma.Decimal(annualTotal),
            annualUsed: new Prisma.Decimal(0),
            annualBalance: new Prisma.Decimal(annualTotal),
            annualCarryOver: new Prisma.Decimal(0),
            sickUsed: new Prisma.Decimal(0),
            maternityUsed: new Prisma.Decimal(0),
            paternityUsed: new Prisma.Decimal(0)
          }
        });
        created++;
      } else {
        skipped++;
      }
    }

    res.json({ 
      message: `Leave balances initialized for ${year}`,
      created,
      skipped,
      total: employees.length
    });
  } catch (error) {
    console.error('Initialize leave balances error:', error);
    res.status(500).json({ error: 'Failed to initialize leave balances' });
  }
};

/**
 * Submit leave request
 */
export const submitLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { employeeId, leaveType, startDate, endDate, halfDay, reason, attachment } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Calculate working days (excluding weekends)
    const totalDays = calculateWorkingDays(new Date(startDate), new Date(endDate), halfDay);

    // Check if employee has sufficient balance for annual leave
    if (leaveType === 'ANNUAL') {
      const year = new Date(startDate).getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_year: { employeeId, year } }
      });

      if (!balance) {
        return res.status(400).json({ error: 'Leave balance not initialized for this year' });
      }

      if (parseFloat(balance.annualBalance.toString()) < totalDays) {
        return res.status(400).json({ 
          error: `Insufficient leave balance. Available: ${balance.annualBalance} days, Requested: ${totalDays} days` 
        });
      }
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        tenantId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: new Prisma.Decimal(totalDays),
        halfDay: halfDay || false,
        reason,
        attachment,
        status: LeaveStatus.PENDING
      },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      message: 'Leave request submitted successfully',
      leaveRequest 
    });
  } catch (error) {
    console.error('Submit leave request error:', error);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
};

/**
 * Get leave requests (filtered by role)
 */
export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { status, employeeId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    let whereClause: any = { tenantId };

    // Filter by status if provided
    if (status) {
      whereClause.status = status as LeaveStatus;
    }

    // If employee role, only show their own requests
    if (req.user?.role === 'EMPLOYEE') {
      // Find employee record for this user
      const employee = await prisma.employee.findFirst({
        where: { email: req.user.email, tenantId }
      });

      if (employee) {
        whereClause.employeeId = employee.id;
      }
    }

    // If specific employee requested
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        reviewer: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ leaveRequests });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

/**
 * Get single leave request
 */
export const getLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        reviewer: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json({ leaveRequest });
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({ error: 'Failed to fetch leave request' });
  }
};

/**
 * Approve leave request (Admin/Manager only)
 */
export const approveLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Authentication required' });
    }

    // Check permissions
    if (!['ADMIN', 'MANAGER'].includes(req.user?.role || '')) {
      return res.status(403).json({ error: 'Only admins and managers can approve leave' });
    }

    // Get leave request
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: { id, tenantId, status: LeaveStatus.PENDING }
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found or not pending' });
    }

    // Update leave request
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes
      },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviewer: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    // Deduct from leave balance if annual leave
    if (leaveRequest.leaveType === 'ANNUAL') {
      const year = leaveRequest.startDate.getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: { 
          employeeId_year: { 
            employeeId: leaveRequest.employeeId, 
            year 
          } 
        }
      });

      if (balance) {
        const newUsed = parseFloat(balance.annualUsed.toString()) + parseFloat(leaveRequest.totalDays.toString());
        const newBalance = parseFloat(balance.annualTotal.toString()) - newUsed;

        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            annualUsed: new Prisma.Decimal(newUsed),
            annualBalance: new Prisma.Decimal(newBalance)
          }
        });
      }
    } else if (leaveRequest.leaveType === 'SICK') {
      const year = leaveRequest.startDate.getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: { 
          employeeId_year: { 
            employeeId: leaveRequest.employeeId, 
            year 
          } 
        }
      });

      if (balance) {
        const newSickUsed = parseFloat(balance.sickUsed.toString()) + parseFloat(leaveRequest.totalDays.toString());
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            sickUsed: new Prisma.Decimal(newSickUsed)
          }
        });
      }
    }

    res.json({ 
      message: 'Leave request approved',
      leaveRequest: updated 
    });
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
};

/**
 * Reject leave request (Admin/Manager only)
 */
export const rejectLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Authentication required' });
    }

    // Check permissions
    if (!['ADMIN', 'MANAGER'].includes(req.user?.role || '')) {
      return res.status(403).json({ error: 'Only admins and managers can reject leave' });
    }

    if (!reviewNotes || reviewNotes.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get leave request
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: { id, tenantId, status: LeaveStatus.PENDING }
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found or not pending' });
    }

    // Update leave request
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes
      },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviewer: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      message: 'Leave request rejected',
      leaveRequest: updated 
    });
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
};

/**
 * Cancel leave request (Employee can cancel their own pending requests)
 */
export const cancelLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Authentication required' });
    }

    // Get leave request
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: { id, tenantId, status: LeaveStatus.PENDING },
      include: {
        employee: true
      }
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found or not pending' });
    }

    // Employee can only cancel their own requests
    if (req.user?.role === 'EMPLOYEE' && leaveRequest.employee.email !== req.user.email) {
      return res.status(403).json({ error: 'You can only cancel your own leave requests' });
    }

    // Update leave request
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.CANCELLED
      }
    });

    res.json({ 
      message: 'Leave request cancelled',
      leaveRequest: updated 
    });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
};

/**
 * Get pending leave approvals count (for managers/admins)
 */
export const getPendingCount = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const count = await prisma.leaveRequest.count({
      where: {
        tenantId,
        status: LeaveStatus.PENDING
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ error: 'Failed to fetch pending count' });
  }
};

/**
 * Helper function to calculate working days between two dates
 * Excludes weekends (Saturday, Sunday)
 */
function calculateWorkingDays(startDate: Date, endDate: Date, halfDay: boolean = false): number {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return halfDay ? count - 0.5 : count;
}
