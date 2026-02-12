import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// --- UOM Master Routes ---

// Get all UOMs
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const uoms = await prisma.uomMaster.findMany({
      where: { customerId: req.customerId! },
      orderBy: { name: 'asc' },
      include: {
        baseUom: true,
      }
    });

    // Transform to snake_case
    const transformedUoms = uoms.map(uom => ({
      id: uom.id,
      customer_id: uom.customerId,
      name: uom.name,
      code: uom.code,
      category: uom.category,
      base_uom_id: uom.baseUomId,
      base_uom_name: uom.baseUom?.name,
      conversion_factor: uom.conversionFactor,
      is_base_uom: uom.isBaseUom,
      created_at: uom.createdAt.toISOString(),
    }));

    res.json(transformedUoms);
  } catch (error: any) {
    console.error('Error fetching UOMs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch UOMs' });
  }
});

// Create UOM
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('code').notEmpty().trim(),
    body('category').notEmpty().trim(),
    body('conversion_factor').optional().isFloat({ min: 0 }),
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
        category,
        base_uom_id,
        baseUomId,
        conversion_factor,
        conversionFactor,
        is_base_uom,
        isBaseUom,
      } = req.body;

      const finalBaseUomId = baseUomId || base_uom_id;
      const finalConversionFactor = conversionFactor !== undefined ? conversionFactor : conversion_factor;
      const finalIsBaseUom = isBaseUom !== undefined ? isBaseUom : is_base_uom;

      const uom = await prisma.uomMaster.create({
        data: {
          customerId: req.customerId!,
          name,
          code,
          category,
          baseUomId: finalBaseUomId || null,
          conversionFactor: finalConversionFactor ? parseFloat(finalConversionFactor) : 1.0,
          isBaseUom: finalIsBaseUom || false,
        },
      });

      res.status(201).json({
        id: uom.id,
        customer_id: uom.customerId,
        name: uom.name,
        code: uom.code,
        category: uom.category,
        base_uom_id: uom.baseUomId,
        conversion_factor: uom.conversionFactor,
        is_base_uom: uom.isBaseUom,
        created_at: uom.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating UOM:', error);
      res.status(500).json({ error: error.message || 'Failed to create UOM' });
    }
  }
);

// Update UOM
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('code').optional().notEmpty().trim(),
    body('conversion_factor').optional().isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        category,
        base_uom_id,
        baseUomId,
        conversion_factor,
        conversionFactor,
        is_base_uom,
        isBaseUom,
      } = req.body;

      const finalBaseUomId = baseUomId !== undefined ? baseUomId : base_uom_id;
      const finalConversionFactor = conversionFactor !== undefined ? conversionFactor : conversion_factor;
      const finalIsBaseUom = isBaseUom !== undefined ? isBaseUom : is_base_uom;

      const existing = await prisma.uomMaster.findFirst({
        where: { id, customerId: req.customerId! },
      });

      if (!existing) {
        return res.status(404).json({ error: 'UOM not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (code) updateData.code = code;
      if (category) updateData.category = category;
      if (finalBaseUomId !== undefined) updateData.baseUomId = finalBaseUomId;
      if (finalConversionFactor !== undefined) updateData.conversionFactor = parseFloat(finalConversionFactor);
      if (finalIsBaseUom !== undefined) updateData.isBaseUom = finalIsBaseUom;

      const uom = await prisma.uomMaster.update({
        where: { id },
        data: updateData,
      });

      res.json({
        id: uom.id,
        customer_id: uom.customerId,
        name: uom.name,
        code: uom.code,
        category: uom.category,
        base_uom_id: uom.baseUomId,
        conversion_factor: uom.conversionFactor,
        is_base_uom: uom.isBaseUom,
        created_at: uom.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating UOM:', error);
      res.status(500).json({ error: error.message || 'Failed to update UOM' });
    }
  }
);

// Delete UOM
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check usage in items
    const itemsUsingUom = await prisma.item.count({
      where: { uomId: id, customerId: req.customerId! }
    });

    if (itemsUsingUom > 0) {
      return res.status(400).json({ error: 'Cannot delete UOM because it is used by items' });
    }

    await prisma.uomMaster.delete({
      where: { id, customerId: req.customerId! },
    });

    res.json({ message: 'UOM deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting UOM:', error);
    res.status(500).json({ error: error.message || 'Failed to delete UOM' });
  }
});

// --- UOM Conversion Routes ---

// Get all conversions
router.get('/conversions', async (req: AuthRequest, res: Response) => {
  try {
    const conversions = await prisma.uomConversion.findMany({
      where: { customerId: req.customerId! },
      include: {
        fromUom: true,
        toUom: true,
      }
    });

    const transformed = conversions.map(c => ({
      id: c.id,
      customer_id: c.customerId,
      from_uom_id: c.fromUomId,
      from_uom_name: c.fromUom.name,
      to_uom_id: c.toUomId,
      to_uom_name: c.toUom.name,
      conversion_factor: c.conversionFactor,
      created_at: c.createdAt.toISOString(),
    }));

    res.json(transformed);
  } catch (error: any) {
    console.error('Error fetching conversions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch conversions' });
  }
});

// Create Conversion
router.post('/conversions', 
  [
    body('from_uom_id').notEmpty(),
    body('to_uom_id').notEmpty(),
    body('conversion_factor').isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { from_uom_id, to_uom_id, conversion_factor } = req.body;

      // Check if conversion already exists
      const existing = await prisma.uomConversion.findUnique({
        where: {
          customerId_fromUomId_toUomId: {
            customerId: req.customerId!,
            fromUomId: from_uom_id,
            toUomId: to_uom_id,
          }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Conversion already exists' });
      }

      const conversion = await prisma.uomConversion.create({
        data: {
          customerId: req.customerId!,
          fromUomId: from_uom_id,
          toUomId: to_uom_id,
          conversionFactor: parseFloat(conversion_factor),
        }
      });

      res.status(201).json({
        id: conversion.id,
        customer_id: conversion.customerId,
        from_uom_id: conversion.fromUomId,
        to_uom_id: conversion.toUomId,
        conversion_factor: conversion.conversionFactor,
        created_at: conversion.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating conversion:', error);
      res.status(500).json({ error: error.message || 'Failed to create conversion' });
    }
  }
);

export default router;
