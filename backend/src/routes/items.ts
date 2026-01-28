import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all items - show all items to all authenticated users (shared inventory)
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
    const limit = parseInt(req.query.limit as string) || 100; // Default 100 items per page
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        skip,
        take: limit,
      orderBy: { createdAt: 'desc' },
      }),
      prisma.item.count(),
    ]);

    // Transform to snake_case for frontend
    const transformedItems = items.map(item => ({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      created_at: item.createdAt.toISOString(),
    }));

    res.json({
      items: transformedItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch items' });
  }
});

// Search items
router.get('/search', [query('q').notEmpty()], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchQuery = req.query.q as string;
    const searchTerm = `%${searchQuery}%`;

    const items = await prisma.$queryRaw<any[]>`
      SELECT * FROM items
      WHERE (
        name ILIKE ${searchTerm}
        OR code ILIKE ${searchTerm}
        OR barcode ILIKE ${searchTerm}
        OR mapping_code ILIKE ${searchTerm}
      )
      ORDER BY created_at DESC
    `;

    // Transform to snake_case for frontend (raw query returns snake_case, but ensure consistency)
    const transformedItems = items.map((item: any) => ({
      id: item.id,
      customer_id: item.customer_id,
      name: item.name,
      display_name: item.display_name,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mapping_code,
      category_id: item.category_id,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.image_url,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
    }));

    res.json(transformedItems);
  } catch (error: any) {
    console.error('Error searching items:', error);
    res.status(500).json({ error: error.message || 'Failed to search items' });
  }
});

