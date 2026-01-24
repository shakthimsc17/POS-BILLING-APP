import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { useCompanyStore } from '../store/companyStore';
import { Transaction, Customer, Item } from '../types';
import { formatCurrency, formatOrderId, numberToWords } from '../utils/formatters';
import './OrderDetails.css';

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

interface CartItem {
  item: Item;
  quantity: number;
  customPrice?: number;
  originalPrice?: number;
  subtotal: number;
}

export default function OrderDetails({ orderId, onBack }: OrderDetailsProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const { company, loadCompany } = useCompanyStore();

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadCompany();
      
      const tx = await storageService.getTransaction(orderId);
      setTransaction(tx);

      // Parse items
      const parsedItems = JSON.parse(tx.items_json);
      setItems(parsedItems);

      // Load customer if exists
      if (tx.transaction_customer_id) {
        try {
          const customers = await storageService.getCustomers();
          const foundCustomer = customers.find(c => c.id === tx.transaction_customer_id);
          if (foundCustomer) {
            setCustomer(foundCustomer);
          }
        } catch (error) {
          console.error('Error loading customer:', error);
        }
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      alert('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const calculateItemDiscount = (cartItem: CartItem): number => {
    const item = cartItem.item || cartItem;
    const originalPrice = cartItem.originalPrice || (typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0);
    const sellingPrice = cartItem.customPrice !== undefined
      ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
      : originalPrice;
    const quantity = cartItem.quantity || 1;
    return Math.max(0, (originalPrice - sellingPrice) * quantity);
  };

  const calculateTotals = () => {
    let totalQuantity = 0;
    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalProfit = 0;

    items.forEach((cartItem) => {
      const item = cartItem.item || cartItem;
      const quantity = cartItem.quantity || 1;
      totalQuantity += quantity;

      const originalPrice = cartItem.originalPrice || (typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0);
      const sellingPrice = cartItem.customPrice !== undefined
        ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
        : originalPrice;
      
      const itemSubtotal = sellingPrice * quantity;
      subtotal += itemSubtotal;
      
      const itemDiscount = calculateItemDiscount(cartItem);
      totalItemDiscount += itemDiscount;

      // Calculate profit: (sellingPrice - cost) * quantity
      const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
      totalProfit += (sellingPrice - cost) * quantity;
    });

    const totalAmount = typeof transaction?.total_amount === 'string' 
      ? parseFloat(transaction.total_amount) 
      : (transaction?.total_amount || 0);
    
    // Overall discount = subtotal - totalAmount (if tax is included, we need to account for it)
    // For simplicity, assume discount = subtotal - totalAmount
    const overallDiscount = Math.max(0, subtotal - totalAmount);
    const totalDiscount = totalItemDiscount + overallDiscount;

    // Tax calculation: if totalAmount < subtotal, there's a discount; if > subtotal, there's tax
    const tax = totalAmount > subtotal ? totalAmount - subtotal : 0;
    const grandTotal = totalAmount;

    return {
      totalQuantity,
      subtotal,
      discount: overallDiscount,
      tax,
      grandTotal,
      totalProfit,
      totalDiscount,
    };
  };

  const handlePrint = () => {
    const totals = calculateTotals();
    const date = transaction ? new Date(transaction.created_at) : new Date();
    const invoiceNumber = formatOrderId(transaction?.id || '');
    const amountInWords = numberToWords(Math.floor(totals.grandTotal));
    const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${invoiceNumber}</title>
          <style>
            @media print {
              @page { 
                size: A4; 
                margin-top: 20mm;
                margin-bottom: 20mm;
                margin-left: 15mm;
                margin-right: 15mm;
              }
              body { 
                margin: 0; 
                padding: 20px 15px;
              }
              .invoice-wrapper {
                padding: 10px 5px;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 11px; 
              color: #000;
              line-height: 1.4;
              padding: 20px 15px;
            }
            .invoice-wrapper {
              max-width: 100%;
              margin: 0 auto;
              padding: 10px 5px;
            }
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .logo-section {
              width: 120px;
              text-align: center;
            }
            .logo-placeholder {
              width: 100px;
              height: 100px;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: #999;
              margin: 0 auto;
            }
            .company-section {
              flex: 1;
              text-align: center;
              padding: 0 20px;
            }
            .invoice-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-details {
              font-size: 10px;
              line-height: 1.6;
            }
            .company-details div {
              margin: 2px 0;
            }
            .copy-label {
              width: 100px;
              text-align: right;
              font-weight: bold;
              font-size: 11px;
            }
            .invoice-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 15px 0;
              padding: 10px;
              background: #f5f5f5;
              border: 1px solid #ddd;
            }
            .invoice-detail-item {
              display: flex;
              gap: 10px;
            }
            .invoice-detail-label {
              font-weight: bold;
              min-width: 100px;
            }
            .customer-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 15px 0;
              padding: 10px;
              background: #f5f5f5;
              border: 1px solid #ddd;
            }
            .customer-box h4 {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
              border-bottom: 1px solid #000;
              padding-bottom: 3px;
            }
            .customer-info {
              font-size: 10px;
              line-height: 1.8;
            }
            .customer-info div {
              margin: 3px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 10px;
            }
            .items-table th {
              background: #2c3e50;
              color: white;
              padding: 8px 5px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #000;
            }
            .items-table td {
              padding: 6px 5px;
              border: 1px solid #ddd;
            }
            .items-table tbody tr:nth-child(even) {
              background: #f9f9f9;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .summary-section {
              margin-top: 15px;
              display: flex;
              justify-content: flex-end;
            }
            .summary-box {
              width: 250px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 11px;
            }
            .summary-row.total {
              font-weight: bold;
              font-size: 13px;
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 5px;
            }
            .amount-words {
              margin: 15px 0;
              padding: 8px;
              background: #f5f5f5;
              border: 1px solid #ddd;
              font-size: 11px;
            }
            .amount-words strong {
              font-weight: bold;
            }
            .payment-tax-section {
              margin: 15px 0;
              padding: 10px;
              background: #f5f5f5;
              border: 1px solid #ddd;
              font-size: 10px;
            }
            .payment-tax-section div {
              margin: 5px 0;
            }
            .bottom-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
            }
            .terms-section {
              font-size: 10px;
            }
            .terms-section h4 {
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .terms-section ul {
              list-style: none;
              padding-left: 0;
            }
            .terms-section li {
              margin: 5px 0;
            }
            .signature-section {
              text-align: right;
              font-size: 10px;
            }
            .signature-box {
              margin-top: 60px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 200px;
              margin: 40px auto 5px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 9px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header-section">
              <div class="logo-section">
                ${company.logo 
                  ? `<img src="${company.logo}" alt="${company.name}" style="max-width: 100px; max-height: 100px; object-fit: contain;" />`
                  : '<div class="logo-placeholder">Add Logo</div>'}
                <div style="font-size: 9px; margin-top: 5px;">Page No. 1 of 1</div>
              </div>
              <div class="company-section">
                <div class="invoice-title">TAX INVOICE</div>
                <div class="company-name">${company.name || 'Add Company Name'}</div>
                <div class="company-details">
                  ${company.address ? `<div>${company.address}</div>` : '<div>Add Address</div>'}
                  ${company.phone || company.email 
                    ? `<div>Mobile: ${company.phone || '+91 9999999999'} | Email: ${company.email || 'company@gmail.com'}</div>`
                    : '<div>Mobile: +91 9999999999 | Email: company@gmail.com</div>'}
                  ${company.gstin 
                    ? `<div>GSTIN - ${company.gstin}</div>`
                    : '<div>GSTIN - 09AAAAA1234A1Z2</div>'}
                </div>
              </div>
              <div class="copy-label">Original Copy</div>
            </div>

            <div class="invoice-details">
              <div class="invoice-detail-item">
                <span class="invoice-detail-label">Invoice Number:</span>
                <span>${invoiceNumber}</span>
              </div>
              <div class="invoice-detail-item">
                <span class="invoice-detail-label">Invoice Date:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="invoice-detail-item">
                <span class="invoice-detail-label">Due date:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="invoice-detail-item">
                <span class="invoice-detail-label">Place of Supply:</span>
                <span>${company.city || company.state || 'N/A'}</span>
              </div>
              <div class="invoice-detail-item">
                <span class="invoice-detail-label">Reverse Charge:</span>
                <span>No</span>
              </div>
            </div>

            <div class="customer-section">
              <div class="customer-box">
                <h4>Billing Details</h4>
                <div class="customer-info">
                  ${customer 
                    ? `<div><strong>Name:</strong> ${customer.name}</div>
                       ${customer.phone ? `<div><strong>Mobile:</strong> ${customer.phone}</div>` : ''}
                       ${customer.email ? `<div><strong>Email:</strong> ${customer.email}</div>` : ''}
                       ${customer.address ? `<div><strong>Address:</strong> ${customer.address}</div>` : '<div>Add Address</div>'}`
                    : '<div><strong>Walk-in Customer</strong></div>'}
                </div>
              </div>
              <div class="customer-box">
                <h4>Shipping Details</h4>
                <div class="customer-info">
                  ${customer 
                    ? `<div><strong>Name:</strong> ${customer.name}</div>
                       ${customer.phone ? `<div><strong>Mobile:</strong> ${customer.phone}</div>` : ''}
                       ${customer.email ? `<div><strong>Email:</strong> ${customer.email}</div>` : ''}
                       ${customer.address ? `<div><strong>Address:</strong> ${customer.address}</div>` : '<div>Add Address</div>'}`
                    : '<div><strong>Walk-in Customer</strong></div>'}
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%;">Sr.</th>
                  <th style="width: 35%;">Item Description</th>
                  <th style="width: 8%;" class="text-center">Qty</th>
                  <th style="width: 8%;" class="text-center">Unit</th>
                  <th style="width: 12%;" class="text-right">List Price</th>
                  <th style="width: 8%;" class="text-right">Disc.</th>
                  <th style="width: 8%;" class="text-right">Tax %</th>
                  <th style="width: 16%;" class="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((cartItem, index) => {
                  const item = cartItem.item || cartItem;
                  const quantity = cartItem.quantity || 1;
                  const originalPrice = cartItem.originalPrice || (typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0);
                  const sellingPrice = cartItem.customPrice !== undefined
                    ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
                    : originalPrice;
                  const itemDiscount = calculateItemDiscount(cartItem);
                  const itemDiscountPercent = originalPrice > 0 ? ((itemDiscount / (originalPrice * quantity)) * 100).toFixed(2) : '0.00';
                  const amount = sellingPrice * quantity;
                  const taxPercent = totals.tax > 0 ? ((totals.tax / totals.subtotal) * 100).toFixed(2) : '0.00';
                  
                  return `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${item.name || item.display_name || 'N/A'}</td>
                      <td class="text-center">${quantity.toFixed(2)}</td>
                      <td class="text-center">Pcs.</td>
                      <td class="text-right">${formatCurrency(originalPrice)}</td>
                      <td class="text-right">${itemDiscount > 0 ? itemDiscountPercent + '%' : '-'}</td>
                      <td class="text-right">${taxPercent}%</td>
                      <td class="text-right">${formatCurrency(amount)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="summary-box">
                ${totals.discount > 0 ? `
                <div class="summary-row">
                  <span>Discount:</span>
                  <span class="text-right">-${formatCurrency(totals.discount)}</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                  <span>Total:</span>
                  <span class="text-right">${formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div class="amount-words">
              <strong>Amount in Words:</strong> Rs. ${amountInWords}
            </div>

            <div class="payment-tax-section">
              <div><strong>Settlement Details:</strong> Settled by - ${transaction?.payment_method?.toUpperCase() || 'CASH'}: ${formatCurrency(totals.grandTotal)} | Invoice Balance: ${formatCurrency(0)}</div>
              ${totals.tax > 0 ? `
              <div><strong>Tax Breakdown:</strong> Sale @${((totals.tax / totals.subtotal) * 100).toFixed(2)}% = ${formatCurrency(totals.subtotal)}, CGST = ${formatCurrency(totals.tax / 2)}, SGST = ${formatCurrency(totals.tax / 2)} | Total Sale = ${formatCurrency(totals.subtotal)}, Tax = ${formatCurrency(totals.tax)}, Cess = 0.00, Add. Cess = 0.00</div>
              ` : ''}
            </div>

            <div class="bottom-section">
              <div class="terms-section">
                <h4>Terms and Conditions</h4>
                <ul>
                  <li>E & O.E</li>
                  ${(() => {
                    const businessType = company.business_type || '';
                    if (businessType === 'clothing') {
                      return `
                        <li>1. All items are sold on a final sale basis. No returns or exchanges unless defective.</li>
                        <li>2. Defective items must be returned within 7 days of purchase with original receipt.</li>
                        <li>3. Prices are subject to change without prior notice.</li>
                        <li>4. Subject to '${company.city || company.state || 'Local'}' Jurisdiction only.</li>
                      `;
                    } else if (businessType === 'cafe') {
                      return `
                        <li>1. All food and beverages are prepared fresh. No returns or refunds once served.</li>
                        <li>2. Prices are inclusive of applicable taxes.</li>
                        <li>3. We reserve the right to refuse service to anyone.</li>
                        <li>4. Subject to '${company.city || company.state || 'Local'}' Jurisdiction only.</li>
                      `;
                    } else if (businessType === 'electrical') {
                      return `
                        <li>1. All electrical items are sold with manufacturer warranty only.</li>
                        <li>2. Defective items must be reported within 7 days with original receipt.</li>
                        <li>3. Installation charges are separate unless mentioned.</li>
                        <li>4. Subject to '${company.city || company.state || 'Local'}' Jurisdiction only.</li>
                      `;
                    } else {
                      return `
                        <li>1. Goods once sold will not be taken back unless defective.</li>
                        <li>2. Defective items must be returned within 7 days with original receipt.</li>
                        <li>3. Prices are subject to change without prior notice.</li>
                        <li>4. Subject to '${company.city || company.state || 'Local'}' Jurisdiction only.</li>
                      `;
                    }
                  })()}
                </ul>
              </div>
              <div class="signature-section">
                <div class="signature-box">
                  <div>For ${company.name || 'Company Name'}</div>
                  <div class="signature-line"></div>
                  <div>Signature</div>
                </div>
              </div>
            </div>

            <div class="footer">
              Invoice Created by ${company.name || 'POS Billing System'}
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleExportPDF = () => {
    handlePrint(); // Same as print for now
  };

  if (loading) {
    return (
      <div className="order-details">
        <div className="loading-state">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="order-details">
        <div className="error-state">
          <p>Order not found</p>
          <button className="btn btn-primary" onClick={onBack}>Back to Orders</button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const date = new Date(transaction.created_at);

  return (
    <div className="order-details">
      <div className="order-details-header">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Orders
        </button>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF}>
            📄 PDF
          </button>
        </div>
      </div>

      <div className="invoice-container">
        <div className="invoice-header">
          {company.logo && (
            <div className="company-logo-container">
              <img src={company.logo} alt={company.name || 'Company Logo'} className="company-logo" />
            </div>
          )}
          <div className="company-name">{company.name || 'My Store'}</div>
          <div className="company-details">
            {company.address && <div>{company.address}</div>}
            {(company.city || company.state || company.pincode) && (
              <div>{[company.city, company.state, company.pincode].filter(Boolean).join(', ')}</div>
            )}
            {company.phone && <div>Phone: {company.phone}</div>}
            {company.email && <div>Email: {company.email}</div>}
            {company.gstin && <div>GSTIN: {company.gstin}</div>}
          </div>
        </div>

        <div className="invoice-info">
          <div className="invoice-info-left">
            <div className="info-label">Order ID:</div>
            <div className="info-value">{transaction.id}</div>
            <div className="info-label" style={{ marginTop: '15px' }}>Date:</div>
            <div className="info-value">{date.toLocaleDateString()}</div>
          </div>
          <div className="invoice-info-right">
            <div className="info-label">Time:</div>
            <div className="info-value">{date.toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="customer-section">
          <h3>Customer Details</h3>
          {customer ? (
            <div className="customer-info">
              <div><strong>Name:</strong> {customer.name}</div>
              {customer.phone && <div><strong>Mobile:</strong> {customer.phone}</div>}
            </div>
          ) : (
            <div className="customer-info">
              <div><strong>Walk-in Customer</strong></div>
            </div>
          )}
        </div>

        <div className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Item Name</th>
                <th className="text-center">Quantity</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Item Discount</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cartItem, index) => {
                const item = cartItem.item || cartItem;
                const quantity = cartItem.quantity || 1;
                const originalPrice = cartItem.originalPrice || (typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0);
                const sellingPrice = cartItem.customPrice !== undefined
                  ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
                  : originalPrice;
                const itemDiscount = calculateItemDiscount(cartItem);
                const amount = sellingPrice * quantity;
                
                return (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td>{item.name || item.display_name || 'N/A'}</td>
                    <td className="text-center">{quantity}</td>
                    <td className="text-right">{formatCurrency(sellingPrice)}</td>
                    <td className="text-right">{itemDiscount > 0 ? formatCurrency(itemDiscount) : '-'}</td>
                    <td className="text-right">{formatCurrency(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="totals-section">
          <div className="total-row">
            <span>Total Quantity:</span>
            <span>{totals.totalQuantity}</span>
          </div>
          <div className="total-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="total-row">
              <span>Discount:</span>
              <span>{formatCurrency(totals.discount)}</span>
            </div>
          )}
          {totals.tax > 0 && (
            <div className="total-row">
              <span>Tax:</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
          )}
          <div className="total-row grand-total">
            <span>Grand Total:</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>

        <div className="profit-discount-box">
          <div className="profit-discount-item">
            <span className="label">Total Profit:</span>
            <span className="value profit">{formatCurrency(totals.totalProfit)}</span>
          </div>
          <div className="profit-discount-item">
            <span className="label">Total Discount:</span>
            <span className="value discount">{formatCurrency(totals.totalDiscount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

