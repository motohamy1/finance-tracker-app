---
status: complete
created: 2026-05-01
---
# Direct Gallery + Manual Entry Buttons

**Problem:** "Import Screenshot" navigated to import screen first, then user had to tap again to open gallery. Manual entry was hidden behind FAB menu only.

**Fix:**
- "Import Screenshot" opens gallery picker directly (skips import screen idle state)
- "Enter Manually" button shown prominently alongside "Import Screenshot" in empty state
- FAB opens Alert menu with "Import from Gallery" + "Enter Manually"
- After picking from gallery, navigates to import screen with `sharedImageUri` param (skips idle, goes straight to processing)