// Get items by categories
router.get('/by-categories', [query('categoryIds').notEmpty()], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryIdsParam = req.query.categoryIds as string;
    const categoryIds = categoryIdsParam.split(',').filter(id => id.trim() !== '');

    if (categoryIds.length === 0) {
      return res.status(400).json({ error: 'At least one category ID is required' });
    }

    const items = await prisma.item.findMany({
      where: {
        categoryId: {
          in: categoryIds,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to snake_case for frontend
    const transformedItems = items.map(item => ({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      created_at: item.createdAt.toISOString(),
    }));

    res.json(transformedItems);
  } catch (error: any) {
    console.error('Error fetching items by categories:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch items by categories' });
  }
});

// Get item by barcode (exact match)
router.get('/barcode/:barcode', async (req: AuthRequest, res) => {
  try {
    const { barcode } = req.params;

    const item = await prisma.item.findFirst({
      where: {
        barcode,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Transform to snake_case for frontend
    res.json({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      created_at: item.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching item by barcode:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch item' });
  }
});

// Search items by mapping code (exact match for cafe quick search)
router.get('/search-by-mapping-code/:mappingCode', async (req: AuthRequest, res) => {
  try {
    const { mappingCode } = req.params;

    const item = await prisma.item.findFirst({
      where: {
        mappingCode: {
          equals: mappingCode,
          mode: 'insensitive',
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Transform to snake_case for frontend
    res.json({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      created_at: item.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error searching item by mapping code:', error);
    res.status(500).json({ error: error.message || 'Failed to search item' });
  }
});

// Search items by barcode (case-insensitive, partial match support)
router.get('/search-by-barcode/:barcode', async (req: AuthRequest, res) => {
  try {
    const { barcode } = req.params;
    const searchTerm = `%${barcode}%`;

    const items = await prisma.$queryRaw<any[]>`
      SELECT * FROM items
      WHERE barcode ILIKE ${searchTerm}
      ORDER BY 
        CASE 
          WHEN barcode = ${barcode} THEN 1
          WHEN barcode LIKE ${barcode + '%'} THEN 2
          ELSE 3
        END,
        created_at DESC
      LIMIT 10
    `;

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Transform to snake_case for frontend
    const transformedItems = items.map((item: any) => ({
      id: item.id,
      customer_id: item.customer_id,
      name: item.name,
      display_name: item.display_name,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mapping_code,
      category_id: item.category_id,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.image_url,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
    }));

    // Return first item if exact match, otherwise return array
    const exactMatch = transformedItems.find(item => item.barcode?.toLowerCase() === barcode.toLowerCase());
    if (exactMatch) {
      res.json(exactMatch);
    } else {
      res.json(transformedItems[0]); // Return closest match
    }
  } catch (error: any) {
    console.error('Error searching item by barcode:', error);
    res.status(500).json({ error: error.message || 'Failed to search item' });
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
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        code,
        barcode,
        mappingCode,
        mapping_code, // Accept snake_case from frontend
        categoryId,
        category_id, // Accept snake_case from frontend
        subcategory,
        cost,
        price,
        mrp,
        stock,
        imageUrl,
        displayName,
        display_name, // Accept snake_case from frontend
      } = req.body;

      // Use categoryId (camelCase) or category_id (snake_case), whichever is provided
      const finalCategoryId = categoryId || category_id;
      
      // Use displayName (camelCase) or display_name (snake_case), whichever is provided
      const finalDisplayName = displayName !== undefined ? displayName : display_name;
      
      // Use mappingCode (camelCase) or mapping_code (snake_case), whichever is provided
      const finalMappingCode = mappingCode !== undefined ? (mappingCode === '' ? null : mappingCode) : (mapping_code !== undefined ? (mapping_code === '' ? null : mapping_code) : undefined);
      
      console.log('Creating item:', {
        name,
        code,
        categoryId_from_body: categoryId,
        category_id_from_body: category_id,
        finalCategoryId,
        displayName_from_body: displayName,
        display_name_from_body: display_name,
        finalDisplayName,
        customerId: req.customerId
      });

      const item = await prisma.item.create({
        data: {
          customerId: req.customerId!,
          name,
          displayName: finalDisplayName || null,
          code,
          barcode,
          mappingCode: finalMappingCode === '' || finalMappingCode === null ? null : (finalMappingCode || null),
          categoryId: finalCategoryId || null,
          subcategory,
          cost: parseFloat(cost),
          price: parseFloat(price),
          mrp: mrp ? parseFloat(mrp) : null,
          stock: stock ? parseInt(stock) : 0,
          imageUrl,
        },
      });
      
      console.log('Item created:', {
        id: item.id,
        name: item.name,
        categoryId: item.categoryId
      });

      // Log activity
      await logActivity({
        entityType: 'item',
        entityId: item.id,
        action: 'create',
        changedBy: req.customerId!,
        changes: {
          name: item.name,
          code: item.code,
          price: item.price.toString(),
        },
      });

      // Transform to snake_case for frontend
      res.status(201).json({
        id: item.id,
        customer_id: item.customerId,
        name: item.name,
        display_name: item.displayName,
        code: item.code,
        barcode: item.barcode,
        mapping_code: item.mappingCode,
        category_id: item.categoryId,
        subcategory: item.subcategory,
        cost: item.cost,
        price: item.price,
        mrp: item.mrp,
        stock: item.stock,
        image_url: item.imageUrl,
        created_at: item.createdAt.toISOString(),
      });
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
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const {
        name,
        displayName,
        display_name, // Accept snake_case from frontend
        code,
        barcode,
        mappingCode,
        mapping_code, // Accept snake_case from frontend
        categoryId,
        category_id, // Accept snake_case from frontend
        subcategory,
        cost,
        price,
        mrp,
        stock,
        imageUrl,
      } = req.body;

      // Use categoryId (camelCase) or category_id (snake_case), whichever is provided
      const finalCategoryId = categoryId !== undefined ? categoryId : category_id;
      // Use displayName (camelCase) or display_name (snake_case), whichever is provided
      const finalDisplayName = displayName !== undefined ? displayName : display_name;
      // Use mappingCode (camelCase) or mapping_code (snake_case), whichever is provided
      const finalMappingCode = mappingCode !== undefined ? (mappingCode === '' ? null : mappingCode) : (mapping_code !== undefined ? (mapping_code === '' ? null : mapping_code) : undefined);

      // Check if item exists (shared inventory - no customerId check)
      const existing = await prisma.item.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Check if user is admin or owner for non-stock updates
      const isAdmin = req.customer?.isAdmin || false;
      const isOwner = existing.customerId === req.customerId;
      const isStockOnlyUpdate = stock !== undefined && 
        name === undefined && 
        code === undefined && 
        barcode === undefined && 
        finalCategoryId === undefined && 
        subcategory === undefined && 
        cost === undefined && 
        price === undefined && 
        mrp === undefined && 
        imageUrl === undefined;

      // Allow stock updates for all users, but other fields require ownership or admin
      if (!isStockOnlyUpdate && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'You can only update items you created, or you must be an admin' });
      }

      // Prepare old values for activity log
      const oldValues = {
        name: existing.name,
        code: existing.code,
        price: existing.price.toString(),
        stock: existing.stock,
      };

      const updateData: any = {};
      if (name) updateData.name = name;
      if (finalDisplayName !== undefined) updateData.displayName = finalDisplayName || null;
      if (code) updateData.code = code;
      if (barcode !== undefined) updateData.barcode = barcode;
      if (finalMappingCode !== undefined) {
        updateData.mappingCode = finalMappingCode === '' || finalMappingCode === null ? null : finalMappingCode;
      }
      if (finalCategoryId !== undefined) updateData.categoryId = finalCategoryId || null;
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

      // Log activity
      await logActivity({
        entityType: 'item',
        entityId: item.id,
        action: 'update',
        changedBy: req.customerId!,
        changes: {
          old: oldValues,
          new: {
            name: item.name,
            code: item.code,
            price: item.price.toString(),
            stock: item.stock,
          },
        },
      });

      // Transform to snake_case for frontend
      res.json({
        id: item.id,
        customer_id: item.customerId,
        name: item.name,
        display_name: item.displayName,
        code: item.code,
        barcode: item.barcode,
        mapping_code: item.mappingCode,
        category_id: item.categoryId,
        subcategory: item.subcategory,
        cost: item.cost,
        price: item.price,
        mrp: item.mrp,
        stock: item.stock,
        image_url: item.imageUrl,
        created_at: item.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating item:', error);
      res.status(500).json({ error: error.message || 'Failed to update item' });
    }
  }
);

// Delete all items for the current customer (must be before /:id route)
router.delete('/', async (req: AuthRequest, res) => {
  try {
    const deleted = await prisma.item.deleteMany({
      where: { customerId: req.customerId! },
    });

    res.json({ 
      message: 'All items deleted successfully',
      count: deleted.count 
    });
  } catch (error: any) {
    console.error('Error deleting all items:', error);
    res.status(500).json({ error: error.message || 'Failed to delete all items' });
  }
});

// Delete item
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    // Verify ownership or admin
    const existing = await prisma.item.findFirst({
      where: isAdmin ? { id } : { id, customerId: req.customerId! },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Log activity before deletion
    await logActivity({
      entityType: 'item',
      entityId: existing.id,
      action: 'delete',
      changedBy: req.customerId!,
      changes: {
        name: existing.name,
        code: existing.code,
        deletedAt: new Date().toISOString(),
      },
    });

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
