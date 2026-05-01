import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Trade, TradeDirection } from '@/types';

// Mock the database service
const mockDbCreateTrade = vi.fn();
const mockDbGetAllTrades = vi.fn();
const mockDbUpdateTrade = vi.fn();
const mockDbDeleteTrade = vi.fn();

vi.mock('@/services/database', () => ({
  getAllTrades: mockDbGetAllTrades,
  createTrade: mockDbCreateTrade,
  updateTrade: mockDbUpdateTrade,
  deleteTrade: mockDbDeleteTrade,
}));

// Mock format utils
const mockUUID = 'test-uuid-001';
vi.mock('@/utils/format', () => ({
  generateUUID: () => mockUUID,
  getTodayISO: () => '2026-05-01',
}));

import { useTradeStore } from '@/stores/tradeStore';

const makeTradeRow = (overrides: Partial<Trade> = {}): Trade => ({
  id: 'trade-1',
  ticker: 'AAPL',
  shares: 100,
  pricePerShareCents: 15000,
  tradeDate: '2026-05-01',
  direction: 'buy',
  feesCents: null,
  thumbnailUri: null,
  notes: null,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

describe('tradeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useTradeStore.setState({
      trades: [],
      isLoading: true,
      isInitialized: false,
    });
  });

  // ─── Export Verification ───
  it('exports useTradeStore', () => {
    expect(useTradeStore).toBeDefined();
    expect(typeof useTradeStore).toBe('function');
  });

  // ─── Initial State ───
  it('has empty trades array before initialization', () => {
    const state = useTradeStore.getState();
    expect(state.trades).toEqual([]);
    expect(state.isLoading).toBe(true);
  });

  // ─── initialize() ───
  it('initialize loads all trades from SQLite via getAllTrades', () => {
    const mockTrades = [makeTradeRow(), makeTradeRow({ id: 'trade-2', ticker: 'MSFT' })];
    mockDbGetAllTrades.mockReturnValue(mockTrades);

    useTradeStore.getState().initialize();

    expect(mockDbGetAllTrades).toHaveBeenCalledOnce();
    const state = useTradeStore.getState();
    expect(state.trades).toHaveLength(2);
    expect(state.trades[0].ticker).toBe('AAPL');
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(true);
  });

  it('initialize does not reload if already initialized', () => {
    // Set state to initialized
    useTradeStore.setState({ isInitialized: true, isLoading: false });

    useTradeStore.getState().initialize();

    // getAllTrades should NOT have been called
    expect(mockDbGetAllTrades).not.toHaveBeenCalled();
  });

  it('initialize handles errors gracefully', () => {
    mockDbGetAllTrades.mockImplementation(() => {
      throw new Error('DB error');
    });

    useTradeStore.getState().initialize();

    const state = useTradeStore.getState();
    expect(state.trades).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(true);
  });

  // ─── addTrade() ───
  it('addTrade calls createTrade, appends to state, returns Trade', () => {
    const mockTrade = makeTradeRow({ id: mockUUID });
    mockDbCreateTrade.mockReturnValue(mockTrade);

    const formData = {
      ticker: 'AAPL',
      shares: '100',
      pricePerShareCents: '15000',
      tradeDate: '2026-05-01',
      direction: 'buy' as TradeDirection,
      feesCents: '',
      notes: '',
    };

    const result = useTradeStore.getState().addTrade(formData);

    // Should call dbCreateTrade with parsed values
    expect(mockDbCreateTrade).toHaveBeenCalledOnce();
    const callArgs = mockDbCreateTrade.mock.calls[0];
    expect(callArgs[0]).toBe(mockUUID); // id
    expect(callArgs[1]).toBe('AAPL');   // ticker (uppercased)
    expect(callArgs[2]).toBe(100);      // shares (parsed int)
    expect(callArgs[3]).toBe(15000);    // pricePerShareCents (parsed int)
    expect(callArgs[4]).toBe('2026-05-01'); // tradeDate
    expect(callArgs[5]).toBe('buy');    // direction
    expect(callArgs[6]).toBeNull();     // feesCents (empty string → null)
    expect(callArgs[7]).toBeNull();     // thumbnailUri (not set in manual)
    expect(callArgs[8]).toBeNull();     // notes (empty trimmed → null)

    // Should return the created Trade
    expect(result).toBe(mockTrade);
    expect(result.ticker).toBe('AAPL');

    // Should be prepended to trades array
    const state = useTradeStore.getState();
    expect(state.trades).toHaveLength(1);
    expect(state.trades[0]).toBe(mockTrade);
  });

  it('addTrade uppercases ticker and trims fields', () => {
    const mockTrade = makeTradeRow({ id: mockUUID, ticker: 'AAPL' });
    mockDbCreateTrade.mockReturnValue(mockTrade);

    useTradeStore.getState().addTrade({
      ticker: '  aapl  ',
      shares: '50',
      pricePerShareCents: '20000',
      tradeDate: '2026-04-28',
      direction: 'sell',
      feesCents: '100',
      notes: '  My note  ',
    });

    const callArgs = mockDbCreateTrade.mock.calls[0];
    expect(callArgs[1]).toBe('AAPL');       // trimmed + uppercased
    expect(callArgs[5]).toBe('sell');
    expect(callArgs[6]).toBe(100);           // fees parsed to int
    expect(callArgs[8]).toBe('My note');     // trimmed
  });

  // ─── editTrade() ───
  it('editTrade calls updateTrade with only provided fields', () => {
    const existingTrade = makeTradeRow();
    useTradeStore.setState({ trades: [existingTrade] });

    const mockUpdated = makeTradeRow({ ticker: 'GOOGL', notes: 'Updated' });
    mockDbUpdateTrade.mockReturnValue(mockUpdated);

    useTradeStore.getState().editTrade('trade-1', {
      ticker: 'GOOGL',
      notes: 'Updated',
    });

    expect(mockDbUpdateTrade).toHaveBeenCalledOnce();
    const [idArg, updatesArg] = mockDbUpdateTrade.mock.calls[0];
    expect(idArg).toBe('trade-1');
    expect(updatesArg).toEqual({ ticker: 'GOOGL', notes: 'Updated' });

    // State should be updated
    const state = useTradeStore.getState();
    expect(state.trades[0].ticker).toBe('GOOGL');
  });

  it('editTrade does nothing if updateTrade returns null', () => {
    const existingTrade = makeTradeRow();
    useTradeStore.setState({ trades: [existingTrade] });

    mockDbUpdateTrade.mockReturnValue(null);

    useTradeStore.getState().editTrade('nonexistent', { ticker: 'TEST' });

    // State should remain unchanged
    const state = useTradeStore.getState();
    expect(state.trades[0].ticker).toBe('AAPL');
  });

  // ─── removeTrade() ───
  it('removeTrade calls deleteTrade and removes from state', () => {
    const trade1 = makeTradeRow();
    const trade2 = makeTradeRow({ id: 'trade-2', ticker: 'MSFT' });
    useTradeStore.setState({ trades: [trade1, trade2] });

    useTradeStore.getState().removeTrade('trade-1');

    expect(mockDbDeleteTrade).toHaveBeenCalledOnce();
    expect(mockDbDeleteTrade).toHaveBeenCalledWith('trade-1');

    const state = useTradeStore.getState();
    expect(state.trades).toHaveLength(1);
    expect(state.trades[0].id).toBe('trade-2');
  });

  // ─── getTradeById() ───
  it('getTradeById returns trade when found', () => {
    const trade = makeTradeRow();
    useTradeStore.setState({ trades: [trade] });

    const result = useTradeStore.getState().getTradeById('trade-1');
    expect(result).toBe(trade);
  });

  it('getTradeById returns undefined when not found', () => {
    useTradeStore.setState({ trades: [] });

    const result = useTradeStore.getState().getTradeById('nonexistent');
    expect(result).toBeUndefined();
  });
});
