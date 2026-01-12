import { CartItem } from '../types';

export const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, cartItem) => sum + cartItem.subtotal, 0);
};

export const calculateTax = (subtotal: number, taxRate: number): number => {
  return (subtotal * taxRate) / 100;
};

export const calculateDiscount = (subtotal: number, discount: number): number => {
  return discount;
};

export const calculateTotal = (
  subtotal: number,
  tax: number,
  discount: number
): number => {
  return subtotal + tax - discount;
};

