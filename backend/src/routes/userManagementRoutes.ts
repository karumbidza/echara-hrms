import { Router } from 'express';
import {
  getTenantUsers,
  updateUserRole,
  resetUserPassword,
  generateTemporaryPassword,
  toggleUserStatus,
  createTenantUser
} from '../controllers/userManagementController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require super admin authentication
router.use(authenticateToken);

// Get all users for a tenant
router.get('/tenants/:tenantId/users', getTenantUsers);

// Create user for tenant
router.post('/tenants/:tenantId/users', createTenantUser);

// Update user role
router.put('/users/:userId/role', updateUserRole);

// Reset user password (custom password)
router.put('/users/:userId/reset-password', resetUserPassword);

// Generate temporary password
router.post('/users/:userId/generate-password', generateTemporaryPassword);

// Suspend/Activate user
router.put('/users/:userId/toggle-status', toggleUserStatus);

export default router;
