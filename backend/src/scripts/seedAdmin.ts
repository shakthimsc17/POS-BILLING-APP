import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@posbilling.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    // Check if admin already exists
    const existingAdmin = await prisma.customer.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      // Update existing admin
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.customer.update({
        where: { email: adminEmail },
        data: {
          isAdmin: true,
          passwordHash,
        },
      });
      console.log('✅ Admin account updated:', adminEmail);
    } else {
      // Create new admin
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.customer.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          isAdmin: true,
        },
      });
      console.log('✅ Admin account created:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();

