# Phase 1: Shell + Expense Tracker - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 01-shell-expense-tracker
**Areas discussed:** Expense Form UX, Category Creation Flow, Card Design and Density, Empty States and Layout

---

## Expense Form UX

### Form Style
| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet | Swipe-up sheet, keeps category context visible, quick dismiss | ✓ |
| Push to new screen | Full screen form, more room for fields | |
| Inline expand | Expand form inline below the category header | |

### Form Fields
| Option | Description | Selected |
|--------|-------------|----------|
| Minimum fields | Title, amount, date, category — no extras | |
| Minimum plus notes | Title, amount, date, category plus optional notes text field | ✓ |
| Minimum plus tags | Title, amount, date, category plus optional tags/keywords | |

### Edit and Delete
| Option | Description | Selected |
|--------|-------------|----------|
| Long-press menu | Long-press card shows contextual menu: Edit, Delete with confirmation | ✓ |
| Tap to edit, swipe to delete | Tap card opens edit bottom sheet, swipe left to delete | |
| Tap card opens detail then actions | Tap card opens a detail view with Edit and Delete buttons | |

### Validation
| Option | Description | Selected |
|--------|-------------|----------|
| Title and amount required | Title non-empty, amount positive number, date defaults to today | ✓ |
| All fields required | Title, amount, date, and category all required | |
| Minimal validation | Only check amount is valid number | |

### Amount Format
| Option | Description | Selected |
|--------|-------------|----------|
| Decimal input | Freeform decimal with currency symbol prefix, stored as cents | ✓ |
| Numpad style calculator | Calculator-like number pad | |
| Plain number field | Simple numeric input | |

### Date Pick
| Option | Description | Selected |
|--------|-------------|----------|
| Default today, editable | Pre-filled with today, user can tap to change via date picker | ✓ |
| Today only, no editing | Always set to today | |
| Manual text input | Free text date entry | |

### Category Prefill
| Option | Description | Selected |
|--------|-------------|----------|
| Pre-selected, editable | Pre-filled from context row, can be changed via dropdown | ✓ |
| Pre-selected, locked | Locked to the row's category | |
| Always show category picker | Never pre-select | |

### Delete Confirm
| Option | Description | Selected |
|--------|-------------|----------|
| Alert dialog | Native alert with Cancel and Delete buttons | ✓ |
| Undo snackbar | Delete immediately, undo snackbar for 5 seconds | |
| Swipe to archive | Soft-delete with archive | |

---

## Category Creation Flow

### Create Category
| Option | Description | Selected |
|--------|-------------|----------|
| Inline add button | + button opens small inline form or bottom sheet | ✓ |
| Separate Manage screen | Navigate to full Manage Categories screen | |
| Modal with name only | Simple modal with text field | |

### Edit Category
| Option | Description | Selected |
|--------|-------------|----------|
| Long-press header | Contextual menu: Rename, Delete with confirmation | ✓ |
| Swipe to reveal actions | Swipe category header to show Edit/Delete | |
| Settings gear icon | Each header has a gear icon | |

### Category Order
| Option | Description | Selected |
|--------|-------------|----------|
| Manual drag to reorder | Long-press and drag categories | ✓ |
| Alphabetical | Auto-sorted A-Z | |
| Most recent first | Categories with most recent expense at top | |

### Delete Safety
| Option | Description | Selected |
|--------|-------------|----------|
| Warn and delete all | Warning dialog listing expense count, then delete on confirm | ✓ |
| Prevent deletion | Cannot delete non-empty category | |
| Move to Uncategorized | Delete category, move expenses to default bucket | |

---

## Card Design and Density

### Card Layout
| Option | Description | Selected |
|--------|-------------|----------|
| Title top, amount large, date bottom | Title heading, prominent amount, date as subtitle | ✓ |
| Amount left, details right | Large amount left, title/date stacked right | |
| Title and amount on top row | Title and amount share top row, date below | |

### Card Style
| Option | Description | Selected |
|--------|-------------|----------|
| Color dot or accent border | Subtle colored accent per category | ✓ |
| Full color background per category | Different background colors per category | |
| Uniform cards | All cards look the same | |

### Card Size
| Option | Description | Selected |
|--------|-------------|----------|
| Fixed width cards | ~140-160px, 2-3 visible, rest scrollable | ✓ |
| Content-fit width | Cards sized to content | |
| Screen-width proportion | Cards as percentage of screen | |

### Sparse Cards
| Option | Description | Selected |
|--------|-------------|----------|
| Cards left-aligned, empty space right | Cards from left, shows scroll capability | ✓ |
| Cards fill the row | Single card stretches to full width | |
| Add new card prompt | Empty space shows plus button | |

---

## Empty States and Layout

### Zero Categories
| Option | Description | Selected |
|--------|-------------|----------|
| CTA with illustration | Friendly illustration + Create Category button | ✓ |
| Auto-create defaults | Pre-create common categories on first launch | |
| Blank with FAB button | Empty screen with floating action button | |

### Zero Expenses
| Option | Description | Selected |
|--------|-------------|----------|
| Empty row with add prompt | Placeholder card with plus icon and text | ✓ |
| Collapsed by default, no indicator | Header stays collapsed | |
| Small empty message | Text row below category header | |

### Investments Tab
| Option | Description | Selected |
|--------|-------------|----------|
| Coming soon placeholder | Illustration with OCR feature description | ✓ |
| Minimal stub | Empty screen with tab title | |
| Basic manual trade entry | Manual trade form without OCR | |

### Loading
| Option | Description | Selected |
|--------|-------------|----------|
| Splash screen with logo | Branded splash, transitions when ready | ✓ |
| Skeleton screens | Grey skeleton placeholders | |
| Nothing, just load | No explicit loading screen | |

---

## the agent's Discretion

- Loading skeleton design for expense list and card rows
- Exact spacing, typography, and color palette
- Splash screen design and branding
- Illustration style for empty states
- Error state handling for SQLite failures
- Category color palette selection and assignment

## Deferred Ideas

- Balance/wallet card at top of expenses page showing available money — belongs in its own phase
- Bank card linking for automatic balance fetching — future phase
