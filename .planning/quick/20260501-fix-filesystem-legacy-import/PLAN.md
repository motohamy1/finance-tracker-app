---
status: complete
created: 2026-05-01
---
# Fix expo-file-system deprecated import

`getInfoAsync` and `deleteAsync` are deprecated in expo-file-system. Migrate imports to use the legacy API path.

**Files:**
- `src/app/(investments)/import.tsx` — `expo-file-system` → `expo-file-system/legacy`
- `src/services/ocr.ts` — same fix
- `src/__tests__/ocr.test.ts` — update mock path
