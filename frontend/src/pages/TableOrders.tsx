import { useState, useEffect } from 'react';
import { useTableStore } from '../store/tableStore';
import { TableOrder } from '../types';
import { formatCurrency } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import { toast } from '../utils/toast';
import './TableOrders.css';

export default function TableOrders() {
  const { tableOrders, loadTableOrders, completeTableOrder, cancelTableOrder, loading } = useTableStore();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [filterDateType, setFilterDateType] = useState<'all' | 'date' | 'week' | 'month' | 'year'>('date');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filteredOrders, setFilteredOrders] = useState<TableOrder[]>([]);

  useEffect(() => {
    loadTableOrders(filterStatus === 'all' ? undefined : { status: filterStatus });
  }, [filterStatus, loadTableOrders]);

  // Apply date filters
  useEffect(() => {
    let filtered = [...tableOrders];

    if (filterDateType === 'date' && filterDate) {
      const selectedDate = new Date(filterDate);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= selectedDate && orderDate < nextDay;
      });
    } else if (filterDateType === 'week' && filterDate) {
      const selectedDate = new Date(filterDate);
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startOfWeek && orderDate < endOfWeek;
      });
    } else if (filterDateType === 'month' && filterDate) {
      const selectedDate = new Date(filterDate);
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startOfMonth && orderDate < endOfMonth;
      });
    } else if (filterDateType === 'year' && filterDate) {
      const selectedDate = new Date(filterDate);
      const startOfYear = new Date(selectedDate.getFullYear(), 0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      const endOfYear = new Date(selectedDate.getFullYear() + 1, 0, 1);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startOfYear && orderDate < endOfYear;
      });
    }

    setFilteredOrders(filtered);
  }, [tableOrders, filterDateType, filterDate]);

  const handleComplete = async (order: TableOrder) => {
    const paymentMethod = 'cash'; // Default to cash, can be enhanced later

    try {
      const result = await completeTableOrder(order.id, {
        payment_method: paymentMethod as 'cash' | 'card' | 'upi',
      });

      // Print receipt (use setting for auto-print)
      try {
        const items = JSON.parse(order.items_json);
        const { receiptSettings } = await import('../utils/receiptSettings');
        const autoPrint = await receiptSettings.getAutoPrint();
        await printReceipt({
          items,
          transaction: result.transaction,
          autoPrint,
        });
      } catch (printError) {
        console.error('Print error:', printError);
      }

      toast.success('Order completed successfully!');
      loadTableOrders(filterStatus === 'all' ? undefined : { status: filterStatus });
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete order');
    }
  };

  const handleCancel = async (order: TableOrder) => {
    try {
      await cancelTableOrder(order.id);
      toast.success('Order cancelled successfully!');
      loadTableOrders(filterStatus === 'all' ? undefined : { status: filterStatus });
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    }
  };

  const handlePrint = async (order: TableOrder) => {
    if (!order.transaction_id) {
      toast.error('Order not completed yet');
      return;
    }

    try {
      const items = JSON.parse(order.items_json);
      // Create a mock transaction for printing
      const transaction = {
        id: order.transaction_id,
        customer_id: order.customer_id,
        total_amount: order.total_amount || 0,
        payment_method: order.payment_method || 'cash',
        received_amount: order.total_amount || 0,
        change_amount: 0,
        items_json: order.items_json,
        created_at: order.created_at,
      };
      await printReceipt({ items, transaction });
      toast.success('Receipt printed successfully!');
    } catch (error: any) {
      toast.error('Failed to print receipt');
    }
  };

  return (
    <div className="table-orders">
      <div className="table-orders-header">
        <div className="header-title">
          <h1>🍽️ Table Orders</h1>
          <div className="stats-summary">
            <div className="stat-card pending">
              <span className="stat-number">{filteredOrders.filter(o => o.status === 'pending').length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card completed">
              <span className="stat-number">{filteredOrders.filter(o => o.status === 'completed').length}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card cancelled">
              <span className="stat-number">{filteredOrders.filter(o => o.status === 'cancelled').length}</span>
              <span className="stat-label">Cancelled</span>
            </div>
          </div>
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="modern-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">📋 All Orders</option>
              <option value="pending">⏳ Pending</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <select
              className="modern-select"
              value={filterDateType}
              onChange={(e) => {
                setFilterDateType(e.target.value as any);
                if (e.target.value === 'all') {
                  setFilterDate('');
                } else if (!filterDate) {
                  // Set default date to today if not set
                  const today = new Date().toISOString().split('T')[0];
                  setFilterDate(today);
                }
              }}
            >
              <option value="all">📅 All Dates</option>
              <option value="date">📆 Date</option>
              <option value="week">📅 Week</option>
              <option value="month">📅 Month</option>
              <option value="year">📅 Year</option>
            </select>
          </div>
          {filterDateType !== 'all' && (
            <div className="filter-group">
              <label className="filter-label">{filterDateType === 'year' ? 'Year' : 'Select Date'}</label>
              {filterDateType === 'year' ? (
                <input
                  type="number"
                  className="modern-input"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="Year (e.g., 2026)"
                  min="2020"
                  max="2100"
                />
              ) : (
                <input
                  type={filterDateType === 'month' ? 'month' : 'date'}
                  className="modern-input"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {loading && tableOrders.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-icon">📭</div>
          <h2>No orders found</h2>
          <p>Try adjusting your filters or check back later for new orders.</p>
        </div>
      ) : (
        <div className="table-orders-table-container">
          <table className="table-orders-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date & Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const items = JSON.parse(order.items_json);
                const total = typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : (order.total_amount || 0);
                
                return (
                  <tr key={order.id} className={`table-row ${order.status}`}>
                    <td className="table-cell">
                      <div className="table-number">
                        <span className="table-icon">🍽️</span>
                        <span className="table-num">{order.table_number}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${order.status}`}>
                        {order.status === 'pending' && '⏳ Pending'}
                        {order.status === 'completed' && '✅ Completed'}
                        {order.status === 'cancelled' && '❌ Cancelled'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="items-count">
                        <span className="items-number">{items.length}</span>
                        <span className="items-label">items</span>
                      </div>
                    </td>
                    <td className="table-cell amount-cell">
                      <span className="amount">{formatCurrency(total)}</span>
                    </td>
                    <td className="table-cell">
                      {order.payment_method ? (
                        <div className="payment-method">
                          {order.payment_method === 'cash' && '💵 Cash'}
                          {order.payment_method === 'card' && '💳 Card'}
                          {order.payment_method === 'upi' && '📱 UPI'}
                        </div>
                      ) : (
                        <span className="no-payment">-</span>
                      )}
                    </td>
                    <td className="table-cell date-cell">
                      <div className="date-info">
                        <span className="date">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="time">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="table-cell actions-cell">
                      <div className="action-buttons">
                        {order.status === 'pending' && (
                          <>
                            <button
                              className="action-btn complete-btn"
                              onClick={() => handleComplete(order)}
                              title="Complete Order"
                            >
                              ✅
                            </button>
                            <button
                              className="action-btn cancel-btn"
                              onClick={() => handleCancel(order)}
                              title="Cancel Order"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        {order.status === 'completed' && order.transaction_id && (
                          <button
                            className="action-btn print-btn"
                            onClick={() => handlePrint(order)}
                            title="Print Receipt"
                          >
                            🖨️
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
      )}
    </div>
  );
}
