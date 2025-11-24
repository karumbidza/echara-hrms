import { Router } from 'express';
import { registerCompany, seedPlans } from '../controllers/tenantController';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Public routes
router.post('/register-company', registerCompany);

// Seed plans (can be protected or made one-time only)
router.post('/seed-plans', seedPlans);

// Create super admin (temporary endpoint - remove after use)
router.post('/create-super-admin', async (req, res) => {
  try {
    const email = 'admin@echara.com';
    const password = 'SuperAdmin123!';
    const fullName = 'Super Administrator';

    // Check if already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Super admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    res.json({
      message: 'Super admin created',
      email,
      password,
      id: superAdmin.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
