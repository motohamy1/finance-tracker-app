---
status: testing
phase: 01-shell-expense-tracker
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-04-29T00:00:00Z
updated: 2026-04-29T00:00:00Z
---

## Current Test

number: 3
name: Create Category
expected: |
  Tap "Create Category". A new category appears with a color dot, name,
  "0 items" count, and a chevron icon. Color cycles through the palette.
awaiting: user response

## Tests

### 1. App Launch and Splash Screen
expected: Open the app. Branded splash screen with "Finance Tracker" text and spinner appears during DB init, then transitions to three-tab layout (Expenses, Investments, Settings).
result: pass

### 2. Empty State — Zero Categories
expected: On first launch with no categories, the Expenses tab shows a wallet icon, "Start Tracking" heading, description text, and a "Create Category" CTA button.
result: pass

### 3. Create Category
expected: Tap "Create Category". A new category appears with a color dot, name, "0 items" count, and a chevron icon. Color cycles through the palette.
result: issue
reported: "no option to put the Title of the new category"
severity: major
fix: "Added inline TextInput for category name on both empty state and bottom Create Category button" (commit e8f6bfc)

### 4. Category Expand/Collapse
expected: Tapping a category header toggles it open/closed with a smooth 250ms animation. Chevron flips up/down. When open, the category shows either an empty "Add an expense" placeholder card (dashed border, plus icon) or expense cards if any exist.
result: pending

### 5. Add Expense — Bottom Sheet Form
expected: Tapping the FAB (+) button or the "Add an expense" placeholder card opens a bottom sheet modal. It shows: Category dropdown (pre-selected), Title field (placeholder "What did you spend on?"), Amount field with $ prefix and decimal keyboard, Date field (defaults to today), Notes field (optional, "Add a note (optional)"), and a "Save Expense" button.
result: pending

### 6. Save Expense — Card Appears
expected: Filling in title and amount (e.g., "Coffee" and "4.50"), tapping "Save Expense" closes the form. The category now shows "1 items" and an expense card appears in the horizontal row showing "Coffee", "$4.50" (large bold), and today's date.
result: pending

### 7. Expense Card Display
expected: Each card is a fixed-width card (white background, rounded corners, shadow) with a 3px left border matching the category's accent color. Layout: title at top (14px semibold), amount in the middle (28px bold), date at bottom (12px regular).
result: pending

### 8. Edit Expense
expected: Long-press an expense card. A menu appears with "Edit" and "Delete" options (ActionSheet on iOS, alert dialog on Android). Select "Edit" — the bottom sheet reopens pre-filled with the expense's data. Change a field, tap "Save Changes" — the card updates.
result: pending

### 9. Delete Expense
expected: Long-press a card, select "Delete". A native alert appears: "Delete Expense?" with "This action cannot be undone." and Cancel/Delete buttons. Tapping "Delete" removes the card and updates the item count.
result: pending

### 10. Drag to Reorder Categories
expected: Long-press and drag a category header to reorder. Categories reorder visually and the new order persists after app restart.
result: pending

### 11. Investments Tab
expected: Tap the Investments tab. Shows a chart/trending-up icon, "Coming Soon" heading, and description text: "Track your investments with smart screenshot OCR. Buy, sell, profit — all extracted automatically."
result: pending

### 12. Settings Tab
expected: Tap the Settings tab. Shows a settings icon, "Settings" heading, and text: "Cloud sync and preferences will be available in a future update."
result: pending

### 13. Data Persistence (Cold Restart)
expected: Add some categories and expenses. Force-quit the app and reopen. All categories, expenses, and their ordering should be restored exactly as they were.
result: pending

## Summary

total: 13
passed: 2
issues: 0
pending: 11
skipped: 0

## Gaps

[none yet]
