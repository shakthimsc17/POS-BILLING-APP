import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all table orders
router.get('/', [
  query('status').optional().isIn(['pending', 'completed', 'cancelled']),
  query('tableId').optional().isUUID(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const where: any = { customerId: req.customerId! };
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.tableId) {
      where.tableId = req.query.tableId;
    }

    const orders = await prisma.tableOrder.findMany({
      where,
      include: {
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders.map(order => ({
      id: order.id,
      customer_id: order.customerId,
      table_id: order.tableId,
      table_number: order.table.tableNumber,
      status: order.status,
      items_json: order.itemsJson,
      tax_rate: order.taxRate,
      discount: order.discount,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      transaction_id: order.transactionId,
      notes: order.notes,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    })));
  } catch (error: any) {
    console.error('Error fetching table orders:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch table orders' });
  }
});

// Get single table order
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.tableOrder.findFirst({
      where: {
        id,
        customerId: req.customerId!,
      },
      include: {
        table: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Table order not found' });
    }

    res.json({
      id: order.id,
      customer_id: order.customerId,
      table_id: order.tableId,
      table_number: order.table.tableNumber,
      status: order.status,
      items_json: order.itemsJson,
      tax_rate: order.taxRate,
      discount: order.discount,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      transaction_id: order.transactionId,
      notes: order.notes,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching table order:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch table order' });
  }
});

// Get active order for table
router.get('/table/:tableId', async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.params;

    const order = await prisma.tableOrder.findFirst({
      where: {
        tableId,
        customerId: req.customerId!,
        status: 'pending',
      },
      include: {
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      return res.status(404).json({ error: 'No active order found for this table' });
    }

    res.json({
      id: order.id,
      customer_id: order.customerId,
      table_id: order.tableId,
      table_number: order.table.tableNumber,
      status: order.status,
      items_json: order.itemsJson,
      tax_rate: order.taxRate,
      discount: order.discount,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      transaction_id: order.transactionId,
      notes: order.notes,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching active table order:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch table order' });
  }
});

// Create new table order
router.post(
  '/',
  [
    body('table_id').isUUID(),
    body('items_json').notEmpty().isString(),
    body('tax_rate').optional().isFloat({ min: 0, max: 100 }),
    body('discount').optional().isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { table_id, items_json, tax_rate, discount, notes } = req.body;

      // Verify table exists and belongs to customer
      const table = await prisma.table.findFirst({
        where: {
          id: table_id,
          customerId: req.customerId!,
        },
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }

      // Calculate total amount
      const items = JSON.parse(items_json);
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
      const tax = (subtotal * (tax_rate || 0)) / 100;
      const totalAmount = subtotal + tax - (discount || 0);

      const order = await prisma.tableOrder.create({
        data: {
          customerId: req.customerId!,
          tableId: table_id,
          itemsJson: items_json,
          taxRate: tax_rate || 0,
          discount: discount || 0,
          totalAmount,
          notes: notes || null,
        },
        include: {
          table: true,
        },
      });

      // Update table status to occupied
      await prisma.table.update({
        where: { id: table_id },
        data: { status: 'occupied' },
      });

      res.status(201).json({
        id: order.id,
        customer_id: order.customerId,
        table_id: order.tableId,
        table_number: order.table.tableNumber,
        status: order.status,
        items_json: order.itemsJson,
        tax_rate: order.taxRate,
        discount: order.discount,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        transaction_id: order.transactionId,
        notes: order.notes,
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating table order:', error);
      res.status(500).json({ error: error.message || 'Failed to create table order' });
    }
  }
);

// Update table order
router.put(
  '/:id',
  [
    body('items_json').optional().isString(),
    body('tax_rate').optional().isFloat({ min: 0, max: 100 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['pending', 'completed', 'cancelled']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { items_json, tax_rate, discount, status, notes } = req.body;

      // Check if order exists and belongs to customer
      const existing = await prisma.tableOrder.findFirst({
        where: {
          id,
          customerId: req.customerId!,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Table order not found' });
      }

      const updateData: any = {};
      if (items_json !== undefined) updateData.itemsJson = items_json;
      if (tax_rate !== undefined) updateData.taxRate = tax_rate;
      if (discount !== undefined) updateData.discount = discount;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      // Recalculate total if items, tax, or discount changed
      if (items_json || tax_rate !== undefined || discount !== undefined) {
        const items = JSON.parse(items_json || existing.itemsJson);
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
        const tax = (subtotal * (updateData.taxRate ?? existing.taxRate)) / 100;
        updateData.totalAmount = subtotal + tax - (updateData.discount ?? existing.discount);
      }

      const order = await prisma.tableOrder.update({
        where: { id },
        data: updateData,
        include: {
          table: true,
        },
      });

      res.json({
        id: order.id,
        customer_id: order.customerId,
        table_id: order.tableId,
        table_number: order.table.tableNumber,
        status: order.status,
        items_json: order.itemsJson,
        tax_rate: order.taxRate,
        discount: order.discount,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        transaction_id: order.transactionId,
        notes: order.notes,
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating table order:', error);
      res.status(500).json({ error: error.message || 'Failed to update table order' });
    }
  }
);

// Complete table order (create transaction and update table status)
router.post(
  '/:id/complete',
  [
    body('payment_method').isIn(['cash', 'card', 'upi']),
    body('received_amount').optional().isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { payment_method, received_amount, sales_customer_id } = req.body;

      // Get order
      const order = await prisma.tableOrder.findFirst({
        where: {
          id,
          customerId: req.customerId!,
          status: 'pending',
        },
        include: {
          table: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Pending table order not found' });
      }

      const total = Number(order.totalAmount);
      const received = received_amount ? Number(received_amount) : total;
      const changeAmount = payment_method === 'cash' ? Math.max(0, received - total) : 0;

      // Create transaction (without tableOrder relation - it's owned by TableOrder)
      const transaction = await prisma.transaction.create({
        data: {
          customerId: req.customerId!,
          salesCustomerId: sales_customer_id || null,
          totalAmount: total,
          paymentMethod: payment_method,
          receivedAmount: payment_method === 'cash' ? received : total,
          changeAmount: changeAmount > 0 ? changeAmount : null,
          itemsJson: order.itemsJson,
        },
      });

      // Update order status and link transaction
      await prisma.tableOrder.update({
        where: { id },
        data: {
          status: 'completed',
          transactionId: transaction.id,
          paymentMethod: payment_method,
        },
      });

      // Update table status to available
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'available' },
      });

      // Update item stock
      try {
        const items = JSON.parse(order.itemsJson);
        for (const cartItem of items) {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || 1;
          const itemId = item.id;

          if (itemId) {
            const existingItem = await prisma.item.findUnique({
              where: { id: itemId },
            });

            if (existingItem && existingItem.stock >= quantity) {
              await prisma.item.update({
                where: { id: itemId },
                data: {
                  stock: existingItem.stock - quantity,
                  purchaseQty: { increment: quantity },
                },
              });
            }
          }
        }
      } catch (stockError) {
        console.error('Error updating stock:', stockError);
        // Don't fail transaction if stock update fails
      }

      res.json({
        message: 'Order completed successfully',
        transaction: {
          id: transaction.id,
          customer_id: transaction.customerId,
          total_amount: transaction.totalAmount,
          payment_method: transaction.paymentMethod,
          received_amount: transaction.receivedAmount,
          change_amount: transaction.changeAmount,
          items_json: transaction.itemsJson,
          created_at: transaction.createdAt.toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error completing table order:', error);
      res.status(500).json({ error: error.message || 'Failed to complete table order' });
    }
  }
);

// Cancel table order
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.tableOrder.findFirst({
      where: {
        id,
        customerId: req.customerId!,
        status: 'pending',
      },
      include: {
        table: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pending table order not found' });
    }

    // Update order status
    await prisma.tableOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Update table status to available
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: 'available' },
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling table order:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel table order' });
  }
});

export default router;
