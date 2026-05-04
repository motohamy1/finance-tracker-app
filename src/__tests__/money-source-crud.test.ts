import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Import the service functions — these will be undefined at RED if not yet exported
import {
  getAllMoneySources,
  getMoneySourceById,
  createMoneySource,
  updateMoneySource,
  deleteMoneySource,
  getExpenseCountForMoneySource,
} from '@/services/database';

describe('Money Source CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Export Verification ───
  it('exports all 6 Money Source CRUD functions', () => {
    expect(createMoneySource).toBeDefined();
    expect(typeof createMoneySource).toBe('function');
    expect(getAllMoneySources).toBeDefined();
    expect(typeof getAllMoneySources).toBe('function');
    expect(getMoneySourceById).toBeDefined();
    expect(typeof getMoneySourceById).toBe('function');
    expect(updateMoneySource).toBeDefined();
    expect(typeof updateMoneySource).toBe('function');
    expect(deleteMoneySource).toBeDefined();
    expect(typeof deleteMoneySource).toBe('function');
    expect(getExpenseCountForMoneySource).toBeDefined();
    expect(typeof getExpenseCountForMoneySource).toBe('function');
  });

  // ─── createMoneySource ───
  it('createMoneySource inserts row with parameterized query and returns MoneySource', () => {
    const mockRow = {
      id: 'uuid-ms-1',
      name: 'Cash',
      color_hex: '#22C55E',
      icon_name: 'cash-outline',
      balance_cents: 0,
      sort_order: 0,
      created_at: '2026-05-01T00:00:00.000Z',
      updated_at: '2026-05-01T00:00:00.000Z',
    };

    mockDb.getFirstSync.mockReturnValue(mockRow);

    const result = createMoneySource('uuid-ms-1', 'Cash', '#22C55E', 'cash-outline', 0);

    expect(mockDb.runSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.runSync.mock.calls[0][0];
    const paramsArg = mockDb.runSync.mock.calls[0][1];
    expect(sqlArg).toContain('INSERT INTO money_sources');
    expect(sqlArg).toContain('?'); // Parameterized
    expect(paramsArg).toHaveLength(7);
    expect(paramsArg[0]).toBe('uuid-ms-1');
    expect(paramsArg[1]).toBe('Cash');
    expect(paramsArg[3]).toBe('cash-outline');
    expect(paramsArg[4]).toBe(0); // sort_order = 0

    expect(result).toBeDefined();
    expect(result.id).toBe('uuid-ms-1');
    expect(result.name).toBe('Cash');
    expect(result.colorHex).toBe('#22C55E');
    expect(result.iconName).toBe('cash-outline');
    expect(result.balanceCents).toBe(0);
    expect(result.sortOrder).toBe(0);
  });

  // ─── getAllMoneySources ───
  it('getAllMoneySources returns MoneySource[] ordered by sort_order ASC', () => {
    const mockRows = [
      {
        id: 'ms-1', name: 'Cash', color_hex: '#22C55E', icon_name: 'cash-outline',
        balance_cents: 0, sort_order: 0,
        created_at: '2026-05-01T00:00:00.000Z', updated_at: '2026-05-01T00:00:00.000Z',
      },
      {
        id: 'ms-2', name: 'Bank', color_hex: '#0EA5E9', icon_name: 'business-outline',
        balance_cents: 50000, sort_order: 1,
        created_at: '2026-05-01T00:00:00.000Z', updated_at: '2026-05-01T00:00:00.000Z',
      },
    ];

    mockDb.getAllSync.mockReturnValue(mockRows);

    const result = getAllMoneySources();

    expect(mockDb.getAllSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.getAllSync.mock.calls[0][0];
    expect(sqlArg).toContain('ORDER BY sort_order ASC');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Cash');
    expect(result[0].colorHex).toBe('#22C55E');
    expect(result[1].name).toBe('Bank');
    expect(result[1].balanceCents).toBe(50000);
  });

  // ─── getMoneySourceById ───
  it('getMoneySourceById returns MoneySource when found', () => {
    const mockRow = {
      id: 'uuid-ms-1', name: 'Cash', color_hex: '#22C55E', icon_name: 'cash-outline',
      balance_cents: 15000, sort_order: 0,
      created_at: '2026-05-01T00:00:00.000Z', updated_at: '2026-05-01T00:00:00.000Z',
    };

    mockDb.getFirstSync.mockReturnValue(mockRow);

    const result = getMoneySourceById('uuid-ms-1');

    expect(mockDb.getFirstSync).toHaveBeenCalledOnce();
    expect(mockDb.getFirstSync.mock.calls[0][0]).toContain('WHERE id = ?');
    expect(mockDb.getFirstSync.mock.calls[0][1]).toEqual(['uuid-ms-1']);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('uuid-ms-1');
    expect(result!.name).toBe('Cash');
  });

  it('getMoneySourceById returns null when not found', () => {
    mockDb.getFirstSync.mockReturnValue(null);

    const result = getMoneySourceById('nonexistent');

    expect(result).toBeNull();
  });

  // ─── updateMoneySource ───
  it('updateMoneySource updates only provided fields', () => {
    const mockUpdatedRow = {
      id: 'uuid-ms-1', name: 'Cash Updated', color_hex: '#22C55E', icon_name: 'wallet-outline',
      balance_cents: 50000, sort_order: 1,
      created_at: '2026-05-01T00:00:00.000Z', updated_at: '2026-05-01T12:00:00.000Z',
    };

    mockDb.getFirstSync.mockReturnValue(mockUpdatedRow);

    const result = updateMoneySource('uuid-ms-1', { name: 'Cash Updated', balanceCents: 50000 });

    expect(mockDb.runSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.runSync.mock.calls[0][0];
    expect(sqlArg).toContain('UPDATE money_sources SET');
    expect(sqlArg).toContain('name');
    expect(sqlArg).toContain('balance_cents');
    expect(sqlArg).toContain('updated_at');
    expect(sqlArg).toContain('WHERE id = ?');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Cash Updated');
    expect(result!.balanceCents).toBe(50000);
  });

  // ─── deleteMoneySource ───
  it('deleteMoneySource deletes row by id', () => {
    deleteMoneySource('uuid-ms-1');

    expect(mockDb.runSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.runSync.mock.calls[0][0];
    expect(sqlArg).toContain('DELETE FROM money_sources');
    expect(sqlArg).toContain('WHERE id = ?');
    expect(mockDb.runSync.mock.calls[0][1]).toEqual(['uuid-ms-1']);
  });

  // ─── getExpenseCountForMoneySource ───
  it('getExpenseCountForMoneySource returns count of expenses for given source', () => {
    mockDb.getFirstSync.mockReturnValue({ count: 5 });

    const result = getExpenseCountForMoneySource('uuid-ms-1');

    expect(mockDb.getFirstSync).toHaveBeenCalledOnce();
    const sqlArg = mockDb.getFirstSync.mock.calls[0][0];
    expect(sqlArg).toContain('COUNT(*) as count');
    expect(sqlArg).toContain('money_source_id = ?');
    expect(mockDb.getFirstSync.mock.calls[0][1]).toEqual(['uuid-ms-1']);

    expect(result).toBe(5);
  });

  it('getExpenseCountForMoneySource returns 0 when no expenses linked', () => {
    mockDb.getFirstSync.mockReturnValue(null);

    const result = getExpenseCountForMoneySource('uuid-ms-1');

    expect(result).toBe(0);
  });
});
