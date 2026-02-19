import { Transaction } from '../types';
import { CartItem } from '../types';
import { formatCurrency } from './formatters';
import { useCompanyStore } from '../store/companyStore';
import { receiptSettings } from './receiptSettings';
import { calculateItemGST } from './calculations';

import { SalesCustomer } from '../types';

interface PrintOptions {
  items: CartItem[];
  transaction: Transaction;
  customer?: SalesCustomer | null;
  taxAmount?: number;
  discountAmount?: number;
  autoPrint?: boolean;
  language?: 'en' | 'ta'; // Add language parameter
}

export async function printReceipt(options: PrintOptions) {
  const { 
    items, 
    transaction, 
    customer, 
    taxAmount = 0, 
    discountAmount = 0, 
    autoPrint = false,
    language = 'en' // Default to English
  } = options;
  
  // Get translation function based on language
  const getTranslation = (key: string, fallback?: string): string => {
    const translations = language === 'ta' ? {
      // Receipt headers
      'receipt.receipt': 'ரசீது',
      'receipt.date': 'தேதி',
      'receipt.time': 'நேரம்',
      'receipt.customer': 'வாடிக்கையாளர்',
      'receipt.bill': 'பில்',
      
      // Items table
      'items.sno': '#',
      'items.item': 'பொருள்',
      'items.rate': 'விலை',
      'items.qty': 'எண்.',
      'items.amount': 'தொகை',
      'items.mrp': 'MRP',
      
      // Totals
      'totals.subtotal': 'உப மொத்தம்',
      'totals.discount': 'தள்ளுபடி',
      'totals.tax': 'வரி',
      'totals.grandTotal': 'மொத்த தொகை',
      
      // Footer
      'footer.thankYou': 'உங்கள் வருகைக்கு நன்றி!',
      'footer.visitAgain': 'மீண்டும் வருக!',
      
      // Payment
      'payment.cashReceived': 'பெற்ற பணம்',
      'payment.change': 'மீதம்',
      'payment.method': 'பணம் செலுத்தும் முறை',
    } : {
      // English translations
      'receipt.receipt': 'Receipt',
      'receipt.date': 'Date',
      'receipt.time': 'Time',
      'receipt.customer': 'Customer',
      'receipt.bill': 'Bill',
      
      'items.sno': '#',
      'items.item': 'Item',
      'items.rate': 'Rate',
      'items.qty': 'Qty',
      'items.amount': 'Amt',
      'items.mrp': 'MRP',
      
      'totals.subtotal': 'Subtotal',
      'totals.discount': 'Discount',
      'totals.tax': 'Tax',
      'totals.grandTotal': 'GRAND TOTAL',
      
      'footer.thankYou': 'Thank You for Your Business!',
      'footer.visitAgain': 'Please visit again',
      
      'payment.cashReceived': 'Cash Received',
      'payment.change': 'Change',
      'payment.method': 'Payment Method',
    };
    
    return (translations as any)[key] || fallback || key;
  };
  
  // Ensure company data is loaded from database (not localStorage)
  const companyStore = useCompanyStore.getState();
  // Check if company is default (not loaded) or has no id (not saved to DB yet)
  if (!companyStore.company.id && companyStore.company.name === 'My Store') {
    // Company not loaded yet, load it from database
    await companyStore.loadCompany();
  }
  const company = companyStore.getCompany();
  const businessType = company.business_type || null;

  // Get receipt settings
  const receiptHeaderOption = await receiptSettings.getHeaderOption();

  const date = new Date(transaction.created_at);
  // Use transaction.totalAmount if available (includes tax/discount), otherwise calculate from items
  const total = transaction.total_amount ? Number(transaction.total_amount) : items.reduce((sum, item) => sum + item.subtotal, 0);

  // Calculate GST breakdown
  const gstInfo = calculateItemGST(items);

  // Create HTML for 3-inch (80mm) thermal printer
  const printHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${transaction.id.slice(0, 8)}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 80mm;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-size: 12px;
            font-weight: bold;
            line-height: 1.4;
            color: #000;
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 2mm 1mm;
            background: white;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
            margin-bottom: 6px;
          }
          .company-logo-container {
            margin-bottom: 4px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .company-logo {
            max-width: 50mm;
            max-height: 25mm;
            width: auto;
            height: auto;
            object-fit: contain;
          }
          .company-name {
            font-size: 16px;
            font-weight: 800;
            margin-bottom: 2px;
            text-transform: uppercase;
            line-height: 1.2;
            letter-spacing: 0.5px;
          }
          .company-details {
            font-size: 10px;
            font-weight: bold;
            line-height: 1.3;
            text-transform: uppercase;
          }
          .company-details p {
            margin: 1px 0;
            font-weight: bold;
            text-transform: uppercase;
          }
          .receipt-info {
            margin-bottom: 4px;
            padding: 2px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            font-size: 10px;
            font-weight: bold;
          }
          .receipt-info-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .receipt-info p {
            margin: 2px 0;
            font-weight: bold;
            line-height: 1.4;
          }
          .receipt-date-time {
            white-space: nowrap;
          }
          .receipt-info strong {
            font-weight: bold;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 11px;
            font-weight: bold;
            table-layout: fixed;
          }
          .items-table thead {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
          }
          .items-table th {
            text-align: left;
            padding: 2px 1px;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
          }
          .items-table th.col-rate {
            padding-left: 4px;
          }
          .items-table tbody tr {
            border-bottom: 1px dotted #ccc;
          }
          .items-table tbody tr:last-child {
            border-bottom: 1px solid #000;
          }
          .items-table td {
            padding: 2px 1px;
            font-size: 10px;
            font-weight: bold;
            line-height: 1.2;
            vertical-align: top;
            word-wrap: break-word;
            overflow: hidden;
          }
          .items-table .item-name {
            font-weight: bold;
            font-size: 10px;
            max-width: 100%;
            word-wrap: break-word;
            text-transform: capitalize;
          }
          .items-table .item-details {
            font-size: 11px;
            font-weight: bold;
            line-height: 1.4;
            margin-top: 2px;
          }
          .items-table .item-details-row {
            display: flex;
            justify-content: space-between;
            margin-top: 1px;
          }
          .items-table .item-details-label {
            font-weight: bold;
            color: #333;
          }
          .items-table small {
            font-size: 9px;
            font-weight: bold;
            display: block;
            color: #000;
            line-height: 1.2;
          }
          .items-table .text-right {
            text-align: right;
          }
          .items-table .text-center {
            text-align: center;
          }
          .items-table .col-number {
            width: 8%;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
          }
          .items-table .col-item {
            width: 38%;
            font-size: 11px;
            font-weight: bold;
            overflow: hidden;
          }
          .items-table .col-rate {
            width: 18%;
            text-align: right;
            font-size: 11px;
            font-weight: bold;
            padding-left: 1px;
            padding-right: 1px;
            white-space: nowrap;
          }
          .items-table .col-qty {
            width: 12%;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            padding-left: 1px;
            padding-right: 1px;
          }
          .items-table .col-amt {
            width: 24%;
            text-align: right;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
          }
          .totals-section {
            margin-top: 6px;
            padding: 4px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
            font-size: 12px;
            font-weight: bold;
          }
          .total-row.grand-total {
            font-weight: 800;
            font-size: 16px;
            padding: 3px 0;
            margin-top: 2px;
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
          }
          .payment-info {
            margin-top: 5px;
            padding: 3px 0;
            border-top: 1px dashed #000;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
          }
          .payment-info p {
            margin: 2px 0;
            font-weight: bold;
          }
          .payment-info strong {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px dashed #000;
            font-size: 12px;
            font-weight: bold;
          }
          .footer p {
            font-weight: bold;
          }
          .footer p:first-child {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .barcode {
            margin-top: 4px;
            padding: 3px 0;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          ${(() => {
            const showLogo = (receiptHeaderOption === 'logo' || receiptHeaderOption === 'both') && company.logo;
            const showName = receiptHeaderOption === 'company_name' || receiptHeaderOption === 'both';
            
            // If logo only is selected but no logo exists, fallback to company name
             if (receiptHeaderOption === 'logo' && !company.logo) {
               const fallbackName = language === 'ta' 
                 ? (company.nameTamil || company.name || 'My Store')
                 : (company.name || 'My Store');
               return `<div class="company-name">${fallbackName}</div>`;
             }
             
             let headerContent = '';
             if (showLogo) {
               headerContent += `<div class="company-logo-container"><img src="${company.logo}" alt="Logo" class="company-logo" /></div>`;
             }
             if (showName) {
               const companyName = language === 'ta' 
                 ? (company.nameTamil || company.name || 'My Store')
                 : (company.name || 'My Store');
               headerContent += `<div class="company-name">${companyName}</div>`;
             }
             return headerContent;
           })()}
           <div class="company-details">
             ${(() => {
               const address = language === 'ta' 
                 ? (company.addressTamil || company.address)
                 : company.address;
               const city = language === 'ta' 
                 ? (company.cityTamil || company.city)
                 : company.city;
               const state = language === 'ta' 
                 ? (company.stateTamil || company.state)
                 : company.state;
               
               // Tamil labels
               const phoneLabel = language === 'ta' ? 'தொலைபேசி:' : 'Phone:';
               const emailLabel = language === 'ta' ? 'மின்னஞ்சல்:' : 'Email:';
               const gstinLabel = language === 'ta' ? 'ஜிஎஸ்டிஐஎன்:' : 'GSTIN:';
               
               return `
                 ${address ? `<p>${address}</p>` : ''}
                 ${city || state || company.pincode
                   ? `<p>${[city, state, company.pincode].filter(Boolean).join(', ')}</p>`
                   : ''}
                 ${company.phone ? `<p>${phoneLabel} ${company.phone}</p>` : ''}
                 ${company.email ? `<p>${emailLabel} ${company.email}</p>` : ''}
                 ${company.website ? `<p>${company.website}</p>` : ''}
                 ${company.gstin ? `<p>${gstinLabel} ${company.gstin}</p>` : ''}
               `;
             })()}
          </div>
        </div>

        <div class="receipt-info">
          <div class="receipt-info-row">
            <p><strong>${getTranslation('receipt.receipt')} #:</strong> ${transaction.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>${getTranslation('receipt.date')}:</strong> ${date.toLocaleDateString()} <strong>${getTranslation('receipt.time')}:</strong> ${date.toLocaleTimeString()}</p>
          </div>
          ${customer ? `<p><strong>${getTranslation('receipt.customer')}:</strong> ${customer.name}${customer.mobile ? ` (${customer.mobile})` : ''}</p>` : ''}
          ${transaction.transaction_customer_id && !customer ? '<p><strong>Customer:</strong> Yes</p>' : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th class="col-number">${getTranslation('items.sno')}</th>
              <th class="col-item">${getTranslation('items.item')}</th>
              <th class="col-rate">${getTranslation('items.rate')}</th>
              <th class="col-qty">${getTranslation('items.qty')}</th>
              <th class="col-amt">${getTranslation('items.amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (cartItem, index) => {
                  const mrp = cartItem.item.mrp ? (typeof cartItem.item.mrp === 'string' ? parseFloat(cartItem.item.mrp) : cartItem.item.mrp) : null;
                  const price = typeof cartItem.item.price === 'string' ? parseFloat(cartItem.item.price) : cartItem.item.price;
                   // Tamil: display_name_tamil → display_name → name
                   // English: display_name → name
                   const itemDisplayName = language === 'ta' 
                     ? (cartItem.item.display_name_tamil || cartItem.item.display_name || cartItem.item.name)
                     : (cartItem.item.display_name || cartItem.item.name);
                  // Hide MRP for cafe business type
                  const showMrp = businessType !== 'cafe' && mrp;
                  return `
              <tr>
                <td class="col-number">${index + 1}</td>
                <td class="col-item item-name">
                  ${itemDisplayName}
                  ${showMrp ? `<br><small>MRP: ${formatCurrency(mrp)}</small>` : ''}
                </td>
                <td class="col-rate">${formatCurrency(price)}</td>
                <td class="col-qty">${cartItem.quantity}</td>
                <td class="col-amt">${formatCurrency(cartItem.subtotal)}</td>
              </tr>
            `;
                }
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>${getTranslation('totals.subtotal')}:</span>
            <span>${formatCurrency(items.reduce((sum, ci) => {
              const op = ci.originalPrice ?? (typeof ci.item.price === 'string' ? parseFloat(ci.item.price) : ci.item.price);
              return sum + (ci.quantity * op);
            }, 0))}</span>
          </div>
          
          ${discountAmount > 0 ? `
            <div class="total-row">
              <span>${getTranslation('totals.discount')}:</span>
              <span>-${formatCurrency(discountAmount)}</span>
            </div>
          ` : ''}
          
          ${taxAmount > 0 ? `
            <div class="total-row">
              <span>${getTranslation('totals.tax')}:</span>
              <span>${formatCurrency(taxAmount)}</span>
            </div>
          ` : ''}
          
          ${gstInfo.gstBreakdown.length > 0 ? 
            gstInfo.gstBreakdown.map(gst => `
              <div class="total-row" style="font-size: 11px; color: #666;">
                <span>GST @ ${gst.rate}%:</span>
                <span>${formatCurrency(gst.amount)}</span>
              </div>
            `).join('')
            : ''
          }

          <div class="total-row grand-total">
            <span>${getTranslation('totals.grandTotal')}:</span>
            <span>${formatCurrency(transaction.total_amount ? Number(transaction.total_amount) : total)}</span>
          </div>

          ${transaction.payment_method === 'cash' && transaction.received_amount
            ? `
            <div class="total-row" style="margin-top: 5px; font-size: 13px;">
              <span>${getTranslation('payment.cashReceived')}:</span>
              <span>${formatCurrency(transaction.received_amount)}</span>
            </div>
            ${transaction.change_amount && Number(transaction.change_amount) > 0
              ? `
              <div class="total-row" style="font-size: 13px;">
                <span>${getTranslation('payment.change')}:</span>
                <span>${formatCurrency(transaction.change_amount)}</span>
              </div>
            ` : ''}
          ` : ''}
        </div>

        <div class="payment-info">
          <p><strong>${getTranslation('payment.method')}:</strong> ${transaction.payment_method.toUpperCase()}</p>
        </div>

        <div class="footer">
          ${(() => {
            switch (businessType) {
              case 'cafe':
                return `
                  <p><strong>${getTranslation('footer.thankYou')}</strong></p>
                  <p>${language === 'ta' ? 'உங்கள் அனுபவம் மகிழ்ச்சியாக இருந்திருக்கும் என நம்புகிறோம்' : 'We hope you enjoyed your experience'}</p>
                `;
              case 'clothing':
                return `
                  <p><strong>${getTranslation('footer.thankYou')}</strong></p>
                  <p>${getTranslation('footer.visitAgain')}</p>
                `;
              case 'electrical':
                return `
                  <p><strong>${getTranslation('footer.thankYou')}</strong></p>
                  <p>${language === 'ta' ? 'தரமான பொருட்கள், நம்பகமான சேவை' : 'Quality Products, Trusted Service'}</p>
                `;
              default:
                return `
                  <p><strong>${getTranslation('footer.thankYou')}</strong></p>
                  <p>${getTranslation('footer.visitAgain')}</p>
                `;
            }
          })()}
          <div class="barcode">
            ${transaction.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </body>
    </html>
  `;

  // Auto-print mode: attempt silent printing (browser limitations apply)
  if (autoPrint) {
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printHTML);
      iframeDoc.close();

      // Wait for content to load, then attempt to print
      // IMPORTANT: Browsers require user interaction for printing due to security restrictions
      // The print dialog will still appear even in auto-print mode
      // For true silent printing, use Chrome with --kiosk-printing flag or a print service
      setTimeout(() => {
        if (iframe.contentWindow) {
          // Try to print (dialog will appear - this is a browser security limitation)
          try {
            console.log('Attempting auto-print (note: browser may still show print dialog)');
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (error) {
            console.warn('Auto-print failed, falling back to print dialog:', error);
            // Fallback: show print dialog
            window.print();
          }
        }
        // Remove iframe after printing attempt
        setTimeout(() => {
          try {
            if (iframe.parentNode) {
              document.body.removeChild(iframe);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 2000);
      }, 500);
    }
  } else {
    // Normal mode: open print window with dialog
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
  }
}

