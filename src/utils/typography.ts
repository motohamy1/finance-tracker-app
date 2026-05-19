import { Platform } from 'react-native';

// ─── Neo-Brutalist Typography System ───
// Monospace for numbers and data; bold sans for structure.
// Every number should feel like it's from a terminal.

export const FONT_MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
export const FONT_SANS = 'System';

// ─── Type Scale ───
// Hierarchy through scale + weight contrast (≥1.25 ratio between steps)
export const typeScale = {
  display: { size: 32, weight: '700' as const, lineHeight: 36 },
  headline: { size: 24, weight: '700' as const, lineHeight: 28 },
  title: { size: 18, weight: '700' as const, lineHeight: 22 },
  body: { size: 14, weight: '400' as const, lineHeight: 20 },
  label: { size: 12, weight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
  metric: { size: 28, weight: '700' as const, lineHeight: 32 },
  micro: { size: 10, weight: '600' as const, lineHeight: 12, letterSpacing: 0.8 },
} as const;

// ─── Utility: apply monospace to numbers only ───
// Use this for currency, shares, prices, P&L values
export const monoNumberStyle = {
  fontFamily: FONT_MONO,
  fontVariant: ['tabular-nums'] as any,
};
