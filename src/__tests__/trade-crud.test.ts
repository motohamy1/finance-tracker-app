import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Trade, TradeDirection, FailedOCRLog } from '@/types';

// Create mock database functions
const mockDb = {
  runSync: vi.fn(),
  getAllSync: vi.fn(),
  getFirstSync: vi.fn(),
};

// Mock the db/schema module
vi.mock('@/db/schema', () => ({
  getDatabase: () => mockDb,
}));

// Import the actual service functions - these will fail at RED because they don't exist yet
import {
  createTrade,
  getAllTrades,
  getTradeById,
  updateTrade,
  deleteTrade,
  logFailedOCR,
  getFailedOCRLogs,
  clearFailedOCRLogs,
} from '@/services/database';

describe('Trade CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Export Verification ───
  it('exports all 5 Trade CRUD functions', () => {
    expect(createTrade).toBeDefined();
    expect(typeof createTrade).toBe('function');
    expect(getAllTrades).toBeDefined();
    expect(typeof getAllTrades).toBe('function');
    expect(getTradeById).toBeDefined();
    expect(typeof getTradeById).toBe('function');
    expect(updateTrade).toBeDefined();
    expect(typeof updateTrade).toBe('function');
    expect(deleteTrade).toBeDefined();
    expect(typeof deleteTrade).toBe('function');
  });

  it('exports all 3 Failed OCR Log functions', () => {
    expect(logFailedOCR).toBeDefined();
    expect(typeof logFailedOCR).toBe('function');
    expect(getFailedOCRLogs).toBeDefined();
    expect(typeof getFailedOCRLogs).toBe('function');
    expect(clearFailedOCRLogs).toBeDefined();
    expect(typeof clearFailedOCRLogs).toBe('function');
  });

  // ─── createTrade ───
  it('createTrade inserts row and returns a Trade object', () => {
    const mockTradeRow = {
      id: 'uuid-1',
      ticker: 'AAPL',
      shares: 100,
      price_per_share_cents: 15000,
      trade_date: '2026-05-01',
      direction: 'buy',
      fees_cents: 0,
      thumbnail_uri: null,
      notes: null,
      asset_type: null,
      created_at: '2026-05-01T00:00:00.000Z',
      updated_at: '2026-05-01T00:00:00.000Z',
    };

    mockDb.getFirstSync.mockReturnValue(mockTradeRow);

    const result = createTrade(
      'uuid-1', 'AAPL', 100, 15000, '2026-05-01',
      'buy' as TradeDirection, 0, null, null, null
    );

    // Should have inserted via runSync with parameterized query
    expect(mockDb.runSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.runSync.mock.calls[0][0];
    const paramsArg = mockDb.runSync.mock.calls[0][1];
    expect(sqlArg).toContain('INSERT INTO trades');
    expect(sqlArg).toContain('?'); // Parameterized
    expect(paramsArg).toHaveLength(12);

    // Should return the mapped Trade object
    expect(result).toBeDefined();
    expect(result.id).toBe('uuid-1');
    expect(result.ticker).toBe('AAPL');
    expect(result.pricePerShareCents).toBe(15000);
    expect(result.direction).toBe('buy');
  });

  // ─── getAllTrades ───
  it('getAllTrades returns Trade[] ordered by trade_date DESC, created_at DESC', () => {
    const mockRows = [
      {
        id: 'uuid-1', ticker: 'MSFT', shares: 50,
        price_per_share_cents: 40000, trade_date: '2026-05-01',
        direction: 'buy', fees_cents: null, thumbnail_uri: null,
        notes: null, created_at: '2026-05-01T12:00:00.000Z',
        updated_at: '2026-05-01T12:00:00.000Z',
      },
      {
        id: 'uuid-2', ticker: 'AAPL', shares: 100,
        price_per_share_cents: 15000, trade_date: '2026-04-28',
        direction: 'sell', fees_cents: 500, thumbnail_uri: null,
        notes: null, created_at: '2026-04-28T10:00:00.000Z',
        updated_at: '2026-04-28T10:00:00.000Z',
      },
    ];

    mockDb.getAllSync.mockReturnValue(mockRows);

    const result = getAllTrades();

    expect(mockDb.getAllSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.getAllSync.mock.calls[0][0];
    expect(sqlArg).toContain('ORDER BY trade_date DESC, created_at DESC');

    expect(result).toHaveLength(2);
    expect(result[0].ticker).toBe('MSFT');
    expect(result[0].direction).toBe('buy');
    expect(result[1].ticker).toBe('AAPL');
    expect(result[1].direction).toBe('sell');
    expect(result[1].feesCents).toBe(500);
  });

  // ─── getTradeById ───
  it('getTradeById returns Trade when found', () => {
    const mockRow = {
      id: 'uuid-1', ticker: 'AAPL', shares: 100,
      price_per_share_cents: 15000, trade_date: '2026-05-01',
      direction: 'buy', fees_cents: null, thumbnail_uri: null,
      notes: null, created_at: '2026-05-01T00:00:00.000Z',
      updated_at: '2026-05-01T00:00:00.000Z',
    };

    mockDb.getFirstSync.mockReturnValue(mockRow);

    const result = getTradeById('uuid-1');

    expect(mockDb.getFirstSync).toHaveBeenCalledOnce();
    expect(mockDb.getFirstSync.mock.calls[0][0]).toContain('WHERE id = ?');
    expect(mockDb.getFirstSync.mock.calls[0][1]).toEqual(['uuid-1']);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('uuid-1');
    expect(result!.ticker).toBe('AAPL');
  });

  it('getTradeById returns null when not found', () => {
    mockDb.getFirstSync.mockReturnValue(null);

    const result = getTradeById('nonexistent');

    expect(result).toBeNull();
  });

  // ─── updateTrade ───
  it('updateTrade updates only provided fields', () => {
    const mockUpdatedRow = {
      id: 'uuid-1', ticker: 'GOOGL', shares: 100,
      price_per_share_cents: 15000, trade_date: '2026-05-01',
      direction: 'buy', fees_cents: null, thumbnail_uri: null,
      notes: 'Updated notes', created_at: '2026-05-01T00:00:00.000Z',
      updated_at: '2026-05-01T12:00:00.000Z',
    };

    mockDb.getFirstSync.mockReturnValue(mockUpdatedRow);

    const result = updateTrade('uuid-1', { ticker: 'GOOGL', notes: 'Updated notes' });

    // Should call runSync once for the update
    expect(mockDb.runSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.runSync.mock.calls[0][0];
    expect(sqlArg).toContain('UPDATE trades SET');
    expect(sqlArg).toContain('ticker');
    expect(sqlArg).toContain('notes');
    expect(sqlArg).toContain('updated_at');
    expect(sqlArg).toContain('WHERE id = ?');

    expect(result).not.toBeNull();
    expect(result!.ticker).toBe('GOOGL');
    expect(result!.notes).toBe('Updated notes');
  });

  // ─── deleteTrade ───
  it('deleteTrade deletes row by id', () => {
    deleteTrade('uuid-1');

    expect(mockDb.runSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.runSync.mock.calls[0][0];
    expect(sqlArg).toContain('DELETE FROM trades');
    expect(sqlArg).toContain('WHERE id = ?');
    expect(mockDb.runSync.mock.calls[0][1]).toEqual(['uuid-1']);
  });

  // ─── logFailedOCR ───
  it('logFailedOCR inserts into failed_ocr_log and returns FailedOCRLog', () => {
    const result = logFailedOCR(
      'file:///screenshot.png',
      'raw OCR text',
      'Low confidence extraction'
    );

    expect(mockDb.runSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.runSync.mock.calls[0][0];
    const paramsArg = mockDb.runSync.mock.calls[0][1];
    expect(sqlArg).toContain('INSERT INTO failed_ocr_log');
    expect(paramsArg).toHaveLength(5);
    expect(paramsArg[1]).toBe('file:///screenshot.png');
    expect(paramsArg[2]).toBe('raw OCR text');
    expect(paramsArg[3]).toBe('Low confidence extraction');

    expect(result).toBeDefined();
    expect(result.imageUri).toBe('file:///screenshot.png');
    expect(result.rawText).toBe('raw OCR text');
    expect(result.errorMessage).toBe('Low confidence extraction');
  });

  // ─── getFailedOCRLogs ───
  it('getFailedOCRLogs returns FailedOCRLog[] ordered by created_at DESC', () => {
    const mockRows = [
      {
        id: 'uuid-1', image_uri: 'file:///img1.png',
        raw_text: 'text1', error_message: 'error1',
        created_at: '2026-05-01T12:00:00.000Z',
      },
      {
        id: 'uuid-2', image_uri: 'file:///img2.png',
        raw_text: 'text2', error_message: 'error2',
        created_at: '2026-04-28T10:00:00.000Z',
      },
    ];

    mockDb.getAllSync.mockReturnValue(mockRows);

    const result = getFailedOCRLogs();

    expect(mockDb.getAllSync).toHaveBeenCalledOnce();
    expect(mockDb.getAllSync.mock.calls[0][0]).toContain('ORDER BY created_at DESC');

    expect(result).toHaveLength(2);
    expect(result[0].imageUri).toBe('file:///img1.png');
    expect(result[0].errorMessage).toBe('error1');
    expect(result[1].imageUri).toBe('file:///img2.png');
  });

  // ─── clearFailedOCRLogs ───
  it('clearFailedOCRLogs deletes all rows from failed_ocr_log', () => {
    clearFailedOCRLogs();

    expect(mockDb.runSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.runSync.mock.calls[0][0];
    expect(sqlArg).toContain('DELETE FROM failed_ocr_log');
    expect(sqlArg).not.toContain('WHERE'); // Deletes ALL rows
  });
});
