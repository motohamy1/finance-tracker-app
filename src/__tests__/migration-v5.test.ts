import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration v5: money_sources table + expenses.money_source_id column', () => {
  const schemaPath = path.resolve(__dirname, '../db/schema.ts');
  const fileContent = fs.readFileSync(schemaPath, 'utf-8');

  // Extract the v5 migration SQL block
  const v5Match = fileContent.match(/version:\s*5[\s\S]*?sql:\s*`([\s\S]*?)`/);
  const v5SQL = v5Match ? v5Match[1] : '';

  it('MIGRATIONS array has at least 5 entries (v1-v5)', () => {
    const versionMatches = fileContent.match(/version:\s*\d+/g);
    expect(versionMatches).not.toBeNull();
    expect(versionMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it('v5 migration has version: 5 and correct name', () => {
    expect(fileContent).toContain('version: 5');
    expect(fileContent).toContain('create_money_sources_and_link_expenses');
  });

  it('v5 SQL creates money_sources table with all 7 columns (snake_case)', () => {
    expect(v5SQL).toContain('CREATE TABLE IF NOT EXISTS money_sources');

    const columns = [
      'id', 'name', 'color_hex', 'icon_name',
      'balance_cents', 'sort_order', 'created_at', 'updated_at',
    ];
    for (const col of columns) {
      expect(v5SQL).toContain(col);
    }
  });

  it('money_sources table has correct column types and defaults', () => {
    expect(v5SQL).toContain('id TEXT PRIMARY KEY NOT NULL');
    expect(v5SQL).toContain('name TEXT NOT NULL');
    expect(v5SQL).toContain("color_hex TEXT NOT NULL DEFAULT '#0891B2'");
    expect(v5SQL).toContain("icon_name TEXT NOT NULL DEFAULT ''");
    expect(v5SQL).toContain('balance_cents INTEGER NOT NULL DEFAULT 0');
    expect(v5SQL).toContain('sort_order INTEGER NOT NULL DEFAULT 0');
  });

  it('v5 SQL adds money_source_id column to expenses with ON DELETE SET NULL', () => {
    expect(v5SQL).toContain('ALTER TABLE expenses ADD COLUMN money_source_id TEXT');
    expect(v5SQL).toContain('REFERENCES money_sources(id) ON DELETE SET NULL');
  });

  it('v5 SQL uses ON DELETE SET NULL (not CASCADE) per D-03', () => {
    expect(v5SQL).toContain('ON DELETE SET NULL');
    expect(v5SQL).not.toContain('ON DELETE CASCADE');
  });

  it('v5 SQL creates index on expenses.money_source_id', () => {
    expect(v5SQL).toContain('CREATE INDEX IF NOT EXISTS idx_expenses_money_source_id');
    expect(v5SQL).toContain('ON expenses(money_source_id)');
  });

  it('v5 SQL has no DROP TABLE statements', () => {
    expect(v5SQL).not.toContain('DROP TABLE');
  });

  it('v1-v4 migrations are not modified', () => {
    expect(fileContent).toContain('version: 1');
    expect(fileContent).toContain('version: 2');
    expect(fileContent).toContain('version: 3');
    expect(fileContent).toContain('version: 4');
    expect(fileContent).toContain('create_categories_and_expenses');
    expect(fileContent).toContain('create_trades_and_failed_ocr_log');
    expect(fileContent).toContain('create_current_prices');
    expect(fileContent).toContain('add_asset_type_to_trades');
  });
});
