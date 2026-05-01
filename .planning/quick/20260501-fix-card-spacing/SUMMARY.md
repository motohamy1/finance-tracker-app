---
status: complete
completed: 2026-05-01
---
# Summary: Fix Card Spacing

**Files changed:**
- `src/components/BalanceCard.tsx` — `paddingBottom: 0→16`, `paddingHorizontal: 12→0`
- `src/app/(expenses)/index.tsx` — Wrapped BalanceCard with `paddingHorizontal: 12` in empty state

**Result:** BalanceCard and category grid share identical 12px horizontal padding. 16px bottom spacing between them. TypeScript passes.
