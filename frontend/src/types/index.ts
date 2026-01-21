export interface Category {
  id: string;
  customer_id: string;
  name: string;
  subcategory?: string;
  brand?: string;
  created_at: string;
}

export interface Item {
  id: string;
  customer_id: string;
  name: string;
  display_name?: string;
  code: string;
  barcode?: string;
  category_id?: string;
  subcategory?: string;
  cost: number | string; // Prisma Decimal returns as string
  price: number | string; // Prisma Decimal returns as string
  mrp?: number | string; // Prisma Decimal returns as string
  stock: number;
  image_url?: string;
  created_at: string;
}

export interface CartItem {
  item: Item;
  quantity: number;
  subtotal: number;
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
  password_hash?: string; // For authentication (not returned to client)
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string; // The customer who owns this transaction (the seller/store owner)
  transaction_customer_id?: string; // The customer who made the purchase (buyer)
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
  created_at: string;
  updated_at: string;
}

