import { create } from 'zustand';
import type { Trade, TradeFormData, PnLPair, Holding, PortfolioSummary } from '@/types';
import { DEFAULT_INVESTMENT_KINDS } from '@/types';
import {
  getAllTrades, createTrade as dbCreateTrade,
  updateTrade as dbUpdateTrade, deleteTrade as dbDeleteTrade,
  upsertCurrentPrice, getAllCurrentPrices,
} from '@/services/database';
import { calculatePnLPairs, calculateHoldings } from '@/services/pnl';
import { generateUUID, getTodayISO } from '@/utils/format';

interface TradeStoreState {
  trades: Trade[];
  currentPrices: Record<string, { priceCents: number; updatedAt: string }>;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => void;

  addTrade: (data: TradeFormData) => Trade;
  editTrade: (tradeId: string, data: Partial<TradeFormData>) => void;
  removeTrade: (tradeId: string) => void;

  updateCurrentPrice: (ticker: string, priceCents: number) => void;
  bulkUpdatePrices: (prices: Record<string, number>) => void;
  refreshPrices: () => void;

  getPnlPairs: () => PnLPair[];
  getHoldings: () => Holding[];
  getPortfolioSummary: () => PortfolioSummary;
  getTradeById: (tradeId: string) => Trade | undefined;

  setTradeAssetType: (tradeId: string, assetType: string | null) => void;
  getTradesByCategory: (assetType: string | null) => Trade[];
  getCategorySummary: (assetType: string | null) => {
    totalInvestedCents: number;
    totalRealizedCents: number;
    netPnlCents: number;
    pnlMultiplier: number | null;
    tradeCount: number;
    buyCount: number;
    sellCount: number;
  };
  getAvailableCategories: () => { id: string; label: string; tradeCount: number }[];

  getSummaryByTicker: (ticker: string) => {
    totalInvestedCents: number;
    totalRealizedCents: number;
    netPnlCents: number;
    pnlMultiplier: number | null;
    pnlPercent: number | null;
    buyCount: number;
    sellCount: number;
    pairCount: number;
    totalBuyVolumeCents: number;
    totalSellVolumeCents: number;
  };
}

