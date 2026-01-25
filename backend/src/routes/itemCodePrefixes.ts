import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all item code prefixes (shared across all users)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const prefixes = await prisma.itemCodePrefix.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(prefixes);
  } catch (error: any) {
    console.error('Error fetching item code prefixes:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch item code prefixes' });
  }
});

// Create item code prefix (or get existing if already exists)
router.post(
  '/',
  [
    body('prefix').notEmpty().trim(),
    body('description').optional().isString().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { prefix, description } = req.body;
      const trimmedPrefix = prefix.trim();

      // Check if prefix already exists
      let itemCodePrefix = await prisma.itemCodePrefix.findUnique({
        where: { prefix: trimmedPrefix },
      });

      if (itemCodePrefix) {
        // Return existing prefix
        res.json(itemCodePrefix);
      } else {
        // Create new prefix
        itemCodePrefix = await prisma.itemCodePrefix.create({
          data: {
            prefix: trimmedPrefix,
            description,
          },
        });
        res.status(201).json(itemCodePrefix);
      }
    } catch (error: any) {
      console.error('Error creating item code prefix:', error);
      res.status(500).json({ error: error.message || 'Failed to create item code prefix' });
    }
  }
);

// Update item code prefix
router.put(
  '/:id',
  [
    body('prefix').optional().notEmpty().trim(),
    body('description').optional().isString().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { prefix, description } = req.body;

      const itemCodePrefix = await prisma.itemCodePrefix.update({
        where: { id },
        data: {
          prefix,
          description,
        },
      });

      res.json(itemCodePrefix);
    } catch (error: any) {
      console.error('Error updating item code prefix:', error);
      res.status(500).json({ error: error.message || 'Failed to update item code prefix' });
    }
  }
);

// Delete item code prefix
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.itemCodePrefix.delete({
      where: { id },
    });

    res.json({ message: 'Item code prefix deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item code prefix:', error);
    res.status(500).json({ error: error.message || 'Failed to delete item code prefix' });
  }
});

export default router;

