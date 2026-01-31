import { Category, Item, Transaction, Customer, Company, ItemCodePrefix, ActivityLog, Settings, SalesCustomer, QuickSaleItem, CashFlowEntry, CashFlowSummary, Permission, PagePermission, Cart, Table, TableOrder } from '../types';
import apiClient from '../lib/apiClient';

export const storageService = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    // Add timestamp to bypass cache
    const timestamp = Date.now();
    const response = await apiClient.get<{ categories: Category[]; pagination?: any } | Category[]>(`/categories?_t=${timestamp}`);
    // Handle both response formats: { categories: [...], pagination: {...} } or array
    return Array.isArray(response) ? response : (response?.categories || []);
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
    const response = await apiClient.get<{ items: Item[]; pagination?: any } | Item[]>('/items');
    // Handle both response formats: { items: [...], pagination: {...} } or array
    return Array.isArray(response) ? response : (response?.items || []);
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

  searchItemByBarcode: async (barcode: string): Promise<Item | null> => {
    try {
      return await apiClient.get<Item>(`/items/search-by-barcode/${encodeURIComponent(barcode)}`);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  searchItemByMappingCode: async (mappingCode: string): Promise<Item | null> => {
    try {
      return await apiClient.get<Item>(`/items/search-by-mapping-code/${encodeURIComponent(mappingCode)}`);
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
    const response = await apiClient.get<{ transactions: Transaction[]; pagination?: any } | Transaction[]>('/transactions');
    // Handle both response formats: { transactions: [...], pagination: {...} } or array
    return Array.isArray(response) ? response : (response?.transactions || []);
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/transactions/${id}`);
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'created_at' | 'customer_id'>): Promise<Transaction> => {
    return apiClient.post<Transaction>('/transactions', transaction);
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const response = await apiClient.get<{ customers: Customer[]; pagination?: any } | Customer[]>('/customers');
    // Handle both response formats: { customers: [...], pagination: {...} } or array
    return Array.isArray(response) ? response : (response?.customers || []);
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

  // Quick Sale Items
  getQuickSaleItems: async (filter?: 'all' | 'pending' | 'added'): Promise<QuickSaleItem[]> => {
    const query = filter ? `?filter=${filter}` : '';
    return apiClient.get<QuickSaleItem[]>(`/quick-sale-items${query}`);
  },

  addQuickSaleItem: async (item: { name: string; quantity: number; price: number }): Promise<QuickSaleItem> => {
    return apiClient.post<QuickSaleItem>('/quick-sale-items', item);
  },

  updateQuickSaleItem: async (id: string, updates: Partial<QuickSaleItem>): Promise<void> => {
    await apiClient.put(`/quick-sale-items/${id}`, updates);
  },

  deleteQuickSaleItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/quick-sale-items/${id}`);
  },

  addQuickSaleItemToInventory: async (
    id: string,
    data: {
      category_id: string;
      code: string;
      stock: number;
      cost: number;
      price?: number;
      mrp?: number;
      display_name?: string;
      subcategory?: string;
      barcode?: string;
    }
  ): Promise<Item> => {
    return apiClient.post<Item>(`/quick-sale-items/${id}/add-to-inventory`, data);
  },

  // Cash Flow
  getCashFlowEntries: async (filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
  }): Promise<CashFlowEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.type) params.append('type', filters.type);
    const query = params.toString();
    return apiClient.get<CashFlowEntry[]>(`/cash-flow${query ? `?${query}` : ''}`);
  },

  addCashFlowEntry: async (entry: Omit<CashFlowEntry, 'id' | 'customer_id' | 'created_at' | 'updated_at'>): Promise<CashFlowEntry> => {
    return apiClient.post<CashFlowEntry>('/cash-flow', entry);
  },

  updateCashFlowEntry: async (id: string, updates: Partial<CashFlowEntry>): Promise<void> => {
    await apiClient.put(`/cash-flow/${id}`, updates);
  },

  deleteCashFlowEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/cash-flow/${id}`);
  },

  getCashFlowSummary: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CashFlowSummary> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const query = params.toString();
    return apiClient.get<CashFlowSummary>(`/cash-flow/summary${query ? `?${query}` : ''}`);
  },

  getStockInvestment: async (): Promise<{ total_investment: number }> => {
    return apiClient.get<{ total_investment: number }>('/cash-flow/stock-investment');
  },

  getCashFlowCategories: async (): Promise<{ income: any[]; expense: any[] }> => {
    return apiClient.get<{ income: any[]; expense: any[] }>('/cash-flow/categories');
  },

  // Sales Performance
  getSalesData: async (period: '7days' | 'week' | 'month' | 'year' | 'overall'): Promise<any[]> => {
    // Add timestamp to bypass any potential caching
    const timestamp = Date.now();
    return apiClient.get<any[]>(`/sales-performance/sales?period=${period}&_t=${timestamp}`);
  },

  getProfitData: async (period: '7days' | 'week' | 'month' | 'year' | 'overall'): Promise<any> => {
    // Add timestamp to bypass any potential caching
    const timestamp = Date.now();
    return apiClient.get<any>(`/sales-performance/profit?period=${period}&_t=${timestamp}`);
  },

  getTopItems: async (period: '7days' | 'week' | 'month' | 'year' | 'overall' = 'overall', limit: number = 10): Promise<any[]> => {
    // Add timestamp to bypass any potential caching
    const timestamp = Date.now();
    return apiClient.get<any[]>(`/sales-performance/top-items?period=${period}&limit=${limit}&_t=${timestamp}`);
  },

  getPaymentMethodsData: async (period: '7days' | 'week' | 'month' | 'year' | 'overall' = 'overall'): Promise<any[]> => {
    // Add timestamp to bypass any potential caching
    const timestamp = Date.now();
    return apiClient.get<any[]>(`/sales-performance/payment-methods?period=${period}&_t=${timestamp}`);
  },

  /** Export full DB as gzip-compressed JSON (admin only). Backend saves to db-exports/YYYY-MM-DD/ and returns file for download. */
  exportDb: async (): Promise<void> => {
    const token = localStorage.getItem('pos_token');
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const res = await fetch(`${base}/export-db`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Export failed');
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition');
    const match = cd && cd.match(/filename="?([^";]+)/);
    const filename = match ? match[1].trim() : `pos-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json.gz`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  getHourlySalesData: async (date: string, startHour?: number, endHour?: number, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    // Add timestamp to bypass any potential caching
    params.append('_t', Date.now().toString());
    if (endDate) {
      // Date range mode
      params.append('startDate', date);
      params.append('endDate', endDate);
    } else {
      // Single date mode
      params.append('date', date);
    }
    if (startHour !== undefined) params.append('startHour', startHour.toString());
    if (endHour !== undefined) params.append('endHour', endHour.toString());
    return apiClient.get<any[]>(`/sales-performance/hourly?${params.toString()}`);
  },

  // Permissions
  getPermissions: async (customerType?: string): Promise<Permission[]> => {
    const url = customerType ? `/permissions?customerType=${encodeURIComponent(customerType)}` : '/permissions';
    return apiClient.get<Permission[]>(url);
  },

  getPermissionsByType: async (customerType: string): Promise<Permission[]> => {
    return apiClient.get<Permission[]>(`/permissions/by-type/${encodeURIComponent(customerType)}`);
  },

  getAvailablePages: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/permissions/pages');
  },

  savePermissions: async (customerType: string, permissions: PagePermission[]): Promise<Permission[]> => {
    return apiClient.post<Permission[]>('/permissions', {
      customerType,
      permissions: permissions.map(p => ({
        page: p.page,
        can_view: p.can_view,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
        can_view_profit: p.can_view_profit,
        is_hidden: p.is_hidden ?? false,
      })),
    });
  },

  updatePermission: async (id: string, updates: Partial<Permission>): Promise<Permission> => {
    return apiClient.put<Permission>(`/permissions/${id}`, updates);
  },

  // Carts
  getCart: async (): Promise<Cart | null> => {
    return apiClient.get<Cart | null>('/carts');
  },

  saveCart: async (cart: {
    items_json: string;
    tax_rate?: number;
    discount?: number;
    payment_method?: 'cash' | 'card' | 'upi';
    sales_customer_id?: string;
  }): Promise<Cart> => {
    return apiClient.post<Cart>('/carts', cart);
  },

  deleteCart: async (): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>('/carts');
  },

  // Tables
  getTables: async (): Promise<Table[]> => {
    return apiClient.get<Table[]>('/tables');
  },

  getTablesByStatus: async (status: 'available' | 'occupied' | 'reserved'): Promise<Table[]> => {
    return apiClient.get<Table[]>(`/tables/status?status=${status}`);
  },

  addTable: async (table: Omit<Table, 'id' | 'customer_id' | 'created_at' | 'updated_at'>): Promise<Table> => {
    return apiClient.post<Table>('/tables', table);
  },

  updateTable: async (id: string, updates: Partial<Table>): Promise<Table> => {
    return apiClient.put<Table>(`/tables/${id}`, updates);
  },

  deleteTable: async (id: string): Promise<void> => {
    await apiClient.delete(`/tables/${id}`);
  },

  // Table Orders
  getTableOrders: async (filters?: { status?: string; tableId?: string }): Promise<TableOrder[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tableId) params.append('tableId', filters.tableId);
    const query = params.toString();
    return apiClient.get<TableOrder[]>(`/table-orders${query ? `?${query}` : ''}`);
  },

  getTableOrder: async (id: string): Promise<TableOrder> => {
    return apiClient.get<TableOrder>(`/table-orders/${id}`);
  },

  getActiveTableOrder: async (tableId: string): Promise<TableOrder | null> => {
    try {
      return await apiClient.get<TableOrder>(`/table-orders/table/${tableId}`);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  createTableOrder: async (order: Omit<TableOrder, 'id' | 'customer_id' | 'created_at' | 'updated_at' | 'status' | 'transaction_id'>): Promise<TableOrder> => {
    return apiClient.post<TableOrder>('/table-orders', order);
  },

  updateTableOrder: async (id: string, updates: Partial<TableOrder>): Promise<TableOrder> => {
    return apiClient.put<TableOrder>(`/table-orders/${id}`, updates);
  },

  completeTableOrder: async (id: string, data: { payment_method: 'cash' | 'card' | 'upi'; received_amount?: number; sales_customer_id?: string }): Promise<{ message: string; transaction: Transaction }> => {
    return apiClient.post<{ message: string; transaction: Transaction }>(`/table-orders/${id}/complete`, data);
  },

  cancelTableOrder: async (id: string): Promise<void> => {
    await apiClient.post(`/table-orders/${id}/cancel`);
  },
};
