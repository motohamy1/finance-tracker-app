import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('MoneySource types', () => {
  const typesPath = path.resolve(__dirname, '../types/index.ts');
  const fileContent = fs.readFileSync(typesPath, 'utf-8');

  it('exports MoneySource interface with all 8 fields', () => {
    expect(fileContent).toContain('export interface MoneySource');
    expect(fileContent).toContain('id: string');
    expect(fileContent).toContain('name: string');
    expect(fileContent).toContain('colorHex: string');
    expect(fileContent).toContain('iconName: string');
    expect(fileContent).toContain('balanceCents: number');
    expect(fileContent).toContain('sortOrder: number');
    expect(fileContent).toContain('createdAt: string');
    expect(fileContent).toContain('updatedAt: string');
  });

  it('exports MONEY_SOURCE_PALETTE with 8 hex colors', () => {
    expect(fileContent).toContain('MONEY_SOURCE_PALETTE');
    // It has 8 color values
    const paletteMatch = fileContent.match(/MONEY_SOURCE_PALETTE[\s\S]*?\] as const;/);
    const palette = paletteMatch ? paletteMatch[0] : '';
    const colorMatches = palette.match(/'#[0-9A-Fa-f]{6}'/g);
    expect(colorMatches).not.toBeNull();
    expect(colorMatches!.length).toBe(8);
    // First 4 are default colors
    expect(colorMatches![0]).toBe("'#22C55E'"); // Cash green
    expect(colorMatches![1]).toBe("'#0EA5E9'"); // Bank sky blue
    expect(colorMatches![2]).toBe("'#14B8A6'"); // Savings teal
    expect(colorMatches![3]).toBe("'#F43F5E'"); // Borrowed rose
  });

  it('exports MONEY_SOURCE_DEFAULTS with 4 entries', () => {
    expect(fileContent).toContain('MONEY_SOURCE_DEFAULTS');
    // Count name entries in defaults
    const defaultsMatch = fileContent.match(/MONEY_SOURCE_DEFAULTS[\s\S]*?\] as const/);
    const defaults = defaultsMatch ? defaultsMatch[0] : '';
    const nameMatches = defaults.match(/name:/g);
    expect(nameMatches).not.toBeNull();
    expect(nameMatches!.length).toBe(4);
    // Verify default names
    expect(defaults).toContain("'Cash'");
    expect(defaults).toContain("'Bank'");
    expect(defaults).toContain("'Savings'");
    expect(defaults).toContain("'Borrowed'");
  });

  it('Expense interface includes optional moneySourceId field', () => {
    // Find Expense interface block
    const expenseMatch = fileContent.match(/export interface Expense[\s\S]*?\n\}/);
    expect(expenseMatch).not.toBeNull();
    // In the block: moneySourceId?: string | null;
    const expenseBlock = expenseMatch![0];
    expect(expenseBlock).toMatch(/moneySourceId\?\s*:\s*string\s*\|\s*null/);
  });

  it('ExpenseFormData interface includes optional moneySourceId field', () => {
    const formDataMatch = fileContent.match(/export interface ExpenseFormData[\s\S]*?\n\}/);
    expect(formDataMatch).not.toBeNull();
    const formDataBlock = formDataMatch![0];
    expect(formDataBlock).toMatch(/moneySourceId\?\s*:\s*string\s*\|\s*null/);
  });
});
