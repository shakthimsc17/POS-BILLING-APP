import { useState, useEffect } from 'react';
import { useTableStore } from '../store/tableStore';
import { TableOrder } from '../types';
import { formatCurrency } from '../utils/formatters';
import { printReceipt } from '../utils/printer';
import './TableOrders.css';

interface TableOrdersProps {
  onNavigate?: (page: string) => void;
}

export default function TableOrders({ onNavigate }: TableOrdersProps = {}) {
  const { tableOrders, loadTableOrders, completeTableOrder, cancelTableOrder, loading } = useTableStore();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<TableOrder | null>(null);

  useEffect(() => {
    loadTableOrders(filterStatus === 'all' ? undefined : { status: filterStatus });
  }, [filterStatus, loadTableOrders]);

  const handleComplete = async (order: TableOrder) => {
    if (!confirm(`Complete order for Table ${order.table_number}?`)) return;

    const paymentMethod = prompt('Payment method (cash/card/upi):', 'cash');
    if (!paymentMethod || !['cash', 'card', 'upi'].includes(paymentMethod)) {
      alert('Invalid payment method');
      return;
    }

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

      alert('Order completed successfully!');
      loadTableOrders(filterStatus === 'all' ? undefined : { status: filterStatus });
    } catch (error: any) {
      alert(error.message || 'Failed to complete order');
    }
  };

  const handleCancel = async (order: TableOrder) => {
    if (!confirm(`Cancel order for Table ${order.table_number}?`)) return;

    try {
      await cancelTableOrder(order.id);
      alert('Order cancelled successfully!');
      loadTableOrders(filterStatus === 'all' ? undefined : { status: filterStatus });
    } catch (error: any) {
      alert(error.message || 'Failed to cancel order');
    }
  };

  const handlePrint = async (order: TableOrder) => {
    if (!order.transaction_id) {
      alert('Order not completed yet');
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
    } catch (error: any) {
      alert('Failed to print receipt');
    }
  };

  return (
    <div className="table-orders">
      <div className="table-orders-header">
        <h1>📋 Table Orders</h1>
        <div className="filter-controls">
          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading && tableOrders.length === 0 ? (
        <div className="card">
          <p>Loading orders...</p>
        </div>
      ) : tableOrders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>📭 No orders found</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-orders-list">
            {tableOrders.map((order) => {
              const items = JSON.parse(order.items_json);
              const total = typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : (order.total_amount || 0);

              return (
                <div key={order.id} className={`table-order-card ${order.status}`}>
                  <div className="table-order-header">
                    <div>
                      <h3>Table {order.table_number}</h3>
                      <p className="order-date">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`order-status ${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="table-order-body">
                    <p><strong>Items:</strong> {items.length}</p>
                    <p><strong>Total:</strong> {formatCurrency(total)}</p>
                    {order.payment_method && (
                      <p><strong>Payment:</strong> {order.payment_method.toUpperCase()}</p>
                    )}
                  </div>
                  <div className="table-order-actions">
                    {order.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleComplete(order)}
                        >
                          Complete
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(order)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'completed' && order.transaction_id && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePrint(order)}
                      >
                        Print Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
