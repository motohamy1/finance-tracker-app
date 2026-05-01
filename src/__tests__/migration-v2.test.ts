import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration v2: trades and failed_ocr_log tables', () => {
  // Read the schema source file directly
  const schemaPath = path.resolve(__dirname, '../db/schema.ts');
  const fileContent = fs.readFileSync(schemaPath, 'utf-8');

  // Extract the v2 migration SQL block (between version: 2 and the closing })
  const v2Match = fileContent.match(/version:\s*2[\s\S]*?sql:\s*`([\s\S]*?)`/);
  const v2SQL = v2Match ? v2Match[1] : '';

  const hasV2 = fileContent.includes('version: 2');

  it('MIGRATIONS array has at least 2 entries (v1 + v2)', () => {
    // Count version entries in the MIGRATIONS array
    const versionMatches = fileContent.match(/version:\s*\d+/g);
    expect(versionMatches).not.toBeNull();
    expect(versionMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it('v2 migration has version: 2 and correct name', () => {
    expect(hasV2).toBe(true);
    expect(fileContent).toContain('create_trades_and_failed_ocr_log');
  });

  it('v2 SQL creates trades table with all 11 columns (snake_case)', () => {
    expect(v2SQL).toContain('CREATE TABLE IF NOT EXISTS trades');

    const columns = [
      'id', 'ticker', 'shares', 'price_per_share_cents',
      'trade_date', 'direction', 'fees_cents', 'thumbnail_uri',
      'notes', 'created_at', 'updated_at',
    ];
    for (const col of columns) {
      expect(v2SQL).toContain(col);
    }
  });

  it('trades table has CHECK constraints on shares, price_per_share_cents, and direction', () => {
    expect(v2SQL).toContain('CHECK(shares > 0)');
    expect(v2SQL).toContain('CHECK(price_per_share_cents > 0)');
    expect(v2SQL).toContain("CHECK(direction IN ('buy', 'sell'))");
  });

  it('v2 SQL creates failed_ocr_log table with all 5 columns', () => {
    expect(v2SQL).toContain('CREATE TABLE IF NOT EXISTS failed_ocr_log');

    const columns = ['id', 'image_uri', 'raw_text', 'error_message', 'created_at'];
    for (const col of columns) {
      expect(v2SQL).toContain(col);
    }
  });

  it('v2 SQL creates 3 indexes on trades table', () => {
    expect(v2SQL).toContain('CREATE INDEX IF NOT EXISTS idx_trades_ticker');
    expect(v2SQL).toContain('CREATE INDEX IF NOT EXISTS idx_trades_trade_date');
    expect(v2SQL).toContain('CREATE INDEX IF NOT EXISTS idx_trades_direction');
  });

  it('v2 SQL has no DROP TABLE statements', () => {
    expect(v2SQL).not.toContain('DROP TABLE');
  });

  it('v1 migration is not modified (still version 1 with correct SQL)', () => {
    expect(fileContent).toContain('version: 1');
    expect(fileContent).toContain('create_categories_and_expenses');
    expect(fileContent).toContain('CREATE TABLE IF NOT EXISTS categories');
    expect(fileContent).toContain('CREATE TABLE IF NOT EXISTS expenses');
  });
});
