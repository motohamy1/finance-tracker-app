---
phase: 04-cloud-sync
plan: 01
subsystem: auth, api
tags: [google-oauth, google-drive, pkce, expo-auth-session, expo-secure-store, appdatafolder]

# Dependency graph
requires: []
provides:
  - Google OAuth 2.0 authentication via expo-auth-session with PKCE flow
  - Google Drive REST API v3 wrapper for appDataFolder JSON file operations
  - Sync-related TypeScript types (SyncTable, SyncManifest, SyncLog, SyncState)
  - Token persistence in expo-secure-store (iOS Keychain / Android EncryptedSharedPreferences)
affects: [04-02-sync-engine, 04-03-sync-ui]

# Tech tracking
tech-stack:
  added:
    - expo-auth-session ~55.0.15
    - expo-crypto ~55.0.14
    - expo-secure-store ~55.0.13
    - "@react-native-async-storage/async-storage 2.2.0"
  patterns:
    - PKCE authorization code flow for mobile OAuth
    - Bearer token authentication with 401 → refresh → retry
    - Multipart upload for Google Drive appDataFolder
    - Environment variable for client ID (EXPO_PUBLIC_GOOGLE_CLIENT_ID)

key-files:
  created:
    - src/services/auth.ts
    - src/services/drive.ts
  modified:
    - src/types/index.ts
    - app.json
    - package.json

key-decisions:
  - "PKCE flow via expo-auth-session with Crypto.digestStringAsync(SHA256) for code challenge"
  - "Tokens stored in expo-secure-store (not AsyncStorage) for T-04-02 mitigation"
  - "Drive API base URL stored as constant (not inlined) for maintainability"
  - "Manifest stored as single-element array for consistency with per-table JSON array format"
  - "Client ID loaded from process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID (never hardcoded)"

patterns-established:
  - "PKCE OAuth 2.0: code_verifier → SHA-256 → code_challenge → token exchange"
  - "Authenticated fetch: try token → 401 → clear stale → refresh → retry once"
  - "Drive multipart: metadata JSON part + content JSON part with boundary"

requirements-completed: [DATA-02]

# Metrics
duration: 5min
completed: 2026-05-03
---

# Phase 4 Plan 1: Cloud Sync Foundation — Google OAuth + Drive API Integration

**Google OAuth 2.0 with PKCE flow and Drive REST API v3 wrapper for appDataFolder JSON file operations — foundational services for cloud backup and sync**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-03T21:00:36Z
- **Completed:** 2026-05-03T21:05:50Z
- **Tasks:** 3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- `src/services/auth.ts`: Google Sign-In with PKCE flow — `signIn`, `signOut`, `getAccessToken`, `isAuthenticated`, `getGoogleEmail`
- `src/services/drive.ts`: Drive API wrapper for appDataFolder — `listSyncFiles`, `uploadJSON`, `downloadJSON`, `uploadManifest`, `downloadManifest`, `deleteFile`
- Sync TypeScript types defined: `SyncTable`, `SyncRecord`, `SyncManifest`, `SyncLog`, `SyncState`
- OAuth redirect URI scheme configured: `finance-tracker://` in app.json
- All tokens stored in expo-secure-store (iOS Keychain / Android EncryptedSharedPreferences)
- Drive API calls follow 401 → token refresh → retry pattern

## Task Commits

1. **Task 1: Install dependencies and define sync TypeScript types** — `eb16d78` (feat)
2. **Task 2: Create Google Sign-In auth service** — `5d8a778` (feat)
3. **Task 3: Create Google Drive API service** — `1a092fc` (feat)

## Files Created/Modified

- `src/services/auth.ts` — Google OAuth 2.0 auth service with PKCE, token storage, and refresh (352 lines)
- `src/services/drive.ts` — Google Drive API v3 wrapper for appDataFolder CRUD operations (319 lines)
- `src/types/index.ts` — Added SyncTable, SyncRecord, SyncManifest, SyncLog, SyncState types
- `app.json` — Changed scheme from `"financetracker"` to `["finance-tracker"]` for OAuth redirect
- `package.json` — Added expo-auth-session, expo-crypto, expo-secure-store, @react-native-async-storage/async-storage
- `package-lock.json` — Lockfile updates

