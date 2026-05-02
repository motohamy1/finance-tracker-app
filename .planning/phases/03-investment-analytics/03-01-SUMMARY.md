---
phase: 03-investment-analytics
plan: 01
status: complete
completed: 2026-05-02
---
# Summary: Data & Logic

**One-liner:** Implemented FIFO P&L engine, migration v3 for current prices, portfolio types, and extended tradeStore with price management and computed analytics.

**Files changed/created:**
- `src/db/schema.ts` — Added migration v3 (current_prices table)
- `src/types/index.ts` — Added PnLPair, Holding, PortfolioSummary, CurrentPrice types
- `src/services/database.ts` — Added upsertCurrentPrice, getAllCurrentPrices
- `src/services/pnl.ts` — Created: calculatePnLPairs (FIFO), calculateHoldings
- `src/stores/tradeStore.ts` — Extended: currentPrices state, updateCurrentPrice, bulkUpdatePrices, getPnLPairs, getHoldings, getPortfolioSummary
- `src/__tests__/pnl.test.ts` — 11 tests covering FIFO matching, fees, holdings, edge cases
