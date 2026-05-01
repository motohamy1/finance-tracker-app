import { describe, it, expect } from 'vitest';
import type { OCRResult, TradeDirection } from '@/types';

// ─── Pure utility functions (to be implemented in src/utils/tradeValidation.ts) ───
// These are declared here in the test so they FAIL first (RED phase).
// Once GREEN phase implements them, these imports will work.

import {
  parseOCRToInitialValues,
  validateTradeFields,
  isMissingFromOCR,
  formatTradeFieldDisplay,
  canSaveTrade,
} from '@/utils/tradeValidation';

// ─── OCR Result Parsing Tests ───
describe('parseOCRToInitialValues', () => {
  it('extracts ticker, shares, price, date, direction from OCR result', () => {
    const ocrResult: OCRResult = {
      ticker: 'AAPL',
      shares: 10,
      pricePerShare: 185.50,
      tradeDate: '2026-04-28',
      direction: 'buy',
      rawText: 'Bought 10 AAPL @ $185.50',
      confidence: 0.95,
    };

    const values = parseOCRToInitialValues(ocrResult);

    expect(values.ticker).toBe('AAPL');
    expect(values.shares).toBe('10');
    expect(values.pricePerShareCents).toBe('18550'); // dollars * 100 = cents
    expect(values.tradeDate).toBe('2026-04-28');
    expect(values.direction).toBe('buy');
    expect(values.feesCents).toBe('');
    expect(values.notes).toBe('');
  });

  it('converts price per share from dollars to cents', () => {
    const ocrResult: OCRResult = {
      ticker: 'MSFT',
      shares: 50,
      pricePerShare: 250.75,
      tradeDate: '2026-05-01',
      direction: 'sell',
      rawText: 'Sold 50 MSFT @ $250.75',
      confidence: 0.9,
    };

    const values = parseOCRToInitialValues(ocrResult);
    expect(values.pricePerShareCents).toBe('25075'); // 250.75 * 100 = 25075
  });

  it('defaults to today when tradeDate is null', () => {
    const ocrResult: OCRResult = {
      ticker: 'TSLA',
      shares: 5,
      pricePerShare: 200.00,
      tradeDate: null,
      direction: 'buy',
      rawText: 'TSLA 5 shares',
      confidence: 0.5,
    };

    const today = new Date().toISOString().split('T')[0];
    const values = parseOCRToInitialValues(ocrResult);

    expect(values.tradeDate).toBe(today);
  });

  it('defaults direction to buy when OCR direction is null', () => {
    const ocrResult: OCRResult = {
      ticker: 'NVDA',
      shares: 20,
      pricePerShare: 900.00,
      tradeDate: '2026-04-30',
      direction: null,
      rawText: 'NVDA 20 @ 900',
      confidence: 0.6,
    };

    const values = parseOCRToInitialValues(ocrResult);
    expect(values.direction).toBe('buy');
  });

  it('returns empty strings for null fields (partial extraction)', () => {
    const ocrResult: OCRResult = {
      ticker: null,
      shares: null,
      pricePerShare: null,
      tradeDate: null,
      direction: null,
      rawText: 'garbage text',
      confidence: 0.1,
    };

    const values = parseOCRToInitialValues(ocrResult);

    expect(values.ticker).toBe('');
    expect(values.shares).toBe('');
    expect(values.pricePerShareCents).toBe('');
    expect(values.tradeDate).toBeDefined(); // defaults to today
    expect(values.direction).toBe('buy');
  });

  it('returns default empty values when ocrResult is null', () => {
    const today = new Date().toISOString().split('T')[0];
    const values = parseOCRToInitialValues(null);

    expect(values.ticker).toBe('');
    expect(values.shares).toBe('');
    expect(values.pricePerShareCents).toBe('');
    expect(values.tradeDate).toBe(today);
    expect(values.direction).toBe('buy');
    expect(values.feesCents).toBe('');
    expect(values.notes).toBe('');
  });
});

