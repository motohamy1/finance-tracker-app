---
phase: 1
slug: category-input-bar
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-29
---

# Category Input Bar — UI Design Contract

> Visual contract for the floating category name input bar on the Expenses page.
> Generated inline for gsd-quick component-level spec.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (React Native StyleSheet) |
| Component library | React Native core + @expo/vector-icons |
| Icon library | @expo/vector-icons (Ionicons) |
| Font | System default |

---

## Component Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │ ← Page content (untouched)
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ┌──────────────────────────────────┐ [Create] [✕]       │ │ ← Floats above keyboard
│ │ │ Category name                    │                    │ │   8px vertical, 12px horizontal
│ │ └──────────────────────────────────┘                    │ │
│ └──────────────────────────────────────────────────────────┘ │
│██████████████████████████████████████████████████████████████│ ← Keyboard
└──────────────────────────────────────────────────────────────┘
```

**Container:** `KeyboardAvoidingView behavior="position" keyboardVerticalOffset={0}`
- Absolutely positioned: `left: 0, right: 0, bottom: 0`
- OS pushes the view up by keyboard height exactly — no manual offset
- Background: `#FFFFFF`, `borderTopWidth: 1`, `borderTopColor: #E2E8F0`
- Flex row, `alignItems: center`, `gap: 8`

**TextInput:**
- `flex: 1`, `fontSize: 16`, color `#0F172A`
- Background: `#F8FAFC`, `borderRadius: 8`, `borderWidth: 1`, `borderColor: #0891B2`
- Padding: `10px` vertical, `12px` horizontal
- Placeholder: "Category name" (`#94A3B8`)
- `autoFocus`, `returnKeyType="done"`, calls `onSubmitEditing` → create category

**Create button:**
- `TouchableOpacity` with `onPress` → `handleCreateCategory`
- Background: `#0891B2` (accent), `borderRadius: 8`
- Padding: `14px` horizontal, `10px` vertical
- Text: "Create" — `color: #FFFFFF`, `fontSize: 14`, `fontWeight: '600'`

**Close button:**
- `TouchableOpacity` with `onPress` → `dismissCategoryInput`
- `padding: 4`
- Icon: `Ionicons name="close" size={20} color="#94A3B8"`

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Close button padding |
| sm | 8px | Container vertical padding, gap between elements, button radius |
| md | 12px | Container horizontal padding, input horizontal padding |
| lg | 14px | Button horizontal padding |

---

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Input text | 16px | 400 | #0F172A |
| Input placeholder | 16px | 400 | #94A3B8 |
| Create button | 14px | 600 | #FFFFFF |
| Close icon | 20px | — | #94A3B8 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Container bg | #FFFFFF | Bar background |
| Container border | #E2E8F0 | Top separator line |
| Input bg | #F8FAFC | TextInput fill |
| Input border | #0891B2 | Focus border (accent) |
| Input text | #0F172A | Typed text |
| Placeholder | #94A3B8 | Hint text |
| Create button bg | #0891B2 | Accent button |
| Create button text | #FFFFFF | Button label |
| Close icon | #94A3B8 | Dismiss |

---

## Interaction

| Event | Behavior |
|-------|----------|
| Keyboard appears | Bar rises with keyboard via native `behavior="position"`, no whole-UI shift |
| Keyboard dismisses | Bar slides back to `bottom: 0` |
| Submit (return key) | Calls `handleCreateCategory` → adds category, clears input, dismisses |
| Tap Create | Same as submit |
| Tap ✕ | Calls `dismissCategoryInput` → clears input, closes bar, dimisses keyboard |
| Tap backdrop | Nothing (no backdrop — touches pass through to content behind) |

---

## Copywriting

| Element | Copy |
|---------|------|
| Input placeholder | Category name |
| Create button | Create |
| Close icon tooltip | (none — icon is self-explanatory) |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS (no registries)

**Approval:** approved 2026-04-29

---
*UI-SPEC generated: 2026-04-29*
