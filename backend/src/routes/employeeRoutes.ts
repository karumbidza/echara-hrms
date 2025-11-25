import { Router } from 'express';
import { 
  getEmployees, 
  getEmployee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} from '../controllers/employeeController';
import { authenticateToken } from '../middleware/auth';
import { employeeUpload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);

router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.post('/', employeeUpload, createEmployee);
router.put('/:id', employeeUpload, updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
