import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SyncState, SyncTable, SyncLog } from '@/types';
import type { ThemeMode } from '@/services/theme';
import {
  signIn,
  signOut,
  isAuthenticated,
  getGoogleEmail,
  getLastAuthError,
} from '@/services/auth';
import {
  syncAll,
  restoreAll,
  checkRestoreAvailable,
  getLastSyncTimes,
} from '@/services/sync';

// ─── Constants ───

/**
 * Initial sync log state for all 4 tables (D-06).
 * Each table starts with an empty sync log — no successful sync yet.
 */
const INITIAL_SYNC_LOGS: Record<SyncTable, SyncLog> = {
  categories:     { table: 'categories',     lastSyncAt: '', lastSyncRecordCount: 0 },
  expenses:       { table: 'expenses',       lastSyncAt: '', lastSyncRecordCount: 0 },
  trades:         { table: 'trades',         lastSyncAt: '', lastSyncRecordCount: 0 },
  current_prices: { table: 'current_prices', lastSyncAt: '', lastSyncRecordCount: 0 },
};

// ─── Store Actions Interface ───

interface SettingsActions {
  /** Trigger Google Sign-In flow (D-07: opt-in — user must enable after login) */
  login: () => Promise<boolean>;

  /** Sign out and reset all sync state to defaults */
  logout: () => Promise<void>;

  /** Toggle sync enabled/disabled (D-07: disabled by default) */
  setSyncEnabled: (enabled: boolean) => void;

  /** Perform a manual sync cycle (D-09: "Sync Now" button) */
  syncNow: () => Promise<void>;

  /** Trigger restore from Drive data (D-08: fresh install prompt) */
  doRestore: () => Promise<{ success: boolean; recordCount: number }>;

  /** Dismiss the restore prompt — shown only once per fresh install (D-08) */
  dismissRestorePrompt: () => void;

  /** Set the app theme (persisted to AsyncStorage) */
  setTheme: (theme: ThemeMode) => void;

  /** Show/hide category input overlay (hides tab bar when visible) */
  setOverlayInputVisible: (visible: boolean) => void;

  /**
   * Initialize the sync store on app start:
   *   1. Check if already authenticated (token in SecureStore)
   *   2. Get Google email if authenticated
   *   3. Check if restore is available (fresh install detection)
   *   4. Load sync log timestamps from AsyncStorage
   *   5. Load theme preference from AsyncStorage
   */
  initialize: () => Promise<void>;

  /** Reload sync logs from AsyncStorage (used after external sync triggers) */
  refreshSyncLogs: () => Promise<void>;
}

// ─── Store ───

/**
 * Cloud Sync Settings Store
 *
 * Manages all sync-related UI state: authentication status, sync toggle,
 * sync progress, last sync timestamp, restore availability, and sync logs.
 *
 * Design decisions (from 04-CONTEXT.md):
 *   D-07: Sync is DISABLED by default (isSyncEnabled: false)
 *   D-08: Fresh install restore prompt shown once (restorePromptDismissed)
 *   D-09: "Sync Now" button and "Last synced" display
 */