// ─── Field Validation Tests ───
describe('validateTradeFields', () => {
  it('returns no errors for valid trade data', () => {
    const fields = {
      ticker: 'AAPL',
      shares: '100',
      pricePerShareCents: '15000',
      tradeDate: '2026-05-01',
      direction: 'buy' as TradeDirection,
      feesCents: '',
      notes: '',
    };

    const errors = validateTradeFields(fields);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('validates ticker: required and must be 1-5 uppercase letters', () => {
    // Empty ticker
    let errors = validateTradeFields({
      ticker: '', shares: '10', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.ticker).toBeDefined();
    expect(errors.ticker).toContain('required');

    // Invalid: too long
    errors = validateTradeFields({
      ticker: 'AAPLXX', shares: '10', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.ticker).toBeDefined();

    // Invalid: lowercase (function should uppercase it internally)
    // Actually, the function validates as-is. Let's test lowercase.
    errors = validateTradeFields({
      ticker: 'aapl', shares: '10', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    // Lowercase should be valid (uppercasing happens before save, not validation)
    expect(errors.ticker).toBeUndefined();
  });

  it('validates shares: required and must be positive integer', () => {
    // Empty
    let errors = validateTradeFields({
      ticker: 'AAPL', shares: '', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.shares).toBeDefined();

    // Zero
    errors = validateTradeFields({
      ticker: 'AAPL', shares: '0', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.shares).toBeDefined();

    // Negative
    errors = validateTradeFields({
      ticker: 'AAPL', shares: '-5', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.shares).toBeDefined();
  });

  it('validates pricePerShareCents: required and must be numeric', () => {
    // Empty
    let errors = validateTradeFields({
      ticker: 'AAPL', shares: '10', pricePerShareCents: '',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.pricePerShareCents).toBeDefined();

    // Valid numeric (in cents)
    errors = validateTradeFields({
      ticker: 'AAPL', shares: '10', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.pricePerShareCents).toBeUndefined();
  });

  it('validates tradeDate: required', () => {
    const errors = validateTradeFields({
      ticker: 'AAPL', shares: '10', pricePerShareCents: '15000',
      tradeDate: '', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.tradeDate).toBeDefined();
  });

  it('validates direction: required', () => {
    // direction as empty string (should not happen with toggle, but test it)
    const errors = validateTradeFields({
      ticker: 'AAPL', shares: '10', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: '' as TradeDirection,
      feesCents: '', notes: '',
    });
    expect(errors.direction).toBeDefined();
  });

  it('feesCents and notes are optional (no errors when empty)', () => {
    const errors = validateTradeFields({
      ticker: 'AAPL', shares: '10', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy', feesCents: '', notes: '',
    });
    expect(errors.feesCents).toBeUndefined();
    expect(errors.notes).toBeUndefined();
  });
});

// ─── Missing-from-OCR Detection Tests ───
describe('isMissingFromOCR', () => {
  const fullOCR: OCRResult = {
    ticker: 'AAPL',
    shares: 10,
    pricePerShare: 150.00,
    tradeDate: '2026-05-01',
    direction: 'buy',
    rawText: 'AAPL 10 buy',
    confidence: 1.0,
  };

  const partialOCR: OCRResult = {
    ticker: 'AAPL',
    shares: null,        // missing
    pricePerShare: null, // missing
    tradeDate: null,     // missing
    direction: null,     // missing
    rawText: 'AAPL',
    confidence: 0.2,
  };

  it('returns false for all fields when OCR is null', () => {
    expect(isMissingFromOCR(null, 'ticker')).toBe(false);
    expect(isMissingFromOCR(null, 'shares')).toBe(false);
  });

  it('returns false for fields that were detected by OCR', () => {
    expect(isMissingFromOCR(fullOCR, 'ticker')).toBe(false);
    expect(isMissingFromOCR(fullOCR, 'shares')).toBe(false);
    expect(isMissingFromOCR(fullOCR, 'pricePerShareCents')).toBe(false);
    expect(isMissingFromOCR(fullOCR, 'tradeDate')).toBe(false);
    expect(isMissingFromOCR(fullOCR, 'direction')).toBe(false);
  });

  it('returns true for fields that were NOT detected by OCR', () => {
    expect(isMissingFromOCR(partialOCR, 'shares')).toBe(true);
    expect(isMissingFromOCR(partialOCR, 'pricePerShareCents')).toBe(true);
    expect(isMissingFromOCR(partialOCR, 'tradeDate')).toBe(true);
    expect(isMissingFromOCR(partialOCR, 'direction')).toBe(true);
  });

  it('returns false for fields that OCR does not attempt to detect (fees, notes)', () => {
    expect(isMissingFromOCR(fullOCR, 'feesCents')).toBe(false);
    expect(isMissingFromOCR(fullOCR, 'notes')).toBe(false);
    expect(isMissingFromOCR(partialOCR, 'feesCents')).toBe(false);
    expect(isMissingFromOCR(partialOCR, 'notes')).toBe(false);
  });
});

// ─── Display Formatting Tests ───
describe('formatTradeFieldDisplay', () => {
  it('returns "—" for empty values', () => {
    expect(formatTradeFieldDisplay('ticker', '')).toBe('—');
    expect(formatTradeFieldDisplay('shares', '')).toBe('—');
  });

  it('uppercases ticker display', () => {
    expect(formatTradeFieldDisplay('ticker', 'aapl')).toBe('AAPL');
  });

  it('appends "shares" to share count', () => {
    expect(formatTradeFieldDisplay('shares', '100')).toBe('100 shares');
    expect(formatTradeFieldDisplay('shares', '1')).toBe('1 shares');
  });

  it('formats price as currency', () => {
    // 15000 cents = $150.00
    const result = formatTradeFieldDisplay('pricePerShareCents', '15000');
    expect(result).toBe('$150.00');
  });

  it('returns raw value for unrecognized field keys', () => {
    expect(formatTradeFieldDisplay('tradeDate', '2026-05-01')).toBe('2026-05-01');
    expect(formatTradeFieldDisplay('notes', 'Test note')).toBe('Test note');
  });
});

// ─── Can-Save Computation Tests ───
describe('canSaveTrade', () => {
  it('returns true when all required fields are non-empty and no errors', () => {
    const fields = {
      ticker: 'AAPL',
      shares: '10',
      pricePerShareCents: '15000',
      tradeDate: '2026-05-01',
      direction: 'buy' as TradeDirection,
    };
    const errors: Record<string, string> = {};

    expect(canSaveTrade(fields, errors)).toBe(true);
  });

  it('returns false when ticker is empty', () => {
    const fields = {
      ticker: '', shares: '10', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy' as TradeDirection,
    };
    const errors: Record<string, string> = {};

    expect(canSaveTrade(fields, errors)).toBe(false);
  });

  it('returns false when shares is empty', () => {
    const fields = {
      ticker: 'AAPL', shares: '', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy' as TradeDirection,
    };
    const errors: Record<string, string> = {};

    expect(canSaveTrade(fields, errors)).toBe(false);
  });

  it('returns false when there are validation errors', () => {
    const fields = {
      ticker: 'AAPL', shares: '10', pricePerShareCents: '15000',
      tradeDate: '2026-05-01', direction: 'buy' as TradeDirection,
    };
    const errors = { ticker: 'Invalid ticker' };

    expect(canSaveTrade(fields, errors)).toBe(false);
  });

  it('returns false when pricePerShareCents is empty', () => {
    const fields = {
      ticker: 'AAPL', shares: '10', pricePerShareCents: '',
      tradeDate: '2026-05-01', direction: 'buy' as TradeDirection,
    };
    const errors: Record<string, string> = {};

    expect(canSaveTrade(fields, errors)).toBe(false);
  });

  it('returns false when tradeDate is empty', () => {
    const fields = {
      ticker: 'AAPL', shares: '10', pricePerShareCents: '15000',
      tradeDate: '', direction: 'buy' as TradeDirection,
    };
    const errors: Record<string, string> = {};

    expect(canSaveTrade(fields, errors)).toBe(false);
  });
});
