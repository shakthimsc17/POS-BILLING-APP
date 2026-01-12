import { Transaction } from '../types';
import { CartItem } from '../types';
import { formatCurrency } from './formatters';
import { useCompanyStore } from '../store/companyStore';

interface PrintOptions {
  items: CartItem[];
  transaction: Transaction;
}

export function printReceipt(options: PrintOptions) {
  const { items, transaction } = options;
  const company = useCompanyStore.getState().getCompany();

  const date = new Date(transaction.created_at);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Create HTML for normal printer (3x4 inch receipt size)
  const printHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${transaction.id.slice(0, 8)}</title>
        <style>
          @media print {
            @page {
              size: 3in 4in;
              margin: 5mm 3mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 9px;
            line-height: 1.3;
            color: #000;
            width: 3in;
            margin: 0 auto;
            padding: 3mm;
            background: white;
            border: 1px solid #e0e0e0;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 6px;
            margin-bottom: 8px;
            position: relative;
          }
          .receipt-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          }
          .company-name {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
            line-height: 1.2;
            color: #667eea;
            letter-spacing: 0.5px;
          }
          .company-details {
            font-size: 7px;
            line-height: 1.5;
            color: #555;
          }
          .company-details p {
            margin: 2px 0;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 6px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #667eea;
            font-size: 7px;
          }
          .receipt-info-left, .receipt-info-right {
            flex: 1;
          }
          .receipt-info p {
            margin: 2px 0;
          }
          .receipt-info strong {
            color: #667eea;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 8px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
          }
          .items-table thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .items-table th {
            text-align: left;
            padding: 4px 3px;
            font-weight: bold;
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .items-table tbody tr {
            border-bottom: 1px solid #f0f0f0;
          }
          .items-table tbody tr:last-child {
            border-bottom: none;
          }
          .items-table tbody tr:nth-child(even) {
            background: #fafafa;
          }
          .items-table td {
            padding: 4px 3px;
            font-size: 8px;
            line-height: 1.3;
          }
          .items-table .item-name {
            font-weight: 600;
            color: #333;
          }
          .items-table small {
            color: #666;
            font-size: 6px;
          }
          .items-table .text-right {
            text-align: right;
          }
          .items-table .text-center {
            text-align: center;
          }
          .totals-section {
            margin-top: 8px;
            padding: 6px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 8px;
            color: #555;
          }
          .total-row.grand-total {
            font-weight: bold;
            font-size: 11px;
            padding: 6px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 4px;
            margin-top: 4px;
            border: none;
          }
          .total-row.grand-total span {
            color: white;
          }
          .payment-info {
            margin-top: 8px;
            padding: 5px 6px;
            background: #fff9e6;
            border-left: 3px solid #f39c12;
            border-radius: 4px;
            font-size: 7px;
          }
          .payment-info p {
            margin: 2px 0;
            color: #555;
          }
          .payment-info strong {
            color: #f39c12;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 2px dashed #ddd;
            font-size: 7px;
            color: #666;
          }
          .footer p:first-child {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 3px;
          }
          .barcode {
            margin-top: 6px;
            padding: 4px 8px;
            background: #f5f5f5;
            border-radius: 3px;
            display: inline-block;
            font-family: 'Courier New', monospace;
            font-size: 8px;
            font-weight: bold;
            letter-spacing: 1px;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
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
            <p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${date.toLocaleTimeString()}</p>
          </div>
          <div class="receipt-info-right" style="text-align: right;">
            ${transaction.transaction_customer_id ? '<p><strong>Customer:</strong> Yes</p>' : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 8%;">#</th>
              <th style="width: 45%;">Item</th>
              <th style="width: 12%;" class="text-center">Qty</th>
              <th style="width: 17%;" class="text-right">Price</th>
              <th style="width: 18%;" class="text-right">Amt</th>
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
                <td class="text-right">${formatCurrency(cartItem.item.price)}</td>
                <td class="text-right">${formatCurrency(cartItem.subtotal)}</td>
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
            ${transaction.change_amount && transaction.change_amount > 0
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
          <p><strong>Thank you for your business!</strong></p>
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

