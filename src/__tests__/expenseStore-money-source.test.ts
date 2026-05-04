import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Database ───
const mockDb = {
  runSync: vi.fn(),
  getAllSync: vi.fn(),
  getFirstSync: vi.fn(),
};

// Track mock functions for money source CRUD
const mockGetAllMoneySources = vi.fn();
const mockCreateMoneySource = vi.fn();
const mockUpdateMoneySource = vi.fn();
const mockDeleteMoneySource = vi.fn();
const mockGetExpenseCountForMoneySource = vi.fn();

// Existing mocks
const mockGetAllCategories = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();
const mockGetExpenseCountForCategory = vi.fn();
const mockGetExpensesByCategory = vi.fn();
const mockCreateExpense = vi.fn();
const mockUpdateExpense = vi.fn();
const mockDeleteExpense = vi.fn();

vi.mock('@/db/schema', () => ({
  getDatabase: () => mockDb,
}));

vi.mock('@/services/database', () => ({
  getAllCategories: (...args: unknown[]) => mockGetAllCategories(...args),
  createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
  getExpenseCountForCategory: (...args: unknown[]) => mockGetExpenseCountForCategory(...args),
  getExpensesByCategory: (...args: unknown[]) => mockGetExpensesByCategory(...args),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  updateExpense: (...args: unknown[]) => mockUpdateExpense(...args),
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
  // Money Source CRUD
  getAllMoneySources: (...args: unknown[]) => mockGetAllMoneySources(...args),
  createMoneySource: (...args: unknown[]) => mockCreateMoneySource(...args),
  updateMoneySource: (...args: unknown[]) => mockUpdateMoneySource(...args),
  deleteMoneySource: (...args: unknown[]) => mockDeleteMoneySource(...args),
  getExpenseCountForMoneySource: (...args: unknown[]) => mockGetExpenseCountForMoneySource(...args),
}));

import { useExpenseStore } from '@/stores/expenseStore';

// Helper: a mock MoneySource as returned by createMoneySource
function makeMockSource(overrides: Partial<{
  id: string; name: string; colorHex: string; iconName: string;
  balanceCents: number; sortOrder: number;
}> = {}) {
  return {
    id: overrides.id ?? 'ms-1',
    name: overrides.name ?? 'Cash',
    colorHex: overrides.colorHex ?? '#22C55E',
    iconName: overrides.iconName ?? 'cash-outline',
    balanceCents: overrides.balanceCents ?? 0,
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: '2026-05-04T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z',
  };
}

