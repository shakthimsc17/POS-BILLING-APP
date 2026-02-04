import express, { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all returns
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.customer?.isAdmin || false;
    
    // If admin, return all returns; otherwise filter by customerId
    const whereClause = isAdmin ? {} : { customerId: req.customerId! };
    
    const returns = await prisma.returnRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        originalTransaction: {
          select: { id: true, totalAmount: true, createdAt: true }
        },
        approvedByUser: {
          select: { id: true, name: true }
        },
        processedByUser: {
          select: { id: true, name: true }
        }
      }
    });

    // Transform Prisma camelCase to snake_case for frontend compatibility
    const transformedReturns = returns.map((ret: any) => ({
      id: ret.id,
      original_transaction_id: ret.originalTransactionId,
      customer_id: ret.customerId,
      return_type: ret.returnType,
      reason: ret.reason,
      status: ret.status,
      refund_amount: ret.refundAmount ? ret.refundAmount.toString() : null,
      restocked_items: ret.restockedItems,
      exchange_items: ret.exchangeItems,
      notes: ret.notes,
      approved_by: ret.approvedBy,
      processed_by: ret.processedBy,
      approved_at: ret.approvedAt?.toISOString() || null,
      processed_at: ret.processedAt?.toISOString() || null,
      created_at: ret.createdAt.toISOString(),
      updated_at: ret.updatedAt.toISOString(),
      customer: ret.customer,
      originalTransaction: ret.originalTransaction,
      approvedByUser: ret.approvedByUser,
      processedByUser: ret.processedByUser
    }));

    res.json(transformedReturns);
  } catch (error: any) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch returns' });
  }
});

// Get return by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    const returnRecord = await prisma.returnRecord.findUnique({
      where: { id },
      include: {
        customer: true,
        originalTransaction: {
          include: {
            customer: true,
            transactionCustomer: true,
            salesCustomer: true
          }
        },
        approvedByUser: {
          select: { id: true, name: true, email: true }
        },
        processedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Check if user is admin or owner
    if (!isAdmin && returnRecord.customerId !== req.customerId) {
      return res.status(403).json({ error: 'You can only view your own returns, or you must be an admin' });
    }

    // Transform response to snake_case for frontend compatibility
    const transformedReturn = {
      id: returnRecord.id,
      original_transaction_id: returnRecord.originalTransactionId,
      customer_id: returnRecord.customerId,
      return_type: returnRecord.returnType,
      reason: returnRecord.reason,
      status: returnRecord.status,
      refund_amount: returnRecord.refundAmount ? returnRecord.refundAmount.toString() : null,
      restocked_items: returnRecord.restockedItems,
      exchange_items: returnRecord.exchangeItems,
      notes: returnRecord.notes,
      approved_by: returnRecord.approvedBy,
      processed_by: returnRecord.processedBy,
      approved_at: returnRecord.approvedAt?.toISOString() || null,
      processed_at: returnRecord.processedAt?.toISOString() || null,
      created_at: returnRecord.createdAt.toISOString(),
      updated_at: returnRecord.updatedAt.toISOString(),
      customer: returnRecord.customer,
      originalTransaction: returnRecord.originalTransaction,
      approvedByUser: returnRecord.approvedByUser,
      processedByUser: returnRecord.processedByUser
    };

    res.json(transformedReturn);
  } catch (error: any) {
    console.error('Error fetching return:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch return' });
  }
});

