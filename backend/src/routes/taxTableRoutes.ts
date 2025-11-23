import { Router } from 'express';
import { 
  getTaxTables, 
  seedDefaultTaxTables,
  testTaxCalculation
} from '../controllers/taxTableController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (within tenant)
router.get('/', getTaxTables);
router.post('/test-calculation', testTaxCalculation);

// Protected routes - require admin role
router.post('/seed-defaults', requireRole(['ADMIN']), seedDefaultTaxTables);

export default router;
