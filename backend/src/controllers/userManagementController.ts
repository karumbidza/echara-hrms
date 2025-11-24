import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

// Get all users for a tenant (Super Admin only)
export const getTenantUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { tenantId } = req.params;

    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching tenant users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role (Super Admin only)
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['ADMIN', 'PAYROLL_OFFICER', 'MANAGER', 'EMPLOYEE'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Don't allow changing super admin role
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot modify super admin role' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'USER_ROLE_UPDATED',
        table: 'User',
        recordId: userId,
        userId: req.user.id,
        tenantId: user?.tenantId || '',
        oldValues: { role: user?.role },
        newValues: { role: role, updatedBy: 'SUPER_ADMIN' }
      }
    });

    res.json({ 
      message: 'User role updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Reset user password (Super Admin only)
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Don't allow resetting super admin password
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot reset super admin password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET',
        table: 'User',
        recordId: userId,
        userId: req.user.id,
        tenantId: user?.tenantId || '',
        newValues: {
          resetBy: 'SUPER_ADMIN',
          userEmail: user?.email
        }
      }
    });

    res.json({ 
      message: 'Password reset successfully',
      email: user?.email
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Generate temporary password (Super Admin only)
export const generateTemporaryPassword = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot reset super admin password' });
    }

    // Generate random password
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'TEMP_PASSWORD_GENERATED',
        table: 'User',
        recordId: userId,
        userId: req.user.id,
        tenantId: user.tenantId || '',
        newValues: {
          generatedBy: 'SUPER_ADMIN',
          userEmail: user.email
        }
      }
    });

    res.json({ 
      message: 'Temporary password generated',
      email: user.email,
      tempPassword,
      note: 'Share this password securely with the user. They should change it on first login.'
    });
  } catch (error) {
    console.error('Error generating temp password:', error);
    res.status(500).json({ error: 'Failed to generate temporary password' });
  }
};

// Suspend/Activate user (Super Admin only)
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    // Don't allow suspending super admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot suspend super admin' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
        table: 'User',
        recordId: userId,
        userId: req.user.id,
        tenantId: user?.tenantId || '',
        newValues: {
          actionBy: 'SUPER_ADMIN',
          userEmail: user?.email,
          isActive
        }
      }
    });

    res.json({ 
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Create user for tenant (Super Admin only)
export const createTenantUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { tenantId } = req.params;
    const { email, fullName, role, sendPassword } = req.body;

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate temporary password
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        role: role || 'ADMIN',
        password: hashedPassword,
        tenantId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'USER_CREATED',
        table: 'User',
        recordId: user.id,
        userId: req.user.id,
        tenantId,
        newValues: {
          createdBy: 'SUPER_ADMIN',
          userEmail: email,
          userRole: role || 'ADMIN'
        }
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user,
      tempPassword: sendPassword ? tempPassword : undefined,
      note: 'Share the temporary password securely with the user.'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};
