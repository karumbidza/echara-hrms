import { Router } from 'express';
import {
  getPlatformSettings,
  updatePlatformSettings,
  getSettingsHistory
} from '../controllers/platformSettingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication and super admin role
router.use(authenticateToken);

router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);
router.get('/settings/history', getSettingsHistory);

export default router;
