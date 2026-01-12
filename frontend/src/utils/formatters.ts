export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return '₹0.00';
  }
  // Convert to number if it's a string (Prisma Decimal returns as string)
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) {
    return '₹0.00';
  }
  return `₹${numAmount.toFixed(2)}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

