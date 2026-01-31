import { create } from 'zustand';
import { Table, TableOrder } from '../types';
import { storageService } from '../services/storage';

interface TableStore {
  tables: Table[];
  tableOrders: TableOrder[];
  loading: boolean;
  error: string | null;
  loadTables: () => Promise<void>;
  loadTablesByStatus: (status: 'available' | 'occupied' | 'reserved') => Promise<void>;
  createTable: (table: Omit<Table, 'id' | 'customer_id' | 'created_at' | 'updated_at'>) => Promise<Table>;
  updateTable: (id: string, updates: Partial<Table>) => Promise<Table>;
  deleteTable: (id: string) => Promise<void>;
  loadTableOrders: (filters?: { status?: string; tableId?: string }) => Promise<void>;
  loadTableOrder: (id: string) => Promise<TableOrder>;
  getActiveTableOrder: (tableId: string) => Promise<TableOrder | null>;
  createTableOrder: (order: Omit<TableOrder, 'id' | 'customer_id' | 'created_at' | 'updated_at' | 'status' | 'transaction_id'>) => Promise<TableOrder>;
  updateTableOrder: (id: string, updates: Partial<TableOrder>) => Promise<TableOrder>;
  completeTableOrder: (id: string, data: { payment_method: 'cash' | 'card' | 'upi'; received_amount?: number; sales_customer_id?: string }) => Promise<{ message: string; transaction: any }>;
  cancelTableOrder: (id: string) => Promise<void>;
}

export const useTableStore = create<TableStore>((set, get) => ({
  tables: [],
  tableOrders: [],
  loading: false,
  error: null,

  loadTables: async () => {
    try {
      set({ loading: true, error: null });
      const tables = await storageService.getTables();
      set({ tables, loading: false });
    } catch (error: any) {
      console.error('Error loading tables:', error);
      set({ error: error.message || 'Failed to load tables', loading: false });
    }
  },

  loadTablesByStatus: async (status: 'available' | 'occupied' | 'reserved') => {
    try {
      set({ loading: true, error: null });
      const tables = await storageService.getTablesByStatus(status);
      set({ tables, loading: false });
    } catch (error: any) {
      console.error('Error loading tables by status:', error);
      set({ error: error.message || 'Failed to load tables', loading: false });
    }
  },

  createTable: async (table) => {
    try {
      set({ loading: true, error: null });
      const newTable = await storageService.addTable(table);
      set((state) => ({
        tables: [...state.tables, newTable].sort((a, b) => a.table_number.localeCompare(b.table_number)),
        loading: false,
      }));
      return newTable;
    } catch (error: any) {
      console.error('Error creating table:', error);
      set({ error: error.message || 'Failed to create table', loading: false });
      throw error;
    }
  },

  updateTable: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedTable = await storageService.updateTable(id, updates);
      set((state) => ({
        tables: state.tables.map((t) => (t.id === id ? updatedTable : t)).sort((a, b) => a.table_number.localeCompare(b.table_number)),
        loading: false,
      }));
      return updatedTable;
    } catch (error: any) {
      console.error('Error updating table:', error);
      set({ error: error.message || 'Failed to update table', loading: false });
      throw error;
    }
  },

  deleteTable: async (id) => {
    try {
      set({ loading: true, error: null });
      await storageService.deleteTable(id);
      set((state) => ({
        tables: state.tables.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error deleting table:', error);
      set({ error: error.message || 'Failed to delete table', loading: false });
      throw error;
    }
  },

  loadTableOrders: async (filters) => {
    try {
      set({ loading: true, error: null });
      const orders = await storageService.getTableOrders(filters);
      set({ tableOrders: orders, loading: false });
    } catch (error: any) {
      console.error('Error loading table orders:', error);
      set({ error: error.message || 'Failed to load table orders', loading: false });
    }
  },

  loadTableOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      const order = await storageService.getTableOrder(id);
      set((state) => {
        const existingIndex = state.tableOrders.findIndex((o) => o.id === id);
        const updatedOrders = existingIndex >= 0
          ? state.tableOrders.map((o) => (o.id === id ? order : o))
          : [...state.tableOrders, order];
        return { tableOrders: updatedOrders, loading: false };
      });
      return order;
    } catch (error: any) {
      console.error('Error loading table order:', error);
      set({ error: error.message || 'Failed to load table order', loading: false });
      throw error;
    }
  },

  getActiveTableOrder: async (tableId) => {
    try {
      return await storageService.getActiveTableOrder(tableId);
    } catch (error: any) {
      console.error('Error getting active table order:', error);
      return null;
    }
  },

  createTableOrder: async (order) => {
    try {
      set({ loading: true, error: null });
      const newOrder = await storageService.createTableOrder(order);
      set((state) => ({
        tableOrders: [newOrder, ...state.tableOrders],
        loading: false,
      }));
      // Reload tables to update status
      await get().loadTables();
      return newOrder;
    } catch (error: any) {
      console.error('Error creating table order:', error);
      set({ error: error.message || 'Failed to create table order', loading: false });
      throw error;
    }
  },

  updateTableOrder: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedOrder = await storageService.updateTableOrder(id, updates);
      set((state) => ({
        tableOrders: state.tableOrders.map((o) => (o.id === id ? updatedOrder : o)),
        loading: false,
      }));
      return updatedOrder;
    } catch (error: any) {
      console.error('Error updating table order:', error);
      set({ error: error.message || 'Failed to update table order', loading: false });
      throw error;
    }
  },

  completeTableOrder: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const result = await storageService.completeTableOrder(id, data);
      set((state) => ({
        tableOrders: state.tableOrders.map((o) =>
          o.id === id ? { ...o, status: 'completed' as const, transaction_id: result.transaction.id } : o
        ),
        loading: false,
      }));
      // Reload tables to update status
      await get().loadTables();
      return result;
    } catch (error: any) {
      console.error('Error completing table order:', error);
      set({ error: error.message || 'Failed to complete table order', loading: false });
      throw error;
    }
  },

  cancelTableOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      await storageService.cancelTableOrder(id);
      set((state) => ({
        tableOrders: state.tableOrders.map((o) =>
          o.id === id ? { ...o, status: 'cancelled' as const } : o
        ),
        loading: false,
      }));
      // Reload tables to update status
      await get().loadTables();
    } catch (error: any) {
      console.error('Error cancelling table order:', error);
      set({ error: error.message || 'Failed to cancel table order', loading: false });
      throw error;
    }
  },
}));
