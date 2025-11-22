# ECHARA HRMS - Human Resource Management System

A comprehensive web-based Human Resource Management System built with React, Node.js, TypeScript, and PostgreSQL.

## Features

### ✅ Implemented
- **Multi-tenant Architecture** - Support for multiple companies/organizations
- **User Authentication** - Secure JWT-based authentication with role-based access control
- **Employee Management** - Create, read, update, and delete employee records
- **Department Management** - Organize employees by departments
- **Payroll System** - Complete payroll processing with PAYE, NSSA, and AIDS levy calculations
- **Timesheet Tracking** - Clock in/out system with regular and overtime hours
- **Leave Management** - Annual, sick, maternity, paternity, and unpaid leave tracking
- **Audit Logging** - Track all system changes for compliance

### 🎯 User Roles
- Super Admin
- Admin
- Payroll Officer
- Manager
- Employee

## Technology Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React 19** with **TypeScript**
- **React Router** for navigation
- **React Bootstrap** for UI components
- **Axios** for API communication
- **Context API** for state management

## Project Structure

```
echara-hrms/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── employeeController.ts
│   │   │   └── departmentController.ts
│   │   ├── middleware/       # Express middleware
│   │   │   └── auth.ts
│   │   ├── routes/           # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── employeeRoutes.ts
│   │   │   └── departmentRoutes.ts
│   │   └── app.ts            # Express app setup
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                  # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   └── Navigation.tsx
│   │   ├── context/          # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create/edit `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/echara_hrms?schema=public"
   JWT_SECRET="your-secret-jwt-key-change-in-production"
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Push database schema
   npx prisma db push
   
   # (Optional) Open Prisma Studio to view data
   npx prisma studio
   ```

5. **Build and run:**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

   The backend will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

   The frontend will start on `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user and create tenant
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/profile` - Get current user profile (requires auth)

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get single department
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Health Check
- `GET /api/health` - Check API status

## Database Models

- **Tenant** - Multi-tenant support for different companies
- **User** - System users with role-based access
- **Organization** - Company/organization details
- **Department** - Organizational departments
- **Employee** - Employee records with full details
- **PayrollRun** - Payroll processing batches
- **Payslip** - Individual employee payslips
- **TaxTable** - Tax calculation tables (PAYE, NSSA, AIDS levy)
- **Timesheet** - Time tracking records
- **Leave** - Leave requests and approvals
- **AuditLog** - System audit trail

## Development

### Running Backend in Development
```bash
cd backend
npm run dev
```

### Running Frontend in Development
```bash
cd frontend
npm start
```

### Database Migrations
```bash
cd backend
npx prisma db push          # Push schema changes
npx prisma studio           # View database in browser
npx prisma migrate dev      # Create migration
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Testing the Application

1. **Start PostgreSQL** database
2. **Start backend** server (port 5000)
3. **Start frontend** development server (port 3000)
4. **Register** a new account at `http://localhost:3000/register`
5. **Login** with your credentials
6. Access the **Dashboard** to manage employees and departments

## Currency Support

The system supports multiple currencies:
- USD (US Dollar)
- ZWL (Zimbabwe Dollar)

Default currency can be set during registration and per employee.

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Role-based access control
- Tenant isolation (multi-tenancy)
- CORS protection
- Helmet.js security headers

## Future Enhancements

- [ ] Payroll report generation (PDF)
- [ ] Email notifications for payslips
- [ ] Advanced leave management
- [ ] Performance reviews
- [ ] Document management
- [ ] Advanced analytics and dashboards
- [ ] Mobile app support
- [ ] Biometric clock in/out
- [ ] Integration with accounting systems

## License

This project is proprietary software for ECHARA HRMS.

## Support

For issues or questions, please contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** November 2025