export const useTradeStore = create<TradeStoreState>((set, get) => ({
  trades: [],
  currentPrices: {},
  isLoading: true,
  isInitialized: false,

  initialize: () => {
    if (get().isInitialized) return;
    try {
      const trades = getAllTrades();
      const prices = getAllCurrentPrices();
      set({ trades, currentPrices: prices, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize trade store:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  addTrade: (data) => {
    const id = generateUUID();
    const shares = parseInt(data.shares, 10) || 0;
    const pricePerShareCents = parseInt(data.pricePerShareCents, 10) || 0;
    const feesCents = data.feesCents ? (parseInt(data.feesCents, 10) || null) : null;

    const trade = dbCreateTrade(
      id,
      data.ticker.trim().toUpperCase(),
      shares,
      pricePerShareCents,
      data.tradeDate || getTodayISO(),
      data.direction,
      feesCents,
      data.assetType || null,
      data.notes?.trim() || null,
      null
    );

    set({ trades: [trade, ...get().trades] });
    return trade;
  },

  editTrade: (tradeId, data) => {
    const updates: Record<string, unknown> = {};
    if (data.ticker !== undefined) updates.ticker = data.ticker.trim().toUpperCase();
    if (data.shares !== undefined) updates.shares = parseInt(data.shares, 10) || 0;
    if (data.pricePerShareCents !== undefined) updates.pricePerShareCents = parseInt(data.pricePerShareCents, 10) || 0;
    if (data.tradeDate !== undefined) updates.tradeDate = data.tradeDate;
    if (data.direction !== undefined) updates.direction = data.direction;
    if (data.feesCents !== undefined) {
      updates.feesCents = data.feesCents ? (parseInt(data.feesCents, 10) || null) : null;
    }
    if (data.notes !== undefined) updates.notes = data.notes?.trim() || null;
    if (data.assetType !== undefined) updates.assetType = data.assetType || null;

    const updated = dbUpdateTrade(tradeId, updates as Parameters<typeof dbUpdateTrade>[1]);
    if (!updated) return;

    set({ trades: get().trades.map((t) => (t.id === tradeId ? updated : t)) });
  },

  removeTrade: (tradeId) => {
    dbDeleteTrade(tradeId);
    set({ trades: get().trades.filter((t) => t.id !== tradeId) });
  },

  updateCurrentPrice: (ticker, priceCents) => {
    upsertCurrentPrice(ticker, priceCents);
    set({
      currentPrices: {
        ...get().currentPrices,
        [ticker]: { priceCents, updatedAt: new Date().toISOString() },
      },
    });
  },

  bulkUpdatePrices: (prices) => {
    for (const [ticker, priceCents] of Object.entries(prices)) {
      upsertCurrentPrice(ticker, Math.round(priceCents));
    }
    set({ currentPrices: getAllCurrentPrices() });
  },

  refreshPrices: () => {
    set({ currentPrices: getAllCurrentPrices() });
  },

  getPnlPairs: () => {
    return calculatePnLPairs(get().trades);
  },

  getHoldings: () => {
    return calculateHoldings(get().trades, get().currentPrices);
  },

  getPortfolioSummary: () => {
    const pairs = get().getPnlPairs();
    const holdings = get().getHoldings();
    const totalRealizedPnlCents = pairs.reduce((sum, p) => sum + p.realizedPnlCents, 0);
    const totalUnrealizedPnlCents = holdings.reduce(
      (sum, h) => (h.unrealizedPnlCents !== null ? (sum ?? 0) + h.unrealizedPnlCents : sum),
      null as number | null
    );
    return {
      totalRealizedPnlCents,
      totalUnrealizedPnlCents,
      holdings,
      pnlPairs: pairs,
    };
  },

  getTradeById: (tradeId) => {
    return get().trades.find((t) => t.id === tradeId);
  },

  setTradeAssetType: (tradeId, assetType) => {
    const updated = dbUpdateTrade(tradeId, { assetType });
    if (updated) {
      set({ trades: get().trades.map(t => t.id === tradeId ? updated : t) });
    }
  },

  getTradesByCategory: (assetType) => {
    return get().trades.filter(t => {
      if (assetType === null) return t.assetType === null || t.assetType === undefined;
      return t.assetType === assetType;
    }).sort((a, b) => b.tradeDate.localeCompare(a.tradeDate));
  },

  getCategorySummary: (assetType) => {
    const categoryTrades = get().getTradesByCategory(assetType);
    const pairs = calculatePnLPairs(categoryTrades);
    const totalInvestedCents = categoryTrades
      .filter(t => t.direction === 'buy')
      .reduce((sum, t) => sum + t.shares * t.pricePerShareCents + (t.feesCents || 0), 0);
    const totalRealizedCents = pairs.reduce((sum, p) => sum + p.realizedPnlCents, 0);
    const netPnlCents = totalRealizedCents;
    const pnlMultiplier = totalInvestedCents > 0
      ? (totalInvestedCents + totalRealizedCents) / totalInvestedCents
      : null;
    return {
      totalInvestedCents,
      totalRealizedCents,
      netPnlCents,
      pnlMultiplier,
      tradeCount: categoryTrades.length,
      buyCount: categoryTrades.filter(t => t.direction === 'buy').length,
      sellCount: categoryTrades.filter(t => t.direction === 'sell').length,
    };
  },

  getAvailableCategories: () => {
    const trades = get().trades;
    const distinctTypes = new Set(
      trades.filter(t => t.assetType).map(t => t.assetType!)
    );
    const categories: { id: string; label: string; tradeCount: number }[] = DEFAULT_INVESTMENT_KINDS.map(k => ({
      id: k.id,
      label: k.label,
      tradeCount: trades.filter(t => t.assetType === k.id).length,
    }));
    for (const customType of distinctTypes) {
      if (!DEFAULT_INVESTMENT_KINDS.some(k => k.id === customType)) {
        categories.push({
          id: customType,
          label: customType.charAt(0).toUpperCase() + customType.slice(1),
          tradeCount: trades.filter(t => t.assetType === customType).length,
        });
      }
    }
    return categories;
  },

  getSummaryByTicker: (ticker) => {
    const upperTicker = ticker.toUpperCase();
    const tickerTrades = get().trades.filter(t => t.ticker === upperTicker);
    const pairs = calculatePnLPairs(tickerTrades);

    const buyTrades = tickerTrades.filter(t => t.direction === 'buy');
    const sellTrades = tickerTrades.filter(t => t.direction === 'sell');

    const totalInvestedCents = buyTrades.reduce(
      (sum, t) => sum + t.shares * t.pricePerShareCents + (t.feesCents || 0), 0
    );
    const totalBuyVolumeCents = buyTrades.reduce(
      (sum, t) => sum + t.shares * t.pricePerShareCents, 0
    );
    const totalSellVolumeCents = sellTrades.reduce(
      (sum, t) => sum + t.shares * t.pricePerShareCents, 0
    );
    const totalRealizedCents = pairs.reduce((sum, p) => sum + p.realizedPnlCents, 0);
    const netPnlCents = totalRealizedCents;

    const pnlMultiplier = totalInvestedCents > 0
      ? (totalInvestedCents + totalRealizedCents) / totalInvestedCents
      : null;
    const pnlPercent = pnlMultiplier !== null
      ? (pnlMultiplier - 1) * 100
      : null;

    return {
      totalInvestedCents,
      totalRealizedCents,
      netPnlCents,
      pnlMultiplier,
      pnlPercent,
      buyCount: buyTrades.length,
      sellCount: sellTrades.length,
      pairCount: pairs.length,
      totalBuyVolumeCents,
      totalSellVolumeCents,
    };
  },
}));
