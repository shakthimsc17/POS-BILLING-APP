import { create } from 'zustand';
import { CartItem, Item } from '../types';
import { calculateSubtotal, calculateTax, calculateDiscount, calculateTotal } from '../utils/calculations';
import { storageService } from '../services/storage';

interface CartStore {
  items: CartItem[];
  taxRate: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | null;
  addItem: (item: Item, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setCustomPrice: (itemId: string, price: number) => void;
  getItemPrice: (itemId: string) => number;
  hasCustomPrice: (itemId: string) => boolean;
  clearCart: () => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'upi') => void;
  setTaxRate: (rate: number) => void;
  setDiscount: (amount: number) => void;
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  saveCart: (salesCustomerId?: string) => Promise<void>;
  loadCart: () => Promise<{ salesCustomerId?: string } | null>;
  isLoading: boolean;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  taxRate: 0,
  discount: 0,
  paymentMethod: null,
  isLoading: false,

  addItem: (item: Item, quantity: number = 1) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((ci) => ci.item.id === item.id);
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    
    // Stock validation - skip for quick sale items
    const isQuickSaleItem = item.id.startsWith('quick-sale-');
    if (!isQuickSaleItem) {
      const itemStock = typeof item.stock === 'number' ? item.stock : parseInt(item.stock?.toString() || '0', 10);
      const requestedQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      
      if (itemStock < requestedQuantity) {
        throw new Error(`Only ${itemStock} ${item.name} available in stock. Requested: ${requestedQuantity}`);
      }
    }

    if (existingItem) {
      const currentPrice = existingItem.customPrice ?? itemPrice;
      set({
        items: currentItems.map((ci) =>
          ci.item.id === item.id
            ? {
                ...ci,
                quantity: ci.quantity + quantity,
                subtotal: (ci.quantity + quantity) * currentPrice,
              }
            : ci
        ),
      });
    } else {
      set({
        items: [
          ...currentItems,
          {
            item,
            quantity,
            subtotal: quantity * itemPrice,
            originalPrice: itemPrice,
          },
        ],
      });
    }
  },

  removeItem: (itemId: string) => {
    set({
      items: get().items.filter((ci) => ci.item.id !== itemId),
    });
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    const currentItems = get().items;
    const cartItem = currentItems.find((ci) => ci.item.id === itemId);
    if (cartItem) {
      // Stock validation - skip for quick sale items
      const isQuickSaleItem = itemId.startsWith('quick-sale-');
      if (!isQuickSaleItem) {
        const itemStock = typeof cartItem.item.stock === 'number' 
          ? cartItem.item.stock 
          : parseInt(cartItem.item.stock?.toString() || '0', 10);
        
        if (itemStock < quantity) {
          throw new Error(`Only ${itemStock} ${cartItem.item.name} available in stock. Requested: ${quantity}`);
        }
      }
      
      const itemPrice = get().getItemPrice(itemId);
      set({
        items: currentItems.map((ci) =>
          ci.item.id === itemId
            ? {
                ...ci,
                quantity,
                subtotal: quantity * itemPrice,
              }
            : ci
        ),
      });
    }
  },

  setCustomPrice: (itemId: string, price: number) => {
    const currentItems = get().items;
    const cartItem = currentItems.find((ci) => ci.item.id === itemId);
    if (cartItem) {
      set({
        items: currentItems.map((ci) =>
          ci.item.id === itemId
            ? {
                ...ci,
                customPrice: price,
                subtotal: ci.quantity * price,
                originalPrice: ci.originalPrice ?? (typeof ci.item.price === 'string' ? parseFloat(ci.item.price) : ci.item.price),
              }
            : ci
        ),
      });
    }
  },

  getItemPrice: (itemId: string) => {
    const cartItem = get().items.find((ci) => ci.item.id === itemId);
    if (!cartItem) return 0;
    if (cartItem.customPrice !== undefined) return cartItem.customPrice;
    return typeof cartItem.item.price === 'string' ? parseFloat(cartItem.item.price) : cartItem.item.price;
  },

  hasCustomPrice: (itemId: string) => {
    const cartItem = get().items.find((ci) => ci.item.id === itemId);
    return cartItem?.customPrice !== undefined;
  },

  clearCart: () => {
    set({
      items: [],
      paymentMethod: null,
      discount: 0,
      taxRate: 0,
    });
  },

  setPaymentMethod: (method: 'cash' | 'card' | 'upi') => {
    set({ paymentMethod: method });
  },

  setTaxRate: (rate: number) => {
    set({ taxRate: rate });
  },

  setDiscount: (amount: number) => {
    set({ discount: amount });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, ci) => {
      const price = ci.customPrice ?? (typeof ci.item.price === 'string' ? parseFloat(ci.item.price) : ci.item.price);
      return sum + (ci.quantity * price);
    }, 0);
  },

  getTax: () => {
    return calculateTax(get().getSubtotal(), get().taxRate);
  },

  getDiscount: () => {
    return calculateDiscount(get().getSubtotal(), get().discount);
  },

  getTotal: () => {
    return calculateTotal(get().getSubtotal(), get().getTax(), get().getDiscount());
  },

  getItemCount: () => {
    return get().items.reduce((sum, ci) => sum + ci.quantity, 0);
  },

  saveCart: async (salesCustomerId?: string) => {
    try {
      const state = get();
      await storageService.saveCart({
        items_json: JSON.stringify(state.items),
        tax_rate: state.taxRate,
        discount: state.discount,
        payment_method: state.paymentMethod || undefined,
        sales_customer_id: salesCustomerId,
      });
    } catch (error) {
      console.error('Error saving cart:', error);
      // Don't throw - silent fail for auto-save
    }
  },

  loadCart: async () => {
    try {
      set({ isLoading: true });
      const savedCart = await storageService.getCart();
      
      if (savedCart) {
        try {
          const items = JSON.parse(savedCart.items_json);
          set({
            items: items || [],
            taxRate: typeof savedCart.tax_rate === 'string' ? parseFloat(savedCart.tax_rate) : savedCart.tax_rate,
            discount: typeof savedCart.discount === 'string' ? parseFloat(savedCart.discount) : savedCart.discount,
            paymentMethod: savedCart.payment_method || null,
          });
          return { salesCustomerId: savedCart.sales_customer_id };
        } catch (parseError) {
          console.error('Error parsing cart items:', parseError);
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading cart:', error);
      // Don't throw - just continue with empty cart
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));

