---
phase: 06-investment-page-concept
plan: 03
status: complete
depends_on:
  - 06-01
  - 06-02
files_created:
  - src/components/BottomSheet.tsx
  - src/components/CategoryChips.tsx
files_modified:
  - src/app/(investments)/index.tsx
  - src/components/TradeCard.tsx
---

# 06-03: UI Integration — BottomSheet, CategoryChips, Investments Screen Overhaul

## What was built

Overhauled the investment page integrating all Phase 6 components: BottomSheet replacing Alert FAB, CategoryChips for category filtering, TickerSummaryCard display, inline CategorySummaryCard, and PnL Multiplier badges on TradeCard.

### Changes

1. **BottomSheet** (`src/components/BottomSheet.tsx`): Reusable animated bottom sheet using reanimated (slide-up + backdrop). Accepts `visible`, `onClose`, `title`, and `children` props. Used for FAB action sheet (D-04).
2. **CategoryChips** (`src/components/CategoryChips.tsx`): Horizontal scrollable chip row following TickerChips pattern. Shows "All" + category chips with trade counts. Supports toggle behavior (D-09).
3. **Investments screen** (`src/app/(investments)/index.tsx`):
   - Replaced `Alert.alert` FAB with BottomSheet showing "Manual Entry" and "Scan Screenshot (OCR)" as equally prominent options (D-04, D-05, D-06)
   - Added `selectedCategory` state and category-aware filtering for both trades and PnL pairs
   - Added CategoryChips in the filter bar below TickerChips
   - Added conditional TickerSummaryCard when a ticker is selected (D-01, D-02, D-03)
   - Added inline CategorySummaryCard when a category (but no ticker) is selected
   - Updated renderItem to compute and pass PnL multiplier to TradeCard (D-02)
4. **TradeCard** (`src/components/TradeCard.tsx`): Added optional `pnlMultiplier` prop with green/red badge showing percentage (e.g., "+24.5%")

### Self-Check: PASSED

- TypeScript compiles with 0 errors
- All D-04 through D-09 decisions addressed
- Existing functionality preserved (PortfolioHeader, ticker filtering, direction/date/search filters, PnLPairCard grouped view)
- Pre-existing test failures unchanged (OCR tests, tradeStore mock — unrelated)
