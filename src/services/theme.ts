import { createContext, useContext } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  // Backgrounds
  bg: string;
  bgSecondary: string;
  bgCard: string;
  bgCardElevated: string;
  bgInput: string;
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  // Borders & dividers
  border: string;
  divider: string;
  // Brand
  primary: string;
  primaryLight: string;
  success: string;
  danger: string;
  warning: string;
  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  // Header
  headerBg: string;
  headerTint: string;
  // Misc
  shadow: string;
  overlay: string;
}

export const lightTheme: ThemeColors = {
  bg: '#F0F4F8',
  bgSecondary: '#F8FAFC',
  bgCard: '#FFFFFF',
  bgCardElevated: '#FFFFFF',
  bgInput: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  primary: '#0891B2',
  primaryLight: '#ECFEFF',
  success: '#059669',
  danger: '#DC2626',
  warning: '#D97706',
  tabBarBg: 'rgba(255, 255, 255, 0.75)',
  tabBarBorder: 'rgba(255, 255, 255, 0.3)',
  headerBg: '#F8FAFC',
  headerTint: '#0F172A',
  shadow: '#000',
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkTheme: ThemeColors = {
  bg: '#09090B',
  bgSecondary: '#18181B',
  bgCard: '#18181B',
  bgCardElevated: '#27272A',
  bgInput: '#27272A',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#09090B',
  border: '#27272A',
  divider: '#27272A',
  primary: '#22D3EE',
  primaryLight: 'rgba(34, 211, 238, 0.12)',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  tabBarBg: 'rgba(24, 24, 27, 0.92)',
  tabBarBorder: 'rgba(39, 39, 42, 0.6)',
  headerBg: '#09090B',
  headerTint: '#FAFAFA',
  shadow: '#000',
  overlay: 'rgba(0,0,0,0.7)',
};

export interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkTheme,
  toggleTheme: () => {},
});

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
