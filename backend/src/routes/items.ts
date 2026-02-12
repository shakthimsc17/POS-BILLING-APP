import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all items - show all items to all authenticated users (shared inventory)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 10000 }),
  query('all').optional().isIn(['true', 'false']),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fetchAll = req.query.all === 'true';
    const page = parseInt(req.query.page as string) || 1;
    const limit = fetchAll ? undefined : (parseInt(req.query.limit as string) || 100);
    const skip = fetchAll ? 0 : (page - 1) * (limit as number);

    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        ...(fetchAll ? {} : { skip, take: limit }),
        orderBy: { createdAt: 'desc' },
        include: { uom: true },
      }),
      prisma.item.count(),
    ]);

    // Transform to snake_case for frontend
    const transformedItems = items.map(item => ({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      hsn_code: item.hsnCode,
      gst_rate: item.gstRate,
      cess_rate: item.cessRate,
      uom_id: item.uomId,
      uom_name: item.uom?.name,
      weight_per_unit: item.weightPerUnit,
      volume_per_unit: item.volumePerUnit,
      length_per_unit: item.lengthPerUnit,
      width_per_unit: item.widthPerUnit,
      height_per_unit: item.heightPerUnit,
      manufacturer: item.manufacturer,
      brand: item.brand,
      model_number: item.modelNumber,
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
      shelf_life_days: item.shelfLifeDays,
      min_stock_level: item.minStockLevel,
      max_stock_level: item.maxStockLevel,
      reorder_level: item.reorderLevel,
      package_type: item.packageType,
      package_quantity: item.packageQuantity,
      is_perishable: item.isPerishable,
      storage_conditions: item.storageConditions,
      created_at: item.createdAt.toISOString(),
    }));

    res.json({
      items: transformedItems,
      pagination: {
        page: fetchAll ? 1 : page,
        limit: fetchAll ? totalCount : limit,
        total: totalCount,
        totalPages: fetchAll ? 1 : Math.ceil(totalCount / (limit as number)),
        hasMore: fetchAll ? false : skip + (limit as number) < totalCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch items' });
  }
});

// Search items
router.get('/search', [query('q').notEmpty()], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchQuery = req.query.q as string;

    const items = await prisma.item.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { code: { contains: searchQuery, mode: 'insensitive' } },
          { barcode: { contains: searchQuery, mode: 'insensitive' } },
          { mappingCode: { contains: searchQuery, mode: 'insensitive' } },
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: { uom: true }
    });

    // Transform to snake_case for frontend
    const transformedItems = items.map(item => ({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      hsn_code: item.hsnCode,
      gst_rate: item.gstRate,
      cess_rate: item.cessRate,
      uom_id: item.uomId,
      uom_name: item.uom?.name,
      weight_per_unit: item.weightPerUnit,
      volume_per_unit: item.volumePerUnit,
      length_per_unit: item.lengthPerUnit,
      width_per_unit: item.widthPerUnit,
      height_per_unit: item.heightPerUnit,
      manufacturer: item.manufacturer,
      brand: item.brand,
      model_number: item.modelNumber,
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
      shelf_life_days: item.shelfLifeDays,
      min_stock_level: item.minStockLevel,
      max_stock_level: item.maxStockLevel,
      reorder_level: item.reorderLevel,
      package_type: item.packageType,
      package_quantity: item.packageQuantity,
      is_perishable: item.isPerishable,
      storage_conditions: item.storageConditions,
      created_at: item.createdAt.toISOString(),
    }));

    res.json(transformedItems);
  } catch (error: any) {
    console.error('Error searching items:', error);
    res.status(500).json({ error: error.message || 'Failed to search items' });
  }
});

