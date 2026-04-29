# Feature Research

**Domain:** Mobile Finance Tracker (on-device OCR + expense logging)
**Researched:** 2026-04-29
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create/delete expense categories | Basic organization, any tracker has this | LOW | Core CRUD |
| Log expense with amount and date | Fundamental tracking action | LOW | Simple form |
| View expense history | Users want to see what they spent | LOW | List view |
| Data persists across app restarts | Data loss is unforgivable | LOW | SQLite handles this |
| Bottom tab navigation | Standard mobile navigation pattern | LOW | Expo Router tabs |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Screenshot OCR for trade data | No manual entry — extract buy/sell from screenshots | HIGH | Core differentiator, needs AI model selection |
| Auto P&L calculation | Automatic profit/loss per trade pair | MEDIUM | Depends on OCR extraction accuracy |
| Horizontal scrollable card rows per category | Unique UX for expense browsing | MEDIUM | Requires Reanimated for smooth scrolling |
| Collapsible category headers | Clean UI, reduces visual noise | LOW | Standard accordion pattern |
| On-device AI (no cloud dependency) | Privacy-first, works offline | HIGH | ML Kit or Tesseract.js |
| Portfolio overview | Current holdings + unrealized P&L at a glance | MEDIUM | Requires trade pairing logic |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time stock prices | Users want live P&L | Requires paid API ($30-200/mo), adds network dependency | Manual entry or CSV import in v2 |
| Bank account linking | Auto-import transactions | Plaid costs money, complex OAuth flow, privacy concerns | Manual expense entry is simpler and private |
| Receipt scanning (paper) | "Scan everything" | Completely different OCR problem (curved paper, angles, lighting) | Stick to screenshot OCR only |
| Budget alerts / notifications | Proactive spending alerts | Adds push notification infrastructure, user preference management | Keep as stretch goal |
| Multi-currency support | International users | Complex exchange rate logic, API dependency | USD-only for v1 |

## Feature Dependencies

```
Expense Tracker Tab (EXP-01→05)
    └──requires──> Bottom Tab Navigation (SHELL-01)

Investment OCR (INV-02)
    ├──requires──> Screenshot Import (INV-01)
    └──requires──> OCR Model Integration (research in Phase 2)

P&L Calculations (INV-04)
    └──requires──> Trade Data Storage (from INV-02, INV-03)

Portfolio Overview (INV-05)
    └──requires──> P&L Calculations (INV-04)

Cloud Sync (DATA-02)
    └──requires──> Local Data Layer (DATA-01)
```

### Dependency Notes

- **Expense Tracker requires Navigation:** Tab structure must exist before expense screens render
- **OCR requires Screenshot Import:** No images to process without import
- **P&L requires OCR:** Can't calculate without extracted trade data
- **Portfolio requires P&L:** Portfolio view depends on trade pairing and P&L logic
- **Cloud Sync requires Local Data:** Sync layer sits on top of SQLite

## MVP Definition

### Launch With (v1)

- [x] Bottom tab navigation (Investments + Expenses) — structural foundation
- [x] Expense CRUD with custom categories — one of two core tabs
- [x] Collapsible category headers with horizontal card scroll — unique UX
- [x] Screenshot import (gallery + share sheet) — investment data entry point
- [x] On-device OCR extraction from screenshots — core differentiator
- [x] P&L calculation per trade — primary investment value
- [x] Portfolio overview — holdings summary
- [x] Local SQLite storage — data persistence
- [x] Optional cloud sync — data backup

### Add After Validation (v1.x)

- [ ] Trading platform layout templates (Robinhood, Webull, eToro) — improve OCR accuracy
- [ ] CSV/PDF export — share reports
- [ ] Expense analytics / spending trends — charts and insights
- [ ] Dark mode

### Future Consideration (v2+)

- [ ] Real-time stock prices — requires paid API
- [ ] Multi-device live sync — WebSocket infrastructure
- [ ] Receipt OCR — different domain entirely
- [ ] Budget alerts — push notification complexity
- [ ] Widget (iOS/Android home screen) — quick expense add

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Bottom tab navigation | HIGH | LOW | P1 |
| Expense CRUD + categories | HIGH | LOW | P1 |
| Horizontal card scroll layout | HIGH | MEDIUM | P1 |
| Screenshot import | HIGH | LOW | P1 |
| OCR extraction | HIGH | HIGH | P1 |
| P&L calculation | HIGH | MEDIUM | P1 |
| Portfolio overview | MEDIUM | MEDIUM | P1 |
| Cloud sync | MEDIUM | MEDIUM | P2 |
| Layout templates per app | MEDIUM | HIGH | P2 |
| CSV/PDF export | LOW | LOW | P3 |
| Real-time prices | MEDIUM | HIGH | P3 |

---
*Feature research for: Finance Tracker mobile app*
*Researched: 2026-04-29*
