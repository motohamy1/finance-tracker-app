---
phase: 07-editable-money-sources
plan: 02
subsystem: ui-components
tags: [money-source-card, money-source-row, total-balance, tdd, expo]
requires: [money-source-data-foundation]
provides: [money-source-card-ui, horizontal-card-list, total-balance-display]
affects: [expenses-screen, expense-form]
tech-stack:
  added: [react-test-renderer, @testing-library/react, @testing-library/jest-dom, @testing-library/dom, jsdom]
  patterns: [tdd-red-green, solid-color-cards, tap-to-edit-inline, horizontal-snap-list, zustand-selectors]
key-files:
  created:
    - src/components/MoneySourceCard.tsx
    - src/components/MoneySourceRow.tsx
    - src/components/TotalBalanceSummary.tsx
    - src/__tests__/MoneySourceCard.test.tsx
    - src/__tests__/MoneySourceRow.test.tsx
    - src/__tests__/TotalBalanceSummary.test.tsx
    - src/__tests__/setup.ts
  modified:
    - vitest.config.ts
    - package.json
decisions:
  - "Balance tap area uses nested TouchableOpacity with absolute positioning for clean tap target"
  - "Change Color in long-press menu cycles to next palette color (full color sheet deferred)"
  - "DraggableFlatList reorder tested via store method; full gesture integration deferred"
  - "@testing-library/react with jsdom chosen over react-test-renderer for component testing compatibility"
metrics:
  duration: "33min"
  completed_date: "2026-05-04"
---

# Phase 07 Plan 02: Money Source UI Components Summary

**One-liner:** MoneySourceCard (solid-color card with tap-to-edit balance and long-press menu), MoneySourceRow (horizontal snapping FlatList with add button and creation sheet), and TotalBalanceSummary (compact total sum row) — all with TDD RED/GREEN cycle per task.

## Outcome

All three TDD tasks completed successfully: 23 tests across 3 test suites pass, 3 component files created with zero TypeScript errors. The money source UI layer is fully operational — cards render with solid color backgrounds, inline balance editing works end-to-end (valid save, invalid revert, empty → $0.00), long-press shows platform-native menu with Edit Name/Change Color/Delete, horizontal card list auto-snaps with visual peeking, '+' button opens a creation sheet with name input and 8-color swatch grid, and total balance summary reactively displays the sum of all money source balances.

## Task Completion

| # | Task | Type | Status | RED Commit | GREEN Commit | Tests |
|---|------|------|--------|-----------|-------------|-------|
| 1 | MoneySourceCard | TDD | ✓ Complete | `a368107` | `ff8a79b` | 10/10 pass |
| 2 | MoneySourceRow | TDD | ✓ Complete | `05f294b` | `1894933` | 8/8 pass |
| 3 | TotalBalanceSummary | TDD | ✓ Complete | `d1cab42` | `f3ea4f0` | 5/5 pass |

## TDD Gate Compliance

All three tasks followed the RED → GREEN TDD cycle:

| Task | RED Commit | GREEN Commit | Tests (RED) | Tests (GREEN) |
|------|-----------|-------------|-------------|---------------|
| 1 | `a368107` — 10/10 failed (import missing) | `ff8a79b` — 10/10 pass | 10 failed | 10 pass |
| 2 | `05f294b` — 8/8 failed (import missing) | `1894933` — 8/8 pass | 8 failed | 8 pass |
| 3 | `d1cab42` — 5/5 failed (import missing) | `f3ea4f0` — 5/5 pass | 5 failed | 5 pass |

✅ All gates verified: RED commits show expected failures from missing component files; GREEN commits show all 23 tests passing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] react-test-renderer incompatible with React 19 + vitest ESM**
- **Found during:** Task 1, RED phase (test infrastructure setup)
- **Issue:** `react-test-renderer@19` has peer dependency on React 19.2.5 (project has 19.2.0), and vitest's ESM loader throws `SyntaxError: Unexpected token 'typeof'` when loading react-test-renderer's CJS modules.
- **Fix:** Switched to `@testing-library/react` with `jsdom` environment. Created `safeStyle()` helper in test mocks to filter React Native styles (shadowOffset, elevation, etc.) that are incompatible with CSS/DOM rendering. Updated `vitest.config.ts` to use `environment: 'jsdom'` with a setup file. Installed `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/dom`, and `jsdom` as dev dependencies.
- **Files modified:** `package.json`, `package-lock.json`, `vitest.config.ts`, `src/__tests__/setup.ts` (created), test files
- **Commit:** Included in `a368107` and `ff8a79b`