export const useSettingsStore = create<SyncState & { theme: ThemeMode; isOverlayInputVisible: boolean } & SettingsActions>((set, get) => ({
  // ─── State ───

  isAuthenticated: false,
  isSyncEnabled: false,         // D-07: disabled by default
  isSyncing: false,
  lastSyncAt: null,
  lastSyncError: null,
  googleEmail: null,
  restoreAvailable: false,
  restorePromptDismissed: false,
  syncLogs: { ...INITIAL_SYNC_LOGS },
  theme: 'dark',                // dark theme as default
  isOverlayInputVisible: false, // hides tab bar when category input is shown

  // ─── Actions ───

  /**
   * Initialize sync store state from persisted data.
   *
   * Called on app start (in _layout.tsx useEffect) after database
   * migrations and expense store initialization.
   */
  initialize: async () => {
    try {
      // 1. Check if already authenticated (token in SecureStore)
      const authed = await isAuthenticated();

      // 2. Get email if authenticated
      const email = authed ? await getGoogleEmail() : null;

      // 3. Check if restore available (fresh install + data in Drive)
      const restoreAvail = authed ? await checkRestoreAvailable() : false;

      // 4. Load sync logs from AsyncStorage
      const logs = await getLastSyncTimes();
      const syncLogs = { ...INITIAL_SYNC_LOGS };
      for (const log of logs) {
        syncLogs[log.table] = log;
      }

      // 5. Determine lastSyncAt from logs (most recent across all tables)
      const lastSyncAt = logs.length > 0
        ? logs.reduce((a, b) => (a.lastSyncAt > b.lastSyncAt ? a : b)).lastSyncAt
        : null;

      // 6. Load theme preference from AsyncStorage (default: dark)
      const storedTheme = await AsyncStorage.getItem('@finance_tracker/theme');
      const theme = (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark';

      // 7. Load sync enabled preference from AsyncStorage (default: false per D-07)
      const storedSyncEnabled = await AsyncStorage.getItem('@finance_tracker/sync_enabled');
      const isSyncEnabled = storedSyncEnabled === 'true';

      set({
        isAuthenticated: authed,
        isSyncEnabled,
        googleEmail: email,
        restoreAvailable: restoreAvail,
        syncLogs,
        lastSyncAt,
        theme,
      });
    } catch (error) {
      console.error('[settingsStore] Initialize failed:', error);
      // Non-fatal — sync features just won't be available
    }
  },

  /**
   * Initiate Google Sign-In via expo-auth-session (D-11).
   * On success, updates auth state and checks for restore availability.
   *
   * @returns true if sign-in succeeded, false if cancelled or failed
   */
  login: async () => {
    try {
      const result = await signIn();
      if (result) {
        const email = await getGoogleEmail();
        set({ isAuthenticated: true, googleEmail: email, lastSyncError: null });

        // Check for restore after successful login (fresh install scenario)
        const restoreAvail = await checkRestoreAvailable();
        set({ restoreAvailable: restoreAvail });
      } else {
        const authError = getLastAuthError();
        set({ lastSyncError: authError || 'Sign-in failed' });
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-in failed';
      console.error('[settingsStore] Login failed:', error);
      set({
        lastSyncError: message,
      });
      return false;
    }
  },

  /**
   * Sign out: revoke token, clear SecureStore, reset all sync state.
   */
  logout: async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('[settingsStore] Logout error:', error);
      // Even on error, reset state — SecureStore is already cleared by auth service
    }

    AsyncStorage.removeItem('@finance_tracker/sync_enabled').catch(console.error);
    set({
      isAuthenticated: false,
      isSyncEnabled: false,
      googleEmail: null,
      lastSyncAt: null,
      restoreAvailable: false,
      restorePromptDismissed: false,
      syncLogs: { ...INITIAL_SYNC_LOGS },
      lastSyncError: null,
    });
  },

  /**
   * Toggle sync on/off (D-07: user must explicitly enable).
   * Persisted to AsyncStorage so it survives app restarts.
   */
  setSyncEnabled: (enabled: boolean) => {
    set({ isSyncEnabled: enabled });
    AsyncStorage.setItem('@finance_tracker/sync_enabled', String(enabled)).catch(console.error);
  },

  /**
   * Perform a manual sync cycle (D-09: "Sync Now" button).
   *
   * Gates:
   *   - Prevents concurrent syncs (isSyncing flag)
   *   - Requires authentication
   *
   * On success: updates lastSyncAt, syncLogs per table
   * On failure: sets lastSyncError for UI display
   */
  syncNow: async () => {
    const { isSyncing, isAuthenticated } = get();

    // Gate: prevent concurrent syncs
    if (isSyncing) return;

    // Gate: require authentication
    if (!isAuthenticated) {
      set({ lastSyncError: 'Not signed in' });
      return;
    }

    set({ isSyncing: true, lastSyncError: null });

    try {
      const result = await syncAll();

      if (result.success) {
        // Reload sync logs (written by sync engine to AsyncStorage)
        const logs = await getLastSyncTimes();
        const syncLogs = { ...INITIAL_SYNC_LOGS };
        for (const log of logs) {
          syncLogs[log.table] = log;
        }

        const lastSyncAt = logs.length > 0
          ? logs.reduce((a, b) => (a.lastSyncAt > b.lastSyncAt ? a : b)).lastSyncAt
          : new Date().toISOString();

        set({ lastSyncAt, syncLogs, isSyncing: false });
      } else {
        set({
          lastSyncError: result.error || 'Sync failed',
          isSyncing: false,
        });
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Unknown sync error';
      set({ lastSyncError: error, isSyncing: false });
    }
  },

  /**
   * Restore all data from Google Drive (D-08: fresh install prompt).
   *
   * Downloads JSON files for all 4 tables and imports them atomically
   * into the local SQLite database.
   *
   * @returns { success: boolean, recordCount: number }
   */
  doRestore: async () => {
    const { isSyncing } = get();
    if (isSyncing) return { success: false, recordCount: 0 };

    set({ isSyncing: true, lastSyncError: null });

    try {
      const result = await restoreAll();

      if (result.success) {
        // Restore succeeded — update state
        set({
          isSyncing: false,
          restoreAvailable: false,
          restorePromptDismissed: true,
          lastSyncAt: new Date().toISOString(),
        });
      } else {
        set({
          isSyncing: false,
          lastSyncError: result.error || 'Restore failed',
        });
      }

      return { success: result.success, recordCount: result.recordCount };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Unknown restore error';
      set({ lastSyncError: error, isSyncing: false });
      return { success: false, recordCount: 0 };
    }
  },

  /**
   * Dismiss the restore prompt (D-08: shown only once per fresh install).
   */
  dismissRestorePrompt: () => {
    set({ restorePromptDismissed: true, restoreAvailable: false });
  },

  /**
   * Reload sync log timestamps from AsyncStorage into store state.
   */
  refreshSyncLogs: async () => {
    try {
      const logs = await getLastSyncTimes();
      const syncLogs = { ...INITIAL_SYNC_LOGS };
      for (const log of logs) {
        syncLogs[log.table] = log;
      }
      set({ syncLogs });

      // Update lastSyncAt from logs
      const lastSyncAt = logs.length > 0
        ? logs.reduce((a, b) => (a.lastSyncAt > b.lastSyncAt ? a : b)).lastSyncAt
        : null;
      set({ lastSyncAt });
    } catch (error) {
      console.error('[settingsStore] refreshSyncLogs failed:', error);
    }
  },

  /**
   * Set the app theme and persist to AsyncStorage.
   */
  setTheme: (theme: ThemeMode) => {
    set({ theme });
    AsyncStorage.setItem('@finance_tracker/theme', theme).catch(console.error);
  },

  setOverlayInputVisible: (visible: boolean) => {
    set({ isOverlayInputVisible: visible });
  },
}));
