---
status: complete
created: 2026-05-01
---
# Fix Card Spacing

Align the BalanceCard (bank-like card) padding with the category grid boxes.

**Problem 1:** BalanceCard had `paddingBottom: 0`, sticking against category grid cards below.
**Fix:** Changed `paddingBottom` from `0` to `16` in `BalanceCard.tsx`.

**Problem 2:** BalanceCard had `paddingHorizontal: 12` plus FlatList's `contentContainerStyle.padding: 12` = 24px effective, while grid cards had only 12px. Cards looked misaligned.
**Fix:** Set `paddingHorizontal: 0` on BalanceCard (letting FlatList's 12px cover both). Wrapped BalanceCard in padding in the empty-state case where no FlatList exists.
