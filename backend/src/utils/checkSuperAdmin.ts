import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking for super admin...\n');

    const admin = await prisma.user.findUnique({
      where: { email: 'admin@echara.com' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true
      }
    });

    if (admin) {
      console.log('✅ Super Admin Found:');
      console.log(JSON.stringify(admin, null, 2));
    } else {
      console.log('❌ Super Admin NOT found');
      console.log('Run: npx ts-node src/utils/createSuperAdmin.ts');
    }

    // Also check all users
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        tenantId: true
      }
    });

    console.log('\n📊 All users in database:', allUsers.length);
    console.log(JSON.stringify(allUsers, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
