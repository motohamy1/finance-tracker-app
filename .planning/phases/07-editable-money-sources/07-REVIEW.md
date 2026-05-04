---
phase: 07-editable-money-sources
reviewed: 2026-05-04T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/db/schema.ts
  - src/services/database.ts
  - src/types/index.ts
  - src/stores/expenseStore.ts
  - src/components/MoneySourceCard.tsx
  - src/components/MoneySourceRow.tsx
  - src/components/TotalBalanceSummary.tsx
  - src/components/ExpenseForm.tsx
  - src/components/ExpenseCard.tsx
  - src/app/(expenses)/index.tsx
findings:
  critical: 3
  warning: 6
  info: 4
  total: 13
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the money source editing feature implementation spread across database schema (migration v5), service layer, Zustand store, and four UI components plus the expense screen. The overall architecture is sound — SQLite ON DELETE SET NULL for foreign keys, camelCase/snake_case row mapping, and Zustand state management follow established project patterns. However, **three BLOCKER-level bugs** were found: the money source creation sheet is non-functional (text input missing), category renaming is silently broken on Android, and `setTimeout` usage in `MoneySourceCard` lacks cleanup, risking state corruption on rapid input. Several WARNING-level issues involve state inconsistency after deletions, module-level `Dimensions.get`, and type safety gaps.

---

## Critical Issues

### CR-01: Money Source Creation Sheet is Non-Functional (Missing TextInput)

**File:** `src/components/MoneySourceRow.tsx:62-74`
**Issue:** The `CreationSheet` component uses a `<Text>` component styled as an input instead of an actual `<TextInput>`. The comment on line 69 reads "Focus handled by TextInput in real app; simplified for testability" — but this is production code. The `name` state is initialized to `''` and never updated by user input (no `onChangeText` handler exists). The `handleCreate` callback checks `!name.trim()` which is always true, so the Create button is **permanently disabled**. Users cannot create any money sources. The entire `MoneySourceRow` "Add Money Source" flow is dead.

**Fix:**
```tsx
// Replace the <Text> on lines 66-73 with:
<TextInput
  style={[styles.nameInput, !name && styles.placeholder]}
  placeholder="Source name"
  placeholderTextColor="#94A3B8"
  value={name}
  onChangeText={setName}
  autoFocus
/>
```

---

### CR-02: Category Rename Silently Broken on Android

**File:** `src/app/(expenses)/index.tsx:73-77`
**Issue:** `Alert.prompt` is an **iOS-only** API. On Android, `Alert.prompt` evaluates to `undefined` (falsy), causing `renameAction` to return `null` — the rename silently does nothing. This affects the category long-press flow on Android (`Alert.alert` on line 98 calls `renameAction` as the "Rename" button handler). Category renaming is completely broken on Android.

**Fix:**
```tsx
const renameAction = () => {
  if (Platform.OS === 'ios') {
    Alert.prompt('Rename Category', undefined, (newName) => {
      if (newName?.trim()) renameCategory(category.id, newName.trim());
    }, 'plain-text', category.name);
  } else {
    // Android fallback: use a prompt-based approach or inline TextInput modal
    // For now, fall back to a simple alert since Alert.prompt doesn't exist on Android
    alert('Rename Category', 'Android rename support coming soon.');
    // TODO: Implement platform-agnostic rename (inline edit or custom modal)
  }
};
```

**Alternative Fix (full platform-agnostic):** Use `Alert.alert` with a cancel button pattern, or implement an inline rename by toggling a `TextInput` in the category header, similar to how `MoneySourceCard` handles name editing via `isEditingName` state.

---

### CR-03: Unclean `setTimeout` Usage — Memory Leak and State Corruption Risk

**File:** `src/components/MoneySourceCard.tsx:86-97`
**Issue:** Two nested `setTimeout` calls inside `validateAndSave` have no cleanup:
- Line 86: 50ms delay starts a reverse animation
- Line 94: 500ms delay resets `editValue` and `setIsInvalid(false)`

**Three concrete problems:**
1. **Memory leak:** If the component unmounts (card deleted or FlatList recycles), the timeouts still fire, calling `setState` on an unmounted component (React warning, React Native may crash).
2. **Overlapping timeouts on rapid input:** If the user triggers invalid input twice within 500ms, the second reset timeout (at ~600ms from first) overwrites the `editValue` while the user may have already corrected it.
3. **Stale closure:** The 500ms timeout uses `source.balanceCents` captured from the time of `validateAndSave` creation. If the balance was changed from another card or store action in the meantime, the reset will revert `editValue` to a stale value.

