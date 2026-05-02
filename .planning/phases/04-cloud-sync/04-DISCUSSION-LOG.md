# Phase 4: Cloud Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 04-cloud-sync
**Areas discussed:** Cloud Provider, Sync Strategy, Conflict Resolution, UI/UX

---

## Cloud Provider

| Option | Description | Selected |
|--------|-------------|----------|
| Google Drive / iCloud | Platform-native (personal cloud) | |
| Firebase | Centralized database (Firestore) | |
| Google Drive (Unified) | Google Drive for both Android and iOS | ✓ |

**Decision:** Google Drive (Unified) selected for privacy and cross-platform mobility. Using `appDataFolder` scope.

---

## Sync Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Manual Backup | User uploads/downloads DB snapshot | |
| Automatic Sync | Background sync of data changes | ✓ |

**Decision:** Automatic Sync in background to ensure data is always fresh.

---

## Conflict Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Last Write Wins | Newest timestamp replaces older record | ✓ |
| Incremental Merge | Complex record merging | |
| Manual Resolution | Prompt user on conflict | |

**Decision:** Last Write Wins (LWW) based on `updated_at` ISO timestamps. Simple and effective for a single-user app.

---

## UI / UX

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-Restore | Restore immediately on fresh install | |
| Opt-in via Settings | Wait for user to enable, then prompt | ✓ |

**Decision:** Wait for user to enable in settings, but show a proactive notification/banner if data is detected in Drive on a fresh install.

---

## Implementation Details

- **Best Practices:** Implement sync status indicator in header (active only).
- **Security:** Use `appDataFolder` scope so backup files are hidden from the user's main Drive.

---

*Phase: 04-cloud-sync*
*Log updated: 2026-05-02*
