import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import { Transaction, Item, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import './Reports.css';

type ReportPeriod = 'week' | 'month' | 'year' | 'overall';

interface InvestmentData {
  currentInventory: number;
  purchasedAmount: number;
  totalInvestment: number;
}

interface SalesData {
  revenue: number;
  transactions: number;
  averageOrderValue: number;
  profit: number;
  profitMargin: number;
}

interface TopItem {
  item: Item;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>('overall');
  const [loading, setLoading] = useState(true);
  const [showPrices, setShowPrices] = useState(false);
  const { items: storeItems, categories: storeCategories } = useInventoryStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setItems(storeItems);
    setCategories(storeCategories);
  }, [storeItems, storeCategories]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txData, itemsData, categoriesData] = await Promise.all([
        storageService.getTransactions(),
        storageService.getItems(),
        storageService.getCategories(),
      ]);
      console.log('Loaded data:', { transactions: txData, items: itemsData, categories: categoriesData });
      setTransactions(txData || []);
      setItems(itemsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load reports data. Please check console for details.');
      setTransactions([]);
      setItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = (): Transaction[] => {
    if (period === 'overall') return transactions;

    const now = new Date();
    let startDate: Date;

    switch (period) {
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
      default:
        return transactions;
    }

    return transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      return txDate >= startDate;
    });
  };

  const calculateInvestment = (): InvestmentData => {
    // Current inventory investment (stock * cost) - Always overall, not filtered by period
    const currentInventory = items.reduce((sum, item) => {
      const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
      return sum + item.stock * (isNaN(cost) ? 0 : cost);
    }, 0);

    // Purchased amount from ALL transactions (items sold * cost) - Always overall, not filtered by period
    // This represents total investment in items that were sold
    let purchasedAmount = 0;

    transactions.forEach((tx) => {
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || 1;
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          purchasedAmount += (isNaN(cost) ? 0 : cost) * quantity;
        });
      } catch (e) {
        console.error('Error parsing transaction items:', e);
      }
    });

    // Total investment = Current inventory + All-time sales inventory
    return {
      currentInventory,
      purchasedAmount,
      totalInvestment: currentInventory + purchasedAmount,
    };
  };

  const calculateSales = (): SalesData => {
    const filteredTx = getFilteredTransactions();
    const revenue = filteredTx.reduce((sum, tx) => {
      const amount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const transactions = filteredTx.length;
    const averageOrderValue = transactions > 0 ? revenue / transactions : 0;

    let totalCost = 0;
    let totalProfit = 0;

    filteredTx.forEach((tx) => {
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || 1;
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
          const validCost = isNaN(cost) ? 0 : cost;
          const validPrice = isNaN(price) ? 0 : price;
          totalCost += validCost * quantity;
          totalProfit += (validPrice - validCost) * quantity;
        });
      } catch (e) {
        console.error('Error parsing transaction items:', e);
      }
    });

    const profitMargin = revenue > 0 ? (totalProfit / revenue) * 100 : 0;

    return {
      revenue,
      transactions,
      averageOrderValue,
      profit: totalProfit,
      profitMargin,
    };
  };

  const getTopSellingItems = (limit: number = 10): TopItem[] => {
    const filteredTx = getFilteredTransactions();
    const itemMap = new Map<string, { item: Item; quantity: number; revenue: number; cost: number }>();

    filteredTx.forEach((tx) => {
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || 1;
          const itemId = item.id;

          const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          const validPrice = isNaN(price) ? 0 : price;
          const validCost = isNaN(cost) ? 0 : cost;
          
          if (itemMap.has(itemId)) {
            const existing = itemMap.get(itemId)!;
            existing.quantity += quantity;
            existing.revenue += validPrice * quantity;
            existing.cost += validCost * quantity;
          } else {
            itemMap.set(itemId, {
              item,
              quantity,
              revenue: validPrice * quantity,
              cost: validCost * quantity,
            });
          }
        });
      } catch (e) {
        console.error('Error parsing transaction items:', e);
      }
    });

    return Array.from(itemMap.values())
      .map((data) => ({
        item: data.item,
        quantitySold: data.quantity,
        revenue: data.revenue,
        profit: data.revenue - data.cost,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);
  };

  const getCategoryPerformance = () => {
    const filteredTx = getFilteredTransactions();
    const categoryMap = new Map<string, { name: string; revenue: number; items: number; profit: number }>();

    filteredTx.forEach((tx) => {
      try {
        const cartItems = JSON.parse(tx.items_json);
        cartItems.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || 1;
          const categoryId = item.category_id;
          const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
          const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          const validPrice = isNaN(price) ? 0 : price;
          const validCost = isNaN(cost) ? 0 : cost;

          if (categoryId) {
            const category = categories.find((c) => c.id === categoryId);
            const categoryName = category?.name || 'Uncategorized';

            if (categoryMap.has(categoryName)) {
              const existing = categoryMap.get(categoryName)!;
              existing.revenue += validPrice * quantity;
              existing.items += quantity;
              existing.profit += (validPrice - validCost) * quantity;
            } else {
              categoryMap.set(categoryName, {
                name: categoryName,
                revenue: validPrice * quantity,
                items: quantity,
                profit: (validPrice - validCost) * quantity,
              });
            }
          }
        });
      } catch (e) {
        console.error('Error parsing transaction items:', e);
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);
  };

  const getPaymentMethodStats = () => {
    const filteredTx = getFilteredTransactions();
    const methodMap = new Map<string, { count: number; amount: number }>();

    filteredTx.forEach((tx) => {
      const method = tx.payment_method;
      const amount = typeof tx.total_amount === 'string' ? parseFloat(tx.total_amount) : tx.total_amount;
      const validAmount = isNaN(amount) ? 0 : amount;
      
      if (methodMap.has(method)) {
        const existing = methodMap.get(method)!;
        existing.count++;
        existing.amount += validAmount;
      } else {
        methodMap.set(method, { count: 1, amount: validAmount });
      }
    });

    return Array.from(methodMap.entries()).map(([method, data]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      ...data,
    }));
  };

  const getLowStockItems = () => {
    return items
      .filter((item) => item.stock <= 10 && item.stock > 0)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);
  };

  const getCategoryInventoryValue = () => {
    const categoryMap = new Map<string, { name: string; value: number; items: number }>();

    items.forEach((item) => {
      const categoryId = item.category_id;
      if (categoryId) {
        const category = categories.find((c) => c.id === categoryId);
        const categoryName = category?.name || 'Uncategorized';
        const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
        const itemValue = item.stock * (isNaN(cost) ? 0 : cost);

        if (categoryMap.has(categoryName)) {
          const existing = categoryMap.get(categoryName)!;
          existing.value += itemValue;
          existing.items += item.stock;
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            value: itemValue,
            items: item.stock,
          });
        }
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
  };

  const handleExportPDF = () => {
    const company = useCompanyStore.getState().getCompany();
    const investment = calculateInvestment();
    const sales = calculateSales();
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Business Report - ${period}</title>
          <style>
            @media print {
              @page { size: A4; margin: 15mm; }
            }
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .company-name { font-size: 18px; font-weight: bold; }
            .report-title { font-size: 16px; margin: 10px 0; }
            .section { margin: 20px 0; page-break-inside: avoid; }
            .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
            .stat-box { border: 1px solid #ddd; padding: 10px; text-align: center; }
            .stat-label { font-size: 10px; color: #666; }
            .stat-value { font-size: 16px; font-weight: bold; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${company.name || 'My Store'}</div>
            <div>${company.address || ''}</div>
            <div>${[company.city, company.state, company.pincode].filter(Boolean).join(', ')}</div>
            <div class="report-title">Business Report - ${period.charAt(0).toUpperCase() + period.slice(1)}</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Investment Analysis</div>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-label">Current Inventory</div>
                <div class="stat-value">${formatCurrency(investment.currentInventory)}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Sales Inventory</div>
                <div class="stat-value">${formatCurrency(investment.purchasedAmount)}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Total Investment</div>
                <div class="stat-value">${formatCurrency(investment.totalInvestment)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Sales Performance</div>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">${formatCurrency(sales.revenue)}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Total Profit</div>
                <div class="stat-value">${formatCurrency(sales.profit)}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Profit Margin</div>
                <div class="stat-value">${sales.profitMargin.toFixed(1)}%</div>
              </div>
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

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading-state">
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  const investment = calculateInvestment();
  const sales = calculateSales();
  const topItems = getTopSellingItems();
  const categoryPerformance = getCategoryPerformance();
  const paymentStats = getPaymentMethodStats();
  const lowStockItems = getLowStockItems();
  const categoryInventory = getCategoryInventoryValue();

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>📊 Business Reports</h1>
        <div className="header-actions">
          <button
            className="btn btn-icon"
            onClick={() => setShowPrices(!showPrices)}
            title={showPrices ? 'Hide prices' : 'Show prices'}
          >
            {showPrices ? '👁️' : '👁️‍🗨️'}
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} title="Export to PDF">
            📄 Export PDF
          </button>
          <div className="period-selector">
          <button
            className={`period-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Weekly
          </button>
          <button
            className={`period-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Monthly
          </button>
          <button
            className={`period-btn ${period === 'year' ? 'active' : ''}`}
            onClick={() => setPeriod('year')}
          >
            Yearly
          </button>
          <button
            className={`period-btn ${period === 'overall' ? 'active' : ''}`}
            onClick={() => setPeriod('overall')}
          >
            Overall
          </button>
          </div>
        </div>
      </div>

      {/* Investment Analysis */}
      <div className="report-section">
        <h2>💰 Investment Analysis</h2>
        <div className="investment-cards">
          <div className="stat-card investment">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-label">Current Inventory Investment</div>
              <div className="stat-value">
                {showPrices ? formatCurrency(investment.currentInventory) : '••••••'}
              </div>
              <div className="stat-description">
                {showPrices ? 'Stock value at cost price' : 'Click eye icon to view'}
              </div>
            </div>
          </div>
          <div className="stat-card investment">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <div className="stat-label">Sales Inventory (All-time)</div>
              <div className="stat-value">
                {showPrices ? formatCurrency(investment.purchasedAmount) : '••••••'}
              </div>
              <div className="stat-description">
                {showPrices ? 'Cost of items sold (qty × cost)' : 'Click eye icon to view'}
              </div>
            </div>
          </div>
          <div className="stat-card investment total">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <div className="stat-label">Total Investment</div>
              <div className="stat-value">
                {showPrices ? formatCurrency(investment.totalInvestment) : '••••••'}
              </div>
              <div className="stat-description">
                {showPrices ? 'Current + Sales inventory' : 'Click eye icon to view'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Performance */}
      <div className="report-section">
        <h2>📈 Sales Performance</h2>
        <div className="sales-cards">
          <div className="stat-card sales">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{formatCurrency(sales.revenue)}</div>
              <div className="stat-description">{sales.transactions} transactions</div>
            </div>
          </div>
          <div className="stat-card sales">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Average Order Value</div>
              <div className="stat-value">{formatCurrency(sales.averageOrderValue)}</div>
              <div className="stat-description">Per transaction</div>
            </div>
          </div>
          <div className="stat-card profit">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Total Profit</div>
              <div className="stat-value">
                {showPrices ? formatCurrency(sales.profit) : '••••••'}
              </div>
              <div className="stat-description">
                {showPrices ? `${sales.profitMargin.toFixed(1)}% margin` : 'Click eye icon to view'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="report-section">
        <h2>🏆 Top Selling Items</h2>
        <div className="card">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Code</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
                {showPrices && <th>Profit</th>}
              </tr>
            </thead>
            <tbody>
              {topItems.length > 0 ? (
                topItems.map((topItem) => (
                  <tr key={topItem.item.id}>
                    <td className="item-name">{topItem.item.name}</td>
                    <td>{topItem.item.code}</td>
                    <td>{topItem.quantitySold}</td>
                    <td>{formatCurrency(topItem.revenue)}</td>
                    {showPrices && (
                      <td className={topItem.profit >= 0 ? 'profit' : 'loss'}>
                        {formatCurrency(topItem.profit)}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showPrices ? 5 : 4} className="empty-state">
                    No sales data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Performance */}
      <div className="report-section">
        <h2>📁 Category Performance</h2>
        <div className="card">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Items Sold</th>
                <th>Revenue</th>
                {showPrices && <th>Profit</th>}
              </tr>
            </thead>
            <tbody>
              {categoryPerformance.length > 0 ? (
                categoryPerformance.map((cat, index) => (
                  <tr key={index}>
                    <td className="category-name">{cat.name}</td>
                    <td>{cat.items}</td>
                    <td>{formatCurrency(cat.revenue)}</td>
                    {showPrices && (
                      <td className={cat.profit >= 0 ? 'profit' : 'loss'}>
                        {formatCurrency(cat.profit)}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showPrices ? 4 : 3} className="empty-state">
                    No category sales data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="report-section">
        <h2>💳 Payment Method Analysis</h2>
        <div className="payment-methods-grid">
          {paymentStats.map((stat) => (
            <div key={stat.method} className="payment-card">
              <div className="payment-method">{stat.method}</div>
              <div className="payment-amount">{formatCurrency(stat.amount)}</div>
              <div className="payment-count">{stat.count} transactions</div>
              <div className="payment-percentage">
                {sales.revenue > 0 ? ((stat.amount / sales.revenue) * 100).toFixed(1) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Reports */}
      <div className="report-section">
        <h2>📦 Inventory Analysis</h2>
        <div className="inventory-grid">
          <div className="card">
            <h3>Category-wise Inventory Value</h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Stock Units</th>
                  {showPrices && <th>Value (at Cost)</th>}
                </tr>
              </thead>
              <tbody>
                {categoryInventory.length > 0 ? (
                  categoryInventory.map((cat, index) => (
                    <tr key={index}>
                      <td>{cat.name}</td>
                      <td>{cat.items}</td>
                      {showPrices && <td>{formatCurrency(cat.value)}</td>}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={showPrices ? 3 : 2} className="empty-state">
                      No inventory data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>⚠️ Low Stock Items</h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Code</th>
                  <th>Stock</th>
                  {showPrices && <th>Value</th>}
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.code}</td>
                      <td className="low-stock">{item.stock}</td>
                      {showPrices && (() => {
                        const cost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
                        return <td>{formatCurrency(item.stock * (isNaN(cost) ? 0 : cost))}</td>;
                      })()}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={showPrices ? 4 : 3} className="empty-state">
                      All items have sufficient stock
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

