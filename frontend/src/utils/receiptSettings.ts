export type ReceiptHeaderOption = 'logo' | 'company_name' | 'both';

const DEFAULT_HEADER_OPTION: ReceiptHeaderOption = 'both';
const DEFAULT_AUTO_PRINT = true;

// Cache for settings to avoid repeated API calls
let settingsCache: { receiptHeaderOption: ReceiptHeaderOption; receiptAutoPrint: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 1 minute

export const receiptSettings = {
  get: async (): Promise<{ headerOption: ReceiptHeaderOption; autoPrint: boolean }> => {
    // Check cache first
    if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_DURATION) {
      return { 
        headerOption: settingsCache.receiptHeaderOption,
        autoPrint: settingsCache.receiptAutoPrint,
      };
    }

    try {
      // Import dynamically to avoid circular dependencies
      const { storageService } = await import('../services/storage');
      const settings = await storageService.getSettings();
      const headerOption = (settings.receipt_header_option || DEFAULT_HEADER_OPTION) as ReceiptHeaderOption;
      const autoPrint = settings.receipt_auto_print !== undefined ? settings.receipt_auto_print : DEFAULT_AUTO_PRINT;
      
      // Update cache
      settingsCache = {
        receiptHeaderOption: headerOption,
        receiptAutoPrint: autoPrint,
        timestamp: Date.now(),
      };
      
      return { headerOption, autoPrint };
    } catch (error) {
      console.error('Error reading receipt settings:', error);
      return { 
        headerOption: DEFAULT_HEADER_OPTION,
        autoPrint: DEFAULT_AUTO_PRINT,
      };
    }
  },

  getHeaderOption: async (): Promise<ReceiptHeaderOption> => {
    const settings = await receiptSettings.get();
    return settings.headerOption;
  },

  getAutoPrint: async (): Promise<boolean> => {
    const settings = await receiptSettings.get();
    return settings.autoPrint;
  },

  // Clear cache when settings are updated
  clearCache: (): void => {
    settingsCache = null;
  },
};

