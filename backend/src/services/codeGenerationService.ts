import prisma from '../db/prisma.js';

export interface CodeGenerationOptions {
  mode: 'supplier' | 'brand' | 'manual' | 'auto';
  supplierId?: string;
  brandId?: string;
  productCode?: string;
  manualCode?: string;
  customerId: string;
}

export interface GeneratedCode {
  code: string;
  mode: string;
  components?: {
    supplierCode?: string;
    brandCode?: string;
    productCode?: string;
  };
}

export class CodeGenerationService {
  /**
   * Generate item code based on the specified mode
   */
  static async generateCode(options: CodeGenerationOptions): Promise<GeneratedCode> {
    const { mode, customerId } = options;

    switch (mode) {
      case 'supplier':
        return await this.generateSupplierCode(options);
      case 'brand':
        return await this.generateBrandCode(options);
      case 'manual':
        return await this.generateManualCode(options);
      case 'auto':
        return await this.generateAutoCode(customerId);
      default:
        throw new Error(`Invalid code generation mode: ${mode}`);
    }
  }

  /**
   * Generate supplier-based code: SUPPLIER-PRODUCT
   */
  private static async generateSupplierCode(options: CodeGenerationOptions): Promise<GeneratedCode> {
    const { supplierId, productCode, customerId } = options;

    if (!supplierId) {
      throw new Error('Supplier ID is required for supplier code generation');
    }

    if (!productCode) {
      throw new Error('Product code is required for supplier code generation');
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, customerId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const supplierCode = supplier.code || this.generateSupplierCodeFromName(supplier.name);
    const finalCode = `${supplierCode}-${productCode}`;

    return {
      code: finalCode,
      mode: 'supplier',
      components: {
        supplierCode,
        productCode,
      },
    };
  }

  /**
   * Generate brand-based code: BRAND-PRODUCT
   */
  private static async generateBrandCode(options: CodeGenerationOptions): Promise<GeneratedCode> {
    const { brandId, productCode, customerId } = options;

    if (!brandId) {
      throw new Error('Brand ID is required for brand code generation');
    }

    if (!productCode) {
      throw new Error('Product code is required for brand code generation');
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, customerId },
    });

    if (!brand) {
      throw new Error('Brand not found');
    }

    const brandCode = brand.code || this.generateBrandCodeFromName(brand.name);
    const finalCode = `${brandCode}-${productCode}`;

    return {
      code: finalCode,
      mode: 'brand',
      components: {
        brandCode,
        productCode,
      },
    };
  }

  /**
   * Return manual code as-is
   */
  private static async generateManualCode(options: CodeGenerationOptions): Promise<GeneratedCode> {
    const { manualCode } = options;

    if (!manualCode) {
      throw new Error('Manual code is required for manual code generation');
    }

    // Validate manual code format
    if (manualCode.length < 3) {
      throw new Error('Manual code must be at least 3 characters long');
    }

    return {
      code: manualCode,
      mode: 'manual',
    };
  }

  /**
   * Generate automatic sequential code
   */
  private static async generateAutoCode(customerId: string): Promise<GeneratedCode> {
    // Get the highest existing item code for this customer
    const lastItem = await prisma.item.findFirst({
      where: { customerId },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNumber = 1;
    if (lastItem && lastItem.code) {
      // Extract numeric part from the last code
      const numericMatch = lastItem.code.match(/(\d+)$/);
      if (numericMatch) {
        nextNumber = parseInt(numericMatch[1]) + 1;
      }
    }

    const autoCode = `ITEM${nextNumber.toString().padStart(6, '0')}`;

    return {
      code: autoCode,
      mode: 'auto',
    };
  }

  /**
   * Validate if a code is unique for the customer
   */
  static async validateCode(code: string, customerId: string, excludeItemId?: string): Promise<boolean> {
    const existingItem = await prisma.item.findFirst({
      where: {
        code,
        customerId,
        ...(excludeItemId && { id: { not: excludeItemId } }),
      },
    });

    return !existingItem;
  }

  /**
   * Generate supplier code from supplier name if no code exists
   */
  private static generateSupplierCodeFromName(supplierName: string): string {
    // Take first 3 letters, remove spaces, convert to uppercase
    return supplierName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
  }

  /**
   * Generate brand code from brand name if no code exists
   */
  private static generateBrandCodeFromName(brandName: string): string {
    // Take first 4 letters, remove spaces, convert to uppercase
    return brandName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 4)
      .toUpperCase()
      .padEnd(4, 'X');
  }

  /**
   * Get available suppliers for a customer
   */
  static async getSuppliers(customerId: string) {
    return await prisma.supplier.findMany({
      where: { 
        customerId,
        isActive: true 
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }

  /**
   * Get available brands for a customer
   */
  static async getBrands(customerId: string) {
    return await prisma.brand.findMany({
      where: { 
        customerId,
        isActive: true 
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }

  /**
   * Get brands available for a specific supplier
   */
  static async getBrandsForSupplier(customerId: string, supplierId: string) {
    return await prisma.supplierBrand.findMany({
      where: { 
        customerId,
        supplierId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { 
        isPreferred: 'desc',
        createdAt: 'asc',
      },
    });
  }

  /**
   * Suggest product codes based on supplier and brand
   */
  static async suggestProductCodes(customerId: string, supplierId?: string, brandId?: string): Promise<string[]> {
    const whereClause: any = { customerId };
    
    if (supplierId) whereClause.supplierId = supplierId;
    if (brandId) whereClause.brandId = brandId;

    const existingItems = await prisma.item.findMany({
      where: whereClause,
      select: { code: true },
      orderBy: { code: 'asc' },
      take: 10,
    });

    // Extract product codes from existing items
    const productCodes = existingItems.map(item => {
      const parts = item.code.split('-');
      return parts.length > 1 ? parts[1] : item.code;
    });

    // Generate suggestions
    const suggestions: string[] = [];
    
    // Use existing pattern
    if (productCodes.length > 0) {
      const lastCode = productCodes[productCodes.length - 1];
      const numericMatch = lastCode.match(/(\d+)$/);
      if (numericMatch) {
        const nextNumber = parseInt(numericMatch[1]) + 1;
        suggestions.push(`PROD${nextNumber.toString().padStart(3, '0')}`);
      }
    }

    // Default suggestions
    suggestions.push('PROD001', 'PROD002', 'PROD003');

    return [...new Set(suggestions)].slice(0, 5);
  }
}
