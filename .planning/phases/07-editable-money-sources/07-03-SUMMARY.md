---
phase: 07-editable-money-sources
plan: 03
subsystem: integration
tags: [money-source-picker, expense-card-indicator, screen-integration, tdd, context-pre-select]
requires:
  - money-source-data-foundation
  - money-source-ui-components
provides: [expense-money-source-linking, context-based-pre-select, screen-layout-upgrade]
affects: [expense-form, expense-card, expenses-screen]
tech-stack:
  added: []
  patterns: [tdd-red-green, zustand-selectors, picker-replication, context-pre-select, list-header-composition]
key-files:
  created:
    - src/__tests__/ExpenseForm-money-source.test.tsx
    - src/__tests__/ExpenseCard-money-source.test.tsx
    - src/__tests__/expenses-screen-money-source.test.tsx
  modified:
    - src/components/ExpenseForm.tsx
    - src/components/ExpenseCard.tsx
    - src/app/(expenses)/index.tsx
decisions:
  - "D-10: Context pre-select — tapping a money source card sets selectedMoneySourceId, passed as preselectedMoneySourceId to ExpenseForm"
  - "D-09: Money source on expenses is optional — moneySourceId defaults to null when 'None' is selected"
  - "D-12: Pre-Phase 7 expenses (moneySourceId=null) show no indicator on ExpenseCards"
  - "BalanceCard.tsx file preserved — only import and render removed from index.tsx"
metrics:
  duration: "20min"
  completed_date: "2026-05-04"
---

# Phase 07 Plan 03: Money Source Integration Summary

**One-liner:** Connected money sources into the existing expense tracking workflow: a money source picker in ExpenseForm (styled identically to the category picker), an optional money source indicator on ExpenseCards, and the expenses screen layout upgraded from BalanceCard to MoneySourceRow + TotalBalanceSummary with context-based pre-selection.

## Outcome

All three TDD tasks completed successfully. The money source integration layer is fully operational: 23 tests pass across 3 test files, 3 source files modified with zero TypeScript errors. Users can now link expenses to money sources when creating/editing, expense cards optionally display a money source indicator, and the expenses screen shows the new money source card row with total balance summary — fully replacing the old BalanceCard.

## Task Completion

| # | Task | Type | Status | RED Commit | GREEN Commit | Tests |
|---|------|------|--------|-----------|-------------|-------|
| 1 | ExpenseForm money source picker | TDD | ✓ Complete | `b6b5a64` | `a07fe90` | 9/9 pass |
| 2 | ExpenseCard money source indicator | TDD | ✓ Complete | `37713bb` | `314076d` | 6/6 pass |
| 3 | Expenses screen money source integration | TDD | ✓ Complete | `041751c` | `275fba7` | 8/8 pass |

## TDD Gate Compliance

All three tasks followed the RED → GREEN TDD cycle:

| Task | RED Commit | GREEN Commit | Tests (RED) | Tests (GREEN) |
|------|-----------|-------------|-------------|---------------|
| 1 | `b6b5a64` — 9/9 failed | `a07fe90` — 9/9 pass | 9 failed | 9 pass |
| 2 | `37713bb` — 5/6 failed (1 pass natural) | `314076d` — 6/6 pass | 5 failed, 1 pass | 6 pass |
| 3 | `041751c` — 8/8 failed | `275fba7` — 8/8 pass | 8 failed | 8 pass |

✅ All gates verified: RED commits show expected failures; GREEN commits show all 23 tests passing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test selectors used non-CSS-compatible style properties (borderLeftColor)**
- **Found during:** Task 2, GREEN phase (test execution)
- **Issue:** Tests queried `document.querySelector('[style*="border-left-color"]')` but `borderLeftColor` is not in the `CSS_COMPATIBLE` set used by the `safeStyle()` helper, so it never appears in DOM style attributes. Also `require('@/stores/expenseStore')` failed on `vi.mock`-ed modules.
- **Fix:** Rewrote test selectors to use `screen.getByText()` and `data-testid` queries instead of style-attribute selectors. Used `vi.hoisted()` with mutable state and lazy getters for dynamic mock configuration in both ExpenseCard and expenses screen tests.
- **Files modified:** `src/__tests__/ExpenseCard-money-source.test.tsx`, `src/__tests__/expenses-screen-money-source.test.tsx`

