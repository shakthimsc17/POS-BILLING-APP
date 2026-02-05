import express, { Response } from 'express';
import { query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all transactions
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
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const isAdmin = req.customer?.isAdmin || false;
    
    // If admin, return all transactions; otherwise filter by customerId
    const whereClause = isAdmin ? {} : { customerId: req.customerId! };
    
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
      where: whereClause,
        skip,
        take: limit,
      orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    // Transform Prisma camelCase to snake_case for frontend compatibility
    const transformedTransactions = transactions.map((tx) => ({
      id: tx.id,
      customer_id: tx.customerId,
      transaction_customer_id: tx.transactionCustomerId,
      sales_customer_id: tx.salesCustomerId,
      total_amount: tx.totalAmount.toString(),
      transaction_type: tx.transactionType || 'sale',
      payment_method: tx.paymentMethod,
      received_amount: tx.receivedAmount ? tx.receivedAmount.toString() : null,
      change_amount: tx.changeAmount ? tx.changeAmount.toString() : null,
      items_json: tx.itemsJson,
      created_at: tx.createdAt.toISOString(),
    }));

    res.json({
      transactions: transformedTransactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post(
  '/',
  async (req: AuthRequest, res) => {
    try {
      // Support both snake_case (from frontend) and camelCase
      const totalAmount = req.body.totalAmount || req.body.total_amount;
      const paymentMethod = req.body.paymentMethod || req.body.payment_method;
      const itemsJson = req.body.itemsJson || req.body.items_json;
      const transactionCustomerId = req.body.transactionCustomerId || req.body.transaction_customer_id;
      const salesCustomerId = req.body.salesCustomerId || req.body.sales_customer_id;
      const receivedAmount = req.body.receivedAmount || req.body.received_amount;
      const changeAmount = req.body.changeAmount || req.body.change_amount;

      // Validate required fields manually
      const validationErrors: any[] = [];
      
      if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) < 0) {
        validationErrors.push({
          type: 'field',
          msg: 'Invalid value',
          path: 'totalAmount',
          location: 'body'
        });
      }
      
      if (!paymentMethod || !['cash', 'card', 'upi'].includes(paymentMethod)) {
        validationErrors.push({
          type: 'field',
          msg: 'Invalid value',
          path: 'paymentMethod',
          location: 'body'
        });
      }
      
      if (!itemsJson || (typeof itemsJson === 'string' && itemsJson.trim() === '')) {
        validationErrors.push({
          type: 'field',
          msg: 'Invalid value',
          path: 'itemsJson',
          location: 'body'
        });
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          customerId: req.customerId!,
          transactionCustomerId,
          salesCustomerId,
          totalAmount: parseFloat(totalAmount),
          paymentMethod,
          receivedAmount: receivedAmount ? parseFloat(receivedAmount) : null,
          changeAmount: changeAmount ? parseFloat(changeAmount) : null,
          itemsJson: typeof itemsJson === 'string' ? itemsJson : JSON.stringify(itemsJson),
        },
      });

      // Parse items for stock update and activity logging
      const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;

      // Update item stock and link quick sale items
      try {
        const quickSalePrefix = 'quick-sale-';
        
        for (const cartItem of items) {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || 1;
          let itemId = item.id;

          // Handle legacy prefix if still present
          if (typeof itemId === 'string' && itemId.startsWith(quickSalePrefix)) {
            itemId = itemId.slice(quickSalePrefix.length);
          }

          if (itemId) {
            // 1. Try to find in Inventory first
            const existingItem = await prisma.item.findUnique({
              where: { id: itemId },
            });

            if (existingItem) {
              if (existingItem.stock >= quantity) {
                await prisma.item.update({
                  where: { id: itemId },
                  data: { 
                    stock: existingItem.stock - quantity,
                    purchaseQty: { increment: quantity },
                  },
                });
              }
            } else {
              // 2. If not in inventory, check if it's a Quick Sale Item
              // This handles both legacy prefixed IDs (stripped above) and new direct UUIDs
              const quickSaleItem = await prisma.quickSaleItem.findUnique({
                where: { id: itemId }
              });

              if (quickSaleItem) {
                await prisma.quickSaleItem.update({
                  where: { id: itemId },
                  data: { transactionId: transaction.id },
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing transaction items (stock/linking):', error);
        // Don't fail transaction if stock/link update fails
      }

      // Transform response to snake_case for frontend compatibility
      const transformedTransaction = {
        id: transaction.id,
        customer_id: transaction.customerId,
        transaction_customer_id: transaction.transactionCustomerId,
        sales_customer_id: transaction.salesCustomerId,
        total_amount: transaction.totalAmount.toString(),
        payment_method: transaction.paymentMethod,
        received_amount: transaction.receivedAmount ? transaction.receivedAmount.toString() : null,
        change_amount: transaction.changeAmount ? transaction.changeAmount.toString() : null,
        items_json: transaction.itemsJson,
        created_at: transaction.createdAt.toISOString(),
      };

      // Log activity
      await logActivity({
        entityType: 'transaction',
        entityId: transaction.id,
        action: 'create',
        changedBy: req.customerId!,
        changes: {
          totalAmount: transaction.totalAmount.toString(),
          paymentMethod: transaction.paymentMethod,
          itemsCount: items.length,
        },
      });

      res.status(201).json(transformedTransaction);
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: error.message || 'Failed to create transaction' });
    }
  }
);

// Get transaction by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user is admin or owner
    if (!isAdmin && transaction.customerId !== req.customerId) {
      return res.status(403).json({ error: 'You can only view your own transactions, or you must be an admin' });
    }

    // Transform Prisma camelCase to snake_case for frontend compatibility
    const transformedTransaction = {
      id: transaction.id,
      customer_id: transaction.customerId,
      transaction_customer_id: transaction.transactionCustomerId,
      sales_customer_id: transaction.salesCustomerId,
      total_amount: transaction.totalAmount.toString(),
      transaction_type: transaction.transactionType || 'sale',
      payment_method: transaction.paymentMethod,
      received_amount: transaction.receivedAmount ? transaction.receivedAmount.toString() : null,
      change_amount: transaction.changeAmount ? transaction.changeAmount.toString() : null,
      items_json: transaction.itemsJson,
      created_at: transaction.createdAt.toISOString(),
    };

    res.json(transformedTransaction);
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transaction' });
  }
});

