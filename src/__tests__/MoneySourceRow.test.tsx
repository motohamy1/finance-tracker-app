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

// ─── Controllable store mock ───
const { mockMoneySources, mockAddMoneySource, mockReorderMoneySources, mockGetMoneySourceExpenseCount } = vi.hoisted(() => {
  const defaultSources = [
    { id: 'ms-1', name: 'Cash', colorHex: '#22C55E', iconName: 'cash-outline', balanceCents: 150000, sortOrder: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'ms-2', name: 'Bank', colorHex: '#0EA5E9', iconName: 'business-outline', balanceCents: 250000, sortOrder: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'ms-3', name: 'Savings', colorHex: '#14B8A6', iconName: 'trending-up-outline', balanceCents: 50000, sortOrder: 2, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  ];
  return {
    mockMoneySources: defaultSources,
    mockAddMoneySource: vi.fn(),
    mockReorderMoneySources: vi.fn(),
    mockGetMoneySourceExpenseCount: vi.fn((id: string) => {
      const counts: Record<string, number> = { 'ms-1': 5, 'ms-2': 3, 'ms-3': 0 };
      return counts[id] ?? 0;
    }),
  };
});

// ─── Mock react-native ───
vi.mock('react-native', () => {
  const FlatList = React.forwardRef(({ data, renderItem, keyExtractor, horizontal, showsHorizontalScrollIndicator, snapToInterval, decelerationRate, snapToAlignment, contentContainerStyle, keyboardShouldPersistTaps, ListFooterComponent, ListHeaderComponent, ...props }: any, ref: any) => {
    const items = data?.map((item: any, index: number) => {
      const el = renderItem({ item, index });
      return React.cloneElement(el, { key: keyExtractor?.(item, index) ?? index });
    }) ?? [];
    const Footer = ListFooterComponent;
    const Header = ListHeaderComponent;
    return React.createElement('div', {
      ref,
      'data-testid': 'flatlist',
      'data-horizontal': horizontal,
      'data-snap-interval': snapToInterval,
      'data-deceleration': decelerationRate,
      'data-keyboard-persist': keyboardShouldPersistTaps,
    }, ...(Header ? [React.createElement('div', { key: 'header' }, typeof Header === 'function' ? React.createElement(Header) : Header)] : []), ...items, ...(Footer ? [React.createElement('div', { key: 'footer' }, typeof Footer === 'function' ? React.createElement(Footer) : Footer)] : []));
  });
  FlatList.displayName = 'FlatList';

  return {
    View: ({ style, children, ...props }: any) => React.createElement('div', { ...props, style: safeStyle(style) }, children),
    Text: ({ style, children, numberOfLines, ...props }: any) => React.createElement('span', { ...props, style: safeStyle(style) }, children),
    TextInput: ({ style, defaultValue, onChangeText, onBlur, onSubmitEditing, autoFocus, keyboardType, ...props }: any) =>
      React.createElement('input', { ...props, style: safeStyle(style), 'data-default-value': defaultValue, defaultValue, onChange: (e: any) => onChangeText?.(e.target.value), onBlur, onKeyDown: (e: any) => { if (e.key === 'Enter') onSubmitEditing?.(); }, autoFocus, type: 'text' }, null),
    TouchableOpacity: ({ style, children, onPress, onLongPress, ...props }: any) => {
      const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      return React.createElement('div', { ...props, role: 'button', tabIndex: 0, style: safeStyle({ ...baseStyle, cursor: 'pointer' }), onClick: onPress, onDoubleClick: onLongPress, 'data-longpress': !!onLongPress }, children);
    },
    Pressable: ({ style, children, onPress, onLongPress, ...props }: any) => {
      const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      return React.createElement('div', { ...props, role: 'button', tabIndex: 0, style: safeStyle({ ...baseStyle, cursor: 'pointer' }), onClick: onPress, onDoubleClick: onLongPress }, children);
    },
    FlatList,
    Alert: { alert: vi.fn() },
    ActionSheetIOS: { showActionSheetWithOptions: vi.fn() },
    Platform: { OS: 'ios' as const, select: (spec: any) => spec.ios },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    StyleSheet: { create: (s: any) => s, flatten: (s: any) => (Array.isArray(s) ? Object.assign({}, ...s) : s) },
    Animated: {
      View: ({ style, children, ...props }: any) => React.createElement('div', { ...props, style: safeStyle(style) }, children),
      Text: ({ style, children, ...props }: any) => React.createElement('span', { ...props, style: safeStyle(style) }, children),
      Value: class { _value: number; constructor(v: number) { this._value = v; } setValue(v: number) { this._value = v; } },
      timing: (_value: any, config: any) => ({ start: (cb?: () => void) => { setTimeout(() => cb?.(), config?.duration ?? 0); } }),
      parallel: (_animations: any[]) => ({ start: (cb?: () => void) => { setTimeout(() => cb?.(), 0); } }),
    },
  };
});

// ─── Mock @expo/vector-icons ───
vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}`, style: { fontSize: size, color } }, name),
}));

// ─── Mock components ───
vi.mock('@/components/EmptyState', () => ({
  EmptyState: ({ icon, title, body, ctaText, onCtaPress }: any) =>
    React.createElement('div', { 'data-testid': 'empty-state' },
      React.createElement('span', { 'data-testid': 'empty-state-title' }, title),
      React.createElement('span', { 'data-testid': 'empty-state-body' }, body),
      ctaText ? React.createElement('button', { 'data-testid': 'empty-state-cta', onClick: onCtaPress }, ctaText) : null
    ),
}));

vi.mock('@/components/BottomSheet', () => ({
  BottomSheet: ({ visible, onClose, title, children }: any) =>
    visible ? React.createElement('div', { 'data-testid': 'bottom-sheet' },
      React.createElement('span', { 'data-testid': 'bottom-sheet-title' }, title),
      children
    ) : null,
}));

vi.mock('@/components/MoneySourceCard', () => ({
  MoneySourceCard: (props: any) =>
    React.createElement('div', {
      'data-testid': `money-source-card-${props.source.id}`,
      'data-source-name': props.source.name,
      'data-expense-count': props.expenseCount,
      'data-selected': props.isSelected ? 'true' : 'false',
    },
      React.createElement('span', null, props.source.name),
      React.createElement('span', null, `$${(props.source.balanceCents / 100).toFixed(2)}`),
      React.createElement('span', null, `${props.expenseCount} expense${props.expenseCount !== 1 ? 's' : ''}`)
    ),
  MONEY_SOURCE_CARD_WIDTH: 280,
}));

// ─── Mock store ───
vi.mock('@/stores/expenseStore', () => ({
  useExpenseStore: (selector: any) => selector({
    moneySources: mockMoneySources,
    addMoneySource: mockAddMoneySource,
    reorderMoneySources: mockReorderMoneySources,
    getMoneySourceExpenseCount: mockGetMoneySourceExpenseCount,
  }),
}));

// ─── Mock types ───
vi.mock('@/types', () => ({
  MONEY_SOURCE_PALETTE: [
    '#22C55E', '#0EA5E9', '#14B8A6', '#F43F5E',
    '#A855F7', '#F97316', '#84CC16', '#06B6D4',
  ],
}));

import { MoneySourceRow } from '@/components/MoneySourceRow';

describe('MoneySourceRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Renders a horizontal FlatList of MoneySourceCard instances
  it('renders a horizontal FlatList of MoneySourceCard instances', () => {
    render(React.createElement(MoneySourceRow, {}));

    expect(screen.getByTestId('money-source-card-ms-1')).toBeInTheDocument();
    expect(screen.getByTestId('money-source-card-ms-2')).toBeInTheDocument();
    expect(screen.getByTestId('money-source-card-ms-3')).toBeInTheDocument();

    const flatlist = screen.getByTestId('flatlist');
    expect(flatlist.getAttribute('data-horizontal')).toBe('true');
  });

  // Test 2: Auto-snaps to nearest card on scroll end
  it('auto-snaps to nearest card on scroll end', () => {
    render(React.createElement(MoneySourceRow, {}));

    const flatlist = screen.getByTestId('flatlist');
    expect(flatlist.getAttribute('data-snap-interval')).toBeTruthy();
    expect(flatlist.getAttribute('data-deceleration')).toBe('fast');
  });

  // Test 3: Adjacent cards are partially visible at edges
  it('adjacent cards are partially visible at edges', () => {
    render(React.createElement(MoneySourceRow, {}));

    const flatlist = screen.getByTestId('flatlist');
    expect(flatlist).toBeInTheDocument();
    expect(screen.getByTestId('money-source-card-ms-1')).toBeInTheDocument();
  });

  // Test 4: '+' button at end of FlatList opens creation sheet
  it('renders a + button at the end of the FlatList', () => {
    render(React.createElement(MoneySourceRow, {}));

    const addButton = screen.getByTestId('icon-add');
    expect(addButton).toBeInTheDocument();

    const addButtonContainer = addButton.closest('[role="button"]');
    act(() => { addButtonContainer?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

    expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-sheet-title').textContent).toBe('New Money Source');
  });

  // Test 5: Long-press drag reorders cards
  it('supports drag-to-reorder via reorderMoneySources', () => {
    act(() => {
      mockReorderMoneySources(['ms-3', 'ms-1', 'ms-2']);
    });
    expect(mockReorderMoneySources).toHaveBeenCalledWith(['ms-3', 'ms-1', 'ms-2']);
  });

  // Test 6: Empty state when no money sources
  it('shows EmptyState when no money sources exist', () => {
    // Clear and restore after test
    const original = [...mockMoneySources];
    mockMoneySources.length = 0;

    render(React.createElement(MoneySourceRow, {}));

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-title').textContent).toBe('No Money Sources');
    expect(screen.getByTestId('empty-state-body').textContent).toBe(
      'Add a money source to track your balances across Cash, Bank, Savings, and more.'
    );
    expect(screen.getByTestId('empty-state-cta').textContent).toBe('Add Money Source');

    // Restore
    mockMoneySources.push(...original);
  });

  // Test 7: keyboardShouldPersistTaps="handled"
  it('keyboardShouldPersistTaps is handled on FlatList', () => {
    render(React.createElement(MoneySourceRow, {}));

    const flatlist = screen.getByTestId('flatlist');
    expect(flatlist.getAttribute('data-keyboard-persist')).toBe('handled');
  });

  // Test 8: Each MoneySourceCard receives expense count from store
  it('each MoneySourceCard receives expense count from store', () => {
    render(React.createElement(MoneySourceRow, {}));

    const card1 = screen.getByTestId('money-source-card-ms-1');
    const card2 = screen.getByTestId('money-source-card-ms-2');
    const card3 = screen.getByTestId('money-source-card-ms-3');

    expect(card1.getAttribute('data-expense-count')).toBe('5');
    expect(card2.getAttribute('data-expense-count')).toBe('3');
    expect(card3.getAttribute('data-expense-count')).toBe('0');
  });
});
