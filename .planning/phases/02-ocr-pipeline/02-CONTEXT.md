# Phase 2: OCR Pipeline - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Screenshot import (gallery + share sheet) → on-device OCR (ML Kit) with progress UX → review/correct extracted trade data → save trade to SQLite. This phase creates the full pipeline for turning trading app screenshots into structured trade records. P&L calculations and portfolio views are Phase 3.
</domain>

<decisions>
## Implementation Decisions

### Import Entry Point
- **D-01:** Dual entry: empty state shows prominent "Import Screenshot" CTA with sample trade card preview. Once trades exist, a FAB opens import options.
- **D-02:** Both gallery picker and share sheet must be implemented (INV-01 requirement).
- **D-03:** Share sheet import lands as a full-screen modal overlay. On dismiss/cancel, user returns to previous screen.
- **D-04:** Single screenshot at a time — no multi-select batch import.
- **D-05:** Integrated flow: after picking a screenshot, the review screen shows both the image preview and extracted fields together.
- **D-06:** FAB opens import options menu with "Import from Gallery" and "Enter Manually" options.
- **D-07:** Import/review screens are Stack screens within the Investments tab navigator.
- **D-08:** Trade list shows cards with compressed (200x200px) screenshot thumbnails.
- **D-09:** Gallery picker shows all photos, no screenshot filtering. App auto-downscales large images before OCR (max 1200px longest edge).
- **D-10:** Empty state shows "Import your first trade" CTA button + a muted preview/mockup of a trade card.

### OCR Processing UX
- **D-11:** During OCR: show the selected screenshot with a semi-transparent overlay and "Extracting trade data..." progress indicator.
- **D-12:** Cancel button during OCR — returns user to gallery picker.
- **D-13:** On success: brief "Data extracted ✓" confirmation (~1 second), then auto-advance to review screen.
- **D-14:** Generic extraction only — no trading platform detection in Phase 2.
- **D-15:** Show only extracted text values in review — no bounding boxes or highlight overlays on the screenshot.
- **D-16:** OCR attempts to detect buy/sell direction from screenshot text. User can override in review via toggle.
- **D-17:** Auto-clean ticker symbols: uppercase conversion, strip OCR artifacts ($, %, extra spaces). User can correct in review.
- **D-18:** OCR attempts to detect trade date from screenshot. Falls back to today if not found. User can edit.
- **D-19:** ML Kit Text Recognition is the firm OCR engine — no alternatives needed.

### Review/Edit Screen
- **D-20:** Card preview layout — extracted data shown as a "Trade Card" preview. Tap any field to edit inline.
- **D-21:** Trade fields: Ticker, Shares, Price per Share, Trade Date, Direction (buy/sell), Fees (optional).
- **D-22:** All fields required except fees. Inline validation errors shown. Save button disabled until valid.
- **D-23:** Discard button in header/navbar with confirmation dialog: "Discard this trade?"
- **D-24:** Compressed thumbnail (200x200px) saved permanently with trade. Full-resolution image deleted after save.

### OCR Error Handling
- **D-25:** Complete OCR failure: show error message with screenshot preview. Offer "Enter Manually" button that opens review form with empty fields.
- **D-26:** Partial extraction (some fields missing): navigate to review screen. Empty fields highlighted with warning styling.
- **D-27:** Keep failed OCR attempts locally (screenshot + raw text) for debugging and OCR engine improvement. User can clear from settings.
- **D-28:** Manual trade entry available via FAB menu (no screenshot required). Opens review form with empty fields.
- **D-29:** Accept any image format. If format unsupported by OCR, show error at processing time.
- **D-30:** Warn if image exceeds 20MB: "Large image may be slow to process." User can proceed or pick different image.

### Agent's Discretion
- Exact progress indicator design and animation
- Color/warning styling for blank fields in review
- Trade card design details (spacing, typography, layout)
- Processing timeout behavior
- Exact thumbnail compression quality
- Loading skeleton for trade list
</decisions>

<specifics>
## Specific Ideas

- Card preview in review should match the actual trade card design in the list — "what you see is what you get"
- Empty state should show a sample trade card mockup so users understand the value before importing
- Import flow should feel fast and confident — fewest taps possible from gallery to saved trade
</specifics>

<canonical_refs>
## Canonical References

### Project Requirements
- `.planning/PROJECT.md` — Project context, constraints (on-device AI, local-first), key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements (INV-01, INV-02, INV-03), traceability, out of scope
- `.planning/ROADMAP.md` §Phase 2 — Full phase goal, success criteria, dependency graph

### Prior Phase Context
- `.planning/phases/01-shell-expense-tracker/01-CONTEXT.md` — Established patterns: Zustand stores, SQLite migrations, FlatList horizontal, cents storage, InteractionManager for off-thread work

### Research
- `.planning/research/ARCHITECTURE.md` — Project structure, layered architecture, data flow
- `.planning/research/STACK.md` — Expo SDK 52+, recommended OCR packages (expo-image-picker, expo-file-system, expo-sharing, ML Kit)
- `.planning/research/PITFALLS.md` — Performance considerations, OCR accuracy risks with trading screenshots

No external specs — requirements are fully captured in decisions above.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ExpenseStore pattern** (`src/stores/expenseStore.ts`): Template for `tradeStore` — same Zustand + SQLite integration pattern
- **Database service** (`src/services/database.ts`): Trade CRUD follows same row-mapping pattern (snake_case ↔ camelCase)
- **Migration system** (`src/db/schema.ts`): Add v2 migration for `trades` table, same transactional pattern
- **EmptyState component** (`src/components/EmptyState.tsx`): Reusable for zero-trades state
- **ExpenseForm pattern** (`src/components/ExpenseForm.tsx`): Bottom sheet pattern can inform trade review form design
- **ExpenseCard** (`src/components/ExpenseCard.tsx`): Card design patterns (fixed size, shadow, accent border) for TradeCard

### Established Patterns
- Expo Router file-based routing with route groups for tabs
- Zustand stores separated by domain
- expo-sqlite with incrementing migration versions — never drop tables
- Financial values stored as integers (cents)
- FlatList with proper virtualization for scrollable lists
- OCR processing runs off main thread using InteractionManager
- All async operations show loading states

### Integration Points
- **Investments tab** (`src/app/(investments)/_layout.tsx`): Stack navigator — add `import.tsx` and `review.tsx` screens
- **Root layout** (`src/app/_layout.tsx`): Tab registration already exists for investments
- **Types** (`src/types/index.ts`): Add Trade, TradeFormData, OCRResult interfaces
- **Database** (`src/db/schema.ts`): Add migration v2 for trades table
- **Services** (`src/services/database.ts`): Add trade CRUD functions
- **Share sheet**: Configure `app.json` scheme (`financetracker`) and expo-sharing integration
</code_context>

<deferred>
## Deferred Ideas

- Platform-specific layout templates (Robinhood, Webull, eToro) for improved OCR accuracy — v2 requirement INV-06
- Multi-select batch import from gallery — future enhancement
- Live camera capture for screenshots — out of scope
</deferred>

---

*Phase: 02-ocr-pipeline*
*Context gathered: 2026-05-01*