// Get items by categories
router.get('/by-categories', [query('categoryIds').notEmpty()], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryIdsParam = req.query.categoryIds as string;
    const categoryIds = categoryIdsParam.split(',').filter(id => id.trim() !== '');

    if (categoryIds.length === 0) {
      return res.status(400).json({ error: 'At least one category ID is required' });
    }

    const items = await prisma.item.findMany({
      where: {
        categoryId: {
          in: categoryIds,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: { uom: true }
    });

    // Transform to snake_case for frontend
    const transformedItems = items.map(item => ({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      hsn_code: item.hsnCode,
      gst_rate: item.gstRate,
      cess_rate: item.cessRate,
      uom_id: item.uomId,
      uom_name: item.uom?.name,
      weight_per_unit: item.weightPerUnit,
      volume_per_unit: item.volumePerUnit,
      length_per_unit: item.lengthPerUnit,
      width_per_unit: item.widthPerUnit,
      height_per_unit: item.heightPerUnit,
      manufacturer: item.manufacturer,
      brand: item.brand,
      model_number: item.modelNumber,
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
      shelf_life_days: item.shelfLifeDays,
      min_stock_level: item.minStockLevel,
      max_stock_level: item.maxStockLevel,
      reorder_level: item.reorderLevel,
      package_type: item.packageType,
      package_quantity: item.packageQuantity,
      is_perishable: item.isPerishable,
      storage_conditions: item.storageConditions,
      created_at: item.createdAt.toISOString(),
    }));

    res.json(transformedItems);
  } catch (error: any) {
    console.error('Error fetching items by categories:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch items by categories' });
  }
});

