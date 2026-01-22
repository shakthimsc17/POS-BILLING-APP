import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

// Sign up
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').optional().isString().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, phone, address, city, state, pincode } = req.body;
      const cleanEmail = email.trim().toLowerCase();
      const customerName = name || cleanEmail.split('@')[0] || 'Customer';

      // Check if email already exists
      const existing = await prisma.customer.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create customer
      const customer = await prisma.customer.create({
        data: {
          name: customerName,
          email: cleanEmail,
          passwordHash,
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
          isAdmin: true,
          customerType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate JWT token
      const token = generateToken(customer.id, false);

      // Transform to snake_case for frontend
      res.status(201).json({
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          isAdmin: false,
          customer_type: customer.customerType || 'sales person',
          created_at: customer.createdAt.toISOString(),
          updated_at: customer.updatedAt.toISOString(),
        },
        token,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message || 'Failed to create account' });
    }
  }
);

// Sign in
router.post(
  '/signin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      // Find customer
      const customer = await prisma.customer.findUnique({
        where: { email: cleanEmail },
      });

      if (!customer || !customer.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, customer.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = generateToken(customer.id, customer.isAdmin);

      // Transform to snake_case for frontend
      res.json({
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          isAdmin: customer.isAdmin,
          customer_type: customer.customerType || 'sales person',
          created_at: customer.createdAt.toISOString(),
          updated_at: customer.updatedAt.toISOString(),
        },
        token,
      });
    } catch (error: any) {
      console.error('Signin error:', error);
      res.status(500).json({ error: error.message || 'Failed to sign in' });
    }
  }
);

// Get current customer
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  // Transform to snake_case for frontend
  const customer = req.customer as any;
  res.json({ 
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      isAdmin: customer.isAdmin,
      customer_type: customer.customerType || 'sales person',
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
    }
  });
});

// Sign out (client-side, but we can add token blacklisting here if needed)
router.post('/signout', authenticate, async (req, res) => {
  res.json({ message: 'Signed out successfully' });
});

export default router;
