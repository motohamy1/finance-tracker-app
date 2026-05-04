import { create } from 'zustand';
import type { Category, Expense, ExpenseFormData, CategoryFormData, MoneySource } from '@/types';
import {
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getExpenseCountForCategory, getExpensesByCategory,
  createExpense, updateExpense, deleteExpense,
  getAllMoneySources, createMoneySource, updateMoneySource, deleteMoneySource,
  getExpenseCountForMoneySource,
} from '@/services/database';
import { generateUUID, getTodayISO } from '@/utils/format';
import { getNextAccentColor, MONEY_SOURCE_PALETTE, MONEY_SOURCE_DEFAULTS } from '@/types';

export interface MoneySourceFormData {
  name: string;
  colorHex?: string;
  iconName?: string;
  currencySymbol?: string;
}

interface ExpenseStoreState {
  // ─── State ───
  categories: Category[];
  expensesByCategory: Record<string, Expense[]>; // categoryId → expenses
  isLoading: boolean;
  isInitialized: boolean;

  // ─── Money Source state ───
  moneySources: MoneySource[];

  // ─── Initialization ───
  initialize: () => void;

  // ─── Category Actions ───
  addCategory: (data: CategoryFormData) => Category;
  renameCategory: (categoryId: string, newName: string) => void;
  removeCategory: (categoryId: string) => void;
  reorderCategories: (orderedIds: string[]) => void;

  // ─── Expense Actions ───
  addExpense: (data: ExpenseFormData) => Expense;
  editExpense: (expenseId: string, data: Partial<ExpenseFormData>) => void;
  removeExpense: (expenseId: string) => void;

  // ─── Money Source Actions ───
  addMoneySource: (data: MoneySourceFormData) => MoneySource;
  renameMoneySource: (id: string, newName: string) => void;
  updateMoneySourceBalance: (id: string, balanceCents: number) => void;
  updateMoneySourceCurrency: (id: string, symbol: string) => void;
  updateMoneySourceColor: (id: string, colorHex: string) => void;
  removeMoneySource: (id: string) => void;
  reorderMoneySources: (orderedIds: string[]) => void;

  // ─── Helpers ───
  getExpenseCount: (categoryId: string) => number;
  getCategoryById: (categoryId: string) => Category | undefined;
  getMoneySourceExpenseCount: (moneySourceId: string) => number;
}

