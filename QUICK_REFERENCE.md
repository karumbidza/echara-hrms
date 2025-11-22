# 🚀 ECHARA HRMS - Quick Reference

## ✅ Project Status: READY TO USE

### What's Working
- ✅ Backend API (TypeScript + Express + Prisma)
- ✅ Frontend App (React + TypeScript + Bootstrap)
- ✅ Database Schema (PostgreSQL via Prisma)
- ✅ Authentication System (JWT)
- ✅ Employee Management
- ✅ Department Management
- ✅ Multi-tenant Architecture

---

## 🏃 Quick Start Commands

### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Start Frontend (Terminal 2)
```bash
cd frontend
npm start
# App opens on http://localhost:3000
```

### Database Setup
```bash
cd backend
npx prisma db push      # Create database tables
npx prisma studio       # View data in browser
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account + company |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get user info (auth required) |

### Employees (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/:id` | Get employee details |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |

### Departments (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List all departments |
| POST | `/api/departments` | Create department |
| GET | `/api/departments/:id` | Get department details |
| PUT | `/api/departments/:id` | Update department |
| DELETE | `/api/departments/:id` | Delete department |

---

## 🗄️ Database Models

- **Tenant** - Company/organization
- **User** - System users (Admin, Manager, Employee, etc.)
- **Organization** - Company details
- **Department** - Departments within organization
- **Employee** - Employee records
- **PayrollRun** - Payroll batches
- **Payslip** - Individual payslips
- **TaxTable** - Tax calculation tables
- **Timesheet** - Time tracking
- **Leave** - Leave requests
- **AuditLog** - System audit trail

---

## 👤 User Roles

1. **SUPER_ADMIN** - Full system access
2. **ADMIN** - Company-wide management
3. **PAYROLL_OFFICER** - Payroll operations
4. **MANAGER** - Team management
5. **EMPLOYEE** - Basic access

---

## 🔑 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/echara_hrms"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV=development
```

---

## 🧪 Testing the App

1. Start PostgreSQL database
2. Start backend server (port 5000)
3. Start frontend app (port 3000)
4. Go to http://localhost:3000/register
5. Create account (this creates your company)
6. Login and access dashboard
7. Start managing employees and departments

---

## 📊 Project Stats

- **Backend Files:** 15 TypeScript files
- **Frontend Files:** 8 React components
- **API Routes:** 3 route groups (auth, employees, departments)
- **Database Models:** 11 models
- **Build Status:** ✅ Both compile successfully
- **Dependencies:** ✅ All installed

---

## 🛠️ Useful Commands

### Backend
```bash
npm run dev          # Start dev server
npm run build        # Build TypeScript
npm start            # Run production build
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema to database
npx prisma studio    # Open database viewer
```

### Frontend
```bash
npm start            # Start dev server
npm run build        # Build for production
npm test             # Run tests
```

---

## 📁 Key Files

### Backend
- `src/app.ts` - Main Express app
- `prisma/schema.prisma` - Database schema
- `src/controllers/` - Request handlers
- `src/routes/` - API routes
- `src/middleware/auth.ts` - Authentication

### Frontend
- `src/App.tsx` - Main React app
- `src/context/AuthContext.tsx` - Auth state
- `src/pages/` - Page components
- `src/components/` - Reusable components

---

## ⚠️ Important Notes

1. **Configure Database:** Update `backend/.env` with your PostgreSQL connection
2. **Run Migrations:** Execute `npx prisma db push` before first run
3. **JWT Secret:** Change `JWT_SECRET` in production
4. **CORS:** Backend allows all origins in dev mode

---

## 🐛 Troubleshooting

### Prisma Client Error
```bash
cd backend
npx prisma generate
```

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Create `.env` with `PORT=3001`

### Database Connection Error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `backend/.env`
- Test connection: `psql -U username -d echara_hrms`

---

## 📚 Documentation

- Full guide: `README.md`
- Project summary: `PROJECT_SUMMARY.md`
- This file: `QUICK_REFERENCE.md`

---

**Ready to build your HRMS application! 🎉**
