# Phase 4: Cloud Sync - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Optional cloud backup and automatic background sync using Google Drive. Includes Google Sign-In, background sync logic using timestamps (Last Write Wins), and UI for managing sync in Settings. Does NOT include real-time multi-user collaboration or multi-cloud support (Drive only).
</domain>

<decisions>
## Implementation Decisions

### Cloud Provider & Storage
- **D-01:** Use **Google Drive** for both Android and iOS to ensure cross-platform data mobility.
- **D-02:** Use the **App Data Folder** (`appDataFolder` scope). This ensures the backup files are private to the app and hidden from the user's general Drive view.
- **D-03:** Data format: Store table exports as JSON files in Drive. This is more resilient than syncing the raw binary SQLite file during background operations.

### Sync Logic
- **D-04:** **Automatic Background Sync**: Trigger sync on app start, app backgrounding, and after significant data changes (e.g., adding an investment).
- **D-05:** **Conflict Resolution: Last Write Wins (LWW)**. Use the existing `updated_at` ISO timestamps in SQLite to determine the latest version of each record.
- **D-06:** **Granular Sync**: Sync at the record level (Categories, Expenses, Trades, Current Prices).

### User Experience
- **D-07:** **Opt-in Flow**: Sync is disabled by default. User must enable it in the Settings screen.
- **D-08:** **Onboarding Prompt**: On a fresh install (detected via local storage flag), show a subtle in-app notification/banner: "Existing data found in Drive. Restore now?".
- **D-09:** **Sync Status**: Display "Last synced: [Date/Time]" and a "Sync Now" button in the Settings screen.
- **D-10:** **Best Practice Indicators**: Show a small, non-intrusive activity indicator (e.g., a dot or tiny icon in the header) only when a sync is actively in progress.

### Technical Stack
- **D-11:** Use `expo-auth-session` with Google for authentication.
- **D-12:** Use Google Drive REST API for file operations.
- **D-13:** Maintain a `sync_log` in local storage to track the last successful sync timestamp per table.

### the agent's Discretion
- Exact polling frequency for background sync (suggested: every 15-30 mins if data changed).
- UI design for the "Restore" banner/notification.
- Exact icon/animation for the header sync indicator.
- Error handling UI (e.g., "Sign-in required" or "Storage full").
</decisions>

<specifics>
## Specific Ideas

- Use a "Manifest" file in Drive to track table versions and total records to speed up comparison before downloading full JSON files.
- Ensure the "Restore" prompt is only shown once per fresh install to avoid annoyance.
- Settings screen should clearly show the logged-in Google account email.
</specifics>

<canonical_refs>
## Canonical References

### Project Requirements
- `.planning/PROJECT.md` — Project constraints (privacy, local-first)
- `.planning/REQUIREMENTS.md` — DATA-02 (optional cloud sync)

### Prior Phase Context
- `.planning/phases/01-shell-expense-tracker/01-CONTEXT.md` — Settings screen placeholder
- `src/db/schema.ts` — SQLite schema with `updated_at` timestamps

### Source Code
- `src/app/settings.tsx` — Settings UI implementation point
- `src/services/database.ts` — Existing DB operations
- `src/stores/settingsStore.ts` — (To be created) for sync state
</canonical_refs>

<deferred>
## Deferred Ideas

- Biometric lock for cloud sync settings — deferred
- Data encryption before upload — deferred (using Drive's built-in encryption for now)
- Auto-sync toggle for Cellular vs. Wi-Fi — deferred
</deferred>

---

*Phase: 04-cloud-sync*
*Context gathered: 2026-05-02*
