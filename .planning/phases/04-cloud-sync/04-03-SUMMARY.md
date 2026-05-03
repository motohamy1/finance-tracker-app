---
phase: 04-cloud-sync
plan: 03
subsystem: sync-ui, settings
tags: [google-auth, sync-toggle, restore-banner, sync-indicator, settings-screen]
requires: [04-02]
provides:
  - Settings screen with Google Sign-In, sync toggle, status display, and Sync Now button
  - RestoreBanner component for fresh install Drive data restore prompt
  - SyncIndicator component for header sync activity feedback
affects: [04-03-complete-phase]
tech-stack:
  added: []
  patterns:
    - Zustand selector pattern (useSettingsStore((s) => s.field)) for reactive UI
    - Relative time formatting (m ago, h ago) for last sync display
    - Conditional section rendering (sync controls only visible when authenticated)
    - TouchableOpacity disabled styling for sync-in-progress state
    - early-return null pattern for conditional component rendering (SyncIndicator, RestoreBanner)

key-files:
  created:
    - src/components/RestoreBanner.tsx
    - src/components/SyncIndicator.tsx
  modified:
    - src/app/settings.tsx
    - src/app/_layout.tsx

key-decisions:
  - "Settings screen is a complete rewrite from placeholder — fully replaced with sync management UI"
  - "Sync controls (toggle, Sync Now, status) only visible when authenticated (D-07 opt-in gate)"
  - "SyncIndicator renders only when isSyncing=true — returns null otherwise (D-10 non-intrusive)"
  - "RestoreBanner placed in expenses screen (future work); documented in _layout.tsx via code comment"
  - "Settings headerShown: true overrides root headerShown: false for Settings tab only"
  - "Google Sign-In button uses Google brand color #4285F4"

requirements-completed: [DATA-02]

metrics:
  duration: 307
  completed: 2026-05-03
  tasks: 3
  files_modified: 4
---

# Phase 4 Plan 3: Sync UI — Settings Screen, Restore Banner, and Activity Indicator

**Full user-facing cloud sync interface: Google auth, sync toggle, status display, restore banner, and header activity dot**

## Performance

- **Duration:** ~5 min (307s)
- **Started:** 2026-05-03T21:27:00Z
- **Completed:** 2026-05-03T21:32:07Z
- **Tasks:** 3
- **Files:** 4 (2 created, 2 modified)

## Accomplishments

