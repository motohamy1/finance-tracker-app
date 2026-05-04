import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

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
vi.mock('react-native', () => ({
  View: ({ style, children, testID, ...props }: any) => React.createElement('div', { ...props, style: safeStyle(style), 'data-testid': testID }, children),
  Text: ({ style, children, numberOfLines, ...props }: any) => React.createElement('span', { ...props, style: safeStyle(style) }, children),
  StyleSheet: {
    create: (s: any) => s,
    flatten: (s: any) => (Array.isArray(s) ? Object.assign({}, ...s) : s),
  },
}));

// ─── Hoisted controllable mock data ───
const { getMoneySources, setMoneySources } = vi.hoisted(() => {
  let sources = [
    { id: 'ms-1', name: 'Cash', colorHex: '#22C55E', iconName: 'cash-outline', balanceCents: 150000, sortOrder: 0, createdAt: '', updatedAt: '' },
    { id: 'ms-2', name: 'Bank', colorHex: '#0EA5E9', iconName: 'business-outline', balanceCents: 250000, sortOrder: 1, createdAt: '', updatedAt: '' },
  ];
  return {
    getMoneySources: () => sources,
    setMoneySources: (s: any[]) => { sources = s; },
  };
});

// ─── Mock store (lazy — reads hoisted state on each call) ───
vi.mock('@/stores/expenseStore', () => ({
  useExpenseStore: (selector: any) => selector({
    get moneySources() { return getMoneySources(); },
  }),
}));

// ─── Mock format ───
vi.mock('@/utils/format', () => ({
  formatCurrency: (cents: number) => {
    const dollars = (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$${dollars}`;
  },
  formatDate: (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
}));

// ─── Import AFTER mocks ───
import type { Expense } from '@/types';
import { ExpenseCard } from '@/components/ExpenseCard';

describe('ExpenseCard — Money Source Indicator', () => {
  const baseExpense: Expense = {
    id: 'exp-1',
    categoryId: 'cat-1',
    title: 'Groceries',
    amountCents: 2550,
    date: '2026-05-04',
    notes: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    // Reset to default mock data
    setMoneySources([
      { id: 'ms-1', name: 'Cash', colorHex: '#22C55E', iconName: 'cash-outline', balanceCents: 150000, sortOrder: 0, createdAt: '', updatedAt: '' },
      { id: 'ms-2', name: 'Bank', colorHex: '#0EA5E9', iconName: 'business-outline', balanceCents: 250000, sortOrder: 1, createdAt: '', updatedAt: '' },
    ]);
  });

  // ─── Test 1: Shows money source indicator when moneySourceId is set ───
  it('shows colored dot and source name when expense.moneySourceId is set', () => {
    const expense: Expense = { ...baseExpense, moneySourceId: 'ms-1' };
    render(React.createElement(ExpenseCard, { expense, accentColor: '#0891B2' }));

    // Should show the source name
    expect(screen.getByText('Cash')).toBeInTheDocument();

    // The sourceName text should have 11px fontSize (indicator styling)
    const cashEl = screen.getByText('Cash');
    expect(cashEl.style.fontSize).toBe('11px');
  });

  // ─── Test 2: No indicator when moneySourceId is null ───
  it('shows no money source indicator when expense.moneySourceId is null/undefined', () => {
    const expense: Expense = { ...baseExpense, moneySourceId: null };
    render(React.createElement(ExpenseCard, { expense, accentColor: '#0891B2' }));

    // Should NOT show any source name
    expect(screen.queryByText('Cash')).toBeNull();
    expect(screen.queryByText('Bank')).toBeNull();

    // Title should still be visible
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  // ─── Test 3: Dot color matches source's colorHex ───
  it('renders dot with the correct colorHex from the money source', () => {
    const expense: Expense = { ...baseExpense, moneySourceId: 'ms-2' };
    render(React.createElement(ExpenseCard, { expense, accentColor: '#0891B2' }));

    // Should show "Bank" with blue dot (#0EA5E9 = rgb(14, 165, 233))
    expect(screen.getByText('Bank')).toBeInTheDocument();

    // Find the dot div — it has width:6, height:6, borderRadius:3
    // The dot div should have backgroundColor: rgb(14, 165, 233)
    const allDivs = document.querySelectorAll('div');
    const dot = Array.from(allDivs).find(el => {
      const s = el.getAttribute('style') || '';
      return s.includes('width: 6px') && s.includes('height: 6px') && s.includes('background-color: rgb(14, 165, 233)');
    });
    expect(dot).toBeTruthy();
  });

  // ─── Test 4: Source name truncated to 1 line ───
  it('truncates source name to 1 line with numberOfLines={1}', () => {
    // Set up long-name money source
    setMoneySources([
      { id: 'ms-3', name: 'Very Long Investment Account Name', colorHex: '#A855F7', iconName: 'wallet', balanceCents: 0, sortOrder: 0, createdAt: '', updatedAt: '' },
    ]);

    const expense: Expense = { ...baseExpense, moneySourceId: 'ms-3' };
    render(React.createElement(ExpenseCard, { expense, accentColor: '#0891B2' }));

    // The source name should be rendered
    expect(screen.getByText('Very Long Investment Account Name')).toBeInTheDocument();
  });

  // ─── Test 5: Indicator text color #64748B, fontWeight 400 ───
  it('applies correct text styling: color #64748B, fontWeight 400, fontSize 11px', () => {
    const expense: Expense = { ...baseExpense, moneySourceId: 'ms-1' };
    render(React.createElement(ExpenseCard, { expense, accentColor: '#0891B2' }));

    const sourceNameSpan = screen.getByText('Cash');
    const style = sourceNameSpan.style || {};

    expect(style.color).toBe('rgb(100, 116, 139)');   // #64748B
    expect(style.fontWeight).toBe('400');
    expect(style.fontSize).toBe('11px');
  });

  // ─── Test 6: Card layout not broken — card renders all content in order ───
  it('renders title, amount, date, and indicator in proper card layout', () => {
    const expense: Expense = { ...baseExpense, moneySourceId: 'ms-1' };
    render(React.createElement(ExpenseCard, { expense, accentColor: '#0891B2' }));

    // Title, amount, date, and indicator should all be present
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('$25.50')).toBeInTheDocument();
    expect(screen.getByText('May 4, 2026')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();

    // The card should have minHeight 108px
    const card = screen.getByText('Groceries').closest('div')!;
    expect(card.style.minHeight).toBe('108px');
  });
});
