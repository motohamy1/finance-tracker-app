---
phase: 03-investment-analytics
plan: 03
status: complete
completed: 2026-05-02
---
# Summary: History & Filtering

**One-liner:** Added three-axis filtering (ticker chips, buy/sell toggle, date range), P&L badges on trade cards, and grouped FIFO pair view toggleable via ticker chip selection.

**Files changed/created:**
- `src/components/TickerChips.tsx` — Created: horizontal chip list with selection
- `src/components/TradeFilterSheet.tsx` — Created: bottom sheet with direction toggle, date range, search
- `src/components/PnLPairCard.tsx` — Created: compact pair summary with expandable details
- `src/components/TradeCard.tsx` — Added optional P&L badge
- `src/app/(investments)/index.tsx` — Full rewrite: filter state, grouped/pair view toggle, P&L computation
