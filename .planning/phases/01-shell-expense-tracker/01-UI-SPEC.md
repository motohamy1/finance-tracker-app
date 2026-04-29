---
phase: 1
slug: shell-expense-tracker
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-29
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for frontend phases. Generated inline (gsd-ui-researcher unavailable).
> Verified via gsd-ui-checker or manual review.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (React Native StyleSheet) |
| Preset | not applicable |
| Component library | React Native core + expo-vector-icons |
| Icon library | @expo/vector-icons (Ionicons primary, MaterialCommunityIcons fallback) |
| Font | System default (SF Pro on iOS, Roboto on Android) |

**Design approach:** All components use React Native `StyleSheet.create()` with no third-party UI kit. Icons loaded via `@expo/vector-icons`. Category accent colors are a predefined palette assigned on category creation.

---

## Spacing Scale

All values are density-independent pixels (dp). Derived from 4-point grid.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding, color dot margin |
| sm | 8px | Card internal padding, list item gaps |
| md | 16px | Default element spacing, section padding, horizontal screen margin |
| lg | 24px | Category header padding, bottom sheet handle area |
| xl | 32px | Section separators, form field groups |
| 2xl | 48px | Major section breaks, empty state illustration spacing |
| 3xl | 64px | Page-level spacing, splash screen logo margins |

Exceptions:
- Tab bar icon touch targets: 44px minimum (iOS HIG). Use `hitSlop` to extend tappable area without affecting layout.
- Category header chevron: 20x20 icon.
- Bottom sheet handle: 36x5 indicator bar.
- Expense card: 150px width × 110px height (fixed, per D-12).

---

## Typography

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body | 14px | 400 (regular) | 1.5 (21px) | Expense card date, category count, settings text |
| Label | 12px | 500 (medium) | 1.3 (16px) | Form field labels, tab labels, category header subtitle |
| Heading | 18px | 600 (semibold) | 1.2 (22px) | Expense card title, category header name, form section title |
| Display | 28px | 700 (bold) | 1.1 (31px) | Expense card amount, splash screen app name |

Amount text on expense cards is the visual focal point — always `Display` size, `bold` weight, right-aligned or centered.

---

## Color

Finance tracker palette. Light background with clean white cards and a cyan-teal accent for a modern, trustworthy feel. Category accent colors are assigned from a fixed palette (see Category Accent Palette below).

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #F0F4F8 | Page background — expenses list, investments placeholder, settings screen |
| Secondary (30%) | #FFFFFF | Cards, bottom sheet surfaces, category headers (collapsed), modal backgrounds |
| Accent (10%) | #0891B2 | Primary buttons (CTA, Add Category), active tab indicator, category color dot border, toggle chevron, focused input borders |
| Destructive | #DC2626 | Delete buttons, delete confirmation dialog destructive text |

**Text colors:**
| Role | Value | Usage |
|------|-------|-------|
| Text primary | #0F172A | Card titles, form headings, category names |
| Text secondary | #475569 | Card dates, form labels, placeholder text, category subtitle |
| Text tertiary | #94A3B8 | Disabled state, coming-soon description |

**Category accent palette** (assigned round-robin on category creation):

| Index | Hex | Label |
|-------|-----|-------|
| 0 | #0891B2 | Cyan |
| 1 | #7C3AED | Violet |
| 2 | #059669 | Emerald |
| 3 | #EA580C | Orange |
| 4 | #DB2777 | Pink |
| 5 | #2563EB | Blue |
| 6 | #CA8A04 | Amber |
| 7 | #4F46E5 | Indigo |

Each category receives a color dot (8px circle) left of the header name, and expense cards in that category get a matching 3px left border accent.

Accent reserved for: **Primary CTA buttons only** (Add Expense, Create Category, Save). Category accent colors are NOT the global accent — they are separate semantic tokens.

Destructive reserved for: **Delete buttons and delete confirmation dialogs only.** Never use destructive color for non-destructive actions.

---

## Component Anatomy

### ExpenseCard
```
┌─────────────────────┐
│                     │  ← 3px left accent border (category color)
│  Title (Heading)    │  ← 14px, semibold, text-primary
│                     │
│     $42.50          │  ← 28px, bold, text-primary (Display)
│                     │
│  Apr 28, 2026       │  ← 12px, regular, text-secondary
└─────────────────────┘
  ↑ 150px fixed width × 110px fixed height
  ↑ 8px internal padding (sm)
  ↑ white background (#FFFFFF), 8px border radius, subtle shadow (elevation 2)
```

