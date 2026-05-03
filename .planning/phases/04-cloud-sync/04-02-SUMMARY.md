---
phase: 04-cloud-sync
plan: 02
subsystem: sync-engine, state
tags: [lww-merge, bidirectional-sync, zustand, app-lifecycle, restore, json-export]
requires: [04-01]
provides:
  - exportTableToJSON: synchronous export of any syncable table to JSON array
  - syncAll: full bidirectional sync with LWW conflict resolution via updatedAt timestamps
  - restoreAll: atomic import from Drive with transaction rollback
  - checkRestoreAvailable: fresh install detection for existing Drive data
  - getLastSyncTimes: AsyncStorage-persisted per-table sync log retrieval
  - useSettingsStore: Zustand store with auth, sync toggle, syncNow, doRestore, initialize
affects: [04-03-sync-ui]

tech-stack:
  added: []
  patterns:
    - LWW merge via ISO 8601 updatedAt string comparison (lexicographic = chronological)
    - INSERT OR REPLACE with BEGIN/COMMIT/ROLLBACK transactions for atomic import
    - camelCase → snake_case key mapping for TypeScript ↔ SQLite column conversion
    - Zustand v5 create<T>() pattern with get() for current state access
    - AppState.addEventListener for background sync triggering
    - AsyncStorage for persistent sync logs and device ID

key-files:
  created:
    - src/services/sync.ts
    - src/stores/settingsStore.ts
  modified:
    - src/app/_layout.tsx

key-decisions:
  - "LWW merge uses string comparison on ISO 8601 updatedAt timestamps — lexicographic order is chronological"
  - "Import uses DELETE ALL + INSERT OR REPLACE in a single transaction per table (atomic)"
  - "getAllExpenses() helper flattens expenses from all categories (database.ts lacks a direct export)"
  - "Device ID generated once via generateUUID() and persisted in AsyncStorage for manifest consistency"
  - "App-start sync delayed 2 seconds to avoid splash screen contention"
  - "Background sync gated by isSyncEnabled + isAuthenticated + !isSyncing (triple gate)"

requirements-completed: [DATA-02]

metrics:
  duration: 635
  completed: 2026-05-03
  tasks: 3
  files_modified: 3
---

# Phase 4 Plan 2: Sync Engine — Bidirectional LWW Merge, Zustand Store, and App Lifecycle Triggers

**Core sync logic with Last Write Wins conflict resolution, Zustand state management, and automatic background sync via AppState lifecycle hooks**

## Performance

- **Duration:** ~10.5 min (635s)
- **Started:** 2026-05-03T21:11:50Z
- **Completed:** 2026-05-03T21:22:25Z
- **Tasks:** 3
- **Files:** 3 (2 created, 1 modified)

## Accomplishments

- `src/services/sync.ts` (484 lines): Complete sync engine with 5 exports — `exportTableToJSON`, `syncAll`, `restoreAll`, `checkRestoreAvailable`, `getLastSyncTimes`
- `src/stores/settingsStore.ts` (311 lines): Zustand store with 8 actions — `initialize`, `login`, `logout`, `setSyncEnabled`, `syncNow`, `doRestore`, `dismissRestorePrompt`, `refreshSyncLogs`
- `src/app/_layout.tsx` (+40 lines): App lifecycle sync hooks — settings store initialization on mount, background sync via AppState listener, delayed startup sync

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build sync engine | `8093f5e` | `src/services/sync.ts` (created) |
| 2 | Create Zustand settingsStore | `1773990` | `src/stores/settingsStore.ts` (created) |
| 3 | Wire sync triggers into app layout | `ec437e6` | `src/app/_layout.tsx` (modified) |

## Files Created/Modified

- `src/services/sync.ts` — Sync engine: export, upload, download, LWW merge, import, restore orchestration (484 lines)
- `src/stores/settingsStore.ts` — Zustand store for sync state: auth, toggle, status, timestamps, restore detection (311 lines)
- `src/app/_layout.tsx` — App lifecycle sync triggers: init on mount, background sync listener, delayed startup sync (+40 lines)

## Architecture

### Sync Engine (`src/services/sync.ts`)

**5 exported functions:**

| Function | Type | Purpose |
|----------|------|---------|
| `exportTableToJSON(table)` | Sync | Export 4 tables to camelCase JSON arrays |
| `syncAll()` | Async | Full bidirectional sync with LWW merge |
| `restoreAll()` | Async | Download + atomic import from Drive |
| `checkRestoreAvailable()` | Async | Detect existing Drive data for fresh install prompt |
| `getLastSyncTimes()` | Async | Read per-table sync logs from AsyncStorage |

**LWW Merge Logic (D-05):**
1. Build `Map<id, record>` from local data (uses `ticker` as id for current_prices)
2. For each remote record: compare `updatedAt` ISO timestamps
3. If `remote.updatedAt > local.updatedAt` → replace with remote (newer version wins)
4. If not in local → add (new record from another device)
5. Local-only records stay (new local records)

**Atomic Import (T-04-10):**
- `BEGIN TRANSACTION` → `DELETE FROM {table}` → `INSERT OR REPLACE` for each record → `COMMIT`
- On failure: `ROLLBACK` — no partial state
- `camelToSnake()` helper converts TypeScript keys to SQLite column names

**Drive Integration:**
- Downloads manifest and per-table JSON files via `downloadManifest()` + `listSyncFiles()` + `downloadJSON()`
- Uploads merged data with file ID tracking (POST for new, PATCH for existing)
- Creates/updates `sync/manifest.json` with per-table record counts and device ID

