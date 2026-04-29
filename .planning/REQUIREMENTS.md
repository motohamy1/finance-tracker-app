# Requirements: Finance Tracker

**Defined:** 2026-04-29
**Core Value:** Smart OCR-powered investment tracking from trading app screenshots — automatically extract buy/sell data and calculate profit/loss, combined with an intuitive categorized expense log.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Shell & Navigation (SHELL)

- [ ] **SHELL-01**: App opens with bottom tab navigation showing Investments and Expenses tabs

### Expense Tracking (EXP)

- [ ] **EXP-01**: User can create custom expense categories with a name
- [ ] **EXP-02**: Category headers are collapsible toggles (closed by default), expanding/collapsing with smooth animation
- [ ] **EXP-03**: Expanded category shows expense cards in a horizontally scrollable row (FlatList-based, with virtualization)
- [ ] **EXP-04**: Each expense card displays title, date, and amount spent
- [ ] **EXP-05**: User can create, edit, and delete expenses within categories

### Investment Tracking (INV)

- [ ] **INV-01**: User can import a trading screenshot from camera roll (gallery picker) or via device share sheet
- [ ] **INV-02**: App extracts trade data (ticker, shares, price, date, buy/sell direction) from screenshot using on-device OCR
- [ ] **INV-03**: User can review and manually correct OCR-extracted data before saving to the database
- [ ] **INV-04**: App calculates realized P&L per completed trade pair (buy + sell matched via FIFO)
- [ ] **INV-05**: User can view portfolio overview showing current holdings and unrealized P&L

### Data & Persistence (DATA)

- [ ] **DATA-01**: All data (categories, expenses, trades) persisted locally via SQLite and survives app restart
- [ ] **DATA-02**: User can optionally enable cloud sync to backup and restore their data

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Investment Tracking

- **INV-06**: Trading platform-specific layout templates (Robinhood, Webull, eToro) for improved OCR accuracy
- **INV-07**: Manual trade entry without screenshot (for edge cases)

### Expense Tracking

- **EXP-06**: Expense analytics — spending trends and category breakdown charts
- **EXP-07**: CSV/PDF export of expense data

### Data

- **DATA-03**: Multi-device live sync (beyond backup/restore)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automated screenshot capture | Requires intrusive screen recording/overlay permissions |
| Real-time stock prices | Requires paid API, adds network dependency |
| Bank account linking (Plaid) | Expensive, complex, privacy concerns |
| Receipt scanning (paper) | Different OCR problem entirely |
| Multi-user or shared budgets | Single-user app |
| Multi-currency support | Exchange rate complexity, USD-only for v1 |
| Push notifications / budget alerts | Adds notification infrastructure complexity |
| Widgets (iOS/Android home screen) | Platform-specific, defer to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHELL-01 | Phase 1 — Shell + Expense Tracker | Pending |
| EXP-01 | Phase 1 — Shell + Expense Tracker | Pending |
| EXP-02 | Phase 1 — Shell + Expense Tracker | Pending |
| EXP-03 | Phase 1 — Shell + Expense Tracker | Pending |
| EXP-04 | Phase 1 — Shell + Expense Tracker | Pending |
| EXP-05 | Phase 1 — Shell + Expense Tracker | Pending |
| DATA-01 | Phase 1 — Shell + Expense Tracker | Pending |
| INV-01 | Phase 2 — OCR Pipeline | Pending |
| INV-02 | Phase 2 — OCR Pipeline | Pending |
| INV-03 | Phase 2 — OCR Pipeline | Pending |
| INV-04 | Phase 3 — Investment Analytics | Pending |
| INV-05 | Phase 3 — Investment Analytics | Pending |
| DATA-02 | Phase 4 — Cloud Sync | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-29*
*Last updated: 2026-04-29 after initial definition*
