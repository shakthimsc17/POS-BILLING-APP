import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function listCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n📋 Registered Customers:');
    console.log('='.repeat(60));
    
    if (customers.length === 0) {
      console.log('No customers found in the database.');
    } else {
      customers.forEach((customer, index) => {
        console.log(`\n${index + 1}. ${customer.name}`);
        console.log(`   Email: ${customer.email}`);
        console.log(`   Admin: ${customer.isAdmin ? 'Yes' : 'No'}`);
        console.log(`   Created: ${customer.createdAt.toLocaleString()}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${customers.length} customer(s)\n`);
  } catch (error) {
    console.error('❌ Error listing customers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

listCustomers();
