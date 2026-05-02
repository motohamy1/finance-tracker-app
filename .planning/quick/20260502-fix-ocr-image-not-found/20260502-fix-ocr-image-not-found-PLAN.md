---
status: in-progress
created: 2026-05-02
---
# Fix "Image file not found" error when importing screenshots

`processScreenshot` in `src/services/ocr.ts` calls `FileSystem.getInfoAsync(imageUri)` to validate the file exists, but URIs from `expo-image-picker` (especially `content://` URIs on Android) can fail this check even when the image is valid.

**Root cause:** Temporary/content:// URIs aren't always accessible through `expo-file-system`'s `getInfoAsync`. The image exists but the URI format doesn't resolve through the file system API.

**Fix:** Copy the image to the app's cache directory at the start of `processScreenshot`, before validation. This ensures a stable `file://` URI for all subsequent operations.

**Files:**
- `src/services/ocr.ts` — Add cache copy step at start of `processScreenshot`; clean up cached file at end
- `src/__tests__/ocr.test.ts` — Update mocks to include `copyAsync` and `cacheDirectory`
- `src/app/(investments)/import.tsx` — Import `copyAsync` since it may need it for the pickFromGallery flow (but actually no — the fix is purely in ocr.ts)
