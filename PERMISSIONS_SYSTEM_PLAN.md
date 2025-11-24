# Feature-Based Permission System - Analysis & Implementation Plan

## 🎯 Your Vision (Refined)

**Core Concept:** Tie features/functionality to pricing plans, with super admin able to enable/disable features per tenant based on what they're paying for.

**Role Separation:**
- **Company Admin**: Creates employees, manages day-to-day operations
- **Super Admin**: Assigns roles to users, configures which features/modules company has access to

---

## 📊 Current State Analysis

### Existing User Roles
```typescript
enum UserRole {
  SUPER_ADMIN    // Platform owner (you)
  ADMIN          // Company owner  
  PAYROLL_OFFICER // (Currently unused - we can repurpose)
  MANAGER        // (Currently unused - we can repurpose)
  EMPLOYEE       // Basic user
}
```

### Current Features in System
1. **Employee Management** (Add/Edit/View employees)
2. **Department Management** 
3. **Payroll Processing** (Run payroll, calculate taxes)
4. **Payroll Approvals** (Multi-level approval workflow)
5. **Leave Management** (Request/Approve leave)
6. **Reports & Analytics** (View payroll reports, export CSVs)
7. **Self-Service Portal** (Employees view own payslips)
8. **Timesheets** (Track hours worked)
9. **Tax & NSSA Exports** (Government compliance files)

### Current Navigation Access Control
**Regular tenants see:**
- Dashboard
- Employees
- Departments  
- Payroll
- Approvals (if ADMIN/GENERAL_MANAGER/FINANCE_MANAGER)

---

## 💡 Proposed System Architecture

### 1. **Feature Modules** (Granular Control)

Create a permissions system where each feature can be toggled:

```typescript
enum FeatureModule {
  // Core (Always included)
  EMPLOYEE_MANAGEMENT     // View/add employees
  BASIC_PAYROLL          // Run payroll, basic calculations
  
  // Premium Features
  PAYROLL_APPROVALS      // Multi-level approval workflow
  LEAVE_MANAGEMENT       // Leave requests and approvals
  DEPARTMENT_STRUCTURE   // Org chart, departments
  ADVANCED_REPORTS       // Custom reports, analytics
  TIMESHEET_TRACKING     // Clock in/out, hours tracking
  SELF_SERVICE_PORTAL    // Employee portal access
  TAX_EXPORTS            // PAYE/NSSA automated exports
  MULTI_CURRENCY         // USD + ZWL payroll
  BANK_INTEGRATION       // Automated bank file generation
  AUDIT_TRAIL           // Full history of changes
}
```

### 2. **Permission Levels per Feature**

Each feature can have different permission levels:

```typescript
enum PermissionLevel {
  NONE           // Feature not available
  VIEW_ONLY      // Can see but not modify
  CREATE_EDIT    // Can create and edit
  FULL_CONTROL   // Can create, edit, delete, configure
}
```

### 3. **Role Templates** (Easier Management)

Instead of assigning individual permissions, create role templates:

```typescript
// Predefined roles that company admin can assign
enum TenantRole {
  ADMIN              // Full access to all enabled features
  FINANCE_MANAGER    // Payroll, reports, approvals
  HR_MANAGER         // Employees, leave, departments
  DEPARTMENT_MANAGER // View reports, approve leave for their dept
  PAYROLL_OFFICER    // Run payroll, no approvals
  EMPLOYEE           // Self-service only
}
```

---

## 🏗️ Implementation Plan

### **Phase 1: Database Schema (Foundation)**

Add new models to track feature access:

```prisma
// Available features and their descriptions
model FeatureModule {
  id          String   @id @default(uuid())
  name        String   @unique  // PAYROLL_APPROVALS
  displayName String              // "Multi-Level Payroll Approvals"
  description String              // "Department and finance team approval workflow"
  category    String              // "Payroll", "HR", "Reports"
  isCore      Boolean  @default(false) // Core features always enabled
  createdAt   DateTime @default(now())
  
  tenantFeatures TenantFeature[]
  planFeatures   PlanFeature[]
}

// Features included in each plan
model PlanFeature {
  id              String   @id @default(uuid())
  planId          String
  plan            Plan     @relation(fields: [planId], references: [id])
  featureModuleId String
  featureModule   FeatureModule @relation(fields: [featureModuleId], references: [id])
  permissionLevel PermissionLevel @default(FULL_CONTROL)
  
  @@unique([planId, featureModuleId])
}

// Features actually enabled for a tenant (can differ from plan)
model TenantFeature {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  featureModuleId String
  featureModule   FeatureModule @relation(fields: [featureModuleId], references: [id])
  permissionLevel PermissionLevel @default(FULL_CONTROL)
  enabledAt       DateTime @default(now())
  enabledBy       String?  // Super admin who enabled it
  expiresAt       DateTime? // For trial features
  
  @@unique([tenantId, featureModuleId])
}

// Role definitions per tenant (customizable)
model TenantRole {
  id           String   @id @default(uuid())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  name         String   // "Finance Manager", "HR Manager"
  slug         String   // "finance_manager"
  description  String?
  permissions  Json     // { "PAYROLL_APPROVALS": "FULL_CONTROL", "REPORTS": "VIEW_ONLY" }
  isCustom     Boolean  @default(false) // true if company created custom role
  createdAt    DateTime @default(now())
  
  users        User[]   @relation("UserTenantRole")
  
  @@unique([tenantId, slug])
}

enum PermissionLevel {
  NONE
  VIEW_ONLY
  CREATE_EDIT
  FULL_CONTROL
}
```