**2. [Rule 3 - Blocking] vitest hoisting prevented mock function references in vi.mock factories**
- **Found during:** Task 3, RED phase (test compilation)
- **Issue:** `BalanceCardMock`, `MoneySourceRowMock`, and `TotalBalanceSummaryMock` were defined as `const` after `vi.mock()` calls. vitest hoists `vi.mock` to the top, causing `ReferenceError: Cannot access 'BalanceCardMock' before initialization`.
- **Fix:** Moved all mock function definitions into `vi.hoisted()` blocks, ensuring they're available when `vi.mock` factories execute.
- **Files modified:** `src/__tests__/expenses-screen-money-source.test.tsx`

## Pre-existing Issues (Out of Scope)

- 32 OCR-related tests in `ocr.test.ts`, `ocr-enhanced.test.ts`, `ocr-thndr.test.ts`, and `ocr-accuracy.test.ts` fail due to `parseTradeFromText()` returning an `assetType` property missing from the `OCRResult` interface (pre-dates this plan).
- `tradeStore.test.ts` has 2 assertion failures (unrelated to money sources).
- `evaluator.test.ts` and `reviewScreen.test.ts` have type errors (pre-existing).
- `MoneySourceCard.test.tsx` has TypeScript errors with `.mock` property on `ActionSheetIOS`/`Alert` mock types (pre-existing).

## Known Stubs

None. All three integration points are fully wired:
- ExpenseForm picker reads `moneySources` from Zustand store, supports pre-selection via `preselectedMoneySourceId` prop, and passes `moneySourceId` in `handleSave`
- ExpenseCard optionally renders money source indicator (colored dot + name) when `expense.moneySourceId` is set, with null guard for pre-Phase 7 expenses
- Expenses screen displays TotalBalanceSummary + MoneySourceRow in both populated and empty states, with context-based pre-selection that persists across FAB and category card interactions

## Threat Flags

None. All threat model mitigations from the plan are implemented:
- ✅ T-07-10: Money source picker only offers valid MoneySource IDs from the store — no user-entered ID strings
- ✅ T-07-11: Indicator only shows money source name and color — no sensitive financial data exposed
- ✅ T-07-12: MoneySourceRow handles empty state gracefully (EmptyState); TotalBalanceSummary safely renders `$0.00` for zero sources
- ✅ T-07-13: Context pre-selection is a UI convenience — no authorization bypass, user can change picker at any time

## What Changed

### ExpenseForm (`src/components/ExpenseForm.tsx` — 54 insertions, 3 deletions)

