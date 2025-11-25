import { Router } from 'express';
import {
  getContractNotifications,
  checkExpiringContracts,
  acknowledgeContractNotification,
  getContractSummary
} from '../controllers/contractNotificationController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get contract notifications (Admin/Manager)
router.get('/notifications', requireRole(['ADMIN', 'MANAGER']), getContractNotifications);

// Get contract summary dashboard
router.get('/summary', requireRole(['ADMIN', 'MANAGER']), getContractSummary);

// Check for expiring contracts (Admin only - can be triggered manually or by cron)
router.post('/check-expiring', requireRole(['ADMIN']), checkExpiringContracts);

// Acknowledge notification and record decision (Admin only)
router.put('/notifications/:id/acknowledge', requireRole(['ADMIN']), acknowledgeContractNotification);

export default router;
