import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/services/theme';

export default function SettingsScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const isAuthenticated = useSettingsStore((s) => s.isAuthenticated);
  const isSyncEnabled = useSettingsStore((s) => s.isSyncEnabled);
  const isSyncing = useSettingsStore((s) => s.isSyncing);
  const lastSyncAt = useSettingsStore((s) => s.lastSyncAt);
  const lastSyncError = useSettingsStore((s) => s.lastSyncError);
  const googleEmail = useSettingsStore((s) => s.googleEmail);
  const login = useSettingsStore((s) => s.login);
  const logout = useSettingsStore((s) => s.logout);
  const setSyncEnabled = useSettingsStore((s) => s.setSyncEnabled);
  const syncNow = useSettingsStore((s) => s.syncNow);

  const handleLogin = async () => {
    const result = await login();
    if (!result) {
      const freshError = useSettingsStore.getState().lastSyncError;
      const errorDetail = freshError
        ? `\n\nError: ${freshError}`
        : '';
      Alert.alert(
        'Sign-In Failed',
        `Could not sign in with Google. Please try again.${errorDetail}`
      );
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSyncNow = async () => {
    await syncNow();
  };

  const formatLastSync = (iso: string | null): string => {
    if (!iso) return 'Never';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <Ionicons name="settings-outline" size={32} color={colors.textMuted} />
      <Text style={[styles.heading, { color: colors.text }]}>SETTINGS</Text>

      {/* ─── Theme Section ─── */}
      <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>APPEARANCE</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          App uses dark theme.
        </Text>
        <View style={[styles.row, { borderBottomColor: colors.divider }]}>
          <View style={styles.rowLabel}>
            <View style={styles.themeRow}>
              <Ionicons
                name="moon"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                DARK MODE
              </Text>
            </View>
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
              Dark theme active
            </Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.textInverse}
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>

      {/* ─── Google Account Section ─── */}
      <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>CLOUD SYNC</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Back up your data to Google Drive and restore on a new device.
        </Text>

        {/* Auth button */}
        {!isAuthenticated ? (
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            activeOpacity={0.9}
          >
            <Ionicons name="logo-google" size={20} color={colors.textInverse} />
            <Text style={[styles.authButtonText, { color: colors.textInverse }]}>SIGN IN WITH GOOGLE</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.accountInfo}>
            <View style={styles.accountRow}>
              <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
              <View style={styles.accountDetails}>
                <Text style={[styles.accountEmail, { color: colors.text }]}>{googleEmail}</Text>
                <Text style={[styles.accountStatus, { color: colors.success }]}>Signed in</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.9}>
                <Text style={[styles.logoutText, { color: colors.danger }]}>SIGN OUT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ─── Sync Controls Section ─── */}
      {isAuthenticated && (
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Sync toggle */}
          <View style={[styles.row, { borderBottomColor: colors.divider }]}>
            <View style={styles.rowLabel}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>AUTO SYNC</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                {isSyncEnabled ? 'Syncing automatically' : 'Sync is disabled'}
              </Text>
            </View>
            <Switch
              value={isSyncEnabled}
              onValueChange={setSyncEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textInverse}
              ios_backgroundColor={colors.border}
            />
          </View>

          {/* Sync status */}
          <View style={[styles.row, { borderBottomColor: colors.divider }]}>
            <View style={styles.rowLabel}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>LAST SYNCED</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{formatLastSync(lastSyncAt)}</Text>
            </View>
            {isSyncing && (
              <Text style={[styles.syncingText, { color: colors.primary }]}>SYNCING...</Text>
            )}
          </View>

          {/* Sync Now button */}
          <TouchableOpacity
            style={[styles.syncNowButton, { backgroundColor: colors.primary }, isSyncing && { backgroundColor: colors.textMuted }]}
            onPress={handleSyncNow}
            disabled={isSyncing}
            activeOpacity={0.9}
          >
            <Ionicons
              name={isSyncing ? 'sync' : 'sync-outline'}
              size={18}
              color={colors.textInverse}
            />
            <Text style={[styles.syncNowText, { color: colors.textInverse }]}>
              {isSyncing ? 'SYNCING...' : 'SYNC NOW'}
            </Text>
          </TouchableOpacity>

          {/* Error display */}
          {lastSyncError && (
            <View style={[styles.errorBox, { backgroundColor: colors.bgInput, borderColor: colors.danger }]}>
              <Ionicons name="warning-outline" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{lastSyncError}</Text>
            </View>
          )}
        </View>
      )}

      {/* ─── Footer ─── */}
      <Text style={[styles.footer, { color: colors.textMuted }]}>
        Data is stored in your private Google Drive app folder.{'\n'}
        Only this app can access your backup.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 32,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section
  section: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },

  // Auth button
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    borderRadius: 0,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Account info
  accountInfo: {
    paddingTop: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
    marginLeft: 12,
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '500',
  },
  accountStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 2,
  },
  rowLabel: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncingText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sync Now button
  syncNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginTop: 12,
    borderRadius: 0,
  },
  syncNowText: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 0,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },

  // Footer
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
