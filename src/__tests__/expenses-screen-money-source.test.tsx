import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ─── Style sanitizer ───
const CSS_COMPATIBLE = new Set([
  'backgroundColor', 'color', 'fontSize', 'fontWeight', 'height', 'width',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
  'zIndex', 'flexDirection', 'alignItems', 'justifyContent', 'padding',
  'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom',
  'paddingLeft', 'paddingRight', 'margin', 'marginTop', 'marginBottom',
  'marginLeft', 'marginRight', 'borderWidth', 'borderColor', 'borderStyle',
  'position', 'top', 'left', 'right', 'bottom', 'display', 'opacity',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'minWidth', 'maxWidth',
  'minHeight', 'maxHeight', 'textAlign', 'letterSpacing', 'lineHeight',
  'textTransform', 'overflow', 'cursor', 'gap',
]);

function safeStyle(style: any): any {
  if (!style) return undefined;
  if (typeof style === 'number') return undefined;
  if (Array.isArray(style)) return Object.assign({}, ...style.map(safeStyle));
  const out: any = {};
  for (const key of Object.keys(style)) {
    if (CSS_COMPATIBLE.has(key)) {
      const val = style[key];
      if (key === 'borderRadius' && typeof val === 'number') out[key] = val + 'px';
      else if (typeof val === 'number' && !['flex', 'flexGrow', 'flexShrink', 'opacity', 'zIndex', 'fontWeight', 'letterSpacing'].includes(key)) {
        out[key] = val + 'px';
      } else out[key] = val;
    }
  }
  return out;
}

// ─── Mock react-native ───
vi.mock('react-native', () => {
  const FlatList = React.forwardRef(({ data, renderItem, keyExtractor, ListHeaderComponent, ListFooterComponent, numColumns, columnWrapperStyle, contentContainerStyle, ...props }: any, ref: any) => {
    const Header = ListHeaderComponent;
    const Footer = ListFooterComponent;
    const items = data?.map((item: any, index: number) => {
      const el = renderItem({ item, index });
      return React.cloneElement(el, { key: keyExtractor?.(item, index) ?? index });
    }) ?? [];
    return React.createElement('div', {
      ref,
      'data-testid': 'flatlist',
      'data-header': !!Header,
      'data-footer': !!Footer,
      'data-columns': numColumns,
    }, ...(Header ? [React.createElement('div', { key: 'header', 'data-testid': 'list-header' }, typeof Header === 'function' ? React.createElement(Header) : Header)] : []), ...items, ...(Footer ? [React.createElement('div', { key: 'footer', 'data-testid': 'list-footer' }, typeof Footer === 'function' ? React.createElement(Footer) : Footer)] : []));
  });
  FlatList.displayName = 'FlatList';

  return {
    View: ({ style, children, testID, ...props }: any) => React.createElement('div', { ...props, style: safeStyle(style), 'data-testid': testID }, children),
    Text: ({ style, children, numberOfLines, ...props }: any) => React.createElement('span', { ...props, style: safeStyle(style) }, children),
    TextInput: ({ style, value, onChangeText, onBlur, onSubmitEditing, autoFocus, placeholder, placeholderTextColor, returnKeyType, ...props }: any) =>
      React.createElement('input', { ...props, style: safeStyle(style), value: value ?? '', placeholder, onChange: (e: any) => onChangeText?.(e.target.value), onBlur, onKeyDown: (e: any) => { if (e.key === 'Enter') onSubmitEditing?.(); }, autoFocus }, null),
    TouchableOpacity: ({ style, children, onPress, onLongPress, activeOpacity, ...props }: any) => {
      const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      return React.createElement('div', { ...props, role: 'button', tabIndex: 0, style: safeStyle({ ...baseStyle, cursor: 'pointer' }), onClick: onPress, onDoubleClick: onLongPress, 'data-longpress': !!onLongPress }, children);
    },
    Pressable: ({ style, children, onPress, onLongPress, ...props }: any) => {
      const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      return React.createElement('div', { ...props, role: 'button', tabIndex: 0, style: safeStyle({ ...baseStyle, cursor: 'pointer' }), onClick: onPress, onDoubleClick: onLongPress }, children);
    },
    FlatList,
    Modal: ({ visible, transparent, animationType, onRequestClose, children }: any) =>
      visible ? React.createElement('div', { 'data-testid': 'modal' }, children) : null,
    KeyboardAvoidingView: ({ style, behavior, children, keyboardVerticalOffset, ...props }: any) =>
      React.createElement('div', { ...props, style: safeStyle(style) }, children),
    Alert: { alert: vi.fn() },
    ActionSheetIOS: { showActionSheetWithOptions: vi.fn() },
    Platform: { OS: 'ios' as const, select: (spec: any) => spec.ios },
    StyleSheet: {
      create: (s: any) => s,
      flatten: (s: any) => (Array.isArray(s) ? Object.assign({}, ...s) : s),
      absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    },
    Keyboard: { dismiss: vi.fn() },
  };
});

