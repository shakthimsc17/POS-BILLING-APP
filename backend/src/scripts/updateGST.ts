import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateItemsWithGST() {
  try {
    // Get the admin customer
    const adminCustomer = await prisma.customer.findUnique({
      where: { email: 'admin@posbilling.com' },
    });

    if (!adminCustomer) {
      console.log('❌ Admin customer not found.');
      return;
    }

    console.log('✅ Found admin customer:', adminCustomer.name);

    // Update existing items with GST rates
    const itemsToUpdate = [
      { code: 'CF-001', gstRate: 5 },
      { code: 'TE-001', gstRate: 5 },
      { code: 'SN-001', gstRate: 5 },
      { code: 'FF-001', gstRate: 12 },
      { code: 'BG-001', gstRate: 5 },
    ];

    for (const itemUpdate of itemsToUpdate) {
      const existingItem = await prisma.item.findFirst({
        where: {
          code: itemUpdate.code,
          customerId: adminCustomer.id,
        },
      });

      if (existingItem) {
        await prisma.item.update({
          where: { id: existingItem.id },
          data: { gstRate: itemUpdate.gstRate },
        });
        console.log(`✅ Updated ${existingItem.name} with GST rate ${itemUpdate.gstRate}%`);
      } else {
        console.log(`⚠️ Item ${itemUpdate.code} not found`);
      }
    }

    console.log('\n✅ GST rates updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating GST rates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateItemsWithGST();