Update User model:
```prisma
model User {
  // ... existing fields
  
  // Instead of simple "role" enum, use flexible tenant role
  tenantRoleId String?
  tenantRole   TenantRole? @relation("UserTenantRole", fields: [tenantRoleId], references: [id])
  
  // Keep old role field for backward compatibility, will phase out
  role      UserRole @default(EMPLOYEE)
}
```

---

### **Phase 2: Super Admin Controls**

In the **Tenant Details** page (`/super-admin/tenants/:id`), add new tab:

#### **"Features & Permissions" Tab**

**What Super Admin Can Do:**

1. **View Current Plan**
   - See which features are included in their subscription
   - See active/inactive features

2. **Toggle Features** (Override plan)
   ```
   ✅ Employee Management (Core - always on)
   ✅ Basic Payroll (Core - always on)
   ☑️ Payroll Approvals (Toggle on/off)
   ☑️ Leave Management (Toggle on/off)
   ☑️ Advanced Reports (Toggle on/off)
   ☐ Timesheet Tracking (Disabled - upgrade required)
   ```

3. **Manage User Roles**
   - View all users in the company
   - Assign roles (Finance Manager, HR Manager, etc.)
   - Reset passwords (security)
   - Suspend/activate users

4. **View Feature Usage**
   - See which features company is actually using
   - Usage stats (helpful for upselling)

**Example UI:**

```
┌─────────────────────────────────────────────────────┐
│ Features & Permissions                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Current Plan: Professional ($55/month)               │
│ Subscription Status: Active                          │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Core Features (Always Enabled)                │   │
│ │ ✅ Employee Management                        │   │
│ │ ✅ Basic Payroll Processing                   │   │
│ │ ✅ Tax Calculations (ZIMRA/NSSA)             │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Professional Features                         │   │
│ │ ☑️ Payroll Approvals        [Toggle] 🟢      │   │
│ │ ☑️ Leave Management         [Toggle] 🟢      │   │
│ │ ☑️ Department Structure     [Toggle] 🟢      │   │
│ │ ☑️ Advanced Reports         [Toggle] 🟢      │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Enterprise Features (Not in plan)             │   │
│ │ ☐ Timesheet Tracking        [Disabled] 🔴    │   │
│ │ ☐ Bank Integration          [Disabled] 🔴    │   │
│ │ ☐ Audit Trail              [Disabled] 🔴    │   │
│ │                                               │   │
│ │ 💡 Upgrade to Enterprise to unlock           │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [Save Changes]  [Reset to Plan Defaults]            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ User Role Management                                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ User: john@company.com                        │   │
│ │ Name: John Doe                                │   │
│ │ Current Role: Employee                        │   │
│ │                                               │   │
│ │ Assign New Role:                              │   │
│ │ [ Dropdown: Finance Manager ▼ ]               │   │
│ │                                               │   │
│ │ [Update Role]  [Reset Password]  [Suspend]   │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ... (list more users) ...                           │
└─────────────────────────────────────────────────────┘
```

---

### **Phase 3: Pricing Tiers with Features**

Update your quote response system to show features:

#### **Starter Plan ($25-35/month)**
✅ Employee Management (up to 10)  
✅ Basic Payroll Processing  
✅ Tax Calculations (ZIMRA/NSSA)  
✅ 2 System Users  
✅ Email Support  

#### **Professional Plan ($45-75/month)**
✅ Everything in Starter  
✅ **Payroll Approvals** (NEW)  
✅ **Leave Management** (NEW)  
✅ **Department Structure** (NEW)  
✅ **Advanced Reports** (NEW)  
✅ Up to 50 employees  
✅ 5 System Users  
✅ Priority Support  

#### **Enterprise Plan ($100-250/month)**
✅ Everything in Professional  
✅ **Timesheet Tracking** (NEW)  
✅ **Bank Integration** (NEW)  
✅ **Audit Trail** (NEW)  
✅ **Multi-Currency** (NEW)  
✅ Unlimited employees  
✅ Unlimited users  
✅ Custom Integrations  
✅ Dedicated Support  

---

### **Phase 4: Frontend Feature Gating**

Update Navigation and Pages to check features:

