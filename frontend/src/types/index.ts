export interface Category {
  id: string;
  customer_id: string;
  name: string;
  subcategory?: string;
  brand?: string;
  icon?: string;
  created_at: string;
}

export interface Item {
  id: string;
  customer_id: string;
  name: string;
  display_name?: string;
  code: string;
  barcode?: string;
  mapping_code?: string;
  category_id?: string;
  subcategory?: string;
  cost: number | string; // Prisma Decimal returns as string
  price: number | string; // Prisma Decimal returns as string
  mrp?: number | string; // Prisma Decimal returns as string
  stock: number;
  purchase_qty?: number;
  image_url?: string;
  created_at: string;
}

export interface CartItem {
  item: Item;
  quantity: number;
  subtotal: number;
  customPrice?: number;
  originalPrice: number;
  quickSaleItemId?: string;
}

export interface ItemCodePrefix {
  id: string;
  prefix: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isAdmin?: boolean;
  customer_type?: string;
  password_hash?: string; // For authentication (not returned to client)
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  customer_type: string;
  page: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view_profit: boolean;
  is_hidden?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PagePermission {
  page: string;
  label: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view_profit: boolean;
  is_hidden?: boolean;
}

export interface Transaction {
  id: string;
  customer_id: string; // The customer who owns this transaction (the seller/store owner)
  transaction_customer_id?: string; // The customer who made the purchase (buyer) - system user
  sales_customer_id?: string; // The sales customer who made the purchase (buyer) - sales customer
  table_order_id?: string; // The table order this transaction is linked to
  total_amount: number | string; // Prisma Decimal returns as string
  payment_method: 'cash' | 'card' | 'upi';
  received_amount?: number | string; // Prisma Decimal returns as string
  change_amount?: number | string; // Prisma Decimal returns as string
  items_json: string;
  created_at: string;
}

export interface Company {
  id?: string | null;
  customer_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  website?: string;
  logo?: string;
  business_type?: 'clothing' | 'cafe' | 'electrical' | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  entity_type: 'item' | 'category' | 'transaction' | 'company';
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  changed_by: string;
  changed_by_name?: string;
  changed_by_email?: string;
  changes?: any; // JSON object with old/new values
  created_at: string;
}

export interface Settings {
  id: string;
  customer_id: string;
  activity_log_enabled: boolean;
  item_log_actions: 'all' | 'update_delete';
  receipt_header_option: 'logo' | 'company_name' | 'both';
  receipt_auto_print: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesCustomer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  place?: string;
  created_at: string;
  updated_at: string;
}

export interface QuickSaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number | string;
  cost?: number | string | null;
  total_amount: number | string;
  sold_at: string;
  added_to_inventory: boolean;
  inventory_item_id?: string;
  transaction_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashFlowEntry {
  id: string;
  customer_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number | string;
  description?: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export interface CashFlowSummary {
  total_income: number;
  total_sales: number;
  manual_income: number;
  total_expense: number;
  total_profit?: number; // Profit from transactions for filtered date range
  net_cash_flow: number;
}

export interface Cart {
  id: string;
  customer_id: string;
  items_json: string;
  tax_rate: number | string;
  discount: number | string;
  payment_method?: 'cash' | 'card' | 'upi';
  sales_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  customer_id: string;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  created_at: string;
  updated_at: string;
}

export interface TableOrder {
  id: string;
  customer_id: string;
  table_id: string;
  table_number?: string; // Included when fetched with table relation
  status: 'pending' | 'completed' | 'cancelled';
  items_json: string;
  tax_rate: number | string;
  discount: number | string;
  total_amount?: number | string;
  payment_method?: 'cash' | 'card' | 'upi';
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CashFlowCategory {
  name: string;
  icon: string; // Emoji or icon identifier
  type: 'income' | 'expense';
}

export const INCOME_CATEGORIES: CashFlowCategory[] = [
  { name: 'Profit', icon: '💰', type: 'income' },
  { name: 'Salary', icon: '💵', type: 'income' },
  { name: 'Awards', icon: '🏆', type: 'income' },
  { name: 'Rental', icon: '🏠', type: 'income' },
  { name: 'Sale', icon: '🛒', type: 'income' },
  { name: 'Refund', icon: '↩️', type: 'income' },
  { name: 'Lottery', icon: '🎰', type: 'income' },
  { name: 'Dividend', icon: '📈', type: 'income' },
  { name: 'Investment', icon: '💼', type: 'income' },
  { name: 'Interest', icon: '💳', type: 'income' },
  { name: 'Commission', icon: '🤝', type: 'income' },
  { name: 'Fee', icon: '💸', type: 'income' },
  { name: 'Loan', icon: '🏦', type: 'income' },
  { name: 'Miscellaneous', icon: '📦', type: 'income' },
  { name: 'Custom', icon: '➕', type: 'income' }
];

export const EXPENSE_CATEGORIES: CashFlowCategory[] = [
  { name: 'Tax', icon: '📋', type: 'expense' },
  { name: 'Fuel', icon: '⛽', type: 'expense' },
  { name: 'Food', icon: '🍔', type: 'expense' },
  { name: 'Bill', icon: '📄', type: 'expense' },
  { name: 'Transportation', icon: '🚗', type: 'expense' },
  { name: 'Insurance', icon: '🛡️', type: 'expense' },
  { name: 'Salary', icon: '👔', type: 'expense' },
  { name: 'Rent', icon: '🏢', type: 'expense' },
  { name: 'Repairs', icon: '🔧', type: 'expense' },
  { name: 'Commissions', icon: '💼', type: 'expense' },
  { name: 'Advertising', icon: '📢', type: 'expense' },
  { name: 'Fee', icon: '💳', type: 'expense' },
  { name: 'Interest', icon: '📊', type: 'expense' },
  { name: 'Loan', icon: '🏦', type: 'expense' },
  { name: 'Supplies', icon: '📦', type: 'expense' },
  { name: 'Transfer', icon: '💸', type: 'expense' },
  { name: 'Contract', icon: '📝', type: 'expense' },
  { name: 'Miscellaneous', icon: '📋', type: 'expense' },
  { name: 'Stock Investment', icon: '📊', type: 'expense' },
  { name: 'Employee Salary', icon: '👥', type: 'expense' },
  { name: 'Daily Expenses', icon: '☕', type: 'expense' },
  { name: 'Custom', icon: '➕', type: 'expense' }
];

export interface ReturnRecord {
  id: string;
  original_transaction_id: string;
  customer_id: string;
  return_type: 'full' | 'partial' | 'exchange' | 'refund';
  reason?: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  refund_amount?: number | string;
  restocked_items?: any;
  exchange_items?: any;
  notes?: string;
  approved_by?: string;
  processed_by?: string;
  approved_at?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  originalTransaction?: Transaction;
  approvedByUser?: {
    id: string;
    name: string;
  };
  processedByUser?: {
    id: string;
    name: string;
  };
}

