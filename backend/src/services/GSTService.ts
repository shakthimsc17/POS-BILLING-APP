import { PrismaClient } from '@prisma/client';

export interface GSTCalculation {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalGST: number;
  totalAmount: number;
}

export interface GSTItem {
  id: string;
  name: string;
  hsnCode?: string;
  gstRate: number;
  cessRate: number;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface EWayBillRequest {
  transactionId: string;
  fromState: string;
  toState: string;
  invoiceNumber: string;
  invoiceDate: Date;
  totalAmount: number;
  gstAmount: number;
  transporterId?: string;
  transporterName?: string;
  vehicleNumber?: string;
}

export interface EWayBillResponse {
  eWayBillNumber: string;
  validUntil: Date;
  status: string;
  qrCode?: string;
}

class GSTService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate GST for a list of items
   */
  async calculateGST(items: GSTItem[], placeOfSupply: string, businessState: string): Promise<GSTCalculation> {
    let taxableAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalCESS = 0;

    // Determine if it's intra-state or inter-state
    const isIntraState = placeOfSupply === businessState;

    for (const item of items) {
      const itemTaxableAmount = item.subtotal;
      taxableAmount += itemTaxableAmount;

      const gstAmount = (itemTaxableAmount * item.gstRate) / 100;
      const cessAmount = (itemTaxableAmount * item.cessRate) / 100;

      totalCESS += cessAmount;

      if (isIntraState) {
        // Intra-state: CGST + SGST
        const cgst = gstAmount / 2;
        const sgst = gstAmount / 2;
        totalCGST += cgst;
        totalSGST += sgst;
      } else {
        // Inter-state: IGST
        totalIGST += gstAmount;
      }
    }

    const totalGST = totalCGST + totalSGST + totalIGST;
    const totalAmount = taxableAmount + totalGST + totalCESS;

    return {
      taxableAmount,
      cgstAmount: totalCGST,
      sgstAmount: totalSGST,
      igstAmount: totalIGST,
      cessAmount: totalCESS,
      totalGST,
      totalAmount,
    };
  }

