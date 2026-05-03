# Roadmap: Finance Tracker

**Created:** 2026-04-29
**Granularity:** Coarse (4 phases)
**Total v1 Requirements:** 14

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Shell + Expense Tracker | Navigable app with full expense tracking | SHELL-01, EXP-01→05, DATA-01 | ✓ (3 plans) |
| 2 | OCR Pipeline | Screenshot import → OCR extraction → review flow | INV-01, INV-02, INV-03 | 3 |
| 3 | Investment Analytics | P&L calculations, portfolio view, trade pairing | INV-04, INV-05 | 3 (3 plans) |
| 4 | Cloud Sync | Optional backup and restore to cloud | DATA-02 | 3 (3 plans) |
| 5 | AI OCR Model | AI-powered screenshot analysis replacing plain OCR with intelligent extraction | INV-06 | 2 plans |
| 6 | Investment Page Concept | Show gain/loss by comparing buying and selling | INV-07 | TBD |

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

**Plans:** 3 plans
- [x] 03-01-PLAN.md — Data & Logic: FIFO P&L engine, current_prices table, tradeStore extensions
- [x] 03-02-PLAN.md — Portfolio UI: Collapsible header, holding cards, current price forms
- [x] 03-03-PLAN.md — History & Filtering: Ticker chips, search, filter bottom sheet, P&L badges

**UI hint:** yes — P&L summary cards, portfolio list, trade history list

---

## Phase 4: Cloud Sync

**Goal:** Optional cloud backup and restore — user can toggle sync, back up their database, and restore after reinstall.

**Requirements:** DATA-02

**Success Criteria:**
1. User can toggle cloud sync on/off in a settings screen, with clear status indicator
2. User can manually trigger a backup, and data can be restored after app reinstall (verified by fresh install test)

**Depends on:** Phase 1 (data layer), optionally Phase 2-3 (full data)

**Plans:** 3 plans
- [ ] 04-01-PLAN.md — Auth infrastructure: Google Sign-In, Drive API service, sync TypeScript types
- [ ] 04-02-PLAN.md — Sync engine: JSON export/import, LWW merge, Zustand settingsStore, lifecycle hooks
- [ ] 04-03-PLAN.md — Settings UI: auth button, sync toggle, Sync Now, RestoreBanner, SyncIndicator

**UI hint:** yes — settings screen, sync toggle, backup/restore buttons

---

## Phase 5: AI OCR Model

**Goal:** Replace the current plain-text OCR pipeline with an AI-powered model that understands trading app screenshots, distinguishes between different trading platforms/formats, and extracts structured trade data with higher accuracy and fewer errors.

**Requirements:** INV-06

**Success Criteria:**
1. AI model correctly identifies and extracts ticker, shares, price, date, and buy/sell direction from trading app screenshots with >90% accuracy across multiple trading platforms
2. Model can distinguish between different screenshot layouts/formats and adapt extraction accordingly
3. Error rate is measurably reduced compared to the current plain OCR pipeline (Phase 2)

**Depends on:** Phase 2 (OCR Pipeline — replaces/enhances its OCR engine)

**Plans:** 2 plans
- [x] 05-01-PLAN.md — Platform detection + template-aware extraction (Robinhood, Webull, eToro), extended OCRResult with AI metadata, enhanced parseTradeFromText
- [x] 05-02-PLAN.md — Accuracy evaluation framework, 15-case regression test suite, review screen AI metadata display, per-field confidence in trade validation

**UI hint:** yes — same import/review flow, upgraded extraction engine

---

## Phase 6: Investment Page Concept

**Goal:** Ensure the core concept of the investment page/section is solid. Show gain or loss of investments by comparing buying and selling. Data can be entered manually or via screenshots; the purpose is the priority.

**Requirements:** INV-07

**Success Criteria:**
1. Investment overview page clearly contrasts buy and sell data to highlight P&L.
2. The UI effectively handles and normalizes data regardless of whether it was manually entered or imported via OCR.

**Depends on:** Phase 3 (Investment Analytics)

**Plans:** TBD

**UI hint:** yes — unified view for manual/OCR trades highlighting gains and losses

---

## Dependency Graph

```
Phase 1 (Shell + Expenses)
    ├──→ Phase 2 (OCR Pipeline)
    │       ├──→ Phase 3 (Investment Analytics)
    │       │       └──→ Phase 6 (Investment Page Concept)
    │       └──→ Phase 5 (AI OCR Model)
    └──→ Phase 4 (Cloud Sync)
```

- Phase 1 is the foundation — all other phases depend on it
- Phase 2 → Phase 3: OCR data feeds analytics
- Phase 2 → Phase 5: AI model replaces/enhances Phase 2 OCR engine
- Phase 4 is independent of 2-3-5 (can run in parallel with them)

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
| INV-06 | 5 | ✓ |
| INV-07 | 6 | ✓ |

**15/15 requirements mapped — 100% coverage**

---
*Roadmap created: 2026-04-29*
*Last updated: 2026-04-29 after initialization*
