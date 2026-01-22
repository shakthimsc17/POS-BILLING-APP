import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all categories - show all categories to all authenticated users (shared inventory)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Transform to snake_case for frontend
    const transformedCategories = categories.map(category => ({
      id: category.id,
      customer_id: category.customerId,
      name: category.name,
      subcategory: category.subcategory,
      brand: category.brand,
      icon: category.icon,
      created_at: category.createdAt.toISOString(),
    }));

    res.json(transformedCategories);
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
    body('icon').optional().isString().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, subcategory, brand, icon } = req.body;

      const category = await prisma.category.create({
        data: {
          customerId: req.customerId!,
          name,
          subcategory,
          brand,
          icon,
        },
      });

      // Log activity
      await logActivity({
        entityType: 'category',
        entityId: category.id,
        action: 'create',
        changedBy: req.customerId!,
        changes: {
          name: category.name,
          subcategory: category.subcategory,
        },
      });

      // Transform to snake_case for frontend
      res.status(201).json({
        id: category.id,
        customer_id: category.customerId,
        name: category.name,
        subcategory: category.subcategory,
        brand: category.brand,
        icon: category.icon,
        created_at: category.createdAt.toISOString(),
      });
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
    body('icon').optional().isString().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, subcategory, brand, icon } = req.body;

      // Verify ownership
      const existing = await prisma.category.findFirst({
        where: { id, customerId: req.customerId! },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Prepare old values for activity log
      const oldValues = {
        name: existing.name,
        subcategory: existing.subcategory,
        brand: existing.brand,
      };

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(subcategory !== undefined && { subcategory }),
          ...(brand !== undefined && { brand }),
          ...(icon !== undefined && { icon }),
        },
      });

      // Log activity
      await logActivity({
        entityType: 'category',
        entityId: category.id,
        action: 'update',
        changedBy: req.customerId!,
        changes: {
          old: oldValues,
          new: {
            name: category.name,
            subcategory: category.subcategory,
            brand: category.brand,
          },
        },
      });

      // Transform to snake_case for frontend
      res.json({
        id: category.id,
        customer_id: category.customerId,
        name: category.name,
        subcategory: category.subcategory,
        brand: category.brand,
        icon: category.icon,
        created_at: category.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: error.message || 'Failed to update category' });
    }
  }
);

// Delete all categories for the current customer (must be before /:id route)
router.delete('/', async (req: AuthRequest, res) => {
  try {
    const deleted = await prisma.category.deleteMany({
      where: { customerId: req.customerId! },
    });

    res.json({ 
      message: 'All categories deleted successfully',
      count: deleted.count 
    });
  } catch (error: any) {
    console.error('Error deleting all categories:', error);
    res.status(500).json({ error: error.message || 'Failed to delete all categories' });
  }
});

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

    // Log activity before deletion
    await logActivity({
      entityType: 'category',
      entityId: existing.id,
      action: 'delete',
      changedBy: req.customerId!,
      changes: {
        name: existing.name,
        deletedAt: new Date().toISOString(),
      },
    });

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