  /**
   * Get GST rates for items
   */
  async getItemGSTDetails(itemId: string): Promise<{ gstRate: number; cessRate: number; hsnCode?: string }> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: {
        gstRate: true,
        cessRate: true,
        hsnCode: true,
      },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    return {
      gstRate: Number(item.gstRate),
      cessRate: Number(item.cessRate),
      hsnCode: item.hsnCode || undefined,
    };
  }

  /**
   * Update transaction with GST calculations
   */
  async updateTransactionGST(transactionId: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        customer: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Parse items from JSON
    const items = JSON.parse(transaction.items_json);
    const businessState = transaction.customer.company?.state || '';

    // Convert to GSTItem format
    const gstItems: GSTItem[] = [];
    for (const item of items) {
      const itemDetails = await this.getItemGSTDetails(item.id);
      gstItems.push({
        id: item.id,
        name: item.name,
        hsnCode: itemDetails.hsnCode,
        gstRate: itemDetails.gstRate,
        cessRate: itemDetails.cessRate,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      });
    }

    // Calculate GST
    const gstCalculation = await this.calculateGST(
      gstItems,
      transaction.placeOfSupply || businessState,
      businessState
    );

    // Update transaction
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        gstAmount: gstCalculation.totalGST,
        cessAmount: gstCalculation.cessAmount,
        totalAmount: gstCalculation.totalAmount,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Generate e-way bill (mock implementation)
   * In production, this would integrate with GST portal API
   */
  async generateEWayBill(request: EWayBillRequest): Promise<EWayBillResponse> {
    try {
      // Mock implementation - in production, call GST portal API
      const eWayBillNumber = this.generateEWayBillNumber();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 1); // Valid for 24 hours

      // Save to database
      await this.prisma.eWayBill.create({
        data: {
          transactionId: request.transactionId,
          eWayBillNumber,
          generatedDate: new Date(),
          validUntil,
          status: 'active',
          customerId: await this.getCustomerIdFromTransaction(request.transactionId),
        },
      });

      return {
        eWayBillNumber,
        validUntil,
        status: 'active',
      };
    } catch (error) {
      console.error('Error generating e-way bill:', error);
      throw new Error('Failed to generate e-way bill');
    }
  }

  /**
   * Cancel e-way bill
   */
  async cancelEWayBill(eWayBillNumber: string): Promise<void> {
    await this.prisma.eWayBill.updateMany({
      where: { eWayBillNumber },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get e-way bill details
   */
  async getEWayBill(eWayBillNumber: string): Promise<EWayBillResponse | null> {
    const eWayBill = await this.prisma.eWayBill.findUnique({
      where: { eWayBillNumber },
    });

    if (!eWayBill) {
      return null;
    }

    return {
      eWayBillNumber: eWayBill.eWayBillNumber || '',
      validUntil: eWayBill.validUntil || new Date(),
      status: eWayBill.status,
    };
  }

  /**
   * Get GST report for a date range
   */
  async getGSTReport(
    customerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSales: number;
    totalGST: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalCESS: number;
    transactions: Array<{
      id: string;
      date: Date;
      totalAmount: number;
      gstAmount: number;
      placeOfSupply: string;
    }>;
  }> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        customerId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        gstAmount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        gstAmount: true,
        placeOfSupply: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalSales = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const totalGST = transactions.reduce((sum, t) => sum + Number(t.gstAmount), 0);

    // For simplicity, assume 50-50 split between CGST/SGST and IGST
    // In production, calculate based on place of supply
    const totalCGST = totalGST * 0.25;
    const totalSGST = totalGST * 0.25;
    const totalIGST = totalGST * 0.5;
    const totalCESS = 0; // Would need to be calculated from cessAmount field

    return {
      totalSales,
      totalGST,
      totalCGST,
      totalSGST,
      totalIGST,
      totalCESS,
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.createdAt,
        totalAmount: Number(t.totalAmount),
        gstAmount: Number(t.gstAmount),
        placeOfSupply: t.placeOfSupply || '',
      })),
    };
  }

  /**
   * Helper method to generate mock e-way bill number
   */
  private generateEWayBillNumber(): string {
    // Generate a 12-digit number
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp.slice(-9)}${random}`.slice(0, 12);
  }

  /**
   * Helper method to get customer ID from transaction
   */
  private async getCustomerIdFromTransaction(transactionId: string): Promise<string> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { customerId: true },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction.customerId;
  }

  /**
   * Validate GST rates
   */
  validateGSTRate(gstRate: number): boolean {
    const validRates = [0, 5, 12, 18, 28];
    return validRates.includes(gstRate);
  }

  /**
   * Get HSN code suggestions
   */
  async getHSNCodeSuggestions(query: string): Promise<Array<{ code: string; description: string }>> {
    // Mock implementation - in production, use HSN code database
    const commonHSNCodes = [
      { code: '6201', description: 'Articles of apparel and clothing accessories' },
      { code: '6202', description: 'Other made up textile articles' },
      { code: '6403', description: 'Footwear with outer soles of rubber, plastics, leather' },
      { code: '8517', description: 'Mobile phones and other cellular devices' },
      { code: '8518', description: 'Microphones and earphones' },
      { code: '8471', description: 'Automatic data processing machines' },
      { code: '8470', description: 'Calculating machines' },
      { code: '9403', description: 'Other furniture and parts thereof' },
      { code: '9405', description: 'Lamps and lighting fittings' },
      { code: '7323', description: 'Table, kitchen or other household articles' },
    ];

    return commonHSNCodes.filter(
      hsn => hsn.code.includes(query) || hsn.description.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Factory function
export function createGSTService(prisma: PrismaClient): GSTService {
  return new GSTService(prisma);
}

export default GSTService;
