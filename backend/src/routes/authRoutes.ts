import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { registerCompany } from '../controllers/tenantController';
import { authenticateToken } from '../middleware/auth';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', register);
router.post('/register-company', registerCompany);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

// Temporary endpoint to create super admin
router.post('/setup-super-admin', async (req, res) => {
  try {
    const email = 'admin@echara.com';
    const existing = await prisma.user.findUnique({ where: { email } });
    
    if (existing) {
      return res.json({ message: 'Super admin already exists', email });
    }

    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: 'Super Administrator',
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    res.json({
      message: 'Super admin created successfully',
      email,
      password: 'SuperAdmin123!',
      note: 'Please change password after first login'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
