import { getTodayISO, formatCurrency } from '@/utils/format';
import type { OCRResult, AIExtractionMeta, TradeDirection, TradeFormData } from '@/types';

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
      assetType: 'stock',
      feesCents: '',
      notes: '',
    };
  }

  // Store price as dollar string (like manual entry form) — converted to cents on save
  const pricePerShareCents = ocrResult.pricePerShare !== null
    ? ocrResult.pricePerShare.toFixed(2)
    : '';

  // Fees stored as dollar string (converted to cents on save)
  const feesCents = ocrResult.feesCents !== null && ocrResult.feesCents > 0
    ? (ocrResult.feesCents / 100).toFixed(2)
    : '';

  return {
    ticker: ocrResult.ticker || '',
    shares: ocrResult.shares !== null ? String(ocrResult.shares) : '',
    pricePerShareCents,
    tradeDate: ocrResult.tradeDate || today,
    direction: ocrResult.direction || 'buy',
    assetType: ocrResult.assetType || 'stock',
    feesCents,
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
  assetType: string;
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

  // assetType: required
  if (!fields.assetType) {
    errors.assetType = 'Asset type is required';
  }

  return errors;
}

/**
 * Map review screen field keys to OCR perFieldConfidence keys.
 * pricePerShareCents in the form maps to pricePerShare in OCR result.
 */
function mapFieldKeyToOCR(fieldKey: string): string {
  if (fieldKey === 'pricePerShareCents') return 'pricePerShare';
  return fieldKey;
}

/**
 * Get the per-field confidence for a specific field from AI extraction metadata.
 * Returns null if no AI metadata is available or the field is not tracked.
 */
export function getFieldConfidence(ocrResult: OCRResult | null, fieldKey: string): number | null {
  if (!ocrResult?.aiMeta?.perFieldConfidence) return null;
  const ocrKey = mapFieldKeyToOCR(fieldKey);
  const confidence = ocrResult.aiMeta.perFieldConfidence[ocrKey];
  if (confidence === undefined) return null;
  return confidence;
}

/**
 * Get the color tier for a confidence value.
 * Returns 'high' (>=0.7, green), 'medium' (0.3-0.69, yellow), 'low' (<0.3, red), or null.
 */
export function getConfidenceTier(confidence: number | null): 'high' | 'medium' | 'low' | null {
  if (confidence === null) return null;
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.3) return 'medium';
  return 'low';
}

/**
 * Hex colors for confidence tiers.
 */
export const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#059669',    // Green
  medium: '#D97706',  // Yellow/Amber
  low: '#DC2626',     // Red
};

/**
 * Check whether a field was missing from the OCR result.
 * When AI extraction metadata is available, uses per-field confidence
 * to determine if the field was confidently extracted (confidence > 0 = present).
 * Falls back to null-check for Phase 2 regex-only results.
 *
 * D-10: Confidence = 0 means field is missing and user must fill manually.
 * D-11: Low confidence (0.01-0.69) shows warning but allows save.
 */
export function isMissingFromOCR(ocrResult: OCRResult | null, fieldKey: string): boolean {
  if (!ocrResult) return false;

  // If AI metadata exists, use per-field confidence (D-10)
  const confidence = getFieldConfidence(ocrResult, fieldKey);
  if (confidence !== null) {
    return confidence === 0; // Missing if confidence is exactly 0
  }

  // Legacy: null-check for regex-only extraction (Phase 2)
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
    case 'assetType':
      return !ocrResult.assetType;
    case 'feesCents':
      return ocrResult.feesCents === null;
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
      const dollars = parseFloat(rawValue);
      if (isNaN(dollars)) return '\u2014';
      const cents = Math.round(dollars * 100);
      return formatCurrency(cents);
    }
    case 'assetType':
      return rawValue.charAt(0).toUpperCase() + rawValue.slice(1);
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
    assetType?: string;
  },
  errors: Record<string, string>
): boolean {
  return (
    fields.ticker.trim() !== '' &&
    fields.shares.trim() !== '' &&
    fields.pricePerShareCents.trim() !== '' &&
    fields.tradeDate.trim() !== '' &&
    fields.direction !== '' &&
    (fields.assetType ?? '') !== '' &&
    Object.keys(errors).length === 0
  );
}
