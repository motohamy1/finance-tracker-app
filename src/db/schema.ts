import { openDatabaseSync } from 'expo-sqlite';
import type { Migration } from '@/types';

const DB_NAME = 'finance_tracker.db';

let db: ReturnType<typeof openDatabaseSync> | null = null;

export function getDatabase() {
  if (!db) {
    db = openDatabaseSync(DB_NAME);
    db.execSync('PRAGMA journal_mode = WAL;');
    db.execSync('PRAGMA foreign_keys = ON;');
  }
  return db;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create_categories_and_expenses',
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color_hex TEXT NOT NULL DEFAULT '#0891B2',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        category_id TEXT NOT NULL,
        title TEXT NOT NULL,
        amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
        date TEXT NOT NULL DEFAULT (date('now')),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    `,
  },
  {
    version: 2,
    name: 'create_trades_and_failed_ocr_log',
    sql: `
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY NOT NULL,
        ticker TEXT NOT NULL,
        shares INTEGER NOT NULL CHECK(shares > 0),
        price_per_share_cents INTEGER NOT NULL CHECK(price_per_share_cents > 0),
        trade_date TEXT NOT NULL,
        direction TEXT NOT NULL CHECK(direction IN ('buy', 'sell')),
        fees_cents INTEGER,
        thumbnail_uri TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
      CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON trades(trade_date);
      CREATE INDEX IF NOT EXISTS idx_trades_direction ON trades(direction);

      CREATE TABLE IF NOT EXISTS failed_ocr_log (
        id TEXT PRIMARY KEY NOT NULL,
        image_uri TEXT NOT NULL,
        raw_text TEXT NOT NULL DEFAULT '',
        error_message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 3,
    name: 'create_current_prices',
    sql: `
      CREATE TABLE IF NOT EXISTS current_prices (
        ticker TEXT PRIMARY KEY NOT NULL,
        price_cents INTEGER NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 4,
    name: 'add_asset_type_to_trades',
    sql: `
      ALTER TABLE trades ADD COLUMN asset_type TEXT;
    `,
  },
  {
    version: 5,
    name: 'create_money_sources_and_link_expenses',
    sql: `
      CREATE TABLE IF NOT EXISTS money_sources (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color_hex TEXT NOT NULL DEFAULT '#0891B2',
        icon_name TEXT NOT NULL DEFAULT '',
        balance_cents INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      ALTER TABLE expenses ADD COLUMN money_source_id TEXT REFERENCES money_sources(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_expenses_money_source_id ON expenses(money_source_id);
    `,
  },
  {
    version: 6,
    name: 'add_currency_symbol_to_money_sources',
    sql: `
      ALTER TABLE money_sources ADD COLUMN currency_symbol TEXT DEFAULT '$';
    `,
  },
];

export function runMigrations(): void {
  const database = getDatabase();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const currentVersionRow = database.getFirstSync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations;'
  );
  const currentVersion = currentVersionRow?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      database.execSync('BEGIN TRANSACTION;');
      try {
        database.execSync(migration.sql);
        database.runSync(
          'INSERT INTO _migrations (version, name) VALUES (?, ?);',
          [migration.version, migration.name]
        );
        database.execSync('COMMIT;');
        console.log(`✓ Migration ${migration.version}: ${migration.name} applied`);
      } catch (error) {
        database.execSync('ROLLBACK;');
        console.error(`✗ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }
}
