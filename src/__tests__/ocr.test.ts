import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks for external dependencies ───
const {
  mockFileSystemGetInfo,
  mockFileSystemDelete,
  mockFileSystemCopyAsync,
} = vi.hoisted(() => ({
  mockFileSystemGetInfo: vi.fn(),
  mockFileSystemDelete: vi.fn(),
  mockFileSystemCopyAsync: vi.fn(),
}));

const { mockImageManipulator } = vi.hoisted(() => ({
  mockImageManipulator: vi.fn(),
}));

const { mockTextRecognition } = vi.hoisted(() => ({
  mockTextRecognition: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-file-system/legacy', () => ({
  getInfoAsync: mockFileSystemGetInfo,
  copyAsync: mockFileSystemCopyAsync,
  deleteAsync: (...args: unknown[]) => {
    mockFileSystemDelete(...args);
    return Promise.resolve();
  },
  cacheDirectory: '/mock-cache/',
}));

vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: mockImageManipulator,
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

vi.mock('@react-native-ml-kit/text-recognition', () => ({
  default: { recognize: mockTextRecognition },
}));

import {
  processScreenshot,
  parseTradeFromText,
  cancelOCR,
} from '@/services/ocr';
import type { OCRResult, TradeDirection } from '@/types';

// ─── Helpers ───
function assertOCRResult(result: OCRResult) {
  expect(result).toBeDefined();
  expect(typeof result.rawText).toBe('string');
  expect(typeof result.confidence).toBe('number');
  expect(result.confidence).toBeGreaterThanOrEqual(0);
  expect(result.confidence).toBeLessThanOrEqual(1);
}

