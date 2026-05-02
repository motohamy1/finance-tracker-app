# Phase 3: Investment Analytics - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

P&L calculations via FIFO trade pairing, portfolio overview showing current holdings with unrealized P&L, and filterable trade history. Everything built on the trade data flowing through Phase 2's OCR pipeline. Does NOT include market data APIs, real-time prices, or automated price fetching.
</domain>

<decisions>
## Implementation Decisions

### Portfolio Layout
- **D-01:** Collapsible header at top of the Investments trade list — reuses the animated collapse pattern from expense categories
- **D-02:** Summary stats (total realized + unrealized P&L) plus per-ticker breakdown with cost basis, current quantity, and per-ticker unrealized P&L
- **D-03:** Open by default — user sees portfolio overview first, can collapse to focus on trade list
- **D-04:** Green/red color for gains/losses with subtle background tint on holding cards (light green for profitable, light red for losing)

### Current Price Entry
- **D-05:** Both inline (tap a holding to edit price) and bulk form ("Update Prices" button opens all tickers at once)
- **D-06:** Prices persist to SQLite and survive app restart
- **D-07:** Show last-updated date next to each holding (e.g., "Updated Apr 28")
- **D-08:** Stale price warning: if price hasn't been updated in 7+ days, show subtle indicator (yellow dot or faded text)

### Trade History & Filtering
- **D-09:** Horizontal ticker chips + search bar for filtering — chips for quick switching, search to type any ticker
- **D-10:** Three-axis filtering: buy/sell/all toggle, date range picker, ticker selection
- **D-11:** Bottom sheet for filter controls — filter icon in header opens filter sheet
- **D-12:** Realized P&L badge on individual trade cards when a trade has been paired

### P&L Pair Display
- **D-13:** Grouped per-ticker pair view — tapping a ticker chip switches from flat list to grouped FIFO pairs for that ticker
- **D-14:** Compact summary line per pair ("Bought 10 @ $150 → Sold 10 @ $185 = +$350") with tap to expand full detail (dates, fees breakdown)
- **D-15:** Fees included in P&L: P&L = (sell price - buy price) × shares - total fees (buy + sell fees)
- **D-16:** FIFO matching: earliest open buy trades are paired first with subsequent sells for the same ticker

### the agent's Discretion
- Exact animation parameters for the collapsible portfolio header (duration, easing)
- Exact stale indicator design (dot size, color, position)
- Bottom sheet filter UI layout and transitions
- Per-ticker holding card design (typography, spacing, tint opacity)
- Pair compact line text formatting
- Current price form design and validation
</decisions>

<specifics>
## Specific Ideas

- Portfolio header should feel like a "dashboard card" — glanceable and informative
- Holding cards should visually communicate position health at a glance via background tint
- Filtering should feel fast and responsive — chips + search bar pattern from modern trading apps
- P&L pairs should tell a clear story: what was bought, when sold, and what was earned/lost
</specifics>

<canonical_refs>
## Canonical References

### Project Requirements
- `.planning/PROJECT.md` — Project constraints (local-first, no real-time stock prices), core value
- `.planning/REQUIREMENTS.md` — INV-04 (P&L per trade pair via FIFO), INV-05 (portfolio overview)
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, dependency graph

### Prior Phase Context
- `.planning/phases/01-shell-expense-tracker/01-CONTEXT.md` — Collapsible header pattern, Zustand stores, cents storage, FlatList patterns
- `.planning/phases/02-ocr-pipeline/02-CONTEXT.md` — Trade types (Trade, TradeFormData), tradeStore, database service, import/review flow, TradeCard component

### Source Code (key files for planning)
- `src/stores/tradeStore.ts` — Zustand trade store (CRUD, initialization)
- `src/services/database.ts` — Trade CRUD operations, row mappers (snake_case → camelCase)
- `src/types/index.ts` — Trade, TradeFormData, TradeDirection types; financial values as cents
- `src/app/(investments)/index.tsx` — Trade list with FlatList, TradeCard, FAB, empty state
- `src/app/(investments)/_layout.tsx` — Stack navigator with import/review/manual screens
- `src/components/TradeCard.tsx` — Existing trade card component (card design, pattern)
- `src/db/schema.ts` — SQLite schema and migration patterns
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **tradeStore** (`src/stores/tradeStore.ts`): Zustand store with full trade CRUD — extend with P&L calculations and filtered queries
- **Collapsible header pattern** (Phase 1 CategoryRow): Animated expand/collapse with reanimated — reuse for portfolio header
- **TradeCard** (`src/components/TradeCard.tsx`): Existing card design — extend with P&L badge
- **Database service** (`src/services/database.ts`): Row mapper pattern, migration system — add current_prices table
- **Bottom sheet pattern** (Phase 1 ExpenseForm): Bottom sheet UX — reuse for filter controls
- **EmptyState** (`src/components/EmptyState.tsx`): Reusable empty state component

### Established Patterns
- Zustand stores separated by domain
- expo-sqlite with incrementing migration versions
- Financial values stored as integers (cents)
- FlatList with proper virtualization
- react-native-reanimated for animations
- Expo Router Stack navigator for drill-down screens

### Integration Points
- Investments tab: `src/app/(investments)/index.tsx` — add portfolio header + filters + ticker chips
- Database: `src/db/schema.ts` — add migration for current_prices table
- Trade store: `src/stores/tradeStore.ts` — add P&L computation, filtered queries, current price management
- New service: `src/services/pnl.ts` — FIFO pairing, realized/unrealized P&L calculations
- New types: extend `src/types/index.ts` with Holding, PnLPair, PortfolioSummary types
</code_context>

<deferred>
## Deferred Ideas

- Real-time stock price feeds from market data API — out of scope (paid API, PROJECT.md constraint)
- Multi-currency support for international portfolios — out of scope (USD-only for v1)
- Tax-loss harvesting analysis — out of scope
- Export P&L to CSV/PDF — deferred to EXP-07
</deferred>

---

*Phase: 03-investment-analytics*
*Context gathered: 2026-05-02*
