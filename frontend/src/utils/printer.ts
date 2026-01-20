import { Transaction } from '../types';
import { CartItem } from '../types';
import { formatCurrency } from './formatters';
import { useCompanyStore } from '../store/companyStore';
import { receiptSettings } from './receiptSettings';

interface PrintOptions {
  items: CartItem[];
  transaction: Transaction;
}

export async function printReceipt(options: PrintOptions) {
  const { items, transaction } = options;
  
  // Ensure company data is loaded from database (not localStorage)
  const companyStore = useCompanyStore.getState();
  // Check if company is default (not loaded) or has no id (not saved to DB yet)
  if (!companyStore.company.id && companyStore.company.name === 'My Store') {
    // Company not loaded yet, load it from database
    await companyStore.loadCompany();
  }
  const company = companyStore.getCompany();

  // Get receipt settings
  const receiptHeaderOption = receiptSettings.getHeaderOption();

  const date = new Date(transaction.created_at);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Create HTML for 3-inch (80mm) thermal printer
  const printHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${transaction.id.slice(0, 8)}</title>
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
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 14px;
            font-weight: bold;
            line-height: 1.5;
            color: #000;
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 3mm 2mm;
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
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 2px;
            text-transform: uppercase;
            line-height: 1.3;
            letter-spacing: 0.5px;
          }
          .company-details {
            font-size: 12px;
            font-weight: bold;
            line-height: 1.4;
            text-transform: uppercase;
          }
          .company-details p {
            margin: 1px 0;
            font-weight: bold;
            text-transform: uppercase;
          }
          .receipt-info {
            margin-bottom: 5px;
            padding: 3px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            font-size: 11px;
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
            font-size: 11px;
            font-weight: bold;
            line-height: 1.3;
            vertical-align: top;
            word-wrap: break-word;
            overflow: hidden;
          }
          .items-table .item-name {
            font-weight: bold;
            font-size: 10px;
            max-width: 100%;
            word-wrap: break-word;
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
            padding: 2px 0;
            font-size: 14px;
            font-weight: bold;
          }
          .total-row.grand-total {
            font-weight: bold;
            font-size: 18px;
            padding: 4px 0;
            margin-top: 3px;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
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
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
              return `<div class="company-name">${company.name || 'My Store'}</div>`;
            }
            
            let headerContent = '';
            if (showLogo) {
              headerContent += `<div class="company-logo-container"><img src="${company.logo}" alt="Logo" class="company-logo" /></div>`;
            }
            if (showName) {
              headerContent += `<div class="company-name">${company.name || 'My Store'}</div>`;
            }
            return headerContent;
          })()}
          <div class="company-details">
            ${company.address ? `<p>${company.address}</p>` : ''}
            ${company.city || company.state || company.pincode
              ? `<p>${[company.city, company.state, company.pincode].filter(Boolean).join(', ')}</p>`
              : ''}
            ${company.phone ? `<p>Phone: ${company.phone}</p>` : ''}
            ${company.email ? `<p>Email: ${company.email}</p>` : ''}
            ${company.website ? `<p>${company.website}</p>` : ''}
            ${company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : ''}
          </div>
        </div>

        <div class="receipt-info">
          <div class="receipt-info-row">
            <p><strong>Receipt #:</strong> ${transaction.id.slice(0, 8).toUpperCase()}</p>
            <p class="receipt-date-time"><strong>Date:</strong> ${date.toLocaleDateString()} &nbsp; <strong>Time:</strong> ${date.toLocaleTimeString()}</p>
          </div>
          ${transaction.transaction_customer_id ? '<p><strong>Customer:</strong> Yes</p>' : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th class="col-number">#</th>
              <th class="col-item">Item</th>
              <th class="col-rate">Rate</th>
              <th class="col-qty">Qty</th>
              <th class="col-amt">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (cartItem, index) => {
                  const mrp = cartItem.item.mrp ? (typeof cartItem.item.mrp === 'string' ? parseFloat(cartItem.item.mrp) : cartItem.item.mrp) : null;
                  const price = typeof cartItem.item.price === 'string' ? parseFloat(cartItem.item.price) : cartItem.item.price;
                  return `
              <tr>
                <td class="col-number">${index + 1}</td>
                <td class="col-item item-name">
                  ${cartItem.item.name}
                  ${mrp ? `<br><small>MRP: ${formatCurrency(mrp)}</small>` : ''}
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
            <span>Subtotal:</span>
            <span>${formatCurrency(total)}</span>
          </div>
          ${transaction.payment_method === 'cash' && transaction.received_amount
            ? `
            <div class="total-row">
              <span>Cash Received:</span>
              <span>${formatCurrency(transaction.received_amount)}</span>
            </div>
            ${transaction.change_amount && Number(transaction.change_amount) > 0
              ? `
              <div class="total-row">
                <span>Change:</span>
                <span>${formatCurrency(transaction.change_amount)}</span>
              </div>
            `
              : ''}
          `
            : ''}
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>

        <div class="payment-info">
          <p><strong>Payment Method:</strong> ${transaction.payment_method.toUpperCase()}</p>
        </div>

        <div class="footer">
          <p><strong>Your Style Matters to Us. Thank You!</strong></p>
          <p>Please visit again</p>
          <div class="barcode">
            ${transaction.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </body>
    </html>
  `;

  // Open print window
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

