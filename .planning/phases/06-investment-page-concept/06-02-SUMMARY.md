---
phase: 06-investment-page-concept
plan: 02
status: complete
depends_on:
  - 06-01
files_created:
  - src/components/TickerSummaryCard.tsx
files_modified:
  - src/stores/tradeStore.ts
---

# 06-02: TickerSummaryCard + getSummaryByTicker

## What was built

Created the Ticker Summary Card — the centerpiece of the investment page — covering D-01 (summary card), D-02 (PnL Multiplier badge), and D-03 (Buy vs Sell comparison anchor).

### Changes

1. **getSummaryByTicker** (`src/stores/tradeStore.ts`): New store method that computes per-ticker P&L: total invested, total realized, net P&L, PnL multiplier/percent, buy/sell counts, pair count, and buy/sell volumes
2. **TickerSummaryCard** (`src/components/TickerSummaryCard.tsx`): New component displaying:
   - Header with ticker name + PnL Multiplier badge (color-coded green/red/gray)
   - Three-column metrics row (Total Invested, Net P&L, PnL Multiplier)
   - Buy vs Sell comparison side-by-side with arrow
   - Trade count chips
   - Edge cases: no data, buys-only, sells-only

### Deviations

- `netPnlCents` fixed to NOT double-subtract fees (plan had bug — `calculatePnLPairs` already deducts fees from `realizedPnlCents`). Caught by plan-checker and corrected.

### Self-Check: PASSED

- TypeScript compiles with 0 errors
- Component file exists at `src/components/TickerSummaryCard.tsx`
- All D-01/D-02/D-03 decisions addressed
