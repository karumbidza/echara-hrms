import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Get all pending contract notifications for a tenant
 */
export const getContractNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const notifications = await prisma.contractNotification.findMany({
      where: {
        tenantId,
        acknowledged: false
      },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            contractType: true,
            contractEndDate: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        contractEndDate: 'asc'
      }
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Get contract notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch contract notifications' });
  }
};

/**
 * Check for expiring contracts and create notifications
 * This should be run daily via a cron job
 */
export const checkExpiringContracts = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);

    // Find employees with contracts expiring in the next 14 days
    const expiringContracts = await prisma.employee.findMany({
      where: {
        tenantId,
        isActive: true,
        contractType: 'FIXED_TERM',
        contractEndDate: {
          gte: today,
          lte: twoWeeksFromNow
        },
        noticeGiven: false // Only notify if notice hasn't been given
      },
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        contractEndDate: true,
        email: true
      }
    });

    let notificationsCreated = 0;

    for (const employee of expiringContracts) {
      if (!employee.contractEndDate) continue;

      // Check if notification already exists
      const existingNotification = await prisma.contractNotification.findFirst({
        where: {
          employeeId: employee.id,
          contractEndDate: employee.contractEndDate,
          tenantId
        }
      });

      if (!existingNotification) {
        const daysUntilExpiry = Math.ceil(
          (employee.contractEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        await prisma.contractNotification.create({
          data: {
            employeeId: employee.id,
            tenantId,
            contractEndDate: employee.contractEndDate,
            notificationDate: today,
            daysBeforeExpiry: daysUntilExpiry,
            type: 'CONTRACT_EXPIRY'
          }
        });

        notificationsCreated++;
      }
    }

    res.json({
      message: `Contract check completed`,
      expiringCount: expiringContracts.length,
      notificationsCreated
    });
  } catch (error) {
    console.error('Check expiring contracts error:', error);
    res.status(500).json({ error: 'Failed to check expiring contracts' });
  }
};

/**
 * Acknowledge a contract notification and record decision
 */
export const acknowledgeContractNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { renewalDecision, notes } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    if (!renewalDecision || !['RENEW', 'NOT_RENEW'].includes(renewalDecision)) {
      return res.status(400).json({ error: 'Valid renewal decision required (RENEW or NOT_RENEW)' });
    }

    // Find the notification
    const notification = await prisma.contractNotification.findFirst({
      where: { id, tenantId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Update notification
    const updatedNotification = await prisma.contractNotification.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        actionTaken: renewalDecision,
        actionTakenAt: new Date(),
        actionNotes: notes
      }
    });

    // Update employee record
    await prisma.employee.update({
      where: { id: notification.employeeId },
      data: {
        noticeGiven: true,
        noticeGivenDate: new Date(),
        renewalDecision,
        renewalDecisionDate: new Date(),
        renewalNotes: notes
      }
    });

    res.json({
      message: 'Notification acknowledged and employee updated',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Acknowledge notification error:', error);
    res.status(500).json({ error: 'Failed to acknowledge notification' });
  }
};

/**
 * Get contract expiry dashboard summary
 */
export const getContractSummary = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setDate(today.getDate() + 30);

    // Count contracts expiring in next 30 days
    const expiringCount = await prisma.employee.count({
      where: {
        tenantId,
        isActive: true,
        contractType: 'FIXED_TERM',
        contractEndDate: {
          gte: today,
          lte: oneMonthFromNow
        }
      }
    });

    // Count pending notifications
    const pendingNotifications = await prisma.contractNotification.count({
      where: {
        tenantId,
        acknowledged: false
      }
    });

    // Count employees on fixed term contracts
    const fixedTermCount = await prisma.employee.count({
      where: {
        tenantId,
        isActive: true,
        contractType: 'FIXED_TERM'
      }
    });

    // Count employees on probation
    const probationCount = await prisma.employee.count({
      where: {
        tenantId,
        isActive: true,
        contractType: 'PROBATION'
      }
    });

    res.json({
      summary: {
        expiringInNext30Days: expiringCount,
        pendingNotifications,
        totalFixedTerm: fixedTermCount,
        totalOnProbation: probationCount
      }
    });
  } catch (error) {
    console.error('Get contract summary error:', error);
    res.status(500).json({ error: 'Failed to fetch contract summary' });
  }
};
