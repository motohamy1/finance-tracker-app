import { describe, it, expect } from 'vitest';
import { detectPlatform, getConfidenceKeywords } from '@/services/platformDetector';
import type { Platform } from '@/types';

describe('detectPlatform', () => {
  it('detects robinhood from Market Buy text', () => {
    const result = detectPlatform('Robinhood Market Buy AAPL 10 shares at $185.50');
    expect(result.platform).toBe('robinhood');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('detects webull from Order Filled text', () => {
    const result = detectPlatform('Webull Order Filled: Bought 5 TSLA @ $250.00 Filled Price: $250.00 Total Cost: $1,250.00');
    expect(result.platform).toBe('webull');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('detects etoro from Investment amount text', () => {
    const result = detectPlatform('eToro Investment amount $500 Open Trade AAPL Stop Loss $180');
    expect(result.platform).toBe('etoro');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('returns generic for text with no platform indicators', () => {
    const result = detectPlatform('Bought 100 AAPL at $150.00');
    expect(result.platform).toBe('generic');
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('robinhood wins when explicit platform mention + generic buy pattern', () => {
    const result = detectPlatform('Robinhood Bought 100 AAPL at $150');
    expect(result.platform).toBe('robinhood');
  });

  it('returns generic with 0 confidence for empty string', () => {
    const result = detectPlatform('');
    expect(result.platform).toBe('generic');
    expect(result.confidence).toBe(0);
  });

  it('higher confidence for strong matches vs weak matches', () => {
    const strong = detectPlatform('Robinhood Market Buy Order Buy Limit Price Day Order GTC AAPL 10 shares at $185.50');
    const weak = detectPlatform('Robinhood some trade text with no other patterns');
    expect(strong.confidence).toBeGreaterThan(weak.confidence);
    expect(strong.confidence).toBeGreaterThan(0.9);
  });

  it('textPatterns support regex — RH\\b matches "RH " but not "RHI"', () => {
    const withRH = detectPlatform('RH Market Buy AAPL');
    const withRHI = detectPlatform('RHI Market Buy AAPL');
    expect(withRH.platform).toBe('robinhood');
    expect(withRHI.platform).toBe('generic');
  });

  it('detects etoro from text mentioning eToro', () => {
    const result = detectPlatform('eToro Investment amount $500 Open Trade AAPL');
    expect(result.platform).toBe('etoro');
  });
});

describe('getConfidenceKeywords', () => {
  it('returns matching keywords for robinhood text', () => {
    const keywords = getConfidenceKeywords('Robinhood Market Buy AAPL at $185.50', 'robinhood');
    expect(keywords).toContain('Robinhood');
    expect(keywords).toContain('Market Buy');
  });

  it('returns empty array for non-matching platform', () => {
    const keywords = getConfidenceKeywords('Webull Order Filled', 'robinhood');
    expect(keywords).toEqual([]);
  });

  it('returns empty array for empty text', () => {
    const keywords = getConfidenceKeywords('', 'robinhood');
    expect(keywords).toEqual([]);
  });
});