// Create return request
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      originalTransactionId,
      returnType,
      reason,
      refundAmount,
      restockedItems,
      exchangeItems,
      notes
    } = req.body;

    // Validate required fields
    const validationErrors: any[] = [];
    
    if (!originalTransactionId) {
      validationErrors.push({
        type: 'field',
        msg: 'Original transaction ID is required',
        path: 'originalTransactionId',
        location: 'body'
      });
    }
    
    if (!returnType || !['full', 'partial', 'exchange', 'refund'].includes(returnType)) {
      validationErrors.push({
        type: 'field',
        msg: 'Invalid return type',
        path: 'returnType',
        location: 'body'
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Verify original transaction exists and user has access
    const isAdmin = req.customer?.isAdmin || false;
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id: originalTransactionId },
      include: { customer: true }
    });

    if (!originalTransaction) {
      return res.status(404).json({ error: 'Original transaction not found' });
    }

    if (!isAdmin && originalTransaction.customerId !== req.customerId) {
      return res.status(403).json({ error: 'You can only create returns for your own transactions' });
    }

    // Check if return already exists for this transaction
    const existingReturn = await prisma.returnRecord.findFirst({
      where: {
        originalTransactionId,
        status: { in: ['pending', 'approved', 'processed'] }
      }
    });

    if (existingReturn) {
      return res.status(400).json({ error: 'A return is already in progress for this transaction' });
    }

    // Create return request
    const returnRecord = await prisma.returnRecord.create({
      data: {
        originalTransactionId,
        customerId: req.customerId!,
        returnType,
        reason,
        refundAmount: refundAmount ? parseFloat(refundAmount) : null,
        restockedItems,
        exchangeItems,
        notes
      }
    });

    // Log activity
    await logActivity({
      entityType: 'return',
      entityId: returnRecord.id,
      action: 'create',
      changedBy: req.customerId!,
      changes: {
        originalTransactionId,
        returnType,
        refundAmount
      }
    });

    // Transform response to snake_case for frontend compatibility
    const transformedReturn = {
      id: returnRecord.id,
      original_transaction_id: returnRecord.originalTransactionId,
      customer_id: returnRecord.customerId,
      return_type: returnRecord.returnType,
      reason: returnRecord.reason,
      status: returnRecord.status,
      refund_amount: returnRecord.refundAmount ? returnRecord.refundAmount.toString() : null,
      restocked_items: returnRecord.restockedItems,
      exchange_items: returnRecord.exchangeItems,
      notes: returnRecord.notes,
      approved_by: returnRecord.approvedBy,
      processed_by: returnRecord.processedBy,
      approved_at: returnRecord.approvedAt?.toISOString() || null,
      processed_at: returnRecord.processedAt?.toISOString() || null,
      created_at: returnRecord.createdAt.toISOString(),
      updated_at: returnRecord.updatedAt.toISOString()
    };

    res.status(201).json(transformedReturn);
  } catch (error: any) {
    console.error('Error creating return:', error);
    res.status(500).json({ error: error.message || 'Failed to create return' });
  }
});

// Approve return (admin only)
router.post('/:id/approve', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can approve returns' });
    }

    const returnRecord = await prisma.returnRecord.findUnique({
      where: { id },
      include: { originalTransaction: true }
    });

    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    if (returnRecord.status !== 'pending') {
      return res.status(400).json({ error: 'Return can only be approved when in pending status' });
    }

    // Update return status
    const updatedReturn = await prisma.returnRecord.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: req.customerId,
        approvedAt: new Date()
      }
    });

    // Log activity
    await logActivity({
      entityType: 'return',
      entityId: updatedReturn.id,
      action: 'approve',
      changedBy: req.customerId!,
      changes: {
        status: 'approved',
        approvedAt: updatedReturn.approvedAt
      }
    });

    res.json({ message: 'Return approved successfully', return: updatedReturn });
  } catch (error: any) {
    console.error('Error approving return:', error);
    res.status(500).json({ error: error.message || 'Failed to approve return' });
  }
});

