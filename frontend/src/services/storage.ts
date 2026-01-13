import { Category, Item, Transaction, Customer, Company } from '../types';
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

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    return apiClient.get<Transaction[]>('/transactions');
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'created_at' | 'customer_id'>): Promise<Transaction> => {
    return apiClient.post<Transaction>('/transactions', transaction);
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
};
