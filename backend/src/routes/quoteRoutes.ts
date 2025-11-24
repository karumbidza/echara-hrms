import { Router } from 'express';
import {
  submitQuoteRequest,
  getAllQuoteRequests,
  getQuoteRequest,
  respondToQuoteRequest,
  convertQuoteToTenant
} from '../controllers/quoteController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route - no auth required
router.post('/submit', submitQuoteRequest);

// Super admin routes - require authentication
router.get('/', authenticateToken, getAllQuoteRequests);
router.get('/:id', authenticateToken, getQuoteRequest);
router.put('/:id/respond', authenticateToken, respondToQuoteRequest);
router.post('/:id/convert', authenticateToken, convertQuoteToTenant);

export default router;
