import { Router } from 'express';
import { getOrganizations } from '../controllers/organizationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getOrganizations);

export default router;
