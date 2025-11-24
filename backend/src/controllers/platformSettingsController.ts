import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    tenantId?: string;
    role: string;
  };
}

// Get platform settings (Super Admin only)
export const getPlatformSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    let settings = await prisma.platformSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          taxYear: 2025,
          taxBrackets: [
            { min: 0, max: 120000, rate: 0, deduction: 0 },
            { min: 120001, max: 360000, rate: 20, deduction: 24000 },
            { min: 360001, max: 720000, rate: 25, deduction: 42000 },
            { min: 720001, max: 1200000, rate: 30, deduction: 78000 },
            { min: 1200001, max: 9999999999, rate: 35, deduction: 138000 }
          ],
          aidsLevyRate: 3.0,
          nssaEmployeeRate: 3.0,
          nssaEmployerRate: 3.5,
          nssaLowerLimit: 0,
          nssaUpperLimit: 1000,
          minimumWage: 100
        }
      });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
};

// Update platform settings (Super Admin only)
export const updatePlatformSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const {
      taxYear,
      taxBrackets,
      aidsLevyRate,
      nssaEmployeeRate,
      nssaEmployerRate,
      nssaLowerLimit,
      nssaUpperLimit,
      minimumWage
    } = req.body;

    // Validate tax brackets
    if (taxBrackets && !Array.isArray(taxBrackets)) {
      return res.status(400).json({ error: 'Tax brackets must be an array' });
    }

    // Get current settings or create
    let settings = await prisma.platformSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (settings) {
      // Update existing
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: {
          taxYear: taxYear ?? settings.taxYear,
          taxBrackets: taxBrackets ?? settings.taxBrackets,
          aidsLevyRate: aidsLevyRate ?? settings.aidsLevyRate,
          nssaEmployeeRate: nssaEmployeeRate ?? settings.nssaEmployeeRate,
          nssaEmployerRate: nssaEmployerRate ?? settings.nssaEmployerRate,
          nssaLowerLimit: nssaLowerLimit ?? settings.nssaLowerLimit,
          nssaUpperLimit: nssaUpperLimit ?? settings.nssaUpperLimit,
          minimumWage: minimumWage ?? settings.minimumWage,
          updatedBy: req.user.userId
        }
      });
    } else {
      // Create new
      settings = await prisma.platformSettings.create({
        data: {
          taxYear: taxYear ?? 2025,
          taxBrackets: taxBrackets ?? [],
          aidsLevyRate: aidsLevyRate ?? 3.0,
          nssaEmployeeRate: nssaEmployeeRate ?? 3.0,
          nssaEmployerRate: nssaEmployerRate ?? 3.5,
          nssaLowerLimit: nssaLowerLimit ?? 0,
          nssaUpperLimit: nssaUpperLimit ?? 1000,
          minimumWage: minimumWage ?? 100,
          updatedBy: req.user.userId
        }
      });
    }

    res.json({ 
      message: 'Platform settings updated successfully', 
      settings 
    });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    res.status(500).json({ error: 'Failed to update platform settings' });
  }
};

// Get settings history (audit trail)
export const getSettingsHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const history = await prisma.platformSettings.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    res.json({ history });
  } catch (error) {
    console.error('Error fetching settings history:', error);
    res.status(500).json({ error: 'Failed to fetch settings history' });
  }
};
