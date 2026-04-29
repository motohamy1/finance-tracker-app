# Architecture Research

**Domain:** Mobile Finance Tracker (on-device OCR + expense logging)
**Researched:** 2026-04-29
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Expense Tab  │  │ Investment   │  │ OCR Review   │       │
│  │ Screens      │  │ Tab Screens  │  │ Screen       │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
├─────────┴─────────────────┴─────────────────┴───────────────┤
│                      State Layer (Zustand)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ ExpenseStore │  │ TradeStore   │  │ SettingsStore│       │
│  │ (categories, │  │ (buys,sells, │  │ (cloud sync, │       │
│  │  entries)    │  │  P&L)        │  │  prefs)      │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │               │
├─────────┴─────────────────┴─────────────────┴───────────────┤
│                      Data Layer (expo-sqlite)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐    │
│  │                  SQLite Database                       │    │
│  │  categories | expenses | trades | settings             │    │
│  └──────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      Services Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ OCR Service  │  │ P&L Service  │  │ Cloud Sync   │       │
│  │ (ML Kit/     │  │ (pairing,    │  │ Service      │       │
│  │  Tesseract)  │  │  calc)       │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Expense Tab Screens | Category list, expense card rows, CRUD forms | Expo Router file-based screens |
| Investment Tab Screens | Trade list, P&L view, portfolio summary | Expo Router file-based screens |
| OCR Review Screen | Display extracted data, allow manual correction | Modal or push screen |
| ExpenseStore | Categories + expenses state, CRUD actions | Zustand store |
| TradeStore | Buy/sell trades, P&L calculations, portfolio | Zustand store |
| SettingsStore | Cloud sync toggle, app preferences | Zustand store |
| SQLite Database | Persistent storage for all entities | expo-sqlite |
| OCR Service | Process screenshot → extracted trade data | ML Kit / Tesseract.js wrapper |
| P&L Service | Match buy+sell pairs, calculate profits | Pure calculation logic |
| Cloud Sync Service | Export/import database to cloud | Firebase Storage or similar |

## Recommended Project Structure

```
src/
├── app/                      # Expo Router file-based routes
│   ├── _layout.tsx           # Root layout (tab navigator)
│   ├── (expenses)/           # Expense tab routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx         # Category list with cards
│   │   ├── add.tsx           # Add expense form
│   │   └── category/[id].tsx # Single category view
│   ├── (investments)/        # Investment tab routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx         # Trade list / portfolio
│   │   ├── import.tsx        # Screenshot import flow
│   │   └── review.tsx        # OCR review screen
│   └── settings.tsx          # Cloud sync, preferences
├── components/               # Shared UI components
│   ├── ExpenseCard.tsx       # Individual expense card
│   ├── CategoryRow.tsx       # Horizontal scrollable card row
│   ├── CategoryHeader.tsx    # Collapsible toggle header
│   ├── TradeItem.tsx         # Trade list item
│   └── PortfolioSummary.tsx  # P&L overview card
├── stores/                   # Zustand state stores
│   ├── expenseStore.ts
│   ├── tradeStore.ts
│   └── settingsStore.ts
├── services/                 # Business logic
│   ├── ocr.ts               # OCR processing pipeline
│   ├── pnl.ts               # P&L calculation engine
│   ├── cloudSync.ts         # Cloud backup/restore
│   └── database.ts          # SQLite queries and migrations
├── db/                       # Database schema
│   └── schema.ts            # Table definitions, migrations
├── types/                    # TypeScript types
│   └── index.ts
└── utils/                    # Helpers
    └── format.ts            # Currency, date formatting
```

### Structure Rationale

- **app/:** Expo Router convention — file structure = navigation structure
- **(expenses)/ and (investments)/:** Route groups for tab organization, URL segment not shown
- **components/:** Shared UI components across both tabs
- **stores/:** Zustand stores separated by domain (expenses, trades, settings)
- **services/:** Pure logic, no React dependency — testable in isolation
- **db/:** Database schema isolated from services for clean migrations

## Architectural Patterns

### Pattern 1: Store-Service Separation

**What:** Zustand stores hold state + trigger actions. Services contain pure business logic.
**When to use:** Always — keeps stores thin and services testable.
**Trade-offs:** Slightly more files, but prevents fat stores and untestable logic.

