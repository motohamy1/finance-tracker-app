# Roadmap: Finance Tracker

**Created:** 2026-04-29
**Granularity:** Coarse (4 phases)
**Total v1 Requirements:** 13

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Shell + Expense Tracker | Navigable app with full expense tracking | SHELL-01, EXP-01→05, DATA-01 | 5 (3 plans) |
| 2 | OCR Pipeline | Screenshot import → OCR extraction → review flow | INV-01, INV-02, INV-03 | 3 |
| 3 | Investment Analytics | P&L calculations, portfolio view, trade pairing | INV-04, INV-05 | 3 |
| 4 | Cloud Sync | Optional backup and restore to cloud | DATA-02 | 2 |

---

## Phase 1: Shell + Expense Tracker

**Goal:** Two-tab navigable app with full expense tracking — category CRUD, expense CRUD, collapsible headers with horizontal card rows, and SQLite persistence.

**Requirements:** SHELL-01, EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, DATA-01

**Success Criteria:**
1. App launches with bottom tab bar showing Investments and Expenses tabs
2. User can create, edit, and delete custom expense categories
3. Category headers expand/collapse with smooth animation (under 300ms, native driver), showing horizontally scrollable FlatList of expense cards when open
4. Each expense card renders title, date, and amount correctly; cards virtualize off-screen when scrolling
5. All data survives app force-quit and restart (SQLite persistence with migrations)

**Depends on:** (none — foundation phase)

**Plans:** 3 plans
- [x] 01-01-PLAN.md — Project setup, TypeScript types, SQLite schema, database service
- [x] 01-02-PLAN.md — Zustand expense store, Expo Router tab layout, splash screen, Investments placeholder
- [x] 01-03-PLAN.md — ExpenseCard, CategoryHeader (animated), expense form bottom sheet, category CRUD, expense CRUD, long-press menus, drag-to-reorder, empty states

**UI hint:** yes — tab navigation, category headers, expense cards, forms

---

## Phase 2: OCR Pipeline

**Goal:** User can import trading screenshots from gallery or share sheet, have trade data extracted via on-device OCR, and review/correct results before saving.

**Requirements:** INV-01, INV-02, INV-03

**Success Criteria:**
1. User can pick a screenshot from device gallery (image picker) or receive one via share sheet from a trading app
2. On-device OCR (ML Kit) extracts ticker symbol, number of shares, price per share, trade date, and buy/sell direction from the screenshot
3. User sees extracted data in a review screen and can edit any field before confirming and saving the trade to the database

**Depends on:** Phase 1 (shell navigation, data layer)

**Plans:** 4 plans
- [ ] 02-01-PLAN.md — Trade types, SQLite v2 migration (trades + failed_ocr_log), trade CRUD operations
- [ ] 02-02-PLAN.md — Zustand tradeStore, Investments Stack navigator, trade list with empty state + FAB, TradeCard component
- [ ] 02-03-PLAN.md — OCR service (ML Kit wrapper + text parser), import screen (gallery picker + share sheet + progress UX), install dependencies
- [ ] 02-04-PLAN.md — Review/edit screen (card preview + inline editing + validation + discard), manual trade entry screen

**UI hint:** yes — image picker, OCR processing screen, review/edit form

---

## Phase 3: Investment Analytics

**Goal:** P&L calculations per trade pair (FIFO), portfolio overview with current holdings and unrealized P&L, trade history.

**Requirements:** INV-04, INV-05

**Success Criteria:**
1. App matches buy and sell trades by ticker using FIFO pairing, calculates realized P&L per completed pair including fees
2. Portfolio overview screen shows all current holdings with average cost basis, current quantity, and unrealized P&L (requires manual entry of current price for v1)
3. Trade history is filterable by ticker and shows all past trades with their paired P&L

**Depends on:** Phase 2 (trade data must exist from OCR)

**UI hint:** yes — P&L summary cards, portfolio list, trade history list

---

## Phase 4: Cloud Sync

**Goal:** Optional cloud backup and restore — user can toggle sync, back up their database, and restore after reinstall.

**Requirements:** DATA-02

**Success Criteria:**
1. User can toggle cloud sync on/off in a settings screen, with clear status indicator
2. User can manually trigger a backup, and data can be restored after app reinstall (verified by fresh install test)

**Depends on:** Phase 1 (data layer), optionally Phase 2-3 (full data)

**UI hint:** yes — settings screen, sync toggle, backup/restore buttons

---

## Dependency Graph

```
Phase 1 (Shell + Expenses)
    ├──→ Phase 2 (OCR Pipeline)
    │       └──→ Phase 3 (Investment Analytics)
    └──→ Phase 4 (Cloud Sync)
```

- Phase 1 is the foundation — all other phases depend on it
- Phase 2 → Phase 3: OCR data feeds analytics
- Phase 4 is independent of 2-3 (can run in parallel with them)

## Requirement Coverage

| Requirement | Phase | Covered |
|-------------|-------|---------|
| SHELL-01 | 1 | ✓ |
| EXP-01 | 1 | ✓ |
| EXP-02 | 1 | ✓ |
| EXP-03 | 1 | ✓ |
| EXP-04 | 1 | ✓ |
| EXP-05 | 1 | ✓ |
| DATA-01 | 1 | ✓ |
| INV-01 | 2 | ✓ |
| INV-02 | 2 | ✓ |
| INV-03 | 2 | ✓ |
| INV-04 | 3 | ✓ |
| INV-05 | 3 | ✓ |
| DATA-02 | 4 | ✓ |

**13/13 requirements mapped — 100% coverage**

---
*Roadmap created: 2026-04-29*
*Last updated: 2026-04-29 after initialization*
