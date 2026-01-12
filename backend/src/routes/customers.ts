import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all business customers
router.get('/', async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
});

// Create business customer
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, address, city, state, pincode } = req.body;

      // If email provided, check if it exists
      if (email) {
        const existing = await prisma.customer.findUnique({
          where: { email: email.trim().toLowerCase() },
        });

        if (existing) {
          return res.status(400).json({ error: 'Email already registered' });
        }
      }

      const customer = await prisma.customer.create({
        data: {
          name,
          email: email ? email.trim().toLowerCase() : `customer_${Date.now()}@temp.local`,
          passwordHash: 'temp', // Business customers don't need password
          phone,
          address,
          city,
          state,
          pincode,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(201).json(customer);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: error.message || 'Failed to create customer' });
    }
  }
);

// Update customer
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, email, phone, address, city, state, pincode } = req.body;

      // Check if customer exists
      const existing = await prisma.customer.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // If email changed, check if new email exists
      if (email && email !== existing.email) {
        const emailExists = await prisma.customer.findUnique({
          where: { email: email.trim().toLowerCase() },
        });

        if (emailExists) {
          return res.status(400).json({ error: 'Email already registered' });
        }
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email.trim().toLowerCase();
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (pincode !== undefined) updateData.pincode = pincode;

      const customer = await prisma.customer.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(customer);
    } catch (error: any) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: error.message || 'Failed to update customer' });
    }
  }
);

// Delete customer
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: error.message || 'Failed to delete customer' });
  }
});

export default router;
