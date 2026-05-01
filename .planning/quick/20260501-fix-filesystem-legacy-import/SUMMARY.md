---
status: complete
completed: 2026-05-01
---
# Summary: Fix expo-file-system deprecated import

**Files changed:**
- `src/app/(investments)/import.tsx` — import path updated
- `src/services/ocr.ts` — import path updated
- `src/__tests__/ocr.test.ts` — mock path updated

**Result:** `getInfoAsync` and `deleteAsync` now import from `expo-file-system/legacy`. TypeScript passes, 82/82 tests pass.
