import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all brands
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { customerId: req.customerId! },
      orderBy: { name: 'asc' },
    });

    // Transform to snake_case
    const transformedBrands = brands.map(brand => ({
      id: brand.id,
      customer_id: brand.customerId,
      name: brand.name,
      code: brand.code,
      description: brand.description,
      logo_url: brand.logoUrl,
      website: brand.website,
      contact_email: brand.contactEmail,
      contact_phone: brand.contactPhone,
      is_active: brand.isActive,
      created_at: brand.createdAt.toISOString(),
      updated_at: brand.updatedAt.toISOString(),
    }));

    res.json(transformedBrands);
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch brands' });
  }
});

// Create brand
router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Brand name is required'),
    body('code').notEmpty().trim().withMessage('Brand code is required'),
    body('description').optional().trim(),
    body('website').optional({ values: 'falsy' }).isURL(),
    body('contact_email').optional({ values: 'falsy' }).isEmail(),
    body('contact_phone').optional({ values: 'falsy' }).isMobilePhone('any'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        code,
        description,
        logo_url,
        logoUrl,
        website,
        contact_email,
        contactEmail,
        contact_phone,
        contactPhone,
        is_active,
        isActive,
      } = req.body;

      const finalLogoUrl = logoUrl || logo_url;
      const finalContactEmail = contactEmail || contact_email;
      const finalContactPhone = contactPhone || contact_phone;
      const finalIsActive = isActive !== undefined ? isActive : is_active;

      const brand = await prisma.brand.create({
        data: {
          customerId: req.customerId!,
          name,
          code,
          description,
          logoUrl: finalLogoUrl,
          website,
          contactEmail: finalContactEmail,
          contactPhone: finalContactPhone,
          isActive: finalIsActive !== undefined ? finalIsActive : true,
        },
      });

      res.status(201).json({
        id: brand.id,
        customer_id: brand.customerId,
        name: brand.name,
        code: brand.code,
        description: brand.description,
        logo_url: brand.logoUrl,
        website: brand.website,
        contact_email: brand.contactEmail,
        contact_phone: brand.contactPhone,
        is_active: brand.isActive,
        created_at: brand.createdAt.toISOString(),
        updated_at: brand.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating brand:', error);
      res.status(500).json({ error: error.message || 'Failed to create brand' });
    }
  }
);

// Update brand
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('code').optional().trim(),
    body('website').optional({ values: 'falsy' }).isURL(),
    body('contact_email').optional({ values: 'falsy' }).isEmail(),
    body('contact_phone').optional({ values: 'falsy' }).isMobilePhone('any'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        description,
        logo_url,
        logoUrl,
        website,
        contact_email,
        contactEmail,
        contact_phone,
        contactPhone,
        is_active,
        isActive,
      } = req.body;

      const existing = await prisma.brand.findFirst({
        where: { id, customerId: req.customerId! },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Brand not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (description !== undefined) updateData.description = description;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (logo_url !== undefined) updateData.logoUrl = logo_url;
      if (website !== undefined) updateData.website = website;
      if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
      if (contact_email !== undefined) updateData.contactEmail = contact_email;
      if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
      if (contact_phone !== undefined) updateData.contactPhone = contact_phone;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (is_active !== undefined) updateData.isActive = is_active;

      const brand = await prisma.brand.update({
        where: { id },
        data: updateData,
      });

      res.json({
        id: brand.id,
        customer_id: brand.customerId,
        name: brand.name,
        code: brand.code,
        description: brand.description,
        logo_url: brand.logoUrl,
        website: brand.website,
        contact_email: brand.contactEmail,
        contact_phone: brand.contactPhone,
        is_active: brand.isActive,
        created_at: brand.createdAt.toISOString(),
        updated_at: brand.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating brand:', error);
      res.status(500).json({ error: error.message || 'Failed to update brand' });
    }
  }
);

// Delete brand
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check usage in items
    const itemsUsingBrand = await prisma.item.count({
      where: { brandId: id, customerId: req.customerId! }
    });

    if (itemsUsingBrand > 0) {
      return res.status(400).json({ error: 'Cannot delete brand because it is used by items' });
    }

    await prisma.brand.delete({
      where: { id, customerId: req.customerId! },
    });

    res.json({ message: 'Brand deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: error.message || 'Failed to delete brand' });
  }
});

export default router;