export const useExpenseStore = create<ExpenseStoreState>((set, get) => ({
  categories: [],
  expensesByCategory: {},
  isLoading: true,
  isInitialized: false,
  moneySources: [],

  // ─── Initialize: load all data from SQLite ───
  initialize: () => {
    if (get().isInitialized) return;
    try {
      const categories = getAllCategories();
      const expensesByCategory: Record<string, Expense[]> = {};
      for (const cat of categories) {
        expensesByCategory[cat.id] = getExpensesByCategory(cat.id);
      }

      // Load money sources
      let moneySources = getAllMoneySources();

      // Seed defaults on first launch (per D-01)
      if (moneySources.length === 0) {
        const uuids = [
          generateUUID(), generateUUID(), generateUUID(), generateUUID(),
        ];
        moneySources = MONEY_SOURCE_DEFAULTS.map((def, i) =>
          createMoneySource(uuids[i], def.name, def.colorHex, def.iconName, i, '$')
        );
      }

      set({ categories, expensesByCategory, moneySources, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize expense store:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  // ─── Category CRUD ───
  addCategory: (data) => {
    const state = get();
    const id = generateUUID();
    const colorHex = CATEGORY_ACCENT_PALETTE[Math.floor(Math.random() * CATEGORY_ACCENT_PALETTE.length)];
    const sortOrder = state.categories.length;
    const category = createCategory(id, data.name.trim(), colorHex, sortOrder);
    set({
      categories: [...state.categories, category],
      expensesByCategory: { ...state.expensesByCategory, [category.id]: [] },
    });
    return category;
  },

  renameCategory: (categoryId, newName) => {
    updateCategory(categoryId, { name: newName.trim() });
    set({
      categories: get().categories.map((c) =>
        c.id === categoryId ? { ...c, name: newName.trim(), updatedAt: new Date().toISOString() } : c
      ),
    });
  },

  removeCategory: (categoryId) => {
    deleteCategory(categoryId);
    const { [categoryId]: _, ...remaining } = get().expensesByCategory;
    set({
      categories: get().categories.filter((c) => c.id !== categoryId),
      expensesByCategory: remaining,
    });
  },

  reorderCategories: (orderedIds) => {
    const state = get();
    const reordered = orderedIds.map((id, index) => {
      const cat = state.categories.find((c) => c.id === id);
      if (!cat) return null;
      updateCategory(id, { sortOrder: index });
      return { ...cat, sortOrder: index };
    }).filter(Boolean) as Category[];
    set({ categories: reordered });
  },

  // ─── Expense CRUD ───
  addExpense: (data) => {
    const id = generateUUID();
    const expense = createExpense(
      id, data.categoryId, data.moneySourceId ?? null, data.title.trim(), data.amountCents,
      data.date || getTodayISO(), data.notes?.trim() || null
    );
    set({
      expensesByCategory: {
        ...get().expensesByCategory,
        [data.categoryId]: [expense, ...(get().expensesByCategory[data.categoryId] || [])],
      },
    });
    return expense;
  },

  editExpense: (expenseId, data) => {
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title.trim();
    if (data.amountCents !== undefined) updates.amountCents = data.amountCents;
    if (data.date !== undefined) updates.date = data.date;
    if (data.notes !== undefined) updates.notes = data.notes?.trim() || null;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
    if (data.moneySourceId !== undefined) updates.moneySourceId = data.moneySourceId;

    const updated = updateExpense(expenseId, updates as Parameters<typeof updateExpense>[1]);
    if (!updated) return;

    set((state) => {
      const newExpensesByCategory = { ...state.expensesByCategory };
      for (const catId of Object.keys(newExpensesByCategory)) {
        newExpensesByCategory[catId] = newExpensesByCategory[catId].filter((e) => e.id !== expenseId);
      }
      const targetCatId = updated.categoryId;
      if (!newExpensesByCategory[targetCatId]) newExpensesByCategory[targetCatId] = [];
      newExpensesByCategory[targetCatId] = [updated, ...newExpensesByCategory[targetCatId]];
      return { expensesByCategory: newExpensesByCategory };
    });
  },

  removeExpense: (expenseId) => {
    const state = get();
    let targetCategoryId: string | null = null;
    for (const [catId, expenses] of Object.entries(state.expensesByCategory)) {
      if (expenses.some((e) => e.id === expenseId)) {
        targetCategoryId = catId;
        break;
      }
    }
    deleteExpense(expenseId);
    if (targetCategoryId) {
      set({
        expensesByCategory: {
          ...state.expensesByCategory,
          [targetCategoryId]: state.expensesByCategory[targetCategoryId].filter((e) => e.id !== expenseId),
        },
      });
    }
  },

  // ─── Money Source Actions ───
  addMoneySource: (data) => {
    const state = get();
    const id = generateUUID();
    const colorHex = data.colorHex ?? MONEY_SOURCE_PALETTE[state.moneySources.length % MONEY_SOURCE_PALETTE.length];
    const iconName = data.iconName ?? 'wallet-outline';
    const currencySymbol = data.currencySymbol ?? '$';
    const sortOrder = state.moneySources.length;
    const source = createMoneySource(id, data.name.trim(), colorHex, iconName, sortOrder, currencySymbol);
    set({ moneySources: [...state.moneySources, source] });
    return source;
  },

  renameMoneySource: (id, newName) => {
    updateMoneySource(id, { name: newName.trim() });
    set({
      moneySources: get().moneySources.map((s) =>
        s.id === id ? { ...s, name: newName.trim(), updatedAt: new Date().toISOString() } : s
      ),
    });
  },

  updateMoneySourceBalance: (id, balanceCents) => {
    updateMoneySource(id, { balanceCents });
    set({
      moneySources: get().moneySources.map((s) =>
        s.id === id ? { ...s, balanceCents, updatedAt: new Date().toISOString() } : s
      ),
    });
  },
  
  updateMoneySourceCurrency: (id, currencySymbol) => {
    updateMoneySource(id, { currencySymbol });
    set({
      moneySources: get().moneySources.map((s) =>
        s.id === id ? { ...s, currencySymbol, updatedAt: new Date().toISOString() } : s
      ),
    });
  },

  updateMoneySourceColor: (id, colorHex) => {
    updateMoneySource(id, { colorHex });
    set({
      moneySources: get().moneySources.map((s) =>
        s.id === id ? { ...s, colorHex, updatedAt: new Date().toISOString() } : s
      ),
    });
  },

  removeMoneySource: (id) => {
    // Per D-03: ON DELETE SET NULL in schema unlinks expenses automatically
    deleteMoneySource(id);
    set({
      moneySources: get().moneySources.filter((s) => s.id !== id),
    });
  },

  reorderMoneySources: (orderedIds) => {
    const state = get();
    const reordered = orderedIds.map((id, index) => {
      const source = state.moneySources.find((s) => s.id === id);
      if (!source) return null;
      updateMoneySource(id, { sortOrder: index });
      return { ...source, sortOrder: index };
    }).filter(Boolean) as MoneySource[];
    set({ moneySources: reordered });
  },

  // ─── Helpers ───
  getExpenseCount: (categoryId) => {
    return get().expensesByCategory[categoryId]?.length ?? 0;
  },

  getCategoryById: (categoryId) => {
    return get().categories.find((c) => c.id === categoryId);
  },

  getMoneySourceExpenseCount: (moneySourceId) => {
    return getExpenseCountForMoneySource(moneySourceId);
  },
}));
