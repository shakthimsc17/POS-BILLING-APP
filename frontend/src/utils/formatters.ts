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

export const formatOrderId = (uuid: string): string => {
  // Return last 8 characters of UUID
  if (!uuid || uuid.length < 8) return uuid;
  return uuid.slice(-8).toUpperCase();
};

// Convert number to words in Indian format
export const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convertHundreds = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };
  
  // Separate integer and decimal parts
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  let result = '';
  let remaining = integerPart;
  
  const crores = Math.floor(remaining / 10000000);
  if (crores > 0) {
    result += convertHundreds(crores) + ' Crore ';
  }
  remaining %= 10000000;
  
  const lakhs = Math.floor(remaining / 100000);
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + ' Lakh ';
  }
  remaining %= 100000;
  
  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    result += convertHundreds(thousands) + ' Thousand ';
  }
  remaining %= 1000;
  
  if (remaining > 0) {
    result += convertHundreds(remaining);
  }
  
  // Handle paise (decimal part)
  if (decimalPart > 0) {
    result += ' and ' + convertHundreds(decimalPart) + ' Paise';
  }
  
  return result.trim() + ' Only';
};