// ─── Mock @expo/vector-icons ───
vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}`, style: { fontSize: size, color } }, name),
}));

// ─── Mock react-native-safe-area-context ───
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ style, children, edges, ...props }: any) =>
    React.createElement('div', { ...props, style: safeStyle(style) }, children),
}));

// ─── Hoisted mutable store state (for dynamic mock overrides) ───
const { getStoreState, setStoreCategories, resetStoreState, mockAddCategory, mockRenameCategory, mockRemoveCategory, mockGetExpenseCount } = vi.hoisted(() => {
  let categories = [
    { id: 'cat-1', name: 'Food', colorHex: '#0891B2', sortOrder: 0, createdAt: '', updatedAt: '' },
  ];
  const addCategory = vi.fn();
  const renameCategory = vi.fn();
  const removeCategory = vi.fn();
  const getExpenseCount = vi.fn(() => 0);
  return {
    getStoreState: () => ({
      categories,
      expensesByCategory: { 'cat-1': [] },
      moneySources: [],
      isLoading: false,
      addCategory,
      renameCategory,
      removeCategory,
      getExpenseCount,
    }),
    setStoreCategories: (cats: any[]) => { categories = cats; },
    resetStoreState: () => {
      categories = [
        { id: 'cat-1', name: 'Food', colorHex: '#0891B2', sortOrder: 0, createdAt: '', updatedAt: '' },
      ];
    },
    mockAddCategory: addCategory,
    mockRenameCategory: renameCategory,
    mockRemoveCategory: removeCategory,
    mockGetExpenseCount: getExpenseCount,
  };
});

vi.mock('@/stores/expenseStore', () => ({
  useExpenseStore: (selector: any) => selector(getStoreState()),
}));

// ─── Hoisted mock functions (must be in vi.hoisted to avoid TDZ with vi.mock) ───
const { BalanceCardMock, MoneySourceRowMock, TotalBalanceSummaryMock } = vi.hoisted(() => ({
  BalanceCardMock: vi.fn(() =>
    React.createElement('div', { 'data-testid': 'balance-card' }, 'BalanceCard')
  ),
  MoneySourceRowMock: vi.fn(({ onSelectSource }: any) =>
    React.createElement('div', {
      'data-testid': 'money-source-row',
      onClick: () => onSelectSource?.({ id: 'ms-1', name: 'Cash', colorHex: '#22C55E' }),
    }, 'MoneySourceRow')
  ),
  TotalBalanceSummaryMock: vi.fn(() =>
    React.createElement('div', { 'data-testid': 'total-balance-summary' }, 'TotalBalanceSummary')
  ),
}));

// ─── Mock ExpenseForm, EmptyState, BalanceCard ───
vi.mock('@/components/ExpenseForm', () => ({
  ExpenseForm: ({ visible, onClose, editingExpense, preselectedCategoryId, preselectedMoneySourceId }: any) =>
    visible ? React.createElement('div', { 'data-testid': 'expense-form', 'data-preselected-ms': preselectedMoneySourceId, 'data-preselected-cat': preselectedCategoryId }, 'ExpenseForm') : null,
}));

vi.mock('@/components/EmptyState', () => ({
  EmptyState: ({ icon, title, body, ctaText, onCtaPress }: any) =>
    React.createElement('div', { 'data-testid': 'empty-state' }, [title, body].join(' - ')),
}));

vi.mock('@/components/BalanceCard', () => ({
  BalanceCard: BalanceCardMock,
}));

// ─── Mock MoneySourceRow and TotalBalanceSummary ───
vi.mock('@/components/MoneySourceRow', () => ({
  MoneySourceRow: MoneySourceRowMock,
}));

vi.mock('@/components/TotalBalanceSummary', () => ({
  TotalBalanceSummary: TotalBalanceSummaryMock,
}));

// ─── Mock types ───
vi.mock('@/types', () => ({
  getCategoryLightTint: (hex: string) => hex + '20', // simple mock — appends alpha
  CURRENCIES: ['EGP', 'USD', 'SAR', 'AED', 'EUR'],
}));

// ─── Import screen AFTER all mocks ───
import ExpensesScreen from '@/app/(expenses)/index';

describe('Expenses Screen — Money Source Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Test 1: BalanceCard is NOT rendered ───
  it('does NOT render BalanceCard (replaced by MoneySourceRow + TotalBalanceSummary)', () => {
    render(React.createElement(ExpensesScreen));
    
    // BalanceCard should NOT be in the DOM
    expect(screen.queryByTestId('balance-card')).toBeNull();
    
    // BalanceCard component should not have been called
    expect(BalanceCardMock).not.toHaveBeenCalled();
  });

  // ─── Test 2: MoneySourceRow renders in ListHeaderComponent ───
  it('renders MoneySourceRow in the FlatList ListHeaderComponent', () => {
    render(React.createElement(ExpensesScreen));
    
    // MoneySourceRow should be rendered
    expect(screen.getByTestId('money-source-row')).toBeInTheDocument();
    
    // It should be inside the list header
    const listHeader = screen.getByTestId('list-header');
    expect(listHeader).toBeInTheDocument();
    expect(listHeader.querySelector('[data-testid="money-source-row"]')).toBeTruthy();
  });

  // ─── Test 3: TotalBalanceSummary renders above MoneySourceRow ───
  it('renders TotalBalanceSummary above MoneySourceRow in ListHeaderComponent', () => {
    render(React.createElement(ExpensesScreen));
    
    // TotalBalanceSummary should be rendered
    expect(screen.getByTestId('total-balance-summary')).toBeInTheDocument();
    
    // It should be inside the list header
    const listHeader = screen.getByTestId('list-header');
    expect(listHeader.querySelector('[data-testid="total-balance-summary"]')).toBeTruthy();
    expect(listHeader.querySelector('[data-testid="money-source-row"]')).toBeTruthy();
    
    // TotalBalanceSummary should appear BEFORE MoneySourceRow in DOM order
    const headerHTML = listHeader.innerHTML;
    const tbsIndex = headerHTML.indexOf('total-balance-summary');
    const msrIndex = headerHTML.indexOf('money-source-row');
    expect(tbsIndex).toBeLessThan(msrIndex);
  });

  // ─── Test 4: Tapping money source card pre-selects for next expense form ───
  it('passes selectedMoneySourceId as preselectedMoneySourceId to ExpenseForm', () => {
    render(React.createElement(ExpensesScreen));
    
    // Tap the money source row (simulates tapping a card)
    fireEvent.click(screen.getByTestId('money-source-row'));
    
    // Now open the form by tapping the FAB (add button)
    const fabIcon = screen.getByTestId('icon-add');
    const fab = fabIcon.closest('[role="button"]')!;
    fireEvent.click(fab);
    
    // ExpenseForm should be rendered with preselectedMoneySourceId = 'ms-1'
    const form = screen.getByTestId('expense-form');
    expect(form).toBeInTheDocument();
    expect(form.getAttribute('data-preselected-ms')).toBe('ms-1');
  });

  // ─── Test 5: FAB preserves money source pre-selection ───
  it('FAB quick-add preserves selectedMoneySourceId pre-selection', () => {
    render(React.createElement(ExpensesScreen));
    
    // First tap money source
    fireEvent.click(screen.getByTestId('money-source-row'));
    
    // Tap FAB
    const fabIcon = screen.getByTestId('icon-add');
    const fab = fabIcon.closest('[role="button"]')!;
    fireEvent.click(fab);
    
    // Form should have the pre-selected money source
    const form = screen.getByTestId('expense-form');
    expect(form.getAttribute('data-preselected-ms')).toBe('ms-1');
  });

  // ─── Test 6: Category card tap passes selectedMoneySourceId to form ───
  it('category card tap passes selectedMoneySourceId to ExpenseForm', () => {
    render(React.createElement(ExpensesScreen));
    
    // Tap money source first
    fireEvent.click(screen.getByTestId('money-source-row'));
    
    // Tap a category card (any grid card with role="button")
    const buttons = screen.getAllByRole('button');
    // Find the category grid card (not the FAB, not the "Create Category" button)
    // The grid card has the category name "Food"
    const foodCard = screen.getByText('Food').closest('[role="button"]')!;
    fireEvent.click(foodCard);
    
    // Form should be open with both pre-selections
    const form = screen.getByTestId('expense-form');
    expect(form).toBeInTheDocument();
    expect(form.getAttribute('data-preselected-ms')).toBe('ms-1');
    expect(form.getAttribute('data-preselected-cat')).toBe('cat-1');
  });

  // ─── Test 7: Empty state screen shows MoneySourceRow + TotalBalanceSummary ───
  it('shows MoneySourceRow + TotalBalanceSummary in empty state (no categories)', () => {
    // Set mock to have zero categories
    setStoreCategories([]);

    render(React.createElement(ExpensesScreen));

    // Should show MoneySourceRow and TotalBalanceSummary even when empty
    expect(screen.getByTestId('money-source-row')).toBeInTheDocument();
    expect(screen.getByTestId('total-balance-summary')).toBeInTheDocument();
    
    // BalanceCard should NOT be shown
    expect(screen.queryByTestId('balance-card')).toBeNull();
    expect(BalanceCardMock).not.toHaveBeenCalled();

    // Reset for other tests
    resetStoreState();
  });

  // ─── Test 8: BalanceCard component file is NOT deleted (only import removed) ───
  it('does not import or render BalanceCard anywhere', () => {
    render(React.createElement(ExpensesScreen));
    
    // BalanceCard should never be rendered in any state
    expect(BalanceCardMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('balance-card')).toBeNull();
  });
});
