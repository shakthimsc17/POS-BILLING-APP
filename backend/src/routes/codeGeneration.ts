import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { CodeGenerationService } from '../services/codeGenerationService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Generate item code
router.post('/generate-code', [
  body('mode').isIn(['supplier', 'brand', 'manual', 'auto']),
  body('customerId').notEmpty(),
  body('supplierId').optional().isUUID(),
  body('brandId').optional().isUUID(),
  body('productCode').optional().isString(),
  body('manualCode').optional().isString(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const options = {
      ...req.body,
      customerId: req.customerId!, // Use authenticated customer ID
    };

    const result = await CodeGenerationService.generateCode(options);
    res.json(result);
  } catch (error: any) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: error.message || 'Failed to generate code' });
  }
});

// Validate item code
router.post('/validate-code', [
  body('code').notEmpty().isString(),
  body('excludeItemId').optional().isUUID(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, excludeItemId } = req.body;
    const isValid = await CodeGenerationService.validateCode(code, req.customerId!, excludeItemId);
    
    res.json({ isValid, code });
  } catch (error: any) {
    console.error('Error validating code:', error);
    res.status(500).json({ error: error.message || 'Failed to validate code' });
  }
});

// Get suppliers for code generation
router.get('/suppliers', async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await CodeGenerationService.getSuppliers(req.customerId!);
    res.json(suppliers);
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch suppliers' });
  }
});

// Get brands for code generation
router.get('/brands', async (req: AuthRequest, res: Response) => {
  try {
    const brands = await CodeGenerationService.getBrands(req.customerId!);
    res.json(brands);
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch brands' });
  }
});

// Get brands for specific supplier
router.get('/suppliers/:supplierId/brands', async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId } = req.params;
    const brands = await CodeGenerationService.getBrandsForSupplier(req.customerId!, supplierId);
    res.json(brands);
  } catch (error: any) {
    console.error('Error fetching supplier brands:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch supplier brands' });
  }
});

// Get product code suggestions
router.get('/suggest-codes', async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, brandId } = req.query;
    
    const suggestions = await CodeGenerationService.suggestProductCodes(
      req.customerId!,
      supplierId as string,
      brandId as string
    );
    
    res.json(suggestions);
  } catch (error: any) {
    console.error('Error generating code suggestions:', error);
    res.status(500).json({ error: error.message || 'Failed to generate code suggestions' });
  }
});

export default router;