- `src/app/settings.tsx` (319 lines, rewritten): Full sync management UI — Google Sign-In button (#4285F4), account info with email/status, Auto Sync toggle (D-07 opt-in), Last Synced relative time, Sync Now button with disabled state, error display box, privacy footer
- `src/components/RestoreBanner.tsx` (135 lines): Fresh install restore prompt — "Existing data found in Drive" with Restore/Dismiss actions, hiding logic (once per install), loading state
- `src/components/SyncIndicator.tsx` (27 lines): 8×8 cyan activity dot rendered in Settings header only during active sync (D-10)
- `src/app/_layout.tsx` (+7 lines): SyncIndicator wired into Settings tab headerRight, RestoreBanner placement documented

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rebuild Settings screen with sync UI | `3cbf05b` | `src/app/settings.tsx` (rewritten) |
| 2 | Create RestoreBanner and SyncIndicator | `4b4bcdd` | `src/components/RestoreBanner.tsx`, `src/components/SyncIndicator.tsx` (created) |
| 3 | Wire SyncIndicator into app layout | `8edb74a` | `src/app/_layout.tsx` (modified) |

## Files Created/Modified

- `src/app/settings.tsx` — Full sync UI: Google Sign-In, account info, sync toggle, last synced, Sync Now button, error display, privacy footer (319 lines)
- `src/components/RestoreBanner.tsx` — Fresh install restore prompt banner with Restore/Dismiss actions (135 lines)
- `src/components/SyncIndicator.tsx` — 8×8 cyan activity dot for sync-in-progress feedback (27 lines)
- `src/app/_layout.tsx` — SyncIndicator wired into Settings tab headerRight, RestoreBanner placement documented (+7 lines)

## Architecture

### Settings Screen (`src/app/settings.tsx`)

**Complete rewrite** from a placeholder screen to the full sync management interface.

**Three visual states:**

1. **Not authenticated:** "Sign in with Google" button (Google blue #4285F4), section description about cloud sync
2. **Authenticated (sync disabled):** Account email, "Signed in" status, Sign Out link, Auto Sync toggle (off), Last Synced "Never", Sync Now button
3. **Authenticated (sync enabled + synced):** All of the above plus syncing status text, "Xm ago" last sync display

**10 Zustand selectors used:**
- State: `isAuthenticated`, `isSyncEnabled`, `isSyncing`, `lastSyncAt`, `lastSyncError`, `googleEmail`
- Actions: `login`, `logout`, `setSyncEnabled`, `syncNow`

**Relative time formatting (`formatLastSync`):**
- `null` → "Never"
- `<1 min` → "Just now"
- `<60 min` → "Xm ago"
- `<24 hours` → "Xh ago"
- `≥24 hours` → "Mon DD, H:MM" (full date)

### RestoreBanner (`src/components/RestoreBanner.tsx`)

**Visibility logic (3 gates):**
1. `restoreAvailable` must be `true` (fresh install + Drive data detected)
2. `restorePromptDismissed` must be `false` (not already dismissed)
3. `restored` local state must be `false` (not already completed in this session)

**Actions:**
- "Restore" button → calls `doRestore()`, shows "Restoring…" during operation
- × close button → calls `dismissRestorePrompt()`, permanent dismiss

**Placement:** Documented in `_layout.tsx` comment for future placement in `src/app/(expenses)/index.tsx`.

### SyncIndicator (`src/components/SyncIndicator.tsx`)

Minimal component: renders an 8×8 cyan dot (`#0891B2`) only when `isSyncing` is `true`. Returns `null` otherwise.

**Wired in `_layout.tsx`** as `headerRight` on the Settings tab screen, appearing in the top-right of the Settings header during active sync.

### Layout Changes (`src/app/_layout.tsx`)

- **Settings tab:** `headerShown: true` (overrides root `headerShown: false`) — only the Settings tab shows a header now
- **Settings tab:** `headerRight: () => <SyncIndicator />` — sync dot in header
- **All existing functionality preserved:** splash screen, DB migrations, expense store init, settings store init, AppState background sync listener, tab bar with Expenses and Investments tabs

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed with 100% acceptance criteria compliance. The exact code from the plan was used for all components and styles.

## Verification Summary

| Criterion | Status | Evidence |
|-----------|--------|----------|
| settings.tsx uses useSettingsStore | ✅ | 11 references |
| "Sign in with Google" present | ✅ | 1 match (auth button text) |
| "Sync Now" present | ✅ | 3 matches (button text) |
| All 9 store fields used | ✅ | 32 references (isSyncEnabled, isAuthenticated, isSyncing, lastSyncAt, googleEmail, login, logout, setSyncEnabled, syncNow) |
| Switch component present | ✅ | 2 matches (React Native Switch) |
| "Last Synced" present | ✅ | 1 match |
| Google Drive privacy footer | ✅ | 1 match |
| RestoreBanner exists | ✅ | `export default function RestoreBanner` |
| restoreAvailable/dismiss/doRestore used | ✅ | 7 references |
| "Existing data found in Drive" | ✅ | 1 match |
| SyncIndicator exists | ✅ | `export default function SyncIndicator` |
| SyncIndicator uses isSyncing | ✅ | 2 references |
| SyncIndicator in layout import | ✅ | 2 references |
| headerRight with SyncIndicator | ✅ | 1 match |
| Settings headerShown: true | ✅ | 1 match |
| RestoreBanner comment in layout | ✅ | 2 references |
| Original layout preserved | ✅ | All existing imports, tabs, splash screen, DB init, sync hooks intact |
| TypeScript compilation | ✅ | `npx tsc --noEmit` exits 0 |

## UX Decision Compliance

| Decision | Description | Status |
|----------|-------------|--------|
| D-07 | Sync disabled by default, opt-in toggle | ✅ | `isSyncEnabled: false` in store; toggle only visible when authenticated |
| D-08 | Restore prompt on fresh install (once) | ✅ | RestoreBanner with `restorePromptDismissed` gate |
| D-09 | "Last synced" display + "Sync Now" button | ✅ | `formatLastSync()` + Sync Now button in settings |
| D-10 | Non-intrusive activity indicator | ✅ | 8×8 dot in Settings header, only shows when syncing |

## Threat Mitigation Summary

All threats from the plan's threat model are handled by the store layer (built in Plan 04-02). The UI layer is a passive consumer:

| Threat | Disposition | UI Role |
|--------|-------------|---------|
| T-04-13 (Sign-In spoofing) | Mitigated in store | Button delegates to `login()` with PKCE — no direct credential handling |
| T-04-14 (Email disclosure) | Accepted | Email is user's own — displayed for UX clarity |
| T-04-15 (Restore tampering) | Mitigated in store | Restore uses atomic transaction with rollback (store layer) |
| T-04-16 (Sync toggle EoP) | Mitigated in store | Toggle only visible when authenticated; no direct network calls |
| T-04-17 (Sync Now DoS) | Mitigated in UI | Button disabled via `isSyncing` gate; `syncNow()` has same gate in store |

## Known Stubs

None — all components are fully implemented with complete UI logic. The RestoreBanner is not yet placed in the expenses screen (documented via code comment in `_layout.tsx` for the next phase/plan executor).

## Post-Commit Integrity

- ✅ No files deleted across the 3 commits
- ✅ No new untracked files introduced by this plan's work
- ✅ `npx tsc --noEmit` exits 0 (clean TypeScript compilation)
- ✅ All existing layout functionality preserved in `_layout.tsx`

---

## Self-Check: PASSED

- ✅ `src/app/settings.tsx` — exists, 319 lines, complete sync UI
- ✅ `src/components/RestoreBanner.tsx` — exists, 135 lines
- ✅ `src/components/SyncIndicator.tsx` — exists, 27 lines
- ✅ Commit `3cbf05b` — Task 1: Settings screen rewrite
- ✅ Commit `4b4bcdd` — Task 2: RestoreBanner + SyncIndicator
- ✅ Commit `8edb74a` — Task 3: Layout wiring
- ✅ `npx tsc --noEmit` exits 0

---

*Phase: 04-cloud-sync*
*Completed: 2026-05-03*