// Process return (admin only)
router.post('/:id/process', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can process returns' });
    }

    const returnRecord = await prisma.returnRecord.findUnique({
      where: { id },
      include: { originalTransaction: true }
    });

    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    if (returnRecord.status !== 'approved') {
      return res.status(400).json({ error: 'Return can only be processed when in approved status' });
    }

    // Process inventory restocking
    let itemsToRestock: any[] = [];
    
    if (returnRecord.returnType === 'full' || (returnRecord.returnType === 'exchange' && !returnRecord.restockedItems)) {
      // Full returns, or exchange without restockedItems (customer returns entire order)
      if (returnRecord.originalTransaction) {
        const originalItems = JSON.parse(returnRecord.originalTransaction.itemsJson || '[]');
        itemsToRestock = originalItems.map((item: any) => ({
          itemId: item.item?.id || item.id,
          quantity: item.quantity || 1,
          name: item.item?.name || item.name
        }));
      }
    } else if (returnRecord.restockedItems && (returnRecord.returnType === 'partial' || returnRecord.returnType === 'exchange')) {
      // For partial or exchange returns, use specified restocked items (items being returned)
      itemsToRestock = returnRecord.restockedItems as any[];
    }

    if (itemsToRestock.length > 0) {
      try {
        for (const item of itemsToRestock) {
          const itemId = item.itemId;
          const quantity = item.quantity || 0;

          if (itemId && quantity > 0) {
            // Find item and update stock
            const existingItem = await prisma.item.findUnique({
              where: { id: itemId },
            });

            if (existingItem) {
              await prisma.item.update({
                where: { id: itemId },
                data: { 
                  stock: existingItem.stock + quantity,
                  purchaseQty: Math.max(0, (existingItem.purchaseQty || 0) - quantity),
                },
              });
            }
          }
        }
      } catch (stockError) {
        console.error('Error restocking inventory:', stockError);
        return res.status(500).json({ error: 'Failed to restock inventory' });
      }
    }

    // Create return transaction for all return types
    let returnTransaction = null;
    let refundAmount = returnRecord.refundAmount ? parseFloat(returnRecord.refundAmount.toString()) : 0;
    let returnItems = [];
    
    // For full returns, or exchange without restockedItems (full exchange), get complete item details from original transaction
    const isFullReturnOrFullExchange = (returnRecord.returnType === 'full' || (returnRecord.returnType === 'exchange' && !returnRecord.restockedItems)) && returnRecord.originalTransaction;
    if (isFullReturnOrFullExchange) {
      refundAmount = parseFloat(returnRecord.originalTransaction!.totalAmount.toString());
      const originalItems = JSON.parse(returnRecord.originalTransaction!.itemsJson || '[]');
      returnItems = originalItems.map((item: any) => ({
        item: {
          id: item.item?.id || item.id,
          name: item.item?.name || item.name,
          price: item.item?.price || item.price || 0,
          cost: item.item?.cost || item.cost || 0,
          display_name: item.item?.display_name || item.display_name
        },
        quantity: -(item.quantity || 1), // Negative quantity for returns
        originalPrice: item.originalPrice || (item.item?.price || item.price || 0),
        customPrice: item.customPrice,
        subtotal: -Math.abs((item.customPrice !== undefined ? item.customPrice : item.originalPrice || (item.item?.price || item.price || 0)) * (item.quantity || 1))
      }));
    } else if ((returnRecord.returnType === 'partial' || returnRecord.returnType === 'exchange') && returnRecord.restockedItems && returnRecord.originalTransaction) {
      // For partial or exchange returns, get complete item details for returned items
      const originalItems = JSON.parse(returnRecord.originalTransaction.itemsJson || '[]');
      const restockedItems = returnRecord.restockedItems as any[];
      
      returnItems = restockedItems.map((restockedItem: any) => {
        // Find the corresponding original item to get complete details
        const originalItem = originalItems.find((orig: any) => 
          (orig.item?.id || orig.id) === restockedItem.itemId
        );
        
        if (originalItem) {
          return {
            item: {
              id: originalItem.item?.id || originalItem.id,
              name: originalItem.item?.name || originalItem.name,
              price: originalItem.item?.price || originalItem.price || 0,
              cost: originalItem.item?.cost || originalItem.cost || 0,
              display_name: originalItem.item?.display_name || originalItem.display_name
            },
            quantity: -(restockedItem.quantity || 1), // Negative quantity for returns
            originalPrice: originalItem.originalPrice || (originalItem.item?.price || originalItem.price || 0),
            customPrice: originalItem.customPrice,
            subtotal: -Math.abs((originalItem.customPrice !== undefined ? originalItem.customPrice : originalItem.originalPrice || (originalItem.item?.price || originalItem.price || 0)) * (restockedItem.quantity || 1))
          };
        }
        
        // Fallback if original item not found
        return {
          item: {
            id: restockedItem.itemId,
            name: restockedItem.name || 'Unknown Item',
            price: 0,
            cost: 0,
            display_name: restockedItem.name || 'Unknown Item'
          },
          quantity: -(restockedItem.quantity || 1),
          originalPrice: 0,
          customPrice: 0,
          subtotal: 0
        };
      });
      // Compute refund amount from return items when not provided (partial return)
      if (!refundAmount && returnItems.length > 0) {
        refundAmount = returnItems.reduce((sum: number, it: any) => sum + Math.abs(it.subtotal || 0), 0);
      }
    }
    
    const paymentMethod = returnRecord.originalTransaction?.paymentMethod || 'cash';
    
    if (refundAmount > 0 || returnRecord.returnType === 'full' || returnRecord.returnType === 'partial') {
      returnTransaction = await prisma.transaction.create({
        data: {
          customerId: returnRecord.customerId,
          totalAmount: -Math.abs(refundAmount), // Negative for refund
          paymentMethod, // Use original transaction's payment method
          itemsJson: JSON.stringify(returnItems),
          transactionType: 'return',
          originalTransactionId: returnRecord.originalTransactionId
        }
      });
    }

    // Exchange: create new sale transaction and deduct stock for exchange items
    let exchangeTransaction = null;
    const exchangeItems = returnRecord.exchangeItems as any[] | null;
    if (returnRecord.returnType === 'exchange' && Array.isArray(exchangeItems) && exchangeItems.length > 0) {
      const exchangeSaleItems: any[] = [];
      let exchangeTotal = 0;
      for (const ex of exchangeItems) {
        const itemId = ex.itemId || ex.item_id;
        const qty = ex.quantity || 1;
        if (!itemId || qty < 1) continue;
        const item = await prisma.item.findUnique({ where: { id: itemId } });
        if (!item || item.stock < qty) {
          throw new Error(`Exchange item ${item.name || itemId} has insufficient stock (need ${qty}, have ${item?.stock ?? 0})`);
        }
        const price = Number(item.price);
        const cost = Number(item.cost);
        const subtotal = price * qty;
        exchangeTotal += subtotal;
        exchangeSaleItems.push({
          item: {
            id: item.id,
            name: item.name,
            display_name: item.displayName,
            price,
            cost,
          },
          quantity: qty,
          originalPrice: price,
          subtotal,
        });
      }
      if (exchangeSaleItems.length > 0 && exchangeTotal > 0) {
        exchangeTransaction = await prisma.transaction.create({
          data: {
            customerId: returnRecord.customerId,
            totalAmount: exchangeTotal,
            paymentMethod,
            itemsJson: JSON.stringify(exchangeSaleItems),
            transactionType: 'sale',
          },
        });
        for (const ex of exchangeItems) {
          const itemId = ex.itemId || ex.item_id;
          const qty = ex.quantity || 1;
          if (!itemId || qty < 1) continue;
          await prisma.item.update({
            where: { id: itemId },
            data: {
              stock: { decrement: qty },
              purchaseQty: { increment: qty },
            },
          });
        }
      }
    }

    // Refunds are reflected only via return transactions (profit/sales); no separate cash flow entry
    // to avoid double-counting in Net = Profit + Income - Expense.

    const updateData: { status: string; processedBy: string | null; processedAt: Date; refundAmount?: number } = {
      status: 'processed',
      processedBy: req.customerId,
      processedAt: new Date(),
    };
    // Always persist refund amount when we have one (full, partial, or exchange with refund) so Returns page shows it
    if (refundAmount > 0) {
      updateData.refundAmount = refundAmount;
    }

    // Update return status and refund_amount for display on Returns page
    const updatedReturn = await prisma.returnRecord.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await logActivity({
      entityType: 'return',
      entityId: updatedReturn.id,
      action: 'process',
      changedBy: req.customerId!,
      changes: {
        status: 'processed',
        processedAt: updatedReturn.processedAt,
        returnTransactionId: returnTransaction?.id || null,
        exchangeTransactionId: exchangeTransaction?.id || null,
      }
    });

    // Return in snake_case so frontend can show refund_amount immediately
    const returnPayload = {
      id: updatedReturn.id,
      original_transaction_id: updatedReturn.originalTransactionId,
      customer_id: updatedReturn.customerId,
      return_type: updatedReturn.returnType,
      reason: updatedReturn.reason,
      status: updatedReturn.status,
      refund_amount: updatedReturn.refundAmount != null ? String(updatedReturn.refundAmount) : null,
      restocked_items: updatedReturn.restockedItems,
      exchange_items: updatedReturn.exchangeItems,
      notes: updatedReturn.notes,
      approved_by: updatedReturn.approvedBy,
      processed_by: updatedReturn.processedBy,
      approved_at: updatedReturn.approvedAt?.toISOString() ?? null,
      processed_at: updatedReturn.processedAt?.toISOString() ?? null,
      created_at: updatedReturn.createdAt.toISOString(),
      updated_at: updatedReturn.updatedAt.toISOString(),
    };

    res.json({
      message: 'Return processed successfully',
      return: returnPayload,
      returnTransaction,
      exchangeTransaction: exchangeTransaction || undefined,
    });
  } catch (error: any) {
    console.error('Error processing return:', error);
    res.status(500).json({ error: error.message || 'Failed to process return' });
  }
});

