# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## Project: Finance Tracker

A React Native / Expo cross-platform mobile app (iOS + Android) for:
1. **Investment P&L tracking** via screenshot OCR from trading apps
2. **Expense logging** with categorized horizontal card rows

**Core Value:** Smart OCR-powered investment tracking from trading app screenshots — automatically extract buy/sell data and calculate profit/loss, combined with an intuitive categorized expense log.

## Tech Stack

- **Framework:** Expo SDK 52+ (React Native)
- **Navigation:** Expo Router v4+ (file-based routing)
- **State:** Zustand v5+
- **Database:** expo-sqlite v15+
- **OCR:** ML Kit Text Recognition (on-device, free tier)
- **Animation:** react-native-reanimated v3+

## Project Structure

```
src/
├── app/                      # Expo Router file-based routes
│   ├── _layout.tsx           # Root layout (tab navigator)
│   ├── (expenses)/           # Expense tab routes
│   ├── (investments)/        # Investment tab routes
│   └── settings.tsx          # Cloud sync, preferences
├── components/               # Shared UI components
├── stores/                   # Zustand state stores
├── services/                 # Business logic (OCR, P&L, cloud sync)
├── db/                       # SQLite schema and migrations
├── types/                    # TypeScript types
└── utils/                    # Helpers
```

## GSD Workflow

This project uses the Get Shit Done (GSD) workflow. All planning artifacts live in `.planning/`.

### Key Commands
- `/gsd-plan-phase N` — Create execution plan for phase N
- `/gsd-execute-phase N` — Execute phase N
- `/gsd-transition` — Move to next phase after completion
- `/gsd-progress` — Check overall project progress
- `/gsd-settings` — Update workflow configuration

### Roadmap Phases
1. Shell + Expense Tracker (7 requirements)
2. OCR Pipeline (3 requirements)
3. Investment Analytics (2 requirements)
4. Cloud Sync (1 requirement)

### Active Phase
None yet — run `/gsd-plan-phase 1` to begin.

## Conventions

- Use TypeScript for all new files
- Zustand stores are separated by domain (expenseStore, tradeStore, settingsStore)
- SQLite migrations use incrementing version numbers — never drop tables
- OCR processing runs off main thread using InteractionManager
- All async operations must show loading states
- Financial values stored as integers (cents) to avoid floating-point errors
- FlatList with `horizontal` prop for all scrollable card rows (never ScrollView)
