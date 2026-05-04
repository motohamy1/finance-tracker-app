---
phase: 07-editable-money-sources
plan: 01
subsystem: data-layer
tags: [money-sources, sqlite, migration, zustand, types]
requires: []
provides: [money-source-schema, money-source-types, money-source-crud, expenseStore-money-sources]
affects: [expense-crud, expense-form]
tech-stack:
  added: []
  patterns: [snake-to-camel-mappers, parameterized-queries, tdd-red-green, migration-based-schema-evolution]
key-files:
  created:
    - src/__tests__/migration-v5.test.ts
    - src/__tests__/money-source-types.test.ts
    - src/__tests__/money-source-crud.test.ts
    - src/__tests__/expenseStore-money-source.test.ts
  modified:
    - src/db/schema.ts
    - src/types/index.ts
    - src/services/database.ts
    - src/stores/expenseStore.ts
decisions:
  - "D-03: ON DELETE SET NULL for money_source_id — deleting a source unlinks expenses, doesn't cascade delete"
  - "D-01: Four defaults (Cash, Bank, Savings, Borrowed) seeded on first launch when money_sources table is empty"
  - "D-12: Existing expenses get money_source_id = NULL — no migration auto-assigns values"
  - "balance_cents initialized to 0 in SQL (not parameterized) since new sources always start at zero"
metrics:
  duration: ""
  completed_date: "2026-05-04"
---

# Phase 07 Plan 01: Money Source Data Foundation Summary

**One-liner:** SQLite migration v5, MoneySource types, database CRUD operations, and Zustand store integration with four seeded default money sources (Cash, Bank, Savings, Borrowed) — all with TDD RED/GREEN cycle per task.

## Outcome

All three TDD tasks completed successfully. The money source data layer is fully operational: migration v5 creates the `money_sources` table with 7 columns plus an index, the `expenses` table gains an optional `money_source_id` foreign key column with `ON DELETE SET NULL`, TypeScript types (MoneySource, MONEY_SOURCE_PALETTE, MONEY_SOURCE_DEFAULTS) are exported, six database CRUD functions are available, and the expenseStore manages money source state with auto-seeded defaults on first launch.

## Task Completion

| # | Task | Type | Status | Commit | Tests |
|---|------|------|--------|--------|-------|
| 1 | Migration v5 — money_sources table + expenses.money_source_id | TDD | ✓ Complete | `a787b38` → `1964cad` | 9/9 pass |
| 2 | MoneySource types + database CRUD operations | TDD | ✓ Complete | `2c68a88` → `b775947` | 14/14 pass |
| 3 | expenseStore money source integration with seeded defaults | TDD | ✓ Complete | `c6e76a9` → `2b8b615` | 9/9 pass |

## TDD Gate Compliance

All three tasks followed the RED → GREEN TDD cycle:

| Task | RED Commit | GREEN Commit | Tests (RED) | Tests (GREEN) |
|------|-----------|-------------|-------------|---------------|
| 1 | `a787b38` — 7/9 failed | `1964cad` — 9/9 pass | 7 failed, 2 pass | 9 pass |
| 2 | `2c68a88` — 14/14 failed | `b775947` — 14/14 pass | 14 failed | 14 pass |
| 3 | `c6e76a9` — 9/9 failed | `2b8b615` — 9/9 pass | 9 failed | 9 pass |

✅ All gates verified: RED commits show expected failures, GREEN commits show all passing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test expecting 8 params for createMoneySource when actual params are 7**
- **Found during:** Task 2, money-source-crud test (GREEN phase)
- **Issue:** Test `createMoneySource inserts row with parameterized query...` expected `paramsArg` to have length 8, but the plan's SQL hardcodes `balance_cents` as `0` (not parameterized), resulting in 7 params: `[id, name, colorHex, iconName, sortOrder, now, now]`
- **Fix:** Adjusted test expectations from 8 to 7 params and updated index assertions accordingly
- **Files modified:** `src/__tests__/money-source-crud.test.ts`
- **Commit:** Included in `b775947`