// Reject return (admin only)
router.post('/:id/reject', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const isAdmin = req.customer?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can reject returns' });
    }

    const returnRecord = await prisma.returnRecord.findUnique({
      where: { id }
    });

    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    if (returnRecord.status !== 'pending') {
      return res.status(400).json({ error: 'Return can only be rejected when in pending status' });
    }

    // Update return status
    const updatedReturn = await prisma.returnRecord.update({
      where: { id },
      data: {
        status: 'rejected',
        notes: rejectionReason || returnRecord.notes
      }
    });

    // Log activity
    await logActivity({
      entityType: 'return',
      entityId: updatedReturn.id,
      action: 'reject',
      changedBy: req.customerId!,
      changes: {
        status: 'rejected',
        rejectionReason
      }
    });

    res.json({ message: 'Return rejected successfully', return: updatedReturn });
  } catch (error: any) {
    console.error('Error rejecting return:', error);
    res.status(500).json({ error: error.message || 'Failed to reject return' });
  }
});

// Delete return (admin only)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can delete returns' });
    }

    const returnRecord = await prisma.returnRecord.findUnique({
      where: { id }
    });

    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Check if return is already processed
    if (returnRecord.status === 'processed') {
      return res.status(400).json({ error: 'Cannot delete processed returns' });
    }

    // Delete the return
    await prisma.returnRecord.delete({
      where: { id }
    });

    // Log activity
    await logActivity({
      entityType: 'return',
      entityId: id,
      action: 'delete',
      changedBy: req.customerId!,
      changes: {
        deletedAt: new Date().toISOString()
      }
    });

    res.json({ message: 'Return deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting return:', error);
    res.status(500).json({ error: error.message || 'Failed to delete return' });
  }
});

export default router;
