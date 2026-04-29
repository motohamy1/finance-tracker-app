# Finance Tracker

## What This Is

A React Native / Expo cross-platform mobile app (iOS + Android) that helps track
personal finances across two domains: **investment P&L tracking** via screenshot OCR
and **daily expense logging** organized by user-created categories. All data lives
locally on-device with optional cloud sync for backup.

## Core Value

Smart OCR-powered investment tracking from trading app screenshots — automatically
extract buy/sell data and calculate profit/loss, combined with an intuitive
categorized expense log.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can import trading screenshots (manual + share sheet) to extract investment data via on-device OCR
- [ ] User can view P&L calculations per trade, with fees, and portfolio overview
- [ ] User can create custom expense categories with collapsible toggle headers
- [ ] User can log expenses (title, date, amount) as horizontally scrollable cards per category
- [ ] All data stored locally on device with optional cloud sync

### Out of Scope

- Automated screenshot capture from trading apps — requires intrusive screen recording/overlay permissions
- Real-time stock price feeds or market data integration — paid API dependency
- Bank account linking / Plaid integration — expensive and heavyweight
- Multi-user or shared budgets — single-user app
- Receipt scanning (paper receipts) — different OCR problem

## Context

- User trades on multiple platforms (Robinhood, Webull, eToro, etc.) and currently
  has no unified way to track P&L across them
- Screenshot-based workflow: user takes a screenshot when buying, another when selling
- The expense tracker uses a "horizontal card row per category" layout — each category
  expands to show a horizontally scrollable row of expense cards
- Target is a polished, production-quality v1 release
- On-device AI model preferred (free, offline-capable, no API costs)

## Constraints

- **Tech Stack**: React Native / Expo — must work on both iOS and Android
- **AI Model**: Free, on-device model — cannot depend on paid cloud APIs
- **Data**: Local-first storage, cloud sync as optional enhancement
- **Quality**: Polished release, not quick MVP

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo for cross-platform | iOS + Android from single codebase, large ecosystem | — Pending |
| On-device OCR AI | Privacy, no API costs, works offline | — Pending |
| Local-first + optional cloud | User controls sync, data stays private | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after initialization*