**Fix:**
```tsx
// Store timeout refs for cleanup
const invalidTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (invalidTimeoutRef.current) clearTimeout(invalidTimeoutRef.current);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
  };
}, []);

const validateAndSave = useCallback((value: string) => {
  const trimmed = value.trim();
  if (trimmed === '') {
    updateMoneySourceBalance(source.id, 0);
    exitEditMode();
    return;
  }
  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) {
    setIsInvalid(true);
    Animated.timing(invalidAnim, {
      toValue: 1, duration: 0, useNativeDriver: false,
    }).start();
    
    // Clear any existing timeouts
    if (invalidTimeoutRef.current) clearTimeout(invalidTimeoutRef.current);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    
    invalidTimeoutRef.current = setTimeout(() => {
      Animated.timing(invalidAnim, {
        toValue: 0, duration: ANIMATION_DURATION, useNativeDriver: false,
      }).start(() => setIsInvalid(false));
    }, 50);
    
    resetTimeoutRef.current = setTimeout(() => {
      // Use ref to access latest balanceCents to avoid stale closure
      setEditValue(prevValue => {
        // Only reset if still in editing mode and value hasn't changed
        return prevValue;
      });
      setIsInvalid(false);
    }, 500);
    return;
  }
  // ... rest of valid path
}, [source.id, updateMoneySourceBalance, invalidAnim, exitEditMode]);
```

---

## Warnings

### WR-01: Stale `moneySourceId` in In-Memory Expenses After Money Source Deletion

**File:** `src/stores/expenseStore.ts:236-242`
**Issue:** When `removeMoneySource` is called, the DB cascade (`ON DELETE SET NULL`) correctly nullifies `expenses.money_source_id` for linked expenses. However, the Zustand store only updates `moneySources` by filtering out the deleted item — it does **not** refresh `expensesByCategory`. In-memory `Expense` objects retain their old `moneySourceId`. This creates state inconsistency between DB (null) and store (stale ID).

