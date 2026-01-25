import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all business customers
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

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          customerType: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count(),
    ]);

    // Transform to snake_case for frontend
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      customer_type: customer.customerType || 'sales person',
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
    }));

    res.json({
      customers: transformedCustomers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    });
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
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, address, city, state, pincode, customer_type } = req.body;

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
          customerType: customer_type || 'sales person',
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
          customerType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Transform to snake_case for frontend
      const transformedCustomer = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        customer_type: customer.customerType || 'sales person',
        created_at: customer.createdAt.toISOString(),
        updated_at: customer.updatedAt.toISOString(),
      };

      res.status(201).json(transformedCustomer);
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
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, email, phone, address, city, state, pincode, customer_type } = req.body;

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
      if (customer_type !== undefined) updateData.customerType = customer_type;

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
          customerType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Transform to snake_case for frontend
      const transformedCustomer = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        customer_type: customer.customerType || 'sales person',
        created_at: customer.createdAt.toISOString(),
        updated_at: customer.updatedAt.toISOString(),
      };

      res.json(transformedCustomer);
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
