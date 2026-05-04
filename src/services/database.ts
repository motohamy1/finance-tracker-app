import { getDatabase } from '@/db/schema';
import type { Category, Expense, MoneySource, Trade, TradeDirection, FailedOCRLog } from '@/types';
import { generateUUID } from '@/utils/format';

// ─── Category Operations ───

export function getAllCategories(): Category[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string; name: string; color_hex: string;
    sort_order: number; created_at: string; updated_at: string;
  }>('SELECT * FROM categories ORDER BY sort_order ASC;');
  return rows.map(rowToCategory);
}

export function getCategoryById(id: string): Category | null {
  const db = getDatabase();
  const row = db.getFirstSync<{
    id: string; name: string; color_hex: string;
    sort_order: number; created_at: string; updated_at: string;
  }>('SELECT * FROM categories WHERE id = ?;', [id]);
  return row ? rowToCategory(row) : null;
}

export function createCategory(id: string, name: string, colorHex: string, sortOrder: number): Category {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO categories (id, name, color_hex, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
    [id, name, colorHex, sortOrder, now, now]
  );
  return getCategoryById(id)!;
}

export function updateCategory(id: string, updates: { name?: string; sortOrder?: number }): Category | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  if (updates.name !== undefined) {
    db.runSync('UPDATE categories SET name = ?, updated_at = ? WHERE id = ?;', [updates.name, now, id]);
  }
  if (updates.sortOrder !== undefined) {
    db.runSync('UPDATE categories SET sort_order = ?, updated_at = ? WHERE id = ?;', [updates.sortOrder, now, id]);
  }
  return getCategoryById(id);
}

export function deleteCategory(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM categories WHERE id = ?;', [id]);
}

export function getExpenseCountForCategory(categoryId: string): number {
  const db = getDatabase();
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?;',
    [categoryId]
  );
  return row?.count ?? 0;
}

// ─── Money Source Operations ───

type MoneySourceRow = {
  id: string; name: string; color_hex: string; icon_name: string;
  balance_cents: number; sort_order: number; created_at: string; updated_at: string;
};

function rowToMoneySource(row: MoneySourceRow): MoneySource {
  return {
    id: row.id, name: row.name, colorHex: row.color_hex,
    iconName: row.icon_name, balanceCents: row.balance_cents,
    sortOrder: row.sort_order, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function getAllMoneySources(): MoneySource[] {
  const db = getDatabase();
  const rows = db.getAllSync<MoneySourceRow>(
    'SELECT * FROM money_sources ORDER BY sort_order ASC;'
  );
  return rows.map(rowToMoneySource);
}

export function getMoneySourceById(id: string): MoneySource | null {
  const db = getDatabase();
  const row = db.getFirstSync<MoneySourceRow>(
    'SELECT * FROM money_sources WHERE id = ?;', [id]
  );
  return row ? rowToMoneySource(row) : null;
}

export function createMoneySource(id: string, name: string, colorHex: string, iconName: string, sortOrder: number): MoneySource {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO money_sources (id, name, color_hex, icon_name, balance_cents, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?);',
    [id, name, colorHex, iconName, sortOrder, now, now]
  );
  return getMoneySourceById(id)!;
}

export function updateMoneySource(id: string, updates: { name?: string; colorHex?: string; iconName?: string; balanceCents?: number; sortOrder?: number }): MoneySource | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: (string | number)[] = [];
  if (updates.name !== undefined) { setClauses.push('name = ?'); params.push(updates.name); }
  if (updates.colorHex !== undefined) { setClauses.push('color_hex = ?'); params.push(updates.colorHex); }
  if (updates.iconName !== undefined) { setClauses.push('icon_name = ?'); params.push(updates.iconName); }
  if (updates.balanceCents !== undefined) { setClauses.push('balance_cents = ?'); params.push(updates.balanceCents); }
  if (updates.sortOrder !== undefined) { setClauses.push('sort_order = ?'); params.push(updates.sortOrder); }
  if (setClauses.length === 0) return getMoneySourceById(id);
  setClauses.push('updated_at = ?');
  params.push(now, id);
  db.runSync(`UPDATE money_sources SET ${setClauses.join(', ')} WHERE id = ?;`, params);
  return getMoneySourceById(id);
}

export function deleteMoneySource(id: string): void {
  const db = getDatabase();
  // ON DELETE SET NULL in schema handles unlinking expenses (per D-03)
  db.runSync('DELETE FROM money_sources WHERE id = ?;', [id]);
}

