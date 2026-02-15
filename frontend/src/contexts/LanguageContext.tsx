import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageService } from '../services/storage';
import { Company } from '../types';

type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isTamil: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// English translations (fallbacks)
const englishTranslations: Record<string, string> = {
  // Receipt headers
  'receipt.receipt': 'Receipt',
  'receipt.date': 'Date',
  'receipt.time': 'Time',
  'receipt.customer': 'Customer',
  'receipt.bill': 'Bill',
  
  // Items table
  'items.sno': '#',
  'items.item': 'Item',
  'items.rate': 'Rate',
  'items.qty': 'Qty',
  'items.amount': 'Amt',
  'items.mrp': 'MRP',
  
  // Totals
  'totals.subtotal': 'Subtotal',
  'totals.discount': 'Discount',
  'totals.tax': 'GST/Tax',
  'totals.grandTotal': 'GRAND TOTAL',
  'totals.cgst': 'CGST',
  'totals.sgst': 'SGST',
  'totals.igst': 'IGST',
  'totals.cess': 'CESS',
  
  // Payment
  'payment.cashReceived': 'Cash Received',
  'payment.change': 'Change',
  'payment.method': 'Payment Method',
  'payment.paidBy': 'Paid By',
  
  // Footer
  'footer.thankYou': 'Thank You for Your Business!',
  'footer.visitAgain': 'Please visit again',
  'footer.poweredBy': 'Powered by POS Billing System',
  
  // GST
  'gst.gstin': 'GSTIN',
  'gst.hsn': 'HSN',
  'gst.taxable': 'Taxable Amount',
  'gst.placeOfSupply': 'Place of Supply',
  
  // Common
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.ok': 'OK',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.print': 'Print',
  'common.close': 'Close',
};

// Tamil translations
const tamilTranslations: Record<string, string> = {
  // Receipt headers
  'receipt.receipt': 'ரசீது',
  'receipt.date': 'தேதி',
  'receipt.time': 'நேரம்',
  'receipt.customer': 'வாடிக்கையாளர்',
  'receipt.bill': 'பில்',
  
  // Items table
  'items.sno': 'எண்',
  'items.item': 'பொருள்',
  'items.rate': 'விலை',
  'items.qty': 'எண்ணிக்கை',
  'items.amount': 'தொகை',
  'items.mrp': 'அதிகபட்ச விலை',
  
  // Totals
  'totals.subtotal': 'கூட்டுத்தொகை',
  'totals.discount': 'தள்ளுபடி',
  'totals.tax': 'GST/வரி',
  'totals.grandTotal': 'மொத்தத் தொகை',
  'totals.cgst': 'CGST',
  'totals.sgst': 'SGST',
  'totals.igst': 'IGST',
  'totals.cess': 'செஸ்',
  
  // Payment
  'payment.cashReceived': 'பெறப்பட்ட பணம்',
  'payment.change': 'மாற்றம்',
  'payment.method': 'கட்டண முறை',
  'payment.paidBy': 'செலுத்தியவர்',
  
  // Footer
  'footer.thankYou': 'உங்கள் வணிகத்திற்கு நன்றி!',
  'footer.visitAgain': 'மீண்டும் வருகைத்தொடர்க',
  'footer.poweredBy': 'POS பில்லிங் அமைப்பால் இயக்கப்படுகிறது',
  
  // GST
  'gst.gstin': 'GSTIN',
  'gst.hsn': 'HSN',
  'gst.taxable': 'வரி விதிக்கப்படும் தொகை',
  'gst.placeOfSupply': 'வழங்குமிடம்',
  
  // Common
  'common.yes': 'ஆம்',
  'common.no': 'இல்லை',
  'common.ok': 'சரி',
  'common.cancel': 'ரத்து',
  'common.save': 'சேமி',
  'common.edit': 'தொகு',
  'common.delete': 'நீக்கு',
  'common.print': 'அச்சிடு',
  'common.close': 'மூடு',
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference from localStorage and company settings
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // First try localStorage for immediate response
        const savedLanguage = localStorage.getItem('pos-language') as Language;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ta')) {
          setLanguageState(savedLanguage);
        }

        // Then load from company settings
        try {
          const company: Company = await storageService.getCompany();
          if (company.receipt_language) {
            const dbLanguage = company.receipt_language;
            if (dbLanguage === 'en' || dbLanguage === 'ta') {
              setLanguageState(dbLanguage);
              localStorage.setItem('pos-language', dbLanguage);
            }
          }
        } catch (companyError) {
          console.warn('Failed to load language from company settings:', companyError);
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    
    // Save to localStorage for immediate persistence
    try {
      localStorage.setItem('pos-language', lang);
    } catch (error) {
      console.warn('Failed to save language preference to localStorage:', error);
    }

    // Save to company settings
    try {
      const company: Company = await storageService.getCompany();
      await storageService.saveCompany({ receipt_language: lang });
    } catch (error) {
      console.warn('Failed to save language preference to company settings:', error);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const translations = language === 'ta' ? tamilTranslations : englishTranslations;
    return translations[key] || fallback || key;
  };

  const isTamil = language === 'ta';

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isTamil,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Export translation functions for non-component usage
export const getTranslation = (key: string, language: Language, fallback?: string): string => {
  const translations = language === 'ta' ? tamilTranslations : englishTranslations;
  return translations[key] || fallback || key;
};

export const getTamilTranslation = (key: string, fallback?: string): string => {
  return tamilTranslations[key] || fallback || key;
};

export const getEnglishTranslation = (key: string, fallback?: string): string => {
  return englishTranslations[key] || fallback || key;
};
