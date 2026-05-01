---
status: complete
completed: 2026-05-01
---
# Summary: Direct Gallery + Manual Entry Buttons

**File changed:** `src/app/(investments)/index.tsx`

**Changes:**
- Added `expo-image-picker` import for direct gallery access
- `handleGalleryImport`: opens gallery, passes URI to import screen (skips idle state)
- `handleManualEntry`: navigates directly to manual entry form
- Empty state: two full-width buttons — "Import Screenshot" (primary) + "Enter Manually" (secondary outline)
- FAB: Alert menu with both options
- TypeScript passes
