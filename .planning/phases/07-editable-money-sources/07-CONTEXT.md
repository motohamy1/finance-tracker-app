# Phase 7: Editable Money Source Cards - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the existing single bank-like card (with fake card numbers and chip) into editable money source cards divided by categories (Cash, Bank, Savings, Borrowed, and user-created). Each money source links to expenses so users can associate expenses with where the money came from. Remove the fake card number visual and chip, replace with full-width scrollable cards.
</domain>

<decisions>
## Implementation Decisions

### Money Source Types
- **D-01 (Seeded defaults + custom):** Start with Cash, Bank, Savings, Borrowed pre-created on first launch. Users can add custom money sources and rename/delete defaults.
- **D-02 (Color + icon per source):** Each money source gets its own accent color from a distinct palette (separate from expense category colors) and a representative icon (e.g., Cash=green, Bank=blue).
- **D-03 (Unlink on delete):** Deleting a money source unlinks its expenses (money_source_id becomes null). No cascade delete, no blocking.
- **D-04 (Drag to reorder):** Money source cards are reorderable via long-press drag, with sort_order persisted in the database.

### Card Layout & Navigation
- **D-05 (Horizontal scroll row):** Cards displayed in a horizontal FlatList with visual peeking of adjacent cards (carousel-style).
- **D-06 (Card content):** Each card shows the source name (top), icon, balance amount (large, centered), and linked expense count (e.g., "12 expenses").
- **D-07 (Card height):** 180px — same as the existing BalanceCard, keeping the current visual rhythm.
- **D-08 (Solid color background):** Each card uses its source's accent color as a solid background. The fake card number ("**** **** **** 1234") and chip decoration are removed.

### Expense Linking UX
- **D-09 (Optional linking):** Money source is an optional field on expenses. Every existing expense pre-Phase 7 stays with money_source_id = null.
- **D-10 (Context-based pre-select):** If the user tapped a specific money source card before opening the expense form, pre-select that source. Otherwise, no default is pre-selected.
- **D-11 (Picker in form, next to category):** A dropdown/selectable button in the ExpenseForm, styled identically to the existing category picker. Appears near the category picker.
- **D-12 (Existing expenses stay null):** No auto-assignment or migration prompt for expenses created before Phase 7. Users link them manually if desired.

### Balance Editing UX
- **D-13 (Manual entry only):** Balance is a static number the user enters and updates manually. No auto-calculation from linked expenses.
- **D-14 (Tap-to-edit inline):** Tapping the balance amount on a card transforms it into a TextInput for quick editing. Save on blur or Enter.
- **D-15 (Start at $0.00):** Newly created money sources default to $0.00 balance. The user taps to set their actual balance.
- **D-16 (Show total sum):** Display the sum of all money source balances near the horizontal card row.

### the agent's Discretion
- Exact icon selection for each default money source (Cash, Bank, Savings, Borrowed)
- Color palette hex values for money source accent colors (must be visually distinct from expense category palette)
- Delete confirmation dialog text and styling
- Total sum display placement and styling (above/below/inside the card row)
- Whether the horizontal card row auto-snaps to the nearest card or free-scrolls
- Keyboard handling for inline balance editing (auto-dismiss behavior)
</decisions>

<specifics>
## Specific Ideas

- The card should feel like a real bank/credit card — solid color, clean typography, not decorative like the old chip/gold element.
- Money sources are conceptually different from expense categories: sources = where money IS, categories = what money was spent ON. The UI should make this distinction clear.
- No "total spent" calculation displayed on the money source cards — that's the expense categories' job.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 7 — Phase goal, success criteria (4 items), dependency on Phase 1
- `.planning/REQUIREMENTS.md` §EXP-06 — Money source tracking requirement

### Existing Code (Critical Reading)
- `src/components/BalanceCard.tsx` — Current card to be replaced/transformed. Shows the card number + chip to remove.
- `src/components/ExpenseForm.tsx` — Form that needs a money source picker added (next to category picker).
- `src/components/ExpenseCard.tsx` — Expense card component (may need money source indicator).
- `src/db/schema.ts` — Schema where new `money_sources` table and `money_source_id` column must be added.
- `src/stores/expenseStore.ts` — Store that needs money source CRUD operations.
- `src/app/(expenses)/index.tsx` — Expenses page where BalanceCard is used and money source cards will appear.

### Prior Phase Context
- `.planning/phases/01-shell-expense-tracker/01-CONTEXT.md` — Expense tracker foundations, FlatList patterns, category CRUD patterns to mirror
- `.planning/phases/06-investment-page-concept/06-CONTEXT.md` — Category creation pattern (D-08: custom labels alongside defaults), bottom sheet patterns
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **BalanceCard** (`src/components/BalanceCard.tsx`): Transform into MoneySourceCard — reuse the 180px height, card shadow/elevation, and general layout skeleton. Remove the chip + fake card number. Add icon rendering and tap-to-edit balance.
- **ExpenseForm category picker** (`src/components/ExpenseForm.tsx` lines 109-152): The category dropdown pattern (select button → dropdown list → new category inline input) should be replicated for the money source picker.
- **BottomSheet** (`src/components/BottomSheet.tsx`): Available if a bottom sheet approach is preferred for any money source management (creation, renaming, deletion).
- **DraggableFlatList** (from Phase 1 drag-to-reorder): The existing drag-to-reorder implementation for categories can be adapted for money source card reordering.
- **EmptyState** (`src/components/EmptyState.tsx`): Reusable for when no money sources exist.

### Established Patterns
- **Zustand store per domain:** New money source operations go in `expenseStore.ts` (or a new `moneySourceStore.ts` if preferred — but existing pattern keeps expenses + categories together in one store).
- **SQLite migrations:** Migration v5 — `CREATE TABLE money_sources` with columns for id, name, color_hex, icon_name, balance_cents, sort_order, created_at, updated_at. `ALTER TABLE expenses ADD COLUMN money_source_id TEXT` with foreign key.
- **Financial values as INTEGER cents:** `balance_cents` on money sources, consistent with `amount_cents` on expenses.
- **FlatList with horizontal prop:** Used for horizontal scroll row (replaces the 2-column grid pattern for this component).
- **Expo Router file-based routing:** No new routes needed — changes confined to the existing expenses screen and components.
- **UUID v4 for all IDs:** `generateUUID()` from `@/utils/format`.
- **All async operations show loading states.**

### Integration Points
- `src/app/(expenses)/index.tsx`: Replace `<BalanceCard />` in `ListHeaderComponent` with the new money source card row. The `ListHeaderComponent` already supports this — swap the component.
- `src/components/ExpenseForm.tsx`: Add money source picker field near the existing category picker. The form already has a dropdown pattern to follow.
- `src/db/schema.ts`: Add migration v5 for `money_sources` table and `expenses.money_source_id` column.
- `src/stores/expenseStore.ts`: Add money source state and CRUD methods.
- `src/types/index.ts`: Add `MoneySource` interface and update `Expense` and `ExpenseFormData` types.
- `src/services/database.ts`: Add money source CRUD operations.
</code_context>

<deferred>
## Deferred Ideas

- Money source transaction history (logging deposits/withdrawals over time) — future phase
- Transfer between money sources (e.g., move $100 from Bank to Cash) — future phase
- Budgeting per money source — future phase
- Spending analytics per money source (charts, trends) — future phase
</deferred>

---

*Phase: 07-editable-money-sources*
*Context gathered: 2026-05-04*
