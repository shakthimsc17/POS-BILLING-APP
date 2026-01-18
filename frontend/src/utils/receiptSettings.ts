export type ReceiptHeaderOption = 'logo' | 'company_name' | 'both';

const RECEIPT_SETTINGS_KEY = 'receipt_settings';
const DEFAULT_HEADER_OPTION: ReceiptHeaderOption = 'both';

interface ReceiptSettings {
  headerOption: ReceiptHeaderOption;
}

export const receiptSettings = {
  get: (): ReceiptSettings => {
    try {
      const stored = localStorage.getItem(RECEIPT_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          headerOption: parsed.headerOption || DEFAULT_HEADER_OPTION,
        };
      }
    } catch (error) {
      console.error('Error reading receipt settings:', error);
    }
    return {
      headerOption: DEFAULT_HEADER_OPTION,
    };
  },

  set: (settings: ReceiptSettings): void => {
    try {
      localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving receipt settings:', error);
    }
  },

  getHeaderOption: (): ReceiptHeaderOption => {
    return receiptSettings.get().headerOption;
  },

  setHeaderOption: (option: ReceiptHeaderOption): void => {
    const current = receiptSettings.get();
    receiptSettings.set({
      ...current,
      headerOption: option,
    });
  },
};