```typescript
// frontend/src/hooks/useFeatureAccess.ts
import { useAuth } from '../context/AuthContext';

export const useFeatureAccess = () => {
  const { user, tenant } = useAuth();
  
  const hasFeature = (featureName: string) => {
    if (user?.role === 'SUPER_ADMIN') return true;
    
    // Check if tenant has this feature enabled
    return tenant?.enabledFeatures?.includes(featureName);
  };
  
  const hasPermission = (featureName: string, level: 'VIEW' | 'EDIT' | 'DELETE') => {
    if (!hasFeature(featureName)) return false;
    
    const featurePermission = tenant?.featurePermissions?.[featureName];
    // Check user's role permissions for this feature
    return checkPermissionLevel(user?.tenantRole, featureName, level);
  };
  
  return { hasFeature, hasPermission };
};

// Usage in components:
const Navigation = () => {
  const { hasFeature } = useFeatureAccess();
  
  return (
    <>
      <Nav.Link href="/employees">Employees</Nav.Link>
      <Nav.Link href="/payroll">Payroll</Nav.Link>
      
      {hasFeature('PAYROLL_APPROVALS') && (
        <Nav.Link href="/payroll-approvals">Approvals</Nav.Link>
      )}
      
      {hasFeature('LEAVE_MANAGEMENT') && (
        <Nav.Link href="/leave">Leave</Nav.Link>
      )}
      
      {hasFeature('ADVANCED_REPORTS') && (
        <Nav.Link href="/reports">Reports</Nav.Link>
      )}
    </>
  );
};
```

---

## 🔐 Super Admin Capabilities in Tenant View

### **What Super Admin SHOULD Control:**

✅ **Enable/Disable Features** (based on what customer is paying for)  
✅ **Assign/Change User Roles** (help companies set up their team)  
✅ **Reset Passwords** (customer support - user locked out)  
✅ **Suspend/Activate Users** (security - terminate access immediately)  
✅ **View Feature Usage** (see what features they actually use)  
✅ **Extend Trial** (you already have this)  
✅ **Change Subscription Status** (you already have this)  
✅ **Verify Payments** (you already have this)  

### **What Super Admin SHOULD NOT Control:**

❌ **Create Employees** (company's internal data)  
❌ **Run Payroll** (company's financial operations)  
❌ **View Salaries** (already encrypted - good!)  
❌ **Approve Leave** (company's operational decisions)  
❌ **Edit Employee Details** (privacy)  

---

## 🎯 Recommended Implementation Priority

### **Quick Win (1-2 days):**
1. ✅ Add "Users & Roles" tab to Tenant Details page
2. ✅ Super admin can assign roles to users (Finance Manager, HR Manager, etc.)
3. ✅ Super admin can reset user passwords
4. ✅ Super admin can suspend/activate users

### **Medium Term (3-5 days):**
1. Add FeatureModule, PlanFeature, TenantFeature models
2. Seed default features in database
3. Add "Features & Permissions" tab to Tenant Details
4. Super admin can toggle features on/off
5. Link features to plans (Starter, Professional, Enterprise)

### **Long Term (1-2 weeks):**
1. Frontend feature gating (hide nav items based on features)
2. API feature checks (return 403 if feature not enabled)
3. Role-based permission system (Finance Manager can X, HR Manager can Y)
4. Usage analytics (track which features are used)
5. Upgrade prompts (if they try to use disabled feature)

---

## 💡 My Recommendations

### **Start Simple:**
1. **Roles First** - Implement user role management (easier, immediate value)
   - Super admin can assign Finance Manager, HR Manager roles
   - Super admin can reset passwords
   - This alone is very useful for customer support

2. **Features Second** - Add feature toggles after roles work
   - Start with just 3-4 key features: Approvals, Leave, Reports, Timesheets
   - Add more features as you sell them

3. **Don't Over-Engineer** - Keep it practical
   - You don't need 50 features initially
   - Focus on features that actually differentiate pricing
   - Add features as you discover what customers want

### **What to Tie to Pricing:**

**Starter ($25-35):**
- Basic features everyone needs
- Limited users/employees

**Professional ($45-75):**
- **Approvals** (workflow complexity)
- **Leave Management** (HR time savings)
- **Advanced Reports** (business insights)

**Enterprise ($100-250):**
- **Timesheets** (labor cost tracking)
- **Bank Integration** (automation)
- **Custom Integrations** (API access)

---

## 🚀 Want Me to Implement?

I can start with **Phase 1 (Quick Win)**:

1. Add "Users & Roles" management in Tenant Details
2. Super admin can:
   - View all users in a company
   - Assign roles (Finance Manager, HR Manager, Payroll Officer)
   - Reset passwords
   - Suspend/activate users
3. Backend API endpoints for user management
4. UI in the Tenant Details page

This gives you immediate customer support capabilities and sets foundation for feature-based pricing.

**Should I proceed with this?**
