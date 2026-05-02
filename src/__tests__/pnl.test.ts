import { describe, it, expect } from 'vitest';
import { calculatePnLPairs, calculateHoldings } from '@/services/pnl';
import type { Trade } from '@/types';

const mockTrades: Trade[] = [
  {
    id: 'b1', ticker: 'AAPL', shares: 10, pricePerShareCents: 15000,
    tradeDate: '2026-01-15', direction: 'buy', feesCents: 100,
    thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
  },
  {
    id: 'b2', ticker: 'AAPL', shares: 5, pricePerShareCents: 15500,
    tradeDate: '2026-02-01', direction: 'buy', feesCents: 50,
    thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
  },
  {
    id: 's1', ticker: 'AAPL', shares: 12, pricePerShareCents: 18500,
    tradeDate: '2026-03-10', direction: 'sell', feesCents: 120,
    thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
  },
];

const mockTradesMulti: Trade[] = [
  {
    id: 'ba', ticker: 'AAPL', shares: 10, pricePerShareCents: 15000,
    tradeDate: '2026-01-15', direction: 'buy', feesCents: 100,
    thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
  },
  {
    id: 'bb', ticker: 'TSLA', shares: 5, pricePerShareCents: 25000,
    tradeDate: '2026-02-01', direction: 'buy', feesCents: 50,
    thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
  },
  {
    id: 'sa', ticker: 'AAPL', shares: 10, pricePerShareCents: 20000,
    tradeDate: '2026-03-01', direction: 'sell', feesCents: 100,
    thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
  },
];

describe('calculatePnLPairs', () => {
  it('matches FIFO: oldest buy paired first', () => {
    const pairs = calculatePnLPairs(mockTrades);
    expect(pairs).toHaveLength(2);

    const firstBuyPair = pairs.find(p => p.buyTradeId === 'b1')!;
    expect(firstBuyPair).toBeDefined();
    expect(firstBuyPair.matchedShares).toBe(10);
    expect(firstBuyPair.realizedPnlCents).toBe(
      (18500 - 15000) * 10 - Math.round(100 * 10 / 10) - Math.round(120 * 10 / 12)
    );

    const secondBuyPair = pairs.find(p => p.buyTradeId === 'b2')!;
    expect(secondBuyPair).toBeDefined();
    expect(secondBuyPair.matchedShares).toBe(2);
  });

  it('includes fees in P&L calculation', () => {
    const pairs = calculatePnLPairs(mockTrades);
    const pair = pairs.find(p => p.buyTradeId === 'b1')!;
    const grossPnl = (18500 - 15000) * 10;
    expect(pair.realizedPnlCents).toBeLessThan(grossPnl);
  });

  it('returns empty array for no trades', () => {
    expect(calculatePnLPairs([])).toEqual([]);
  });

  it('returns empty when only buys exist', () => {
    const onlyBuys: Trade[] = [
      { ...mockTrades[0] },
    ];
    expect(calculatePnLPairs(onlyBuys)).toEqual([]);
  });

  it('handles sell with no matching buy', () => {
    const onlySells: Trade[] = [
      {
        id: 's-nomatch', ticker: 'MSFT', shares: 5, pricePerShareCents: 40000,
        tradeDate: '2026-01-01', direction: 'sell', feesCents: null,
        thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
      },
    ];
    expect(calculatePnLPairs(onlySells)).toEqual([]);
  });

  it('handles split buy across multiple sells', () => {
    const trades: Trade[] = [
      {
        id: 'bbig', ticker: 'GOOGL', shares: 20, pricePerShareCents: 17000,
        tradeDate: '2026-01-01', direction: 'buy', feesCents: 100,
        thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
      },
      {
        id: 'ssmall1', ticker: 'GOOGL', shares: 10, pricePerShareCents: 18000,
        tradeDate: '2026-02-01', direction: 'sell', feesCents: 50,
        thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
      },
      {
        id: 'ssmall2', ticker: 'GOOGL', shares: 10, pricePerShareCents: 18500,
        tradeDate: '2026-03-01', direction: 'sell', feesCents: 50,
        thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
      },
    ];
    const pairs = calculatePnLPairs(trades);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].buyTradeId).toBe('bbig');
    expect(pairs[1].buyTradeId).toBe('bbig');
  });

  it('respects date ordering regardless of input order', () => {
    const reversed = [...mockTrades].reverse();
    const pairs = calculatePnLPairs(reversed);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].buyDate < pairs[0].sellDate || pairs[0].buyDate.localeCompare(pairs[0].sellDate) <= 0).toBe(true);
  });
});

describe('calculateHoldings', () => {
  it('calculates holdings with current prices', () => {
    const prices = {
      AAPL: { priceCents: 19000, updatedAt: '2026-04-01' },
      TSLA: { priceCents: 24000, updatedAt: '2026-04-01' },
    };
    const holdings = calculateHoldings(mockTradesMulti, prices);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].ticker).toBe('TSLA');
    expect(holdings[0].totalShares).toBe(5);
  });

  it('marks unrealized P&L as null when no current price', () => {
    const holdings = calculateHoldings(mockTradesMulti, {});
    const tsla = holdings.find(h => h.ticker === 'TSLA')!;
    expect(tsla.unrealizedPnlCents).toBeNull();
  });

  it('calculates unrealized P&L with current price', () => {
    const prices = { TSLA: { priceCents: 30000, updatedAt: '2026-04-01' } };
    const holdings = calculateHoldings(mockTradesMulti, prices);
    const tsla = holdings.find(h => h.ticker === 'TSLA')!;
    const expectedCostBasis = (25000 * 5 + 50) / 5; // cost + fees per share
    const expectedPnl = Math.round((30000 - expectedCostBasis) * 5);
    expect(tsla.unrealizedPnlCents).toBe(expectedPnl);
  });

  it('shows negative unrealized P&L for underwater positions', () => {
    const trades: Trade[] = [{
      id: 'bloss', ticker: 'META', shares: 10, pricePerShareCents: 50000,
      tradeDate: '2026-01-01', direction: 'buy', feesCents: null,
      thumbnailUri: null, notes: null, createdAt: '', updatedAt: '',
    }];
    const prices = { META: { priceCents: 40000, updatedAt: '2026-01-15' } };
    const holdings = calculateHoldings(trades, prices);
    expect(holdings[0].unrealizedPnlCents).toBe(-100000);
    expect(holdings[0].unrealizedPnlPercent).toBe(-20);
  });
});
