import { Router } from 'express';
import { exportPAYE, exportNSSA, exportBankPayments } from '../controllers/payrollExportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All export routes require authentication
router.use(authenticateToken);

// CSV exports for payroll runs
router.get('/runs/:id/export-paye', exportPAYE);
router.get('/runs/:id/export-nssa', exportNSSA);
router.get('/runs/:id/export-bank-payments', exportBankPayments);

export default router;
