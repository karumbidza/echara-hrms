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
  getPendingCount,
  generateLeaveToken,
  getLeaveRequestByToken,
  submitLeaveRequestByToken
} from '../controllers/leaveController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Public routes (no authentication) - for employee self-service via token
router.get('/request/:token', getLeaveRequestByToken);
router.post('/request/:token/submit', submitLeaveRequestByToken);

// All other routes require authentication
router.use(authenticateToken);

// Leave Policy routes (Admin only)
router.get('/policy', getLeavePolicy);
router.put('/policy', requireRole(['ADMIN']), updateLeavePolicy);

// Leave Balance routes
router.get('/balance/:employeeId', getLeaveBalance);
router.post('/balance/initialize', requireRole(['ADMIN']), initializeLeaveBalances);

// Generate leave request token (Admin only)
router.post('/employee/:employeeId/generate-token', requireRole(['ADMIN']), generateLeaveToken);

// Leave Request routes
router.post('/requests', submitLeaveRequest);
router.get('/requests', getLeaveRequests);
router.get('/requests/:id', getLeaveRequest);
router.get('/employee/:employeeId/requests', getLeaveRequests); // Get leave requests for specific employee

// Approval routes (Admin/Manager only)
router.put('/requests/:id/approve', requireRole(['ADMIN', 'MANAGER']), approveLeaveRequest);
router.put('/requests/:id/reject', requireRole(['ADMIN', 'MANAGER']), rejectLeaveRequest);

// Cancel route (Employee can cancel their own)
router.delete('/requests/:id', cancelLeaveRequest);

// Pending count for managers
router.get('/pending/count', getPendingCount);

export default router;
