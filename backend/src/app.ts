import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import departmentRoutes from './routes/departmentRoutes';
import organizationRoutes from './routes/organizationRoutes';
import jobTitleRoutes from './routes/jobTitleRoutes';
import payrollRoutes from './routes/payrollRoutes';
import taxTableRoutes from './routes/taxTableRoutes';
import payrollApprovalRoutes from './routes/payrollApprovalRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import tenantRoutes from './routes/tenantRoutes';
import payrollExportRoutes from './routes/payrollExportRoutes';
import platformSettingsRoutes from './routes/platformSettingsRoutes';
import quoteRoutes from './routes/quoteRoutes';
import userManagementRoutes from './routes/userManagementRoutes';

const app = express();
const prisma = new PrismaClient();

// Test database connection
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((err) => console.error('❌ Database connection failed:', err));

console.log('🚀 ECHARA HRMS Backend initializing...');

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://echara-hrms.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/platform', platformSettingsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/job-titles', jobTitleRoutes);
app.use('/api/payroll/approval', payrollApprovalRoutes); // Must be before /api/payroll
app.use('/api/payroll/export', payrollExportRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/tax-tables', taxTableRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'ECHARA HRMS Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 ECHARA HRMS Server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

export default app;