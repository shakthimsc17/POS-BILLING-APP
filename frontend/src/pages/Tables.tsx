import { useState, useEffect } from 'react';
import { useTableStore } from '../store/tableStore';
import { Table } from '../types';
import TableOrderModal from '../components/TableOrderModal';
import './Tables.css';

interface TablesProps { }

export default function Tables({ }: TablesProps = {}) {
  const { tables, loadTables, createTable, updateTable, deleteTable, loading, loadTableOrders, tableOrders } = useTableStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [status, setStatus] = useState<'available' | 'occupied' | 'reserved'>('available');
  const [tablesWithOrders, setTablesWithOrders] = useState<any[]>([]);

  useEffect(() => {
    loadTables();
    loadTableOrders();
  }, [loadTables, loadTableOrders]);

  useEffect(() => {
    // Merge tables with their orders
    const merged = tables.map(table => {
      const order = tableOrders.find(o => o.table_id === table.id);
      return {
        ...table,
        transaction_id: order?.id || table.transaction_id,
        order_number: order?.id || undefined
      };
    });
    console.log('Merged tables with orders:', merged);
    setTablesWithOrders(merged);
  }, [tables, tableOrders]);

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setShowOrderModal(true);
  };

  const handleOrderCreated = () => {
    console.log('Order created, refreshing tables...');
    loadTables();
    // Also reload table orders to get the latest data
    loadTableOrders();
  };

  const handleAdd = () => {
    setEditingTable(null);
    setTableNumber('');
    setCapacity('4');
    setStatus('available');
    setShowAddModal(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setTableNumber(table.table_number);
    setCapacity(table.capacity.toString());
    setStatus(table.status);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!tableNumber.trim()) {
      alert('Please enter a table number');
      return;
    }

    try {
      if (editingTable) {
        await updateTable(editingTable.id, {
          table_number: tableNumber.trim(),
          capacity: parseInt(capacity),
          status,
        });
      } else {
        await createTable({
          table_number: tableNumber.trim(),
          capacity: parseInt(capacity),
          status,
        });
      }
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Failed to save table');
    }
  };

  const handleDelete = async (table: Table) => {
    if (!confirm(`Are you sure you want to delete Table ${table.table_number}?`)) {
      return;
    }

    try {
      await deleteTable(table.id);
    } catch (error: any) {
      alert(error.message || 'Failed to delete table');
    }
  };

  const resetForm = () => {
    setEditingTable(null);
    setTableNumber('');
    setCapacity('4');
    setStatus('available');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#27ae60';
      case 'occupied':
        return '#e74c3c';
      case 'reserved':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  if (loading && tables.length === 0) {
    return (
      <div className="tables">
        <div className="card">
          <p>Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tables">
      <div className="tables-header">
        <h1>🪑 Tables</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Table
        </button>
      </div>

      <div className="tables-grid">
        {tablesWithOrders.map((table) => {
          console.log('Rendering merged table:', table);
          return (
            <div
              key={table.id}
              className={`table-card ${table.status}`}
              onClick={() => handleTableClick(table)}
              style={{ borderColor: getStatusColor(table.status) }}
            >
              <div className="table-card-header">
                <h2>Table {table.table_number}</h2>
              </div>
              <div className="table-card-body">
                <div className="table-status-container">
                  <span className="table-status" style={{ background: getStatusColor(table.status) }}>
                    {table.status}
                  </span>
                </div>
                <p>Capacity: {table.capacity} seats</p>
              </div>
              <div className="table-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(table);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(table);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}


      </div>

      {
        tables.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <p>📭 No tables yet</p>
              <p className="empty-subtext">Add a table to get started</p>
              <button className="btn btn-primary" onClick={handleAdd}>
                + Add Table
              </button>
            </div>
          </div>
        )
      }

      {
        showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingTable ? 'Edit Table' : 'Add Table'}</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <label>
                  Table Number *
                  <input
                    type="text"
                    className="input"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g., 1, 2, A1, etc."
                  />
                </label>
                <label>
                  Capacity
                  <input
                    type="number"
                    className="input"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    min="1"
                    max="50"
                  />
                </label>
                <label>
                  Status
                  <select
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'available' | 'occupied' | 'reserved')}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )
      }

      <TableOrderModal
        isOpen={showOrderModal}
        table={selectedTable}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedTable(null);
        }}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
}
