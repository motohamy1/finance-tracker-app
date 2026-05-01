---
phase: 02-ocr-pipeline
plan: 04
subsystem: investments-screens
tags: [review, manual-entry, trade-form, validation, tdd]
requires: [tradeStore, tradeValidation, OCRResult types]
provides: [reviewScreen, manualEntryScreen]
affects: [investments-tab, investment-workflow]
tech-stack:
  added: []
  patterns:
    - "Card preview layout with inline editing (D-20)"
    - "Pure utility functions for shared validation logic"
    - "Direction toggle with visual buy/sell states"
key-files:
  created:
    - "src/app/(investments)/review.tsx"
    - "src/app/(investments)/manual.tsx"
    - "src/utils/tradeValidation.ts"
    - "src/__tests__/reviewScreen.test.ts"
  modified: []
decisions:
  - "Extracted trade validation logic to shared src/utils/tradeValidation.ts for reuse across review and manual screens"
  - "Review screen uses FieldState record for per-field editing/error state; manual screen uses simpler individual useState hooks"
  - "TDD approach: 28 tests covering OCR parsing, validation, missing-field detection, display formatting, and can-save logic"
metrics:
  duration: "~10 min"
  completed-date: "2026-05-01"
---

# Phase 2 Plan 4: Review & Manual Trade Entry Summary

**One-liner:** Card-preview review/edit screen with inline field editing, OCR confidence display, and validation; standalone manual trade entry form — both persisting validated trades via tradeStore.

## Tasks Completed

| # | Type | Name | Commit | Files |
|---|------|------|--------|-------|
| 1 | TDD (RED) | Add failing tests for review screen validation/OCR utilities | `7701f8a` | `src/__tests__/reviewScreen.test.ts` |
| 1 | TDD (GREEN) | Implement review/edit screen with tradeValidation utilities | `e7e5e8c` | `src/app/(investments)/review.tsx`, `src/utils/tradeValidation.ts` |
| 2 | auto | Create manual trade entry screen | `858913a` | `src/app/(investments)/manual.tsx` |

## What Was Built

### Review/Edit Screen (`review.tsx`)
- **Card preview layout** per D-20: all 7 trade fields displayed in a styled card
- **Inline editing**: tap any field → editable TextInput; taps off → save value
- **OCR confidence indicator**: green checkmark for ≥75% confidence, amber warning otherwise
- **Partial extraction warnings** per D-26: amber background + "Not detected — please verify" on OCR-missing fields
- **Screenshot preview**: 180px rounded image above the card when `imageUri` param present
- **Validation** per D-22: ticker (1-5 letters), shares (positive int), price (required), date (required), direction (required). Fees and notes optional
- **Save disabled** until all required fields valid and error-free
- **Discard confirmation** per D-23: Alert dialog "Discard this trade?" with Keep Editing/Discard options
- **Edit existing trade**: loads trade data when `tradeId` param present, calls `editTrade` on save
- **Malformed OCR handling** per T-02-09: JSON.parse wrapped in try/catch, falls back to empty fields
- **Input sanitization** per T-02-10: ticker auto-uppercase, shares digits-only, price digits-only
- Direction toggle: green Buy / red Sell with icon indicators per D-16

### Manual Entry Screen (`manual.tsx`)
- **Full trade form** per D-28: all 7 fields with empty initial values, no screenshot required
- **Validation**: same `validateTradeFields` utility as review screen
- **Save button**: disabled until required fields valid
- **Close button**: X icon in header, returns to trade list
- **KeyboardAvoidingView** wrapping for iOS keyboard handling
- Direction toggle with buy/sell visual states (green/red)

### Trade Validation Utilities (`tradeValidation.ts`)
- `parseOCRToInitialValues()`: Converts OCRResult → TradeFormData (price dollars→cents, defaults for nulls)
- `validateTradeFields()`: Returns error map for required fields
- `isMissingFromOCR()`: Detects fields OCR failed to extract
- `formatTradeFieldDisplay()`: Formats values for display (currency, shares suffix, uppercase)
- `canSaveTrade()`: Determines if all required fields are non-empty and error-free

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Zero errors |
| `npx vitest run` | ✅ 82 tests pass (6 files, 0 failures) |
| `useTradeStore` in review.tsx | ✅ 4 matches |
| `useTradeStore` in manual.tsx | ✅ 2 matches |
| `addTrade` in review.tsx | ✅ 3 matches |
| `addTrade` in manual.tsx | ✅ 3 matches |
| `Discard this trade` in review.tsx | ✅ 1 match |
| `Save Trade` in review.tsx | ✅ 1 match |
| `Save Trade` in manual.tsx | ✅ 1 match |

## Deviations from Plan

None — plan executed exactly as written. One adjustment: extracted trade validation logic to `src/utils/tradeValidation.ts` as pure functions rather than keeping all logic inline, enabling shared use across both screens and comprehensive TDD coverage.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | `7701f8a` — `test(02-ocr-pipeline): add failing tests for review screen (RED)` | ✅ 28 tests, all failed (module not found) |
| GREEN | `e7e5e8c` — `feat(02-ocr-pipeline): implement review/edit screen (GREEN)` | ✅ All 28 tests pass; full suite green |
| REFACTOR | N/A | ✅ No refactor needed — clean implementation on first pass |

## Threat Model Coverage

All three mitigations from the plan's threat register were implemented:

| Threat ID | Mitigation | Location |
|-----------|------------|----------|
| T-02-09 | JSON.parse wrapped in try/catch; malformed data falls back to empty fields | `review.tsx` line ~43 |
| T-02-10 | Input sanitization: ticker uppercase, shares digits-only, price digits-only before store call | `review.tsx` lines ~189, ~198, ~220; `manual.tsx` lines ~98, ~109 |
| T-02-11 | Alert.alert requires explicit "Discard" tap before navigation | `review.tsx` line ~149 |

## Self-Check: PASSED

- ✅ `src/app/(investments)/review.tsx` exists
- ✅ `src/app/(investments)/manual.tsx` exists
- ✅ `src/utils/tradeValidation.ts` exists
- ✅ `src/__tests__/reviewScreen.test.ts` exists
- ✅ Commit `7701f8a` exists (RED)
- ✅ Commit `e7e5e8c` exists (GREEN)
- ✅ Commit `858913a` exists (Task 2)
- ✅ TypeScript compiles with zero errors
- ✅ All 82 tests pass
