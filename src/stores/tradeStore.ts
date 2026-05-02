import { create } from 'zustand';
import type { Trade, TradeFormData, PnLPair, Holding, PortfolioSummary } from '@/types';
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
      null,
      data.notes?.trim() || null
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
}));