// Get item by barcode (exact match)
router.get('/barcode/:barcode', async (req: AuthRequest, res) => {
  try {
    const { barcode } = req.params;

    const item = await prisma.item.findFirst({
      where: {
        barcode,
      },
      include: { uom: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Transform to snake_case for frontend
    res.json({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      hsn_code: item.hsnCode,
      gst_rate: item.gstRate,
      cess_rate: item.cessRate,
      uom_id: item.uomId,
      uom_name: item.uom?.name,
      weight_per_unit: item.weightPerUnit,
      volume_per_unit: item.volumePerUnit,
      length_per_unit: item.lengthPerUnit,
      width_per_unit: item.widthPerUnit,
      height_per_unit: item.heightPerUnit,
      manufacturer: item.manufacturer,
      brand: item.brand,
      model_number: item.modelNumber,
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
      shelf_life_days: item.shelfLifeDays,
      min_stock_level: item.minStockLevel,
      max_stock_level: item.maxStockLevel,
      reorder_level: item.reorderLevel,
      package_type: item.packageType,
      package_quantity: item.packageQuantity,
      is_perishable: item.isPerishable,
      storage_conditions: item.storageConditions,
      created_at: item.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching item by barcode:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch item' });
  }
});

// Search items by mapping code (exact match for cafe quick search)
router.get('/search-by-mapping-code/:mappingCode', async (req: AuthRequest, res) => {
  try {
    const { mappingCode } = req.params;

    const item = await prisma.item.findFirst({
      where: {
        mappingCode: {
          equals: mappingCode,
          mode: 'insensitive',
        },
      },
      include: { uom: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Transform to snake_case for frontend
    res.json({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      hsn_code: item.hsnCode,
      gst_rate: item.gstRate,
      cess_rate: item.cessRate,
      uom_id: item.uomId,
      uom_name: item.uom?.name,
      weight_per_unit: item.weightPerUnit,
      volume_per_unit: item.volumePerUnit,
      length_per_unit: item.lengthPerUnit,
      width_per_unit: item.widthPerUnit,
      height_per_unit: item.heightPerUnit,
      manufacturer: item.manufacturer,
      brand: item.brand,
      model_number: item.modelNumber,
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
      shelf_life_days: item.shelfLifeDays,
      min_stock_level: item.minStockLevel,
      max_stock_level: item.maxStockLevel,
      reorder_level: item.reorderLevel,
      package_type: item.packageType,
      package_quantity: item.packageQuantity,
      is_perishable: item.isPerishable,
      storage_conditions: item.storageConditions,
      created_at: item.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error searching item by mapping code:', error);
    res.status(500).json({ error: error.message || 'Failed to search item' });
  }
});

// Search items by barcode (case-insensitive, partial match support)
router.get('/search-by-barcode/:barcode', async (req: AuthRequest, res) => {
  try {
    const { barcode } = req.params;
    const searchTerm = `%${barcode}%`;

    const itemsRaw = await prisma.$queryRaw<any[]>`
      SELECT id FROM items
      WHERE barcode ILIKE ${searchTerm}
      ORDER BY 
        CASE 
          WHEN barcode = ${barcode} THEN 1
          WHEN barcode LIKE ${barcode + '%'} THEN 2
          ELSE 3
        END,
        created_at DESC
      LIMIT 10
    `;

    if (itemsRaw.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemIds = itemsRaw.map((item: any) => item.id);
    
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      include: { uom: true }
    });

    // Re-sort items based on the raw query order
    const itemMap = new Map(items.map(item => [item.id, item]));
    const sortedItems = itemIds.map((id: string) => itemMap.get(id)).filter(item => item !== undefined);

    // Transform to snake_case for frontend
    const transformedItems = sortedItems.map((item: any) => ({
      id: item.id,
      customer_id: item.customerId,
      name: item.name,
      display_name: item.displayName,
      code: item.code,
      barcode: item.barcode,
      mapping_code: item.mappingCode,
      category_id: item.categoryId,
      subcategory: item.subcategory,
      cost: item.cost,
      price: item.price,
      mrp: item.mrp,
      stock: item.stock,
      image_url: item.imageUrl,
      hsn_code: item.hsnCode,
      gst_rate: item.gstRate,
      cess_rate: item.cessRate,
      uom_id: item.uomId,
      uom_name: item.uom?.name,
      weight_per_unit: item.weightPerUnit,
      volume_per_unit: item.volumePerUnit,
      length_per_unit: item.lengthPerUnit,
      width_per_unit: item.widthPerUnit,
      height_per_unit: item.heightPerUnit,
      manufacturer: item.manufacturer,
      brand: item.brand,
      model_number: item.modelNumber,
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
      shelf_life_days: item.shelfLifeDays,
      min_stock_level: item.minStockLevel,
      max_stock_level: item.maxStockLevel,
      reorder_level: item.reorderLevel,
      package_type: item.packageType,
      package_quantity: item.packageQuantity,
      is_perishable: item.isPerishable,
      storage_conditions: item.storageConditions,
      created_at: item.createdAt.toISOString(),
    }));

    // Return first item if exact match, otherwise return array
    const exactMatch = transformedItems.find((item: any) => item.barcode?.toLowerCase() === barcode.toLowerCase());
    if (exactMatch) {
      res.json(exactMatch);
    } else {
      res.json(transformedItems[0]); // Return closest match
    }
  } catch (error: any) {
    console.error('Error searching item by barcode:', error);
    res.status(500).json({ error: error.message || 'Failed to search item' });
  }
});

// Create item
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('code').notEmpty().trim(),
    body('cost').isFloat({ min: 0 }),
    body('price').isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
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
        barcode,
        mappingCode,
        mapping_code, // Accept snake_case from frontend
        categoryId,
        category_id, // Accept snake_case from frontend
        subcategory,
        cost,
        price,
        mrp,
        stock,
        imageUrl,
        displayName,
        display_name, // Accept snake_case from frontend
        hsnCode,
        hsn_code, // Accept snake_case from frontend
        gstRate,
        gst_rate, // Accept snake_case from frontend
        cessRate,
        cess_rate, // Accept snake_case from frontend
        uomId, uom_id,
        weightPerUnit, weight_per_unit,
        volumePerUnit, volume_per_unit,
        lengthPerUnit, length_per_unit,
        widthPerUnit, width_per_unit,
        heightPerUnit, height_per_unit,
        manufacturer,
        brand,
        modelNumber, model_number,
        batchNumber, batch_number,
        expiryDate, expiry_date,
        shelfLifeDays, shelf_life_days,
        minStockLevel, min_stock_level,
        maxStockLevel, max_stock_level,
        reorderLevel, reorder_level,
        packageType, package_type,
        packageQuantity, package_quantity,
        isPerishable, is_perishable,
        storageConditions, storage_conditions,
      } = req.body;

      // Use categoryId (camelCase) or category_id (snake_case), whichever is provided
      const finalCategoryId = categoryId || category_id;
      
      // Use displayName (camelCase) or display_name (snake_case), whichever is provided
      const finalDisplayName = displayName !== undefined ? displayName : display_name;
      
      // Use mappingCode (camelCase) or mapping_code (snake_case), whichever is provided
      const finalMappingCode = mappingCode !== undefined ? (mappingCode === '' ? null : mappingCode) : (mapping_code !== undefined ? (mapping_code === '' ? null : mapping_code) : undefined);
      
      // Use hsnCode (camelCase) or hsn_code (snake_case), whichever is provided
      const finalHsnCode = hsnCode !== undefined ? hsnCode : hsn_code;
      
      // Use gstRate (camelCase) or gst_rate (snake_case), whichever is provided
      const finalGstRate = gstRate !== undefined ? gstRate : gst_rate;
      
      // Use cessRate (camelCase) or cess_rate (snake_case), whichever is provided
      const finalCessRate = cessRate !== undefined ? cessRate : cess_rate;

      // Handle new extended fields
      const finalUomId = uomId || uom_id;
      const finalWeightPerUnit = weightPerUnit !== undefined ? weightPerUnit : weight_per_unit;
      const finalVolumePerUnit = volumePerUnit !== undefined ? volumePerUnit : volume_per_unit;
      const finalLengthPerUnit = lengthPerUnit !== undefined ? lengthPerUnit : length_per_unit;
      const finalWidthPerUnit = widthPerUnit !== undefined ? widthPerUnit : width_per_unit;
      const finalHeightPerUnit = heightPerUnit !== undefined ? heightPerUnit : height_per_unit;
      const finalModelNumber = modelNumber !== undefined ? modelNumber : model_number;
      const finalBatchNumber = batchNumber !== undefined ? batchNumber : batch_number;
      const finalExpiryDate = expiryDate !== undefined ? expiryDate : expiry_date;
      const finalShelfLifeDays = shelfLifeDays !== undefined ? shelfLifeDays : shelf_life_days;
      const finalMinStockLevel = minStockLevel !== undefined ? minStockLevel : min_stock_level;
      const finalMaxStockLevel = maxStockLevel !== undefined ? maxStockLevel : max_stock_level;
      const finalReorderLevel = reorderLevel !== undefined ? reorderLevel : reorder_level;
      const finalPackageType = packageType !== undefined ? packageType : package_type;
      const finalPackageQuantity = packageQuantity !== undefined ? packageQuantity : package_quantity;
      const finalIsPerishable = isPerishable !== undefined ? isPerishable : is_perishable;
      const finalStorageConditions = storageConditions !== undefined ? storageConditions : storage_conditions;
      
      console.log('Creating item:', {
        name,
        code,
        categoryId_from_body: categoryId,
        category_id_from_body: category_id,
        finalCategoryId,
        displayName_from_body: displayName,
        display_name_from_body: display_name,
        finalDisplayName,
        customerId: req.customerId
      });

      const item = await prisma.item.create({
        data: {
          customerId: req.customerId!,
          name,
          displayName: finalDisplayName || null,
          code,
          barcode,
          mappingCode: finalMappingCode === '' || finalMappingCode === null ? null : (finalMappingCode || null),
          categoryId: finalCategoryId || null,
          subcategory,
          cost: parseFloat(cost),
          price: parseFloat(price),
          mrp: mrp ? parseFloat(mrp) : null,
          stock: stock ? parseInt(stock) : 0,
          imageUrl,
          hsnCode: finalHsnCode || null,
          gstRate: finalGstRate ? parseFloat(finalGstRate) : 0,
          cessRate: finalCessRate ? parseFloat(finalCessRate) : 0,
          // New fields
          uomId: finalUomId || null,
          weightPerUnit: finalWeightPerUnit ? parseFloat(finalWeightPerUnit) : null,
          volumePerUnit: finalVolumePerUnit ? parseFloat(finalVolumePerUnit) : null,
          lengthPerUnit: finalLengthPerUnit ? parseFloat(finalLengthPerUnit) : null,
          widthPerUnit: finalWidthPerUnit ? parseFloat(finalWidthPerUnit) : null,
          heightPerUnit: finalHeightPerUnit ? parseFloat(finalHeightPerUnit) : null,
          manufacturer: manufacturer || null,
          brand: brand || null,
          modelNumber: finalModelNumber || null,
          batchNumber: finalBatchNumber || null,
          expiryDate: finalExpiryDate ? new Date(finalExpiryDate) : null,
          shelfLifeDays: finalShelfLifeDays ? parseInt(finalShelfLifeDays) : null,
          minStockLevel: finalMinStockLevel ? parseFloat(finalMinStockLevel) : null,
          maxStockLevel: finalMaxStockLevel ? parseFloat(finalMaxStockLevel) : null,
          reorderLevel: finalReorderLevel ? parseFloat(finalReorderLevel) : null,
          packageType: finalPackageType || null,
          packageQuantity: finalPackageQuantity ? parseInt(finalPackageQuantity) : 1,
          isPerishable: finalIsPerishable !== undefined ? finalIsPerishable : false,
          storageConditions: finalStorageConditions || null,
        },
        include: { uom: true }
      });
      
      console.log('Item created:', {
        id: item.id,
        name: item.name,
        categoryId: item.categoryId
      });

      // Log activity
      await logActivity({
        entityType: 'item',
        entityId: item.id,
        action: 'create',
        changedBy: req.customerId!,
        changes: {
          name: item.name,
          code: item.code,
          price: item.price.toString(),
        },
      });

      // Transform to snake_case for frontend
      res.status(201).json({
        id: item.id,
        customer_id: item.customerId,
        name: item.name,
        display_name: item.displayName,
        code: item.code,
        barcode: item.barcode,
        mapping_code: item.mappingCode,
        category_id: item.categoryId,
        subcategory: item.subcategory,
        cost: item.cost,
        price: item.price,
        mrp: item.mrp,
        stock: item.stock,
        image_url: item.imageUrl,
        hsn_code: item.hsnCode,
        gst_rate: item.gstRate,
        cess_rate: item.cessRate,
        uom_id: item.uomId,
        uom_name: item.uom?.name,
        weight_per_unit: item.weightPerUnit,
        volume_per_unit: item.volumePerUnit,
        length_per_unit: item.lengthPerUnit,
        width_per_unit: item.widthPerUnit,
        height_per_unit: item.heightPerUnit,
        manufacturer: item.manufacturer,
        brand: item.brand,
        model_number: item.modelNumber,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
        shelf_life_days: item.shelfLifeDays,
        min_stock_level: item.minStockLevel,
        max_stock_level: item.maxStockLevel,
        reorder_level: item.reorderLevel,
        package_type: item.packageType,
        package_quantity: item.packageQuantity,
        is_perishable: item.isPerishable,
        storage_conditions: item.storageConditions,
        created_at: item.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating item:', error);
      res.status(500).json({ error: error.message || 'Failed to create item' });
    }
  }
);

// Update item
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('code').optional().notEmpty().trim(),
    body('cost').optional().isFloat({ min: 0 }),
    body('price').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const {
        name,
        displayName,
        display_name, // Accept snake_case from frontend
        code,
        barcode,
        mappingCode,
        mapping_code, // Accept snake_case from frontend
        categoryId,
        category_id, // Accept snake_case from frontend
        subcategory,
        cost,
        price,
        mrp,
        stock,
        imageUrl,
        hsnCode,
        hsn_code, // Accept snake_case from frontend
        gstRate,
        gst_rate, // Accept snake_case from frontend
        cessRate,
        cess_rate, // Accept snake_case from frontend
        uomId, uom_id,
        weightPerUnit, weight_per_unit,
        volumePerUnit, volume_per_unit,
        lengthPerUnit, length_per_unit,
        widthPerUnit, width_per_unit,
        heightPerUnit, height_per_unit,
        manufacturer,
        brand,
        modelNumber, model_number,
        batchNumber, batch_number,
        expiryDate, expiry_date,
        shelfLifeDays, shelf_life_days,
        minStockLevel, min_stock_level,
        maxStockLevel, max_stock_level,
        reorderLevel, reorder_level,
        packageType, package_type,
        packageQuantity, package_quantity,
        isPerishable, is_perishable,
        storageConditions, storage_conditions,
      } = req.body;

      // Use categoryId (camelCase) or category_id (snake_case), whichever is provided
      const finalCategoryId = categoryId !== undefined ? categoryId : category_id;
      // Use displayName (camelCase) or display_name (snake_case), whichever is provided
      const finalDisplayName = displayName !== undefined ? displayName : display_name;
      // Use mappingCode (camelCase) or mapping_code (snake_case), whichever is provided
      const finalMappingCode = mappingCode !== undefined ? (mappingCode === '' ? null : mappingCode) : (mapping_code !== undefined ? (mapping_code === '' ? null : mapping_code) : undefined);
      // Use hsnCode (camelCase) or hsn_code (snake_case), whichever is provided
      const finalHsnCode = hsnCode !== undefined ? hsnCode : hsn_code;
      // Use gstRate (camelCase) or gst_rate (snake_case), whichever is provided
      const finalGstRate = gstRate !== undefined ? gstRate : gst_rate;
      // Use cessRate (camelCase) or cess_rate (snake_case), whichever is provided
      const finalCessRate = cessRate !== undefined ? cessRate : cess_rate;

      // Handle new extended fields
      const finalUomId = uomId !== undefined ? (uomId || uom_id) : (uom_id !== undefined ? uom_id : undefined);
      const finalWeightPerUnit = weightPerUnit !== undefined ? weightPerUnit : weight_per_unit;
      const finalVolumePerUnit = volumePerUnit !== undefined ? volumePerUnit : volume_per_unit;
      const finalLengthPerUnit = lengthPerUnit !== undefined ? lengthPerUnit : length_per_unit;
      const finalWidthPerUnit = widthPerUnit !== undefined ? widthPerUnit : width_per_unit;
      const finalHeightPerUnit = heightPerUnit !== undefined ? heightPerUnit : height_per_unit;
      const finalModelNumber = modelNumber !== undefined ? modelNumber : model_number;
      const finalBatchNumber = batchNumber !== undefined ? batchNumber : batch_number;
      const finalExpiryDate = expiryDate !== undefined ? expiryDate : expiry_date;
      const finalShelfLifeDays = shelfLifeDays !== undefined ? shelfLifeDays : shelf_life_days;
      const finalMinStockLevel = minStockLevel !== undefined ? minStockLevel : min_stock_level;
      const finalMaxStockLevel = maxStockLevel !== undefined ? maxStockLevel : max_stock_level;
      const finalReorderLevel = reorderLevel !== undefined ? reorderLevel : reorder_level;
      const finalPackageType = packageType !== undefined ? packageType : package_type;
      const finalPackageQuantity = packageQuantity !== undefined ? packageQuantity : package_quantity;
      const finalIsPerishable = isPerishable !== undefined ? isPerishable : is_perishable;
      const finalStorageConditions = storageConditions !== undefined ? storageConditions : storage_conditions;

      // Check if item exists (shared inventory - no customerId check)
      const existing = await prisma.item.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Check if user is admin or owner for non-stock updates
      const isAdmin = req.customer?.isAdmin || false;
      const isOwner = existing.customerId === req.customerId;
      const isStockOnlyUpdate = stock !== undefined && 
        name === undefined && 
        code === undefined && 
        barcode === undefined && 
        finalCategoryId === undefined && 
        subcategory === undefined && 
        cost === undefined && 
        price === undefined && 
        mrp === undefined && 
        imageUrl === undefined;

      // Allow stock updates for all users, but other fields require ownership or admin
      if (!isStockOnlyUpdate && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'You can only update items you created, or you must be an admin' });
      }

      // Prepare old values for activity log
      const oldValues = {
        name: existing.name,
        code: existing.code,
        price: existing.price.toString(),
        stock: existing.stock,
      };

      const updateData: any = {};
      if (name) updateData.name = name;
      if (finalDisplayName !== undefined) updateData.displayName = finalDisplayName || null;
      if (code) updateData.code = code;
      if (barcode !== undefined) updateData.barcode = barcode;
      if (finalMappingCode !== undefined) {
        updateData.mappingCode = finalMappingCode === '' || finalMappingCode === null ? null : finalMappingCode;
      }
      if (finalCategoryId !== undefined) updateData.categoryId = finalCategoryId || null;
      if (subcategory !== undefined) updateData.subcategory = subcategory;
      if (cost !== undefined) updateData.cost = parseFloat(cost);
      if (price !== undefined) updateData.price = parseFloat(price);
      if (mrp !== undefined) updateData.mrp = mrp ? parseFloat(mrp) : null;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (finalHsnCode !== undefined) updateData.hsnCode = finalHsnCode || null;
      if (finalGstRate !== undefined) updateData.gstRate = finalGstRate ? parseFloat(finalGstRate) : 0;
      if (finalCessRate !== undefined) updateData.cessRate = finalCessRate ? parseFloat(finalCessRate) : 0;
      if (finalUomId !== undefined) updateData.uomId = finalUomId || null;
      if (finalWeightPerUnit !== undefined) updateData.weightPerUnit = finalWeightPerUnit ? parseFloat(finalWeightPerUnit) : null;
      if (finalVolumePerUnit !== undefined) updateData.volumePerUnit = finalVolumePerUnit ? parseFloat(finalVolumePerUnit) : null;
      if (finalLengthPerUnit !== undefined) updateData.lengthPerUnit = finalLengthPerUnit ? parseFloat(finalLengthPerUnit) : null;
      if (finalWidthPerUnit !== undefined) updateData.widthPerUnit = finalWidthPerUnit ? parseFloat(finalWidthPerUnit) : null;
      if (finalHeightPerUnit !== undefined) updateData.heightPerUnit = finalHeightPerUnit ? parseFloat(finalHeightPerUnit) : null;
      if (manufacturer !== undefined) updateData.manufacturer = manufacturer || null;
      if (brand !== undefined) updateData.brand = brand || null;
      if (finalModelNumber !== undefined) updateData.modelNumber = finalModelNumber || null;
      if (finalBatchNumber !== undefined) updateData.batchNumber = finalBatchNumber || null;
      if (finalExpiryDate !== undefined) updateData.expiryDate = finalExpiryDate ? new Date(finalExpiryDate) : null;
      if (finalShelfLifeDays !== undefined) updateData.shelfLifeDays = finalShelfLifeDays ? parseInt(finalShelfLifeDays) : null;
      if (finalMinStockLevel !== undefined) updateData.minStockLevel = finalMinStockLevel ? parseFloat(finalMinStockLevel) : null;
      if (finalMaxStockLevel !== undefined) updateData.maxStockLevel = finalMaxStockLevel ? parseFloat(finalMaxStockLevel) : null;
      if (finalReorderLevel !== undefined) updateData.reorderLevel = finalReorderLevel ? parseFloat(finalReorderLevel) : null;
      if (finalPackageType !== undefined) updateData.packageType = finalPackageType || null;
      if (finalPackageQuantity !== undefined) updateData.packageQuantity = finalPackageQuantity ? parseInt(finalPackageQuantity) : 1;
      if (finalIsPerishable !== undefined) updateData.isPerishable = finalIsPerishable;
      if (finalStorageConditions !== undefined) updateData.storageConditions = finalStorageConditions || null;

      const item = await prisma.item.update({
        where: { id },
        data: updateData,
        include: { uom: true }
      });

      // Log activity
      await logActivity({
        entityType: 'item',
        entityId: item.id,
        action: 'update',
        changedBy: req.customerId!,
        changes: {
          old: oldValues,
          new: {
            name: item.name,
            code: item.code,
            price: item.price.toString(),
            stock: item.stock,
          },
        },
      });

      // Transform to snake_case for frontend
      res.json({
        id: item.id,
        customer_id: item.customerId,
        name: item.name,
        display_name: item.displayName,
        code: item.code,
        barcode: item.barcode,
        mapping_code: item.mappingCode,
        category_id: item.categoryId,
        subcategory: item.subcategory,
        cost: item.cost,
        price: item.price,
        mrp: item.mrp,
        stock: item.stock,
        image_url: item.imageUrl,
        hsn_code: item.hsnCode,
        gst_rate: item.gstRate,
        cess_rate: item.cessRate,
        uom_id: item.uomId,
        uom_name: item.uom?.name,
        weight_per_unit: item.weightPerUnit,
        volume_per_unit: item.volumePerUnit,
        length_per_unit: item.lengthPerUnit,
        width_per_unit: item.widthPerUnit,
        height_per_unit: item.heightPerUnit,
        manufacturer: item.manufacturer,
        brand: item.brand,
        model_number: item.modelNumber,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
        shelf_life_days: item.shelfLifeDays,
        min_stock_level: item.minStockLevel,
        max_stock_level: item.maxStockLevel,
        reorder_level: item.reorderLevel,
        package_type: item.packageType,
        package_quantity: item.packageQuantity,
        is_perishable: item.isPerishable,
        storage_conditions: item.storageConditions,
        created_at: item.createdAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating item:', error);
      res.status(500).json({ error: error.message || 'Failed to update item' });
    }
  }
);

// Delete all items for the current customer (must be before /:id route)
router.delete('/', async (req: AuthRequest, res) => {
  try {
    const deleted = await prisma.item.deleteMany({
      where: { customerId: req.customerId! },
    });

    res.json({ 
      message: 'All items deleted successfully',
      count: deleted.count 
    });
  } catch (error: any) {
    console.error('Error deleting all items:', error);
    res.status(500).json({ error: error.message || 'Failed to delete all items' });
  }
});

// Delete item
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.customer?.isAdmin || false;

    // Verify ownership or admin
    const existing = await prisma.item.findFirst({
      where: isAdmin ? { id } : { id, customerId: req.customerId! },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Log activity before deletion
    await logActivity({
      entityType: 'item',
      entityId: existing.id,
      action: 'delete',
      changedBy: req.customerId!,
      changes: {
        name: existing.name,
        code: existing.code,
        deletedAt: new Date().toISOString(),
      },
    });

    await prisma.item.delete({
      where: { id },
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: error.message || 'Failed to delete item' });
  }
});

export default router;
