import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function deleteCustomer() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: npm run delete:customer <email>');
      process.exit(1);
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (!customer) {
      console.log(`❌ No customer found with email: ${cleanEmail}`);
      process.exit(1);
    }

    console.log(`\nFound customer: ${customer.name} (${customer.email})`);
    console.log(`Admin: ${customer.isAdmin ? 'Yes' : 'No'}`);
    console.log(`Created: ${customer.createdAt.toLocaleString()}`);
    
    // Delete customer (this will cascade delete related data)
    await prisma.customer.delete({
      where: { email: cleanEmail },
    });

    console.log(`\n✅ Customer deleted successfully: ${cleanEmail}\n`);
  } catch (error: any) {
    console.error('❌ Error deleting customer:', error.message);
    if (error.code === 'P2025') {
      console.log('Customer not found in database.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCustomer();
