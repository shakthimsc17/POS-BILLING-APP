import { CartItem } from '../types';

export const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, cartItem) => sum + cartItem.subtotal, 0);
};

export const calculateTax = (subtotal: number, taxRate: number): number => {
  return (subtotal * taxRate) / 100;
};

// Calculate GST based on individual item GST rates
export const calculateItemGST = (items: CartItem[]): { totalGST: number; gstBreakdown: { rate: number; amount: number }[] } => {
  console.log('🧮 Calculating GST for items:', items.map(ci => ({ 
    name: ci.item.name, 
    gst_rate: ci.item.gst_rate, 
    price: ci.customPrice ?? (typeof ci.item.price === 'string' ? parseFloat(ci.item.price) : ci.item.price),
    quantity: ci.quantity 
  })));
  
  const gstBreakdown: Record<number, number> = {};
  let totalGST = 0;

  items.forEach(cartItem => {
    const itemPrice = cartItem.customPrice ?? (typeof cartItem.item.price === 'string' ? parseFloat(cartItem.item.price) : cartItem.item.price);
    const itemGSTRate = cartItem.item.gst_rate || 0; // Use item's GST rate or fallback to 0
    const itemGSTAmount = (itemPrice * cartItem.quantity * itemGSTRate) / 100;
    
    totalGST += itemGSTAmount;
    
    // Group by GST rate for breakdown
    if (itemGSTRate > 0) {
      if (!gstBreakdown[itemGSTRate]) {
        gstBreakdown[itemGSTRate] = 0;
      }
      gstBreakdown[itemGSTRate] += itemGSTAmount;
    }
  });

  // Convert to array format
  const breakdownArray = Object.entries(gstBreakdown).map(([rate, amount]) => ({
    rate: Number(rate),
    amount
  }));

  console.log('🧮 GST Calculation Result:', { totalGST, gstBreakdown: breakdownArray });

  return { totalGST, gstBreakdown: breakdownArray };
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

