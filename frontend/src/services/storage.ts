import { Category, Item, Transaction, Customer, Company, ItemCodePrefix, ActivityLog, Settings, SalesCustomer } from '../types';
import apiClient from '../lib/apiClient';

export const storageService = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/categories');
  },

  addCategory: async (category: Omit<Category, 'id' | 'created_at' | 'customer_id'>): Promise<Category> => {
    return apiClient.post<Category>('/categories', category);
  },

  updateCategory: async (id: string, updates: Partial<Category>): Promise<void> => {
    await apiClient.put(`/categories/${id}`, updates);
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  deleteAllCategories: async (): Promise<{ message: string; count: number }> => {
    return apiClient.delete<{ message: string; count: number }>('/categories');
  },

  // Items
  getItems: async (): Promise<Item[]> => {
    return apiClient.get<Item[]>('/items');
  },

  addItem: async (item: Omit<Item, 'id' | 'created_at' | 'customer_id'>): Promise<Item> => {
    return apiClient.post<Item>('/items', item);
  },

  updateItem: async (id: string, updates: Partial<Item>): Promise<void> => {
    await apiClient.put(`/items/${id}`, updates);
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },

  deleteAllItems: async (): Promise<{ message: string; count: number }> => {
    return apiClient.delete<{ message: string; count: number }>('/items');
  },

  searchItems: async (query: string): Promise<Item[]> => {
    return apiClient.get<Item[]>(`/items/search?q=${encodeURIComponent(query)}`);
  },

  getItemByBarcode: async (barcode: string): Promise<Item | null> => {
    try {
      return await apiClient.get<Item>(`/items/barcode/${encodeURIComponent(barcode)}`);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  getItemsByCategories: async (categoryIds: string): Promise<Item[]> => {
    return apiClient.get<Item[]>(`/items/by-categories?categoryIds=${encodeURIComponent(categoryIds)}`);
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    return apiClient.get<Transaction[]>('/transactions');
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'created_at' | 'customer_id'>): Promise<Transaction> => {
    return apiClient.post<Transaction>('/transactions', transaction);
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    return apiClient.get<Customer[]>('/customers');
  },

  addCustomer: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'password_hash'>): Promise<Customer> => {
    return apiClient.post<Customer>('/customers', customer);
  },

  updateCustomer: async (id: string, updates: Partial<Customer>): Promise<void> => {
    await apiClient.put(`/customers/${id}`, updates);
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  // Company
  getCompany: async (): Promise<Company> => {
    return apiClient.get<Company>('/company');
  },

  saveCompany: async (company: Partial<Company>): Promise<Company> => {
    return apiClient.post<Company>('/company', company);
  },

  // Item Code Prefixes
  getItemCodePrefixes: async (): Promise<ItemCodePrefix[]> => {
    return apiClient.get<ItemCodePrefix[]>('/item-code-prefixes');
  },

  addItemCodePrefix: async (prefix: Omit<ItemCodePrefix, 'id' | 'created_at' | 'updated_at'>): Promise<ItemCodePrefix> => {
    return apiClient.post<ItemCodePrefix>('/item-code-prefixes', prefix);
  },

  updateItemCodePrefix: async (id: string, updates: Partial<ItemCodePrefix>): Promise<void> => {
    await apiClient.put(`/item-code-prefixes/${id}`, updates);
  },

  deleteItemCodePrefix: async (id: string): Promise<void> => {
    await apiClient.delete(`/item-code-prefixes/${id}`);
  },

  // Activity Logs
  getActivityLogs: async (params?: {
    entityType?: string;
    entityId?: string;
    changedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLog[]> => {
    const queryParams = new URLSearchParams();
    if (params?.entityType) queryParams.append('entityType', params.entityType);
    if (params?.entityId) queryParams.append('entityId', params.entityId);
    if (params?.changedBy) queryParams.append('changedBy', params.changedBy);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    return apiClient.get<ActivityLog[]>(`/activity-logs${queryString ? `?${queryString}` : ''}`);
  },

  // Settings
  getSettings: async (): Promise<Settings> => {
    return apiClient.get<Settings>('/settings');
  },

  saveSettings: async (settings: Partial<Settings>): Promise<Settings> => {
    return apiClient.post<Settings>('/settings', settings);
  },

  // Activity Logs - Delete operations
  deleteActivityLog: async (id: string): Promise<void> => {
    await apiClient.delete(`/activity-logs/${id}`);
  },

  deleteAllActivityLogs: async (): Promise<{ message: string; count: number }> => {
    return apiClient.delete<{ message: string; count: number }>('/activity-logs/all');
  },

  deleteFilteredActivityLogs: async (filters: {
    entityType?: string;
    entityId?: string;
    changedBy?: string;
    action?: string;
  }): Promise<{ message: string; count: number }> => {
    return apiClient.post<{ message: string; count: number }>('/activity-logs/delete-filtered', filters);
  },

  // Sales Customers
  getSalesCustomers: async (): Promise<SalesCustomer[]> => {
    return apiClient.get<SalesCustomer[]>('/sales-customers');
  },

  searchSalesCustomers: async (query: string): Promise<SalesCustomer[]> => {
    return apiClient.get<SalesCustomer[]>(`/sales-customers/search?q=${encodeURIComponent(query)}`);
  },

  addSalesCustomer: async (customer: Omit<SalesCustomer, 'id' | 'created_at' | 'updated_at'>): Promise<SalesCustomer> => {
    return apiClient.post<SalesCustomer>('/sales-customers', customer);
  },

  updateSalesCustomer: async (id: string, updates: Partial<SalesCustomer>): Promise<void> => {
    await apiClient.put(`/sales-customers/${id}`, updates);
  },

  deleteSalesCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales-customers/${id}`);
  },
};
