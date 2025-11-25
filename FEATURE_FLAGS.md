# Feature Flag System

## Overview
The HRMS uses a subscription-based feature flag system to control which features are visible to users based on their subscription plan.

## Available Feature Flags

| Feature Flag | Description | Starter | Professional | Enterprise |
|-------------|-------------|---------|--------------|------------|
| `employees` | Employee management | ✅ | ✅ | ✅ |
| `departments` | Department management | ✅ | ✅ | ✅ |
| `payroll` | Payroll processing | ✅ | ✅ | ✅ |
| `leave` | Leave management | ✅ | ✅ | ✅ |
| `documents` | Document uploads | ✅ | ✅ | ✅ |
| `contracts` | Contract management | ❌ | ✅ | ✅ |
| `leaveApprovals` | Leave approval workflow | ❌ | ✅ | ✅ |
| `payrollApprovals` | Payroll approval workflow | ❌ | ✅ | ✅ |
| `reports` | Advanced reporting | ❌ | ❌ | ✅ |
| `timesheets` | Time tracking | ❌ | ❌ | ✅ |
| `analytics` | Analytics dashboard | ❌ | ❌ | ✅ |
| `customFields` | Custom employee fields | ❌ | ❌ | ✅ |
| `apiAccess` | REST API access | ❌ | ❌ | ✅ |

## Implementation

### Backend

**Setting Plan Features:**
```typescript
// In prisma/seed.ts
const plan = await prisma.plan.create({
  data: {
    name: 'Professional',
    features: ['employees', 'departments', 'contracts', 'leaveApprovals']
  }
});
```

**Loading Features in Auth:**
```typescript
// In authController.ts - login and getProfile endpoints
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    tenant: {
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: { select: { features: true } } }
        }
      }
    }
  }
});

// Features are extracted and sent to frontend
const features = user.tenant.subscriptions[0].plan.features;
```

### Frontend

**AuthContext Setup:**
```typescript
// In AuthContext.tsx
interface TenantFeatures {
  employees: boolean;
  departments: boolean;
  contracts: boolean;
  // ... more features
}

const { hasFeature } = useAuth();
```

**Using in Components:**
```typescript
// In Navigation.tsx
{hasFeature('contracts') && (
  <Nav.Link href="/contracts">Contracts</Nav.Link>
)}

{hasFeature('leaveApprovals') && ['ADMIN', 'MANAGER'].includes(user.role) && (
  <Nav.Link href="/leave-approvals">Leave Approvals</Nav.Link>
)}
```

**Combining with Role-Based Access:**
```typescript
// Feature flag + role check
const showContracts = hasFeature('contracts') && ['ADMIN', 'MANAGER'].includes(user.role);
```

## Navigation Structure

### Control Center Dropdown
- Employees (if `employees` feature enabled)
- Departments (if `departments` feature enabled)
- Contracts (if `contracts` feature enabled AND user is ADMIN/MANAGER)

### Approvals Dropdown
- Leave Approvals (if `leaveApprovals` feature enabled AND user is ADMIN/MANAGER)
- Payroll Approvals (if `payrollApprovals` feature enabled AND user is ADMIN/GENERAL_MANAGER/FINANCE_MANAGER)

### Standalone Items
- Dashboard (always visible)
- Payroll (if `payroll` feature enabled)
- Leave (if `leave` feature enabled)

## Adding New Features

1. **Update Plan Seeds:**
```typescript
// In prisma/seed.ts
const plan = await prisma.plan.update({
  where: { slug: 'enterprise' },
  data: {
    features: [...existingFeatures, 'newFeature']
  }
});
```

2. **Add to TenantFeatures Interface:**
```typescript
// In AuthContext.tsx
interface TenantFeatures {
  // ... existing features
  newFeature: boolean;
}
```

3. **Update Default Features:**
```typescript
// In AuthContext.tsx
const defaultFeatures: TenantFeatures = {
  // ... existing features
  newFeature: false  // Default to false
};
```

4. **Use in Components:**
```typescript
{hasFeature('newFeature') && (
  <YourComponent />
)}
```

## Testing

Run the seed script to populate features:
```bash
cd backend
npm run db:seed
```

## Best Practices

1. **Always check features before showing UI elements**
2. **Combine feature flags with role-based access when needed**
3. **Provide graceful fallbacks** if a feature is disabled
4. **Keep feature names consistent** across backend and frontend
5. **Document new features** in this file when added
6. **Default to false** for new features in defaultFeatures

## Troubleshooting

**Features not showing:**
- Check if tenant has an active subscription
- Verify plan includes the feature in `features` array
- Check browser console for `hasFeature` calls
- Verify user role meets requirements (if combined with role checks)

**All features showing:**
- Default features in AuthContext may be set to true
- Check if features are properly loaded from subscription
- Verify subscription status is 'ACTIVE'
