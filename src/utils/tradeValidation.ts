import { getTodayISO, formatCurrency } from '@/utils/format';
import type { OCRResult, TradeDirection, TradeFormData } from '@/types';

/**
 * Parse OCR result into initial form values for the review screen.
 * Converts pricePerShare (dollars) to cents, defaults direction to 'buy',
 * falls back to today's date when no date extracted.
 */
export function parseOCRToInitialValues(ocrResult: OCRResult | null): TradeFormData {
  const today = getTodayISO();

  if (!ocrResult) {
    return {
      ticker: '',
      shares: '',
      pricePerShareCents: '',
      tradeDate: today,
      direction: 'buy',
      feesCents: '',
      notes: '',
    };
  }

  const pricePerShareCents = ocrResult.pricePerShare !== null
    ? String(Math.round(ocrResult.pricePerShare * 100))
    : '';

  return {
    ticker: ocrResult.ticker || '',
    shares: ocrResult.shares !== null ? String(ocrResult.shares) : '',
    pricePerShareCents,
    tradeDate: ocrResult.tradeDate || today,
    direction: ocrResult.direction || 'buy',
    feesCents: '',
    notes: '',
  };
}

/**
 * Validate all trade fields. Returns a record of field-key → error message.
 * Required fields: ticker, shares, pricePerShareCents, tradeDate, direction.
 * Optional fields: feesCents, notes.
 */
export function validateTradeFields(fields: {
  ticker: string;
  shares: string;
  pricePerShareCents: string;
  tradeDate: string;
  direction: string;
  feesCents?: string;
  notes?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  // ticker: required, 1-5 letters
  if (!fields.ticker.trim()) {
    errors.ticker = 'Ticker is required';
  } else if (!/^[A-Za-z]{1,5}$/.test(fields.ticker.trim())) {
    errors.ticker = 'Must be 1-5 letters';
  }

  // shares: required, positive integer
  if (!fields.shares.trim()) {
    errors.shares = 'Shares is required';
  } else if (!/^\d+$/.test(fields.shares.trim()) || parseInt(fields.shares, 10) <= 0) {
    errors.shares = 'Must be a positive whole number';
  }

  // pricePerShareCents: required (as cents)
  if (!fields.pricePerShareCents.trim()) {
    errors.pricePerShareCents = 'Price is required';
  }

  // tradeDate: required
  if (!fields.tradeDate.trim()) {
    errors.tradeDate = 'Date is required';
  }

  // direction: required
  if (!fields.direction) {
    errors.direction = 'Direction is required';
  }

  return errors;
}

/**
 * Check whether a field was missing from the OCR result.
 * Only checks fields that OCR attempts to extract (ticker, shares, price, date, direction).
 * Fees and notes are never extracted by OCR, so they always return false.
 */
export function isMissingFromOCR(ocrResult: OCRResult | null, fieldKey: string): boolean {
  if (!ocrResult) return false;

  switch (fieldKey) {
    case 'ticker':
      return !ocrResult.ticker;
    case 'shares':
      return ocrResult.shares === null;
    case 'pricePerShareCents':
      return ocrResult.pricePerShare === null;
    case 'tradeDate':
      return !ocrResult.tradeDate;
    case 'direction':
      return !ocrResult.direction;
    default:
      return false;
  }
}

/**
 * Format a trade field value for display in the review card.
 * Returns "—" for empty values.
 */
export function formatTradeFieldDisplay(fieldKey: string, rawValue: string): string {
  if (!rawValue && rawValue !== '0') return '\u2014'; // em dash

  switch (fieldKey) {
    case 'ticker':
      return rawValue.toUpperCase();
    case 'shares':
      return `${rawValue} shares`;
    case 'pricePerShareCents': {
      const cents = parseInt(rawValue, 10);
      if (isNaN(cents)) return '\u2014';
      return formatCurrency(cents);
    }
    default:
      return rawValue;
  }
}

/**
 * Determine if the save button should be enabled.
 * All required fields must be non-empty, and there must be no validation errors.
 */
export function canSaveTrade(
  fields: {
    ticker: string;
    shares: string;
    pricePerShareCents: string;
    tradeDate: string;
    direction: string;
  },
  errors: Record<string, string>
): boolean {
  return (
    fields.ticker.trim() !== '' &&
    fields.shares.trim() !== '' &&
    fields.pricePerShareCents.trim() !== '' &&
    fields.tradeDate.trim() !== '' &&
    fields.direction !== '' &&
    Object.keys(errors).length === 0
  );
}
