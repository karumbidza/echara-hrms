# ECHARA HRMS Security & Privacy Architecture

## 🔒 Data Protection Model

### Multi-Tenant Isolation

**Complete Data Separation:**
- Each tenant (company) has a unique `tenantId`
- All data queries automatically filter by `tenantId`
- Tenants CANNOT access other tenants' data
- Database-level row security ensures isolation

**Super Admin Limitations:**
- Super admin has NO `tenantId` (NULL)
- **CANNOT query tenant-specific data**
- Can only access:
  ✅ Tenant metadata (company name, subscription status)
  ✅ Aggregated statistics (counts, totals - no details)
  ✅ Platform settings (tax tables, NSSA rates)
  ❌ Employee personal information
  ❌ Salary data
  ❌ Payroll details
  ❌ Bank accounts
  ❌ National IDs

---

## 🔐 Encryption Strategy

### Field-Level Encryption

**Encrypted Fields in Employee Table:**
1. `nationalId` - National ID numbers
2. `basicSalary` - Salary amounts
3. `bankAccount` - Bank account numbers
4. `nssaNumber` - NSSA registration numbers

**Encryption Algorithm:**
- **AES-256-GCM** (Authenticated Encryption)
- **PBKDF2** key derivation (100,000 iterations)
- **Random salt** per record
- **Authentication tags** prevent tampering

**Encryption Key Management:**
```bash
# Set in environment variables
ENCRYPTION_KEY="your-32-character-secret-key"
```

⚠️ **CRITICAL**: Change default encryption key in production!

### Usage Example:

```typescript
import { encrypt, decrypt, maskSensitive } from './utils/encryption';

// Encrypting sensitive data
const employee = await prisma.employee.create({
  data: {
    ...employeeData,
    nationalId: encrypt(req.body.nationalId),
    basicSalary: encrypt(req.body.basicSalary.toString()),
    bankAccount: encrypt(req.body.bankAccount),
    nssaNumber: encrypt(req.body.nssaNumber)
  }
});

// Decrypting for authorized access
const decryptedId = decrypt(employee.nationalId);
const decryptedSalary = parseFloat(decrypt(employee.basicSalary) || '0');

// Masking for display (showing last 4 digits)
const maskedAccount = maskSensitive(employee.bankAccount, 4); // ****7890
```

---

## 🎯 Access Control Matrix

| Data Type | Super Admin | Tenant Admin | HR Manager | Employee |
|-----------|------------|--------------|------------|----------|
| Tenant list | ✅ View All | ❌ | ❌ | ❌ |
| Platform settings | ✅ Edit | ❌ | ❌ | ❌ |
| Subscription status | ✅ View/Edit | ✅ View | ❌ | ❌ |
| Employee names | ❌ | ✅ | ✅ | ✅ Own only |
| Salaries | ❌ | ✅ | ✅ | ✅ Own only |
| Bank accounts | ❌ | ✅ | ✅ | ✅ Own only |
| National IDs | ❌ | ✅ | ✅ | ✅ Own only |
| Payroll runs | ❌ | ✅ | ✅ | ✅ Own payslip |
| Tax calculations | ❌ | ✅ | ✅ | ✅ Own only |

---

## 📊 Platform Settings (Super Admin)

### What Super Admin Manages:

**1. ZIMRA Tax Tables** (Zimbabwe Revenue Authority)
```json
{
  "taxYear": 2025,
  "taxBrackets": [
    {"min": 0, "max": 120000, "rate": 0, "deduction": 0},
    {"min": 120001, "max": 360000, "rate": 20, "deduction": 24000},
    {"min": 360001, "max": 720000, "rate": 25, "deduction": 42000},
    {"min": 720001, "max": 1200000, "rate": 30, "deduction": 78000},
    {"min": 1200001, "max": 9999999999, "rate": 35, "deduction": 138000}
  ],
  "aidsLevyRate": 3.0
}
```

**2. NSSA Contribution Rates** (National Social Security Authority)
```json
{
  "nssaEmployeeRate": 3.0,    // % of gross
  "nssaEmployerRate": 3.5,    // % of gross
  "nssaUpperLimit": 1000,     // Monthly cap in USD
  "nssaLowerLimit": 0
}
```

**3. Minimum Wage**
```json
{
  "minimumWage": 100  // USD per month
}
```

### API Endpoints:

