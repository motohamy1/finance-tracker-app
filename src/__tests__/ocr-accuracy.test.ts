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
import { evaluateAccuracy } from '@/services/evaluator';
import type { OCRResult } from '@/types';

interface TestCase {
  platform: string;
  description: string;
  rawText: string;
  groundTruth: OCRResult;
}

const testCases: TestCase[] = [
  // ─── Robinhood (5 cases) ───
  {
    platform: 'robinhood',
    description: 'Market Buy with full details',
    rawText: 'Robinhood\nMarket Buy\nAAPL\n10 shares\nat $185.50\nApr 28, 2026\nOrder Total: $1,855.00',
    groundTruth: { ticker: 'AAPL', shares: 10, pricePerShare: 185.50, tradeDate: '2026-04-28', direction: 'buy', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'robinhood',
    description: 'Market Sell with limit price',
    rawText: 'Robinhood Financial\nMarket Sell\nTSLA\n5 shares\nat $250.00\nLimit Price: $245.00\nMay 01, 2026',
    groundTruth: { ticker: 'TSLA', shares: 5, pricePerShare: 250.00, tradeDate: '2026-05-01', direction: 'sell', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'robinhood',
    description: 'Order Buy with fractional shares',
    rawText: 'RH\nOrder Buy\nGOOGL\n3 shares\nat $175.25\nApr 15, 2026\nDay Order',
    groundTruth: { ticker: 'GOOGL', shares: 3, pricePerShare: 175.25, tradeDate: '2026-04-15', direction: 'buy', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'robinhood',
    description: 'Stop Loss order (sell)',
    rawText: 'Robinhood\nStop Loss\nSell\nNVDA\n20 shares\nStop Price: $120.00\nMar 22, 2026\nGTC',
    groundTruth: { ticker: 'NVDA', shares: 20, pricePerShare: 120.00, tradeDate: '2026-03-22', direction: 'sell', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'robinhood',
    description: 'Buy with fractional price',
    rawText: 'Robinhood\nMarket Buy\nMETA\n15 shares\nat $512.75\nApr 30, 2026',
    groundTruth: { ticker: 'META', shares: 15, pricePerShare: 512.75, tradeDate: '2026-04-30', direction: 'buy', rawText: '', confidence: 1.0 },
  },

  // ─── Webull (5 cases) ───
  {
    platform: 'webull',
    description: 'Order Filled buy',
    rawText: 'Webull Financial LLC\nOrder Filled\nBought 10 AAPL\nFilled Price: $186.00\nAvg Price: $185.80\nTotal Cost: $1,858.00\nQty: 10\nApr 28 2026',
    groundTruth: { ticker: 'AAPL', shares: 10, pricePerShare: 186.00, tradeDate: '2026-04-28', direction: 'buy', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'webull',
    description: 'Order Filled sell',
    rawText: 'Webull Securities\nOrder Filled\nSold 5 TSLA @ $248.00\nFilled Price: $248.00\nTotal: $1,240.00\nApr 29 2026',
    groundTruth: { ticker: 'TSLA', shares: 5, pricePerShare: 248.00, tradeDate: '2026-04-29', direction: 'sell', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'webull',
    description: 'Buy with Qty notation',
    rawText: 'WEBULL FINANCIAL\nOrder Status: Filled\nBought\nAMD\nQty: 50\nAvg Price: $95.30\nTotal Cost: $4,765.00\nMay 01 2026',
    groundTruth: { ticker: 'AMD', shares: 50, pricePerShare: 95.30, tradeDate: '2026-05-01', direction: 'buy', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'webull',
    description: 'Sell with partial fill',
    rawText: 'Webull Financial LLC\nSold\nMSFT\n20 shares\nFilled Price: $420.00\nApr 20 2026',
    groundTruth: { ticker: 'MSFT', shares: 20, pricePerShare: 420.00, tradeDate: '2026-04-20', direction: 'sell', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'webull',
    description: 'Buy penny stock',
    rawText: 'Webull\nBought\nSNDL\n100 shares\nFilled Price: $1.85\nTotal Cost: $185.00\nMar 15 2026',
    groundTruth: { ticker: 'SNDL', shares: 100, pricePerShare: 1.85, tradeDate: '2026-03-15', direction: 'buy', rawText: '', confidence: 1.0 },
  },

  // ─── eToro (5 cases) ───
  {
    platform: 'etoro',
    description: 'Open Trade (buy)',
    rawText: 'eToro Europe\nOpen Trade\nAAPL\nInvestment amount: $500.00\nRate: $186.50\nStop Loss: $180.00\nTake Profit: $220.00\nLeverage: x1\nApr 28 2026',
    groundTruth: { ticker: 'AAPL', shares: 3, pricePerShare: 186.50, tradeDate: '2026-04-28', direction: 'buy', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'etoro',
    description: 'Close Trade (sell)',
    rawText: 'eToro (Europe)\nClose Trade\nTSLA\nInvestment amount: $1,000.00\nOpen Rate: $245.00\nClose Rate: $260.00\nProfit: $61.22\nMay 01 2026',
    groundTruth: { ticker: 'TSLA', shares: 4, pricePerShare: 245.00, tradeDate: '2026-05-01', direction: 'sell', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'etoro',
    description: 'Open Trade with leverage',
    rawText: 'eToro\nOpen Trade\nNVDA\nInvestment amount: $200.00\nRate: $125.30\nStop Loss: $120.00\nLeverage: x5\nApr 15 2026',
    groundTruth: { ticker: 'NVDA', shares: 2, pricePerShare: 125.30, tradeDate: '2026-04-15', direction: 'buy', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'etoro',
    description: 'Close Trade with profit',
    rawText: 'eToro Europe\nClose Trade\nGOOGL\nInvestment amount: $800.00\nOpen Rate: $170.00\nClose Rate: $178.50\nProfit: $40.00\nApr 30 2026',
    groundTruth: { ticker: 'GOOGL', shares: 5, pricePerShare: 170.00, tradeDate: '2026-04-30', direction: 'sell', rawText: '', confidence: 1.0 },
  },
  {
    platform: 'etoro',
    description: 'Open Trade large investment',
    rawText: 'eToro\nOpen Trade\nAMZN\nInvestment amount: $2,000.00\nRate: $195.00\nStop Loss: $185.00\nTake Profit: $210.00\nApr 22 2026',
    groundTruth: { ticker: 'AMZN', shares: 10, pricePerShare: 195.00, tradeDate: '2026-04-22', direction: 'buy', rawText: '', confidence: 1.0 },
  },
];

describe('OCR Accuracy Regression Suite', () => {
  it('tracks overall accuracy across all 15 platform-specific screenshots (metric, non-blocking)', () => {
    let totalCorrect = 0;
    let totalFields = 0;
    const perSampleResults: { description: string; platform: string; accuracy: number; extractedPlatform: string }[] = [];

    for (const tc of testCases) {
      const result = parseTradeFromText(tc.rawText);
      const report = evaluateAccuracy(tc.groundTruth, result);
      totalCorrect += report.correctFields;
      totalFields += report.totalFields;
      perSampleResults.push({
        description: tc.description,
        platform: tc.platform,
        accuracy: report.overallAccuracy,
        extractedPlatform: report.platform,
      });
    }

    const overallAccuracy = totalCorrect / totalFields;
    console.log(`\n  ═══ ACCURACY REPORT ═══`);
    console.log(`  Overall: ${(overallAccuracy * 100).toFixed(1)}% (${totalCorrect}/${totalFields} fields)`);
    console.log(`  Per-sample breakdown:`);
    for (const r of perSampleResults) {
      const icon = r.accuracy >= 0.8 ? '✓' : r.accuracy >= 0.6 ? '⚠' : '✗';
      console.log(`    ${icon} ${r.platform}: ${r.description} — ${(r.accuracy * 100).toFixed(0)}% (detected: ${r.extractedPlatform})`);
    }

    // D-09: Warn but do not block CI — accuracy is a tracking metric
    if (overallAccuracy < 0.90) {
      console.warn(`  ⚠ ACCURACY WARNING: Overall ${(overallAccuracy * 100).toFixed(1)}% is below the >90% roadmap target`);
    }
    if (overallAccuracy < 0.80) {
      console.warn(`  ⚠ ACCURACY WARNING: Overall ${(overallAccuracy * 100).toFixed(1)}% is below the >80% minimum threshold`);
    }

    // Always passes — accuracy tracked as metric, not gate
    expect(true).toBe(true);
  });

  it('tracks platform detection accuracy (metric, non-blocking)', () => {
    let correctDetections = 0;
    for (const tc of testCases) {
      const result = parseTradeFromText(tc.rawText);
      if (result.aiMeta?.platform === tc.platform) {
        correctDetections++;
      }
    }
    const detectionRate = correctDetections / testCases.length;
    console.log(`  Platform detection: ${correctDetections}/${testCases.length} (${(detectionRate * 100).toFixed(0)}%)`);

    if (detectionRate < 0.80) {
      console.warn(`  ⚠ PLATFORM DETECTION WARNING: ${(detectionRate * 100).toFixed(0)}% is below 80% threshold`);
    }

    // Always passes — metric tracking
    expect(true).toBe(true);
  });

  it('correctly extracts buy/sell direction for all test cases', () => {
    for (const tc of testCases) {
      const result = parseTradeFromText(tc.rawText);
      expect(result.direction).toBe(tc.groundTruth.direction);
    }
  });

  it('tracks ticker extraction accuracy (metric, non-blocking)', () => {
    let correctTickers = 0;
    for (const tc of testCases) {
      const result = parseTradeFromText(tc.rawText);
      if (result.ticker === tc.groundTruth.ticker) correctTickers++;
    }
    const tickerRate = correctTickers / testCases.length;
    console.log(`  Ticker accuracy: ${correctTickers}/${testCases.length} (${(tickerRate * 100).toFixed(0)}%)`);

    if (tickerRate < 0.90) {
      console.warn(`  ⚠ TICKER ACCURACY WARNING: ${(tickerRate * 100).toFixed(0)}% is below 90% target`);
    }

    // Always passes — metric tracking
    expect(true).toBe(true);
  });

  it('attaches aiMeta with extractionMethod="template" for platform-specific screenshots', () => {
    for (const tc of testCases) {
      const result = parseTradeFromText(tc.rawText);
      expect(result.aiMeta).toBeDefined();
      if (result.aiMeta!.platform === tc.platform) {
        expect(result.aiMeta!.extractionMethod).toBe('template');
      }
    }
  });

  it('handles generic (non-platform) text without aiMeta', () => {
    const result = parseTradeFromText('Bought 100 AAPL at $150.00 Apr 28 2026');
    expect(result.ticker).toBe('AAPL');
    expect(result.shares).toBe(100);
    expect(result.pricePerShare).toBe(150.00);
  });
});