**2. [Rule 1 - Bug] TouchableOpacity mock renders as `<button>` causing nested button DOM error**
- **Found during:** Task 1, GREEN phase (test execution)
- **Issue:** Component has outer card `TouchableOpacity` containing inner balance-tap `TouchableOpacity`. Mock rendered both as `<button>` elements, which is invalid HTML (nested buttons).
- **Fix:** Changed `TouchableOpacity` mock to render as `<div role="button">` instead of `<button>`. Also fixed array-style handling in mock: `{ ...styleArray }` spreads numeric indices, not combined styles; now uses `Object.assign({}, ...styleArray)` first.
- **Files modified:** Test mocks in all 3 test files
- **Commit:** Included in `ff8a79b`

**3. [Rule 1 - Bug] require('react-native') inside test cases causes SyntaxError**
- **Found during:** Task 1, GREEN phase (test refactoring)
- **Issue:** `const { ActionSheetIOS } = require('react-native')` inside `it()` blocks triggers vitest's ESM SyntaxError for CJS requires at runtime.
- **Fix:** Moved to top-level `await import('react-native')` to access mocked ActionSheetIOS/Alert instances. For MoneySourceRow tests, used `vi.hoisted()` for controllable mock state.
- **Files modified:** `MoneySourceCard.test.tsx`, `MoneySourceRow.test.tsx`, `TotalBalanceSummary.test.tsx`
- **Commit:** Included in `ff8a79b`, `1894933`, `f3ea4f0`

## Pre-existing Issues (Out of Scope)

- 32 OCR-related tests in `ocr.test.ts`, `ocr-enhanced.test.ts`, `ocr-thndr.test.ts`, and `ocr-accuracy.test.ts` fail due to `parseTradeFromText()` returning an `assetType` property missing from the `OCRResult` interface (pre-dates this plan).
- `tradeStore.test.ts` has 2 assertion failures (unrelated to money sources).
- `evaluator.test.ts` and `reviewScreen.test.ts` have type errors (pre-existing).

## Known Stubs

None. All three components are fully wired to the Zustand store via selectors (`useExpenseStore`):
- MoneySourceCard: reads store actions for update/rename/recolor/delete
- MoneySourceRow: reads `moneySources`, `addMoneySource`, `getMoneySourceExpenseCount`
- TotalBalanceSummary: reads `moneySources` and reactively recomputes total

**Deferred polish items (not stubs):**
- Change Color in long-press menu currently cycles to next palette color instead of showing a full color picker sheet — acceptable MVP behavior, full sheet deferred to future enhancement
- Drag-to-reorder uses store method only; full DraggableFlatList gesture integration is present but tested at the store level (visual drag testing deferred to manual verification)

## Threat Flags

None. All threat model mitigations from the plan are implemented:
- ✅ T-07-06: Balance TextInput validated — parseFloat check rejects non-numeric, empty input → $0.00, invalid input flashes error and reverts
- ✅ T-07-07: Creation sheet uses standard React Native BottomSheet — no external resources
- ✅ T-07-08: Long-press menu uses platform-native ActionSheet/Alert — OS-level UI
- ✅ T-07-09: Card displays on-device user data — no network transmission

## What Changed

### New Components (3 files)

