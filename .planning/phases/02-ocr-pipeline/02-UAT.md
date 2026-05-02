---
status: testing
phase: 02-ocr-pipeline
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md
started: 2026-05-01T17:30:00Z
updated: 2026-05-01T17:30:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running Expo dev server. Clear app data (uninstall/reinstall or clear SQLite). Start the app from scratch. App boots without errors, opens to tab bar with Investments and Expenses tabs visible.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running Expo dev server. Clear app data (uninstall/reinstall or clear SQLite). Start the app from scratch. App boots without errors, opens to tab bar with Investments and Expenses tabs visible.
result: pending

### 2. Trade List — Empty State
expected: Navigate to Investments tab. With zero trades saved, screen shows "Import your first trade" CTA button prominently centered, with a muted trade card preview/mockup below it. No FAB visible.
result: pending

### 3. Import Options Menu (FAB)
expected: After at least one trade is saved, a FAB appears in the Investments tab (bottom-right). Tapping the FAB opens a menu with "Import from Gallery" and "Enter Manually" options.
result: pending

### 4. Gallery Screenshot Pick
expected: From the FAB menu, tap "Import from Gallery". Device gallery opens. Select a trading screenshot. App navigates to the import screen showing the selected image with progress overlay.
result: pending

### 5. OCR Progress UX
expected: After selecting a screenshot, the import screen shows the image with a semi-transparent overlay and "Extracting trade data..." progress indicator. A Cancel button is visible.
result: pending

### 6. Cancel OCR
expected: During OCR processing, tap Cancel. Processing stops and user returns to the gallery picker (or previous screen).
result: pending

### 7. Review Screen — Card Preview
expected: After successful OCR, a brief "Data extracted ✓" confirmation appears, then the review screen loads. Extracted trade data is shown in a card preview layout with fields: Ticker, Shares, Price/Share, Date, Direction, Fees.
result: pending

### 8. Review Screen — Inline Editing
expected: Tap any trade field on the review screen. The field becomes editable. Change the value. Tap away to confirm. The card updates to show the new value.
result: pending

### 9. Review Screen — Validation
expected: Clear the Ticker field (leave it empty). The Save button should become disabled. A validation error (red border or warning icon) appears on the empty field. Re-enter a value to re-enable Save.
result: pending

### 10. Discard Confirmation
expected: On the review screen, tap the Discard/close button in the header. A confirmation dialog appears: "Discard this trade?" with Keep Editing and Discard options. Selecting Discard returns to the trade list.
result: pending

### 11. Save Trade
expected: On the review screen, ensure all required fields have valid values and tap Save. The trade is persisted. User returns to the trade list where the new trade card appears with ticker, direction badge, and thumbnail.
result: pending

### 12. Manual Trade Entry
expected: From the FAB menu, tap "Enter Manually". A full trade form opens with empty fields (Ticker, Shares, Price, Date, Direction toggle, Fees, Notes). No screenshot shown. Fill in fields and save. New trade appears in the list.
result: pending

### 13. TradeCard — Direction Badge
expected: In the trade list, each trade card shows a green "BUY" or red "SELL" badge. Buy trades show green, sell trades show red.
result: pending

### 14. OCR Error Recovery
expected: Import a screenshot that has no trade data (e.g., a photo of a cat). OCR fails. The app shows an error message with the screenshot preview and an "Enter Manually" button. Tapping it opens the manual entry form.
result: pending

## Summary

total: 14
passed: 0
issues: 0
pending: 14
skipped: 0
blocked: 0

## Gaps

[none yet]
