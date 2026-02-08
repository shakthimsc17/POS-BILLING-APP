import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSampleItems() {
  try {
    // Get the admin customer (assuming it exists)
    const adminCustomer = await prisma.customer.findUnique({
      where: { email: 'admin@posbilling.com' },
    });

    if (!adminCustomer) {
      console.log('❌ Admin customer not found. Please run seedAdmin first.');
      return;
    }

    console.log('✅ Found admin customer:', adminCustomer.name);

    // Create sample categories first
    const categories = [];
    const categoryNames = ['Beverages', 'Snacks', 'Meals'];
    
    for (const categoryName of categoryNames) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: categoryName,
          customerId: adminCustomer.id,
        },
      });

      if (!existingCategory) {
        const category = await prisma.category.create({
          data: {
            name: categoryName,
            customerId: adminCustomer.id,
          },
        });
        categories.push(category);
        console.log(`✅ Created category: ${categoryName}`);
      } else {
        categories.push(existingCategory);
        console.log(`✅ Using existing category: ${categoryName}`);
      }
    }

    // Create sample items with mapping codes
    const sampleItems = [
      { name: 'Coffee', code: 'CF-001', mappingCode: '1', price: 50, cost: 30, stock: 100, categoryName: 'Beverages' },
      { name: 'Tea', code: 'TE-001', mappingCode: '2', price: 30, cost: 20, stock: 100, categoryName: 'Beverages' },
      { name: 'Sandwich', code: 'SN-001', mappingCode: '3', price: 80, cost: 50, stock: 50, categoryName: 'Meals' },
      { name: 'French Fries', code: 'FF-001', mappingCode: '4', price: 60, cost: 35, stock: 80, categoryName: 'Snacks' },
      { name: 'Burger', code: 'BG-001', mappingCode: '5', price: 120, cost: 80, stock: 40, categoryName: 'Meals' },
    ];

    for (const itemData of sampleItems) {
      const existingItem = await prisma.item.findFirst({
        where: {
          code: itemData.code,
          customerId: adminCustomer.id,
        },
      });

      if (!existingItem) {
        const category = categories.find(c => c.name === itemData.categoryName);
        
        const item = await prisma.item.create({
          data: {
            name: itemData.name,
            code: itemData.code,
            mappingCode: itemData.mappingCode,
            price: itemData.price,
            cost: itemData.cost,
            stock: itemData.stock,
            customerId: adminCustomer.id,
            categoryId: category?.id,
          },
        });
        console.log(`✅ Created item: ${itemData.name} (mapping code: ${itemData.mappingCode})`);
      } else {
        console.log(`✅ Item already exists: ${itemData.name}`);
      }
    }

    console.log('\n✅ Sample items seeded successfully!');
    console.log('You can now test adding items to cart using mapping codes 1-5');
    
  } catch (error) {
    console.error('❌ Error seeding sample items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSampleItems();
