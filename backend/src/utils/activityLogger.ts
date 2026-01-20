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

