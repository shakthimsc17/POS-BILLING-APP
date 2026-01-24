import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get settings
router.get('/', async (req: AuthRequest, res) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { customerId: req.customerId! },
    });

    // If settings don't exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          customerId: req.customerId!,
          activityLogEnabled: true,
          itemLogActions: 'update_delete',
          receiptHeaderOption: 'both',
        },
      });
    }

    res.json({
      id: settings.id,
      customer_id: settings.customerId,
      activity_log_enabled: settings.activityLogEnabled,
      item_log_actions: settings.itemLogActions,
      receipt_header_option: settings.receiptHeaderOption,
      created_at: settings.createdAt.toISOString(),
      updated_at: settings.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch settings' });
  }
});

// Update settings
router.post(
  '/',
  [
    body('activity_log_enabled').optional().isBoolean(),
    body('item_log_actions').optional().isIn(['all', 'update_delete']),
    body('receipt_header_option').optional().isIn(['logo', 'company_name', 'both']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        activity_log_enabled,
        item_log_actions,
        receipt_header_option,
      } = req.body;

      // Check if settings exist
      const existing = await prisma.settings.findUnique({
        where: { customerId: req.customerId! },
      });

      let settings;
      if (existing) {
        // Update existing settings
        settings = await prisma.settings.update({
          where: { id: existing.id },
          data: {
            activityLogEnabled: activity_log_enabled !== undefined ? activity_log_enabled : existing.activityLogEnabled,
            itemLogActions: item_log_actions || existing.itemLogActions,
            receiptHeaderOption: receipt_header_option || existing.receiptHeaderOption,
          },
        });
      } else {
        // Create new settings
        settings = await prisma.settings.create({
          data: {
            customerId: req.customerId!,
            activityLogEnabled: activity_log_enabled !== undefined ? activity_log_enabled : true,
            itemLogActions: item_log_actions || 'update_delete',
            receiptHeaderOption: receipt_header_option || 'both',
          },
        });
      }

      res.json({
        id: settings.id,
        customer_id: settings.customerId,
        activity_log_enabled: settings.activityLogEnabled,
        item_log_actions: settings.itemLogActions,
        receipt_header_option: settings.receiptHeaderOption,
        created_at: settings.createdAt.toISOString(),
        updated_at: settings.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: error.message || 'Failed to save settings' });
    }
  }
);

export default router;

