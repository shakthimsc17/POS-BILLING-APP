import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';
import { cache } from '../utils/cache.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all categories - show all categories to all authenticated users (shared inventory)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    // Check cache first
    const cacheKey = `categories:${page}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [categories, totalCount] = await Promise.all([
      prisma.category.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.count(),
    ]);

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

    const response = {
      categories: transformedCategories,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    };

    // Cache for 2 minutes
    cache.set(cacheKey, response, 2 * 60 * 1000);
    res.json(response);
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
  async (req: AuthRequest, res: Response) => {
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

      // Clear cache on create
      cache.clear();
      
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
  async (req: AuthRequest, res: Response) => {
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

      // Clear cache on update
      cache.clear();

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

    // Clear cache on delete
    cache.clear();
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
});

export default router;
