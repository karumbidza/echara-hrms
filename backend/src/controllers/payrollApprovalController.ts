import { Request, Response } from 'express';
import { PrismaClient, PayrollStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get pending payroll runs awaiting approval
 */
export const getPendingPayrolls = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const pendingPayrolls = await prisma.payrollRun.findMany({
      where: {
        tenantId: user.tenantId,
        status: PayrollStatus.PENDING,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        submitter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        payslips: {
          select: {
            id: true,
            netSalary: true,
            employee: {
              select: {
                employeeNumber: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    res.json({ payrollRuns: pendingPayrolls });
  } catch (error) {
    console.error('Error fetching pending payrolls:', error);
    res.status(500).json({ error: 'Failed to fetch pending payrolls' });
  }
};

/**
 * Submit payroll run for approval
 */
export const submitForApproval = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Verify payroll exists and belongs to tenant
    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!payrollRun) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    // Only DRAFT payrolls can be submitted
    if (payrollRun.status !== PayrollStatus.DRAFT) {
      return res.status(400).json({ 
        error: `Cannot submit payroll with status ${payrollRun.status}` 
      });
    }

    // Update status to PENDING
    const updated = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: PayrollStatus.PENDING,
        submittedAt: new Date(),
        submittedBy: user.id,
      },
      include: {
        submitter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json({ 
      message: 'Payroll submitted for approval',
      payrollRun: updated 
    });
  } catch (error) {
    console.error('Error submitting payroll:', error);
    res.status(500).json({ error: 'Failed to submit payroll for approval' });
  }
};

/**
 * Approve payroll run (GM or Finance Manager only)
 */
export const approvePayroll = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check user has approval permissions
    if (!['GENERAL_MANAGER', 'FINANCE_MANAGER', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ 
        error: 'Only General Manager or Finance Manager can approve payroll' 
      });
    }

    // Verify payroll exists and is in PENDING status
    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        status: PayrollStatus.PENDING,
      },
    });

    if (!payrollRun) {
      return res.status(404).json({ 
        error: 'Payroll run not found or not pending approval' 
      });
    }

    // Update status to APPROVED
    const updated = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: PayrollStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: user.id,
      },
      include: {
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        payslips: {
          select: {
            id: true,
            netSalary: true,
            employee: {
              select: {
                employeeNumber: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.json({ 
      message: 'Payroll approved successfully',
      payrollRun: updated 
    });
  } catch (error) {
    console.error('Error approving payroll:', error);
    res.status(500).json({ error: 'Failed to approve payroll' });
  }
};

/**
 * Reject payroll run (GM or Finance Manager only)
 */
export const rejectPayroll = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { reason } = req.body;

    // Check user has approval permissions
    if (!['GENERAL_MANAGER', 'FINANCE_MANAGER', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ 
        error: 'Only General Manager or Finance Manager can reject payroll' 
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Verify payroll exists and is in PENDING status
    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        status: PayrollStatus.PENDING,
      },
    });

    if (!payrollRun) {
      return res.status(404).json({ 
        error: 'Payroll run not found or not pending approval' 
      });
    }

    // Update status to REJECTED
    const updated = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: PayrollStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        submitter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json({ 
      message: 'Payroll rejected',
      payrollRun: updated 
    });
  } catch (error) {
    console.error('Error rejecting payroll:', error);
    res.status(500).json({ error: 'Failed to reject payroll' });
  }
};

/**
 * Get payroll approval history/status
 */
export const getPayrollStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        submitter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        payslips: {
          select: {
            id: true,
            netSalary: true,
            grossSalary: true,
            totalDeductions: true,
            employee: {
              select: {
                employeeNumber: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!payrollRun) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }

    res.json({ payrollRun });
  } catch (error) {
    console.error('Error fetching payroll status:', error);
    res.status(500).json({ error: 'Failed to fetch payroll status' });
  }
};
