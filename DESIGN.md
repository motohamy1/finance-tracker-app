---
name: Finance Tracker
description: Neo-brutalist mobile finance tracker for active traders
colors:
  bg: "#0A0A0F"
  bg-secondary: "#14141A"
  bg-card: "#1A1A24"
  bg-input: "#0A0A0F"
  text: "#F0F0F5"
  text-secondary: "#6B6B78"
  text-muted: "#3A3A45"
  text-inverse: "#0A0A0F"
  border: "#FFFFFF"
  divider: "#FFFFFF"
  primary: "#00E5FF"
  secondary: "#FF006E"
  tertiary: "#FFEA00"
  success: "#39FF14"
  danger: "#FF0000"
  warning: "#FFEA00"
  tab-bar-bg: "#14141A"
  header-bg: "#0A0A0F"
  overlay: "rgba(0,0,0,0.85)"
typography:
  display:
    fontFamily: "Menlo, monospace"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.5px"
  headline:
    fontFamily: "Menlo, monospace"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.3px"
  title:
    fontFamily: "System"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.5px"
  body:
    fontFamily: "System"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "System"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.8px"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "48px"
components:
  card:
    backgroundColor: "{colors.bg-card}"
    borderColor: "{colors.border}"
    borderWidth: "2px"
    rounded: "{rounded.none}"
    padding: "14px"
  card-selected:
    backgroundColor: "{colors.bg-card}"
    borderColor: "{colors.border}"
    borderWidth: "4px"
    rounded: "{rounded.none}"
    padding: "14px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    borderColor: "{colors.border}"
    borderWidth: "2px"
    rounded: "{rounded.none}"
    padding: "14px 24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    borderWidth: "2px"
    rounded: "{rounded.none}"
    padding: "14px 24px"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    borderColor: "{colors.border}"
    borderWidth: "2px"
    rounded: "{rounded.none}"
    padding: "7px 14px"
  chip-inactive:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    borderWidth: "2px"
    rounded: "{rounded.none}"
    padding: "7px 14px"
  input:
    backgroundColor: "{colors.bg-input}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    borderWidth: "2px"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  tab-bar:
    backgroundColor: "{colors.tab-bar-bg}"
    borderTopColor: "{colors.border}"
    borderTopWidth: "3px"
    height: "64px"
---

# Design System: Finance Tracker

## 1. Overview

**Creative North Star: "The Trading Terminal You Carry"**

This is a neo-brutalist interface for active traders who need authority, speed, and zero ambiguity. Every element is a physical block: hard edges, thick borders, saturated colors that would be "wrong" together in a traditional system. The interface rejects softness in all forms — no gradients, no glass, no rounded pills, no calming pastels. Information density is high. Metrics come first, labels second.

The system is dark-mode-only. There is no light theme toggle. The background is a deep near-black with a cool undertone; surfaces lift through charcoal layers, not shadows. White borders are the primary structural tool — they separate, contain, and define.

**Key Characteristics:**
- **Structure is decoration**: borders, spacing, and type do all the visual work
- **Clash on purpose**: hot pink against electric cyan against neon green — safe combinations are banned
- **Terminal-native**: monospace numbers, uppercase labels, dense information layout
- **Physical presence**: elements feel like stacked paper blocks on a desk
- **Dark only**: the app assumes maximum screen brightness in any ambient light

## 2. Colors

The palette is intentionally discordant. Saturated primaries and secondaries that traditional finance apps would never combine.

### Primary
- **Electric Cyan** (`#00E5FF`): Active states, primary actions, selected tabs, success-adjacent accents. Used sparingly for high-impact moments.

### Secondary
- **Hot Pink** (`#FF006E`): The clashing accent. Portfolio header background, selected states, badges that need to scream. Its rarity is the point.

### Tertiary
- **Electric Yellow** (`#FFEA00`): Warnings, highlights, stale-data indicators. High visibility against dark backgrounds.

### Neutral
- **Near-Black** (`#0A0A0F`): Primary background. Not pure black — slightly cool to prevent dead-flat contrast.
- **Deep Charcoal** (`#14141A`): Secondary surfaces, tab bar, elevated cards.
- **Lifted Charcoal** (`#1A1A24`): Cards, input fields, content containers.
- **Off-White** (`#F0F0F5`): Primary text. Not pure white — slightly muted for reduced eye strain at high brightness.
- **Muted Gray** (`#6B6B78`): Secondary text, labels, inactive icons.
- **Very Muted** (`#3A3A45`): Placeholder text, disabled hints, subtle borders.
- **Pure White** (`#FFFFFF`): Borders, dividers, structural lines. The neo-brutalist staple.

### Functional
- **Neon Green** (`#39FF14`): Unapologetic gain/success. No soft pastels.
- **Pure Red** (`#FF0000`): Unapologetic loss/danger. No softened coral or salmon.

### Named Rules
**The White Border Rule.** Every container, card, and section uses a 2–3px solid white border. Borders are structural, not decorative. No hairlines.

**The No-Shadow Rule.** Surfaces do not float. Elevation is conveyed through border thickness and background layering, never through diffuse shadows.

## 3. Typography

**Monospace:** Menlo (iOS) / system monospace (Android)
**Sans:** System sans-serif (bold weight for all headings and labels)

**Character:** The monospace carries terminal authority — every number feels like it's from a Bloomberg terminal. The sans provides structural clarity for labels and navigation. The pairing is raw, unapologetic, and functional.

