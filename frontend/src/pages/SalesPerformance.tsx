import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { storageService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { usePermissions } from '../hooks/usePermissions';
import AccessDenied from '../components/AccessDenied';
import './SalesPerformance.css';

type Period = '7days' | 'week' | 'month' | 'year' | 'overall';

interface SalesDataPoint {
  date: string;
  sales: number;
  profit: number;
  count: number;
}

interface ProfitData {
  total_profit: number;
  total_sales: number;
  total_cost: number;
  profit_margin: number;
}

const COLORS = ['#3498db', '#27ae60', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];

export default function SalesPerformance() {
  const { canViewProfit } = usePermissions();
  const [salesPeriod, setSalesPeriod] = useState<Period>('7days');
  const [profitPeriod, setProfitPeriod] = useState<Period>('7days');
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [hourlyDate, setHourlyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState<number>(8);
  const [endHour, setEndHour] = useState<number>(22);
  const [loading, setLoading] = useState(true);

  // Check if user can view profit data - moved after hooks
  if (!canViewProfit('sales-performance')) {
    return <AccessDenied />;
  }

  useEffect(() => {
    loadAllData();
  }, [salesPeriod, profitPeriod]);

  useEffect(() => {
    loadHourlyData();
  }, [hourlyDate, startHour, endHour]);

  const loadHourlyData = async () => {
    try {
      const data = await storageService.getHourlySalesData(hourlyDate, startHour, endHour);
      setHourlyData(data || []);
    } catch (error: any) {
      console.error('Error loading hourly data:', error);
      setHourlyData([]);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sales, profit, items, payments] = await Promise.all([
        storageService.getSalesData(salesPeriod),
        storageService.getProfitData(profitPeriod),
        storageService.getTopItems(salesPeriod, 10),
        storageService.getPaymentMethodsData(salesPeriod),
      ]);
      
      // Ensure sales data has proper structure
      const processedSales = (sales || []).map((item: any) => ({
        date: item.date || '',
        sales: typeof item.sales === 'number' ? item.sales : parseFloat(item.sales || 0),
        profit: typeof item.profit === 'number' ? item.profit : parseFloat(item.profit || 0),
        count: typeof item.count === 'number' ? item.count : parseInt(item.count || 0),
      })).filter((item: any) => item.date); // Filter out items without dates
      
      console.log('Sales data received:', sales);
      console.log('Processed sales data:', processedSales);
      
      setSalesData(processedSales);
      setProfitData(profit || null);
      setTopItems(items || []);
      setPaymentMethods(payments || []);
    } catch (error: any) {
      console.error('Error loading performance data:', error);
      console.error('Error details:', error);
      // Don't show alert, just log and set empty data
      setSalesData([]);
      setProfitData(null);
      setTopItems([]);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string, period: Period): string => {
    if (!dateStr) return '';
    try {
      if (period === 'year' || period === 'overall') {
        return dateStr;
      } else if (period === 'month') {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return `${date.getDate()}/${date.getMonth() + 1}`;
      } else {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }
    } catch (e) {
      return dateStr;
    }
  };

  const getPeriodLabel = (period: Period): string => {
    switch (period) {
      case '7days': return 'Last 7 Days';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'overall': return 'All Time';
      default: return period;
    }
  };

  if (loading) {
    return (
      <div className="sales-performance">
        <div className="loading-state">Loading performance data...</div>
      </div>
    );
  }

  return (
    <div className="sales-performance">
      <div className="performance-header">
        <h1>Sales Performance</h1>
      </div>

      {/* Sales Report Section */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Sales Report</h2>
          <div className="period-selector">
            {(['7days', 'week', 'month', 'year', 'overall'] as Period[]).map((period) => (
              <button
                key={period}
                className={`period-btn ${salesPeriod === period ? 'active' : ''}`}
                onClick={() => setSalesPeriod(period)}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value, salesPeriod)}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${formatDate(label, salesPeriod)}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3498db" 
                  strokeWidth={2}
                  name="Sales"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#27ae60" 
                  strokeWidth={2}
                  name="Net Profit"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-chart-data">No sales data available for this period</div>
          )}
        </div>
      </div>

      {/* Profit Data Section */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Profit Analysis</h2>
          <div className="period-selector">
            {(['7days', 'week', 'month', 'year', 'overall'] as Period[]).map((period) => (
              <button
                key={period}
                className={`period-btn ${profitPeriod === period ? 'active' : ''}`}
                onClick={() => setProfitPeriod(period)}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>
        {profitData && (
          <div className="profit-summary">
            <div className="profit-card">
              <div className="profit-label">Net Profit</div>
              <div className="profit-value positive">
                {formatCurrency(profitData.total_profit || 0)}
              </div>
              <div className="profit-subtext">
                Net Profit: grossProfit - loss - billDiscount
              </div>
            </div>
            <div className="profit-card">
              <div className="profit-label">Total Sales</div>
              <div className="profit-value">{formatCurrency(profitData.total_sales || 0)}</div>
            </div>
            <div className="profit-card">
              <div className="profit-label">Total Cost</div>
              <div className="profit-value">{formatCurrency(profitData.total_cost || 0)}</div>
            </div>
            <div className="profit-card">
              <div className="profit-label">Profit Margin</div>
              <div className="profit-value">
                {profitData.profit_margin != null && !isNaN(profitData.profit_margin) 
                  ? profitData.profit_margin.toFixed(2) 
                  : '0.00'}%
              </div>
            </div>
          </div>
        )}
        <div className="chart-container">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value, profitPeriod)}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${formatDate(label, profitPeriod)}`}
                />
                <Legend />
                <Bar dataKey="profit" fill="#27ae60" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-chart-data">No profit data available for this period</div>
          )}
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Top Selling Items</h2>
        </div>
        <div className="chart-container">
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value: any) => value} />
                <Legend />
                <Bar dataKey="quantity" fill="#3498db" name="Quantity" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-chart-data">No top items data available</div>
          )}
        </div>
        <div className="top-items-list">
          {topItems.map((item, index) => (
            <div key={item.id} className="top-item-card">
              <div className="item-rank">#{index + 1}</div>
              <div className="item-details">
                <div className="item-name">{item.name}</div>
                <div className="item-stats">
                  <span>Qty: {item.quantity}</span>
                  <span>Revenue: {formatCurrency(item.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <div className="chart-section">
          <div className="chart-header">
            <h2>Sales by Payment Method</h2>
          </div>
          <div className="chart-container">
            {paymentMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, percent }) => percent != null && !isNaN(percent) ? `${method} ${(percent * 100).toFixed(0)}%` : method}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="method"
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-chart-data">No payment method data available</div>
            )}
          </div>
        </div>
      )}

      {/* Sales vs Profit Comparison */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Sales vs Profit Comparison</h2>
        </div>
        <div className="chart-container">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value, salesPeriod)}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${formatDate(label, salesPeriod)}`}
                />
                <Legend />
                <Bar dataKey="sales" fill="#3498db" name="Sales" />
                <Bar dataKey="profit" fill="#27ae60" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-chart-data">No comparison data available</div>
          )}
        </div>
      </div>

      {/* Hourly Sales Progress */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Hourly Sales Progress</h2>
          <div className="hourly-filters">
            <div className="date-filter-group" style={{ display: 'flex', visibility: 'visible' }}>
              <label style={{ display: 'block', visibility: 'visible' }}>Date:</label>
              <input
                type="date"
                value={hourlyDate}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHourlyDate(e.target.value);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="date-input"
                style={{ display: 'block', visibility: 'visible', opacity: 1 }}
              />
            </div>
            <div className="time-filter-group">
              <label>From:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStartHour(parseInt(e.target.value) || 8);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="hour-input"
              />
              <span>:</span>
              <span className="time-label">00</span>
            </div>
            <div className="time-filter-group">
              <label>To:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={endHour}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEndHour(parseInt(e.target.value) || 22);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="hour-input"
              />
              <span>:</span>
              <span className="time-label">00</span>
            </div>
          </div>
        </div>
        <div className="chart-container">
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hourLabel" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `Hour: ${label}`}
                />
                <Legend />
                <Bar dataKey="sales" fill="#3498db" name="Sales" />
                <Bar dataKey="profit" fill="#27ae60" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-chart-data">No hourly sales data available for selected date</div>
          )}
        </div>
        {hourlyData.length > 0 && (
          <div className="hourly-summary">
            <div className="summary-item">
              <span className="summary-label">Total Sales:</span>
              <span className="summary-value">
                {formatCurrency(hourlyData.reduce((sum, item) => sum + item.sales, 0))}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Net Profit:</span>
              <span className="summary-value positive">
                {formatCurrency(hourlyData.reduce((sum, item) => sum + item.profit, 0))}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Transactions:</span>
              <span className="summary-value">
                {hourlyData.reduce((sum, item) => sum + item.count, 0)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Peak Hour:</span>
              <span className="summary-value">
                {hourlyData.reduce((max, item) => item.sales > max.sales ? item : max, hourlyData[0])?.hourLabel || 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

