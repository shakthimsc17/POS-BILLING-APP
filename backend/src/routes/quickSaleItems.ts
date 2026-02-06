import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all quick sale items
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { filter } = req.query; // 'all', 'pending', 'added'
    
    let whereClause: any = {};
    
    if (filter === 'pending') {
      whereClause.addedToInventory = false;
    } else if (filter === 'added') {
      whereClause.addedToInventory = true;
    }
    
    const quickSaleItems = await prisma.quickSaleItem.findMany({
      where: whereClause,
      orderBy: { soldAt: 'desc' },
    });

    // Transform to snake_case for frontend
    const transformedItems = quickSaleItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price.toString(),
      cost: item.cost != null ? item.cost.toString() : null,
      total_amount: item.totalAmount.toString(),
      sold_at: item.soldAt.toISOString(),
      added_to_inventory: item.addedToInventory,
      inventory_item_id: item.inventoryItemId,
      transaction_id: item.transactionId,
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString(),
    }));

    res.json(transformedItems);
  } catch (error: any) {
    console.error('Error fetching quick sale items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch quick sale items' });
  }
});

// Create quick sale item
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('quantity').isInt({ min: 1 }),
    body('price').isFloat({ min: 0 }),
    body('cost').optional().isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, quantity, price, cost } = req.body;
      const totalAmount = parseFloat(price) * parseInt(quantity);
      const costNum = cost !== undefined && cost !== '' ? parseFloat(cost) : null;

      const quickSaleItem = await prisma.quickSaleItem.create({
        data: {
          name: name.trim(),
          quantity: parseInt(quantity),
          price: parseFloat(price),
          cost: costNum,
          totalAmount,
        },
      });

      // Transform to snake_case for frontend
      res.status(201).json({
        id: quickSaleItem.id,
        name: quickSaleItem.name,
        quantity: quickSaleItem.quantity,
        price: quickSaleItem.price.toString(),
        cost: quickSaleItem.cost != null ? quickSaleItem.cost.toString() : null,
        total_amount: quickSaleItem.totalAmount.toString(),
        sold_at: quickSaleItem.soldAt.toISOString(),
        added_to_inventory: quickSaleItem.addedToInventory,
        inventory_item_id: quickSaleItem.inventoryItemId,
        transaction_id: quickSaleItem.transactionId,
        created_at: quickSaleItem.createdAt.toISOString(),
        updated_at: quickSaleItem.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating quick sale item:', error);
      res.status(500).json({ error: error.message || 'Failed to create quick sale item' });
    }
  }
);

// Update quick sale item
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('quantity').optional().isInt({ min: 1 }),
    body('price').optional().isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, quantity, price } = req.body;

      const existing = await prisma.quickSaleItem.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Quick sale item not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (quantity !== undefined) updateData.quantity = parseInt(quantity);
      if (price !== undefined) updateData.price = parseFloat(price);
      
      // Recalculate total if quantity or price changed
      if (quantity !== undefined || price !== undefined) {
        const finalQuantity = quantity !== undefined ? parseInt(quantity) : existing.quantity;
        const finalPrice = price !== undefined ? parseFloat(price) : parseFloat(existing.price.toString());
        updateData.totalAmount = finalQuantity * finalPrice;
      }

      const quickSaleItem = await prisma.quickSaleItem.update({
        where: { id },
        data: updateData,
      });

      // Transform to snake_case for frontend
      res.json({
        id: quickSaleItem.id,
        name: quickSaleItem.name,
        quantity: quickSaleItem.quantity,
        price: quickSaleItem.price.toString(),
        cost: quickSaleItem.cost != null ? quickSaleItem.cost.toString() : null,
        total_amount: quickSaleItem.totalAmount.toString(),
        sold_at: quickSaleItem.soldAt.toISOString(),
        added_to_inventory: quickSaleItem.addedToInventory,
        inventory_item_id: quickSaleItem.inventoryItemId,
        transaction_id: quickSaleItem.transactionId,
        created_at: quickSaleItem.createdAt.toISOString(),
        updated_at: quickSaleItem.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating quick sale item:', error);
      res.status(500).json({ error: error.message || 'Failed to update quick sale item' });
    }
  }
);

