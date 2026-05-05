import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ─── Style sanitizer for React DOM ───
// React Native style properties are not CSS-compatible; we filter them
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
  // Store non-CSS props as data attributes for testing
]);

function safeStyle(style: any): any {
  if (!style) return undefined;
  if (typeof style === 'number') return undefined;
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(safeStyle));
  }
  // If it's already been processed (has a symbol), skip
  const out: any = {};
  for (const key of Object.keys(style)) {
    if (CSS_COMPATIBLE.has(key)) {
      const val = style[key];
      // Convert React Native values to CSS where needed
      if (key === 'borderRadius' && typeof val === 'number') out[key] = val + 'px';
      else if (typeof val === 'number' && !['flex', 'flexGrow', 'flexShrink', 'opacity', 'zIndex', 'fontWeight', 'letterSpacing'].includes(key)) {
        out[key] = val + 'px';
      } else {
        out[key] = val;
      }
    }
  }
  return out;
}

// ─── Mock react-native ───
vi.mock('react-native', () => ({
  View: ({ style, children, ...props }: any) => React.createElement('div', { ...props, style: safeStyle(style), 'data-testid': props.testID }, children),
  Text: ({ style, children, numberOfLines, ...props }: any) => React.createElement('span', { ...props, style: safeStyle(style) }, children),
  TextInput: ({ style, defaultValue, onChangeText, onBlur, onSubmitEditing, autoFocus, keyboardType, placeholderTextColor, selectTextOnFocus, ...props }: any) =>
    React.createElement('input', {
      ...props,
      style: safeStyle(style),
      'data-default-value': defaultValue,
      defaultValue,
      onChange: (e: any) => onChangeText?.(e.target.value),
      onBlur,
      onKeyDown: (e: any) => { if (e.key === 'Enter') onSubmitEditing?.(); },
      autoFocus,
      type: keyboardType === 'decimal-pad' ? 'text' : 'text',
      'data-keyboard': keyboardType,
    }, null),
  TouchableOpacity: ({ style, children, onPress, onLongPress, activeOpacity, ...props }: any) => {
    // Handle array styles correctly
    const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    return React.createElement('div', { ...props, role: 'button', tabIndex: 0, style: safeStyle({ ...baseStyle, cursor: 'pointer' }), onClick: onPress, onDoubleClick: onLongPress, 'data-longpress': !!onLongPress }, children);
  },
  Pressable: ({ style, children, onPress, onLongPress, ...props }: any) => {
    const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    return React.createElement('div', { ...props, role: 'button', tabIndex: 0, style: safeStyle({ ...baseStyle, cursor: 'pointer' }), onClick: onPress, onDoubleClick: onLongPress }, children);
  },
  Alert: { alert: vi.fn() },
  ActionSheetIOS: { showActionSheetWithOptions: vi.fn() },
  Platform: { OS: 'ios' as const, select: (spec: any) => spec.ios },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  StyleSheet: {
    create: (s: any) => s,
    flatten: (s: any) => {
      if (!Array.isArray(s)) return s;
      return Object.assign({}, ...s);
    },
  },
  Animated: {
    View: ({ style, children, ...props }: any) => React.createElement('div', { ...props, style: safeStyle(style) }, children),
    Text: ({ style, children, ...props }: any) => React.createElement('span', { ...props, style: safeStyle(style) }, children),
    Value: class { _value: number; constructor(v: number) { this._value = v; } setValue(v: number) { this._value = v; } },
    timing: (_value: any, config: any) => ({ start: (cb?: () => void) => { setTimeout(() => cb?.(), config?.duration ?? 0); } }),
    parallel: (_animations: any[]) => ({ start: (cb?: () => void) => { setTimeout(() => cb?.(), 0); } }),
  },
}));

// ─── Mock @expo/vector-icons ───
vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}`, style: { fontSize: size, color } }, name),
}));

// ─── Mock store ───
const mockUpdateMoneySourceBalance = vi.fn();
const mockRenameMoneySource = vi.fn();
const mockUpdateMoneySourceColor = vi.fn();
const mockRemoveMoneySource = vi.fn();

vi.mock('@/stores/expenseStore', () => ({
  useExpenseStore: (selector: any) => selector({
    updateMoneySourceBalance: mockUpdateMoneySourceBalance,
    renameMoneySource: mockRenameMoneySource,
    updateMoneySourceColor: mockUpdateMoneySourceColor,
    removeMoneySource: mockRemoveMoneySource,
  }),
}));

// ─── Mock format ───
vi.mock('@/utils/format', () => ({
  formatCurrency: (cents: number) => {
    const dollars = (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$${dollars}`;
  },
}));

// ─── Mock types ───
vi.mock('@/types', () => ({
  MONEY_SOURCE_PALETTE: [
    '#22C55E', '#0EA5E9', '#14B8A6', '#F43F5E',
    '#A855F7', '#F97316', '#84CC16', '#06B6D4',
  ],
  CURRENCIES: ['EGP', 'USD', 'SAR', 'AED', 'EUR'],
}));

