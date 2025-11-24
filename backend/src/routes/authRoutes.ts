import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { registerCompany } from '../controllers/tenantController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/register-company', registerCompany);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

export default router;