### CategoryHeader (collapsed state)
```
┌──────────────────────────────────────────────┐
│ ● Category Name                    3 items ▼ │
└──────────────────────────────────────────────┘
  ↑ ● = 8px color dot    ↑ ▼ = chevron (20x20)
  ↑ md horizontal padding (16px), lg vertical (24px)
  ↑ bg: secondary (#FFFFFF) when collapsed
```

### CategoryHeader (expanded state)
```
┌──────────────────────────────────────────────┐
│ ● Category Name                    3 items ▲ │
├──────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ →       │
│ │ Card │ │ Card │ │ Card │ │ Card │          │ ← FlatList horizontal
│ └──────┘ └──────┘ └──────┘ └──────┘          │   (sm gap between cards)
│                                               │
│ [ ┌──────────┐ ]                              │ ← 0 expenses: placeholder card
│   │ + Add    │                                │
│   └──────────┘                                │
└──────────────────────────────────────────────┘
  ↑ bg: dominant (#F0F4F8) when expanded (subtle contrast)
  ↑ animation: 250ms ease-in-out, native driver
```

### BottomSheet (expense form)
```
┌──────────────────────────────────────────────┐
│                 ═══                           │ ← handle (36x5, gray-300)
│                                              │
│  New Expense                       [category]│ ← category dropdown pre-selected
│  ┌──────────────────────────────────────┐    │
│  │ Title                          [text] │    │ ← required, text-primary
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ $ 0.00                        [input]│    │ ← required, decimal, currency prefix
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ 📅 Today                     [picker]│    │ ← defaults to today, tappable
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ Notes (optional)              [text] │    │ ← multi-line, text-secondary placeholder
│  └──────────────────────────────────────┘    │
│                                              │
│  [       Save Expense       ]               │ ← accent button (0891B2), full width
│                                              │
└──────────────────────────────────────────────┘
  ↑ 16px horizontal padding
  ↑ Fields separated by 12px gaps
```

### Tab Navigator
```
┌──────────────────────────────────────────────┐
│  [💼 Expenses]        [📈 Investments]       │
└──────────────────────────────────────────────┘
  ↑ Active tab: accent color (0891B2) icon + label
  ↑ Inactive tab: text-tertiary (94A3B8)
  ↑ Icons: Ionicons (wallet-outline / wallet for Expenses, trending-up-outline / trending-up for Investments)
  ↑ Labels: 12px medium, 6px below icon
```

### Empty States

**Zero categories:**
```
┌──────────────────────────────────────────────┐
│                                              │
│              [illustration]                  │ ← envelope/category icon, 120px
│                                              │
│           Start Tracking                     │ ← Display, text-primary
│    Create your first spending category       │ ← Body, text-secondary, centered
│       to begin logging expenses              │
│                                              │
│      [  + Create Category  ]                │ ← accent button, tappable → opens inline add
│                                              │
└──────────────────────────────────────────────┘
```

**Zero expenses (inside expanded category):**
```
Single placeholder card at start of horizontal row:
┌──────────────┐
│              │
│      +       │ ← 24px icon, accent color
│              │
│  Add an      │ ← 12px medium, text-secondary
│  expense     │
│              │
└──────────────┘
  ↑ Same dimensions as expense card (150×110)
  ↑ Dashed border or reduced opacity background
```

**Investments tab (coming soon):**
```
┌──────────────────────────────────────────────┐
│                                              │
│           [chart/OCR illustration]           │ ← investment-themed, 120px
│                                              │
│         Coming Soon                          │ ← Display, text-primary
│   Track your investments with smart          │ ← Body, text-secondary
│   screenshot OCR. Buy, sell, profit —        │
│   all extracted automatically.               │
│                                              │
└──────────────────────────────────────────────┘
```

### Loading (Splash Screen)
```
┌──────────────────────────────────────────────┐
│                                              │
│              [app logo]                      │ ← 80px, centered
│                                              │
│           Finance Tracker                    │ ← Display, text-primary
│                                              │
│         [subtle loading spinner]            │ ← accent color spinner, 24px
│                                              │
└──────────────────────────────────────────────┘
  ↑ bg: dominant (#F0F4F8)
  ↑ Transitions to Expenses tab with 300ms fade when SQLite is ready
```

