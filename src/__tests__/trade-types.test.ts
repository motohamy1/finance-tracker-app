import { describe, it, expect } from 'vitest';
import type { Trade, TradeFormData, TradeDirection, OCRResult, FailedOCRLog } from '@/types';

describe('Trade Types', () => {
  it('Trade interface has all required fields', () => {
    // Type-level compile check: construct a valid Trade object (using type assertion for test)
    const trade: Trade = {
      id: 'test-uuid',
      ticker: 'AAPL',
      shares: 100,
      pricePerShareCents: 15000,
      tradeDate: '2026-05-01',
      direction: 'buy',
      feesCents: null,
      thumbnailUri: null,
      notes: null,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    };

    // Verify all 10 fields exist on the object
    const fields = Object.keys(trade);
    expect(fields).toContain('id');
    expect(fields).toContain('ticker');
    expect(fields).toContain('shares');
    expect(fields).toContain('pricePerShareCents');
    expect(fields).toContain('tradeDate');
    expect(fields).toContain('direction');
    expect(fields).toContain('feesCents');
    expect(fields).toContain('thumbnailUri');
    expect(fields).toContain('notes');
    expect(fields).toContain('createdAt');
    expect(fields).toContain('updatedAt');

    expect(trade.ticker).toBe('AAPL');
    expect(trade.shares).toBe(100);
    expect(trade.direction).toBe('buy');
  });

  it('TradeFormData interface has all required fields with string types for inputs', () => {
    const formData: TradeFormData = {
      ticker: 'AAPL',
      shares: '100',
      pricePerShareCents: '15000',
      tradeDate: '2026-05-01',
      direction: 'buy',
      feesCents: '',
      notes: '',
    };

    const fields = Object.keys(formData);
    expect(fields).toContain('ticker');
    expect(fields).toContain('shares');
    expect(fields).toContain('pricePerShareCents');
    expect(fields).toContain('tradeDate');
    expect(fields).toContain('direction');
    expect(fields).toContain('feesCents');
    expect(fields).toContain('notes');

    // shares is string for form input
    expect(typeof formData.shares).toBe('string');
  });

  it('TradeDirection type allows buy and sell values', () => {
    // Compile-time check: these assignments must be valid
    const buyDirection: TradeDirection = 'buy';
    const sellDirection: TradeDirection = 'sell';

    expect(buyDirection).toBe('buy');
    expect(sellDirection).toBe('sell');
  });

  it('OCRResult interface has all required fields', () => {
    const ocrResult: OCRResult = {
      ticker: 'AAPL',
      shares: 100,
      pricePerShare: 150.00,
      tradeDate: '2026-05-01',
      direction: 'buy',
      rawText: 'BUY 100 AAPL @ $150.00',
      confidence: 0.95,
    };

    const fields = Object.keys(ocrResult);
    expect(fields).toContain('ticker');
    expect(fields).toContain('shares');
    expect(fields).toContain('pricePerShare');
    expect(fields).toContain('tradeDate');
    expect(fields).toContain('direction');
    expect(fields).toContain('rawText');
    expect(fields).toContain('confidence');

    expect(ocrResult.confidence).toBeGreaterThanOrEqual(0);
    expect(ocrResult.confidence).toBeLessThanOrEqual(1);
  });

  it('FailedOCRLog interface has all required fields', () => {
    const failedLog: FailedOCRLog = {
      id: 'test-uuid',
      imageUri: 'file:///screenshot.png',
      rawText: 'garbled text from OCR',
      errorMessage: 'Insufficient text quality',
      createdAt: '2026-05-01T00:00:00.000Z',
    };

    const fields = Object.keys(failedLog);
    expect(fields).toContain('id');
    expect(fields).toContain('imageUri');
    expect(fields).toContain('rawText');
    expect(fields).toContain('errorMessage');
    expect(fields).toContain('createdAt');

    expect(failedLog.errorMessage).toBe('Insufficient text quality');
  });
});
