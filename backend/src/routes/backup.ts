import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { encrypt, decrypt, maskConnectionString } from '../utils/encryption.js';
import prisma from '../db/prisma.js';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = express.Router();

// POST /api/backup/save-connection - Save encrypted Supabase connection URL
router.post('/save-connection', authenticate, requireAdmin,
  [
    body('supabaseUrl').isString().withMessage('Supabase Connection URL is required')
  ],
  async (req: AuthRequest, res: express.Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { supabaseUrl } = req.body;
      
      // Validate URL format
      if (!supabaseUrl.startsWith('postgres://') && !supabaseUrl.startsWith('postgresql://')) {
        res.status(400).json({ message: 'Invalid connection string format. Must start with postgresql://' });
        return;
      }

      // Encrypt the connection string
      const encryptedUrl = encrypt(supabaseUrl);

      // Save to settings
      await prisma.settings.upsert({
        where: { customerId: req.customerId! },
        update: { 
          supabaseUrl: encryptedUrl,
          updatedAt: new Date()
        },
        create: {
          customerId: req.customerId!,
          supabaseUrl: encryptedUrl,
        }
      });

      res.json({ 
        message: 'Connection saved successfully',
        maskedUrl: maskConnectionString(supabaseUrl)
      });

    } catch (error: any) {
      console.error('Error saving connection:', error);
      res.status(500).json({ message: 'Failed to save connection', error: error.message });
    }
  }
);

// GET /api/backup/status - Get backup status and masked connection info
router.get('/status', authenticate, requireAdmin,
  async (req: AuthRequest, res: express.Response): Promise<void> => {
    try {
      const settings = await prisma.settings.findUnique({
        where: { customerId: req.customerId! },
        select: {
          supabaseUrl: true,
          lastSyncAt: true,
          lastSyncStatus: true,
        }
      });

      if (!settings || !settings.supabaseUrl) {
        res.json({
          configured: false,
          maskedUrl: null,
          lastSyncAt: null,
          lastSyncStatus: null,
        });
        return;
      }

      // Decrypt and mask the URL for display
      let maskedUrl = '***configured***';
      try {
        const decryptedUrl = decrypt(settings.supabaseUrl);
        maskedUrl = maskConnectionString(decryptedUrl);
      } catch {
        // If decryption fails, just show as configured
      }

      res.json({
        configured: true,
        maskedUrl,
        lastSyncAt: settings.lastSyncAt,
        lastSyncStatus: settings.lastSyncStatus,
      });

    } catch (error: any) {
      console.error('Error getting backup status:', error);
      res.status(500).json({ message: 'Failed to get backup status', error: error.message });
    }
  }
);

// POST /api/backup/sync - Sync current DB to Remote Supabase
router.post('/sync', authenticate, requireAdmin,
  async (req: AuthRequest, res: express.Response): Promise<void> => {
    try {
      // Get settings with encrypted URL
      const settings = await prisma.settings.findUnique({
        where: { customerId: req.customerId! },
        select: { supabaseUrl: true }
      });

      if (!settings || !settings.supabaseUrl) {
        res.status(400).json({ message: 'Supabase connection not configured. Please save connection first.' });
        return;
      }

      // Decrypt the connection string
      let supabaseUrl: string;
      try {
        supabaseUrl = decrypt(settings.supabaseUrl);
      } catch {
        res.status(500).json({ message: 'Failed to decrypt connection string. Please save connection again.' });
        return;
      }

      const localDbUrl = process.env.DATABASE_URL;
      if (!localDbUrl) {
        res.status(500).json({ message: 'Local DATABASE_URL not configured' });
        return;
      }

      // Remove query parameters from local DB URL (pg_dump doesn't support ?schema=public)
      const localDbUrlClean = localDbUrl.split('?')[0];

      // Update status to in_progress
      await prisma.settings.update({
        where: { customerId: req.customerId! },
        data: { lastSyncStatus: 'in_progress' }
      });

      console.log('Starting sync to Supabase...');
      
      // Add sslmode=require for Supabase (required for cloud connections)
      const supabaseUrlWithSsl = supabaseUrl.includes('?') 
        ? `${supabaseUrl}&sslmode=require`
        : `${supabaseUrl}?sslmode=require`;
      
      try {
        // Step 1: Dump local database to a temp file
        const tempFile = '/tmp/pos_backup_dump.sql';
        const dumpCommand = `pg_dump "${localDbUrlClean}" --no-owner --no-acl --clean --if-exists > ${tempFile}`;
        
        console.log('Step 1: Dumping local database...');
        await execPromise(dumpCommand, { maxBuffer: 1024 * 1024 * 100 });
        
        // Check dump file size
        const { stdout: fileSize } = await execPromise(`wc -c < ${tempFile}`);
        console.log(`Dump file size: ${fileSize.trim()} bytes`);
        
        const dumpSize = parseInt(fileSize.trim(), 10);
        if (dumpSize < 1000) {
          throw new Error(`Dump file too small (${dumpSize} bytes). Database may be empty or pg_dump failed.`);
        }
        
        // Step 2: Load dump to Supabase
        console.log('Step 2: Loading dump to Supabase...');
        const loadCommand = `psql "${supabaseUrlWithSsl}" < ${tempFile}`;
        
        const { stdout, stderr } = await execPromise(loadCommand, { 
          maxBuffer: 1024 * 1024 * 100
        });

        // Log output for debugging
        console.log('psql stdout:', stdout ? stdout.substring(0, 1000) : '(empty)');
        if (stderr) console.log('psql stderr:', stderr.substring(0, 500));
        
        // Cleanup temp file
        await execPromise(`rm -f ${tempFile}`);

        // Update status to success
        await prisma.settings.update({
          where: { customerId: req.customerId! },
          data: { 
            lastSyncAt: new Date(),
            lastSyncStatus: 'success'
          }
        });

        console.log('Sync completed successfully');
        res.json({ 
          message: 'Database successfully synced to Supabase',
          syncedAt: new Date().toISOString(),
          dumpSize: dumpSize
        });

      } catch (execError: any) {
        // Update status to failed
        await prisma.settings.update({
          where: { customerId: req.customerId! },
          data: { 
            lastSyncAt: new Date(),
            lastSyncStatus: 'failed'
          }
        });

        // Log detailed error
        console.error('Sync command failed:', execError.message);
        if (execError.stdout) console.error('stdout:', execError.stdout.substring(0, 1000));
        if (execError.stderr) console.error('stderr:', execError.stderr.substring(0, 1000));
        
        res.status(500).json({ 
          message: 'Sync failed', 
          error: execError.stderr || execError.message || 'Database sync command failed'
        });
      }

    } catch (error: any) {
      console.error('Sync error:', error);
      res.status(500).json({ 
        message: 'Failed to sync database', 
        error: error.message || 'Unknown error during synchronization'
      });
    }
  }
);

// DELETE /api/backup/connection - Remove saved connection
router.delete('/connection', authenticate, requireAdmin,
  async (req: AuthRequest, res: express.Response): Promise<void> => {
    try {
      await prisma.settings.update({
        where: { customerId: req.customerId! },
        data: {
          supabaseUrl: null,
          lastSyncAt: null,
          lastSyncStatus: null,
        }
      });

      res.json({ message: 'Connection removed successfully' });

    } catch (error: any) {
      console.error('Error removing connection:', error);
      res.status(500).json({ message: 'Failed to remove connection', error: error.message });
    }
  }
);

export default router;
