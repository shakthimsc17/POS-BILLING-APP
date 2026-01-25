/**
 * Utility function to parse transaction itemsJson
 * Handles both old format (array) and new format (object with items and metadata)
 * 
 * @param itemsJson - The itemsJson string from transaction
 * @returns Object with items array and optional metadata
 */
export function parseTransactionItems(itemsJson: string): {
  items: any[];
  metadata?: {
    subtotal?: number;
    tax?: number;
    discount?: number;
    taxRate?: number;
  };
} {
  try {
    const parsed = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
    
    // New format: { items: [...], metadata: {...} }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.items) {
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        metadata: parsed.metadata || {},
      };
    }
    
    // Old format: array of items
    if (Array.isArray(parsed)) {
      return {
        items: parsed,
        metadata: {},
      };
    }
    
    // Fallback: return empty array
    return { items: [], metadata: {} };
  } catch (error) {
    console.error('Error parsing transaction items:', error);
    return { items: [], metadata: {} };
  }
}

/**
 * Get items array from transaction itemsJson
 * @param itemsJson - The itemsJson string from transaction
 * @returns Array of items
 */
export function getTransactionItems(itemsJson: string): any[] {
  return parseTransactionItems(itemsJson).items;
}

