import { getDatabase } from '@/db/schema';
import type { Category, Expense, Trade, TradeDirection, FailedOCRLog } from '@/types';
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

// ─── Expense Operations ───

export function getExpensesByCategory(categoryId: string): Expense[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string; category_id: string; title: string;
    amount_cents: number; date: string; notes: string | null;
    created_at: string; updated_at: string;
  }>('SELECT * FROM expenses WHERE category_id = ? ORDER BY date DESC, created_at DESC;', [categoryId]);
  return rows.map(rowToExpense);
}

export function getExpenseById(id: string): Expense | null {
  const db = getDatabase();
  const row = db.getFirstSync<{
    id: string; category_id: string; title: string;
    amount_cents: number; date: string; notes: string | null;
    created_at: string; updated_at: string;
  }>('SELECT * FROM expenses WHERE id = ?;', [id]);
  return row ? rowToExpense(row) : null;
}

export function createExpense(
  id: string, categoryId: string, title: string,
  amountCents: number, date: string, notes: string | null
): Expense {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    'INSERT INTO expenses (id, category_id, title, amount_cents, date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
    [id, categoryId, title, amountCents, date, notes, now, now]
  );
  return getExpenseById(id)!;
}

export function updateExpense(id: string, updates: { title?: string; amountCents?: number; date?: string; notes?: string | null; categoryId?: string }): Expense | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];
  if (updates.title !== undefined) { setClauses.push('title = ?'); params.push(updates.title); }
  if (updates.amountCents !== undefined) { setClauses.push('amount_cents = ?'); params.push(updates.amountCents); }
  if (updates.date !== undefined) { setClauses.push('date = ?'); params.push(updates.date); }
  if (updates.notes !== undefined) { setClauses.push('notes = ?'); params.push(updates.notes); }
  if (updates.categoryId !== undefined) { setClauses.push('category_id = ?'); params.push(updates.categoryId); }
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

function rowToExpense(row: { id: string; category_id: string; title: string; amount_cents: number; date: string; notes: string | null; created_at: string; updated_at: string }): Expense {
  return {
    id: row.id,
    categoryId: row.category_id,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createTrade(
  id: string, ticker: string, shares: number,
  pricePerShareCents: number, tradeDate: string, direction: TradeDirection,
  feesCents: number | null, thumbnailUri: string | null, notes: string | null
): Trade {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO trades (id, ticker, shares, price_per_share_cents, trade_date, direction,
      fees_cents, thumbnail_uri, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, ticker, shares, pricePerShareCents, tradeDate, direction, feesCents, thumbnailUri, notes, now, now]
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
