import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all permissions for a customer type
router.get('/', [
  query('customerType').optional().isString(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerType } = req.query;
    const where: any = {};
    if (customerType) {
      where.customerType = customerType as string;
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [
        { customerType: 'asc' },
        { page: 'asc' },
      ],
    });

    // Transform Prisma camelCase to snake_case for frontend compatibility
    const transformedPermissions = permissions.map((perm) => ({
      id: perm.id,
      customer_type: perm.customerType,
      page: perm.page,
      can_view: perm.canView,
      can_edit: perm.canEdit,
      can_delete: perm.canDelete,
      can_view_profit: perm.canViewProfit,
      is_hidden: perm.isHidden,
      created_at: perm.createdAt.toISOString(),
      updated_at: perm.updatedAt.toISOString(),
    }));

    res.json(transformedPermissions);
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permissions' });
  }
});

// Get permissions by customer type
router.get('/by-type/:customerType', async (req: AuthRequest, res) => {
  try {
    const { customerType } = req.params;

    const permissions = await prisma.permission.findMany({
      where: { customerType },
      orderBy: { page: 'asc' },
    });

    // Transform Prisma camelCase to snake_case for frontend compatibility
    const transformedPermissions = permissions.map((perm) => ({
      id: perm.id,
      customer_type: perm.customerType,
      page: perm.page,
      can_view: perm.canView,
      can_edit: perm.canEdit,
      can_delete: perm.canDelete,
      can_view_profit: perm.canViewProfit,
      is_hidden: perm.isHidden,
      created_at: perm.createdAt.toISOString(),
      updated_at: perm.updatedAt.toISOString(),
    }));

    // Return empty array if no permissions exist (this is valid - means no restrictions configured)
    res.json(transformedPermissions);
  } catch (error: any) {
    console.error('Error fetching permissions by type:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permissions' });
  }
});

// Get available pages list
router.get('/pages', async (req: AuthRequest, res) => {
  try {
    const pages = [
      { id: 'dashboard', label: 'Dashboard', category: 'Sales & Finance' },
      { id: 'cart', label: 'Cart', category: 'Sales & Finance' },
      { id: 'sales', label: 'Sales Orders', category: 'Sales & Finance' },
      { id: 'sales-performance', label: 'Sales Performance', category: 'Sales & Finance' },
      { id: 'cash-flow', label: 'Cash Flow', category: 'Sales & Finance' },
      { id: 'categories', label: 'Categories', category: 'Inventory' },
      { id: 'items', label: 'Items', category: 'Inventory' },
      { id: 'quick-sale-items', label: 'Quick Sale Items', category: 'Sales & Finance' },
      { id: 'customers', label: 'Customers', category: 'Settings' },
      { id: 'reports', label: 'Reports', category: 'Reports' },
      { id: 'company', label: 'Company Settings', category: 'Settings' },
      { id: 'settings', label: 'Settings', category: 'Settings' },
      { id: 'activity-logs', label: 'Activity Logs', category: 'Settings' },
      { id: 'bulk-operations', label: 'Bulk Operations', category: 'Settings' },
    ];

    res.json(pages);
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch pages' });
  }
});

// Create or update permissions for a customer type
router.post('/', [
  body('customerType').notEmpty().isIn(['sales person', 'manager', 'Admin']),
  body('permissions').isArray(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerType, permissions } = req.body;

    // Check if user is admin (only admins can manage permissions)
    if (!req.customer?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only admins can manage permissions' });
    }

    // Validate permissions array
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: 'Permissions array is required and cannot be empty' });
    }

    // Delete existing permissions for this customer type
    await prisma.permission.deleteMany({
      where: { customerType },
    });

    // Create new permissions (no customerId needed - permissions are based on type only)
    const createdPermissions = await Promise.all(
      permissions.map((perm: any) => {
        if (!perm.page || typeof perm.page !== 'string') {
          throw new Error(`Invalid page identifier: ${perm.page}`);
        }
        return prisma.permission.create({
          data: {
            customerType,
            page: perm.page.trim(),
            canView: Boolean(perm.can_view),
            canEdit: Boolean(perm.can_edit),
            canDelete: Boolean(perm.can_delete),
            canViewProfit: Boolean(perm.can_view_profit),
            isHidden: Boolean(perm.is_hidden),
          },
        });
      })
    );

    // Transform Prisma camelCase to snake_case for frontend compatibility
    const transformedPermissions = createdPermissions.map((perm) => ({
      id: perm.id,
      customer_type: perm.customerType,
      page: perm.page,
      can_view: perm.canView,
      can_edit: perm.canEdit,
      can_delete: perm.canDelete,
      can_view_profit: perm.canViewProfit,
      is_hidden: perm.isHidden,
      created_at: perm.createdAt.toISOString(),
      updated_at: perm.updatedAt.toISOString(),
    }));

    res.status(201).json(transformedPermissions);
  } catch (error: any) {
    console.error('Error creating permissions:', error);
    console.error('Error details:', {
      code: error.code,
      meta: error.meta,
      message: error.message,
      customerType: req.body.customerType,
      permissionsCount: req.body.permissions?.length,
    });
    
    // Provide more detailed error messages
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'A permission already exists for this customer type and page. Please try again.' 
      });
    }
    
    if (error.message && error.message.includes('Invalid page identifier')) {
      return res.status(400).json({ error: error.message });
    }
    
    // Check if it's a database connection or table issue
    if (error.code === 'P1001' || error.message?.includes('table') || error.message?.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Database error: Permission table may not exist. Please run database migrations.',
        hint: 'Run: npx prisma migrate dev or npx prisma db push'
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create permissions',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update a single permission
router.put('/:id', [
  body('can_view').optional().isBoolean(),
  body('can_edit').optional().isBoolean(),
  body('can_delete').optional().isBoolean(),
  body('can_view_profit').optional().isBoolean(),
  body('is_hidden').optional().isBoolean(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { can_view, can_edit, can_delete, can_view_profit, is_hidden } = req.body;

    const updateData: any = {};
    if (can_view !== undefined) updateData.canView = can_view;
    if (can_edit !== undefined) updateData.canEdit = can_edit;
    if (can_delete !== undefined) updateData.canDelete = can_delete;
    if (can_view_profit !== undefined) updateData.canViewProfit = can_view_profit;
    if (is_hidden !== undefined) updateData.isHidden = is_hidden;

    const permission = await prisma.permission.update({
      where: { id },
      data: updateData,
    });

    // Transform Prisma camelCase to snake_case for frontend compatibility
    const transformedPermission = {
      id: permission.id,
      customer_type: permission.customerType,
      page: permission.page,
      can_view: permission.canView,
      can_edit: permission.canEdit,
      can_delete: permission.canDelete,
      can_view_profit: permission.canViewProfit,
      is_hidden: permission.isHidden,
      created_at: permission.createdAt.toISOString(),
      updated_at: permission.updatedAt.toISOString(),
    };

    res.json(transformedPermission);
  } catch (error: any) {
    console.error('Error updating permission:', error);
    res.status(500).json({ error: error.message || 'Failed to update permission' });
  }
});

// Delete all permissions for a customer type
router.delete('/by-type/:customerType', async (req: AuthRequest, res) => {
  try {
    const { customerType } = req.params;

    await prisma.permission.deleteMany({
      where: { customerType },
    });

    res.json({ message: 'Permissions deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to delete permissions' });
  }
});

export default router;

