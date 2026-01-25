import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get company details
router.get('/', async (req: AuthRequest, res) => {
  try {
    const company = await prisma.company.findFirst();

    if (!company) {
      return res.json({
        id: null,
        customer_id: '',
        name: 'My Store',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        gstin: '',
        website: '',
        logo: '',
        business_type: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    res.json({
      id: company.id,
      customer_id: company.customerId,
      name: company.name,
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      pincode: company.pincode || '',
      phone: company.phone || '',
      email: company.email || '',
      gstin: company.gstin || '',
      website: company.website || '',
      logo: company.logo || '',
      business_type: company.businessType || null,
      created_at: company.createdAt.toISOString(),
      updated_at: company.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch company details' });
  }
});

// Create or update company details
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('address').optional().isString(),
    body('city').optional().isString(),
    body('state').optional().isString(),
    body('pincode').optional().isString(),
    body('phone').optional().isString(),
    body('email').optional().isEmail(),
    body('gstin').optional().isString(),
    body('website').optional().isString(),
    body('logo').optional().isString(),
    body('business_type').optional().isIn(['clothing', 'cafe', 'electrical']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        gstin,
        website,
        logo,
        business_type,
      } = req.body;

      const existing = await prisma.company.findFirst();

      let company;
      const isUpdate = !!existing;
      
      if (existing) {
        // Prepare old values for activity log
        const oldValues = {
          name: existing.name,
          address: existing.address,
          city: existing.city,
          state: existing.state,
        };

        company = await prisma.company.update({
          where: { id: existing.id },
          data: {
            name,
            address,
            city,
            state,
            pincode,
            phone,
            email,
            gstin,
            website,
            logo,
            businessType: business_type || null,
          },
        });

        // Log activity for update
        await logActivity({
          entityType: 'company',
          entityId: company.id,
          action: 'update',
          changedBy: req.customerId!,
          changes: {
            old: oldValues,
            new: {
              name: company.name,
              address: company.address,
              city: company.city,
              state: company.state,
            },
          },
        });
      } else {
        company = await prisma.company.create({
          data: {
            customerId: req.customerId!,
            name,
            address,
            city,
            state,
            pincode,
            phone,
            email,
            gstin,
            website,
            logo,
            businessType: business_type || null,
          },
        });

        // Log activity for create
        await logActivity({
          entityType: 'company',
          entityId: company.id,
          action: 'create',
          changedBy: req.customerId!,
          changes: {
            name: company.name,
            address: company.address,
          },
        });
      }

      // Transform to snake_case for frontend
      res.json({
        id: company.id,
        customer_id: company.customerId,
        name: company.name,
        address: company.address,
        city: company.city,
        state: company.state,
        pincode: company.pincode,
        phone: company.phone,
        email: company.email,
        gstin: company.gstin,
        website: company.website,
        logo: company.logo,
        business_type: company.businessType || null,
        created_at: company.createdAt.toISOString(),
        updated_at: company.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error saving company:', error);
      res.status(500).json({ error: error.message || 'Failed to save company details' });
    }
  }
);

export default router;

