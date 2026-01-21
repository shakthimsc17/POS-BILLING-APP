export type ReceiptHeaderOption = 'logo' | 'company_name' | 'both';

const DEFAULT_HEADER_OPTION: ReceiptHeaderOption = 'both';

// Cache for settings to avoid repeated API calls
let settingsCache: { receiptHeaderOption: ReceiptHeaderOption; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 1 minute

export const receiptSettings = {
  get: async (): Promise<{ headerOption: ReceiptHeaderOption }> => {
    // Check cache first
    if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_DURATION) {
      return { headerOption: settingsCache.receiptHeaderOption };
    }

    try {
      // Import dynamically to avoid circular dependencies
      const { storageService } = await import('../services/storage');
      const settings = await storageService.getSettings();
      const headerOption = (settings.receipt_header_option || DEFAULT_HEADER_OPTION) as ReceiptHeaderOption;
      
      // Update cache
      settingsCache = {
        receiptHeaderOption: headerOption,
        timestamp: Date.now(),
      };
      
      return { headerOption };
    } catch (error) {
      console.error('Error reading receipt settings:', error);
      return { headerOption: DEFAULT_HEADER_OPTION };
    }
  },

  getHeaderOption: async (): Promise<ReceiptHeaderOption> => {
    const settings = await receiptSettings.get();
    return settings.headerOption;
  },

  // Clear cache when settings are updated
  clearCache: (): void => {
    settingsCache = null;
  },
};

