import { Router } from 'express';
import { 
  getPendingPayrolls,
  submitForApproval,
  approvePayroll,
  rejectPayroll,
  getPayrollStatus
} from '../controllers/payrollApprovalController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all pending payrolls
router.get('/pending', getPendingPayrolls);

// Get specific payroll status
router.get('/:id/status', getPayrollStatus);

// Submit payroll for approval
router.post('/:id/submit', submitForApproval);

// Approve payroll (GM/Finance Manager only)
router.post('/:id/approve', approvePayroll);

// Reject payroll (GM/Finance Manager only)
router.post('/:id/reject', rejectPayroll);

export default router;
