import express, { Response } from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const DB_EXPORTS_DIR = 'db-exports';

/**
 * Serialize value for JSON backup (Prisma Decimal, Date, etc.)
 */
function serializeForBackup(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === 'object' && typeof (value as { toNumber?: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

/**
 * Fetch all DB data for backup (order respects FK for potential restore)
 */
async function fetchFullBackup() {
  const [
    customers,
    categories,
    items,
    itemCodePrefixes,
    companies,
    settings,
    permissions,
    salesCustomers,
    transactions,
    quickSaleItems,
    cashFlowEntries,
    activityLogs,
    carts,
    tables,
    tableOrders,
  ] = await Promise.all([
    prisma.customer.findMany(),
    prisma.category.findMany(),
    prisma.item.findMany(),
    prisma.itemCodePrefix.findMany(),
    prisma.company.findMany(),
    prisma.settings.findMany(),
    prisma.permission.findMany(),
    prisma.salesCustomer.findMany(),
    prisma.transaction.findMany(),
    prisma.quickSaleItem.findMany(),
    prisma.cashFlowEntry.findMany(),
    prisma.activityLog.findMany(),
    prisma.cart.findMany(),
    prisma.table.findMany(),
    prisma.tableOrder.findMany(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schema: 'pos-backup-v1',
    data: {
      customers,
      categories,
      items,
      itemCodePrefixes,
      companies,
      settings,
      permissions,
      salesCustomers,
      transactions,
      quickSaleItems,
      cashFlowEntries,
      activityLogs,
      carts,
      tables,
      tableOrders,
    },
  };
}

/**
 * GET /api/export-db
 * Admin only. Exports full DB as gzip-compressed JSON.
 * Creates db-exports/YYYY-MM-DD/ and saves a copy there; also returns file for download.
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.customer?.isAdmin) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const now = new Date();
    const dateFolder = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeSuffix = now.toISOString().slice(11, 19).replace(/:/g, '-'); // HH-mm-ss
    const baseName = `pos-backup-${dateFolder}_${timeSuffix}`;
    const jsonFileName = `${baseName}.json`;
    const gzFileName = `${baseName}.json.gz`;

    const exportRoot = path.join(process.cwd(), DB_EXPORTS_DIR);
    const dateDir = path.join(exportRoot, dateFolder);
    await fs.mkdir(dateDir, { recursive: true });

    const backup = await fetchFullBackup();
    const jsonString = JSON.stringify(backup, serializeForBackup as (key: string, value: unknown) => unknown);

    const gzPath = path.join(dateDir, gzFileName);
    const gzip = zlib.createGzip({ level: 9 });
    const readStream = Readable.from([jsonString]);
    const writeStream = fsSync.createWriteStream(gzPath);
    await pipeline(readStream, gzip, writeStream);

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${gzFileName}"`);
    const fileBuffer = await fs.readFile(gzPath);
    res.setHeader('Content-Length', String(fileBuffer.length));
    res.send(fileBuffer);
  } catch (error: any) {
    console.error('Export DB error:', error);
    res.status(500).json({ error: error?.message || 'Export failed' });
  }
});

export default router;
