import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all items
router.get('/', async (req: AuthRequest, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { customerId: req.customerId! },
      orderBy: { createdAt: 'desc' },
    });

    res.json(items);
  } catch (error: any) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch items' });
  }
});

// Search items
router.get('/search', [query('q').notEmpty()], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchQuery = req.query.q as string;
    const searchTerm = `%${searchQuery}%`;

    const items = await prisma.$queryRaw`
      SELECT * FROM items
      WHERE customer_id = ${req.customerId}
        AND (
          name ILIKE ${searchTerm}
          OR code ILIKE ${searchTerm}
          OR barcode ILIKE ${searchTerm}
        )
      ORDER BY created_at DESC
    `;

    res.json(items);
  } catch (error: any) {
    console.error('Error searching items:', error);
    res.status(500).json({ error: error.message || 'Failed to search items' });
  }
});

// Get item by barcode
router.get('/barcode/:barcode', async (req: AuthRequest, res) => {
  try {
    const { barcode } = req.params;

    const item = await prisma.item.findFirst({
      where: {
        barcode,
        customerId: req.customerId!,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error: any) {
    console.error('Error fetching item by barcode:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch item' });
  }
});

// Create item
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('code').notEmpty().trim(),
    body('cost').isFloat({ min: 0 }),
    body('price').isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        code,
        barcode,
        categoryId,
        subcategory,
        cost,
        price,
        mrp,
        stock,
        imageUrl,
      } = req.body;

      const item = await prisma.item.create({
        data: {
          customerId: req.customerId!,
          name,
          code,
          barcode,
          categoryId,
          subcategory,
          cost: parseFloat(cost),
          price: parseFloat(price),
          mrp: mrp ? parseFloat(mrp) : null,
          stock: stock ? parseInt(stock) : 0,
          imageUrl,
        },
      });

      res.status(201).json(item);
    } catch (error: any) {
      console.error('Error creating item:', error);
      res.status(500).json({ error: error.message || 'Failed to create item' });
    }
  }
);

// Update item
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('code').optional().notEmpty().trim(),
    body('cost').optional().isFloat({ min: 0 }),
    body('price').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const {
        name,
        code,
        barcode,
        categoryId,
        subcategory,
        cost,
        price,
        mrp,
        stock,
        imageUrl,
      } = req.body;

      // Verify ownership
      const existing = await prisma.item.findFirst({
        where: { id, customerId: req.customerId! },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (code) updateData.code = code;
      if (barcode !== undefined) updateData.barcode = barcode;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (subcategory !== undefined) updateData.subcategory = subcategory;
      if (cost !== undefined) updateData.cost = parseFloat(cost);
      if (price !== undefined) updateData.price = parseFloat(price);
      if (mrp !== undefined) updateData.mrp = mrp ? parseFloat(mrp) : null;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

      const item = await prisma.item.update({
        where: { id },
        data: updateData,
      });

      res.json(item);
    } catch (error: any) {
      console.error('Error updating item:', error);
      res.status(500).json({ error: error.message || 'Failed to update item' });
    }
  }
);

// Delete item
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.item.findFirst({
      where: { id, customerId: req.customerId! },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.item.delete({
      where: { id },
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: error.message || 'Failed to delete item' });
  }
});

export default router;