export function getExpenseCountForMoneySource(moneySourceId: string): number {
  const db = getDatabase();
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM expenses WHERE money_source_id = ?;',
    [moneySourceId]
  );
  return row?.count ?? 0;
}

// ─── Expense Operations ───

export function getExpensesByCategory(categoryId: string): Expense[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string; category_id: string; money_source_id: string | null; title: string;
    amount_cents: number; date: string; notes: string | null;
    created_at: string; updated_at: string;
  }>('SELECT * FROM expenses WHERE category_id = ? ORDER BY date DESC, created_at DESC;', [categoryId]);
  return rows.map(rowToExpense);
}

export function getExpenseById(id: string): Expense | null {
  const db = getDatabase();
  const row = db.getFirstSync<{
    id: string; category_id: string; money_source_id: string | null; title: string;
    amount_cents: number; date: string; notes: string | null;
    created_at: string; updated_at: string;
  }>('SELECT * FROM expenses WHERE id = ?;', [id]);
  return row ? rowToExpense(row) : null;
}

export function createExpense(
  id: string, categoryId: string, moneySourceId: string | null, title: string,
  amountCents: number, date: string, notes: string | null
): Expense {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO expenses (id, category_id, money_source_id, title, amount_cents, date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    [id, categoryId, moneySourceId, title, amountCents, date, notes, now, now]
  );
  return getExpenseById(id)!;
}

export function updateExpense(id: string, updates: { title?: string; amountCents?: number; date?: string; notes?: string | null; categoryId?: string; moneySourceId?: string | null }): Expense | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];
  if (updates.title !== undefined) { setClauses.push('title = ?'); params.push(updates.title); }
  if (updates.amountCents !== undefined) { setClauses.push('amount_cents = ?'); params.push(updates.amountCents); }
  if (updates.date !== undefined) { setClauses.push('date = ?'); params.push(updates.date); }
  if (updates.notes !== undefined) { setClauses.push('notes = ?'); params.push(updates.notes); }
  if (updates.categoryId !== undefined) { setClauses.push('category_id = ?'); params.push(updates.categoryId); }
  if (updates.moneySourceId !== undefined) { setClauses.push('money_source_id = ?'); params.push(updates.moneySourceId); }
  if (setClauses.length === 0) return getExpenseById(id);
  setClauses.push('updated_at = ?');
  params.push(now, id);
  db.runSync(`UPDATE expenses SET ${setClauses.join(', ')} WHERE id = ?;`, params);
  return getExpenseById(id);
}

export function deleteExpense(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM expenses WHERE id = ?;', [id]);
}

// ─── Row Mappers (snake_case DB → camelCase TS) ───

