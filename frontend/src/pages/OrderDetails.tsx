import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { useCompanyStore } from '../store/companyStore';
import { useAuthStore } from '../store/authStore';
import { Transaction, Customer, SalesCustomer, Item } from '../types';
import { formatCurrency, formatOrderId, numberToWords } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import { useLanguage } from '../contexts/LanguageContext';
import ReturnModal, { ReturnFormData } from '../components/ReturnModal';
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
  const { language } = useLanguage();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [salesCustomer, setSalesCustomer] = useState<SalesCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<CartItem[]>([]);
  const [editedTransaction, setEditedTransaction] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const { company, loadCompany } = useCompanyStore();
  const { customer: currentUser } = useAuthStore();

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

      // Prefer sales_customer_id (SalesCustomer used in Cart) then fallback to transaction_customer_id (Customer)
      if (tx.sales_customer_id) {
        try {
          const salesCustomers = await storageService.getSalesCustomers();
          const foundSalesCustomer = salesCustomers.find((c) => c.id === tx.sales_customer_id);
          if (foundSalesCustomer) {
            setSalesCustomer(foundSalesCustomer);
            setCustomer(null);
          }
        } catch (error) {
          console.error('Error loading sales customer:', error);
        }
      } else if (tx.transaction_customer_id) {
        try {
          const customers = await storageService.getCustomers();
          const foundCustomer = customers.find(c => c.id === tx.transaction_customer_id);
          if (foundCustomer) {
            setCustomer(foundCustomer);
            setSalesCustomer(null);
          }
        } catch (error) {
          console.error('Error loading customer:', error);
        }
      } else {
        setCustomer(null);
        setSalesCustomer(null);
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

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit mode - reset to original values
      setIsEditMode(false);
      setEditedItems([]);
      setEditedTransaction(null);
    } else {
      // Enter edit mode - create copies for editing
      setIsEditMode(true);
      setEditedItems([...items]);
      setEditedTransaction(transaction ? { ...transaction } : null);
    }
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 0) return;

    const updatedItems = [...editedItems];
    const item = updatedItems[index];

    // Update quantity
    item.quantity = newQuantity;
    item.subtotal = (item.customPrice !== undefined ? item.customPrice : item.originalPrice || 0) * newQuantity;

    setEditedItems(updatedItems);
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    if (newPrice < 0) return;

    const updatedItems = [...editedItems];
    const item = updatedItems[index];

    // Update custom price
    item.customPrice = newPrice;
    item.subtotal = newPrice * item.quantity;

    setEditedItems(updatedItems);
  };

  const handleDateChange = (newDate: string) => {
    if (!editedTransaction) return;
    setEditedTransaction({
      ...editedTransaction,
      created_at: newDate
    });
  };

  const handlePaymentMethodChange = (newMethod: string) => {
    if (!editedTransaction) return;
    setEditedTransaction({
      ...editedTransaction,
      payment_method: newMethod as 'cash' | 'card' | 'upi'
    });
  };

  const calculateEditedTotals = () => {
    let totalQuantity = 0;
    let subtotal = 0;
    let totalItemDiscount = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    editedItems.forEach((cartItem) => {
      const item = cartItem.item || cartItem;
      const quantity = cartItem.quantity || 0;
      totalQuantity += quantity;

      const originalPrice = cartItem.originalPrice || (typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0);
      const sellingPrice = cartItem.customPrice !== undefined
        ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
        : originalPrice;

      const itemSubtotal = sellingPrice * quantity;
      subtotal += itemSubtotal;

      const itemDiscount = calculateItemDiscount(cartItem);
      totalItemDiscount += itemDiscount;

      // Calculate profit/loss: (sellingPrice - cost) * quantity
      const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
      const diff = (sellingPrice - cost) * quantity;
      if (diff >= 0) {
        grossProfit += diff;
      } else {
        grossLoss += Math.abs(diff);
      }
    });

    // During edit mode, we want the grand total to reflect the changes in items.
    // If there was a bill-level tax or discount previously, we handle it by comparing
    // the original subtotal with the original total.

    const originalTxTotal = typeof transaction?.total_amount === 'string'
      ? parseFloat(transaction.total_amount)
      : (transaction?.total_amount || 0);

    // We derive the original subtotal recorded in the transaction
    const initialItems = JSON.parse(transaction?.items_json || '[]');
    const originalTxSubtotal = initialItems.reduce((acc: number, ci: any) => {
      const item = ci.item || ci;
      const sp = ci.customPrice !== undefined
        ? (typeof ci.customPrice === 'string' ? parseFloat(ci.customPrice) : ci.customPrice)
        : (typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0);
      return acc + (sp * (ci.quantity || 0));
    }, 0);

    // Calculate the 'adjustment' (Tax if > 0, Discount if < 0)
    const adjustment = originalTxTotal - originalTxSubtotal;

    // New grand total should apply the same adjustment OR we can choose to reset it.
    // Given the user report, we should probably let the total strictly follow the items for now,
    // OR preserve the adjustment. Let's preserve the fixed adjustment amount for consistency.
    const grandTotal = subtotal + adjustment;

    // If grandTotal < subtotal, the difference is the overall discount
    const overallDiscount = grandTotal < subtotal ? Math.abs(subtotal - grandTotal) : 0;
    const totalDiscount = totalItemDiscount + overallDiscount;

    // If grandTotal > subtotal, the difference is tax
    const tax = grandTotal > subtotal ? grandTotal - subtotal : 0;

    // Net Profit = grossProfit - grossLoss - overallDiscount
    const netProfit = grossProfit - grossLoss - overallDiscount;

    return {
      totalQuantity,
      subtotal,
      discount: overallDiscount,
      tax,
      grandTotal,
      grossProfit,
      grossLoss,
      netProfit,
      totalDiscount,
    };
  };

  const handleSave = async () => {
    if (!editedTransaction) return;

    try {
      setSaving(true);

      // Calculate new totals based on edited items
      const totals = calculateEditedTotals();

      // Prepare update data
      const updateData: Partial<Transaction> = {
        items_json: JSON.stringify(editedItems),
        total_amount: totals.grandTotal,
        created_at: editedTransaction.created_at,
        payment_method: editedTransaction.payment_method,
      };

      // Update transaction
      const updatedTransaction = await storageService.updateTransaction(transaction!.id, updateData);

      // Update local state
      setTransaction(updatedTransaction);
      setItems(editedItems);

      // Exit edit mode
      setIsEditMode(false);
      setEditedItems([]);
      setEditedTransaction(null);

      alert('Order updated successfully!');
    } catch (error: any) {
      console.error('Error updating order:', error);
      alert(`Failed to update order: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReturnRequest = () => {
    if (!transaction) return;
    setShowReturnModal(true);
  };

  const handleReturnModalSubmit = async (formData: ReturnFormData) => {
    if (!transaction) return;
    setReturnSubmitting(true);
    try {
      const returnRecord = await storageService.createReturn({
        originalTransactionId: transaction.id,
        returnType: formData.returnType,
        reason: formData.reason,
        restockedItems: formData.restockedItems,
      });
      setShowReturnModal(false);
      alert(`Return request created successfully!\nReturn ID: ${returnRecord.id.slice(0, 8).toUpperCase()}…\nStatus: ${returnRecord.status}\n\nYour request will be reviewed by an admin.`);
    } catch (error: any) {
      console.error('Error creating return:', error);
      alert(`Failed to create return: ${error.message || 'Unknown error'}`);
    } finally {
      setReturnSubmitting(false);
    }
  };

  const canEdit = () => {
    const isAdmin = currentUser?.isAdmin || false;
    return isAdmin || transaction?.customer_id === currentUser?.id;
  };

  const calculateTotals = () => {
    let totalQuantity = 0;
    let subtotal = 0;
    let actualSubtotal = 0;
    let totalItemDiscount = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    items.forEach((cartItem) => {
      const item = cartItem.item || cartItem;
      const quantity = cartItem.quantity || 1;
      totalQuantity += quantity;

      const originalPrice = cartItem.originalPrice || (typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0);
      const sellingPrice = cartItem.customPrice !== undefined
        ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
        : originalPrice;

      actualSubtotal += originalPrice * quantity;
      const itemSubtotal = sellingPrice * quantity;
      subtotal += itemSubtotal;

      const itemDiscount = calculateItemDiscount(cartItem);
      totalItemDiscount += itemDiscount;

      // Calculate profit/loss: (sellingPrice - cost) * quantity
      const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
      const diff = (sellingPrice - cost) * quantity;
      if (diff >= 0) {
        grossProfit += diff;
      } else {
        grossLoss += Math.abs(diff);
      }
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

    // Net Profit = grossProfit - grossLoss - overallDiscount
    // (item-level discounts are already reflected in sellingPrice via customPrice)
    const netProfit = grossProfit - grossLoss - overallDiscount;

    return {
      totalQuantity,
      subtotal,
      actualSubtotal,
      discount: overallDiscount,
      tax,
      grandTotal,
      grossProfit,
      grossLoss,
      netProfit,
      totalDiscount,
    };
  };

  const handlePrint = () => {
    const totals = calculateTotals();
    const date = transaction ? new Date(transaction.created_at) : new Date();
    const invoiceNumber = formatOrderId(transaction?.id || '');
    const amountInWords = numberToWords(Math.floor(totals.grandTotal));
    const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

    const customerName = salesCustomer?.name || customer?.name || 'Walk-in Customer';
    const customerMobile = salesCustomer?.mobile || customer?.phone || '';
    const customerEmail = salesCustomer?.email || customer?.email || '';
    const customerAddress =
      (customer?.address || [customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(', ')) ||
      salesCustomer?.place ||
      '';

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${invoiceNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
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
              text-transform: capitalize;
            }
            /* Reset capitalize for columns that shouldn't have it */
            .items-table td.text-right,
            .items-table td.text-center:not(.item-desc-cell) {
              text-transform: none;
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
                  <div><strong>Name:</strong> ${customerName}</div>
                  ${customerMobile ? `<div><strong>Mobile:</strong> ${customerMobile}</div>` : ''}
                  ${customerEmail ? `<div><strong>Email:</strong> ${customerEmail}</div>` : ''}
                  ${customerAddress ? `<div><strong>Address:</strong> ${customerAddress}</div>` : '<div>Add Address</div>'}
                </div>
              </div>
              <div class="customer-box">
                <h4>Shipping Details</h4>
                <div class="customer-info">
                  <div><strong>Name:</strong> ${customerName}</div>
                  ${customerMobile ? `<div><strong>Mobile:</strong> ${customerMobile}</div>` : ''}
                  ${customerEmail ? `<div><strong>Email:</strong> ${customerEmail}</div>` : ''}
                  ${customerAddress ? `<div><strong>Address:</strong> ${customerAddress}</div>` : '<div>Add Address</div>'}
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
                      <td class="item-desc-cell">${item.name || item.display_name || 'N/A'}</td>
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
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span class="text-right">${formatCurrency(totals.actualSubtotal)}</span>
                </div>
                ${totals.totalDiscount > 0 ? `
                <div class="summary-row">
                  <span>Total Discount:</span>
                  <span class="text-right">-${formatCurrency(totals.totalDiscount)}</span>
                </div>
                ` : ''}
                ${totals.tax > 0 ? `
                <div class="summary-row">
                  <span>GST/Tax:</span>
                  <span class="text-right">${formatCurrency(totals.tax)}</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                  <span>GRAND TOTAL:</span>
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
        setTimeout(() => {
          printWindow.close();
        }, 250);
      }, 250);
    }
  };

  const handlePrintReceipt = async () => {
    if (!transaction) return;
    const totals = calculateTotals();
    const itemsForPrinter = items.map(ci => {
      const item = ci.item || ci;
      return {
        ...ci,
        originalPrice: ci.originalPrice || (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0))
      };
    });

    await printReceipt({
      items: itemsForPrinter as any,
      transaction,
      customer: salesCustomer || (customer ? { ...customer, mobile: customer.phone || '' } : null) as any,
      taxAmount: totals.tax,
      discountAmount: totals.totalDiscount,
      language,
    });
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
          {canEdit() && (
            <button
              className={`btn ${isEditMode ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleEditToggle}
              disabled={saving}
            >
              {isEditMode ? '❌ Cancel' : '✏️ Edit'}
            </button>
          )}
          {isEditMode && (
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '💾 Save'}
            </button>
          )}
          {!isEditMode && (
            <button
              className="btn btn-warning"
              onClick={handleReturnRequest}
              title="Request Return"
            >
              🔄 Return
            </button>
          )}
          <button className="btn btn-secondary" onClick={handlePrintReceipt} title="Print Thermal Receipt">
            🖨️ Receipt
          </button>
          <button className="btn btn-primary" onClick={handlePrint} title="Print A4 Invoice">
            📄 Invoice
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF} title="Export as PDF">
            📥 PDF
          </button>
        </div>
      </div>

      <div className="layout-container">
        {/* Left Sidebar: Info Cards */}
        <aside className="details-sidebar">
          {/* Company Info Card */}
          <div className="info-card">
            <div className="company-mini-header">
              {company.logo && (
                <img src={company.logo} alt={company.name} className="company-mini-logo" />
              )}
              <div className="company-mini-name">{company.name || 'My Store'}</div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">GSTIN</span>
                <span className="info-value">{company.gstin || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Contact</span>
                <span className="info-value">{company.phone || company.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Order Info Card */}
          <div className="info-card">
            <h3>📦 Order Summary</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Order ID</span>
                <span className="info-value" style={{ wordBreak: 'break-all', color: '#0f172a' }}>#{transaction.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date & Time</span>
                <span className="info-value">
                  {isEditMode ? (
                    <input
                      type="datetime-local"
                      value={editedTransaction?.created_at ? new Date(editedTransaction.created_at).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="form-input"
                    />
                  ) : (
                    <>
                      <span style={{ display: 'block' }}>📅 {date.toLocaleDateString()}</span>
                      <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>⏰ {date.toLocaleTimeString()}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Payment Method</span>
                <span className="info-value" style={{ marginTop: '0.25rem' }}>
                  {isEditMode ? (
                    <select
                      value={editedTransaction?.payment_method || transaction.payment_method}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      className="form-input"
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="card">💳 Card</option>
                      <option value="upi">📱 UPI</option>
                    </select>
                  ) : (
                    <span className="badge badge-primary">
                      {transaction.payment_method === 'cash' ? '💵 ' : transaction.payment_method === 'card' ? '💳 ' : '📱 '}
                      {transaction.payment_method.toUpperCase()}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="info-card">
            <h3>👤 Customer Details</h3>
            <div className="info-grid">
              {salesCustomer ? (
                <>
                  <div className="info-item">
                    <span className="info-label">Name</span>
                    <span className="info-value">{salesCustomer.name}</span>
                  </div>
                  {salesCustomer.mobile && (
                    <div className="info-item">
                      <span className="info-label">Mobile</span>
                      <span className="info-value">{salesCustomer.mobile}</span>
                    </div>
                  )}
                  {salesCustomer.place && (
                    <div className="info-item">
                      <span className="info-label">Place</span>
                      <span className="info-value">{salesCustomer.place}</span>
                    </div>
                  )}
                </>
              ) : customer ? (
                <>
                  <div className="info-item">
                    <span className="info-label">Name</span>
                    <span className="info-value">{customer.name}</span>
                  </div>
                  {customer.phone && (
                    <div className="info-item">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="info-item">
                      <span className="info-label">Address</span>
                      <span className="info-value" style={{ fontSize: '13px' }}>{customer.address}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="info-value">Walk-in Customer</div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content: Items Table */}
        <main className="main-content-area">
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Item Name</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Item Discount</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(isEditMode ? editedItems : items).map((cartItem, index) => {
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
                      <td style={{ fontWeight: 500 }}>{item.name || item.display_name || 'N/A'}</td>
                      <td className="text-center">
                        {isEditMode ? (
                          <div className="quantity-editor">
                            <button
                              className="btn btn-xs btn-secondary"
                              onClick={() => handleQuantityChange(index, quantity - 1)}
                              disabled={quantity <= 0}
                              style={{ padding: '2px 8px', minHeight: 'auto' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                              className="quantity-input"
                              min="0"
                            />
                            <button
                              className="btn btn-xs btn-secondary"
                              onClick={() => handleQuantityChange(index, quantity + 1)}
                              style={{ padding: '2px 8px', minHeight: 'auto' }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{quantity}</span>
                        )}
                      </td>
                      <td className="text-right">
                        {isEditMode ? (
                          <input
                            type="number"
                            value={sellingPrice}
                            onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                            className="price-input"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          formatCurrency(sellingPrice)
                        )}
                      </td>
                      <td className="text-right" style={{ color: itemDiscount > 0 ? '#d69e2e' : 'inherit' }}>
                        {itemDiscount > 0 ? formatCurrency(itemDiscount) : '-'}
                      </td>
                      <td className="text-right" style={{ fontWeight: 700 }}>{formatCurrency(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="summary-tray">
            <div className="profit-stats">
              <div className="stat-card">
                <span className="stat-label">Gross Profit</span>
                <span className="stat-value profit">{formatCurrency(totals.grossProfit)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Loss</span>
                <span className="stat-value loss">{formatCurrency(totals.grossLoss)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Bill Discount</span>
                <span className="stat-value discount">{formatCurrency(totals.discount || 0)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Net Profit</span>
                <span className="stat-value profit" style={{ color: totals.netProfit >= 0 ? '#38a169' : '#e53e3e' }}>
                  {formatCurrency(totals.netProfit)}
                </span>
              </div>
            </div>

            <div className="totals-panel">
              <div className="total-row">
                <span>Total Items:</span>
                <span style={{ fontWeight: 600 }}>{isEditMode ? calculateEditedTotals().totalQuantity : totals.totalQuantity}</span>
              </div>
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(isEditMode ? calculateEditedTotals().subtotal : totals.subtotal)}</span>
              </div>
              {(isEditMode ? calculateEditedTotals().discount : totals.discount) > 0 && (
                <div className="total-row" style={{ color: '#d69e2e' }}>
                  <span>Extra Discount:</span>
                  <span>-{formatCurrency(isEditMode ? calculateEditedTotals().discount : totals.discount)}</span>
                </div>
              )}
              {(isEditMode ? calculateEditedTotals().tax : totals.tax) > 0 && (
                <div className="total-row">
                  <span>Tax:</span>
                  <span>{formatCurrency(isEditMode ? calculateEditedTotals().tax : totals.tax)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Total</span>
                <span>{formatCurrency(isEditMode ? calculateEditedTotals().grandTotal : totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ReturnModal
        isOpen={showReturnModal}
        orderId={transaction?.id ?? ''}
        items={items}
        onClose={() => setShowReturnModal(false)}
        onSubmit={handleReturnModalSubmit}
        submitting={returnSubmitting}
      />
    </div>
  );
}

