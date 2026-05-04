import { describe, it, expect } from 'vitest';
import {
  evaluateAccuracy,
  compareExtractions,
  formatAccuracyReport,
  formatComparisonReport,
} from '@/services/evaluator';
import type { OCRResult } from '@/types';

const perfectGroundTruth: OCRResult = {
  ticker: 'AAPL', shares: 10, pricePerShare: 185.50,
  tradeDate: '2026-04-28', direction: 'buy', feesCents: null,
  rawText: 'Bought 10 AAPL at $185.50',
  confidence: 1.0,
};

const perfectExtracted: OCRResult = {
  ticker: 'AAPL', shares: 10, pricePerShare: 185.50,
  tradeDate: '2026-04-28', direction: 'buy', feesCents: null,
  rawText: 'Bought 10 AAPL at $185.50',
  confidence: 1.0,
  aiMeta: { platform: 'robinhood', extractionMethod: 'template', platformConfidence: 1.0, perFieldConfidence: { ticker: 1, shares: 1, pricePerShare: 1, tradeDate: 1, direction: 1 } },
};

describe('evaluateAccuracy', () => {
  it('returns 1.0 for perfect match', () => {
    const report = evaluateAccuracy(perfectGroundTruth, perfectExtracted);
    expect(report.overallAccuracy).toBe(1.0);
    expect(report.correctFields).toBe(5);
  });

  it('returns 0.75 when 3 of 4 main fields match', () => {
    const extracted: OCRResult = { ...perfectExtracted, ticker: 'WRONG' };
    const report = evaluateAccuracy(perfectGroundTruth, extracted);
    expect(report.overallAccuracy).toBe(0.8);
    expect(report.correctFields).toBe(4);
  });

  it('handles nulls correctly — null in both = correct', () => {
    const gt: OCRResult = { ...perfectGroundTruth, direction: null, feesCents: null, rawText: '', confidence: 0 };
    const ex: OCRResult = { ...perfectExtracted, direction: null, feesCents: null, rawText: '', confidence: 0 };
    const report = evaluateAccuracy(gt, ex);
    expect(report.overallAccuracy).toBe(1.0);
  });

  it('handles null mismatch — null vs value = miss', () => {
    const report = evaluateAccuracy(perfectGroundTruth, { ...perfectExtracted, direction: null, feesCents: null });
    expect(report.overallAccuracy).toBeLessThan(1.0);
    const dirField = report.fieldAccuracies.find(f => f.field === 'direction');
    expect(dirField?.correct).toBe(0);
  });

  it('uses platform and extraction method from aiMeta', () => {
    const report = evaluateAccuracy(perfectGroundTruth, perfectExtracted);
    expect(report.platform).toBe('robinhood');
    expect(report.extractionMethod).toBe('template');
  });

  it('defaults to generic/regex when no aiMeta', () => {
    const extracted: OCRResult = { ...perfectExtracted, aiMeta: undefined };
    const report = evaluateAccuracy(perfectGroundTruth, extracted);
    expect(report.platform).toBe('generic');
    expect(report.extractionMethod).toBe('regex');
  });
});

describe('compareExtractions', () => {
  it('shows AI improvement when AI corrects regex errors', () => {
    const regexResult: OCRResult = { ...perfectExtracted, ticker: null, shares: null, aiMeta: undefined };
    const aiResult: OCRResult = { ...perfectExtracted };
    const report = compareExtractions(regexResult, aiResult, perfectGroundTruth);

    expect(report.improvement).toBeGreaterThan(0);
    expect(report.verdict).toBe('ai_wins');
    expect(report.fieldsImproved).toContain('ticker');
    expect(report.fieldsImproved).toContain('shares');
  });

  it('shows tie when both match perfectly', () => {
    const report = compareExtractions(perfectExtracted, perfectExtracted, perfectGroundTruth);
    expect(report.verdict).toBe('tie');
    expect(report.improvement).toBe(0);
  });
});

describe('formatAccuracyReport', () => {
  it('returns human-readable string with percentages', () => {
    const report = evaluateAccuracy(perfectGroundTruth, perfectExtracted);
    const str = formatAccuracyReport(report);
    expect(str).toContain('100%');
    expect(str).toContain('robinhood');
    expect(str).toContain('template');
  });
});

describe('formatComparisonReport', () => {
  it('reports AI win with improvement details', () => {
    const regexResult: OCRResult = { ...perfectExtracted, ticker: null, aiMeta: undefined };
    const aiResult: OCRResult = { ...perfectExtracted };
    const report = compareExtractions(regexResult, aiResult, perfectGroundTruth);
    const str = formatComparisonReport(report);
    expect(str).toContain('AI wins');
    expect(str).toContain('improvement');
    expect(str).toContain('ticker');
  });
});