// Delete quick sale item
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.quickSaleItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Quick sale item not found' });
    }

    // Don't allow deletion if already added to inventory
    if (existing.addedToInventory) {
      return res.status(400).json({ error: 'Cannot delete quick sale item that has been added to inventory' });
    }

    await prisma.quickSaleItem.delete({
      where: { id },
    });

    res.json({ message: 'Quick sale item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting quick sale item:', error);
    res.status(500).json({ error: error.message || 'Failed to delete quick sale item' });
  }
});

// Add quick sale item to inventory
router.post(
  '/:id/add-to-inventory',
  [
    body('category_id').notEmpty().trim(),
    body('code').notEmpty().trim(),
    body('stock').isInt({ min: 0 }),
    body('cost').isFloat({ min: 0 }),
    body('price').optional().isFloat({ min: 0 }),
    body('mrp').optional().isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { category_id, code, stock, cost, price, mrp, display_name, subcategory, barcode } = req.body;

      // Check if quick sale item exists
      const quickSaleItem = await prisma.quickSaleItem.findUnique({
        where: { id },
      });

      if (!quickSaleItem) {
        return res.status(404).json({ error: 'Quick sale item not found' });
      }

      if (quickSaleItem.addedToInventory) {
        return res.status(400).json({ error: 'This quick sale item has already been added to inventory' });
      }

      // Check if code already exists
      const existingItem = await prisma.item.findFirst({
        where: { code },
      });

      if (existingItem) {
        return res.status(400).json({ error: 'Item code already exists. Please use a different code.' });
      }

      // Use price from quick sale if not provided
      const finalPrice = price !== undefined ? parseFloat(price) : parseFloat(quickSaleItem.price.toString());

      // Create item in inventory
      // Reuse the Quick Sale Item UUID for the new Inventory Item
      // This ensures consistency and traceability
      const inventoryItem = await prisma.item.create({
        data: {
          id: id, // Reuse the same UUID
          customerId: req.customerId!,
          name: quickSaleItem.name,
          displayName: display_name || null,
          code,
          barcode: barcode || null,
          categoryId: category_id || null,
          subcategory: subcategory || null,
          cost: parseFloat(cost),
          price: finalPrice,
          mrp: mrp ? parseFloat(mrp) : null,
          stock: parseInt(stock),
        },
      });

      // Update quick sale item
      await prisma.quickSaleItem.update({
        where: { id },
        data: {
          addedToInventory: true,
          inventoryItemId: inventoryItem.id,
        },
      });

      // Backfill transaction itemsJson with cost so profit reports are correct
      if (quickSaleItem.transactionId) {
        try {
          const tx = await prisma.transaction.findUnique({
            where: { id: quickSaleItem.transactionId },
          });
          if (tx) {
            const costNum = parseFloat(cost);
            const items = JSON.parse(tx.itemsJson);
            const quickSaleLineId = `quick-sale-${id}`; 
            let updated = false;
            for (const entry of items) {
              const item = entry.item || entry;
              // Check both with prefix (legacy) and without prefix (new)
              if (item.id === quickSaleLineId || item.id === id) {
                item.cost = costNum;
                updated = true;
                break;
              }
            }
            if (updated) {
              await prisma.transaction.update({
                where: { id: quickSaleItem.transactionId },
                data: { itemsJson: JSON.stringify(items) },
              });
            }
          }
        } catch (backfillError) {
          console.error('Error backfilling transaction cost for quick sale item:', backfillError);
          // Don't fail add-to-inventory
        }
      }

      // Transform to snake_case for frontend
      res.json({
        id: inventoryItem.id,
        customer_id: inventoryItem.customerId,
        name: inventoryItem.name,
        display_name: inventoryItem.displayName,
        code: inventoryItem.code,
        barcode: inventoryItem.barcode,
        category_id: inventoryItem.categoryId,
        subcategory: inventoryItem.subcategory,
        cost: inventoryItem.cost.toString(),
        price: inventoryItem.price.toString(),
        mrp: inventoryItem.mrp?.toString(),
        stock: inventoryItem.stock,
        image_url: inventoryItem.imageUrl,
        created_at: inventoryItem.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error adding quick sale item to inventory:', error);
      res.status(500).json({ error: error.message || 'Failed to add quick sale item to inventory' });
    }
  }
);

export default router;