## Decisions Made

- Used `DRIVE_API_BASE`/`DRIVE_UPLOAD_BASE` constants for API URLs rather than inlining — cleaner and more maintainable
- Manifest stored as single-element JSON array `[manifest]` for consistency with per-table record arrays
- 401 retry uses a flag (`tokenRetryInProgress`) to prevent infinite refresh loops
- `uploadManifest` wraps SyncManifest in array to match `uploadJSON`'s array format convention

## Deviations from Plan

### Minor Verification Difference

**1. `www.googleapis.com/drive/v3` grep matches once instead of twice**
- **Found during:** Task 3 verification
- **Issue:** Plan acceptance criteria expects `grep "www.googleapis.com/drive/v3"` to return ≥2 matches, but only returns 1 because the URL is stored in a `DRIVE_API_BASE` constant (all API calls use template literals like `${DRIVE_API_BASE}/files`)
- **Resolution:** Accepted as deliberate design choice — using constants is cleaner than inlining URLs. The upload base uses `/upload/drive/v3` (different path). All API calls correctly target the Drive v3 endpoints.
- **Impact:** None — all 6 exported functions correctly call `www.googleapis.com/drive/v3/files` or `www.googleapis.com/upload/drive/v3/files` as appropriate.

---

**Total deviations:** 1 minor (verification pattern mismatch, no behavior impact)
**Impact on plan:** Zero functional impact. The constant pattern is better practice than inlining URLs everywhere.

## Issues Encountered

- **expo-auth-session ESM module:** `node -e "require('expo-auth-session')"` fails in Node.js because the package is ESM-only (built for Metro bundler). This is expected behavior — the package works correctly in the React Native runtime. Acceptance criterion verification was adjusted to check `package.json` instead.

## User Setup Required

**Google Cloud OAuth 2.0 configuration is required before the auth service works:**

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID for "iOS" or "Android" (or a "Web application" with the redirect URI)
3. Add redirect URI: `finance-tracker://`
4. Set the client ID in `.env`:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
5. Configure the OAuth consent screen with scope: `https://www.googleapis.com/auth/drive.appdata`

See code comments in `src/services/auth.ts` for detailed setup instructions.

## Threat Mitigation Summary

All mitigations from the plan's threat model are implemented:

| Threat | Status | Implementation |
|--------|--------|---------------|
| T-04-01 (Spoofing) | ✅ Mitigated | PKCE flow via expo-auth-session with SHA-256 challenge |
| T-04-02 (Token disclosure) | ✅ Mitigated | expo-secure-store (iOS Keychain / Android EncryptedSharedPreferences); never logged |
| T-04-03 (Data tampering) | ✅ Mitigated | HTTPS (TLS 1.3); appDataFolder scope isolates files to this app |
| T-04-04 (Token in URL) | ✅ Mitigated | Bearer token in Authorization header only, never in query params |
| T-04-05 (Client ID exposure) | ✅ Mitigated | Loaded from `process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID`, scoped to `drive.appdata` only |
| T-04-06 (Rate limiting) | ✅ Accepted | 10K req/day free tier; single-user app with infrequent sync is well within limits |

## Known Stubs

None — all functions are fully implemented. The services are ready for integration in Plans 02 (sync engine) and 03 (sync UI).

## Next Phase Readiness

- Auth foundation (`signIn`, `getAccessToken`) ready for Plan 02 sync engine
- Drive CRUD (`uploadJSON`, `downloadJSON`, `listSyncFiles`, `downloadManifest`) ready for Plan 02 sync logic
- Sync types (`SyncTable`, `SyncManifest`, `SyncLog`, `SyncState`) ready for Zustand store and UI
- User must configure Google Cloud OAuth before testing auth flow

---

*Phase: 04-cloud-sync*
*Completed: 2026-05-03*
