import prisma from '../db/prisma.js';

export interface ActivityLogData {
  entityType: 'item' | 'category' | 'transaction' | 'company';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changedBy: string;
  changes?: any; // JSON object with old/new values
}

export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    // Check if activity logging is enabled for this customer
    const settings = await prisma.settings.findUnique({
      where: { customerId: data.changedBy },
    });

    // If settings don't exist or activity log is disabled, don't log
    if (!settings || !settings.activityLogEnabled) {
      return;
    }

    // For items, check if the action should be logged based on item_log_actions setting
    if (data.entityType === 'item') {
      if (settings.itemLogActions === 'update_delete' && data.action === 'create') {
        return; // Don't log create actions if only update/delete are enabled
      }
    }

    await prisma.activityLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        changedBy: data.changedBy,
        changes: data.changes || null,
      },
    });
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Error logging activity:', error);
  }
}

