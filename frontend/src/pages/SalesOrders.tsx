import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { Transaction, Customer, SalesCustomer } from '../types';
import { formatCurrency, formatOrderId } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import { useCompanyStore } from '../store/companyStore';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import './SalesOrders.css';

type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface SalesOrdersProps {
  onNavigate?: (page: string, orderId?: string) => void;
}

export default function SalesOrders({ onNavigate }: SalesOrdersProps = { onNavigate: undefined }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesCustomers, setSalesCustomers] = useState<SalesCustomer[]>([]);
  const [filter, setFilter] = useState<FilterPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { customer: currentUser } = useAuthStore();
  const { company, loadCompany } = useCompanyStore();
  const { canViewProfit } = usePermissions();
  const isAdmin = currentUser?.isAdmin || false;
  const canViewProfitData = isAdmin || canViewProfit('sales');
  const canExport = currentUser?.customer_type === 'admin' && currentUser?.isAdmin === true;

  useEffect(() => {
    loadTransactions();
    loadCustomers();
    loadSalesCustomers();
  }, []);

  useEffect(() => {
    // Load company data from database
    loadCompany();
  }, [loadCompany]);

  const loadCustomers = async () => {
    try {
      const data = await storageService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadSalesCustomers = async () => {
    try {
      const data = await storageService.getSalesCustomers();
      setSalesCustomers(data);
    } catch (error) {
      // Keep orders page functional even if sales customers fail to load
      console.error('Error loading sales customers:', error);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [filter, transactions, customStartDate, customEndDate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadTransactions();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await storageService.getTransactions({ limit: 500 });
      console.log('Loaded transactions:', data);
      // Ensure data is an array
      const transactionsArray = Array.isArray(data) ? data : [];
      setTransactions(transactionsArray);
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Failed to load sales orders. Please check console for details.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!confirm(`Are you sure you want to delete this order (ID: ${transaction.id.substring(0, 8)}...)?\n\nThis will restore the stock for all items in this order.`)) {
      return;
    }

    try {
      await storageService.deleteTransaction(transaction.id);
      alert('Order deleted successfully. Stock has been restored.');
      // Reload transactions to refresh the list
      loadTransactions();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      alert(`Failed to delete order: ${error?.message || 'Unknown error'}`);
    }
  };

  const applyFilter = () => {
    // Ensure transactions is an array before filtering
    const transactionsArray = Array.isArray(transactions) ? transactions : [];

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate + 'T23:59:59');
        } else {
          setFilteredTransactions([]);
          return;
        }
        break;
      case 'all':
      default:
        setFilteredTransactions(transactionsArray);
        return;
    }

    const filtered = transactionsArray.filter((tx) => {
      const txDate = new Date(tx.created_at);
      if (startDate && endDate) {
        return txDate >= startDate && txDate <= endDate;
      } else if (startDate) {
        return txDate >= startDate;
      }
      return true;
    });

    setFilteredTransactions(filtered);
  };

  const getTotalSales = () => {
    return filteredTransactions.reduce((sum, tx) => {
      const amount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const getTotalReturns = () => {
    return filteredTransactions.reduce((sum, tx) => {
      const amount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      const num = isNaN(amount) ? 0 : amount;
      return num < 0 ? sum + Math.abs(num) : sum;
    }, 0);
  };

  const getTotalTransactions = () => {
    return filteredTransactions.length;
  };

  const isReturnTransaction = (tx: Transaction) => {
    if (tx.transaction_type === 'return') return true;
    const amount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
    return typeof amount === 'number' && amount < 0;
  };

  // Calculate profit/loss for a single transaction (same formula as Sales Performance backend: grossProfit - grossLoss - billDiscount)
  const calculateTransactionProfitLoss = (transaction: Transaction) => {
    try {
      const items = JSON.parse(transaction.items_json);
      let totalProfit = 0;
      let totalLoss = 0;
      let subtotal = 0;

      items.forEach((cartItem: any) => {
        const item = cartItem.item || cartItem;
        const quantity = cartItem.quantity || item.quantity || 1;

        let itemCost = 0;
        if (item.cost !== undefined) {
          itemCost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
        }

        let itemPrice = 0;
        if (cartItem.customPrice !== undefined) {
          itemPrice = typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : (cartItem.customPrice || 0);
        } else if (item.price !== undefined) {
          itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        } else if (cartItem.originalPrice !== undefined) {
          itemPrice = typeof cartItem.originalPrice === 'string' ? parseFloat(cartItem.originalPrice) : (cartItem.originalPrice || 0);
        }

        subtotal += itemPrice * quantity;
        const diff = (itemPrice - itemCost) * quantity;
        if (diff >= 0) totalProfit += diff;
        else totalLoss += Math.abs(diff);
      });

      const totalAmount = typeof transaction.total_amount === 'string'
        ? parseFloat(transaction.total_amount)
        : transaction.total_amount;
      const billDiscount = Math.max(0, subtotal - totalAmount);
      const netProfit = totalProfit - totalLoss - billDiscount;

      return {
        profit: totalProfit,
        loss: totalLoss,
        discount: billDiscount,
        netProfit,
      };
    } catch (error) {
      console.error('Error calculating profit/loss:', error);
      return { profit: 0, loss: 0, discount: 0, netProfit: 0 };
    }
  };

  // Calculate total profit, loss, discount for filtered transactions (same formula as Sales Performance: net = profit - loss - billDiscount)
  const getTotalProfitLoss = () => {
    const totals = filteredTransactions.reduce(
      (acc, tx) => {
        const { profit, loss, discount } = calculateTransactionProfitLoss(tx);
        return {
          profit: acc.profit + profit,
          loss: acc.loss + loss,
          discount: acc.discount + discount,
        };
      },
      { profit: 0, loss: 0, discount: 0 }
    );
    return totals;
  };

  const getTotalNetProfit = () => {
    const { profit, loss, discount } = getTotalProfitLoss();
    return profit - loss - discount;
  };

  const handlePrintReceipt = async (transaction: Transaction) => {
    try {
      const items = JSON.parse(transaction.items_json);

      // Find customer
      const customer = transaction.sales_customer_id
        ? salesCustomers.find((c) => c.id === transaction.sales_customer_id)
        : transaction.transaction_customer_id
          ? customers.find((c) => c.id === transaction.transaction_customer_id)
          : null;

      // Calculate totals for tax/discount inference
      let actualSubtotal = 0;
      let currentSubtotal = 0;

      items.forEach((ci: any) => {
        const item = ci.item || ci;
        const op = ci.originalPrice ?? (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
        const cp = ci.customPrice ?? op;
        const qty = ci.quantity || 1;
        actualSubtotal += op * qty;
        currentSubtotal += cp * qty;
      });

      const totalAmount = typeof transaction.total_amount === 'string' ? parseFloat(transaction.total_amount) : transaction.total_amount;

      // Inference logic (same as OrderDetails)
      const taxAmount = totalAmount > currentSubtotal ? totalAmount - currentSubtotal : 0;
      // Total discount = (Actual Subtotal - Current Subtotal) + Global Discount
      // If tax is present, Global Discount = Current Subtotal + Tax - Total Amount
      // But if Total Amount < Current Subtotal, then Global Discount = Current Subtotal - Total Amount
      const globalDiscount = currentSubtotal > totalAmount ? currentSubtotal - totalAmount : 0;
      const itemDiscounts = actualSubtotal - currentSubtotal;
      const totalDiscount = itemDiscounts + globalDiscount;

      await printReceipt({
        items,
        transaction,
        customer: customer as SalesCustomer, // Cast for compatibility
        taxAmount,
        discountAmount: totalDiscount,
      });
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt');
    }
  };

  const handleExportCSV = async () => {
    const companyStore = useCompanyStore.getState();
    // Ensure company data is loaded from database
    if (!companyStore.company.id && companyStore.company.name === 'My Store') {
      await companyStore.loadCompany();
    }
    const company = companyStore.getCompany();
    const headers = canViewProfitData
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

      if (canViewProfitData) {
        const { netProfit } = calculateTransactionProfitLoss(tx);
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

  const handleExportPDF = async () => {
    const companyStore = useCompanyStore.getState();
    // Ensure company data is loaded from database
    if (!companyStore.company.id && companyStore.company.name === 'My Store') {
      await companyStore.loadCompany();
    }
    const company = companyStore.getCompany();
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
                {canViewProfitData && <th>Profit/Loss</th>}
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
      if (canViewProfitData) {
        const { netProfit } = calculateTransactionProfitLoss(tx);
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
            ${canViewProfitData ? `<div class="summary-row"><strong>Net Profit:</strong> ${formatCurrency(getTotalNetProfit())}</div>` : ''}
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
        {company.logo && (
          <div className="page-logo-container">
            <img
              src={company.logo}
              alt={company.name || 'Company Logo'}
              className="page-logo"
            />
          </div>
        )}
        <div className="header-content">
          <h1>{company.logo ? '' : '📊 '}Sales Orders</h1>
        </div>
        {canExport && (
          <div className="export-buttons">
            <button className="btn btn-secondary" onClick={handleExportCSV} title="Export to CSV">
              📥 CSV
            </button>
            <button className="btn btn-secondary" onClick={handleExportPDF} title="Export to PDF">
              📄 PDF
            </button>
          </div>
        )}
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
          <button
            className={`filter-btn ${filter === 'custom' ? 'active' : ''}`}
            onClick={() => setFilter('custom')}
          >
            Custom Range
          </button>
        </div>
        {filter === 'custom' && (
          <div className="custom-date-filter">
            <div className="date-input-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="date-input-group">
              <label>End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
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
        {getTotalReturns() > 0 && (
          <div className="summary-card returns-card">
            <div className="summary-icon">↩️</div>
            <div className="summary-content">
              <h3>Returns</h3>
              <p className="summary-value returns-value">{formatCurrency(getTotalReturns())}</p>
            </div>
          </div>
        )}
        {canViewProfitData && (
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
                  {formatCurrency(getTotalNetProfit())}
                </p>
                <p className="summary-subtext">Total Profit − Total Loss − Bill Discount</p>
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
                  <th>S.No</th>
                  <th>Type</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  {canViewProfitData && <th>Profit</th>}
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => {
                  // Prefer sales_customer_id (SalesCustomer used in Cart) then fallback to transaction_customer_id (Customer)
                  const salesCustomer = transaction.sales_customer_id
                    ? salesCustomers.find((c) => c.id === transaction.sales_customer_id)
                    : null;
                  const customer = !salesCustomer && transaction.transaction_customer_id
                    ? customers.find(c => c.id === transaction.transaction_customer_id)
                    : null;
                  const isReturn = isReturnTransaction(transaction);
                  const profitLoss = canViewProfitData ? calculateTransactionProfitLoss(transaction) : null;
                  const rowNetProfit = profitLoss ? profitLoss.netProfit : 0;
                  return (
                    <tr key={transaction.id} className={isReturn ? 'return-row' : ''}>
                      <td>{index + 1}</td>
                      <td>
                        <span className={`tx-type-badge ${isReturn ? 'tx-type-return' : 'tx-type-sale'}`}>
                          {isReturn ? 'Return' : 'Sale'}
                        </span>
                      </td>
                      <td>
                        <a
                          href="#"
                          className="order-id-link"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onNavigate) {
                              onNavigate('order-details', transaction.id);
                            }
                          }}
                          title={transaction.id}
                        >
                          {formatOrderId(transaction.id)}
                        </a>
                      </td>
                      <td>
                        {salesCustomer ? (
                          <div className="customer-info">
                            <div className="customer-name">{salesCustomer.name}</div>
                            {salesCustomer.mobile && <div className="customer-phone">{salesCustomer.mobile}</div>}
                          </div>
                        ) : customer ? (
                          <div className="customer-info">
                            <div className="customer-name">{customer.name}</div>
                            {customer.phone && <div className="customer-phone">{customer.phone}</div>}
                          </div>
                        ) : (
                          <span className="walk-in">Walk-in</span>
                        )}
                      </td>
                      <td className={`amount ${isReturn ? 'amount-return' : ''}`}>{formatCurrency(transaction.total_amount)}</td>
                      {canViewProfitData && (
                        <td className={rowNetProfit < 0 ? 'profit-cell negative' : 'profit-cell'}>
                          {formatCurrency(rowNetProfit)}
                        </td>
                      )}
                      <td>
                        <span className="payment-method">
                          {getPaymentMethodIcon(transaction.payment_method)}{' '}
                          {transaction.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatDate(transaction.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {(isAdmin || transaction.customer_id === currentUser?.id) && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                if (onNavigate) {
                                  onNavigate('order-details', transaction.id);
                                }
                              }}
                              title="Edit Order"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handlePrintReceipt(transaction)}
                            title="Print Receipt"
                          >
                            🖨️
                          </button>
                          {(isAdmin || transaction.customer_id === currentUser?.id) && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteTransaction(transaction)}
                              title="Delete Order"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
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

