---
status: complete
created: 2026-05-01
---
# Fix Card Spacing

Add padding between the BalanceCard (bank-like card) and the category grid boxes below it.

**Problem:** The BalanceCard used as `ListHeaderComponent` in the expenses FlatList had `paddingBottom: 0`, so it visually stuck against the category grid cards with no breathing room.

**Fix:** Changed `paddingBottom` from `0` to `16` in `BalanceCard.tsx` container style to create visual separation.
