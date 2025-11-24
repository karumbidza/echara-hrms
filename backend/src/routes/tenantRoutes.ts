import { Router } from 'express';
import { registerCompany, seedPlans } from '../controllers/tenantController';

const router = Router();

// Public routes
router.post('/register-company', registerCompany);

// Seed plans (can be protected or made one-time only)
router.post('/seed-plans', seedPlans);

export default router;
