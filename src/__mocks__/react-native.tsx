// Mock for react-native exports used by components under test
import React from 'react';

// Basic components
export const View = React.forwardRef((props: any, ref: any) => {
  const { style, children, ...rest } = props;
  return React.createElement('div', { ...rest, ref, style: flattenStyle(style) }, children);
});
export const Text = React.forwardRef((props: any, ref: any) => {
  const { style, children, ...rest } = props;
  return React.createElement('span', { ...rest, ref, style: flattenStyle(style) }, children);
});
export const TextInput = React.forwardRef((props: any, ref: any) => {
  const { style, ...rest } = props;
  return React.createElement('input', { ...rest, ref, style: flattenStyle(style) });
});
export const TouchableOpacity = React.forwardRef((props: any, ref: any) => {
  const { style, children, onPress, onLongPress, activeOpacity, ...rest } = props;
  return React.createElement('button', {
    ...rest,
    ref,
    style: { ...flattenStyle(style), cursor: 'pointer' },
    onClick: onPress,
    // Simulate long press with double-click for testing
    onDoubleClick: onLongPress,
  }, children);
});

// StyleSheet
function flattenStyle(style: any): any {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  return style;
}

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: flattenStyle,
};

// Platform
export const Platform = {
  OS: 'ios' as 'ios' | 'android',
  select: <T extends Record<string, any>>(spec: T): any => {
    return spec.ios ?? spec.default;
  },
};

// Dimensions
export const Dimensions = {
  get: (_name: string) => ({ width: 390, height: 844 }),
};

// Animated
const AnimatedValue = {
  Value: class {
    _value: number;
    constructor(value: number) { this._value = value; }
    setValue(value: number) { this._value = value; }
  },
};

const AnimatedView = React.forwardRef((props: any, ref: any) => {
  const { style, children, ...rest } = props;
  return React.createElement('div', { ...rest, ref, style: flattenStyle(style) }, children);
});

const AnimatedText = React.forwardRef((props: any, ref: any) => {
  const { style, children, ...rest } = props;
  return React.createElement('span', { ...rest, ref, style: flattenStyle(style) }, children);
});

export const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  Value: AnimatedValue.Value,
  timing: (_value: any, _config: any) => ({ start: (cb?: () => void) => cb?.() }),
  parallel: (_animations: any[]) => ({ start: (cb?: () => void) => cb?.() }),
};

// Alert
export const Alert = {
  alert: vi.fn(),
};

// ActionSheetIOS
export const ActionSheetIOS = {
  showActionSheetWithOptions: vi.fn(),
};

// Re-export vitest mock function for use in mocks
import { vi } from 'vitest';
