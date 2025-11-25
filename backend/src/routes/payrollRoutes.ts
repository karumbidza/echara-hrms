import express from 'express';
import {
  runPayroll,
  getPayrollRuns,
  getPayrollRun,
  getEmployeePayslips,
  getPayslip,
  getSalaryHistory
} from '../controllers/payrollController';
import { exportPAYE, exportNSSA, exportBankPayments } from '../controllers/payrollExportController';
import { generatePayslipPDF } from '../controllers/payslipPdfController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Payroll processing
router.post('/run', runPayroll);
router.get('/runs', getPayrollRuns);
router.get('/runs/:id', getPayrollRun);

// CSV Exports for remittances
router.get('/runs/:id/export-paye', exportPAYE);
router.get('/runs/:id/export-nssa', exportNSSA);
router.get('/runs/:id/export-bank-payments', exportBankPayments);

// Payslips
router.get('/employees/:employeeId/payslips', getEmployeePayslips);
router.get('/payslips/:id', getPayslip);
router.get('/payslips/:payslipId/pdf', generatePayslipPDF);

// Salary history
router.get('/employees/:employeeId/salary-history', getSalaryHistory);

export default router;