```bash
# Get platform settings
GET /api/platform/settings
Authorization: Bearer {super_admin_token}

# Update settings
PUT /api/platform/settings
Authorization: Bearer {super_admin_token}
Content-Type: application/json
{
  "taxYear": 2025,
  "taxBrackets": [...],
  "nssaEmployeeRate": 3.0,
  "nssaEmployerRate": 3.5
}

# Get settings history (audit trail)
GET /api/platform/settings/history
Authorization: Bearer {super_admin_token}
```

---

## 🛡️ Data Privacy Guarantees

### For Tenant Companies:

**We CANNOT See:**
1. ❌ Employee salaries or compensation
2. ❌ Personal identification numbers
3. ❌ Bank account details
4. ❌ Payroll calculations or amounts
5. ❌ Leave balances or deductions
6. ❌ Performance reviews or personal notes

**We CAN See:**
1. ✅ Company name and contact info
2. ✅ Number of employees (count only, no names)
3. ✅ Number of payroll runs (count only, no amounts)
4. ✅ Subscription status and billing info
5. ✅ Platform usage metrics (logins, API calls)

### Technical Implementation:

**Database Queries:**
```typescript
// Super admin query - NO access to tenant data
const tenants = await prisma.tenant.findMany({
  include: {
    _count: {
      select: {
        users: true,
        employees: true,
        payrollRuns: true
      }
    }
  }
});
// Returns: { name: "ABC Corp", _count: { employees: 50 } }
// Does NOT return: employee names, salaries, etc.

// Tenant query - full access to OWN data only
const employees = await prisma.employee.findMany({
  where: { tenantId: req.user.tenantId } // Automatic filtering
});
```

---

## 🔍 Audit Trail

### What We Log:

1. **Platform Settings Changes** (Super Admin actions)
   - Who changed what settings
   - Old vs new values
   - Timestamp

2. **Tenant Actions** (Within each company)
   - User logins
   - Payroll submissions/approvals
   - Employee data changes
   - All stored within tenant's own database space

3. **Subscription Events**
   - Plan changes
   - Payment attempts
   - Trial expirations

**Audit Log Access:**
- Super admin: Platform-level events only
- Tenant admin: Own company's events only

---

## 🚨 Security Best Practices

### For Platform Operators:

1. **Set Strong Encryption Key**
   ```bash
   # Generate secure key
   openssl rand -hex 32
   
   # Set in environment
   export ENCRYPTION_KEY="your-generated-key-here"
   ```

2. **Rotate Keys Periodically**
   - Plan for key rotation every 6-12 months
   - Requires re-encryption of existing data

3. **Monitor Access**
   - Review super admin audit logs
   - Alert on unusual platform settings changes

4. **Database Backups**
   - Encrypted backups
   - Stored securely
   - Regular restore testing

### For Tenant Companies:

1. **Strong Passwords**
   - Enforce minimum 12 characters
   - Require special characters

2. **Role-Based Access**
   - Limit who can see salaries
   - Separate payroll and HR roles

3. **Regular Audits**
   - Review who accessed what
   - Check for unauthorized changes

4. **Data Exports**
   - Encrypted CSV exports
   - Secure file transmission

---

## 📋 Compliance

### GDPR/POPIA Compliance:

- ✅ Data minimization (only collect what's needed)
- ✅ Purpose limitation (payroll processing only)
- ✅ Storage limitation (retain as required by law)
- ✅ Integrity and confidentiality (encryption)
- ✅ Right to access (employees can view own data)
- ✅ Right to erasure (can delete ex-employees)
- ✅ Data portability (CSV exports)

### Zimbabwe Compliance:

- ✅ ZIMRA tax calculations (accurate and auditable)
- ✅ NSSA reporting (compliant formats)
- ✅ Labour Act requirements (payslips, records)
- ✅ Data Protection Act (secure storage)

---

## 🧪 Testing Security

### Verify Data Isolation:

```bash
# Test 1: Super admin cannot access employee data
curl -H "Authorization: Bearer {super_admin_token}" \
  https://api.echara.com/api/employees
# Expected: 403 Forbidden or empty results

# Test 2: Tenant A cannot access Tenant B data
curl -H "Authorization: Bearer {tenant_a_token}" \
  https://api.echara.com/api/employees
# Expected: Only Tenant A's employees

# Test 3: Encryption works
# Create employee with salary
# Verify database contains encrypted string, not plain number
```

---

## 📞 Security Incident Response

If you discover a security issue:

1. **DO NOT** post publicly
2. Email: security@echara.com
3. Include:
   - Description of issue
   - Steps to reproduce
   - Potential impact
   - Your contact info

Response time: 24 hours

---

**Last Updated**: November 24, 2025
**Security Review**: Quarterly
**Penetration Testing**: Annual
