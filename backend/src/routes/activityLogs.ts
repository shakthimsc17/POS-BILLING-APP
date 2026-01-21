import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all activity logs (admin only)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.customer?.isAdmin || false;
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only administrators can view activity logs' });
    }

    const { entityType, entityId, changedBy, limit = '100', offset = '0' } = req.query;

    const whereClause: any = {};
    
    if (entityType) {
      whereClause.entityType = entityType as string;
    }
    
    if (entityId) {
      whereClause.entityId = entityId as string;
    }
    
    if (changedBy) {
      whereClause.changedBy = changedBy as string;
    }

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        changedByCustomer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Transform to snake_case for frontend
    const transformedLogs = logs.map((log) => ({
      id: log.id,
      entity_type: log.entityType,
      entity_id: log.entityId,
      action: log.action,
      changed_by: log.changedBy,
      changed_by_name: log.changedByCustomer.name,
      changed_by_email: log.changedByCustomer.email,
      changes: log.changes,
      created_at: log.createdAt.toISOString(),
    }));

    res.json(transformedLogs);
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activity logs' });
  }
});

// Delete all activity logs (admin only) - must come before /:id route
router.delete('/all', async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.customer?.isAdmin || false;
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only administrators can delete activity logs' });
    }

    const result = await prisma.activityLog.deleteMany({});

    res.json({ 
      message: 'All activity logs deleted successfully',
      count: result.count 
    });
  } catch (error: any) {
    console.error('Error deleting all activity logs:', error);
    res.status(500).json({ error: error.message || 'Failed to delete activity logs' });
  }
});

// Delete a single activity log (admin only)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.customer?.isAdmin || false;
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only administrators can delete activity logs' });
    }

    const { id } = req.params;

    const log = await prisma.activityLog.findUnique({
      where: { id },
    });

    if (!log) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    await prisma.activityLog.delete({
      where: { id },
    });

    res.json({ message: 'Activity log deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({ error: error.message || 'Failed to delete activity log' });
  }
});

// Delete filtered activity logs (admin only)
router.post('/delete-filtered', async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.customer?.isAdmin || false;
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only administrators can delete activity logs' });
    }

    const { entityType, entityId, changedBy, action } = req.body;

    const whereClause: any = {};
    
    if (entityType) {
      whereClause.entityType = entityType;
    }
    
    if (entityId) {
      whereClause.entityId = entityId;
    }
    
    if (changedBy) {
      whereClause.changedBy = changedBy;
    }

    if (action) {
      whereClause.action = action;
    }

    const result = await prisma.activityLog.deleteMany({
      where: whereClause,
    });

    res.json({ 
      message: 'Filtered activity logs deleted successfully',
      count: result.count 
    });
  } catch (error: any) {
    console.error('Error deleting filtered activity logs:', error);
    res.status(500).json({ error: error.message || 'Failed to delete filtered activity logs' });
  }
});

export default router;

