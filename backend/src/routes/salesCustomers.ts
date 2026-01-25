import express, { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all sales customers
router.get('/', async (req: AuthRequest, res) => {
  try {
    const salesCustomers = await prisma.salesCustomer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(salesCustomers);
  } catch (error: any) {
    console.error('Error fetching sales customers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sales customers' });
  }
});

// Search sales customers by name, mobile, or place
router.get('/search', [query('q').notEmpty()], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchQuery = req.query.q as string;
    const searchTerm = `%${searchQuery}%`;

    const salesCustomers = await prisma.salesCustomer.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { mobile: { contains: searchTerm, mode: 'insensitive' } },
          { place: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(salesCustomers);
  } catch (error: any) {
    console.error('Error searching sales customers:', error);
    res.status(500).json({ error: error.message || 'Failed to search sales customers' });
  }
});

// Create sales customer
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('mobile').notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('place').optional().isString().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, mobile, email, place } = req.body;

      const salesCustomer = await prisma.salesCustomer.create({
        data: {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email ? email.trim().toLowerCase() : null,
          place: place ? place.trim() : null,
        },
      });

      res.status(201).json(salesCustomer);
    } catch (error: any) {
      console.error('Error creating sales customer:', error);
      res.status(500).json({ error: error.message || 'Failed to create sales customer' });
    }
  }
);

// Update sales customer
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('mobile').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('place').optional().isString().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, mobile, email, place } = req.body;

      // Check if sales customer exists
      const existing = await prisma.salesCustomer.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Sales customer not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (mobile) updateData.mobile = mobile.trim();
      if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
      if (place !== undefined) updateData.place = place ? place.trim() : null;

      const salesCustomer = await prisma.salesCustomer.update({
        where: { id },
        data: updateData,
      });

      res.json(salesCustomer);
    } catch (error: any) {
      console.error('Error updating sales customer:', error);
      res.status(500).json({ error: error.message || 'Failed to update sales customer' });
    }
  }
);

// Delete sales customer
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if sales customer exists
    const existing = await prisma.salesCustomer.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sales customer not found' });
    }

    await prisma.salesCustomer.delete({
      where: { id },
    });

    res.json({ message: 'Sales customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting sales customer:', error);
    res.status(500).json({ error: error.message || 'Failed to delete sales customer' });
  }
});

export default router;