In practice, `ExpenseCard` handles this gracefully (the `moneySources.find(...)` returns `undefined`, which is falsy, so the money source chip doesn't render). However, any code that checks `expense.moneySourceId` for existence would incorrectly believe the expense is still linked. If the store is re-initialized (app restart), the expenses will show `moneySourceId: null`, revealing the inconsistency.

**Fix:** After deleting a money source, refresh the affected expenses:
```typescript
removeMoneySource: (id) => {
    deleteMoneySource(id);
    // Refresh expenses to reflect ON DELETE SET NULL cascade
    const state = get();
    const updatedExpensesByCategory: Record<string, Expense[]> = {};
    for (const catId of Object.keys(state.expensesByCategory)) {
      updatedExpensesByCategory[catId] = state.expensesByCategory[catId].map(expense =>
        expense.moneySourceId === id
          ? { ...expense, moneySourceId: null }
          : expense
      );
    }
    set({
      moneySources: state.moneySources.filter((s) => s.id !== id),
      expensesByCategory: updatedExpensesByCategory,
    });
},
```

---

### WR-02: `MONEY_SOURCE_CARD_WIDTH` Computed at Module Init — Stale on Orientation Change

**File:** `src/components/MoneySourceCard.tsx:21-24`
**Issue:** `Dimensions.get('window')` is called at module import time (top-level), not at component render time. If the device orientation changes (tablet rotation, foldable screen unfold), or if React Native hasn't fully initialized at module load time, the width value will be stale (potentially 0 or outdated). This affects the FlatList's `snapToInterval` calculation in `MoneySourceRow` which depends on this exported constant.

**Fix:** Use `useWindowDimensions()` hook or a state-based approach:
```tsx
// At module level, provide a sensible default
const DEFAULT_CARD_WIDTH = Math.min(
  Dimensions.get('window').width - 48,
  300,
);

// In the component:
import { useWindowDimensions } from 'react-native';

export function MoneySourceCard(props: MoneySourceCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 300);
  // ... use cardWidth for styling
}
```

Alternatively, compute the width inside the component using `useWindowDimensions()` and pass it down, or use `onLayout` to measure dynamically.

---

### WR-03: `useCallback` Stale Closure in `validateAndSave`'s Reset Timeout

**File:** `src/components/MoneySourceCard.tsx:94-97`
**Issue:** The 500ms reset timeout unconditionally sets `editValue` to `(source.balanceCents / 100).toFixed(2)`. If the user has since corrected their input (within 500ms), the timeout will overwrite their correction. Additionally, if `source.balanceCents` changed via another action (e.g., another card editing the same source's balance), the reset uses a stale value from when `validateAndSave` was created (captured in `useCallback` deps at `[source.id, source.balanceCents, ...]`).

**Fix:** Track whether a user correction has occurred with a ref, or clear the reset timeout when the user makes any new input change. See CR-03 fix above for the full solution.

---

### WR-04: No Validation on Negative `balanceCents`

**File:** `src/stores/expenseStore.ts:218-225`
**Issue:** `updateMoneySourceBalance` accepts any `number` for `balanceCents` without validation. The DB schema has no `CHECK(balance_cents >= 0)` constraint. A negative balance (e.g., from an incorrectly typed value or a bug) would propagate to `TotalBalanceSummary` and produce misleading totals. Additionally, `formatCurrency` would display negative values as `$-15.00` instead of `-$15.00`.

**Fix:** Add a validation guard:
```typescript
updateMoneySourceBalance: (id, balanceCents) => {
    if (typeof balanceCents !== 'number' || isNaN(balanceCents)) return;
    // Optional: clamp to reasonable range
    const clamped = Math.max(-999999999, Math.min(999999999, Math.round(balanceCents)));
    updateMoneySource(id, { balanceCents: clamped });
    set({
      moneySources: get().moneySources.map((s) =>
        s.id === id ? { ...s, balanceCents: clamped, updatedAt: new Date().toISOString() } : s
      ),
    });
},
```

---

### WR-05: `source.iconName as any` Bypasses Type Safety

**File:** `src/components/MoneySourceCard.tsx:257`
**Issue:** `Ionicons`' `name` prop expects `keyof typeof Ionicons.glyphMap`. Casting to `any` suppresses TypeScript errors. If an invalid or empty icon name is stored in the database (e.g., from a future version that changes icon names), the icon will silently render nothing.

**Fix:** Validate and provide a fallback:
```tsx
import type { Ionicons } from '@expo/vector-icons';

// Valid icon name fallback
const VALID_ICON_NAMES = ['wallet-outline', 'cash-outline', 'business-outline', 
  'trending-up-outline', 'card-outline', 'wallet', 'cash'];

function isValidIconName(name: string): name is keyof typeof Ionicons.glyphMap {
  return VALID_ICON_NAMES.includes(name);
}

// In JSX:
<Ionicons
  name={isValidIconName(source.iconName) ? source.iconName : 'wallet-outline'}
  size={24}
  color="rgba(255,255,255,0.9)"
/>
```

---

### WR-06: DB Query in FlatList `renderItem` Path

**File:** `src/components/MoneySourceRow.tsx:153`
**Issue:** `getMoneySourceExpenseCount(item.id)` queries SQLite synchronously inside `renderItem`. For large money source lists, repeated `COUNT(*)` queries during scroll can block the UI thread. The store already has `expensesByCategory` in memory — the expense count could be derived from that instead without hitting the DB.

**Fix:** Add a derived helper in the store or compute from `expensesByCategory`:
```typescript
// In the store:
getMoneySourceExpenseCount: (moneySourceId) => {
    let count = 0;
    const expensesByCategory = get().expensesByCategory;
    for (const expenses of Object.values(expensesByCategory)) {
      count += expenses.filter(e => e.moneySourceId === moneySourceId).length;
    }
    return count;
},
```

---

## Info

### IN-01: Debug Artifacts in Migration Code

**File:** `src/db/schema.ts:144,147`
**Issue:** `console.log` and `console.error` statements in production migration code. These should use a proper logging abstraction or be removed.

**Fix:** Replace with a conditional logger or remove in production:
```typescript
if (__DEV__) console.log(`✓ Migration ${migration.version}: ${migration.name} applied`);
```

---

### IN-02: Incomplete Implementation Comment

**File:** `src/components/MoneySourceCard.tsx:199`
**Issue:** Comment reads "In a real app, this would show a color palette sheet. For now, cycle to the next color in the palette." This indicates the color change feature is incomplete.

**Fix:** Either implement the color palette sheet or remove the TODO-style comment and treat cycling as the intended behavior.

---

### IN-03: Inline Style Objects in Expenses Screen

**File:** `src/app/(expenses)/index.tsx:169,171,173,194,207,223`
**Issue:** Multiple inline style objects (e.g., `style={{ flex: 1 }}`) create new object references on every render. While not a performance crisis, extracting to `StyleSheet.create` is the project convention and avoids unnecessary child re-renders when using `React.memo`.

**Fix:** Extract static inline styles to the `styles` StyleSheet constant.

---

### IN-04: Inline Style in ExpenseForm

**File:** `src/components/ExpenseForm.tsx:154`
**Issue:** Inline style `{{ color: '#0891B2', fontWeight: '600' }}` should be extracted to `StyleSheet.create` for consistency with the project's styling conventions.

**Fix:** Add a named style in the StyleSheet constant.

---

_Reviewed: 2026-05-04T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