### Long-Press Context Menu

**On expense card:**
```
┌──────────────┐
│ ✏️  Edit     │ ← opens bottom sheet, pre-filled
│ 🗑️  Delete   │ ← opens alert dialog
└──────────────┘
  ↑ Native context menu (ActionSheet on iOS, PopupMenu on Android)
  ↑ Platform-appropriate native component
```

**On category header:**
```
┌──────────────┐
│ ✏️  Rename   │ ← opens inline edit / bottom sheet
│ 🗑️  Delete   │ → if has expenses: warn dialog with count → delete all on confirm
│              │   if empty: delete immediately with undo snackbar option
└──────────────┘
```

---

## Interaction Patterns

| Pattern | Implementation | Details |
|---------|---------------|---------|
| Category expand/collapse | `LayoutAnimation` or `Reanimated` | 250ms ease-in-out, native driver. Chevron rotates 180°. Expanded shows bg:#F0F4F8. |
| Horizontal card scroll | `FlatList horizontal` | `showsHorizontalScrollIndicator={false}`, `snapToInterval` optional but not required. `decelerationRate="fast"`. |
| Bottom sheet | `@gorhom/bottom-sheet` or custom modal | Snap points: 75% of screen. Backdrop dims 40% opacity. Dismiss on backdrop tap or swipe down. |
| Drag to reorder categories | `react-native-draggable-flatlist` | Long-press category header to initiate drag. Haptic feedback on pick-up. |
| Long-press menu | Native platform menu | `ActionSheetIOS` on iOS, `UIManager` on Android. No custom overlay. |
| Delete confirmation | `Alert.alert` (native) | Title: "Delete Expense?", Message: "This action cannot be undone.", Buttons: Cancel (default), Delete (destructive). |
| Date picker | `@react-native-community/datetimepicker` | Native date spinner on iOS, calendar on Android. Default value: today. |
| Category inline add | Bottom sheet (name field only) | Single text input + "Create" button. Auto-assigns next available category accent color. |
| Tab switching | Expo Router tabs | `expo-router` Tabs layout with `(expenses)` and `(investments)` route groups. No swipe between tabs (tap only). |
| Splash → main transition | `expo-splash-screen` + custom fade | Fade out splash (300ms) → Expenses tab visible. SQLite init happens during splash. |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (add expense) | **Add Expense** — opens bottom sheet |
| Primary CTA (create category) | **+ Create Category** — opens category creation form |
| Save button | **Save Expense** — saves to DB, dismisses bottom sheet |
| Empty state (no categories) heading | **Start Tracking** |
| Empty state (no categories) body | Create your first spending category to begin logging expenses. |
| Empty state (no expenses) card | **+** icon, text: "Add an expense" |
| Investments "coming soon" heading | **Coming Soon** |
| Investments "coming soon" body | Track your investments with smart screenshot OCR. Buy, sell, profit — all extracted automatically. |
| Error state heading | **Something went wrong** |
| Error state body | Pull to refresh or try again. |
| Delete expense confirmation | Title: **Delete Expense?** — Message: This action cannot be undone. — Buttons: Cancel, Delete |
| Delete category confirmation | Title: **Delete [Category Name]?** — Message: This will also delete [N] expenses. This action cannot be undone. — Buttons: Cancel, Delete |
| Category rename placeholder | **Category name** |
| Amount input placeholder | **0.00** |
| Title input placeholder | **What did you spend on?** |
| Notes input placeholder | **Add a note (optional)** |
| Tab label (Expenses) | **Expenses** |
| Tab label (Investments) | **Investments** |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (React Native project) | not required |
| third-party | none | not required |

No third-party registries or blocks used. All components are React Native core or Expo ecosystem packages.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PENDING
- [ ] Dimension 2 Visuals: PENDING
- [ ] Dimension 3 Color: PENDING
- [ ] Dimension 4 Typography: PENDING
- [ ] Dimension 5 Spacing: PENDING
- [ ] Dimension 6 Registry Safety: PENDING

**Approval:** pending

---
*UI-SPEC generated: 2026-04-29*
*Source: inline generation from CONTEXT.md (17 locked decisions)*
