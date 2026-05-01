import { create } from 'zustand';
import type { Trade, TradeFormData } from '@/types';
import {
  getAllTrades, createTrade as dbCreateTrade,
  updateTrade as dbUpdateTrade, deleteTrade as dbDeleteTrade,
} from '@/services/database';
import { generateUUID, getTodayISO } from '@/utils/format';

interface TradeStoreState {
  // ─── State ───
  trades: Trade[];
  isLoading: boolean;
  isInitialized: boolean;

  // ─── Initialization ───
  initialize: () => void;

  // ─── Trade Actions ───
  addTrade: (data: TradeFormData) => Trade;
  editTrade: (tradeId: string, data: Partial<TradeFormData>) => void;
  removeTrade: (tradeId: string) => void;

  // ─── Helpers ───
  getTradeById: (tradeId: string) => Trade | undefined;
}

export const useTradeStore = create<TradeStoreState>((set, get) => ({
  trades: [],
  isLoading: true,
  isInitialized: false,

  // ─── Initialize: load all trades from SQLite ───
  initialize: () => {
    if (get().isInitialized) return;
    try {
      const trades = getAllTrades();
      set({ trades, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize trade store:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  // ─── Trade CRUD ───
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
      null, // thumbnailUri — set by import flow, not manual entry
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

    set({
      trades: get().trades.map((t) => (t.id === tradeId ? updated : t)),
    });
  },

  removeTrade: (tradeId) => {
    dbDeleteTrade(tradeId);
    set({ trades: get().trades.filter((t) => t.id !== tradeId) });
  },

  // ─── Helpers ───
  getTradeById: (tradeId) => {
    return get().trades.find((t) => t.id === tradeId);
  },
}));
