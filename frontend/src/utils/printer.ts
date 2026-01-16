import { Transaction } from '../types';
import { CartItem } from '../types';
import { formatCurrency } from './formatters';
import { useCompanyStore } from '../store/companyStore';

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
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 4mm 3mm;
            background: white;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
            margin-bottom: 6px;
          }
          .company-logo-container {
            margin-bottom: 2px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .company-logo {
            max-width: 30mm;
            max-height: 15mm;
            width: auto;
            height: auto;
            object-fit: contain;
          }
          .company-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
            text-transform: uppercase;
            line-height: 1.2;
            letter-spacing: 0.5px;
          }
          .company-details {
            font-size: 9px;
            line-height: 1.3;
            text-transform: uppercase;
          }
          .company-details p {
            margin: 1px 0;
            text-transform: uppercase;
          }
          .receipt-info {
            margin-bottom: 6px;
            padding: 4px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            font-size: 9px;
            display: flex;
            justify-content: space-between;
          }
          .receipt-info-left, .receipt-info-right {
            margin: 2px 0;
          }
          .receipt-info-right {
            text-align: right;
            padding-left: 0;
          }
          .receipt-info-right p {
            margin: 0;
            padding-left: 0;
            line-height: 1.3;
          }
          .receipt-info-right .date-time-line {
            display: inline-block;
            white-space: nowrap;
          }
          .receipt-info p {
            margin: 1px 0;
          }
          .receipt-info strong {
            font-weight: bold;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 10px;
          }
          .items-table thead {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
          }
          .items-table th {
            text-align: left;
            padding: 3px 2px;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
          }
          .items-table tbody tr {
            border-bottom: 1px dotted #ccc;
          }
          .items-table tbody tr:last-child {
            border-bottom: 1px solid #000;
          }
          .items-table td {
            padding: 2px;
            font-size: 10px;
            line-height: 1.2;
          }
          .items-table .item-name {
            font-weight: bold;
          }
          .items-table small {
            font-size: 8px;
            display: block;
          }
          .items-table .text-right {
            text-align: right;
          }
          .items-table .text-center {
            text-align: center;
          }
          .items-table th.price-col,
          .items-table td.price-col {
            padding-left: 0 !important;
            padding-right: 2px;
            text-align: right;
          }
          .items-table th.amt-col,
          .items-table td.amt-col {
            padding-left: 0 !important;
            padding-right: 0;
            text-align: right;
          }
          .totals-section {
            margin-top: 6px;
            padding: 4px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 10px;
          }
          .total-row.grand-total {
            font-weight: bold;
            font-size: 13px;
            padding: 4px 0;
            margin-top: 3px;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          .payment-info {
            margin-top: 6px;
            padding: 4px 0;
            border-top: 1px dashed #000;
            font-size: 9px;
            text-align: center;
          }
          .payment-info p {
            margin: 2px 0;
          }
          .payment-info strong {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #000;
            font-size: 9px;
          }
          .footer p:first-child {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .barcode {
            margin-top: 4px;
            padding: 3px 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          ${company.logo ? `<div class="company-logo-container"><img src="${company.logo}" alt="Logo" class="company-logo" /></div>` : ''}
          <div class="company-name">${company.name || 'My Store'}</div>
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
          <div class="receipt-info-left">
            <p><strong>Receipt #:</strong> ${transaction.id.slice(0, 8).toUpperCase()}</p>
            ${transaction.transaction_customer_id ? '<p><strong>Customer:</strong> Yes</p>' : ''}
          </div>
          <div class="receipt-info-right" style="text-align: right;">
            <p class="date-time-line"><strong>Date:</strong> ${date.toLocaleDateString()} &nbsp; <strong>Time:</strong> ${date.toLocaleTimeString()}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 10%;">#</th>
              <th style="width: 43%;">Item</th>
              <th style="width: 15%;" class="text-center">Qty</th>
              <th style="width: 16%;" class="text-right price-col">Price</th>
              <th style="width: 16%;" class="text-right amt-col">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (cartItem, index) => `
              <tr>
                <td>${index + 1}</td>
                <td class="item-name">${cartItem.item.name}${cartItem.item.code ? `<br><small>${cartItem.item.code}</small>` : ''}</td>
                <td class="text-center">${cartItem.quantity}</td>
                <td class="text-right price-col">${formatCurrency(cartItem.item.price)}</td>
                <td class="text-right amt-col">${formatCurrency(cartItem.subtotal)}</td>
              </tr>
            `
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

