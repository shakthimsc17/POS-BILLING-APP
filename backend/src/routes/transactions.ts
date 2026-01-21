import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all transactions
router.get('/', async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.customer?.isAdmin || false;
    
    // If admin, return all transactions; otherwise filter by customerId
    const whereClause = isAdmin ? {} : { customerId: req.customerId! };
    
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Transform Prisma camelCase to snake_case for frontend compatibility
    const transformedTransactions = transactions.map((tx) => ({
      id: tx.id,
      customer_id: tx.customerId,
      transaction_customer_id: tx.transactionCustomerId,
      total_amount: tx.totalAmount.toString(),
      payment_method: tx.paymentMethod,
      received_amount: tx.receivedAmount ? tx.receivedAmount.toString() : null,
      change_amount: tx.changeAmount ? tx.changeAmount.toString() : null,
      items_json: tx.itemsJson,
      created_at: tx.createdAt.toISOString(),
    }));

    res.json(transformedTransactions);
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
          totalAmount: parseFloat(totalAmount),
          paymentMethod,
          receivedAmount: receivedAmount ? parseFloat(receivedAmount) : null,
          changeAmount: changeAmount ? parseFloat(changeAmount) : null,
          itemsJson: typeof itemsJson === 'string' ? itemsJson : JSON.stringify(itemsJson),
        },
      });

      // Parse items for stock update and activity logging
      const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;

      // Update item stock (items are shared, so no ownership check needed)
      try {
        for (const cartItem of items) {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || 1;
          const itemId = item.id;

          if (itemId) {
            // Find item (shared inventory - no customerId check)
            const existingItem = await prisma.item.findUnique({
              where: { id: itemId },
            });

            if (existingItem && existingItem.stock >= quantity) {
              await prisma.item.update({
                where: { id: itemId },
                data: { stock: existingItem.stock - quantity },
              });
            }
          }
        }
      } catch (stockError) {
        console.error('Error updating stock:', stockError);
        // Don't fail transaction if stock update fails
      }

      // Transform response to snake_case for frontend compatibility
      const transformedTransaction = {
        id: transaction.id,
        customer_id: transaction.customerId,
        transaction_customer_id: transaction.transactionCustomerId,
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
            await prisma.item.update({
              where: { id: itemId },
              data: { stock: existingItem.stock + quantity },
            });
          }
        }
      }
    } catch (stockError) {
      console.error('Error restoring stock:', stockError);
      // Continue with deletion even if stock restoration fails
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
