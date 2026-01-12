import { create } from 'zustand';
import { CartItem, Item } from '../types';
import { calculateSubtotal, calculateTax, calculateDiscount, calculateTotal } from '../utils/calculations';

interface CartStore {
  items: CartItem[];
  taxRate: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | null;
  addItem: (item: Item, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'upi') => void;
  setTaxRate: (rate: number) => void;
  setDiscount: (amount: number) => void;
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  taxRate: 0,
  discount: 0,
  paymentMethod: null,

  addItem: (item: Item, quantity: number = 1) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((ci) => ci.item.id === item.id);

    if (existingItem) {
      set({
        items: currentItems.map((ci) =>
          ci.item.id === item.id
            ? {
                ...ci,
                quantity: ci.quantity + quantity,
                subtotal: (ci.quantity + quantity) * item.price,
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
            subtotal: quantity * item.price,
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
      set({
        items: currentItems.map((ci) =>
          ci.item.id === itemId
            ? {
                ...ci,
                quantity,
                subtotal: quantity * ci.item.price,
              }
            : ci
        ),
      });
    }
  },

  clearCart: () => {
    set({
      items: [],
      paymentMethod: null,
      discount: 0,
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
    return calculateSubtotal(get().items);
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
}));

