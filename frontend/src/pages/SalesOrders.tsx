import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { Transaction, Customer } from '../types';
import { formatCurrency } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import { useCompanyStore } from '../store/companyStore';
import { useAuthStore } from '../store/authStore';
import './SalesOrders.css';

type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export default function SalesOrders() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<FilterPeriod>('today');
  const [loading, setLoading] = useState(true);
  const { customer } = useAuthStore();
  const isAdmin = customer?.isAdmin || false;

  useEffect(() => {
    loadTransactions();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await storageService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [filter, transactions]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await storageService.getTransactions();
      console.log('Loaded transactions:', data);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Failed to load sales orders. Please check console for details.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const now = new Date();
    let startDate: Date;

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        setFilteredTransactions(transactions);
        return;
    }

    const filtered = transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      return txDate >= startDate;
    });

    setFilteredTransactions(filtered);
  };

  const getTotalSales = () => {
    return filteredTransactions.reduce((sum, tx) => {
      const amount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const getTotalTransactions = () => {
    return filteredTransactions.length;
  };

  // Calculate profit/loss for a single transaction
  const calculateTransactionProfitLoss = (transaction: Transaction) => {
    try {
      const items = JSON.parse(transaction.items_json);
      let totalProfit = 0;
      let totalLoss = 0;

      items.forEach((cartItem: any) => {
        const item = cartItem.item || cartItem; // Handle both CartItem and Item formats
        const quantity = cartItem.quantity || 1;
        const sellingPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);

        if (cost > 0) {
          const difference = sellingPrice - cost;
          if (difference > 0) {
            // Profit: selling price is higher than cost
            totalProfit += difference * quantity;
          } else if (difference < 0) {
            // Loss: selling price is lower than cost
            totalLoss += Math.abs(difference) * quantity;
          }
        }
      });

      return { profit: totalProfit, loss: totalLoss };
    } catch (error) {
      console.error('Error calculating profit/loss:', error);
      return { profit: 0, loss: 0 };
    }
  };

  // Calculate total profit and loss for filtered transactions
  const getTotalProfitLoss = () => {
    const totals = filteredTransactions.reduce(
      (acc, tx) => {
        const { profit, loss } = calculateTransactionProfitLoss(tx);
        return {
          profit: acc.profit + profit,
          loss: acc.loss + loss,
        };
      },
      { profit: 0, loss: 0 }
    );
    return totals;
  };

  const handlePrintReceipt = (transaction: Transaction) => {
    try {
      const items = JSON.parse(transaction.items_json);
      printReceipt({
        items,
        transaction,
      });
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt');
    }
  };

  const handleExportCSV = () => {
    const company = useCompanyStore.getState().getCompany();
    const headers = isAdmin 
      ? ['Date', 'Time', 'Order ID', 'Customer', 'Items Count', 'Payment Method', 'Amount', 'Profit/Loss']
      : ['Date', 'Time', 'Order ID', 'Customer', 'Items Count', 'Payment Method', 'Amount'];
    
    const csvRows = [
      [company.name || 'Sales Report'],
      [company.address || ''],
      [`Generated: ${new Date().toLocaleString()}`],
      [''],
      headers,
    ];

    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.created_at);
      const items = JSON.parse(tx.items_json);
      const customer = tx.transaction_customer_id 
        ? customers.find(c => c.id === tx.transaction_customer_id)?.name || 'Walk-in'
        : 'Walk-in';
      const row = [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        tx.id.slice(0, 8).toUpperCase(),
        customer,
        items.length.toString(),
        tx.payment_method.toUpperCase(),
        formatCurrency(tx.total_amount),
      ];
      
      if (isAdmin) {
        const { profit, loss } = calculateTransactionProfitLoss(tx);
        const netProfit = profit - loss;
        row.push(formatCurrency(netProfit));
      }
      
      csvRows.push(row);
    });

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${filter}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const company = useCompanyStore.getState().getCompany();
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report - ${filter}</title>
          <style>
            @media print {
              @page { size: A4; margin: 15mm; }
            }
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .company-name { font-size: 18px; font-weight: bold; }
            .report-title { font-size: 16px; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
            .summary { margin-top: 20px; padding-top: 15px; border-top: 2px solid #000; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${company.name || 'My Store'}</div>
            <div>${company.address || ''}</div>
            <div>${[company.city, company.state, company.pincode].filter(Boolean).join(', ')}</div>
            <div class="report-title">Sales Report - ${filter.charAt(0).toUpperCase() + filter.slice(1)}</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Amount</th>
                {isAdmin && <th>Profit/Loss</th>}
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(tx => {
                const date = new Date(tx.created_at);
                const items = JSON.parse(tx.items_json);
                const customer = tx.transaction_customer_id 
                  ? customers.find(c => c.id === tx.transaction_customer_id)?.name || 'Walk-in'
                  : 'Walk-in';
                let profitLossCell = '';
                if (isAdmin) {
                  const { profit, loss } = calculateTransactionProfitLoss(tx);
                  const netProfit = profit - loss;
                  profitLossCell = `<td>${formatCurrency(netProfit)}</td>`;
                }
                return `
                  <tr>
                    <td>${date.toLocaleDateString()}</td>
                    <td>${tx.id.slice(0, 8).toUpperCase()}</td>
                    <td>${customer}</td>
                    <td>${items.length}</td>
                    <td>${tx.payment_method.toUpperCase()}</td>
                    <td>${formatCurrency(tx.total_amount)}</td>
                    ${profitLossCell}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><strong>Total Orders:</strong> ${getTotalTransactions()}</div>
            <div class="summary-row"><strong>Total Sales:</strong> ${formatCurrency(getTotalSales())}</div>
            ${isAdmin ? `<div class="summary-row"><strong>Total Profit:</strong> ${formatCurrency(getTotalProfitLoss().profit - getTotalProfitLoss().loss)}</div>` : ''}
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'upi':
        return '📱';
      default:
        return '💰';
    }
  };

  if (loading) {
    return (
      <div className="sales-orders">
        <div className="loading-state">
          <p>Loading sales orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-orders">
      <div className="sales-orders-header">
        <h1>📊 Sales Orders</h1>
        <div className="export-buttons">
          <button className="btn btn-secondary" onClick={handleExportCSV} title="Export to CSV">
            📥 CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} title="Export to PDF">
            📄 PDF
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button
            className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
            onClick={() => setFilter('month')}
          >
            This Month
          </button>
          <button
            className={`filter-btn ${filter === 'year' ? 'active' : ''}`}
            onClick={() => setFilter('year')}
          >
            This Year
          </button>
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">📦</div>
          <div className="summary-content">
            <h3>Total Orders</h3>
            <p className="summary-value">{getTotalTransactions()}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Total Sales</h3>
            <p className="summary-value">{formatCurrency(getTotalSales())}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <h3>Average Order</h3>
            <p className="summary-value">
              {getTotalTransactions() > 0
                ? formatCurrency(getTotalSales() / getTotalTransactions())
                : formatCurrency(0)}
            </p>
          </div>
        </div>
        {isAdmin && (
          <>
            <div className="summary-card profit-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <h3>Total Profit</h3>
                <p className="summary-value profit-value">
                  {formatCurrency(getTotalProfitLoss().profit)}
                </p>
              </div>
            </div>
            <div className="summary-card loss-card">
              <div className="summary-icon">📉</div>
              <div className="summary-content">
                <h3>Total Loss</h3>
                <p className="summary-value loss-value">
                  {formatCurrency(getTotalProfitLoss().loss)}
                </p>
              </div>
            </div>
            <div className="summary-card net-card">
              <div className="summary-icon">💵</div>
              <div className="summary-content">
                <h3>Net Profit</h3>
                <p className="summary-value net-value">
                  {formatCurrency(getTotalProfitLoss().profit - getTotalProfitLoss().loss)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transactions List */}
      <div className="card">
        {filteredTransactions.length > 0 ? (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  {isAdmin && <th>Profit/Loss</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const items = JSON.parse(transaction.items_json);
                  // transaction_customer_id is the buyer (customer who made the purchase)
                  const customer = transaction.transaction_customer_id 
                    ? customers.find(c => c.id === transaction.transaction_customer_id)
                    : null;
                  const { profit, loss } = calculateTransactionProfitLoss(transaction);
                  const netProfit = profit - loss;
                  return (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.created_at)}</td>
                      <td className="order-id">{transaction.id.substring(0, 8)}...</td>
                      <td>
                        {customer ? (
                          <div className="customer-info">
                            <div className="customer-name">{customer.name}</div>
                            {customer.phone && <div className="customer-phone">{customer.phone}</div>}
                          </div>
                        ) : (
                          <span className="walk-in">Walk-in</span>
                        )}
                      </td>
                      <td>
                        <div className="items-count">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td>
                        <span className="payment-method">
                          {getPaymentMethodIcon(transaction.payment_method)}{' '}
                          {transaction.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="amount">{formatCurrency(transaction.total_amount)}</td>
                      {isAdmin && (
                        <td>
                          <div className="profit-loss-cell">
                            {profit > 0 && (
                              <div className="profit-badge">
                                <span className="profit-label">Profit:</span>
                                <span className="profit-amount">+{formatCurrency(profit)}</span>
                              </div>
                            )}
                            {loss > 0 && (
                              <div className="loss-badge">
                                <span className="loss-label">Loss:</span>
                                <span className="loss-amount">-{formatCurrency(loss)}</span>
                              </div>
                            )}
                            {profit === 0 && loss === 0 && (
                              <span className="no-profit-loss">-</span>
                            )}
                            {netProfit !== 0 && (
                              <div className={`net-badge ${netProfit > 0 ? 'net-profit' : 'net-loss'}`}>
                                Net: {formatCurrency(netProfit)}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handlePrintReceipt(transaction)}
                          title="Print Receipt"
                        >
                          🖨️ Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No sales orders found</p>
            <p className="empty-subtext">No transactions for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}

