import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all suppliers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { customerId: req.customerId! },
      orderBy: { name: 'asc' },
      include: {
        supplierBrands: {
          include: {
            brand: true,
          },
        },
      },
    });

    // Transform to snake_case
    const transformedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      customer_id: supplier.customerId,
      name: supplier.name,
      code: supplier.code,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      mobile: supplier.mobile,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      pincode: supplier.pincode,
      gstin: supplier.gstin,
      pan_number: supplier.panNumber,
      payment_terms: supplier.paymentTerms,
      credit_limit: supplier.creditLimit,
      is_active: supplier.isActive,
      created_at: supplier.createdAt.toISOString(),
      updated_at: supplier.updatedAt.toISOString(),
      brands: supplier.supplierBrands.map(sb => ({
        id: sb.brand.id,
        name: sb.brand.name,
        code: sb.brand.code,
        supplier_brand_code: sb.supplierBrandCode,
        is_preferred: sb.isPreferred,
      })),
    }));

    res.json(transformedSuppliers);
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch suppliers' });
  }
});

// Create supplier
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('code').notEmpty().trim(),
    body('email').optional({ values: 'falsy' }).isEmail(),
    body('phone').optional({ values: 'falsy' }).isMobilePhone('any'),
    body('mobile').optional({ values: 'falsy' }).isMobilePhone('any'),
    body('gstin').optional({ values: 'falsy' }).matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
    body('pan_number').optional({ values: 'falsy' }).matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
    body('credit_limit').optional({ values: 'falsy' }).isFloat({ min: 0 }),
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
        contact_person,
        contactPerson,
        email,
        phone,
        mobile,
        address,
        city,
        state,
        pincode,
        gstin,
        pan_number,
        panNumber,
        payment_terms,
        paymentTerms,
        credit_limit,
        creditLimit,
        is_active,
        isActive,
      } = req.body;

      const finalContactPerson = contactPerson || contact_person;
      const finalPanNumber = panNumber || pan_number;
      const finalPaymentTerms = paymentTerms || payment_terms;
      const finalCreditLimit = creditLimit !== undefined ? creditLimit : credit_limit;
      const finalIsActive = isActive !== undefined ? isActive : is_active;

      const supplier = await prisma.supplier.create({
        data: {
          customerId: req.customerId!,
          name,
          code,
          contactPerson: finalContactPerson,
          email,
          phone,
          mobile,
          address,
          city,
          state,
          pincode,
          gstin,
          panNumber: finalPanNumber,
          paymentTerms: finalPaymentTerms,
          creditLimit: finalCreditLimit ? parseFloat(finalCreditLimit) : null,
          isActive: finalIsActive !== undefined ? finalIsActive : true,
        },
      });

      res.status(201).json({
        id: supplier.id,
        customer_id: supplier.customerId,
        name: supplier.name,
        code: supplier.code,
        contact_person: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        mobile: supplier.mobile,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        pincode: supplier.pincode,
        gstin: supplier.gstin,
        pan_number: supplier.panNumber,
        payment_terms: supplier.paymentTerms,
        credit_limit: supplier.creditLimit,
        is_active: supplier.isActive,
        created_at: supplier.createdAt.toISOString(),
        updated_at: supplier.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ error: error.message || 'Failed to create supplier' });
    }
  }
);

