import prisma from '../db/prisma.js';

async function checkTableStructure() {
  try {
    const items = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items' ORDER BY ordinal_position` as any[];
    console.log('Items table columns:');
    items.forEach((col: any) => console.log(`  ${col.column_name}: ${col.data_type}`));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();
