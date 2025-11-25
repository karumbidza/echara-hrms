# Contract Management System - User Guide

## Overview
The contract management system helps HR track employee contract expiry dates and manage renewals. It automatically notifies admins 2 weeks before fixed-term contracts expire.

## Contract Types

### 1. **PERMANENT**
- Default contract type
- No expiry date required
- For permanent employees with indefinite contracts

### 2. **FIXED_TERM / PERIOD**
- Temporary employment with a specific end date
- **Requires contract end date**
- System sends notifications 14 days before expiry
- Suitable for: Project-based staff, seasonal workers, temporary replacements

### 3. **PROBATION**
- Initial trial period for new hires
- Optional probation end date
- Typically 3-6 months from hire date
- After probation, contract type should be updated to PERMANENT or FIXED_TERM

## How It Works

### Adding a New Employee

1. **Navigate to Employees** → Click "Add Employee"

2. **Select Contract Type** (in Employment Information section):
   - Choose from: Permanent, Fixed Term, or Probation

3. **Enter Contract Dates**:
   - **Hire Date**: First day of employment (required)
   - **Contract Start Date**: Usually same as hire date
   - **Contract End Date**: Required for FIXED_TERM contracts
   - **Probation End Date**: For PROBATION contracts

4. **Save**: Contract monitoring begins automatically

### Viewing Contract Information

**In Employee View:**
- Contract type displayed with color-coded badge
- Contract end date shown with warnings:
  - 🟡 **"Expiring Soon"** badge: < 14 days remaining
  - 🔴 **"Expired"** badge: Past end date
- Renewal decision status (if made)
- Notice given date

### Contract Notifications Page

**Access:** Navigation → Contracts (Admin/Manager only)

**Dashboard Summary Cards:**
- Expiring in 30 Days
- Pending Actions (requires decision)
- Total Fixed Term Contracts
- Total on Probation

**Actions:**
1. **Check Expiring Contracts Button**:
   - Manually trigger contract expiry check
   - System scans for contracts expiring in next 14 days
   - Creates notifications for contracts without decisions

2. **Notifications Table**:
   - Lists all pending contract renewals
   - Color coding:
     - 🔴 Red row: Expired or critical (< 7 days)
     - 🟡 Yellow row: Urgent (7-14 days)
     - White row: > 14 days
   - Shows days remaining with urgency badges

### Making Renewal Decisions

1. **Click "Make Decision"** button for any notification

2. **Review Employee Info**:
   - Name, contract end date, days remaining

3. **Choose Decision**:
   - ✅ **Renew Contract**: Continue employment
   - ❌ **Do Not Renew**: Terminate at contract end

4. **Add Notes**: Document reason for decision

5. **Confirm**: Decision is recorded and employee record updated

### What Happens After Decision

**Employee Record Updates:**
- Notice given: ✅ Yes
- Notice given date: Recorded
- Renewal decision: Displayed in View Employee
- Renewal notes: Saved for reference

**If Renewing:**
- Update employee's contract end date to new date
- Contract monitoring continues

**If Not Renewing:**
- Follow company termination procedures
- Employee should be deactivated on contract end date
- Keep employee record for compliance/archives

## Automation (Future Enhancement)

The system can be configured with a daily cron job to:
- Automatically check for expiring contracts
- Send email notifications to HR/Managers
- Generate reports of upcoming expirations

**To enable automation**, add to your scheduler:
```bash
# Check daily at 9 AM
0 9 * * * curl -X POST https://your-api.com/api/contracts/check-expiring
```

## Best Practices

### For HR/Admin:

1. **Daily Checks**: Review contract notifications daily
2. **2-Week Rule**: Make decisions at least 2 weeks before expiry
3. **Documentation**: Always add notes explaining renewal decisions
4. **Communication**: Inform employees of renewal decisions promptly
5. **Update Records**: If renewing, update contract end date immediately

### For Managers:

1. **Performance Review**: Complete before renewal decision
2. **Budget Approval**: Ensure funding for contract renewal
3. **Team Needs**: Assess if role is still required
4. **Succession Planning**: Consider permanent conversion if appropriate

### Contract Type Selection:

- **Use PERMANENT for**: Core staff, indefinite positions
- **Use FIXED_TERM for**: Project work, maternity cover, peak season
- **Use PROBATION for**: All new hires during trial period

## Legal Compliance (Zimbabwe)

⚠️ **Important Legal Notes:**

1. **Notice Period**: Labour Act requires written notice of non-renewal
2. **Consecutive Fixed Terms**: Multiple fixed-term contracts may create permanent employment rights
3. **Documentation**: Keep all renewal decisions documented
4. **Fair Treatment**: Ensure non-renewal decisions are fair and justified

## Reporting

### Available Reports:
- Contracts expiring in next 30/60/90 days
- Renewal decision history
- Fixed-term contract trends
- Probation completion rates

## Troubleshooting

**Q: Notification not appearing?**
- Click "Check Expiring Contracts" button
- Verify contract end date is set
- Ensure contract type is FIXED_TERM
- Check if decision already made (notice given = Yes)

**Q: Need to extend contract?**
- Make "Renew" decision first
- Edit employee → Update contract end date
- New notifications will trigger for new end date

**Q: Wrong decision made?**
- Contact system administrator
- Can be updated directly in employee edit form
- Update "Renewal Decision" and "Renewal Notes"

## Support

For questions or issues, contact:
- HR Administrator
- System Support: support@echarahrms.com
- Emergency: Check MULTI_TENANT_GUIDE.md for technical details