## Pre-existing Issues (Out of Scope)

32 OCR-related tests in `ocr.test.ts`, `ocr-enhanced.test.ts`, `ocr-thndr.test.ts`, and `ocr-accuracy.test.ts` fail due to `parseTradeFromText()` in `src/services/ocr.ts` returning an `assetType` property not present in the `OCRResult` interface. These failures pre-date this plan and are not caused by any changes here.

## Known Stubs

None. The data layer is fully wired — types, database CRUD, and store state management are all functional. The UI (money source picker in ExpenseForm, money source cards) will be added in subsequent plans (07-02, 07-03) per the phase design.

## Threat Flags

None. All threat model mitigations from the plan are implemented:
- ✅ T-07-02: `ON DELETE SET NULL` prevents dangling references (migration v5, per D-03)
- ✅ T-07-03: Transaction-per-migration with ROLLBACK on failure (existing migration runner)
- ✅ T-07-05: All queries use parameterized statements, INTEGER cents for dollar amounts

## What Changed

### Schema (src/db/schema.ts)
- Added migration v5 entry to MIGRATIONS array: creates `money_sources` table (7 columns), adds `money_source_id` to `expenses` with `ON DELETE SET NULL`, creates index `idx_expenses_money_source_id`

### Types (src/types/index.ts)
- Added `MoneySource` interface (8 fields: id, name, colorHex, iconName, balanceCents, sortOrder, createdAt, updatedAt)
- Added `MONEY_SOURCE_PALETTE` — 8 colors (4 default + 4 fallback)
- Added `MONEY_SOURCE_DEFAULTS` — 4 seeded sources with predefined colors and icons
- Extended `Expense` with optional `moneySourceId?: string | null`
- Extended `ExpenseFormData` with optional `moneySourceId?: string | null`

### Database Service (src/services/database.ts)
- Added MoneySource row type and `rowToMoneySource()` mapper
- Added 6 CRUD functions: `getAllMoneySources`, `getMoneySourceById`, `createMoneySource`, `updateMoneySource`, `deleteMoneySource`, `getExpenseCountForMoneySource`
- Updated `createExpense` to accept `moneySourceId` parameter (inserts into `money_source_id` column)
- Updated `updateExpense` to accept `moneySourceId` in updates object
- Updated `getExpenseById`, `getExpensesByCategory`, and `rowToExpense` to select and map `money_source_id`

### Store (src/stores/expenseStore.ts)
- Added `moneySources: MoneySource[]` to state
- Added `initialize()` logic: loads money sources, seeds 4 defaults if table is empty
- Added 6 money source actions: `addMoneySource`, `renameMoneySource`, `updateMoneySourceBalance`, `updateMoneySourceColor`, `removeMoneySource`, `reorderMoneySources`
- Added `getMoneySourceExpenseCount` helper
- Updated `addExpense` to pass `moneySourceId` to `createExpense`
- Updated `editExpense` to handle `moneySourceId` in dynamic updates
- Exported `MoneySourceFormData` interface

## Verification

- TypeScript compilation: Modified files compile cleanly (pre-existing errors in OCR tests unrelated)
- Test suite: All 32 new tests pass across 4 test files
- Migration tests: v5 schema validated (column types, ON DELETE SET NULL, index)
- Type tests: MoneySource interface, palette, defaults, Expense/ExpenseFormData moneySourceId
- CRUD tests: 6 database functions verified with mocked SQLite
- Store tests: Initialize seeding, all CRUD actions, expense linking

## Self-Check

- [x] `src/db/schema.ts` exists and modified
- [x] `src/types/index.ts` exists and modified
- [x] `src/services/database.ts` exists and modified
- [x] `src/stores/expenseStore.ts` exists and modified
- [x] 4 test files created with 32 passing tests
- [x] 6 commits in git log (3 RED + 3 GREEN)
- [x] No deletions, no untracked files
- [x] SUMMARY.md written
