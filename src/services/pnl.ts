import type { Trade, PnLPair, Holding } from '@/types';

export function calculatePnLPairs(trades: Trade[]): PnLPair[] {
  const pairs: PnLPair[] = [];

  const tickerMap = new Map<string, Trade[]>();
  for (const t of trades) {
    const list = tickerMap.get(t.ticker) || [];
    list.push(t);
    tickerMap.set(t.ticker, list);
  }

  for (const [ticker, tickerTrades] of tickerMap) {
    const sorted = tickerTrades
      .map(t => ({ ...t }))
      .sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));

    const buyQueue: Trade[] = [];

    for (const trade of sorted) {
      if (trade.direction === 'buy') {
        buyQueue.push(trade);
      } else {
        let remainingSellShares = trade.shares;
        let totalSellFees = trade.feesCents || 0;

        while (remainingSellShares > 0 && buyQueue.length > 0) {
          const buy = buyQueue[0];
          const matchedShares = Math.min(buy.shares, remainingSellShares);

          const buyFeesRatio = matchedShares / buy.shares;
          const sellFeesRatio = matchedShares / trade.shares;
          const buyFees = Math.round((buy.feesCents || 0) * buyFeesRatio);
          const sellFees = Math.round(totalSellFees * sellFeesRatio);

          const realizedPnlCents =
            (trade.pricePerShareCents - buy.pricePerShareCents) * matchedShares -
            buyFees -
            sellFees;

          pairs.push({
            buyTradeId: buy.id,
            sellTradeId: trade.id,
            ticker,
            matchedShares,
            buyPriceCents: buy.pricePerShareCents,
            sellPriceCents: trade.pricePerShareCents,
            buyFeesCents: buyFees,
            sellFeesCents: sellFees,
            realizedPnlCents,
            buyDate: buy.tradeDate,
            sellDate: trade.tradeDate,
          });

          remainingSellShares -= matchedShares;
          buy.shares -= matchedShares;

          if (buy.shares === 0) {
            buyQueue.shift();
          }
        }
      }
    }
  }

  return pairs.sort(
    (a, b) => b.sellDate.localeCompare(a.sellDate)
  );
}

export function calculateHoldings(
  trades: Trade[],
  currentPrices: Record<string, { priceCents: number; updatedAt: string }>
): Holding[] {
  const tickerMap = new Map<
    string,
    { totalShares: number; totalCostCents: number; totalFeesCents: number }
  >();

  for (const t of trades.sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))) {
    if (!tickerMap.has(t.ticker)) {
      tickerMap.set(t.ticker, { totalShares: 0, totalCostCents: 0, totalFeesCents: 0 });
    }
    const h = tickerMap.get(t.ticker)!;

    if (t.direction === 'buy') {
      h.totalShares += t.shares;
      h.totalCostCents += t.shares * t.pricePerShareCents + (t.feesCents || 0);
      h.totalFeesCents += t.feesCents || 0;
    } else {
      const remainingShares = h.totalShares - t.shares;
      if (remainingShares >= 0) {
        const costPerShare = h.totalShares > 0 ? h.totalCostCents / h.totalShares : 0;
        h.totalCostCents -= Math.round(t.shares * costPerShare);
        h.totalFeesCents += t.feesCents || 0;
      }
      h.totalShares = Math.max(0, remainingShares);
    }
  }

  const holdings: Holding[] = [];
  for (const [ticker, h] of tickerMap) {
    if (h.totalShares === 0) continue;

    const currentPrice = currentPrices[ticker]?.priceCents ?? null;
    const priceUpdatedAt = currentPrices[ticker]?.updatedAt ?? null;
    const averageCostBasisCents =
      h.totalShares > 0 ? Math.round(h.totalCostCents / h.totalShares) : 0;

    const unrealizedPnlCents =
      currentPrice !== null
        ? (currentPrice - averageCostBasisCents) * h.totalShares
        : null;
    const unrealizedPnlPercent =
      currentPrice !== null && averageCostBasisCents > 0
        ? ((currentPrice - averageCostBasisCents) / averageCostBasisCents) * 100
        : null;

    holdings.push({
      ticker,
      totalShares: h.totalShares,
      averageCostBasisCents,
      currentPriceCents: currentPrice,
      unrealizedPnlCents,
      unrealizedPnlPercent,
      totalFeesCents: h.totalFeesCents,
      priceUpdatedAt,
    });
  }

  return holdings.sort((a, b) => a.ticker.localeCompare(b.ticker));
}
