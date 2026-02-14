import { Transaction } from '../types';
import { CartItem } from '../types';
import { formatCurrency } from './formatters';
import { useCompanyStore } from '../store/companyStore';
import { receiptSettings } from './receiptSettings';
import { useLanguage } from '../contexts/LanguageContext';

import { SalesCustomer } from '../types';

interface PrintOptions {
  items: CartItem[];
  transaction: Transaction;
  customer?: SalesCustomer | null;
  taxAmount?: number;
  discountAmount?: number;
  autoPrint?: boolean;
}

export async function printMultiLanguageReceipt(options: PrintOptions) {
  const { 
    items, 
    transaction, 
    customer, 
    taxAmount = 0, 
    discountAmount = 0, 
    autoPrint = false 
  } = options;
  
  // Get language context
  const { t, language, isTamil } = useLanguage();
  
  // Ensure company data is loaded
  const companyStore = useCompanyStore.getState();
  if (!companyStore.company.id && companyStore.company.name === 'My Store') {
    await companyStore.loadCompany();
  }
  const company = companyStore.getCompany();
  const businessType = company.business_type || null;

  // Get receipt settings
  const receiptHeaderOption = await receiptSettings.getHeaderOption();

  const date = new Date(transaction.created_at);
  const total = transaction.total_amount ? Number(transaction.total_amount) : items.reduce((sum, item) => sum + item.subtotal, 0);

  // Create HTML for 3-inch (80mm) thermal printer with language support
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
            font-family: ${isTamil ? "'Tamil Sangam MN', 'Noto Sans Tamil', 'Latha', sans-serif" : "'Inter', system-ui, -apple-system, sans-serif"};
            font-size: ${isTamil ? '11px' : '12px'};
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
          .receipt-info {
            margin-bottom: 4px;
            padding: 2px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            font-size: 10px;
            font-weight: bold;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: ${isTamil ? '10px' : '11px'};
            font-weight: bold;
            table-layout: fixed;
          }
          .items-table th {
            text-align: left;
            padding: 2px 1px;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
          }
          .items-table td {
            padding: 2px 1px;
            font-size: ${isTamil ? '9px' : '10px'};
            font-weight: bold;
            line-height: 1.2;
            vertical-align: top;
          }
          .items-table .item-name {
            font-weight: bold;
            font-size: ${isTamil ? '9px' : '10px'};
            text-transform: capitalize;
          }
          .totals-section {
            margin-top: 6px;
            padding: 4px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
            font-size: ${isTamil ? '11px' : '12px'};
            font-weight: bold;
          }
          .total-row.grand-total {
            font-weight: 800;
            font-size: ${isTamil ? '14px' : '16px'};
            padding: 3px 0;
            margin-top: 2px;
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
          }
          .footer {
            text-align: center;
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px dashed #000;
            font-size: ${isTamil ? '11px' : '12px'};
            font-weight: bold;
          }
          .footer p {
            font-weight: bold;
            line-height: ${isTamil ? '1.6' : '1.4'};
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="company-name">${company.name || 'My Store'}</div>
          <div class="company-details">
            ${company.address ? `<p>${company.address}</p>` : ''}
            ${company.phone ? `<p>Phone: ${company.phone}</p>` : ''}
            ${company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : ''}
          </div>
        </div>

        <div class="receipt-info">
          <div class="receipt-info-row">
            <p><strong>${t('receipt.receipt')} #:</strong> ${transaction.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>${t('receipt.date')}:</strong> ${date.toLocaleDateString()} <strong>${t('receipt.time')}:</strong> ${date.toLocaleTimeString()}</p>
          </div>
          ${customer ? `<p><strong>${t('receipt.customer')}:</strong> ${customer.name}</p>` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${t('items.item')}</th>
              <th>${t('items.rate')}</th>
              <th>${t('items.qty')}</th>
              <th>${t('items.amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((cartItem, index) => {
              const price = typeof cartItem.item.price === 'string' ? parseFloat(cartItem.item.price) : cartItem.item.price;
              // Use display_name only when language is Tamil, otherwise use regular name
              const itemDisplayName = language === 'ta' 
                ? (cartItem.item.display_name || cartItem.item.name)
                : cartItem.item.name;
              
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td class="item-name">${itemDisplayName}</td>
                  <td>${formatCurrency(price)}</td>
                  <td>${cartItem.quantity}</td>
                  <td>${formatCurrency(cartItem.subtotal)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>${t('totals.subtotal')}:</span>
            <span>${formatCurrency(items.reduce((sum, ci) => sum + ci.subtotal, 0))}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="total-row">
              <span>${t('totals.discount')}:</span>
              <span>-${formatCurrency(discountAmount)}</span>
            </div>
          ` : ''}
          ${taxAmount > 0 ? `
            <div class="total-row">
              <span>${t('totals.tax')}:</span>
              <span>${formatCurrency(taxAmount)}</span>
            </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>${t('totals.grandTotal')}:</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>${t('footer.thankYou')}</strong></p>
          <p>${t('footer.visitAgain')}</p>
        </div>
      </body>
    </html>
  `;

  // Print implementation (same as original)
  if (autoPrint) {
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

      setTimeout(() => {
        if (iframe.contentWindow) {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (error) {
            console.warn('Auto-print failed, falling back to print dialog:', error);
            window.print();
          }
        }
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

// Export the enhanced function
export { printMultiLanguageReceipt as printReceipt };
