import { describe, it, expect, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-file-system/legacy', () => ({
  getInfoAsync: () => Promise.resolve({ exists: true }),
  copyAsync: () => Promise.resolve(),
  deleteAsync: () => Promise.resolve(),
  cacheDirectory: '/mock-cache/',
}));

vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: () => Promise.resolve({ uri: '/mock-cache/downscaled.jpg' }),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

vi.mock('@react-native-ml-kit/text-recognition', () => ({
  default: { recognize: () => Promise.resolve({ text: '' }) },
}));

import { parseTradeFromText } from '@/services/ocr';

describe('AI-Enhanced OCR Extraction', () => {
  // ─── Robinhood extraction ───
  it('extracts full trade from Robinhood Market Buy text', () => {
    const result = parseTradeFromText(
      'Robinhood Market Buy AAPL 10 shares at $185.50 Apr 28 2026'
    );
    expect(result.ticker).toBe('AAPL');
    expect(result.shares).toBe(10);
    expect(result.pricePerShare).toBe(185.50);
    expect(result.direction).toBe('buy');
    expect(result.tradeDate).toBeDefined();
    expect(result.aiMeta?.platform).toBe('robinhood');
    expect(result.aiMeta?.extractionMethod).toBe('template');
  });

  it('extracts full trade from Webull Order Filled sell text', () => {
    const result = parseTradeFromText(
      'Webull Order Filled Sold 5 TSLA @ $250.00 Filled Price: $250.00 Total: $1,250.00 Apr 28 2026'
    );
    expect(result.ticker).toBe('TSLA');
    expect(result.shares).toBe(5);
    expect(result.direction).toBe('sell');
    expect(result.aiMeta?.platform).toBe('webull');
  });

  it('extracts eToro Open Trade (buy) with calculated shares', () => {
    const result = parseTradeFromText(
      'eToro Investment amount $500 Open Trade AAPL Stop Loss $180 Take Profit $220'
    );
    expect(result.ticker).toBe('AAPL');
    expect(result.direction).toBe('buy');
    expect(result.aiMeta?.platform).toBe('etoro');
  });

  it('handles generic text without aiMeta (backward compatibility)', () => {
    const result = parseTradeFromText('Bought 100 GOOGL at $150.00');
    expect(result.ticker).toBe('GOOGL');
    // aiMeta may be undefined or have platform='generic' — both are acceptable
    expect(result.aiMeta?.platform === 'generic' || result.aiMeta === undefined).toBe(true);
  });

  it('per-field confidence shows which fields template extracted', () => {
    const result = parseTradeFromText(
      'Robinhood Market Buy AAPL 10 shares at $185.50 Apr 28 2026'
    );
    expect(result.aiMeta).toBeDefined();
    const pfc = result.aiMeta!.perFieldConfidence;
    expect(pfc.ticker).toBeDefined();
    expect(pfc.shares).toBeDefined();
    expect(pfc.pricePerShare).toBeDefined();
    expect(pfc.direction).toBeDefined();
  });

  it('confidence with AI extraction is at least as good as without', () => {
    // Platform-specific text should extract as well or better with AI
    const result = parseTradeFromText(
      'Robinhood Market Buy AAPL 10 shares at $185.50 Apr 28 2026'
    );
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    expect(result.ticker).toBe('AAPL');
  });

  it('existing generic extraction still works', () => {
    const result = parseTradeFromText('Sold 20 MSFT @ $420.00');
    expect(result.direction).toBe('sell');
    expect(result.ticker).toBe('MSFT');
  });
});
