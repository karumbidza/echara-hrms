# ECHARA HRMS - Multi-Tenant Access Guide

## Overview
ECHARA HRMS uses a **multi-tenant architecture** where:
- **One Super Admin** manages the entire platform
- **Multiple Tenants (Companies)** each have their own isolated data
- **Tenant isolation** is automatic based on email login

---

## 🔐 Authentication Model

### How Login Works
1. **User logs in with email + password**
2. System automatically determines:
   - If user is **SUPER_ADMIN** → Access to platform management
   - If user has **tenantId** → Access only to their company's data
3. **No manual tenant selection needed** - it's automatic!

### User Types

| Role | Tenant Access | Description |
|------|---------------|-------------|
| **SUPER_ADMIN** | Platform-wide | Manages all tenants, plans, billing |
| **ADMIN** | Single tenant | Company owner, full access to their company |
| **GENERAL_MANAGER** | Single tenant | Senior management access |
| **FINANCE_MANAGER** | Single tenant | Payroll and finance access |
| **HR_MANAGER** | Single tenant | Employee management access |
| **EMPLOYEE** | Single tenant | Self-service portal access |

---

## 🛡️ Super Admin Access

### Super Admin Credentials
```
📧 Email: admin@echara.com
🔑 Password: SuperAdmin123!
```

⚠️ **IMPORTANT**: Change this password immediately after first login!

### What Super Admin Can Do
- View all registered companies (tenants)
- Monitor platform statistics (revenue, users, employees)
- Manage subscription plans and pricing
- Extend trial periods
- Activate/suspend tenant accounts
- View platform-wide audit logs

### Super Admin Dashboard
**URL**: `https://echara-hrms.vercel.app/super-admin`

Features:
- **Stats Cards**: Total companies, monthly revenue, platform usage
- **Tenant Table**: All companies with status, users, employees, payroll runs
- **Filters**: View ALL, TRIAL, ACTIVE, or EXPIRED tenants
- **Actions**: View details, extend trials, update status

---

## 🏢 Tenant (Company) Access

### How Tenants Register
1. Visit landing page: `https://echara-hrms.vercel.app`
2. Click "Start Free Trial" or "Get Started"
3. Complete 3-step registration:
   - **Step 1**: Company info (name, email, phone, address)
   - **Step 2**: Owner account (name, email, password)
   - **Step 3**: Plan selection (Starter/Professional/Enterprise)
4. Get **14-day free trial** automatically
5. Owner account created with **ADMIN** role

### Tenant Isolation
- Each tenant's data is **completely isolated**
- Users can only see/modify data for their company
- Database uses **Row-Level Security** via `tenantId` filtering
- Example: User from Company A **cannot** access Company B's employees

### How Tenant Users Login
1. **Any user** (admin, manager, employee) logs in with their email
2. System automatically knows which company they belong to
3. User sees only **their company's data**
4. No dropdown or selection needed!

### Example Flow
```
1. Company "ABC Corp" registers → Creates Tenant with ID: abc-123
2. Owner creates account: john@abccorp.com → User linked to Tenant abc-123
3. Owner invites HR Manager: sarah@abccorp.com → Also linked to abc-123
4. John logs in → Sees ABC Corp's data only
5. Sarah logs in → Sees ABC Corp's data only
6. Super Admin logs in → Sees ALL companies including ABC Corp
```

---

## 🔄 Registration vs Login

### New Company Registration
**Endpoint**: `POST /api/auth/register-company`
**Creates**:
- New Tenant record
- New Subscription (14-day trial)
- Owner User account (ADMIN role)
- JWT token for immediate login

**Frontend**: `/register` (3-step wizard)

### Existing User Login
**Endpoint**: `POST /api/auth/login`
**Requires**:
- Email (automatically identifies tenant)
- Password

**Returns**:
- JWT token containing: userId, email, role, tenantId
- User info with tenant details

**Frontend**: `/login` (simple form)

---

## 🗄️ Database Structure

### Key Tables
```prisma
User {
  id: string
  email: string (unique)
  role: SUPER_ADMIN | ADMIN | MANAGER | EMPLOYEE
  tenantId: string? (null for SUPER_ADMIN, required for tenant users)
}

Tenant {
  id: string
  name: string
  slug: string
  subscriptionStatus: TRIAL | ACTIVE | PAST_DUE | CANCELLED | EXPIRED
  trialEndsAt: DateTime
  users: User[]
  employees: Employee[]
  payrollRuns: PayrollRun[]
}
```

### How Tenant Isolation Works
Every query includes automatic tenant filtering:

```typescript
// Example: Get employees for logged-in user's company
const employees = await prisma.employee.findMany({
  where: { tenantId: req.user.tenantId } // Automatic from JWT token
});

// Super admin can access all tenants
const allTenants = await prisma.tenant.findMany(); // No filter needed
```

---

## 📊 Subscription Plans

### Available Plans

