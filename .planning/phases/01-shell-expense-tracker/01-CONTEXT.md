# Phase 1: Shell + Expense Tracker - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Two-tab navigable app (Investments + Expenses) with full expense tracking: category CRUD, collapsible toggle headers with horizontally scrollable FlatList card rows, and SQLite persistence. The Investments tab shows a "coming soon" placeholder. This phase establishes the shell, data layer, and UI patterns that all subsequent phases build upon.
</domain>

<decisions>
## Implementation Decisions

### Expense Form UX
- **D-01:** Add expense form opens as a bottom sheet, preserving category context
- **D-02:** Fields: Title (required), Amount (required, decimal input with currency symbol prefix, stored as cents), Date (defaults to today, editable via picker), Category (pre-selected from context, editable via dropdown), Notes (optional)
- **D-03:** Edit and delete via long-press contextual menu on expense card — options: Edit, Delete
- **D-04:** Delete shows native alert dialog: "Delete this expense?" with Cancel and Delete buttons
- **D-05:** Amount field uses freeform decimal input with currency symbol prefix

### Category Creation Flow
- **D-06:** Create category via inline + button at top/bottom of category list, opens small bottom sheet or inline form with name field
- **D-07:** Edit and delete categories via long-press on category header — contextual menu: Rename, Delete
- **D-08:** Categories support manual drag-to-reorder
- **D-09:** Deleting a category with expenses shows warning dialog listing count of affected expenses, then deletes all on confirmation

### Card Design and Density
- **D-10:** Expense card layout: Title as top heading, large prominent amount as focal point, date as smaller subtitle below
- **D-11:** Cards get a subtle color dot or accent border per category (not full background color)
- **D-12:** Fixed-width cards (~140-160px), 2-3 visible per row, rest horizontally scrollable
- **D-13:** When fewer cards than fit a row, cards stay left-aligned with empty space to the right

### Empty States and Layout
- **D-14:** Zero categories: friendly illustration + Create Category CTA button that opens the inline add form
- **D-15:** Zero expenses in an opened category: single placeholder card with plus icon and "Add an expense" text, tappable to open the expense form
- **D-16:** Investments tab: "Coming soon" placeholder with illustration and brief description of the OCR feature
- **D-17:** App loading: branded splash screen with app name/logo, transitions to expenses tab when SQLite is ready

### the agent's Discretion
- Loading skeleton design for expense list and card rows
- Exact spacing, typography, and color palette
- Splash screen design and branding
- Illustration style for empty states
- Error state handling for SQLite failures
- Category color palette selection and assignment
</decisions>

<canonical_refs>
## Canonical References

### Project Requirements
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements (SHELL-01, EXP-01→05, DATA-01), v2 deferrals, out of scope
- `.planning/ROADMAP.md` §Phase 1 — Full phase goal, success criteria, dependency graph

### Research
- `.planning/research/ARCHITECTURE.md` — Project structure, layered architecture, data flow patterns
- `.planning/research/STACK.md` — Expo SDK 52+, Zustand, expo-sqlite, react-native-reanimated recommendations
- `.planning/research/PITFALLS.md` — Nested ScrollView performance, SQLite schema rigidity, UX pitfalls

No external specs — requirements are fully captured in decisions above.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
(None — greenfield project, no existing code)

### Established Patterns
- Expo Router file-based routing with route groups for tab organization
- Zustand stores separated by domain (expenseStore, tradeStore, settingsStore)
- expo-sqlite with incrementing migration versions — never drop tables
- Financial values stored as integers (cents) to avoid floating-point errors
- FlatList with `horizontal` prop for all scrollable card rows (never ScrollView)
- OCR processing runs off main thread using InteractionManager (relevant for Phase 2)

### Integration Points
- Tab navigation shell: `src/app/_layout.tsx` — root layout with bottom tabs
- Expense tab routes: `src/app/(expenses)/` — category list, add form, category detail
- Investments tab route: placeholder screen in `src/app/(investments)/`
- Shared components: `src/components/` — ExpenseCard, CategoryRow, CategoryHeader
- State layer: `src/stores/expenseStore.ts`
- Data layer: `src/db/schema.ts` — categories, expenses tables with migrations
</code_context>

<deferred>
## Deferred Ideas

- Balance/wallet card at top of expenses page showing available money — belongs in its own phase (new data concept: user balance/account tracking)
- Bank card linking for automatic balance fetching — future phase, requires third-party integration
</deferred>

---
*Phase: 01-shell-expense-tracker*
*Context gathered: 2026-04-29*