// Update supplier
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('code').optional().notEmpty().trim(),
    body('email').optional({ values: 'falsy' }).isEmail(),
    body('phone').optional({ values: 'falsy' }).isMobilePhone('any'),
    body('mobile').optional({ values: 'falsy' }).isMobilePhone('any'),
    body('gstin').optional({ values: 'falsy' }).matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
    body('pan_number').optional({ values: 'falsy' }).matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
    body('credit_limit').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        contact_person,
        contactPerson,
        email,
        phone,
        mobile,
        address,
        city,
        state,
        pincode,
        gstin,
        pan_number,
        panNumber,
        payment_terms,
        paymentTerms,
        credit_limit,
        creditLimit,
        is_active,
        isActive,
      } = req.body;

      const existing = await prisma.supplier.findFirst({
        where: { id, customerId: req.customerId! },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
      if (contact_person !== undefined) updateData.contactPerson = contact_person;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (mobile !== undefined) updateData.mobile = mobile;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (pincode !== undefined) updateData.pincode = pincode;
      if (gstin !== undefined) updateData.gstin = gstin;
      if (panNumber !== undefined) updateData.panNumber = panNumber;
      if (pan_number !== undefined) updateData.panNumber = pan_number;
      if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
      if (payment_terms !== undefined) updateData.paymentTerms = payment_terms;
      if (creditLimit !== undefined) updateData.creditLimit = creditLimit ? parseFloat(creditLimit) : null;
      if (credit_limit !== undefined) updateData.creditLimit = credit_limit ? parseFloat(credit_limit) : null;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (is_active !== undefined) updateData.isActive = is_active;

      const supplier = await prisma.supplier.update({
        where: { id },
        data: updateData,
      });

      res.json({
        id: supplier.id,
        customer_id: supplier.customerId,
        name: supplier.name,
        code: supplier.code,
        contact_person: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        mobile: supplier.mobile,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        pincode: supplier.pincode,
        gstin: supplier.gstin,
        pan_number: supplier.panNumber,
        payment_terms: supplier.paymentTerms,
        credit_limit: supplier.creditLimit,
        is_active: supplier.isActive,
        created_at: supplier.createdAt.toISOString(),
        updated_at: supplier.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ error: error.message || 'Failed to update supplier' });
    }
  }
);

// Delete supplier
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check usage in items
    const itemsUsingSupplier = await prisma.item.count({
      where: { supplierId: id, customerId: req.customerId! }
    });

    if (itemsUsingSupplier > 0) {
      return res.status(400).json({ error: 'Cannot delete supplier because it is used by items' });
    }

    await prisma.supplier.delete({
      where: { id, customerId: req.customerId! },
    });

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: error.message || 'Failed to delete supplier' });
  }
});

// Get supplier brands
router.get('/:id/brands', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const supplierBrands = await prisma.supplierBrand.findMany({
      where: { 
        supplierId: id,
        customerId: req.customerId! 
      },
      include: {
        brand: true,
      },
    });

    const transformed = supplierBrands.map(sb => ({
      id: sb.id,
      brand_id: sb.brandId,
      brand_name: sb.brand.name,
      brand_code: sb.brand.code,
      supplier_brand_code: sb.supplierBrandCode,
      is_preferred: sb.isPreferred,
      created_at: sb.createdAt.toISOString(),
    }));

    res.json(transformed);
  } catch (error: any) {
    console.error('Error fetching supplier brands:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch supplier brands' });
  }
});

// Add brand to supplier
router.post(
  '/:id/brands',
  [
    body('brand_id').notEmpty(),
    body('supplier_brand_code').optional().trim(),
    body('is_preferred').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { brand_id, supplier_brand_code, is_preferred } = req.body;

      // Verify supplier exists
      const supplier = await prisma.supplier.findFirst({
        where: { id, customerId: req.customerId! },
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      // Check if mapping already exists
      const existing = await prisma.supplierBrand.findUnique({
        where: {
          customerId_supplierId_brandId: {
            customerId: req.customerId!,
            supplierId: id,
            brandId: brand_id,
          }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Brand already mapped to this supplier' });
      }

      const supplierBrand = await prisma.supplierBrand.create({
        data: {
          customerId: req.customerId!,
          supplierId: id,
          brandId: brand_id,
          supplierBrandCode: supplier_brand_code,
          isPreferred: is_preferred || false,
        },
      });

      res.status(201).json({
        id: supplierBrand.id,
        customer_id: supplierBrand.customerId,
        supplier_id: supplierBrand.supplierId,
        brand_id: supplierBrand.brandId,
        supplier_brand_code: supplierBrand.supplierBrandCode,
        is_preferred: supplierBrand.isPreferred,
        created_at: supplierBrand.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error adding brand to supplier:', error);
      res.status(500).json({ error: error.message || 'Failed to add brand to supplier' });
    }
  }
);

// Remove brand from supplier
router.delete('/:id/brands/:brandId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, brandId } = req.params;
    
    await prisma.supplierBrand.delete({
      where: {
        customerId_supplierId_brandId: {
          customerId: req.customerId!,
          supplierId: id,
          brandId: brandId,
        }
      },
    });

    res.json({ message: 'Brand removed from supplier successfully' });
  } catch (error: any) {
    console.error('Error removing brand from supplier:', error);
    res.status(500).json({ error: error.message || 'Failed to remove brand from supplier' });
  }
});

export default router;
