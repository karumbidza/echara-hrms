# Super Admin Setup Instructions

## The Problem
Super admin account doesn't exist in production database (Railway), causing "Invalid credentials" error.

## Solution Options

### Option 1: Use the Setup Endpoint (Recommended)
Once Railway finishes deploying, run:
```bash
curl -X POST https://echara-hrms-production.up.railway.app/api/auth/setup-super-admin
```

This will create the super admin with:
- Email: `admin@echara.com`
- Password: `SuperAdmin123!`

### Option 2: Run the Script Directly on Railway
1. Go to Railway dashboard: https://railway.app
2. Open your project: `echara-hrms-production`
3. Go to the backend service
4. Click on "Variables" tab
5. Make sure `DATABASE_URL` is set
6. Click on "Deployments" tab
7. Open the latest deployment
8. Click "View Logs"
9. Once deployed, you can run commands in Railway's console

Or connect to Railway from your terminal:
```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the script on Railway
railway run npx ts-node src/utils/createSuperAdmin.ts
```

### Option 3: Use Prisma Studio on Production
```bash
# Connect to production database via Railway
railway run npx prisma studio

# Or if you have the DATABASE_URL
DATABASE_URL="your_railway_postgres_url" npx prisma studio
```

Then manually create a user with:
- Role: SUPER_ADMIN
- Email: admin@echara.com  
- Password: (hash of "SuperAdmin123!" - use bcrypt with 12 rounds)
- tenantId: null
- isActive: true

### Option 4: SQL Direct Insert
Connect to your Railway PostgreSQL database and run:

```sql
INSERT INTO users (id, email, password, "fullName", role, "isActive", "createdAt", "updatedAt", "tenantId")
VALUES (
  gen_random_uuid(),
  'admin@echara.com',
  '$2a$12$YourHashedPasswordHere', -- Replace with actual bcrypt hash
  'Super Administrator',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW(),
  NULL
);
```

To generate the password hash locally:
```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('SuperAdmin123!', 12));"
```

## Verifying Super Admin Exists

After creating, verify by trying to login:
```bash
curl -X POST https://echara-hrms-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@echara.com","password":"SuperAdmin123!"}'
```

Should return a JWT token and user object.

## Why This Happened

The local database has the super admin (created via `createSuperAdmin.ts`), but Railway's production database doesn't have it yet because:
1. The script needs to be run manually on production
2. Or the setup endpoint needs to be called once
3. Database migrations don't include data seeding

## Next Steps

1. Create super admin using one of the options above
2. Login at: https://echara-hrms.vercel.app/login
3. Access dashboard: https://echara-hrms.vercel.app/super-admin
4. **Change the password immediately** after first login
5. Seed the subscription plans if not done:
   ```bash
   curl -X POST https://echara-hrms-production.up.railway.app/api/tenants/seed-plans
   ```

## Security Note

The `setup-super-admin` endpoint should be removed or protected after initial setup. It's currently public for convenience.

## Troubleshooting

**"Route not found" error:**
- Railway deployment might still be in progress
- Wait 2-3 minutes after git push
- Check Railway deployment logs

**"Super admin already exists" message:**
- Super admin was created successfully
- Try logging in

**Database connection errors:**
- Check Railway DATABASE_URL is set correctly
- Ensure Prisma schema is synced: `railway run npx prisma db push`

**Schema mismatch errors:**
- Run migrations on Railway: `railway run npx prisma migrate deploy`
- Or push schema: `railway run npx prisma db push`