**Example:**
```typescript
// services/pnl.ts — pure logic, no React
export function calculatePnL(buyPrice: number, sellPrice: number, shares: number, fees: number): number {
  return (sellPrice - buyPrice) * shares - fees;
}

// stores/tradeStore.ts — thin store, calls service
const useTradeStore = create((set, get) => ({
  trades: [],
  addTrade: (trade) => set((s) => ({ trades: [...s.trades, trade] })),
  getPnL: (buyId, sellId) => {
    const buy = get().trades.find(t => t.id === buyId);
    const sell = get().trades.find(t => t.id === sellId);
    return calculatePnL(buy.price, sell.price, buy.shares, buy.fees + sell.fees);
  }
}));
```

### Pattern 2: Off-Main-Thread Processing

**What:** OCR and heavy computation run via InteractionManager or background task.
**When to use:** OCR processing on images (can take 1-5 seconds).
**Trade-offs:** Adds complexity but prevents UI freezes during OCR.

**Example:**
```typescript
import { InteractionManager } from 'react-native';

async function processScreenshot(uri: string) {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(async () => {
      const result = await runOCR(uri);
      resolve(result);
    });
  });
}
```

### Pattern 3: FlatList with Horizontal Scroll per Row

**What:** Each category renders a horizontal FlatList inside a vertical scroll parent.
**When to use:** The expense card row layout — categories expand to show scrollable cards.
**Trade-offs:** Nested scroll views can conflict; use `nestedScrollEnabled` and `horizontal={true}`.

**Example:**
```typescript
<FlatList
  data={categories}
  renderItem={({ item: category }) => (
    <CategoryHeader title={category.name}>
      <FlatList
        horizontal
        data={category.expenses}
        renderItem={({ item }) => <ExpenseCard {...item} />}
        showsHorizontalScrollIndicator={false}
      />
    </CategoryHeader>
  )}
/>
```

## Data Flow

### Screenshot → OCR → Trade

```
[User picks screenshot]
    ↓
[expo-image-picker] → [Image URI]
    ↓
[OCR Service] → ML Kit / Tesseract → raw text
    ↓
[Parse Service] → extract: ticker, shares, price, date, direction
    ↓
[Review Screen] → user confirms/corrects
    ↓
[TradeStore.addTrade()] → [SQLite INSERT]
    ↓
[P&L Service] → recalculate on new trade
```

### Expense CRUD Flow

```
[User taps "Add Expense"]
    ↓
[Form Screen] → title, amount, date, category
    ↓
[ExpenseStore.addExpense()] → [SQLite INSERT]
    ↓
[Category list re-renders] → new card appears in horizontal row
```

### State Management

```
[Zustand Store]
    ↓ (useStore hook)
[React Components] ←→ [Store Actions] → [SQLite queries] → [disk]
```

### Key Data Flows

1. **Screenshot import:** Gallery/Share Sheet → OCR processing → User review → Trade stored → P&L updated
2. **Expense logging:** User fills form → Store action → SQLite write → Category row updates
3. **Cloud sync:** User toggles sync → Service exports SQLite → Upload to cloud → On restore: download → import

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| ML Kit Text Recognition | Native module via expo-module | Free tier, on-device, needs testing with trading app screenshots |
| Firebase Storage (optional) | Firebase JS SDK | For cloud backup only, not real-time sync |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Expense Tab ↔ Trade Tab | Shared Zustand stores (no direct coupling) | Tabs don't import each other |
| OCR Service ↔ Trade Store | Service returns data, store persists | Service is stateless |
| P&L Service ↔ Trade Store | Service called by store, returns calculations | Pure function |
| Cloud Sync ↔ SQLite | Read/write database file | Backup = copy, Restore = replace |

## Anti-Patterns

### Anti-Pattern 1: OCR in Main Thread

**What people do:** Call OCR directly in component render or useEffect.
**Why it's wrong:** Freezes UI for 1-5 seconds, feels broken.
**Do this instead:** Use `InteractionManager.runAfterInteractions` or a Web Worker approach.

### Anti-Pattern 2: Fat Zustand Stores

**What people do:** Put all app state in one store.
**Why it's wrong:** Unnecessary re-renders, hard to test, tight coupling.
**Do this instead:** Separate stores by domain (expenseStore, tradeStore, settingsStore).

### Anti-Pattern 3: Nested ScrollView without FlatList

**What people do:** Wrap cards in a horizontal ScrollView.
**Why it's wrong:** No virtualization — all cards render even off-screen, memory grows with data.
**Do this instead:** Use `FlatList` with `horizontal` — virtualizes off-screen cards.

---
*Architecture research for: Finance Tracker mobile app*
*Researched: 2026-04-29*
