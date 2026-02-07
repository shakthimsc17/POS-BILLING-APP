import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createTranslationService } from '../services/TranslationService';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Initialize translation service
const prisma = new PrismaClient();
const translationService = createTranslationService(prisma);

// Get language settings for the current user
router.get('/settings', authenticate, async (req: any, res: any) => {
  try {
    const company = await prisma.company.findFirst({
      where: { customerId: req.customerId },
      select: {
        defaultLanguage: true,
        receiptLanguage: true,
      }
    });

    res.json({
      defaultLanguage: company?.defaultLanguage || 'en',
      receiptLanguage: company?.receiptLanguage || 'en',
    });
  } catch (error: any) {
    console.error('Error getting language settings:', error);
    res.status(500).json({ error: 'Failed to get language settings' });
  }
});

// Update language settings
router.post('/settings', authenticate, async (req: any, res: any) => {
  try {
    const { defaultLanguage, receiptLanguage } = req.body;

    // Validate language codes
    const validLanguages = ['en', 'ta'];
    if (!validLanguages.includes(defaultLanguage) || !validLanguages.includes(receiptLanguage)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    await prisma.company.updateMany({
      where: { customerId: req.customerId },
      data: {
        defaultLanguage: defaultLanguage,
        receiptLanguage: receiptLanguage,
        updatedAt: new Date(),
      }
    });

    res.json({ 
      success: true,
      message: 'Language settings updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating language settings:', error);
    res.status(500).json({ error: 'Failed to update language settings' });
  }
});

// Get all translations for a specific language
router.get('/translations/:language', authenticate, async (req: any, res: any) => {
  try {
    const { language } = req.params;
    const customerId = req.customerId;

    // Validate language code
    const validLanguages = ['en', 'ta'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    const translations = await translationService.getAllTranslations(customerId, language);
    res.json(translations);
  } catch (error: any) {
    console.error('Error getting translations:', error);
    res.status(500).json({ error: 'Failed to get translations' });
  }
});

// Get a specific translation
router.get('/translations/:language/:key', authenticate, async (req: any, res: any) => {
  try {
    const { language, key } = req.params;
    const customerId = req.customerId;

    // Validate language code
    const validLanguages = ['en', 'ta'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    const translation = await translationService.getTranslation(customerId, key, language);
    res.json({ key, value: translation });
  } catch (error: any) {
    console.error('Error getting translation:', error);
    res.status(500).json({ error: 'Failed to get translation' });
  }
});

// Set or update a translation
router.post('/translations', authenticate, async (req: any, res: any) => {
  try {
    const { key, language, value } = req.body;
    const customerId = req.customerId;

    // Validate inputs
    if (!key || !language || !value) {
      return res.status(400).json({ error: 'Key, language, and value are required' });
    }

    const validLanguages = ['en', 'ta'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    await translationService.setTranslation(customerId, key, language, value);
    
    res.json({ 
      success: true,
      message: 'Translation saved successfully'
    });
  } catch (error: any) {
    console.error('Error setting translation:', error);
    res.status(500).json({ error: 'Failed to set translation' });
  }
});

// Delete a translation
router.delete('/translations/:language/:key', authenticate, async (req: any, res: any) => {
  try {
    const { language, key } = req.params;
    const customerId = req.customerId;

    // Validate language code
    const validLanguages = ['en', 'ta'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    await translationService.deleteTranslation(customerId, key, language);
    
    res.json({ 
      success: true,
      message: 'Translation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

// Get receipt translations for a specific language
router.get('/receipt-translations/:language', authenticate, async (req: any, res: any) => {
  try {
    const { language } = req.params;

    // Validate language code
    const validLanguages = ['en', 'ta'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    const translations = await translationService.getReceiptTranslations(language);
    res.json(translations);
  } catch (error: any) {
    console.error('Error getting receipt translations:', error);
    res.status(500).json({ error: 'Failed to get receipt translations' });
  }
});

// Bulk update translations
router.post('/translations/bulk', authenticate, async (req: any, res: any) => {
  try {
    const { language, translations } = req.body;
    const customerId = req.customerId;

    // Validate inputs
    if (!language || !translations || typeof translations !== 'object') {
      return res.status(400).json({ error: 'Language and translations object are required' });
    }

    const validLanguages = ['en', 'ta'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    // Process each translation
    const results = [];
    for (const [key, value] of Object.entries(translations)) {
      try {
        await translationService.setTranslation(customerId, key, language, value as string);
        results.push({ key, success: true });
      } catch (error) {
        results.push({ key, success: false, error: 'Failed to save' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: failureCount === 0,
      message: `Updated ${successCount} translations${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
      results
    });
  } catch (error: any) {
    console.error('Error in bulk translation update:', error);
    res.status(500).json({ error: 'Failed to update translations' });
  }
});

// Reset translations to defaults
router.post('/translations/reset/:language', authenticate, async (req: any, res: any) => {
  try {
    const { language } = req.params;
    const customerId = req.customerId;

    // Validate language code
    const validLanguages = ['en', 'ta'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    // Delete all custom translations for this language
    await prisma.translation.deleteMany({
      where: {
        customerId: customerId,
        language: language
      }
    });

    res.json({ 
      success: true,
      message: `Translations reset to defaults for ${language === 'ta' ? 'Tamil' : 'English'}`
    });
  } catch (error: any) {
    console.error('Error resetting translations:', error);
    res.status(500).json({ error: 'Failed to reset translations' });
  }
});

export default router;
