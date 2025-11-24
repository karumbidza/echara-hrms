import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@echara.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const fullName = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

    // Check if super admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log('⚠️  Super admin already exists with email:', email);
      console.log('To reset, delete the user first or use a different email.');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create super admin user (no tenantId - platform admin)
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'SUPER_ADMIN',
        isActive: true,
        // No tenantId - this is a platform administrator
      }
    });

    console.log('✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', fullName);
    console.log('🆔 User ID:', superAdmin.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🌐 Login at: https://echara-hrms.vercel.app/login');
    console.log('📊 Super Admin Dashboard: https://echara-hrms.vercel.app/super-admin\n');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
