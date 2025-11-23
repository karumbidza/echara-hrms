import { Router } from 'express';
import { getJobTitles } from '../controllers/jobTitleController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getJobTitles);

export default router;
