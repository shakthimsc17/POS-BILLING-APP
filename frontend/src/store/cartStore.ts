import { create } from 'zustand';
import { CartItem, Item } from '../types';
import { calculateTax, calculateDiscount, calculateItemGST } from '../utils/calculations';
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
  getGST: () => { totalGST: number; gstBreakdown: { rate: number; amount: number }[] };
  getDiscount: () => number;
  getItemDiscounts: () => number;
  getActualSubtotal: () => number;
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
  paymentMethod: 'cash',
  isLoading: false,

  addItem: (item: Item, quantity: number = 1) => {
    console.log('🛒 Cart Store: addItem called', { item, quantity });
    const currentItems = get().items;
    console.log('🛒 Cart Store: Current items before adding', currentItems);
    const existingItem = currentItems.find((ci) => ci.item.id === item.id);
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    console.log('🛒 Cart Store: Item details', { itemId: item.id, itemName: item.name, itemPrice, existingItem: !!existingItem });
    
    // Stock validation removed - allow adding out-of-stock items
    // Quick sale items already skip validation

    if (existingItem) {
      const currentPrice = existingItem.customPrice ?? itemPrice;
      const newItems = currentItems.map((ci) =>
        ci.item.id === item.id
          ? {
              ...ci,
              quantity: ci.quantity + quantity,
              subtotal: (ci.quantity + quantity) * currentPrice,
            }
          : ci
      );
      console.log('🛒 Cart Store: Updated items (existing)', newItems);
      set({ items: newItems });
    } else {
      const newItems = [
        ...currentItems,
        {
          item,
          quantity,
          subtotal: quantity * itemPrice,
          originalPrice: itemPrice,
        },
      ];
      console.log('🛒 Cart Store: Updated items (new)', newItems);
      set({ items: newItems });
    }
    
    // Verify the state after update
    setTimeout(() => {
      const updatedItems = get().items;
      console.log('🛒 Cart Store: Items after update', updatedItems);
    }, 100);
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
      // Stock validation removed - allow adding out-of-stock items
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
      paymentMethod: 'cash',
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
    // For backward compatibility, use global tax rate if no items have GST rates
    const items = get().items;
    const hasItemGST = items.some(item => item.item.gst_rate && item.item.gst_rate > 0);
    
    if (hasItemGST) {
      // Use item-specific GST calculation
      return get().getGST().totalGST;
    } else {
      // Use global tax rate (legacy behavior)
      return calculateTax(get().getSubtotal(), get().taxRate);
    }
  },

  getGST: () => {
    return calculateItemGST(get().items);
  },

  getDiscount: () => {
    return calculateDiscount(get().getSubtotal(), get().discount) + get().getItemDiscounts();
  },

  getItemDiscounts: () => {
    return get().items.reduce((sum, ci) => {
      const originalPrice = ci.originalPrice ?? (typeof ci.item.price === 'string' ? parseFloat(ci.item.price) : ci.item.price);
      const currentPrice = ci.customPrice ?? originalPrice;
      const unitDiscount = originalPrice - currentPrice;
      return sum + (ci.quantity * Math.max(0, unitDiscount));
    }, 0);
  },

  getActualSubtotal: () => {
    return get().items.reduce((sum, ci) => {
      const originalPrice = ci.originalPrice ?? (typeof ci.item.price === 'string' ? parseFloat(ci.item.price) : ci.item.price);
      return sum + (ci.quantity * originalPrice);
    }, 0);
  },

  getTotal: () => {
    // Total = Actual Subtotal - (Total Discounts) + Tax
    // OR Total = Current Subtotal - Global Discount + Tax
    // Both should be equivalent. Current Subtotal = Actual Subtotal - Item Discounts.
    // So Total = (Actual Subtotal - Item Discounts) - Global Discount + Tax
    // Total = Actual Subtotal - (Item Discounts + Global Discount) + Tax
    const subtotal = get().getSubtotal();
    const tax = get().getTax();
    const globalDiscount = calculateDiscount(subtotal, get().discount);
    return subtotal + tax - globalDiscount;
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
      const currentItems = get().items;
      
      // Don't load saved cart if current cart already has items
      if (currentItems.length > 0) {
        console.log('🛒 Cart Store: Current cart has items, skipping saved cart load');
        set({ isLoading: false });
        return null;
      }
      
      const savedCart = await storageService.getCart();
      
      if (savedCart) {
        try {
          const items = JSON.parse(savedCart.items_json);
          console.log('🛒 Cart Store: Loading saved cart with items:', items);
          set({
            items: items || [],
            taxRate: typeof savedCart.tax_rate === 'string' ? parseFloat(savedCart.tax_rate) : savedCart.tax_rate,
            discount: typeof savedCart.discount === 'string' ? parseFloat(savedCart.discount) : savedCart.discount,
            paymentMethod: savedCart.payment_method || 'cash',
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