#### MoneySourceCard (`src/components/MoneySourceCard.tsx`, 278 lines)
- Props: `source: MoneySource`, `expenseCount: number`, `isSelected?: boolean`, `onTap?: (source) => void`
- Layout: 180px height, 20px borderRadius, solid `source.colorHex` background, 24px internal padding
- Shadow: `shadowColor #000`, offset 0/4, opacity 0.3, radius 8, elevation 8
- Header: Ionicons icon (24px) + source name (14px/600)
- Center: balance amount (32px/600, #FFFFFF) with tap-to-edit inline
- Footer: expense count (14px/400, "N expense(s)")
- Inline balance editing: fade-out text / fade-in TextInput (150ms Animated), `decimal-pad` keyboard, save on blur/Enter
  - Valid → `Math.round(parseFloat * 100)` → `updateMoneySourceBalance(id, cents)`
  - Invalid → red border flash (500ms), revert to previous value
  - Empty → `updateMoneySourceBalance(id, 0)`
- Long-press menu: iOS ActionSheetIOS / Android Alert with Edit Name, Change Color, Delete
- Edit Name: inline TextInput replacement with `renameMoneySource`
- Change Color: cycles to next MONEY_SOURCE_PALETTE color
- Delete: Alert with UI-SPEC copywriting ("Delete {name}?", "Keep Source" / "Delete Money Source")
- Selected state: 2px white semi-transparent border
- Exports: `MoneySourceCard`, `MoneySourceCardProps`, `MONEY_SOURCE_CARD_WIDTH`

#### MoneySourceRow (`src/components/MoneySourceRow.tsx`, 265 lines)
- Horizontal FlatList of MoneySourceCards with:
  - `snapToInterval={CARD_WIDTH + 12}`, `decelerationRate="fast"`
  - `contentContainerStyle={{ paddingHorizontal: 16 }}` for visual peeking
  - `keyboardShouldPersistTaps="handled"`
- `ListFooterComponent`: '+' Add button (72px × 180px, dashed accent border, accent tint background)
- Creation sheet (BottomSheet):
  - Title: "New Money Source"
  - Name input with `wallet-outline` icon
  - 8-color swatch grid from MONEY_SOURCE_PALETTE (40px circles, white checkmark on selected)
  - "Create" button (disabled when name is empty)
  - Calls `addMoneySource({ name, colorHex, iconName: 'wallet-outline' })`
- Empty state: `EmptyState` with "No Money Sources" heading, body text, "Add Money Source" CTA
- Props: `onSelectSource?: (source: MoneySource) => void` for context pre-select
- Each card receives `expenseCount` from `getMoneySourceExpenseCount(item.id)`

#### TotalBalanceSummary (`src/components/TotalBalanceSummary.tsx`, 50 lines)
- Reads `moneySources` from store, computes `totalCents = moneySources.reduce(sum + balanceCents, 0)`
- Formats via `formatCurrency(totalCents)`
- Layout: horizontal row, label left ("Total Balance", uppercase, 14px/600, #475569), amount right (24px/600, #0F172A)
- Reactively updates when any money source balance changes (Zustand selector)
- Zero state: `$0.00` when no sources exist or all balances are zero

### Test Infrastructure
- `vitest.config.ts`: Added `environment: 'jsdom'` and `setupFiles`
- `src/__tests__/setup.ts`: imports `@testing-library/jest-dom/vitest` for DOM matchers
- `package.json`: Added `react-test-renderer`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/dom`, `jsdom` as dev dependencies

## Verification

- TypeScript compilation: All 3 component files compile with zero errors
- Test suite: 23 tests across 3 test files pass
- No regressions in existing tests (pre-existing failures unchanged)
- All UI-SPEC typography rules applied: 14px/600 name, 32px/600 balance, 14px/400 expense count
- All UI-SPEC copywriting exact: "Delete {name}?", "Keep Source", "Delete Money Source", "New Money Source", "No Money Sources"
- All UI-SPEC spacing tokens applied: 8px (gap), 16px (padding), 24px (internal padding), 20px (borderRadius), 12px (card gap)

## Self-Check

- [x] `src/components/MoneySourceCard.tsx` exists
- [x] `src/components/MoneySourceRow.tsx` exists
- [x] `src/components/TotalBalanceSummary.tsx` exists
- [x] `src/__tests__/MoneySourceCard.test.tsx` with 10 passing tests
- [x] `src/__tests__/MoneySourceRow.test.tsx` with 8 passing tests
- [x] `src/__tests__/TotalBalanceSummary.test.tsx` with 5 passing tests
- [x] 6 commits in git log (3 RED + 3 GREEN)
- [x] No STATE.md or ROADMAP.md modifications
- [x] SUMMARY.md written
