import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, companyName, currency } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug: companyName.toLowerCase().replace(/\s+/g, '-'),
        currency: currency || 'USD'
      }
    });

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: companyName,
        tenantId: tenant.id
      }
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'ADMIN',
        tenantId: tenant.id
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true
      }
    });

    // Generate tokens
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: {
          include: {
            subscriptions: {
              where: {
                status: 'ACTIVE'
              },
              include: {
                plan: {
                  select: {
                    features: true
                  }
                }
              },
              take: 1
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For super admin, tenantId will be null
    // For tenant users, tenantId is required
    const tokenPayload: any = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    // Only add tenantId if user belongs to a tenant
    if (user.tenantId) {
      tokenPayload.tenantId = user.tenantId;
    }

    // Generate token
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Extract features - prioritize tenant features over plan features
    let features: string[] = [];
    if (user.tenant) {
      // Check if tenant has custom features assigned
      if (user.tenant.features && Array.isArray(user.tenant.features)) {
        features = user.tenant.features.filter((f): f is string => typeof f === 'string');
      } 
      // Fall back to plan features if tenant features not set
      else if (user.tenant.subscriptions.length > 0) {
        const planFeatures = user.tenant.subscriptions[0].plan.features;
        features = Array.isArray(planFeatures) ? planFeatures.filter((f): f is string => typeof f === 'string') : [];
      }
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          subscriptionStatus: user.tenant.subscriptionStatus,
          features
        } : null
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subscriptionStatus: true,
            features: true,
            subscriptions: {
              where: {
                status: 'ACTIVE'
              },
              select: {
                plan: {
                  select: {
                    features: true
                  }
                }
              },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract features - prioritize tenant features over plan features
    let features: string[] = [];
    if (user.tenant) {
      // Check if tenant has custom features assigned
      if (user.tenant.features && Array.isArray(user.tenant.features)) {
        features = user.tenant.features.filter((f): f is string => typeof f === 'string');
      } 
      // Fall back to plan features if tenant features not set
      else if (user.tenant.subscriptions.length > 0) {
        const planFeatures = user.tenant.subscriptions[0].plan.features;
        features = Array.isArray(planFeatures) ? planFeatures.filter((f): f is string => typeof f === 'string') : [];
      }
    }

    // Add features to tenant object
    const userData = {
      ...user,
      tenant: user.tenant ? {
        ...user.tenant,
        features,
        subscriptions: undefined // Remove subscriptions from response
      } : null
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};