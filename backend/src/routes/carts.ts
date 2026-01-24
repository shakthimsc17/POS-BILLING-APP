import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current user's saved cart
router.get('/', async (req: AuthRequest, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { customerId: req.customerId! },
    });

    if (!cart) {
      return res.json(null);
    }

    // Transform to snake_case for frontend
    res.json({
      id: cart.id,
      customer_id: cart.customerId,
      items_json: cart.itemsJson,
      tax_rate: cart.taxRate.toString(),
      discount: cart.discount.toString(),
      payment_method: cart.paymentMethod,
      sales_customer_id: cart.salesCustomerId,
      created_at: cart.createdAt.toISOString(),
      updated_at: cart.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch cart' });
  }
});

// Save or update cart
router.post(
  '/',
  [
    body('items_json').notEmpty().isString(),
    body('tax_rate').optional().isFloat({ min: 0, max: 100 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('payment_method').optional().isIn(['cash', 'card', 'upi']),
    body('sales_customer_id').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        items_json,
        tax_rate,
        discount,
        payment_method,
        sales_customer_id,
      } = req.body;

      // Check if cart exists
      const existingCart = await prisma.cart.findUnique({
        where: { customerId: req.customerId! },
      });

      let cart;
      if (existingCart) {
        // Update existing cart
        cart = await prisma.cart.update({
          where: { id: existingCart.id },
          data: {
            itemsJson: items_json,
            taxRate: tax_rate !== undefined ? parseFloat(tax_rate) : existingCart.taxRate,
            discount: discount !== undefined ? parseFloat(discount) : existingCart.discount,
            paymentMethod: payment_method || existingCart.paymentMethod,
            salesCustomerId: sales_customer_id || existingCart.salesCustomerId,
          },
        });
      } else {
        // Create new cart
        cart = await prisma.cart.create({
          data: {
            customerId: req.customerId!,
            itemsJson: items_json,
            taxRate: tax_rate ? parseFloat(tax_rate) : 0,
            discount: discount ? parseFloat(discount) : 0,
            paymentMethod: payment_method || null,
            salesCustomerId: sales_customer_id || null,
          },
        });
      }

      // Transform to snake_case for frontend
      res.json({
        id: cart.id,
        customer_id: cart.customerId,
        items_json: cart.itemsJson,
        tax_rate: cart.taxRate.toString(),
        discount: cart.discount.toString(),
        payment_method: cart.paymentMethod,
        sales_customer_id: cart.salesCustomerId,
        created_at: cart.createdAt.toISOString(),
        updated_at: cart.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error saving cart:', error);
      res.status(500).json({ error: error.message || 'Failed to save cart' });
    }
  }
);

// Delete saved cart
router.delete('/', async (req: AuthRequest, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { customerId: req.customerId! },
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    await prisma.cart.delete({
      where: { id: cart.id },
    });

    res.json({ message: 'Cart deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cart:', error);
    res.status(500).json({ error: error.message || 'Failed to delete cart' });
  }
});

export default router;

