# Phase 6: Investment Page Concept - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure the core concept of the investment page/section is solid. Show gain or loss of investments by comparing buying and selling. Data can be entered manually or via screenshots; the purpose is the priority.

</domain>

<decisions>
## Implementation Decisions

### Investment Performance Visualization
- **D-01 (Ticker Summary):** When a ticker is selected (filtered), display a dedicated summary card showing Total Invested (Cost Basis), Total Realized (Proceeds), and Net P&L.
- **D-02 (PnL Multiplier):** Use a "PnL Multiplier" badge or pill (e.g., "+24%" or "1.5x") as the primary visual indicator of success for both individual trades and overall asset performance.
- **D-03 (Comparison Anchor):** The UI must explicitly anchor on the "Buy vs Sell" comparison to fulfill the "purpose" of the page.

### Entry Flow & UX
- **D-04 (Quick Action Sheet):** Replace the existing `Alert` for the Floating Action Button (FAB) with a custom **Bottom Sheet**.
- **D-05 (Entry Options):** The bottom sheet will provide clear, equally prominent buttons for "Manual Entry" and "Scan Screenshot (OCR)".
- **D-06 (First-Class Manual Entry):** Manual entry is elevated from an "edge case" to a core feature.

### Asset Categorization
- **D-07 (Investment Kinds):** Support grouping trades by "Investment Kind" (Categories).
- **D-08 (Default & Custom Labels):** Include standard defaults (Stocks, Crypto, Forex, Commodities) while allowing users to create their own custom category labels.
- **D-09 (Category Filtering):** Add the ability to filter the investment list by these categories, not just by ticker.

### the agent's Discretion
- Exact layout of the Ticker Summary card.
- Animation style for the new Bottom Sheet.
- Iconography for different asset types.

</decisions>

<specifics>
## Specific Ideas

- "No matter the method (OCR vs Manual), the purpose is the important" — the app should focus on the financial outcome.
- When filtering by a category (e.g., "Crypto"), show a consolidated P&L for that entire group.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Specs
- `.planning/REQUIREMENTS.md` §INV-07 — Requirement for manual trade entry.
- `.planning/ROADMAP.md` §Phase 6 — Definition of the "Investment Page Concept" phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/tradeStore.ts`: Use `calculatePnLPairs` and `calculateHoldings` to derive the multiplier and summary data.
- `src/components/PnLPairCard.tsx`: Reusable for showing the "Buy → Sell" details.
- `src/components/TickerChips.tsx`: Expand to support Category chips or a mixed filtering strategy.

### Established Patterns
- **Zustand for State:** Continue using `tradeStore` for all investment logic.
- **Expo Router:** Use file-based routing for manual entry and review screens.
- **FlatList (Horizontal):** Use for category or ticker chips.

### Integration Points
- `src/app/(investments)/index.tsx`: The primary surface for the new summary cards and bottom sheet.
- `src/db/schema.ts`: Will likely need a new `category` or `asset_type` column in the `trades` table.

</code_context>

<deferred>
## Deferred Ideas

- **Advanced Charting:** Candlestick or line charts for price history (v2).
- **Multiple Portfolios:** Support for separate portfolios (e.g., Retirement vs Speculative) (v2).

</deferred>

---

*Phase: 06-investment-page-concept*
*Context gathered: 2026-05-04*
