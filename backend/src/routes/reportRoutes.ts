import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getLeaveLiabilityReport,
  getStatutoryRemittanceReport,
  getDualCurrencyReport
} from '../controllers/reportController';

const router = Router();

// All report routes require authentication
router.use(auth);

/**
 * @route   GET /api/reports/leave-liability
 * @desc    Get leave liability report with employee breakdown
 * @access  Private (ADMIN, GENERAL_MANAGER, FINANCE_MANAGER)
 * @query   departmentId, startDate, endDate (optional filters)
 */
router.get('/leave-liability', getLeaveLiabilityReport);

/**
 * @route   GET /api/reports/statutory-remittance
 * @desc    Get NSSA & PAYE remittance report per department
 * @access  Private (ADMIN, GENERAL_MANAGER, FINANCE_MANAGER)
 * @query   month, year, departmentId (optional filters)
 */
router.get('/statutory-remittance', getStatutoryRemittanceReport);

/**
 * @route   GET /api/reports/dual-currency
 * @desc    Get USD/ZWL currency analysis report
 * @access  Private (ADMIN, GENERAL_MANAGER, FINANCE_MANAGER)
 * @query   month, year (optional filters)
 */
router.get('/dual-currency', getDualCurrencyReport);

export default router;