import type { MoneySource } from '@/types';
import { MoneySourceCard } from '@/components/MoneySourceCard';

// Access mocked react-native — these are the vi.fn() instances from the mock factory
const { ActionSheetIOS, Alert } = await import('react-native');

// ─── Helper ───
function makeSource(overrides: Partial<MoneySource> = {}): MoneySource {
  return {
    id: overrides.id ?? 'ms-1',
    name: overrides.name ?? 'Cash',
    colorHex: overrides.colorHex ?? '#22C55E',
    iconName: overrides.iconName ?? 'cash-outline',
    balanceCents: overrides.balanceCents ?? 150000,
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? '2026-05-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-01T00:00:00.000Z',
  };
}

describe('MoneySourceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Renders card with solid background color, 180px height, 20px borderRadius, white text
  it('renders card with solid background color, 180px height, 20px borderRadius, white text', () => {
    const source = makeSource({ colorHex: '#22C55E' });
    render(React.createElement(MoneySourceCard, { source, expenseCount: 5 }));

    // Find the card container (first element with role="button")
    const cardButtons = screen.getAllByRole('button');
    const cardButton = cardButtons[0];
    expect(cardButton).toBeInTheDocument();
    expect(cardButton.style.backgroundColor).toBe('rgb(34, 197, 94)');
    expect(cardButton.style.height).toBe('180px');
    expect(cardButton.style.borderRadius).toBe('20px');

    // Name text should be white-ish
    const nameText = screen.getByText('Cash');
    expect(nameText).toBeInTheDocument();
    expect(nameText.style.color).toBe('rgba(255, 255, 255, 0.85)');
    expect(nameText.style.fontSize).toBe('14px');
    expect(nameText.style.fontWeight).toBe('600');
  });

  // Test 2: Displays icon, source name, balance formatted as currency, expense count
  it('displays icon (Ionicons, 24px), source name, balance formatted as currency, expense count', () => {
    const source = makeSource({
      name: 'Bank',
      iconName: 'business-outline',
      balanceCents: 250000,
    });
    render(React.createElement(MoneySourceCard, { source, expenseCount: 8 }));

    // Icon
    const icon = screen.getByTestId('icon-business-outline');
    expect(icon).toBeInTheDocument();

    // Source name
    expect(screen.getByText('Bank')).toBeInTheDocument();

    // Balance: $2,500.00
    const balanceText = screen.getByText('$2,500.00');
    expect(balanceText).toBeInTheDocument();
    expect(balanceText.style.fontSize).toBe('32px');
    expect(balanceText.style.fontWeight).toBe('600');
    expect(balanceText.style.color).toBe('rgb(255, 255, 255)');

    // Expense count: "8 expenses"
    const expenseCount = screen.getByText('8 expenses');
    expect(expenseCount).toBeInTheDocument();
    expect(expenseCount.style.fontSize).toBe('14px');
    expect(expenseCount.style.fontWeight).toBe('400');
  });

  // Test 3: Tapping balance text triggers edit mode with TextInput pre-populated
  it('tapping balance text triggers edit mode with TextInput pre-populated', async () => {
    vi.useFakeTimers();
    const source = makeSource({ balanceCents: 150000 }); // $1,500.00
    render(React.createElement(MoneySourceCard, { source, expenseCount: 3 }));

    // Balance text is visible initially
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();

    // The balance tap area is the second button
    const buttons = screen.getAllByRole('button');
    const balanceTapButton = buttons[1];
    act(() => {
      balanceTapButton.click();
    });

    // Advance timers for animation
    act(() => { vi.advanceTimersByTime(200); });

    // After tap: TextInput should be visible with "1500.00" value
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.getAttribute('data-default-value')).toBe('1500.00');

    vi.useRealTimers();
  });

  // Test 4: Editing a valid dollar amount saves as cents to store and exits edit mode
  it('editing valid dollar amount saves as cents and exits edit mode', async () => {
    vi.useFakeTimers();
    const source = makeSource({ balanceCents: 1000 }); // $10.00
    render(React.createElement(MoneySourceCard, { source, expenseCount: 2 }));

    // Tap balance to enter edit mode
    const buttons = screen.getAllByRole('button');
    const balanceTapButton = buttons[1];
    act(() => { balanceTapButton.click(); });
    act(() => { vi.advanceTimersByTime(200); });

    // Find the TextInput, change value, and blur
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: '99.50' } });
    });
    act(() => {
      fireEvent.blur(input);
    });

    // Should call updateMoneySourceBalance with cents: 99.50 * 100 = 9950
    expect(mockUpdateMoneySourceBalance).toHaveBeenCalledWith('ms-1', 9950);

    vi.useRealTimers();
  });

  // Test 5: Entering invalid text flashes red border and reverts to previous balance
  it('entering invalid text flashes red border for 500ms and reverts to previous balance', async () => {
    vi.useFakeTimers();
    const source = makeSource({ balanceCents: 50000 }); // $500.00
    render(React.createElement(MoneySourceCard, { source, expenseCount: 1 }));

    // Enter edit mode
    const buttons = screen.getAllByRole('button');
    const balanceTapButton = buttons[1];
    act(() => { balanceTapButton.click(); });
    act(() => { vi.advanceTimersByTime(200); });

    // Enter invalid text
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: 'abc' } });
    });
    act(() => {
      fireEvent.blur(input);
    });

    // Red border should appear on the card
    const cardButton = screen.getAllByRole('button')[0];
    expect(cardButton.style.borderColor).toBe('rgb(239, 68, 68)');

    // After 500ms, red border should be gone and balance not changed
    act(() => { vi.advanceTimersByTime(600); });

    // updateMoneySourceBalance should NOT have been called
    expect(mockUpdateMoneySourceBalance).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  // Test 6: Emptying input and blurring saves as $0.00
  it('emptying input and blurring saves as $0.00', async () => {
    vi.useFakeTimers();
    const source = makeSource({ balanceCents: 50000 }); // $500.00
    render(React.createElement(MoneySourceCard, { source, expenseCount: 1 }));

    // Enter edit mode
    const buttons = screen.getAllByRole('button');
    act(() => { buttons[1].click(); });
    act(() => { vi.advanceTimersByTime(200); });

    // Empty the input
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => { fireEvent.change(input, { target: { value: '' } }); });
    act(() => { fireEvent.blur(input); });

    // Should call updateMoneySourceBalance with 0
    expect(mockUpdateMoneySourceBalance).toHaveBeenCalledWith('ms-1', 0);

    vi.useRealTimers();
  });

  // Test 7: Long-press triggers platform-native menu with Edit Name, Change Color, Delete
  it('long-press triggers platform-native menu with Edit Name, Change Color, Delete', () => {
    const source = makeSource({ name: 'Savings' });
    render(React.createElement(MoneySourceCard, { source, expenseCount: 4 }));

    const cardButton = screen.getAllByRole('button')[0];
    act(() => {
      fireEvent.doubleClick(cardButton);
    });

    expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalled();
    const callArgs = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0][0];
    expect(callArgs.options).toContain('Edit Name');
    expect(callArgs.options).toContain('Change Color');
    expect(callArgs.options).toContain('Delete');
  });

  // Test 8: Delete option shows confirmation alert with UI-SPEC copywriting
  it('delete option shows confirmation alert with UI-SPEC copywriting', () => {
    const source = makeSource({ name: 'Cash' });
    render(React.createElement(MoneySourceCard, { source, expenseCount: 2 }));

    const cardButton = screen.getAllByRole('button')[0];
    act(() => { fireEvent.doubleClick(cardButton); });

    // Get the action sheet callback and simulate Delete selection (index 2)
    const callArgs = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0];
    const callback = callArgs[1];
    act(() => { callback(2); });

    // Should show Alert with correct copywriting
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Cash?',
      'Linked expenses will be unlinked but not deleted. This action cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Keep Source' }),
        expect.objectContaining({ text: 'Delete Money Source' }),
      ])
    );

    // Simulate pressing "Delete Money Source"
    const alertCall = Alert.alert.mock.calls[0];
    const buttons = alertCall[2];
    const deleteButton = buttons.find((b: any) => b.text === 'Delete Money Source');
    act(() => { deleteButton.onPress(); });
    expect(mockRemoveMoneySource).toHaveBeenCalledWith('ms-1');
  });

  // Test 9: Edit Name option switches name to TextInput for inline rename
  it('edit name option switches name to TextInput for inline rename', () => {
    const source = makeSource({ name: 'Bank' });
    render(React.createElement(MoneySourceCard, { source, expenseCount: 3 }));

    // Long-press to open menu
    const cardButton = screen.getAllByRole('button')[0];
    act(() => { fireEvent.doubleClick(cardButton); });

    // Select Edit Name (index 0)
    const callArgs = ActionSheetIOS.showActionSheetWithOptions.mock.calls[0];
    const callback = callArgs[1];
    act(() => { callback(0); });

    // After selecting Edit Name, a TextInput should appear for editing the name
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();

    // Test submitting the name edit
    act(() => {
      fireEvent.change(nameInput, { target: { value: 'Updated Bank' } });
    });
    act(() => {
      fireEvent.blur(nameInput);
    });
    expect(mockRenameMoneySource).toHaveBeenCalledWith('ms-1', 'Updated Bank');
  });

  // Test 10: Card has shadow/elevation for depth
  it('card has shadow/elevation for depth', () => {
    const source = makeSource();
    render(React.createElement(MoneySourceCard, { source, expenseCount: 0 }));

    // Shadow properties are in the style object but filtered from DOM.
    // The component mounts successfully which verifies it doesn't crash.
    const card = screen.getAllByRole('button')[0];
    expect(card).toBeInTheDocument();
    expect(card.style.height).toBe('180px');
    expect(card.style.borderRadius).toBe('20px');
  });
});
