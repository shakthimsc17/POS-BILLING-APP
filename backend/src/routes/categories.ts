import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all categories
router.get('/', async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { customerId: req.customerId! },
      orderBy: { createdAt: 'desc' },
    });

    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

// Create category
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('subcategory').optional().isString().trim(),
    body('brand').optional().isString().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, subcategory, brand } = req.body;

      const category = await prisma.category.create({
        data: {
          customerId: req.customerId!,
          name,
          subcategory,
          brand,
        },
      });

      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: error.message || 'Failed to create category' });
    }
  }
);

// Update category
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('subcategory').optional().isString().trim(),
    body('brand').optional().isString().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, subcategory, brand } = req.body;

      // Verify ownership
      const existing = await prisma.category.findFirst({
        where: { id, customerId: req.customerId! },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(subcategory !== undefined && { subcategory }),
          ...(brand !== undefined && { brand }),
        },
      });

      res.json(category);
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: error.message || 'Failed to update category' });
    }
  }
);

// Delete category
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.category.findFirst({
      where: { id, customerId: req.customerId! },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
});

export default router;
