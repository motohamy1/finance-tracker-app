# Phase 7: Editable Money Source Cards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 07-editable-money-sources
**Areas discussed:** Money source types, Card layout & navigation, Expense linking UX, Balance editing UX

---

## Money Source Types

### Q1: What money source types should the app start with?

| Option | Description | Selected |
|--------|-------------|----------|
| Seeded defaults + custom | Start with Cash, Bank, Savings, Borrowed pre-created on first launch. User can add custom ones and rename/delete defaults. | ✓ |
| Fully user-defined | No pre-created sources. User creates all from scratch. | |
| Fixed defaults only | Cash, Bank, Savings, Borrowed only — no custom sources allowed. | |

**User's choice:** Seeded defaults + custom (Recommended)
**Notes:** —

### Q2: Visual differentiation from expense categories

| Option | Description | Selected |
|--------|-------------|----------|
| Color + icon per source | Distinct palette + icon per source (e.g., Cash=green+💵, Bank=blue+🏦) | ✓ |
| Color only | Same accent palette, no icons | |
| Plain text only | No visual distinction | |

**User's choice:** Color + icon per source (Recommended)
**Notes:** —

### Q3: Behavior on money source deletion

| Option | Description | Selected |
|--------|-------------|----------|
| Cascade delete expenses | Linked expenses are deleted with the source | |
| Unlink expenses | Expenses stay but source becomes null | ✓ |
| Block deletion | Prevent deletion if expenses are linked | |

**User's choice:** Unlink expenses (Recommended)
**Notes:** —

### Q4: Money source reorderability

| Option | Description | Selected |
|--------|-------------|----------|
| Drag to reorder | Long-press drag to reorder, sort_order in DB | ✓ |
| Fixed order | Creation order or alphabetical, no manual reorder | |

**User's choice:** Drag to reorder (Recommended)
**Notes:** —

---

## Card Layout & Navigation

### Q1: Card arrangement on the expenses page

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll row | FlatList carousel with adjacent card peeking | ✓ |
| Vertical stack | Full-width cards stacked vertically | |
| Tab selector + single card | Tab/pill selector above a single visible card | |

**User's choice:** Horizontal scroll row (Recommended)
**Notes:** —

### Q2: Card content

| Option | Description | Selected |
|--------|-------------|----------|
| Name + icon + balance only | Minimal card | |
| Name + icon + balance + expense count | Balance plus linked expense count (e.g., "12 expenses") | ✓ |
| Full summary with visualization | Count, sparkline, spent/total bar | |

**User's choice:** Name + icon + balance + expense count (Recommended)
**Notes:** —

### Q3: Card dimensions

| Option | Description | Selected |
|--------|-------------|----------|
| Same height (180px) | Keep existing BalanceCard height | ✓ |
| Compact (140px) | Shorter cards, ~1.5 cards visible | |
| Taller (220px) | More visual presence | |

**User's choice:** Same height (180px) (Recommended)
**Notes:** —

### Q4: Visual style (replacing fake card number + chip)

| Option | Description | Selected |
|--------|-------------|----------|
| Solid color card | Background matches source accent color, white text, icon | ✓ |
| White card + accent stripe | White bg with colored left edge | |
| Gradient card | Gradient derived from source color | |

**User's choice:** Solid color card (Recommended)
**Notes:** —

---

## Expense Linking UX

### Q1: Required vs optional linking

| Option | Description | Selected |
|--------|-------------|----------|
| Required | Every expense must have a money source | |
| Optional | Expenses can exist without a linked source | ✓ |

**User's choice:** Optional (Recommended)
**Notes:** —

### Q2: Pre-selection behavior when adding an expense

| Option | Description | Selected |
|--------|-------------|----------|
| Context-based pre-select | Pre-select if user tapped a source card first, otherwise none | ✓ |
| Remember last source | Always pre-select the last-used source | |
| No pre-selection | User always picks manually | |

**User's choice:** Context-based pre-select (Recommended)
**Notes:** —

### Q3: Money source picker placement in expense form

| Option | Description | Selected |
|--------|-------------|----------|
| Picker in form, next to category | Dropdown styled like the existing category picker | ✓ |
| Pre-select via card tap, no form field | Tap card first to set context | |
| Chips/pills in form | Small chips row for source selection | |

**User's choice:** Picker in form, next to category (Recommended)
**Notes:** —

### Q4: Existing expenses migration

| Option | Description | Selected |
|--------|-------------|----------|
| Leave as null | Pre-Phase 7 expenses show no money source | ✓ |
| Auto-assign to Cash | All existing → first money source | |
| One-time categorization prompt | Ask user to categorize | |

**User's choice:** Leave as null (Recommended)
**Notes:** —

---

## Balance Editing UX

### Q1: Balance calculation model

| Option | Description | Selected |
|--------|-------------|----------|
| Manual entry only | Static number entered by user | ✓ |
| Auto-calculate from expenses | Balance = set amount minus linked expenses | |
| Manual + auto-deduct | Start with manual, expenses auto-deduct | |

**User's choice:** Manual entry only (Recommended)
**Notes:** —

### Q2: How to edit a balance

| Option | Description | Selected |
|--------|-------------|----------|
| Tap-to-edit inline | Tap balance → TextInput on card | ✓ |
| Bottom sheet modal | Tap card → bottom sheet with form | |
| Separate edit screen | Dedicated settings screen | |

**User's choice:** Tap-to-edit inline (Recommended)
**Notes:** —

### Q3: Initial balance for new sources

| Option | Description | Selected |
|--------|-------------|----------|
| Start at $0.00 | Balance defaults to zero | ✓ |
| Prompt on creation | Immediate balance entry after creation | |
| Placeholder until set | Show '--.--' until user sets it | |

**User's choice:** Start at $0.00 (Recommended)
**Notes:** —

### Q4: Display a total sum of all balances

| Option | Description | Selected |
|--------|-------------|----------|
| Show total sum | Sum displayed near the card row | ✓ |
| No total sum | Each card stands independently | |
| Total in separate view | Separate tab/section for totals | |

**User's choice:** Show total sum (Recommended)
**Notes:** —

---

## the agent's Discretion

- Exact icon selection for each default money source (Cash, Bank, Savings, Borrowed)
- Color palette hex values for money source accent colors (must be visually distinct from expense category palette)
- Delete confirmation dialog text and styling
- Total sum display placement and styling (above/below/inside the card row)
- Whether the horizontal card row auto-snaps to the nearest card or free-scrolls
- Keyboard handling for inline balance editing (auto-dismiss behavior)

## Deferred Ideas

- Money source transaction history (logging deposits/withdrawals over time) — future phase
- Transfer between money sources (e.g., move $100 from Bank to Cash) — future phase
- Budgeting per money source — future phase
- Spending analytics per money source (charts, trends) — future phase
