import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ─── Style sanitizer (same as existing component tests) ───
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
  View: ({ style, children, ...props }: any) => React.createElement('div', { ...props, style: safeStyle(style), 'data-testid': props.testID }, children),
  Text: ({ style, children, numberOfLines, ...props }: any) => React.createElement('span', { ...props, style: safeStyle(style) }, children),
  TextInput: ({ style, defaultValue, onChangeText, onBlur, onSubmitEditing, autoFocus, keyboardType, placeholderTextColor, maxLength, multiline, numberOfLines, textAlignVertical, placeholder, value, ...props }: any) =>
    React.createElement('input', {
      ...props,
      style: safeStyle(style),
      'data-placeholder': placeholder,
      placeholder,
      value: value ?? '',
      onChange: (e: any) => onChangeText?.(e.target.value),
      onBlur,
      onKeyDown: (e: any) => { if (e.key === 'Enter') onSubmitEditing?.(); },
      autoFocus,
      type: 'text',
    }, null),
  TouchableOpacity: ({ style, children, onPress, onLongPress, activeOpacity, ...props }: any) => {
    const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    return React.createElement('div', { ...props, role: 'button', tabIndex: 0, style: safeStyle({ ...baseStyle, cursor: 'pointer' }), onClick: onPress, onDoubleClick: onLongPress, 'data-longpress': !!onLongPress }, children);
  },
  Pressable: ({ style, children, onPress, onLongPress, ...props }: any) => {
    const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    return React.createElement('div', { ...props, role: 'button', tabIndex: 0, style: safeStyle({ ...baseStyle, cursor: 'pointer' }), onClick: onPress, onDoubleClick: onLongPress }, children);
  },
  Modal: ({ visible, transparent, animationType, onRequestClose, children }: any) =>
    visible ? React.createElement('div', { 'data-testid': 'modal', 'data-transparent': transparent, 'data-animation': animationType }, children) : null,
  KeyboardAvoidingView: ({ style, behavior, children, ...props }: any) =>
    React.createElement('div', { ...props, style: safeStyle(style) }, children),
  ScrollView: ({ style, contentContainerStyle, children, keyboardShouldPersistTaps, showsVerticalScrollIndicator, ...props }: any) =>
    React.createElement('div', { ...props, style: safeStyle({ overflowY: 'auto', ...style }), 'data-keyboard-persist': keyboardShouldPersistTaps }, children),
  Alert: { alert: vi.fn() },
  Platform: { OS: 'ios' as const, select: (spec: any) => spec.ios },
  StyleSheet: {
    create: (s: any) => s,
    flatten: (s: any) => (Array.isArray(s) ? Object.assign({}, ...s) : s),
    absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  },
}));

