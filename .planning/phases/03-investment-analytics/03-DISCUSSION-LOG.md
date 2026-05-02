# Phase 3: Investment Analytics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 03-investment-analytics
**Areas discussed:** Portfolio layout, Current price entry, Trade history & filtering, P&L pair display

---

## Portfolio Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard on trade list | P&L summary cards above existing FlatList | |
| Dedicated analytics tab | Separate screen from trade list | |
| Collapsible header | Collapsible summary section at top of trade list | ✓ |

**User's choice:** Collapsible header — reuses expense category collapse pattern

---

| Option | Description | Selected |
|--------|-------------|----------|
| Summary stats only | Total realized + unrealized P&L as two big numbers | |
| Summary + per-ticker detail | Stats + ticker breakdown with cost basis, qty, per-ticker P&L | ✓ |
| Full dashboard | Overall P&L, holdings, recent trades, win/loss ratio | |

**User's choice:** Summary stats + per-ticker detail

---

| Option | Description | Selected |
|--------|-------------|----------|
| Open by default | Portfolio visible first, can collapse | ✓ |
| Collapsed by default | Trade list primary, tap to expand | |

**User's choice:** Open by default

---

| Option | Description | Selected |
|--------|-------------|----------|
| Standard gain/loss colors | Green/red text with arrow | |
| Color + background tint | Green/red color + subtle background tint on holding cards | ✓ |

**User's choice:** Color + background tint

---

## Current Price Entry

| Option | Description | Selected |
|--------|-------------|----------|
| Tap-to-edit inline | Tap holding to open small modal/input | |
| Bulk update form | Dedicated form with all tickers | |
| Both inline + bulk | Tap-to-edit + bulk form from portfolio header | ✓ |

**User's choice:** Both inline + bulk

---

| Option | Description | Selected |
|--------|-------------|----------|
| Persist to SQLite | Prices survive app restart | ✓ |
| Session-only | Reset on restart | |

**User's choice:** Persist to SQLite

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show last-updated date | Date displayed next to holding | ✓ |
| No date needed | Cleaner UI without date | |

**User's choice:** Show last-updated date

---

| Option | Description | Selected |
|--------|-------------|----------|
| Warn after 7 days stale | Yellow dot or faded text for old prices | ✓ |
| No stale warning | User knows via date display | |

**User's choice:** Warn after 7 days stale

---

## Trade History & Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Ticker chips | Horizontal scrollable chip list | |
| Dropdown picker | Dropdown for ticker selection | |
| Chips + search bar | Chips for quick switching + search to type | ✓ |

**User's choice:** Ticker chips + search bar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Buy/sell + date range + ticker | All three filter axes | ✓ |
| Ticker + buy/sell only | Two axes, no date | |
| Ticker only | Simple single-axis filter | |

**User's choice:** Buy/sell + date range + ticker (three-axis filtering)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Filter bar below header | Inline filter controls | |
| Bottom sheet filter | Filter icon opens bottom sheet | ✓ |

**User's choice:** Bottom sheet filter

---

| Option | Description | Selected |
|--------|-------------|----------|
| P&L on trade card | Realized P&L badge on paired trade cards | ✓ |
| P&L in summary only | Only in portfolio header | |

**User's choice:** P&L badge on trade cards

---

## P&L Pair Display

| Option | Description | Selected |
|--------|-------------|----------|
| Tappable pair linkage | Both trades linked, tap to see pair | |
| P&L number only | Just the calculated P&L on sell card | |
| Grouped per-ticker view | Expandable sections per ticker with FIFO pairs | ✓ |

**User's choice:** Grouped per-ticker view

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inside portfolio header | Expandable within collapsible section | |
| Dedicated screen | Separate drill-down screen | |
| Toggle via ticker chip | Tap chip to switch between flat list and group view | ✓ |

**User's choice:** Tap ticker chip to toggle between flat list and grouped pair view

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full pair detail | Buy details + sell details + full P&L breakdown | |
| Compact with expand | Summary line + tap to expand full detail | ✓ |

**User's choice:** Compact summary line with expand

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fees included in P&L | (sell price - buy price) × shares - fees | ✓ |
| Fees separate | Fees shown separately, not subtracted | |

**User's choice:** Fees included in P&L calculation

---

## the agent's Discretion

- Animation parameters for collapsible header
- Stale indicator design
- Bottom sheet filter layout
- Holding card typography and spacing
- Current price form validation

## Deferred Ideas

None — discussion stayed within phase scope.
