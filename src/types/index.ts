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

// ─── Trade Types ───
export type TradeDirection = 'buy' | 'sell';

export interface Trade {
  id: string;                 // UUID v4
  ticker: string;             // Stock ticker, uppercase (e.g., "AAPL")
  shares: number;             // Number of shares (integer)
  pricePerShareCents: number; // Price per share in INTEGER cents
  tradeDate: string;          // ISO 8601 date (YYYY-MM-DD)
  direction: TradeDirection;  // 'buy' or 'sell'
  feesCents: number | null;   // Optional fees in INTEGER cents
  thumbnailUri: string | null; // Compressed 200x200px thumbnail URI (null for manual entries)
  notes: string | null;       // Optional notes
  createdAt: string;          // ISO 8601 timestamp
  updatedAt: string;          // ISO 8601 timestamp
}

export interface TradeFormData {
  ticker: string;
  shares: string;             // String for form input (parsed to integer on save)
  pricePerShareCents: string; // String for form input (parsed to integer on save)
  tradeDate: string;
  direction: TradeDirection;
  feesCents: string;          // String for form input (parsed to integer or null on save)
  notes: string;
}

// ─── OCR Types ───
export interface OCRResult {
  ticker: string | null;
  shares: number | null;
  pricePerShare: number | null; // In dollars (not cents) — OCR reads display values
  tradeDate: string | null;     // ISO 8601 date or null
  direction: TradeDirection | null;
  rawText: string;              // Full raw OCR output for debugging
  confidence: number;           // 0.0–1.0 overall extraction confidence
  aiMeta?: AIExtractionMeta;    // AI extraction metadata (undefined for Phase 2 regex-only)
}

export interface FailedOCRLog {
  id: string;           // UUID v4
  imageUri: string;     // URI of the screenshot that failed
  rawText: string;      // Raw OCR output (even if partial)
  errorMessage: string; // What went wrong
  createdAt: string;    // ISO 8601 timestamp
}

// ─── AI OCR Enhancement Types ───
export type Platform = 'robinhood' | 'webull' | 'etoro' | 'generic';

export interface PlatformSignature {
  platform: Platform;
  textPatterns: string[];        // Ordered regex strings; first match = platform detected
  confidenceKeywords: string[];  // Words that strongly indicate this platform
}

export const PLATFORM_SIGNATURES: PlatformSignature[] = [
  {
    platform: 'robinhood',
    textPatterns: [
      'Robinhood', 'Robinhood Financial', 'RH\\b',
      'Market (Buy|Sell)', 'Order (Buy|Sell)', 'Limit Price',
      'Not Held', 'Day Order', 'GTC', 'Stop Price',
    ],
    confidenceKeywords: ['Robinhood', 'RH', 'Market Buy', 'Market Sell', 'Limit Price'],
  },
  {
    platform: 'webull',
    textPatterns: [
      'Webull', 'WEBULL FINANCIAL', 'Webull Financial LLC',
      'Order Filled', 'Order Status', 'Filled Price',
      'Avg Price', 'Total Cost', 'Webull Securities',
    ],
    confidenceKeywords: ['Webull', 'Order Filled', 'Filled Price', 'Total Cost'],
  },
  {
    platform: 'etoro',
    textPatterns: [
      'eToro', 'eToro Europe', 'eToro \\(Europe\\)',
      'Investment amount', 'Close Trade', 'Open Trade',
      'Stop Loss', 'Take Profit', 'Leverage',
    ],
    confidenceKeywords: ['eToro', 'Investment amount', 'Close Trade', 'Open Trade'],
  },
];

export interface AIExtractionMeta {
  platform: Platform;
  extractionMethod: 'template' | 'regex';
  platformConfidence: number;              // 0.0–1.0 — how confident platform detection was
  perFieldConfidence: Record<string, number>;  // { ticker: 0.95, shares: 0.80, ... }
}

// ─── Portfolio & P&L Types ───
export interface PnLPair {
  buyTradeId: string;
  sellTradeId: string;
  ticker: string;
  matchedShares: number;
  buyPriceCents: number;
  sellPriceCents: number;
  buyFeesCents: number;
  sellFeesCents: number;
  realizedPnlCents: number;
  buyDate: string;
  sellDate: string;
}

export interface Holding {
  ticker: string;
  totalShares: number;
  averageCostBasisCents: number;
  currentPriceCents: number | null;
  unrealizedPnlCents: number | null;
  unrealizedPnlPercent: number | null;
  totalFeesCents: number;
  priceUpdatedAt: string | null;
}

export interface PortfolioSummary {
  totalRealizedPnlCents: number;
  totalUnrealizedPnlCents: number | null;
  holdings: Holding[];
  pnlPairs: PnLPair[];
}

export interface CurrentPrice {
  ticker: string;
  priceCents: number;
  updatedAt: string;
}

// ─── Sync Types (Phase 4) ───

/** Tables that participate in cloud sync (D-06: record-level granularity) */
export type SyncTable = 'categories' | 'expenses' | 'trades' | 'current_prices';

/** All syncable record types union */
export type SyncRecord = Category | Expense | Trade | CurrentPrice;

/** Sync manifest stored in Drive root — tracks per-table versions and counts */
export interface SyncManifest {
  version: number;
  tables: Record<SyncTable, { recordCount: number; lastModified: string }>;
  deviceId: string;
  updatedAt: string;
}

/** Per-table sync log entry stored in AsyncStorage (D-13) */
export interface SyncLog {
  table: SyncTable;
  lastSyncAt: string;          // ISO 8601 — last successful sync timestamp
  lastSyncRecordCount: number; // record count at time of last sync
}

/** Current sync state for Zustand store and UI */
export interface SyncState {
  isAuthenticated: boolean;
  isSyncEnabled: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  googleEmail: string | null;
  restoreAvailable: boolean;   // true when fresh install + data found in Drive
  restorePromptDismissed: boolean;
  syncLogs: Record<SyncTable, SyncLog>;
}