// Update transaction
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    // Find existing transaction
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user is admin or owner
    if (!isAdmin && existingTransaction.customerId !== req.customerId) {
      return res.status(403).json({ error: 'You can only edit your own transactions, or you must be an admin' });
    }

    // Support both snake_case (from frontend) and camelCase
    const totalAmount = req.body.totalAmount || req.body.total_amount;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method;
    const itemsJson = req.body.itemsJson || req.body.items_json;
    const transactionCustomerId = req.body.transactionCustomerId || req.body.transaction_customer_id;
    const salesCustomerId = req.body.salesCustomerId || req.body.sales_customer_id;
    const receivedAmount = req.body.receivedAmount || req.body.received_amount;
    const changeAmount = req.body.changeAmount || req.body.change_amount;
    const createdAt = req.body.createdAt || req.body.created_at;

    // Validate required fields
    const validationErrors: any[] = [];
    
    if (totalAmount !== undefined && (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) < 0)) {
      validationErrors.push({
        type: 'field',
        msg: 'Invalid value',
        path: 'totalAmount',
        location: 'body'
      });
    }
    
    if (paymentMethod && !['cash', 'card', 'upi'].includes(paymentMethod)) {
      validationErrors.push({
        type: 'field',
        msg: 'Invalid value',
        path: 'paymentMethod',
        location: 'body'
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Parse old and new items for inventory reconciliation
    const oldItems = JSON.parse(existingTransaction.itemsJson);
    const newItems = itemsJson ? (typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson) : oldItems;

    // Calculate inventory deltas and update stocks
    try {
      const oldItemMap = new Map();
      const newItemMap = new Map();

      // Create maps for easy lookup
      oldItems.forEach((cartItem: any) => {
        const item = cartItem.item || cartItem;
        const quantity = cartItem.quantity || 1;
        oldItemMap.set(item.id, quantity);
      });

      newItems.forEach((cartItem: any) => {
        const item = cartItem.item || cartItem;
        const quantity = cartItem.quantity || 1;
        newItemMap.set(item.id, quantity);
      });

      // Process each unique item
      const allItemIds = new Set([...oldItemMap.keys(), ...newItemMap.keys()]);
      
      for (const itemId of allItemIds) {
        const oldQty = oldItemMap.get(itemId) || 0;
        const newQty = newItemMap.get(itemId) || 0;
        const delta = newQty - oldQty;

        if (delta !== 0) {
          // Find item and update stock
          const existingItem = await prisma.item.findUnique({
            where: { id: itemId },
          });

          if (existingItem) {
            const newStock = existingItem.stock - delta;
            const newPurchaseQty = Math.max(0, (existingItem.purchaseQty || 0) + delta);
            
            // Validate stock availability for increases
            if (delta > 0 && newStock < 0) {
              return res.status(400).json({ 
                error: `Insufficient stock for item ${existingItem.name}. Available: ${existingItem.stock}, Required: ${delta}` 
              });
            }

            await prisma.item.update({
              where: { id: itemId },
              data: { 
                stock: newStock,
                purchaseQty: newPurchaseQty,
              },
            });
          }
        }
      }
    } catch (stockError) {
      console.error('Error updating inventory:', stockError);
      return res.status(500).json({ error: 'Failed to update inventory' });
    }

    // Update transaction
    const updateData: any = {};
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (itemsJson !== undefined) updateData.itemsJson = typeof itemsJson === 'string' ? itemsJson : JSON.stringify(itemsJson);
    if (transactionCustomerId !== undefined) updateData.transactionCustomerId = transactionCustomerId;
    if (salesCustomerId !== undefined) updateData.salesCustomerId = salesCustomerId;
    if (receivedAmount !== undefined) updateData.receivedAmount = receivedAmount ? parseFloat(receivedAmount) : null;
    if (changeAmount !== undefined) updateData.changeAmount = changeAmount ? parseFloat(changeAmount) : null;
    if (createdAt !== undefined) updateData.createdAt = new Date(createdAt);

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await logActivity({
      entityType: 'transaction',
      entityId: updatedTransaction.id,
      action: 'update',
      changedBy: req.customerId!,
      changes: {
        oldValues: {
          totalAmount: existingTransaction.totalAmount.toString(),
          paymentMethod: existingTransaction.paymentMethod,
          itemsCount: oldItems.length,
        },
        newValues: {
          totalAmount: updatedTransaction.totalAmount.toString(),
          paymentMethod: updatedTransaction.paymentMethod,
          itemsCount: newItems.length,
        },
      },
    });

    // Transform response to snake_case for frontend compatibility
    const transformedTransaction = {
      id: updatedTransaction.id,
      customer_id: updatedTransaction.customerId,
      transaction_customer_id: updatedTransaction.transactionCustomerId,
      sales_customer_id: updatedTransaction.salesCustomerId,
      total_amount: updatedTransaction.totalAmount.toString(),
      payment_method: updatedTransaction.paymentMethod,
      received_amount: updatedTransaction.receivedAmount ? updatedTransaction.receivedAmount.toString() : null,
      change_amount: updatedTransaction.changeAmount ? updatedTransaction.changeAmount.toString() : null,
      items_json: updatedTransaction.itemsJson,
      created_at: updatedTransaction.createdAt.toISOString(),
    };

    res.json(transformedTransaction);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user is admin or owner
    if (!isAdmin && transaction.customerId !== req.customerId) {
      return res.status(403).json({ error: 'You can only delete your own transactions, or you must be an admin' });
    }

    // Parse items to restore stock
    try {
      const items = JSON.parse(transaction.itemsJson);
      
      for (const cartItem of items) {
        const item = cartItem.item || cartItem;
        const quantity = cartItem.quantity || 1;
        const itemId = item.id;

        if (itemId) {
          // Find item and restore stock
          const existingItem = await prisma.item.findUnique({
            where: { id: itemId },
          });

          if (existingItem) {
            // Ensure purchaseQty doesn't go below 0
            const currentPurchaseQty = existingItem.purchaseQty || 0;
            const newPurchaseQty = Math.max(0, currentPurchaseQty - quantity);
            
            await prisma.item.update({
              where: { id: itemId },
              data: { 
                stock: existingItem.stock + quantity,
                purchaseQty: newPurchaseQty,
              },
            });
          }
        }
      }
    } catch (stockError) {
      console.error('Error restoring stock:', stockError);
      // Continue with deletion even if stock restoration fails
    }

    // Clear transaction_id on quick sale items linked to this transaction
    try {
      await prisma.quickSaleItem.updateMany({
        where: { transactionId: id },
        data: { transactionId: null },
      });
    } catch (linkError) {
      console.error('Error clearing quick sale item transaction link:', linkError);
    }

    // Check and handle related returns before deletion
    try {
      const relatedReturns = await prisma.returnRecord.findMany({
        where: { originalTransactionId: id }
      });

      if (relatedReturns.length > 0) {
        // Delete related return transactions first
        const returnTransactionIds = relatedReturns
          .filter(r => r.originalTransactionId)
          .map(r => r.originalTransactionId);

        if (returnTransactionIds.length > 0) {
          await prisma.transaction.deleteMany({
            where: {
              originalTransactionId: id,
              transactionType: 'return'
            }
          });
        }

        // Delete return records
        await prisma.returnRecord.deleteMany({
          where: { originalTransactionId: id }
        });
      }
    } catch (returnError) {
      console.error('Error handling related returns:', returnError);
      return res.status(400).json({ 
        error: 'Cannot delete transaction: it has related returns. Please delete returns first.' 
      });
    }

    // Log activity before deletion
    await logActivity({
      entityType: 'transaction',
      entityId: transaction.id,
      action: 'delete',
      changedBy: req.customerId!,
      changes: {
        totalAmount: transaction.totalAmount.toString(),
        paymentMethod: transaction.paymentMethod,
        deletedAt: new Date().toISOString(),
      },
    });

    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to delete transaction' });
  }
});

export default router;
