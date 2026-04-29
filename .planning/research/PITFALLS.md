# Pitfalls Research

**Domain:** Mobile Finance Tracker (on-device OCR + expense logging)
**Researched:** 2026-04-29
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: OCR Accuracy on Trading App Screenshots

**What goes wrong:**
Trading app screenshots are dense — multiple numbers, tickers, labels, and formatting.
Generic OCR may extract wrong values (e.g., account balance instead of trade price) or miss fields entirely.

**Why it happens:**
Trading UIs vary wildly per app (Robinhood vs Webull vs eToro). A single OCR model can't handle all layouts without tuning. Text may overlap, fonts may be small, and background colors can confuse contrast-based recognition.

**How to avoid:**
- Use structured extraction: detect known labels ("Shares", "Price", "Total") and extract the number next to them
- Build layout templates per trading app — user selects which app the screenshot is from
- Always show a review step where user confirms extracted data before saving
- Start with 2-3 most common trading apps, expand later

**Warning signs:**
- Extracted values are consistently wrong for one app
- User has to correct every field manually
- OCR returns jumbled text with no clear structure

**Phase to address:**
Phase 2 — OCR Pipeline (build review screen, template system from day one)

---

### Pitfall 2: UI Freezes During OCR Processing

**What goes wrong:**
OCR on a full-resolution screenshot blocks the main thread for 1-5 seconds. The app appears frozen with no loading indicator.

**Why it happens:**
JavaScript-based OCR (Tesseract.js) runs on the JS thread. Even native OCR (ML Kit) needs to transfer image data, which can block if not handled properly. Developers often call OCR directly in component code.

**How to avoid:**
- Show a loading indicator immediately when OCR starts
- Use `InteractionManager.runAfterInteractions` or offload to background
- Downscale images before OCR (screenshots are often 1080x2400 — 300px width is enough for text)
- Process in a web worker if using Tesseract.js

**Warning signs:**
- App hangs for >500ms when importing a screenshot
- No loading spinner during OCR
- Touch events don't respond during processing

**Phase to address:**
Phase 2 — OCR Pipeline (design the processing flow correctly from the start)

---

### Pitfall 3: Nested ScrollView Performance

**What goes wrong:**
Using `ScrollView` instead of `FlatList` for the horizontal card rows causes all cards to render at once. With many expenses, memory balloons and scrolling lags.

**Why it happens:**
`ScrollView` renders all children immediately. For a horizontal row with 50+ expense cards, this means 50+ card components in memory simultaneously. Each row does this.

**How to avoid:**
- Use `FlatList` with `horizontal={true}` for card rows — it virtualizes off-screen items
- The outer vertical list should also be `FlatList` (or SectionList for categories)
- Keep card components lightweight — avoid heavy images or complex layouts inside cards
- Add `getItemLayout` for fixed-height cards to improve scroll performance

**Warning signs:**
- Scrolling becomes janky after adding 20+ expenses to a category
- Memory usage climbs linearly with expense count
- App crashes on older devices with many expenses

**Phase to address:**
Phase 1 — Expense Tracker (design the card row with FlatList from the start)

---

### Pitfall 4: SQLite Schema Rigidity

**What goes wrong:**
Database schema is designed for the initial feature set and can't accommodate new requirements (e.g., adding "fees" field to trades, adding "notes" to expenses) without data loss or complex migrations.

**Why it happens:**
SQLite migrations in mobile apps are often overlooked. Developers alter the schema by dropping and recreating tables, losing user data.

**How to avoid:**
- Define a migration system from day one (incrementing version numbers)
- Use nullable columns for fields that may be added later
- Store flexible data as JSON text columns for extensibility (e.g., `metadata TEXT` on expenses)
- Never drop tables in migrations — use ALTER TABLE ADD COLUMN

**Warning signs:**
- Needing to add a field means "just reset the DB"
- No migration version tracking in the codebase
- User data lost between app updates

**Phase to address:**
Phase 1 — Expense Tracker (set up migration system when creating the database layer)

---

### Pitfall 5: Trade Pairing Logic Bugs

