import { useState, useEffect } from 'react';
import { CashFlowEntry, CashFlowSummary, CashFlowCategory, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import { storageService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import CategorySelector from '../components/CategorySelector';
import AddCashFlowEntryForm from '../components/AddCashFlowEntryForm';
import './CashFlow.css';

export default function CashFlow() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary>({ 
    total_income: 0, 
    total_sales: 0, 
    manual_income: 0, 
    total_expense: 0, 
    net_cash_flow: 0 
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CashFlowCategory | null>(null);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('income');
  const [stockInvestment, setStockInvestment] = useState(0);

  useEffect(() => {
    loadData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday.toISOString(),
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          startDate: weekStart.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: monthStart.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return {
          startDate: yearStart.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'custom':
        return {
          startDate: customStartDate ? new Date(customStartDate).toISOString() : undefined,
          endDate: customEndDate ? new Date(customEndDate + 'T23:59:59').toISOString() : undefined,
        };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const [entriesData, summaryData, stockInvestmentData] = await Promise.all([
        storageService.getCashFlowEntries({ startDate, endDate }),
        storageService.getCashFlowSummary({ startDate, endDate }),
        storageService.getStockInvestment(),
      ]);
      setEntries(entriesData);
      setStockInvestment(stockInvestmentData.total_investment);
      
      // Net Cash Flow for selected day/range: profit + manual income - expense
      // Income/Expense cards use filtered data
      const dayProfit = summaryData.total_profit || 0;
      const dayManualIncome = summaryData.manual_income || 0;
      const dayExpense = summaryData.total_expense || 0;
      const dayNetFlow = dayProfit + dayManualIncome - dayExpense;
      
      // Income = Profit + Manual Income (not Total Sales + Manual Income)
      const totalIncome = dayProfit + dayManualIncome;
      
      setSummary({
        total_income: totalIncome,
        total_sales: summaryData.total_sales || 0,
        manual_income: summaryData.manual_income || 0,
        total_expense: summaryData.total_expense,
        total_profit: dayProfit,
        net_cash_flow: dayNetFlow, // Use day-specific calculation
      });
    } catch (error) {
      console.error('Error loading cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (data: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description?: string;
    entry_date: string;
  }) => {
    try {
      await storageService.addCashFlowEntry(data);
      await loadData();
      setShowEntryForm(false);
      setSelectedCategory(null);
      
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = `${data.type === 'income' ? 'Income' : 'Expense'} entry added successfully`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (error: any) {
      console.error('Error adding entry:', error);
      alert(error.message || 'Failed to add entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await storageService.deleteCashFlowEntry(id);
      await loadData();
      
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = 'Entry deleted successfully';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      alert(error.message || 'Failed to delete entry');
    }
  };

  const handleIncomeClick = () => {
    setSelectedType('income');
    setShowCategorySelector(true);
  };

  const handleExpenseClick = () => {
    setSelectedType('expense');
    setShowCategorySelector(true);
  };

  const handleCategorySelect = (category: CashFlowCategory) => {
    setSelectedCategory(category);
    setShowCategorySelector(false);
    setShowEntryForm(true);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    let suffix = '';
    if (isToday) suffix = ' (Today)';
    else if (isYesterday) suffix = ' (Yesterday)';
    
    return `${day}-${month}-${year}${suffix}`;
  };

  const getCategoryIcon = (categoryName: string, type: 'income' | 'expense'): string => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || '📋';
  };

  const groupEntriesByDate = () => {
    const grouped: Record<string, CashFlowEntry[]> = {};
    
    entries.forEach(entry => {
      if (filter !== 'all' && entry.type !== filter) return;
      
      const date = new Date(entry.entry_date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()),
      }));
  };

  const getDayTotals = (entries: CashFlowEntry[]) => {
    const income = entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const expense = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { income, expense };
  };

  const getDateRangeText = () => {
    const { startDate, endDate } = getDateRange();
    if (!startDate || !endDate) return 'Select Date Range';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (dateRange === 'today') {
      return `Today : ${start.getDate()} ${start.toLocaleString('default', { month: 'short' })}`;
    } else if (dateRange === 'yesterday') {
      return `Yesterday : ${start.getDate()} ${start.toLocaleString('default', { month: 'short' })}`;
    } else {
      return `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })} ${end.getFullYear()}`;
    }
  };

  const navigateDateRange = (direction: 'prev' | 'next') => {
    if (dateRange === 'custom') {
      // For custom range, adjust the dates
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diff = end.getTime() - start.getTime();
        
        if (direction === 'prev') {
          const newStart = new Date(start.getTime() - diff);
          const newEnd = new Date(start.getTime() - 1);
          setCustomStartDate(newStart.toISOString().split('T')[0]);
          setCustomEndDate(newEnd.toISOString().split('T')[0]);
        } else {
          const newStart = new Date(end.getTime() + 1);
          const newEnd = new Date(end.getTime() + diff);
          setCustomStartDate(newStart.toISOString().split('T')[0]);
          setCustomEndDate(newEnd.toISOString().split('T')[0]);
        }
      }
    } else {
      // For predefined ranges, just reload (they're relative to today)
      loadData();
    }
  };

  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => e.type === filter);

  const groupedEntries = groupEntriesByDate();

  if (loading) {
    return (
      <div className="cash-flow-page">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="cash-flow-page">
      <div className="cash-flow-header">
        <h1>Cash Flow</h1>
      </div>

      <div className="date-range-selector">
        <button className="date-nav-btn" onClick={() => navigateDateRange('prev')}>←</button>
        <div className="date-range-display">
          <span className="calendar-icon">📅</span>
          <select
            className="date-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <span className="date-range-text">{getDateRangeText()}</span>
        </div>
        <button className="date-nav-btn" onClick={() => navigateDateRange('next')}>→</button>
      </div>

      {dateRange === 'custom' && (
        <div className="custom-date-range">
          <div className="custom-date-field">
            <label>Start Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
          </div>
          <div className="custom-date-field">
            <label>End Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="summary-section">
        <div className="net-cash-flow-card">
          <div className="net-cash-flow-label">Net Cash Flow</div>
          <div className={`net-cash-flow-amount ${summary.net_cash_flow >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(summary.net_cash_flow)}
          </div>
          <div className="net-cash-flow-hint">(Day Profit + Manual Income - Day Expense)</div>
          <div className="net-cash-flow-description">
            Shows net cash flow for the selected period. Profit is calculated from sales transactions.
          </div>
        </div>
        <div className="summary-cards-row">
          <div className="summary-card income">
            <div className="summary-card-label">Income</div>
            <div className="summary-card-amount income">{formatCurrency(summary.total_income)}</div>
            <div className="income-breakdown">
              <div className="income-item">
                <span>Profit:</span>
                <span className="income-profit">{formatCurrency(summary.total_profit || 0)}</span>
              </div>
              <div className="income-item">
                <span>Manual Income:</span>
                <span className="income-manual">{formatCurrency(summary.manual_income)}</span>
              </div>
            </div>
          </div>
          <div className="summary-card expense">
            <div className="summary-card-label">Expense</div>
            <div className="summary-card-amount expense">{formatCurrency(summary.total_expense)}</div>
            <div className="expense-breakdown">
              <div className="expense-item">
                <span>Manual Expenses:</span>
                <span>{formatCurrency(summary.total_expense)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
          onClick={() => setFilter('income')}
        >
          Income
        </button>
        <button
          className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
          onClick={() => setFilter('expense')}
        >
          Expense
        </button>
      </div>

      <div className="transactions-section">
        {groupedEntries.length === 0 ? (
          <div className="empty-state">
            <p>No {filter === 'all' ? 'Expense/Income' : filter} Entries for</p>
            <p>Click on + Button to add</p>
          </div>
        ) : (
          <div className="transaction-tree">
            {groupedEntries.map(({ date, entries }) => {
              const dayTotals = getDayTotals(entries);
              return (
                <div key={date} className="transaction-day-group">
                  <div className="day-header">
                    <span className="day-date">{formatDate(date)}</span>
                    <div className="day-totals">
                      {dayTotals.income > 0 && (
                        <span className="day-total income">+ {formatCurrency(dayTotals.income)}</span>
                      )}
                      {dayTotals.expense > 0 && (
                        <span className="day-total expense">- {formatCurrency(dayTotals.expense)}</span>
                      )}
                    </div>
                  </div>
                  <div className="day-entries">
                    {entries.map((entry) => {
                      const icon = getCategoryIcon(entry.category, entry.type);
                      return (
                        <div key={entry.id} className="transaction-entry">
                          <div className="entry-icon">{icon}</div>
                          <div className="entry-details">
                            <div className="entry-category">{entry.category}</div>
                            {entry.description && (
                              <div className="entry-description">{entry.description}</div>
                            )}
                          </div>
                          <div className="entry-actions">
                            <div className={`entry-amount ${entry.type}`}>
                              {entry.type === 'income' ? '+' : '-'} {formatCurrency(Number(entry.amount))}
                            </div>
                            <button
                              className="entry-delete-btn"
                              onClick={() => handleDeleteEntry(entry.id)}
                              title="Delete entry"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="action-btn income-btn" onClick={handleIncomeClick}>
          <span className="action-icon">+</span>
          <span className="action-text">Income</span>
        </button>
        <button className="action-btn expense-btn" onClick={handleExpenseClick}>
          <span className="action-icon">-</span>
          <span className="action-text">Expense</span>
        </button>
      </div>

      {showCategorySelector && (
        <CategorySelector
          type={selectedType}
          onSelectCategory={handleCategorySelect}
          onClose={() => setShowCategorySelector(false)}
        />
      )}

      {showEntryForm && selectedCategory && (
        <AddCashFlowEntryForm
          category={selectedCategory}
          onClose={() => {
            setShowEntryForm(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleAddEntry}
        />
      )}
    </div>
  );
}

