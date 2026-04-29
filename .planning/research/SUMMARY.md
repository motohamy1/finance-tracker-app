# Project Research Summary

**Project:** Finance Tracker
**Domain:** Mobile Finance Tracker (on-device OCR + expense logging)
**Researched:** 2026-04-29
**Confidence:** MEDIUM

## Executive Summary

The Finance Tracker is a React Native / Expo mobile app with two core capabilities: investment P&L tracking via screenshot OCR and categorized expense logging. This is a local-first, single-user app targeting both iOS and Android.

The recommended approach is to build with Expo SDK 52+, using Zustand for state management and expo-sqlite for local persistence. For OCR, Google ML Kit (free tier) is the primary recommendation, with Tesseract.js as a fallback. The app should use a clean layered architecture: Presentation (Expo Router screens) → State (Zustand stores) → Data (SQLite) → Services (OCR, P&L, Cloud Sync).

Key risks include OCR accuracy across diverse trading app UIs, main-thread blocking during image processing, and nested scroll performance for the horizontal card layout. All three have specific prevention strategies mapped to roadmap phases.

## Key Findings

### Recommended Stack

Expo SDK 52+ with Expo Router for navigation, Zustand for state, and expo-sqlite for local storage. On-device OCR via ML Kit Text Recognition (free, works offline). Animation via react-native-reanimated for smooth horizontal scrolling and category expand/collapse.

**Core technologies:**
- Expo (React Native) SDK 52+: Cross-platform framework — single codebase for iOS + Android
- Expo Router v4+: File-based routing — convention over configuration
- Zustand v5+: State management — minimal boilerplate, great with React Native
- expo-sqlite v15+: Local database — synchronous API, no native linking
- ML Kit Text Recognition: On-device OCR — free, offline, good structured text accuracy

### Expected Features

**Must have (table stakes):**
- Bottom tab navigation (Investments + Expenses) — foundational structure
- Expense CRUD with custom categories, collapsible headers, horizontal card rows
- Screenshot import (gallery + share sheet) for trading screenshots

**Should have (competitive):**
- On-device OCR extraction of trade data (ticker, shares, price, date) — core differentiator
- Auto P&L calculation per trade pair with FIFO pairing
- Portfolio overview with current holdings and unrealized P&L
- Optional cloud sync for data backup/restore

**Defer (v2+):**
- Real-time stock prices (requires paid API)
- CSV/PDF export
- Trading platform-specific layout templates for improved OCR
- Multi-device live sync

### Architecture Approach

Clean layered architecture: Expo Router screens → Zustand stores → expo-sqlite persistence. OCR, P&L, and Cloud Sync are isolated services behind clean interfaces. The expense tracker uses nested FlatLists (outer vertical for categories, inner horizontal for card rows) with virtualization for performance.

**Major components:**
1. Presentation Layer — Expo Router file-based screens, shared UI components (ExpenseCard, CategoryRow)
2. State Layer — Domain-separated Zustand stores (expenseStore, tradeStore, settingsStore)
3. Data Layer — SQLite with migration system, schema: categories, expenses, trades, settings
4. Services Layer — OCR processing pipeline, P&L calculation engine, Cloud sync service

### Critical Pitfalls

1. **OCR accuracy on trading screenshots** — Trading UIs vary per app. Mitigation: layout templates per app + mandatory review step before saving.
2. **UI freezes during OCR** — Processing blocks main thread. Mitigation: loading indicator + InteractionManager + downscale images before OCR.
3. **Nested scroll performance** — ScrollView instead of FlatList renders all cards. Mitigation: FlatList with `horizontal` virtualization from day one.
4. **SQLite schema rigidity** — No migration system causes data loss. Mitigation: versioned migrations from Phase 1.
5. **Trade pairing bugs** — Naive P&L with partial sells gives wrong results. Mitigation: FIFO pairing with lot tracking + thorough unit tests.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Shell + Expense Tracker
**Rationale:** Foundation first — navigation shell and expense CRUD are table stakes with no external dependencies. Establishes the data layer and UI patterns.
**Delivers:** Tab navigation, category CRUD, expense CRUD, collapsible headers with horizontal card rows, SQLite persistence with migrations.
**Addresses:** EXP-01→05, SHELL-01, DATA-01
**Avoids:** Nested scroll performance — use FlatList from start.

### Phase 2: OCR Pipeline
**Rationale:** Core differentiator. Depends on Phase 1 for shell and data layer. OCR is the highest-risk feature — needs early validation.
**Delivers:** Screenshot import (gallery + share sheet), ML Kit OCR integration, data extraction and parsing, review/edit screen.
**Addresses:** INV-01, INV-02, INV-03
**Avoids:** UI freezes during OCR — use background processing. OCR accuracy — build review screen from day one.

### Phase 3: Investment Analytics
**Rationale:** Builds on OCR data from Phase 2. P&L calculations and portfolio view need trade data to exist first.
**Delivers:** Trade pairing (FIFO), P&L calculation, portfolio overview, trade history.
**Addresses:** INV-04, INV-05
**Avoids:** Trade pairing bugs — FIFO with lot tracking, unit test edge cases.

### Phase 4: Cloud Sync
**Rationale:** Optional enhancement. Needs complete local data from Phases 1-3. Lowest priority — app is fully functional without it.
**Delivers:** Cloud backup toggle, export database to cloud, restore on reinstall.
**Addresses:** DATA-02

### Phase Ordering Rationale

- Expense tracker first because it has no dependencies and establishes UI patterns + data layer
- OCR second because it's the highest-risk feature — validate early, and it depends on shell + DB
- Analytics third because it depends entirely on OCR-extracted data
- Cloud sync last because it's optional and the app works fully offline

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** ML Kit vs Tesseract.js tradeoffs, trading app screenshot format analysis, share sheet intent handling on both platforms
- **Phase 4:** Cloud provider selection (Firebase vs Supabase vs iCloud), encryption requirements for financial data in transit

Phases with standard patterns (skip research-phase):
- **Phase 1:** Well-established patterns — Expo Router tabs, Zustand stores, SQLite CRUD
- **Phase 3:** Standard financial calculations with known algorithms

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Expo/RN ecosystem is mature and well-documented |
| Features | HIGH | User explicitly described both tabs in detail |
| Architecture | MEDIUM | Pattern is standard but OCR service integration needs validation |
| Pitfalls | MEDIUM | Based on known mobile dev gotchas; OCR accuracy is the biggest unknown |

**Overall confidence:** MEDIUM

### Gaps to Address

- **ML Kit accuracy on trading screenshots:** Needs real-world testing with actual screenshots from 3+ trading apps during Phase 2 planning
- **Share sheet on Android:** Intent handling differs from iOS — needs platform-specific research during Phase 2
- **Cloud sync encryption:** Requirements for encrypting financial data at rest and in transit — needs legal/research during Phase 4

## Sources

### Primary (HIGH confidence)
- Expo SDK 52 documentation — stack recommendations verified
- Zustand v5 docs — state management patterns
- expo-sqlite docs — local database API

### Secondary (MEDIUM confidence)
- ML Kit Text Recognition documentation — OCR capabilities for structured text
- React Native Reanimated docs — animation and scroll performance

### Tertiary (LOW confidence)
- Trading app screenshot layouts — needs real-world testing with actual screenshots

---
*Research completed: 2026-04-29*
*Ready for roadmap: yes*
