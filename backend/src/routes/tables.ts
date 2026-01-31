import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all tables
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      where: { customerId: req.customerId! },
      orderBy: { tableNumber: 'asc' },
    });

    res.json(tables.map(table => ({
      id: table.id,
      customer_id: table.customerId,
      table_number: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
      created_at: table.createdAt.toISOString(),
      updated_at: table.updatedAt.toISOString(),
    })));
  } catch (error: any) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tables' });
  }
});

// Get tables by status
router.get('/status', [
  query('status').isIn(['available', 'occupied', 'reserved']),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const status = req.query.status as string;
    const tables = await prisma.table.findMany({
      where: {
        customerId: req.customerId!,
        status,
      },
      orderBy: { tableNumber: 'asc' },
    });

    res.json(tables.map(table => ({
      id: table.id,
      customer_id: table.customerId,
      table_number: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
      created_at: table.createdAt.toISOString(),
      updated_at: table.updatedAt.toISOString(),
    })));
  } catch (error: any) {
    console.error('Error fetching tables by status:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tables' });
  }
});

// Create new table
router.post(
  '/',
  [
    body('table_number').notEmpty().trim(),
    body('capacity').optional().isInt({ min: 1, max: 50 }),
    body('status').optional().isIn(['available', 'occupied', 'reserved']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { table_number, capacity, status } = req.body;

      // Check if table number already exists for this customer
      const existing = await prisma.table.findUnique({
        where: {
          customerId_tableNumber: {
            customerId: req.customerId!,
            tableNumber: table_number,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Table number already exists' });
      }

      const table = await prisma.table.create({
        data: {
          customerId: req.customerId!,
          tableNumber: table_number,
          capacity: capacity || 4,
          status: status || 'available',
        },
      });

      res.status(201).json({
        id: table.id,
        customer_id: table.customerId,
        table_number: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
        created_at: table.createdAt.toISOString(),
        updated_at: table.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating table:', error);
      res.status(500).json({ error: error.message || 'Failed to create table' });
    }
  }
);

// Update table
router.put(
  '/:id',
  [
    body('table_number').optional().notEmpty().trim(),
    body('capacity').optional().isInt({ min: 1, max: 50 }),
    body('status').optional().isIn(['available', 'occupied', 'reserved']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { table_number, capacity, status } = req.body;

      // Check if table exists and belongs to customer
      const existing = await prisma.table.findFirst({
        where: {
          id,
          customerId: req.customerId!,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Table not found' });
      }

      // If updating table number, check for duplicates
      if (table_number && table_number !== existing.tableNumber) {
        const duplicate = await prisma.table.findUnique({
          where: {
            customerId_tableNumber: {
              customerId: req.customerId!,
              tableNumber: table_number,
            },
          },
        });

        if (duplicate) {
          return res.status(400).json({ error: 'Table number already exists' });
        }
      }

      const updateData: any = {};
      if (table_number !== undefined) updateData.tableNumber = table_number;
      if (capacity !== undefined) updateData.capacity = capacity;
      if (status !== undefined) updateData.status = status;

      const table = await prisma.table.update({
        where: { id },
        data: updateData,
      });

      res.json({
        id: table.id,
        customer_id: table.customerId,
        table_number: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
        created_at: table.createdAt.toISOString(),
        updated_at: table.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating table:', error);
      res.status(500).json({ error: error.message || 'Failed to update table' });
    }
  }
);

// Delete table
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if table exists and belongs to customer
    const existing = await prisma.table.findFirst({
      where: {
        id,
        customerId: req.customerId!,
      },
      include: {
        orders: {
          where: {
            status: 'pending',
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if there are pending orders
    if (existing.orders.length > 0) {
      return res.status(400).json({ error: 'Cannot delete table with pending orders' });
    }

    await prisma.table.delete({
      where: { id },
    });

    res.json({ message: 'Table deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: error.message || 'Failed to delete table' });
  }
});

export default router;
