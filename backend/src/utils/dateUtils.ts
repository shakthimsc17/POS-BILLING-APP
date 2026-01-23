/**
 * Utility functions for consistent date handling across the application
 * All dates use local timezone (Indian Standard Time or system timezone)
 */

/**
 * Parse a date string (YYYY-MM-DD or ISO8601) and return start/end of day in local timezone
 * This ensures date queries match user's local timezone expectations
 * 
 * @param dateString - Date string in YYYY-MM-DD or ISO8601 format
 * @returns Object with start and end Date objects for the day in local timezone
 */
export function getDayRangeLocal(dateString: string): { start: Date; end: Date } {
  // Handle YYYY-MM-DD format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create dates in local timezone
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start, end };
  }
  
  // Handle ISO8601 format
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get hour from a date in local timezone
 * @param date - Date object
 * @returns Hour (0-23) in local timezone
 */
export function getLocalHour(date: Date): number {
  return date.getHours();
}

/**
 * Parse date string to Date object in local timezone
 * Handles both YYYY-MM-DD and ISO8601 formats
 */
export function parseDateLocal(dateString: string): Date {
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
}

