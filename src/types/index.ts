// ─── Category Types ───
export interface Category {
  id: string;              // UUID v4
  name: string;            // Category display name
  colorHex: string;        // Accent color from palette (e.g., "#0891B2")
  sortOrder: number;       // Manual drag-to-reorder position (higher = later in list)
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
}

// ─── Expense Types ───
export interface Expense {
  id: string;              // UUID v4
  categoryId: string;      // Foreign key → Category.id
  title: string;           // Required, user-provided title
  amountCents: number;     // Amount stored as INTEGER cents (e.g., $42.50 → 4250)
  date: string;            // ISO 8601 date (YYYY-MM-DD), defaults to today
  notes: string | null;    // Optional notes, null if empty
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
}

// ─── Form Types (for expense form state) ───
export interface ExpenseFormData {
  title: string;
  amountCents: number;
  date: string;
  categoryId: string;
  notes: string;
}

export interface CategoryFormData {
  name: string;
}

// ─── App Settings ───
export interface AppSettings {
  key: string;
  value: string;
}

// ─── Database Migration ───
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

// ─── Category Accent Palette (from UI-SPEC color section) ───
export const CATEGORY_ACCENT_PALETTE: readonly string[] = [
  '#0891B2', // Cyan
  '#7C3AED', // Violet
  '#059669', // Emerald
  '#EA580C', // Orange
  '#DB2777', // Pink
  '#2563EB', // Blue
  '#CA8A04', // Amber
  '#4F46E5', // Indigo
] as const;

export type CategoryAccentColor = typeof CATEGORY_ACCENT_PALETTE[number];

// Utility: get next available color (round-robin based on existing categories count)
export function getNextAccentColor(existingCategoryCount: number): string {
  return CATEGORY_ACCENT_PALETTE[existingCategoryCount % CATEGORY_ACCENT_PALETTE.length];
}

// Convert hex to a tinted version (mixes with white at given ratio 0-1)
export function hexToTint(hex: string, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * (1 - ratio));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Light tint for category section backgrounds (soft, readable)
export function getCategoryLightTint(hex: string): string {
  return hexToTint(hex, 0.12);
}

// Medium tint for expense cards (more visible color)
export function getCategoryCardTint(hex: string): string {
  return hexToTint(hex, 0.18);
}
