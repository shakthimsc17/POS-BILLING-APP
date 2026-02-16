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
        name_tamil: '',
        address: '',
        address_tamil: '',
        city: '',
        city_tamil: '',
        state: '',
        state_tamil: '',
        pincode: '',
        phone: '',
        email: '',
        gstin: '',
        website: '',
        logo: '',
        business_type: null,
        receipt_language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    res.json({
      id: company.id,
      customer_id: company.customerId,
      name: company.name,
      name_tamil: company.nameTamil || '',
      address: company.address || '',
      address_tamil: company.addressTamil || '',
      city: company.city || '',
      city_tamil: company.cityTamil || '',
      state: company.state || '',
      state_tamil: company.stateTamil || '',
      pincode: company.pincode || '',
      phone: company.phone || '',
      email: company.email || '',
      gstin: company.gstin || '',
      website: company.website || '',
      logo: company.logo || '',
      business_type: company.businessType || null,
      receipt_language: company.receiptLanguage || 'en',
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
    body('nameTamil').optional().isString(),
    body('address').optional().isString(),
    body('addressTamil').optional().isString(),
    body('city').optional().isString(),
    body('cityTamil').optional().isString(),
    body('state').optional().isString(),
    body('stateTamil').optional().isString(),
    body('pincode').optional().isString(),
    body('phone').optional().isString(),
    body('email').optional().isEmail(),
    body('gstin').optional().isString(),
    body('website').optional().isString(),
    body('logo').optional().isString(),
    body('business_type').optional().isIn(['clothing', 'cafe', 'electrical']),
    body('receipt_language').optional().isIn(['en', 'ta']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        nameTamil,
        address,
        addressTamil,
        city,
        cityTamil,
        state,
        stateTamil,
        pincode,
        phone,
        email,
        gstin,
        website,
        logo,
        business_type,
        receipt_language,
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
            nameTamil,
            address,
            addressTamil,
            city,
            cityTamil,
            state,
            stateTamil,
            pincode,
            phone,
            email,
            gstin,
            website,
            logo,
            businessType: business_type || null,
            receiptLanguage: receipt_language || null,
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
            nameTamil,
            address,
            addressTamil,
            city,
            cityTamil,
            state,
            stateTamil,
            pincode,
            phone,
            email,
            gstin,
            website,
            logo,
            businessType: business_type || null,
            receiptLanguage: receipt_language || null,
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
        name_tamil: company.nameTamil || '',
        address: company.address,
        address_tamil: company.addressTamil || '',
        city: company.city,
        city_tamil: company.cityTamil || '',
        state: company.state,
        state_tamil: company.stateTamil || '',
        pincode: company.pincode,
        phone: company.phone,
        email: company.email,
        gstin: company.gstin,
        website: company.website,
        logo: company.logo,
        business_type: company.businessType || null,
        receipt_language: company.receiptLanguage || 'en',
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

