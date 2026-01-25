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
      select: { activityLogEnabled: true },
    });

    // If settings don't exist, create default settings (enabled by default)
    if (!settings) {
      // Don't log if settings don't exist - this is a safety check
      // Settings should be created when customer is created, but if not, skip logging
      return;
    }

    // Only log if activity logging is enabled
    if (!settings.activityLogEnabled) {
      return;
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

