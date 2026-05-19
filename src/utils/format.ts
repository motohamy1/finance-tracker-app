/**
 * Format integer cents to a display string with currency symbol.
 * e.g., 4250 → "$42.50", 100 → "$1.00", 0 → "$0.00"
 * Uses toLocaleString for proper locale formatting.
 */
export function formatCurrency(cents: number, symbol: string = 'EGP'): string {
  const dollars = cents / 100;
  return `${symbol}${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format an ISO date string to a short display format.
 * e.g., "2026-04-29" → "Apr 29, 2026"
 * Uses local timezone to avoid UTC offset shifting the displayed day.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get today's date as ISO string (YYYY-MM-DD) in local timezone.
 * Avoids UTC midnight issues where negative-offset timezones get "yesterday".
 */
export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate a UUID v4 (for client-side ID generation without external library).
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