describe('expenseStore — Money Source Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state between tests
    useExpenseStore.setState({
      categories: [],
      expensesByCategory: {},
      moneySources: [],
      isLoading: true,
      isInitialized: false,
    });
  });

  // ─── Seed Defaults ───
  it('seeds four default money sources on initialize() when none exist', () => {
    mockGetAllCategories.mockReturnValue([]);
    mockGetAllMoneySources.mockReturnValue([]); // Empty = first launch

    // Mock createMoneySource to return a source with the given params
    mockCreateMoneySource.mockImplementation((id: string, name: string, colorHex: string, iconName: string, sortOrder: number) =>
      makeMockSource({ id, name, colorHex, iconName, sortOrder })
    );

    useExpenseStore.getState().initialize();

    // Should create 4 default sources
    expect(mockCreateMoneySource).toHaveBeenCalledTimes(4);

    const state = useExpenseStore.getState();
    expect(state.moneySources).toHaveLength(4);
    expect(state.moneySources[0].name).toBe('Cash');
    expect(state.moneySources[0].colorHex).toBe('#22C55E');
    expect(state.moneySources[1].name).toBe('Bank');
    expect(state.moneySources[2].name).toBe('Savings');
    expect(state.moneySources[3].name).toBe('Borrowed');
    expect(state.isInitialized).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('does not create duplicate defaults when money sources already exist', () => {
    mockGetAllCategories.mockReturnValue([]);
    mockGetAllMoneySources.mockReturnValue([
      makeMockSource({ id: 'ms-cash', name: 'Cash', sortOrder: 0 }),
      makeMockSource({ id: 'ms-bank', name: 'Bank', sortOrder: 1 }),
    ]);

    useExpenseStore.getState().initialize();

    // Should NOT call createMoneySource because sources already exist
    expect(mockCreateMoneySource).not.toHaveBeenCalled();

    const state = useExpenseStore.getState();
    expect(state.moneySources).toHaveLength(2);
    expect(state.isInitialized).toBe(true);
  });

  // ─── addMoneySource ───
  it('addMoneySource creates a source with next palette color and appends to state', () => {
    // Set up existing state with 2 sources
    useExpenseStore.setState({
      moneySources: [
        makeMockSource({ id: 'ms-1', name: 'Cash', sortOrder: 0 }),
        makeMockSource({ id: 'ms-2', name: 'Bank', sortOrder: 1 }),
      ],
      isInitialized: true,
      isLoading: false,
    });

    const newSource = makeMockSource({
      id: 'ms-3', name: 'Investments',
      colorHex: '#14B8A6', iconName: 'wallet-outline', sortOrder: 2,
    });
    mockCreateMoneySource.mockReturnValue(newSource);

    const result = useExpenseStore.getState().addMoneySource({ name: 'Investments' });

    // Should call createMoneySource with next palette color
    expect(mockCreateMoneySource).toHaveBeenCalledOnce();
    const callArgs = mockCreateMoneySource.mock.calls[0];
    expect(callArgs[1]).toBe('Investments'); // name
    expect(callArgs[2]).toBe('#14B8A6'); // 3rd color in palette (0-indexed: 2)
    expect(callArgs[3]).toBe('wallet-outline'); // default icon if not provided
    expect(callArgs[4]).toBe(2); // sortOrder = existing count

    // Should appear in state
    const state = useExpenseStore.getState();
    expect(state.moneySources).toHaveLength(3);
    expect(state.moneySources[2].name).toBe('Investments');
    expect(result).toBeDefined();
  });

  // ─── renameMoneySource ───
  it('renameMoneySource updates name in DB and state', () => {
    useExpenseStore.setState({
      moneySources: [makeMockSource({ id: 'ms-1', name: 'Cash' })],
      isInitialized: true,
      isLoading: false,
    });

    useExpenseStore.getState().renameMoneySource('ms-1', 'Physical Cash');

    expect(mockUpdateMoneySource).toHaveBeenCalledWith('ms-1', { name: 'Physical Cash' });
    const state = useExpenseStore.getState();
    expect(state.moneySources[0].name).toBe('Physical Cash');
  });

  // ─── updateMoneySourceBalance ───
  it('updateMoneySourceBalance persists balance to DB and state', () => {
    useExpenseStore.setState({
      moneySources: [makeMockSource({ id: 'ms-1', name: 'Cash', balanceCents: 0 })],
      isInitialized: true,
      isLoading: false,
    });

    useExpenseStore.getState().updateMoneySourceBalance('ms-1', 50000);

    expect(mockUpdateMoneySource).toHaveBeenCalledWith('ms-1', { balanceCents: 50000 });
    const state = useExpenseStore.getState();
    expect(state.moneySources[0].balanceCents).toBe(50000);
  });

  // ─── removeMoneySource ───
  it('removeMoneySource deletes from DB and removes from state', () => {
    useExpenseStore.setState({
      moneySources: [
        makeMockSource({ id: 'ms-1', name: 'Cash' }),
        makeMockSource({ id: 'ms-2', name: 'Bank' }),
      ],
      isInitialized: true,
      isLoading: false,
    });

    useExpenseStore.getState().removeMoneySource('ms-1');

    expect(mockDeleteMoneySource).toHaveBeenCalledWith('ms-1');
    const state = useExpenseStore.getState();
    expect(state.moneySources).toHaveLength(1);
    expect(state.moneySources[0].id).toBe('ms-2');
  });

  // ─── reorderMoneySources ───
  it('reorderMoneySources updates sort_order in DB and reorders state', () => {
    useExpenseStore.setState({
      moneySources: [
        makeMockSource({ id: 'ms-1', name: 'Cash', sortOrder: 0 }),
        makeMockSource({ id: 'ms-2', name: 'Bank', sortOrder: 1 }),
        makeMockSource({ id: 'ms-3', name: 'Savings', sortOrder: 2 }),
      ],
      isInitialized: true,
      isLoading: false,
    });

    useExpenseStore.getState().reorderMoneySources(['ms-2', 'ms-3', 'ms-1']);

    expect(mockUpdateMoneySource).toHaveBeenCalledTimes(3);
    expect(mockUpdateMoneySource).toHaveBeenCalledWith('ms-2', { sortOrder: 0 });
    expect(mockUpdateMoneySource).toHaveBeenCalledWith('ms-3', { sortOrder: 1 });
    expect(mockUpdateMoneySource).toHaveBeenCalledWith('ms-1', { sortOrder: 2 });

    const state = useExpenseStore.getState();
    expect(state.moneySources[0].id).toBe('ms-2');
    expect(state.moneySources[1].id).toBe('ms-3');
    expect(state.moneySources[2].id).toBe('ms-1');
  });

  // ─── addExpense with moneySourceId ───
  it('addExpense passes moneySourceId to createExpense', () => {
    useExpenseStore.setState({
      categories: [{ id: 'cat-1', name: 'Food', colorHex: '#0891B2', sortOrder: 0, createdAt: '', updatedAt: '' }],
      expensesByCategory: { 'cat-1': [] },
      isInitialized: true,
      isLoading: false,
    });

    mockCreateExpense.mockReturnValue({
      id: 'exp-1', categoryId: 'cat-1', moneySourceId: 'ms-1',
      title: 'Groceries', amountCents: 5000, date: '2026-05-04',
      notes: null, createdAt: '', updatedAt: '',
    });

    useExpenseStore.getState().addExpense({
      title: 'Groceries', amountCents: 5000, date: '2026-05-04',
      categoryId: 'cat-1', moneySourceId: 'ms-1', notes: '',
    });

    // Verify createExpense was called with moneySourceId
    expect(mockCreateExpense).toHaveBeenCalledOnce();
    const callArgs = mockCreateExpense.mock.calls[0];
    expect(callArgs[2]).toBe('ms-1'); // 3rd param is moneySourceId (after id, categoryId)
  });

  // ─── editExpense with moneySourceId ───
  it('editExpense passes moneySourceId to updateExpense', () => {
    useExpenseStore.setState({
      categories: [{ id: 'cat-1', name: 'Food', colorHex: '#0891B2', sortOrder: 0, createdAt: '', updatedAt: '' }],
      expensesByCategory: {
        'cat-1': [{
          id: 'exp-1', categoryId: 'cat-1', moneySourceId: null,
          title: 'Groceries', amountCents: 5000, date: '2026-05-04',
          notes: null, createdAt: '', updatedAt: '',
        }],
      },
      isInitialized: true,
      isLoading: false,
    });

    mockUpdateExpense.mockReturnValue({
      id: 'exp-1', categoryId: 'cat-1', moneySourceId: 'ms-2',
      title: 'Groceries', amountCents: 5000, date: '2026-05-04',
      notes: null, createdAt: '', updatedAt: '',
    });

    useExpenseStore.getState().editExpense('exp-1', { moneySourceId: 'ms-2' });

    expect(mockUpdateExpense).toHaveBeenCalledOnce();
    const callArgs = mockUpdateExpense.mock.calls[0];
    expect(callArgs[0]).toBe('exp-1');
    expect(callArgs[1]).toHaveProperty('moneySourceId', 'ms-2');
  });
});
