import { Router } from 'express';
import {
  getAllTenants,
  getPlatformStats,
  getTenantDetails,
  updateTenantStatus,
  extendTrial,
  getPlans,
  updatePlan,
  getRecentActivities,
  verifyPayment,
  updateTenantFeatures,
  updateUserRole,
  createUserFromEmployee
} from '../controllers/superAdminController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All super admin routes require authentication
router.use(authenticateToken);

// Tenant management
router.get('/tenants', getAllTenants);
router.get('/tenants/:id', getTenantDetails);
router.put('/tenants/:id/status', updateTenantStatus);
router.put('/tenants/:id/extend-trial', extendTrial);
router.put('/tenants/:id/features', updateTenantFeatures);
router.put('/tenants/:id/users/:userId/role', updateUserRole);
router.post('/tenants/:id/employees/:employeeId/create-user', createUserFromEmployee);

// Platform stats
router.get('/stats', getPlatformStats);

// Plan management
router.get('/plans', getPlans);
router.put('/plans/:id', updatePlan);

// Activities/Audit log
router.get('/activities', getRecentActivities);

// Payment verification
router.put('/payments/:id/verify', verifyPayment);

export default router;
