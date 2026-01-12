import { Transaction } from '../types';
import { CartItem } from '../types';
import { formatCurrency } from './formatters';

interface PrintOptions {
  items: CartItem[];
  transaction: Transaction;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

export function printThermalReceipt(options: PrintOptions) {
  const { items, transaction, storeName = 'POS Store', storeAddress = '', storePhone = '' } = options;
  
  // Create print content for 3-inch thermal printer (80mm width)
  let printContent = '';
  
  // ESC/POS commands for 3-inch printer
  const ESC = '\x1B';
  const GS = '\x1D';
  
  // Initialize printer
  printContent += ESC + '@'; // Reset printer
  
  // Center align and bold for header
  printContent += ESC + 'a' + '\x01'; // Center align
  printContent += ESC + 'E' + '\x01'; // Bold on
  printContent += storeName + '\n';
  printContent += ESC + 'E' + '\x00'; // Bold off
  
  if (storeAddress) {
    printContent += storeAddress + '\n';
  }
  if (storePhone) {
    printContent += 'Tel: ' + storePhone + '\n';
  }
  printContent += '--------------------------------\n';
  
  // Left align for items
  printContent += ESC + 'a' + '\x00'; // Left align
  
  // Date and time
  const date = new Date(transaction.created_at);
  printContent += 'Date: ' + date.toLocaleDateString() + '\n';
  printContent += 'Time: ' + date.toLocaleTimeString() + '\n';
  printContent += '--------------------------------\n';
  
  // Items
  printContent += 'Items:\n';
  items.forEach((cartItem) => {
    const item = cartItem.item;
    printContent += item.name + '\n';
    if (item.code) {
      printContent += 'Code: ' + item.code + '  ';
    }
    printContent += 'Qty: ' + cartItem.quantity + ' x ' + formatCurrency(item.price) + '\n';
    printContent += '      ' + formatCurrency(cartItem.subtotal) + '\n';
    printContent += '---\n';
  });
  
  printContent += '--------------------------------\n';
  
  // Totals
  printContent += ESC + 'E' + '\x01'; // Bold on
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  printContent += 'Total: ' + formatCurrency(total) + '\n';
  printContent += ESC + 'E' + '\x00'; // Bold off
  
  if (transaction.payment_method === 'cash' && transaction.received_amount) {
    printContent += 'Cash: ' + formatCurrency(transaction.received_amount) + '\n';
    if (transaction.change_amount) {
      printContent += 'Change: ' + formatCurrency(transaction.change_amount) + '\n';
    }
  } else {
    printContent += 'Payment: ' + transaction.payment_method.toUpperCase() + '\n';
  }
  
  printContent += '--------------------------------\n';
  printContent += ESC + 'a' + '\x01'; // Center align
  printContent += 'Thank You!\n';
  printContent += 'Visit Again\n';
  printContent += '\n\n\n';
  
  // Cut paper
  printContent += GS + 'V' + '\x41' + '\x03';
  
  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                width: 80mm;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                padding: 10px;
                margin: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              padding: 10px;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>${printContent.replace(/\n/g, '<br>')}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    // Try to print using browser print API
    setTimeout(() => {
      printWindow.print();
      // Close window after printing
      setTimeout(() => {
        printWindow.close();
      }, 250);
    }, 250);
  } else {
    // Fallback: use browser print
    const printDiv = document.createElement('div');
    printDiv.style.position = 'absolute';
    printDiv.style.left = '-9999px';
    printDiv.style.width = '80mm';
    printDiv.style.fontFamily = 'Courier New, monospace';
    printDiv.style.fontSize = '12px';
    printDiv.style.whiteSpace = 'pre-wrap';
    printDiv.textContent = printContent;
    document.body.appendChild(printDiv);
    
    window.print();
    
    setTimeout(() => {
      document.body.removeChild(printDiv);
    }, 1000);
  }
}

// Alternative: Direct ESC/POS printing (requires printer support)
export function printDirectESCPOS(options: PrintOptions) {
  if ('serial' in navigator) {
    // Web Serial API for direct printer communication
    console.log('Web Serial API available');
    // Implementation would require user permission and printer connection
  }
  
  // Fallback to print dialog
  printThermalReceipt(options);
}