function rowToCategory(row: { id: string; name: string; color_hex: string; sort_order: number; created_at: string; updated_at: string }): Category {
  return {
    id: row.id,
    name: row.name,
    colorHex: row.color_hex,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToExpense(row: { id: string; category_id: string; money_source_id?: string | null; title: string; amount_cents: number; date: string; notes: string | null; created_at: string; updated_at: string }): Expense {
  return {
    id: row.id,
    categoryId: row.category_id,
    moneySourceId: row.money_source_id ?? null,
    title: row.title,
    amountCents: row.amount_cents,
    date: row.date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Trade Operations ───

type TradeRow = {
  id: string; ticker: string; shares: number;
  price_per_share_cents: number; trade_date: string; direction: string;
  fees_cents: number | null; thumbnail_uri: string | null; notes: string | null;
  asset_type: string | null;
  created_at: string; updated_at: string;
};

function rowToTrade(row: TradeRow): Trade {
  return {
    id: row.id, ticker: row.ticker, shares: row.shares,
    pricePerShareCents: row.price_per_share_cents,
    tradeDate: row.trade_date,
    direction: row.direction as TradeDirection,
    feesCents: row.fees_cents,
    thumbnailUri: row.thumbnail_uri,
    notes: row.notes,
    assetType: row.asset_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createTrade(
  id: string, ticker: string, shares: number,
  pricePerShareCents: number, tradeDate: string, direction: TradeDirection,
  feesCents: number | null, thumbnailUri: string | null, notes: string | null,
  assetType: string | null
): Trade {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO trades (id, ticker, shares, price_per_share_cents, trade_date, direction,
      fees_cents, thumbnail_uri, notes, asset_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, ticker, shares, pricePerShareCents, tradeDate, direction, feesCents, thumbnailUri, notes, assetType, now, now]
  );
  return getTradeById(id)!;
}

export function getAllTrades(): Trade[] {
  const db = getDatabase();
  const rows = db.getAllSync<TradeRow>(
    'SELECT * FROM trades ORDER BY trade_date DESC, created_at DESC;'
  );
  return rows.map(rowToTrade);
}

export function getTradeById(id: string): Trade | null {
  const db = getDatabase();
  const row = db.getFirstSync<TradeRow>(
    'SELECT * FROM trades WHERE id = ?;', [id]
  );
  return row ? rowToTrade(row) : null;
}

export function updateTrade(
  id: string,
  updates: {
    ticker?: string; shares?: number; pricePerShareCents?: number;
    tradeDate?: string; direction?: TradeDirection; feesCents?: number | null;
    thumbnailUri?: string | null; notes?: string | null;
    assetType?: string | null;
  }
): Trade | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (updates.ticker !== undefined) { setClauses.push('ticker = ?'); params.push(updates.ticker); }
  if (updates.shares !== undefined) { setClauses.push('shares = ?'); params.push(updates.shares); }
  if (updates.pricePerShareCents !== undefined) { setClauses.push('price_per_share_cents = ?'); params.push(updates.pricePerShareCents); }
  if (updates.tradeDate !== undefined) { setClauses.push('trade_date = ?'); params.push(updates.tradeDate); }
  if (updates.direction !== undefined) { setClauses.push('direction = ?'); params.push(updates.direction); }
  if (updates.feesCents !== undefined) { setClauses.push('fees_cents = ?'); params.push(updates.feesCents); }
  if (updates.thumbnailUri !== undefined) { setClauses.push('thumbnail_uri = ?'); params.push(updates.thumbnailUri); }
  if (updates.notes !== undefined) { setClauses.push('notes = ?'); params.push(updates.notes); }
  if (updates.assetType !== undefined) { setClauses.push('asset_type = ?'); params.push(updates.assetType); }

  if (setClauses.length === 0) return getTradeById(id);
  setClauses.push('updated_at = ?');
  params.push(now, id);
  db.runSync(`UPDATE trades SET ${setClauses.join(', ')} WHERE id = ?;`, params);
  return getTradeById(id);
}

export function deleteTrade(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM trades WHERE id = ?;', [id]);
}

export function getAllAssetTypes(): string[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ asset_type: string }>(
    'SELECT DISTINCT asset_type FROM trades WHERE asset_type IS NOT NULL ORDER BY asset_type;'
  );
  return rows.map(r => r.asset_type);
}

// ─── Failed OCR Log Operations ───

type FailedOCRLogRow = {
  id: string; image_uri: string; raw_text: string;
  error_message: string; created_at: string;
};

function rowToFailedOCRLog(row: FailedOCRLogRow): FailedOCRLog {
  return {
    id: row.id, imageUri: row.image_uri, rawText: row.raw_text,
    errorMessage: row.error_message, createdAt: row.created_at,
  };
}

export function logFailedOCR(imageUri: string, rawText: string, errorMessage: string): FailedOCRLog {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO failed_ocr_log (id, image_uri, raw_text, error_message, created_at) VALUES (?, ?, ?, ?, ?);',
    [id, imageUri, rawText, errorMessage, now]
  );
  return { id, imageUri, rawText, errorMessage, createdAt: now };
}

export function getFailedOCRLogs(): FailedOCRLog[] {
  const db = getDatabase();
  const rows = db.getAllSync<FailedOCRLogRow>(
    'SELECT * FROM failed_ocr_log ORDER BY created_at DESC;'
  );
  return rows.map(rowToFailedOCRLog);
}

export function clearFailedOCRLogs(): void {
  const db = getDatabase();
  db.runSync('DELETE FROM failed_ocr_log;');
}

// ─── Current Prices ───

export function upsertCurrentPrice(ticker: string, priceCents: number): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO current_prices (ticker, price_cents, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(ticker) DO UPDATE SET
       price_cents = excluded.price_cents,
       updated_at = excluded.updated_at;`,
    [ticker, priceCents]
  );
}

export function getAllCurrentPrices(): Record<string, { priceCents: number; updatedAt: string }> {
  const db = getDatabase();
  const rows = db.getAllSync<{ ticker: string; price_cents: number; updated_at: string }>(
    'SELECT ticker, price_cents, updated_at FROM current_prices;'
  );
  const map: Record<string, { priceCents: number; updatedAt: string }> = {};
  for (const row of rows) {
    map[row.ticker] = { priceCents: row.price_cents, updatedAt: row.updated_at };
  }
  return map;
}