| Plan | Price (USD) | Price (ZWL) | Employees | Users | Features |
|------|-------------|-------------|-----------|-------|----------|
| **Starter** | $29/month | ZWL 900/month | 10 | 2 | Basic payroll, compliance |
| **Professional** | $79/month | ZWL 2500/month | 50 | 5 | + Workflows, reports |
| **Enterprise** | Custom | Custom | Unlimited | Unlimited | + API, priority support |

### Trial Period
- **14 days free** for all new registrations
- No credit card required
- Full access to selected plan features
- Automatic reminder before expiry

---

## 🚀 Quick Start Guide

### For Super Admin
1. Login: `admin@echara.com` / `SuperAdmin123!`
2. Access dashboard: `/super-admin`
3. Seed plans: `POST /api/tenants/seed-plans`
4. Monitor new company registrations
5. Manage subscriptions and billing

### For New Company (Tenant)
1. Visit landing page: `/`
2. Click "Start Free Trial"
3. Complete 3-step registration
4. Login automatically after registration
5. Start using the system (14-day trial)

### For Tenant Users (Employees/Managers)
1. Wait for admin to create your account
2. Login with your email
3. Automatically access your company's data
4. No need to select company - it's automatic!

---

## 🔧 API Endpoints

### Super Admin Routes
```
GET  /api/super-admin/tenants         # List all tenants
GET  /api/super-admin/tenants/:id     # Get tenant details
GET  /api/super-admin/stats           # Platform statistics
PUT  /api/super-admin/tenants/:id/status            # Update tenant status
PUT  /api/super-admin/tenants/:id/extend-trial      # Extend trial period
GET  /api/super-admin/plans           # List subscription plans
PUT  /api/super-admin/plans/:id       # Update plan pricing
GET  /api/super-admin/activities      # Audit logs
```

### Tenant Routes
```
POST /api/auth/register-company       # New company registration
POST /api/tenants/seed-plans          # Seed subscription plans
```

### Authentication Routes
```
POST /api/auth/register               # Legacy registration (creates tenant)
POST /api/auth/register-company       # New multi-step registration
POST /api/auth/login                  # Universal login (super admin + tenants)
GET  /api/auth/profile                # Get current user info
```

### Payroll Export Routes
```
GET /api/payroll/export/runs/:id/export-paye          # ZIMRA P.35 format
GET /api/payroll/export/runs/:id/export-nssa          # NSSA remittance
GET /api/payroll/export/runs/:id/export-bank-payments # Bank upload format
```

---

## 🛠️ Creating Super Admin (Manual)

If you need to create another super admin:

```bash
cd backend
npx ts-node src/utils/createSuperAdmin.ts
```

Or with custom credentials:
```bash
SUPER_ADMIN_EMAIL="admin@example.com" \
SUPER_ADMIN_PASSWORD="YourPassword123" \
SUPER_ADMIN_NAME="Admin Name" \
npx ts-node src/utils/createSuperAdmin.ts
```

---

## ❓ FAQ

### Q: Can a user belong to multiple companies?
**A**: No. Each user account is linked to one tenant only. If someone works for multiple companies, they need separate accounts with different emails.

### Q: How does the system know which company's data to show?
**A**: The JWT token contains the `tenantId`. Every API request automatically filters data by this tenantId.

### Q: Can tenants see each other's data?
**A**: No. Database queries automatically filter by tenantId, ensuring complete isolation.

### Q: What happens when trial expires?
**A**: Tenant status changes to `EXPIRED`. System can block login or show payment reminder based on your implementation.

### Q: How do I test the multi-tenant system locally?
**A**:
1. Create super admin: `npx ts-node src/utils/createSuperAdmin.ts`
2. Login as super admin
3. Register 2-3 test companies via `/register`
4. Login as each company's admin
5. Verify data isolation

### Q: Can super admin access tenant data directly?
**A**: Super admin can VIEW all tenant data via the dashboard but should not create/modify data within tenant context. Super admin is for platform management only.

---

## 🔐 Security Notes

1. **JWT Tokens** contain tenantId - ensures automatic filtering
2. **No SQL injection** - Prisma ORM handles parameterization
3. **Row-level security** - Every query filters by tenantId
4. **Password hashing** - bcrypt with 12 rounds
5. **Role-based access** - Middleware checks user role before allowing actions
6. **Super admin isolation** - No tenantId = platform-wide access

---

## 📝 Development Notes

### Seeding Data
- Run `createSuperAdmin.ts` to create platform admin
- Run `POST /api/tenants/seed-plans` to create subscription plans
- Register test companies via frontend or API

### Testing Multi-Tenancy
1. Create 2+ companies via registration
2. Login as each company's admin
3. Create employees in each company
4. Run payroll in each company
5. Verify data isolation (Company A cannot see Company B's data)
6. Login as super admin to see all companies

---

## 📞 Support

For issues or questions:
- Check audit logs in super admin dashboard
- Review user's tenantId in JWT token
- Verify database tenantId foreign keys
- Check Prisma queries include tenantId filtering

---

**Last Updated**: November 24, 2025
**System Version**: 2.0 (Multi-Tenant SaaS)