### Settings Store (`src/stores/settingsStore.ts`)

**State fields (7):** `isAuthenticated`, `isSyncEnabled`, `isSyncing`, `lastSyncAt`, `lastSyncError`, `googleEmail`, `restoreAvailable`, `syncLogs`

**Actions (8):**
- `initialize()` — Checks auth, loads sync logs, detects restore availability
- `login()` / `logout()` — Wraps auth service with state updates
- `setSyncEnabled(enabled)` — Toggle (D-07: disabled by default)
- `syncNow()` — Manual sync with `isSyncing` concurrency gate
- `doRestore()` — Restore from Drive with progress tracking
- `dismissRestorePrompt()` — One-time dismiss (D-08)
- `refreshSyncLogs()` — Reload from AsyncStorage

### App Lifecycle (`src/app/_layout.tsx`)

**Sync triggers (D-04):**
1. **App start:** `settingsStore.initialize()` runs after DB migrations (non-blocking)
2. **Delayed sync:** If `isSyncEnabled && isAuthenticated`, sync fires 2s after mount (avoids splash screen contention)
3. **Background sync:** `AppState.addEventListener('change')` triggers `syncNow()` when app goes to background
4. **Triple gate:** All syncs require `isSyncEnabled && isAuthenticated && !isSyncing`

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed with 100% acceptance criteria compliance.

## Verification Summary

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 5 exports in sync.ts | ✅ | `grep -c` returns 5 |
| LWW uses updatedAt | ✅ | 9 references to `updatedAt` |
| INSERT OR REPLACE import | ✅ | Transaction-based import with ROLLBACK |
| LWW documented | ✅ | 9 references to LWW/Last Write Wins |
| Atomic transactions | ✅ | BEGIN TRANSACTION + ROLLBACK present |
| Manifest handling | ✅ | Both uploadManifest + downloadManifest used |
| settingsStore export | ✅ | `export const useSettingsStore` present |
| All 8 actions | ✅ | login, logout, setSyncEnabled, syncNow, doRestore, dismissRestorePrompt, initialize, refreshSyncLogs |
| D-07: disabled by default | ✅ | `isSyncEnabled: false` in initial state |
| All state fields | ✅ | 7 fields match SyncState interface |
| AppState listener | ✅ | `AppState.addEventListener('change', ...)` present |
| syncNow in layout | ✅ | 2 syncNow() calls (background + delayed startup) |
| settingsStore.initialize() | ✅ | Called in init() after DB migrations |
| Tab structure preserved | ✅ | 3 Tabs.Screen entries unchanged |
| Splash screen preserved | ✅ | 3 SplashScreen references unchanged |
| TypeScript compilation | ✅ | `npx tsc --noEmit` exits 0 |

## Threat Mitigation Summary

All 6 mitigations from the plan's threat model are implemented:

| Threat | Status | Implementation |
|--------|--------|---------------|
| T-04-07 (JSON tampering) | ✅ | Financial values preserved as INTEGER cents — no float conversion |
| T-04-08 (LWW tampering) | ✅ | ISO 8601 string comparison — deterministic, monotonic for chronological order |
| T-04-09 (Info disclosure) | ✅ Accepted | JSON in appDataFolder (hidden); Google encrypts at rest; v1 no app-level encryption |
| T-04-10 (Restore rollback) | ✅ | `INSERT OR REPLACE` in transaction — failed restore rolls back completely |
| T-04-11 (Sync EoP) | ✅ | Triple gate: `isSyncEnabled && isAuthenticated && !isSyncing` before any sync |
| T-04-12 (DoS) | ✅ | Batched SQLite transactions; `isSyncing` gate prevents concurrent syncs |

## Known Stubs

None — all functions are fully implemented. All 5 exports in sync.ts have complete implementations. All 8 actions in settingsStore.ts have complete implementations. The AppState lifecycle hooks are fully wired.

## Post-Commit Integrity

- ✅ No files deleted across the 3 commits
- ✅ No new untracked files introduced by our work
- ✅ `npx tsc --noEmit` exits 0 (clean TypeScript compilation)
- ✅ Original tab structure, splash screen logic, and DB init all preserved in `_layout.tsx`

## Next Plan Readiness (04-03-sync-ui)

The sync engine and store are ready for the UI layer:

- `useSettingsStore` provides all state and actions needed by the Settings screen:
  - `isAuthenticated` / `googleEmail` → display sign-in status
  - `isSyncEnabled` → toggle switch state
  - `isSyncing` → loading indicator
  - `lastSyncAt` / `syncLogs` → "Last synced: ..." display
  - `lastSyncError` → error banner
  - `restoreAvailable` → restore prompt banner
  - `login()` / `logout()` → sign-in/sign-out buttons
  - `setSyncEnabled()` → toggle handler
  - `syncNow()` → "Sync Now" button
  - `doRestore()` → restore prompt action
  - `dismissRestorePrompt()` → dismiss banner

---

## Self-Check: PASSED

- ✅ `src/services/sync.ts` — exists, 484 lines, 5 exports
- ✅ `src/stores/settingsStore.ts` — exists, 311 lines, 8 actions
- ✅ `.planning/phases/04-cloud-sync/04-02-SUMMARY.md` — exists
- ✅ Commit `8093f5e` — Task 1: sync engine
- ✅ Commit `1773990` — Task 2: settingsStore
- ✅ Commit `ec437e6` — Task 3: sync triggers in layout
- ✅ `npx tsc --noEmit` exits 0

---

*Phase: 04-cloud-sync*
*Completed: 2026-05-03*