// ─── parseTradeFromText tests (pure function, no mocks needed) ───
describe('parseTradeFromText', () => {
  it('extracts ticker, shares, price, date, and direction from buy trade text', () => {
    const rawText = 'Bought 10 shares of AAPL at $185.50 on Apr 28';

    const result = parseTradeFromText(rawText);

    expect(result.ticker).toBe('AAPL');
    expect(result.shares).toBe(10);
    expect(result.pricePerShare).toBe(185.50);
    expect(result.direction).toBe('buy');
    expect(result.tradeDate).toBeDefined();
    expect(result.rawText).toBe(rawText);
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('extracts direction="sell" from sell trade text', () => {
    const rawText = 'Sold 5 TSLA @ $250.00';

    const result = parseTradeFromText(rawText);

    expect(result.direction).toBe('sell');
    expect(result.ticker).toBe('TSLA');
    expect(result.shares).toBe(5);
  });

  it('returns low confidence and null fields for garbage text', () => {
    const rawText = 'garbage text with no trade data';

    const result = parseTradeFromText(rawText);

    assertOCRResult(result);
    expect(result.ticker).toBeNull();
    expect(result.shares).toBeNull();
    expect(result.pricePerShare).toBeNull();
    expect(result.direction).toBeNull();
    expect(result.confidence).toBeLessThan(0.3);
  });

  it('cleans ticker artifacts: $AAPL% → AAPL', () => {
    const rawText = '$AAPL%  bought';

    const result = parseTradeFromText(rawText);

    expect(result.ticker).toBe('AAPL');
  });

  it('filters OCR noise words (BUY, SELL, LMT, QTY, etc.) from ticker candidates', () => {
    // "BUY" and "SELL" are common OCR noise, not tickers
    const rawText = 'BUY 10 QTY of AAPL';

    const result = parseTradeFromText(rawText);

    expect(result.ticker).toBe('AAPL');
    // BUY and QTY should not be tickers
    expect(result.ticker).not.toBe('BUY');
    expect(result.ticker).not.toBe('QTY');
  });

  it('handles empty string gracefully', () => {
    const result = parseTradeFromText('');

    assertOCRResult(result);
    expect(result.ticker).toBeNull();
    expect(result.shares).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects direction correctly when only buy keywords present', () => {
    const result = parseTradeFromText('Purchased NVDA today');
    expect(result.direction).toBe('buy');
  });

  it('detects direction correctly when only sell keywords present', () => {
    const result = parseTradeFromText('Sold MSFT last week');
    expect(result.direction).toBe('sell');
  });

  it('returns direction=null when both buy and sell keywords present (ambiguous)', () => {
    const result = parseTradeFromText('Bought AAPL and sold TSLA');
    expect(result.direction).toBeNull();
  });

  it('returns direction=null when neither buy nor sell keywords present', () => {
    const result = parseTradeFromText('AAPL 100 shares at $150');
    expect(result.direction).toBeNull();
  });

  it('falls back to today when no date found in text', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = parseTradeFromText('AAPL no date');
    expect(result.tradeDate).toBe(today);
  });

  it('extracts date in YYYY-MM-DD format', () => {
    const result = parseTradeFromText('AAPL 2026-04-28');
    expect(result.tradeDate).toBe('2026-04-28');
  });

  it('computes confidence as proportion of fields found', () => {
    // All 4 fields: ticker, shares, price, direction = 4/4 = 1.0
    const fullResult = parseTradeFromText(
      'Bought 100 AAPL at $150.00 Apr 28'
    );
    expect(fullResult.confidence).toBe(1.0);

    // Only 1 field: ticker = 1/4 = 0.25
    const partialResult = parseTradeFromText('AAPL');
    expect(partialResult.confidence).toBe(0.25);

    // No fields: 0/4 = 0
    const noResult = parseTradeFromText('gibberish');
    expect(noResult.confidence).toBe(0);
  });
});

// ─── processScreenshot tests (with mocked dependencies) ───
describe('processScreenshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cancellation state
    cancelOCR();
    // Silence console.warn in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns OCRResult with rawText populated for valid image', async () => {
    const testImageUri = 'file:///test/screenshot.png';
    const downscaledUri = 'file:///test/screenshot-downscaled.jpg';
    const mockRawText = 'BUY 100 AAPL @ $150.00 2026-05-01';

    // Mock: copy to cache succeeds (uri doesn't start with cacheDirectory)
    mockFileSystemCopyAsync.mockResolvedValueOnce(undefined);

    // Mock: file exists, reasonable size (checked on cached URI)
    mockFileSystemGetInfo.mockResolvedValueOnce({
      exists: true,
      size: 1024 * 1024, // 1 MB
    });

    // Mock: return downscaled image
    mockImageManipulator.mockResolvedValueOnce({ uri: downscaledUri });

    // Mock: ML Kit returns text
    mockTextRecognition.mockResolvedValueOnce({ text: mockRawText });

    const result = await processScreenshot(testImageUri);

    assertOCRResult(result);
    expect(result.rawText).toContain('BUY');
    expect(mockFileSystemCopyAsync).toHaveBeenCalledWith({
      from: testImageUri,
      to: expect.stringMatching(/^\/mock-cache\/ocr-stable-\d+\.jpg$/),
    });
    expect(mockFileSystemGetInfo).toHaveBeenCalled();
    expect(mockImageManipulator).toHaveBeenCalled();
    expect(mockTextRecognition).toHaveBeenCalledWith(downscaledUri);
  });

  it('throws descriptive error for invalid/nonexistent image', async () => {
    // Copy fails because source doesn't exist (falls back to original URI)
    mockFileSystemCopyAsync.mockRejectedValueOnce(new Error('Copy failed'));

    // First getInfoAsync on cached URI (workingUri) returns not exists
    mockFileSystemGetInfo.mockResolvedValueOnce({
      exists: false,
      size: 0,
    });
    // Fallback getInfoAsync on original imageUri also returns not exists
    mockFileSystemGetInfo.mockResolvedValueOnce({
      exists: false,
      size: 0,
    });

    await expect(
      processScreenshot('file:///nonexistent.png')
    ).rejects.toThrow('Image file not found');
  });

  it('warns on large images (>20MB) but still processes', async () => {
    const testImageUri = 'file:///test/large.png';
    const downscaledUri = 'file:///test/large-downscaled.jpg';

    mockFileSystemCopyAsync.mockResolvedValueOnce(undefined);
    mockFileSystemGetInfo.mockResolvedValueOnce({
      exists: true,
      size: 30 * 1024 * 1024, // 30 MB
    });
    mockImageManipulator.mockResolvedValueOnce({ uri: downscaledUri });
    mockTextRecognition.mockResolvedValueOnce({ text: 'AAPL' });

    const result = await processScreenshot(testImageUri);

    expect(console.warn).toHaveBeenCalled();
    assertOCRResult(result);
  });

  it('throws on cancellation before OCR', async () => {
    const testImageUri = 'file:///test/screenshot.png';
    const downscaledUri = 'file:///test/screenshot-downscaled.jpg';

    mockFileSystemCopyAsync.mockResolvedValueOnce(undefined);
    mockFileSystemGetInfo.mockResolvedValueOnce({
      exists: true,
      size: 1024,
    });
    mockImageManipulator.mockResolvedValueOnce({ uri: downscaledUri });

    // Start processing (don't await) — cancel while it's mid-flight
    const promise = processScreenshot(testImageUri);
    // Cancel after processScreenshot has started but before ML Kit runs.
    // The mocks resolve synchronously through microtasks; calling cancelOCR()
    // after processScreenshot yields at its first await sets the flag.
    cancelOCR();

    await expect(promise).rejects.toThrow(
      'OCR cancelled by user'
    );

    // ML Kit should NOT have been called
    expect(mockTextRecognition).not.toHaveBeenCalled();
  });
});

// ─── cancelOCR tests ───
describe('cancelOCR', () => {
  it('exports cancelOCR function', () => {
    expect(typeof cancelOCR).toBe('function');
  });
});