- **New prop:** `preselectedMoneySourceId?: string | null` — context pre-select support (D-10)
- **New store selector:** `moneySources` from `useExpenseStore`
- **New state:** `moneySourceId` (string | null), `showMoneySourcePicker` (boolean)
- **Updated `useEffect`:** Initializes `moneySourceId` from `editingExpense?.moneySourceId ?? preselectedMoneySourceId ?? null`
- **Updated `handleSave`:** Includes `moneySourceId: moneySourceId || null` in `ExpenseFormData`
- **New UI section (between Category and Title):**
  - Label: "Money Source (optional)"
  - Select button styled identically to category picker (`selectButton` style)
  - Unselected state: gray dot (#94A3B8) + "None"
  - Selected state: colored dot (source.colorHex) + source name
  - Dropdown: "None" option at top, all money sources with colored dots below
  - Reuses all existing styles: `selectButton`, `dropdown`, `dropdownItem`, `dropdownItemActive`, `dropdownItemText`, `colorDot`
- **New computed:** `selectedMoneySource` — looked up from `moneySources` by `moneySourceId`

### ExpenseCard (`src/components/ExpenseCard.tsx` — 33 insertions, 2 deletions)

- **New import:** `useExpenseStore` from `@/stores/expenseStore`
- **New store selector:** `moneySources`
- **New lookup:** `moneySource` derived from `expense.moneySourceId` with null guard
- **New conditional render:** When `moneySource` exists, shows:
  - `sourceRow` (flexDirection row, alignItems center, gap 4, marginTop 2)
  - `sourceDot` (6px × 6px circle, `moneySource.colorHex` background)
  - `sourceName` (11px, fontWeight 400, color #64748B, flexShrink 1, numberOfLines={1})
- **Card height:** Changed from `height: 108` to `minHeight: 108` to accommodate indicator
- **No indicator** when `moneySourceId` is null (all pre-Phase 7 expenses)

### Expenses Screen (`src/app/(expenses)/index.tsx` — 23 insertions, 35 deletions)

- **Import changes:**
  - Removed: `BalanceCard` from `@/components/BalanceCard`
  - Added: `MoneySourceRow` from `@/components/MoneySourceRow`
  - Added: `TotalBalanceSummary` from `@/components/TotalBalanceSummary`
- **New state:** `selectedMoneySourceId` (string | null)
- **New `ListHeader` component:** Combines `<TotalBalanceSummary />` + `<MoneySourceRow onSelectSource={...} />` in a wrapping `<View>`
- **FlatList:** `ListHeaderComponent={<BalanceCard />}` → `ListHeaderComponent={<ListHeader />}`
- **Empty state:** `<BalanceCard />` → `<TotalBalanceSummary />` + `<MoneySourceRow onSelectSource={...} />`
- **Context pre-selection (D-10):**
  - Money source card tap → `setSelectedMoneySourceId(source.id)`
  - Passed as `preselectedMoneySourceId={selectedMoneySourceId}` to ExpenseForm
  - Reset to `null` when form closes (`onClose`)
  - FAB preserves pre-selection (simply calls `openAddForm()`)
  - Category card tap preserves pre-selection (doesn't reset)

## Verification

- **TypeScript compilation:** Modified files compile with zero errors (pre-existing OCR test errors unchanged)
- **Test suite:** 23 tests across 3 test files pass
  - ExpenseForm-money-source: 9/9 (picker label, styling, unselected/selected states, dropdown, None selection, source selection, pre-selection, handleSave)
  - ExpenseCard-money-source: 6/6 (indicator render, no indicator on null, dot color, truncation, text styling, card layout)
  - Expenses screen: 8/8 (BalanceCard removal, MoneySourceRow + TotalBalanceSummary in header, pre-selection via card tap, FAB preservation, category card passes pre-selection, empty state components, BalanceCard absence)
- **No regressions:** Existing passing tests continue to pass
- **No deletions:** BalanceCard.tsx preserved in codebase
- **No untracked files**

## Self-Check

- [x] `src/components/ExpenseForm.tsx` modified (54 insertions, 3 deletions)
- [x] `src/components/ExpenseCard.tsx` modified (33 insertions, 2 deletions)
- [x] `src/app/(expenses)/index.tsx` modified (23 insertions, 35 deletions)
- [x] `src/__tests__/ExpenseForm-money-source.test.tsx` created (9 passing tests)
- [x] `src/__tests__/ExpenseCard-money-source.test.tsx` created (6 passing tests)
- [x] `src/__tests__/expenses-screen-money-source.test.tsx` created (8 passing tests)
- [x] 6 commits in git log (3 RED + 3 GREEN)
- [x] No STATE.md or ROADMAP.md modifications
- [x] SUMMARY.md written

## Self-Check: PASSED
