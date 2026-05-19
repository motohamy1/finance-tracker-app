import { createContext, useContext } from 'react';

// ─── Neo-Brutalist Design System ───
// Dark mode only. No light mode. No glass. No soft shadows.
// Structure is the decoration: thick borders, hard edges, clashing colors.

export type ThemeMode = 'dark'; // single mode, no toggle

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
  // Borders & dividers (white is intentional — neo-brutalist staple)
  border: string;
  divider: string;
  // Brand & accents (clashing pop-art palette)
  primary: string;      // electric cyan
  primaryLight: string;
  secondary: string;    // hot pink
  secondaryLight: string;
  tertiary: string;     // electric yellow
  success: string;      // neon green
  danger: string;       // pure red
  warning: string;      // electric yellow
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

// ─── Neo-Brutalist Palette ───
// Intentionally clashing. Safe combinations are banned.
export const darkTheme: ThemeColors = {
  bg: '#0A0A0F',               // near-black, cool undertone
  bgSecondary: '#14141A',      // deep charcoal
  bgCard: '#1A1A24',           // slightly lifted charcoal
  bgCardElevated: '#22222E',   // elevated surface
  bgInput: '#0A0A0F',          // same as bg: inputs feel like holes

  text: '#F0F0F5',             // off-white, not pure #fff
  textSecondary: '#6B6B78',    // muted gray
  textMuted: '#3A3A45',        // very muted
  textInverse: '#0A0A0F',

  border: '#FFFFFF',             // white borders: raw, structural
  divider: '#FFFFFF',            // white dividers

  primary: '#00E5FF',            // electric cyan
  primaryLight: 'rgba(0, 229, 255, 0.15)',
  secondary: '#FF006E',          // hot pink — clashing accent
  secondaryLight: 'rgba(255, 0, 110, 0.15)',
  tertiary: '#FFEA00',           // electric yellow
  success: '#39FF14',            // neon green (unapologetic)
  danger: '#FF0000',             // pure red (unapologetic)
  warning: '#FFEA00',            // electric yellow

  tabBarBg: '#14141A',           // solid, no transparency
  tabBarBorder: '#FFFFFF',       // thick white top border

  headerBg: '#0A0A0F',
  headerTint: '#F0F0F5',

  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.85)',
};

// ─── Brutalist Spacing Scale ───
// Sharp increments only: 4, 8, 16, 32. No 12, no 24.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 32,
  xl: 48,
} as const;

// ─── Brutalist Border Constants ───
export const borderWidth = {
  sm: 1,
  md: 2,
  lg: 3,   // the neo-brutalist default
} as const;

// ─── Brutalist Radius ───
// 0px default. If radius is used, it should feel punched, not pill-shaped.
export const radius = {
  none: 0,
  sm: 4,   // minimal, for functional reasons only
  md: 8,   // hole-punch feel
} as const;

// ─── Brutalist Typography ───
// Monospace for numbers and labels; bold sans for headings.
export const typography = {
  mono: 'Menlo',        // iOS system terminal font
  monoAndroid: 'monospace',
  heading: 'System',    // system bold sans
  body: 'System',
} as const;

export interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkTheme,
});

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
