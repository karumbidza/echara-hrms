import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

// Get all tenants with stats
export const getAllTenants = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is super admin
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            payrollRuns: true
          }
        },
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

// Get platform stats
export const getPlatformStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const [
      totalTenants,
      activeTenants,
      trialTenants,
      totalEmployees,
      totalPayrollRuns,
      activeSubscriptions
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      prisma.tenant.count({ where: { subscriptionStatus: 'TRIAL' } }),
      prisma.employee.count(),
      prisma.payrollRun.count(),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true }
      })
    ]);

    // Calculate revenue
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.currency === 'USD' ? sub.amountUSD : 0);
    }, 0);

    res.json({
      totalTenants,
      activeTenants,
      trialTenants,
      totalRevenue,
      totalEmployees,
      totalPayrollRuns
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Get specific tenant details
export const getTenantDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            payrollRuns: true,
            departments: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            isActive: true,
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            }
          }
        },
        subscriptions: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                features: true,
                maxEmployees: true,
                maxUsers: true
              }
            },
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        payrollRuns: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            status: true,
            totalGross: true,
            totalNet: true,
            runDate: true
          },
          orderBy: { runDate: 'desc' },
          take: 10
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant });
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    res.status(500).json({ error: 'Failed to fetch tenant details' });
  }
};

// Update tenant subscription status
export const updateTenantStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;
    const { subscriptionStatus } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { subscriptionStatus }
    });

    res.json({ message: 'Tenant status updated', tenant });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
};

// Extend trial period
export const extendTrial = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;
    const { days } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const currentTrialEnd = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : new Date();
    const newTrialEnd = new Date(currentTrialEnd);
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: { trialEndsAt: newTrialEnd }
    });

    res.json({ message: `Trial extended by ${days} days`, tenant: updatedTenant });
  } catch (error) {
    console.error('Error extending trial:', error);
    res.status(500).json({ error: 'Failed to extend trial' });
  }
};

// Get all plans
export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const plans = await prisma.plan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: true
          }
        }
      },
      orderBy: { priceUSD: 'asc' }
    });

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

// Update plan
export const updatePlan = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;
    const { name, description, priceUSD, priceZWL, maxEmployees, maxUsers, features, isActive } = req.body;

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        description,
        priceUSD,
        priceZWL,
        maxEmployees,
        maxUsers,
        features,
        isActive
      }
    });

    res.json({ message: 'Plan updated', plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

// Get recent activities (audit log)
export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const activities = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true,
            fullName: true
          }
        },
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

// Verify manual payment
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;
    const { status, method, notes } = req.body;

    const payment = await prisma.payment.update({
      where: { id },
      data: { 
        status,
        method
      }
    });

    // If payment is verified, update subscription and tenant status
    if (status === 'PAID' && payment.subscriptionId) {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: 'ACTIVE' }
      });

      await prisma.tenant.update({
        where: { id: payment.tenantId },
        data: { subscriptionStatus: 'ACTIVE' }
      });
    }

    res.json({ message: 'Payment updated', payment });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// Update tenant features
export const updateTenantFeatures = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;
    const { features } = req.body;

    if (!Array.isArray(features)) {
      return res.status(400).json({ error: 'Features must be an array' });
    }

    // Update tenant features directly
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        features: features
      }
    });

    res.json({ 
      message: 'Features updated successfully', 
      features: updatedTenant.features 
    });
  } catch (error) {
    console.error('Error updating tenant features:', error);
    res.status(500).json({ error: 'Failed to update tenant features' });
  }
};

// Update user role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id: tenantId, userId } = req.params;
    const { role } = req.body;

    const validRoles = ['ADMIN', 'MANAGER', 'GENERAL_MANAGER', 'FINANCE_MANAGER', 'EMPLOYEE'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found or does not belong to this tenant' });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    res.json({ 
      message: 'User role updated successfully', 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Create user account from employee
export const createUserFromEmployee = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id: tenantId, employeeId } = req.params;
    const { role = 'EMPLOYEE', tempPassword } = req.body;

    if (!tempPassword || tempPassword.length < 6) {
      return res.status(400).json({ error: 'Temporary password must be at least 6 characters' });
    }

    // Verify employee exists and belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: tenantId,
        userId: null // Employee should not already have a user account
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found, does not belong to this tenant, or already has a user account' });
    }

    if (!employee.email) {
      return res.status(400).json({ error: 'Employee must have an email address to create user account' });
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: employee.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email address is already in use by another user' });
    }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user account
    const newUser = await prisma.user.create({
      data: {
        email: employee.email,
        password: hashedPassword,
        fullName: `${employee.firstName} ${employee.lastName}`,
        role: role,
        tenantId: tenantId,
        isActive: true
      }
    });

    // Link employee to user
    await prisma.employee.update({
      where: { id: employeeId },
      data: { userId: newUser.id }
    });

    res.json({ 
      message: 'User account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role
      },
      tempPassword: tempPassword // Return temp password for super admin to give to user
    });
  } catch (error) {
    console.error('Error creating user from employee:', error);
    res.status(500).json({ error: 'Failed to create user account' });
  }
};

