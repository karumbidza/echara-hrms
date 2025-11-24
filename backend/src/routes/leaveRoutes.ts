import { Router } from 'express';
import {
  getLeavePolicy,
  updateLeavePolicy,
  getLeaveBalance,
  initializeLeaveBalances,
  submitLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getPendingCount
} from '../controllers/leaveController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Leave Policy routes (Admin only)
router.get('/policy', getLeavePolicy);
router.put('/policy', requireRole(['ADMIN']), updateLeavePolicy);

// Leave Balance routes
router.get('/balance/:employeeId', getLeaveBalance);
router.post('/balance/initialize', requireRole(['ADMIN']), initializeLeaveBalances);

// Leave Request routes
router.post('/requests', submitLeaveRequest);
router.get('/requests', getLeaveRequests);
router.get('/requests/:id', getLeaveRequest);

// Approval routes (Admin/Manager only)
router.put('/requests/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveLeaveRequest);
router.put('/requests/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectLeaveRequest);

// Cancel route (Employee can cancel their own)
router.delete('/requests/:id', cancelLeaveRequest);

// Pending count for managers
router.get('/pending/count', getPendingCount);

export default router;