**What goes wrong:**
P&L calculations produce wrong results because buy+sell pairing logic is naive — e.g., FIFO vs LIFO confusion, partial sells not handled, or trades for the same ticker bought at different times.

**Why it happens:**
Trade pairing seems simple ("match a buy with a sell") but edge cases multiply: multiple buys at different prices, partial sells, same-day trades, different accounts.

**How to avoid:**
- Use FIFO (first-in-first-out) pairing — it's the standard for tax reporting
- Track remaining shares per buy lot (not just total)
- Write unit tests for: single buy+single sell, multiple buys+single sell, partial sells, multiple tickers
- Show the pairing logic transparently so users can verify

**Warning signs:**
- P&L changes unexpectedly when a new sell is added
- Negative remaining shares in a lot
- Different P&L from what the trading app shows

**Phase to address:**
Phase 3 — Investment Analytics (core calculation, needs thorough testing)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded trading app layouts | Ships faster | Every new app needs code changes | Only for v1 with 2-3 apps; refactor to template system in v1.x |
| Single Zustand store | Less boilerplate | Everything re-renders on any change | Never for this app — two tabs share nothing |
| No loading states | Less UI code | App feels broken during OCR/DB operations | Never — each async operation needs loading state |
| Inline OCR config | Faster to code | Can't swap OCR engines without refactor | Never — wrap OCR behind a service interface |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| expo-image-picker | Not requesting permissions before picker opens | Check/request permissions first, handle denial gracefully |
| expo-sqlite | Running queries on main thread for large datasets | SQLite is fast enough for single-user app; use transactions for bulk ops |
| ML Kit / Tesseract | Passing full-resolution screenshot | Downscale to max 600px width before OCR |
| expo-sharing (share sheet) | Not handling all file types | Filter incoming shares to images only |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering all cards in horizontal row | Lag when scrolling category with 30+ expenses | FlatList with `horizontal` virtualization | ~20+ cards per category |
| Full-res image in memory during OCR | Memory spike when importing screenshot | Downscale before processing, release URI after | 4K screenshots |
| Re-rendering all categories on any expense change | Jank when adding an expense | Zustand selectors — only re-render changed category | Any change in large dataset |
| SQLite queries in render cycle | Infinite re-render loop | Queries only in store actions, not components | Always if not careful |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing cloud sync tokens in AsyncStorage | Token exposed if device compromised | Use expo-secure-store for credentials |
| No data encryption at rest | SQLite file readable if device rooted | Encrypt sensitive fields, consider SQLCipher |
| Logging extracted financial data | Sensitive info in debug logs | Strip financial values from logs in production |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No OCR review step | Wrong data saved silently, user loses trust | Always show extracted data with edit capability before saving |
| Collapse animation too slow | Feels sluggish, user taps impatiently | Keep animations under 300ms, use native driver |
| No empty states | Blank screens look broken | Show "No expenses yet" / "Import your first trade" with CTA |
| Category creation buried in settings | Users don't discover it | Inline "Add Category" button visible on expense tab |

## "Looks Done But Isn't" Checklist

- [ ] **Expense CRUD:** Often missing edit/delete — verify all three operations work
- [ ] **Category toggle:** Often missing collapse animation — verify smooth expand/collapse
- [ ] **OCR import:** Often skips error handling — verify graceful failure on non-trading screenshots
- [ ] **Screenshot share sheet:** Often missing on Android — verify both platforms receive intent
- [ ] **Data persistence:** Often skips app restart test — verify data survives force quit

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| OCR accuracy | Phase 2 | Test with real screenshots from 3+ trading apps |
| UI freezes during OCR | Phase 2 | Profile with React DevTools, ensure <16ms frame time |
| Nested ScrollView performance | Phase 1 | Test with 100+ expenses, measure scroll FPS |
| SQLite schema rigidity | Phase 1 | Verify migration system works on schema change |
| Trade pairing bugs | Phase 3 | Unit test edge cases (partial sells, multiple buys) |

---
*Pitfalls research for: Finance Tracker mobile app*
*Researched: 2026-04-29*
