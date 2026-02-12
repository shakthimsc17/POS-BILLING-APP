import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding UOMs...');

  // Get all customers? Or just seed for a specific customer?
  // The system seems multi-tenant by customerId.
  // I should probably seed for all existing customers.
  
  const customers = await prisma.customer.findMany();

  for (const customer of customers) {
    console.log(`Seeding UOMs for customer: ${customer.name} (${customer.id})`);

    // --- WEIGHT ---
    const kg = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Kilograms',
        code: 'KG',
        category: 'weight',
        isBaseUom: true,
        conversionFactor: 1.0,
      }
    });

    const g = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Grams',
        code: 'G',
        category: 'weight',
        baseUomId: kg.id,
        conversionFactor: 0.001,
      }
    });

    const mg = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Milligrams',
        code: 'MG',
        category: 'weight',
        baseUomId: kg.id,
        conversionFactor: 0.000001,
      }
    });

    // --- VOLUME ---
    const l = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Liters',
        code: 'L',
        category: 'volume',
        isBaseUom: true,
        conversionFactor: 1.0,
      }
    });

    const ml = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Milliliters',
        code: 'ML',
        category: 'volume',
        baseUomId: l.id,
        conversionFactor: 0.001,
      }
    });

    // --- LENGTH ---
    const m = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Meters',
        code: 'M',
        category: 'length',
        isBaseUom: true,
        conversionFactor: 1.0,
      }
    });

    const cm = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Centimeters',
        code: 'CM',
        category: 'length',
        baseUomId: m.id,
        conversionFactor: 0.01,
      }
    });

    // --- PIECES ---
    const pcs = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Pieces',
        code: 'PCS',
        category: 'pieces',
        isBaseUom: true,
        conversionFactor: 1.0,
      }
    });

    const doz = await prisma.uomMaster.create({
      data: {
        customerId: customer.id,
        name: 'Dozens',
        code: 'DOZ',
        category: 'pieces',
        baseUomId: pcs.id,
        conversionFactor: 12.0,
      }
    });

    console.log('Created standard UOMs');

    // --- CONVERSIONS ---
    // Create direct conversions for convenience
    
    // KG <-> G
    await prisma.uomConversion.create({
      data: {
        customerId: customer.id,
        fromUomId: kg.id,
        toUomId: g.id,
        conversionFactor: 1000.0,
      }
    });
    await prisma.uomConversion.create({
      data: {
        customerId: customer.id,
        fromUomId: g.id,
        toUomId: kg.id,
        conversionFactor: 0.001,
      }
    });

    // L <-> ML
    await prisma.uomConversion.create({
      data: {
        customerId: customer.id,
        fromUomId: l.id,
        toUomId: ml.id,
        conversionFactor: 1000.0,
      }
    });
    await prisma.uomConversion.create({
      data: {
        customerId: customer.id,
        fromUomId: ml.id,
        toUomId: l.id,
        conversionFactor: 0.001,
      }
    });

    console.log('Created standard conversions');

    // --- UPDATE EXISTING ITEMS ---
    // Set default UOM to PCS for items that have no UOM
    const result = await prisma.item.updateMany({
      where: {
        customerId: customer.id,
        uomId: null,
      },
      data: {
        uomId: pcs.id,
      }
    });

    console.log(`Updated ${result.count} items to default 'Pieces' UOM`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