### Hierarchy
- **Display** (700, 32px, 1.1 line-height): Large P&L figures, portfolio totals. Monospace. Rare.
- **Headline** (700, 24px, 1.2 line-height): Screen titles, major section headers. Monospace or bold sans.
- **Title** (700, 18px, 1.2 line-height): Card headers, ticker names, category names. Bold sans, uppercase, letter-spacing 0.5px.
- **Body** (400, 14px, 1.4 line-height): Descriptions, notes, secondary information. Regular sans.
- **Label** (600, 12px, 1.3 line-height, 0.8px letter-spacing, uppercase): Field labels, tab text, badge labels. Bold sans.
- **Metric** (700, 28px, 1.1 line-height): Currency amounts, share counts, prices. Monospace. Tabular nums.
- **Micro** (600, 10px, 1.2 line-height, 0.8px letter-spacing, uppercase): Tiny badges, timestamps, metadata.

### Named Rules
**The Uppercase Label Rule.** All functional labels (tab names, field labels, button text, badge text) are uppercase with increased letter-spacing. Lowercase is reserved for user-generated content and body text only.

**The Monospace Number Rule.** Every numerical value — currency, prices, shares, percentages, P&L — uses monospace with tabular numbers. Numbers must align and feel like terminal output.

## 4. Elevation

**Flat by default. Shadows are forbidden.**

Depth is conveyed through:
1. **Border thickness**: 2px standard, 3px for emphasis, 4px for selected/invalid states
2. **Background layering**: bg (`#0A0A0F`) → bg-secondary (`#14141A`) → bg-card (`#1A1A24`)
3. **Color inversion**: selected states may invert colors (dark text on bright background)

There are no ambient shadows, no hover glows, no glass panels. If an element needs to feel "above" another, it gets a thicker border or a brighter background, never a drop shadow.

## 5. Components

### Buttons
- **Shape:** Sharp corners (`borderRadius: 0`), thick borders (`borderWidth: 2`)
- **Primary:** Electric cyan fill (`#00E5FF`), black text, white border. Tactile and loud.
- **Secondary:** Transparent fill, electric cyan border and text. For non-primary actions.
- **Danger:** Pure red fill (`#FF0000`), white text, white border.
- **Hover / Press:** `activeOpacity: 0.9` — immediate, no soft fade

### Chips / Tags
- **Shape:** Sharp corners (`borderRadius: 0`), 2px border
- **Active:** Solid electric cyan fill, black text, white border
- **Inactive:** Dark card background, white text, white border
- **Text:** Uppercase, 12px, bold, letter-spacing 0.5px

### Cards / Containers
- **Corner Style:** 0px radius everywhere. Sharp edges only.
- **Background:** `#1A1A24` (bg-card) or category/money-source color for content cards
- **Shadow Strategy:** None. `elevation: 0`, `shadowOpacity: 0`
- **Border:** 2px solid white (`#FFFFFF`) as default; 3px for emphasis; 4px for selected
- **Internal Padding:** 14px standard, 16px for spacious layouts

### Inputs / Fields
- **Shape:** Sharp corners, 2px white border, `#0A0A0F` background (same as page bg — inputs feel like holes)
- **Focus:** Border color shifts to electric cyan (`#00E5FF`) or thickens
- **Error:** 4px pure red (`#FF0000`) border, no soft glow
- **Placeholder:** `#3A3A45` (very muted)

### Navigation (Tab Bar)
- **Style:** Solid charcoal background (`#14141A`), 3px white top border
- **Height:** 64px, no rounded corners, full width
- **Active state:** Icon gets a 2px white border square around it, subtle cyan tint background
- **Inactive:** Muted gray icons
- **No labels:** Icon-only tabs for density

### Modals / Sheets
- **Shape:** Sharp top corners (0px radius), 3px white top border
- **Backdrop:** Near-black overlay (`rgba(0,0,0,0.85)`), no blur
- **Content:** Dark card background with 2px white borders on internal elements

### Badges
- **Shape:** Sharp corners (0px radius), 2px border matching the semantic color
- **Gain badge:** Transparent bg, neon green border and text
- **Loss badge:** Transparent bg, pure red border and text
- **Stale badge:** Black background, white border, white text

## 6. Do's and Don'ts

### Do:
- **Do** use thick white borders (2–3px) on every card and container
- **Do** use sharp corners (`borderRadius: 0`) as the default
- **Do** uppercase all labels, buttons, and badges with letter-spacing
- **Do** use monospace for every numerical value
- **Do** make color combinations feel slightly wrong — that's the aesthetic
- **Do** keep information density high; whitespace is a luxury this system rejects
- **Do** use `activeOpacity: 0.9` for tactile, immediate feedback
- **Do** convey elevation through border thickness and background layering

### Don't:
- **Don't** use rounded corners (pill shapes, 12px+ radii) except where the OS forces them
- **Don't** use soft shadows (`shadowOpacity`, `elevation`) for decorative depth
- **Don't** use glassmorphism, blurs, or transparency-as-decoration
- **Don't** use side-stripe borders (`borderLeftWidth > 1px` as colored accent)
- **Don't** use gradient text or gradient backgrounds
- **Don't** use pastel colors, muted greens, or "calming" palettes
- **Don't** use em dashes in copy — use periods, colons, or commas
- **Don't** build a light mode. This system is dark-only.
- **Don't** use the hero-metric template (big number + small label + gradient accent)
- **Don't** create identical card grids with icon + heading + text repetitions
