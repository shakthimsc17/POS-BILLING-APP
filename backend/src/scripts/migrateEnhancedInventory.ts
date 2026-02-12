import prisma from '../db/prisma.js';

async function migrateEnhancedInventory() {
  console.log('🚀 Starting enhanced inventory migration...');

  try {
    // Create default supplier for existing items
    console.log('📦 Creating default suppliers...');
    const customers = await prisma.$queryRaw`SELECT DISTINCT customer_id FROM items WHERE supplier_id IS NULL` as any[];
    
    for (const customer of customers) {
      const customerId = customer.customer_id;
      
      // Check if default supplier already exists
      const existingDefaultSupplier = await prisma.supplier.findFirst({
        where: { 
          customerId,
          name: 'Default Supplier' 
        },
      });

      if (!existingDefaultSupplier) {
        await prisma.supplier.create({
          data: {
            customerId,
            name: 'Default Supplier',
            code: 'DEF001',
            isActive: true,
          },
        });
        console.log(`✅ Created default supplier for customer: ${customerId}`);
      }
    }

    // Since brand column was removed, we'll create some sample brands for demonstration
    console.log('🏷️  Creating sample brands...');
    const customersWithItems = await prisma.$queryRaw`SELECT DISTINCT customer_id FROM items` as any[];
    
    for (const customer of customersWithItems) {
      const customerId = customer.customer_id;
      
      // Create some sample brands
      const sampleBrands = [
        { name: 'Generic Brand', code: 'GENR' },
        { name: 'Premium Brand', code: 'PREM' },
        { name: 'Standard Brand', code: 'STND' },
      ];
      
      for (const brandData of sampleBrands) {
        const existingBrand = await prisma.brand.findFirst({
          where: { 
            customerId,
            name: brandData.name 
          },
        });

        if (!existingBrand) {
          await prisma.brand.create({
            data: {
              customerId,
              name: brandData.name,
              code: brandData.code,
              isActive: true,
            },
          });
          console.log(`✅ Created brand: ${brandData.name} for customer: ${customerId}`);
        }
      }
    }

    // Assign default supplier to items without suppliers
    console.log('🏢 Assigning default suppliers to items...');
    const defaultSuppliers = await prisma.supplier.findMany({
      where: { name: 'Default Supplier' },
    });

    for (const defaultSupplier of defaultSuppliers) {
      await prisma.item.updateMany({
        where: {
          customerId: defaultSupplier.customerId,
          supplierId: null,
        },
        data: {
          supplierId: defaultSupplier.id,
        },
      });
      console.log(`✅ Assigned default supplier to items for customer: ${defaultSupplier.customerId}`);
    }

    // Verification
    console.log('📊 Migration verification:');
    const brandCount = await prisma.brand.count();
    const supplierCount = await prisma.supplier.count();
    const itemsWithBrand = await prisma.item.count({
      where: { brandId: { not: null } },
    });
    const itemsWithSupplier = await prisma.item.count({
      where: { supplierId: { not: null } },
    });

    console.log(`   Brands created: ${brandCount}`);
    console.log(`   Suppliers created: ${supplierCount}`);
    console.log(`   Items with brand: ${itemsWithBrand}`);
    console.log(`   Items with supplier: ${itemsWithSupplier}`);

    console.log('✅ Enhanced inventory migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateEnhancedInventory()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default migrateEnhancedInventory;