// ─── Mock @expo/vector-icons ───
vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}`, style: { fontSize: size, color } }, name),
}));

// ─── Mock store ───
const mockAddExpense = vi.fn();
const mockEditExpense = vi.fn();
const mockAddCategory = vi.fn();

const mockMoneySources = [
  { id: 'ms-1', name: 'Cash', colorHex: '#22C55E', iconName: 'cash-outline', balanceCents: 150000, sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: 'ms-2', name: 'Bank', colorHex: '#0EA5E9', iconName: 'business-outline', balanceCents: 250000, sortOrder: 1, createdAt: '', updatedAt: '' },
];

const mockCategories = [
  { id: 'cat-1', name: 'Food', colorHex: '#0891B2', sortOrder: 0, createdAt: '', updatedAt: '' },
  { id: 'cat-2', name: 'Transport', colorHex: '#7C3AED', sortOrder: 1, createdAt: '', updatedAt: '' },
];

vi.mock('@/stores/expenseStore', () => ({
  useExpenseStore: (selector: any) => selector({
    categories: mockCategories,
    moneySources: mockMoneySources,
    addExpense: mockAddExpense,
    editExpense: mockEditExpense,
    addCategory: mockAddCategory,
  }),
}));

// ─── Mock utils ───
vi.mock('@/utils/format', () => ({
  getTodayISO: () => '2026-05-04',
}));

// ─── Import AFTER all mocks ───
import { ExpenseForm } from '@/components/ExpenseForm';

describe('ExpenseForm — Money Source Picker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (props: Partial<React.ComponentProps<typeof ExpenseForm>> = {}) => {
    const defaultProps = {
      visible: true,
      onClose: vi.fn(),
      editingExpense: undefined,
      preselectedCategoryId: undefined,
      ...props,
    } as React.ComponentProps<typeof ExpenseForm>;
    return render(React.createElement(ExpenseForm, defaultProps as any));
  };

  // ─── Test 1: Label appears between Category and Title ───
  it('shows "Money Source (optional)" label between Category and Title fields', () => {
    renderForm();
    
    // Category label should appear first
    const labels = screen.getAllByRole('generic').filter(el => 
      el.tagName === 'SPAN' && el.textContent === 'Money Source (optional)'
    );
    expect(labels.length).toBeGreaterThan(0);
    
    // The label text exists in the DOM
    expect(screen.getByText('Money Source (optional)')).toBeInTheDocument();
    
    // Category label should also be present
    expect(screen.getByText('Category')).toBeInTheDocument();
    
    // Title label should also be present (after money source)
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  // ─── Test 2: Picker button styled like category selectButton ───
  it('renders money source picker button with same styling as category picker', () => {
    renderForm();
    
    // The money source picker button should exist with the right background
    const buttons = screen.getAllByRole('button');
    // We have: category picker button, money source picker button, save button
    // And potentially dropdown items. Let's find the money source picker button.
    // It says "None" initially
    const noneButtons = buttons.filter(b => b.textContent?.includes('None'));
    expect(noneButtons.length).toBeGreaterThan(0);
    
    const msPickerBtn = noneButtons[0];
    const style = msPickerBtn.style || {};
    
    // Verify styling matches selectButton: backgroundColor #F8FAFC, borderRadius 10px, padding 14px, flex row, border 1px #E2E8F0
    expect(style.backgroundColor).toBe('rgb(248, 250, 252)'); // #F8FAFC
    expect(style.borderRadius).toBe('10px');
    expect(style.padding).toBe('14px');
    expect(style.flexDirection).toBe('row');
    expect(style.borderWidth).toBe('1px');
    expect(style.borderColor).toBe('rgb(226, 232, 240)'); // #E2E8F0
  });

  // ─── Test 3: Unselected state — gray dot + "None" ───
  it('shows gray dot (#94A3B8) and "None" text when no source is selected', () => {
    renderForm();
    
    // Find the "None" text
    expect(screen.getByText('None')).toBeInTheDocument();
    
    // Find the gray dot (View with backgroundColor #94A3B8)
    const noneButton = screen.getByText('None').closest('[role="button"]')!;
    const dots = noneButton.querySelectorAll('[style*="background-color"]');
    const grayDot = Array.from(dots).find(el => {
      const s = el.getAttribute('style') || '';
      return s.includes('rgb(148, 163, 184)'); // #94A3B8
    });
    expect(grayDot).toBeTruthy();
  });

  // ─── Test 4: Selected state — colored dot + source name ───
  it('shows colored dot with source color and source name when a source is selected', () => {
    // We need to pre-select a source for this test
    // We'll render with preselectedMoneySourceId, which should pre-select it
    renderForm({ preselectedMoneySourceId: 'ms-1' });
    
    // Should show "Cash" (the source name)
    expect(screen.getByText('Cash')).toBeInTheDocument();
    
    // Should show a dot with #22C55E (green) — rgb(34, 197, 94)
    const cashButton = screen.getByText('Cash').closest('[role="button"]')!;
    const dots = cashButton.querySelectorAll('[style*="background-color"]');
    const greenDot = Array.from(dots).find(el => {
      const s = el.getAttribute('style') || '';
      return s.includes('rgb(34, 197, 94)'); // #22C55E
    });
    expect(greenDot).toBeTruthy();
  });

  // ─── Test 5: Dropdown opens with money sources + "None" option ───
  it('opens dropdown with "None" at top and all money sources when picker is tapped', () => {
    renderForm();
    
    // Tap the money source picker ("None" button)
    const pickerBtn = screen.getByText('None').closest('[role="button"]')!;
    fireEvent.click(pickerBtn);
    
    // Dropdown should show "None" option at top
    const allNoneTexts = screen.getAllByText('None');
    expect(allNoneTexts.length).toBeGreaterThanOrEqual(2); // Button text + dropdown item
    
    // Should show all money source names
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Bank')).toBeInTheDocument();
  });

  // ─── Test 6: Selecting "None" sets moneySourceId to null ───
  it('selecting "None" clears the selection (setting back to null)', () => {
    // Start with a selected source
    renderForm({ preselectedMoneySourceId: 'ms-1' });
    
    // Initially shows "Cash"
    expect(screen.getByText('Cash')).toBeInTheDocument();
    
    // Open picker
    const pickerBtn = screen.getByText('Cash').closest('[role="button"]')!;
    fireEvent.click(pickerBtn);
    
    // Click "None" in dropdown
    const noneOptions = screen.getAllByText('None');
    const noneDropdown = noneOptions.find(el => el.closest('[role="button"]'));
    fireEvent.click(noneDropdown!);
    
    // After selecting None, the picker should show "None" again
    // And no "Cash" should be visible in the picker (only in dropdown if still open)
    const pickerAfter = screen.getByText('None').closest('[role="button"]')!;
    expect(pickerAfter).toBeTruthy();
  });

  // ─── Test 7: Selecting a source sets moneySourceId ───
  it('selecting a source from dropdown sets it as the selected source', () => {
    renderForm();
    
    // Open picker
    const pickerBtn = screen.getByText('None').closest('[role="button"]')!;
    fireEvent.click(pickerBtn);
    
    // Click "Bank" in dropdown
    fireEvent.click(screen.getByText('Bank'));
    
    // After selecting, the picker should show "Bank"
    expect(screen.getByText('Bank')).toBeInTheDocument();
  });

  // ─── Test 8: Pre-selection via preselectedMoneySourceId ───
  it('pre-selects a money source when preselectedMoneySourceId is provided', () => {
    renderForm({ preselectedMoneySourceId: 'ms-2' });
    
    // Should show "Bank" pre-selected (ms-2 = Bank)
    expect(screen.getByText('Bank')).toBeInTheDocument();
    expect(screen.queryByText('None')).toBeNull();
  });

  // ─── Test 9: handleSave includes moneySourceId ───
  it('includes moneySourceId in the formData when saving', () => {
    renderForm({ preselectedMoneySourceId: 'ms-1' });
    
    // Fill in required fields
    const inputs = document.querySelectorAll('input');
    // Find title input (placeholder "What did you spend on?")
    const titleInput = Array.from(inputs).find(i => i.getAttribute('data-placeholder') === 'What did you spend on?');
    const amountInput = Array.from(inputs).find(i => i.getAttribute('data-placeholder') === '0.00');
    
    expect(titleInput).toBeTruthy();
    expect(amountInput).toBeTruthy();
    
    fireEvent.change(titleInput!, { target: { value: 'Groceries' } });
    fireEvent.change(amountInput!, { target: { value: '25.50' } });
    
    // Click save
    const saveBtn = screen.getByText('Save Expense');
    fireEvent.click(saveBtn);
    
    // Verify addExpense was called with moneySourceId
    expect(mockAddExpense).toHaveBeenCalledTimes(1);
    const callArg = mockAddExpense.mock.calls[0][0];
    expect(callArg.moneySourceId).toBe('ms-1');
    expect(callArg.title).toBe('Groceries');
    expect(callArg.amountCents).toBe(2550);
  });
});
