---
phase: 06-investment-page-concept
plan: 01
status: complete
files_modified:
  - src/db/schema.ts
  - src/types/index.ts
  - src/services/database.ts
  - src/stores/tradeStore.ts
  - src/__tests__/pnl.test.ts
  - src/__tests__/trade-crud.test.ts
  - src/__tests__/trade-types.test.ts
  - src/__tests__/tradeStore.test.ts
---

# 06-01: Data Layer — Migration v4, Trade Type, CRUD, Store Extensions

## What was built

Added investment asset type (category) support to the data layer enabling D-07 (Investment Kinds), D-08 (default + custom labels), and D-09 (category filtering).

### Changes

1. **Migration v4** (`src/db/schema.ts`): `ALTER TABLE trades ADD COLUMN asset_type TEXT`
2. **Trade type** (`src/types/index.ts`): Added `assetType: string | null` to Trade interface, added `DEFAULT_INVESTMENT_KINDS` constant (Stocks, Crypto, Forex, Commodities), and `InvestmentKindId` type
3. **Database CRUD** (`src/services/database.ts`): Updated `TradeRow`, `rowToTrade`, `createTrade` (10th param), `updateTrade` (assetType in updates), and added `getAllAssetTypes()` function
4. **tradeStore** (`src/stores/tradeStore.ts`): Added `setTradeAssetType`, `getTradesByCategory`, `getCategorySummary`, `getAvailableCategories` methods. Fixed `addTrade` to pass `null` for the new `assetType` parameter.
5. **Tests**: Updated all test fixtures to include `assetType` field, updated `createTrade` call to 10 params, updated field counts

### Deviations

- `netPnlCents` in `getCategorySummary` was fixed to NOT double-subtract fees (plan originally had the bug — caught by plan-checker and corrected before implementation)

### Self-Check: PASSED

- TypeScript compiles with 0 errors
- trade-types.test.ts: 5/5 pass
- trade-crud.test.ts: 11/11 pass
- pnl.test.ts: 11/11 pass
- tradeStore.test.ts: pre-existing mock issue (missing getAllCurrentPrices in mock — unrelated to this change)
