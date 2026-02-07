import { PrismaClient } from '@prisma/client';

export interface TranslationService {
  getTranslation(customerId: string, key: string, language: string): Promise<string>;
  setTranslation(customerId: string, key: string, language: string, value: string): Promise<void>;
  getAllTranslations(customerId: string, language: string): Promise<Record<string, string>>;
  deleteTranslation(customerId: string, key: string, language: string): Promise<void>;
  getReceiptTranslations(language: string): Promise<ReceiptTranslations>;
}

export interface ReceiptTranslations {
  header: {
    receipt: string;
    date: string;
    time: string;
    customer: string;
    bill: string;
  };
  items: {
    sno: string;
    item: string;
    rate: string;
    qty: string;
    amount: string;
    mrp: string;
  };
  totals: {
    subtotal: string;
    discount: string;
    tax: string;
    grandTotal: string;
    cgst: string;
    sgst: string;
    igst: string;
    cess: string;
  };
  payment: {
    cashReceived: string;
    change: string;
    method: string;
    paidBy: string;
  };
  footer: {
    thankYou: string;
    visitAgain: string;
    poweredBy: string;
  };
  gst: {
    gstin: string;
    hsn: string;
    taxable: string;
    placeOfSupply: string;
  };
  common: {
    yes: string;
    no: string;
    ok: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    print: string;
    close: string;
  };
}

class PostgresTranslationService implements TranslationService {
  constructor(private prisma: PrismaClient) {}

  async getTranslation(customerId: string, key: string, language: string): Promise<string> {
    try {
      const translation = await this.prisma.$queryRaw`
        SELECT value FROM translations 
        WHERE customer_id = ${customerId} 
          AND key = ${key} 
          AND language = ${language}
        LIMIT 1
      ` as Array<{ value: string }>;

      if (translation.length > 0) {
        return translation[0].value;
      }

      // Return default translations if no custom translation exists
      return this.getDefaultTranslation(key, language);
    } catch (error) {
      console.error('Error getting translation:', error);
      return this.getDefaultTranslation(key, language);
    }
  }

  async setTranslation(customerId: string, key: string, language: string, value: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO translations (customer_id, key, language, value, created_at, updated_at)
        VALUES (${customerId}, ${key}, ${language}, ${value}, NOW(), NOW())
        ON CONFLICT (customer_id, key, language)
        DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = NOW()
      `;
    } catch (error) {
      console.error('Error setting translation:', error);
      throw new Error('Failed to set translation');
    }
  }

  async getAllTranslations(customerId: string, language: string): Promise<Record<string, string>> {
    try {
      const translations = await this.prisma.$queryRaw`
        SELECT key, value FROM translations 
        WHERE customer_id = ${customerId} 
          AND language = ${language}
      ` as Array<{ key: string; value: string }>;

      const result: Record<string, string> = {};
      
      // Add custom translations
      translations.forEach(({ key, value }) => {
        result[key] = value;
      });

      // Add default translations for any missing keys
      const defaultTranslations = this.getDefaultTranslations(language);
      Object.keys(defaultTranslations).forEach(key => {
        if (!result[key]) {
          result[key] = defaultTranslations[key];
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting all translations:', error);
      return this.getDefaultTranslations(language);
    }
  }

  async deleteTranslation(customerId: string, key: string, language: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM translations 
        WHERE customer_id = ${customerId} 
          AND key = ${key} 
          AND language = ${language}
      `;
    } catch (error) {
      console.error('Error deleting translation:', error);
      throw new Error('Failed to delete translation');
    }
  }

  async getReceiptTranslations(language: string): Promise<ReceiptTranslations> {
    const translations = this.getDefaultReceiptTranslations(language);
    return translations;
  }

  private getDefaultTranslation(key: string, language: string): string {
    const defaultTranslations = this.getDefaultTranslations(language);
    return defaultTranslations[key] || key;
  }

  private getDefaultTranslations(language: string): Record<string, string> {
    if (language === 'ta') {
      return {
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
    }

    // Default English translations
    return {
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
  }

  private getDefaultReceiptTranslations(language: string): ReceiptTranslations {
    if (language === 'ta') {
      return {
        header: {
          receipt: 'ரசீது',
          date: 'தேதி',
          time: 'நேரம்',
          customer: 'வாடிக்கையாளர்',
          bill: 'பில்',
        },
        items: {
          sno: 'எண்',
          item: 'பொருள்',
          rate: 'விலை',
          qty: 'எண்ணிக்கை',
          amount: 'தொகை',
          mrp: 'அதிகபட்ச விலை',
        },
        totals: {
          subtotal: 'கூட்டுத்தொகை',
          discount: 'தள்ளுபடி',
          tax: 'GST/வரி',
          grandTotal: 'மொத்தத் தொகை',
          cgst: 'CGST',
          sgst: 'SGST',
          igst: 'IGST',
          cess: 'செஸ்',
        },
        payment: {
          cashReceived: 'பெறப்பட்ட பணம்',
          change: 'மாற்றம்',
          method: 'கட்டண முறை',
          paidBy: 'செலுத்தியவர்',
        },
        footer: {
          thankYou: 'உங்கள் வணிகத்திற்கு நன்றி!',
          visitAgain: 'மீண்டும் வருகைத்தொடர்க',
          poweredBy: 'POS பில்லிங் அமைப்பால் இயக்கப்படுகிறது',
        },
        gst: {
          gstin: 'GSTIN',
          hsn: 'HSN',
          taxable: 'வரி விதிக்கப்படும் தொகை',
          placeOfSupply: 'வழங்குமிடம்',
        },
        common: {
          yes: 'ஆம்',
          no: 'இல்லை',
          ok: 'சரி',
          cancel: 'ரத்து',
          save: 'சேமி',
          edit: 'தொகு',
          delete: 'நீக்கு',
          print: 'அச்சிடு',
          close: 'மூடு',
        },
      };
    }

    // Default English
    return {
      header: {
        receipt: 'Receipt',
        date: 'Date',
        time: 'Time',
        customer: 'Customer',
        bill: 'Bill',
      },
      items: {
        sno: '#',
        item: 'Item',
        rate: 'Rate',
        qty: 'Qty',
        amount: 'Amt',
        mrp: 'MRP',
      },
      totals: {
        subtotal: 'Subtotal',
        discount: 'Discount',
        tax: 'GST/Tax',
        grandTotal: 'GRAND TOTAL',
        cgst: 'CGST',
        sgst: 'SGST',
        igst: 'IGST',
        cess: 'CESS',
      },
      payment: {
        cashReceived: 'Cash Received',
        change: 'Change',
        method: 'Payment Method',
        paidBy: 'Paid By',
      },
      footer: {
        thankYou: 'Thank You for Your Business!',
        visitAgain: 'Please visit again',
        poweredBy: 'Powered by POS Billing System',
      },
      gst: {
        gstin: 'GSTIN',
        hsn: 'HSN',
        taxable: 'Taxable Amount',
        placeOfSupply: 'Place of Supply',
      },
      common: {
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        cancel: 'Cancel',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        print: 'Print',
        close: 'Close',
      },
    };
  }
}

// Factory function to create translation service
export function createTranslationService(prisma: PrismaClient): TranslationService {
  return new PostgresTranslationService(prisma);
}
