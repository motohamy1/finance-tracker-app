import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SettingsScreen() {
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
      Alert.alert('Sign-In Failed', 'Could not sign in with Google. Please try again.');
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <Ionicons name="settings-outline" size={32} color="#94A3B8" />
      <Text style={styles.heading}>Settings</Text>

      {/* ─── Google Account Section ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cloud Sync</Text>
        <Text style={styles.sectionDescription}>
          Back up your data to Google Drive and restore on a new device.
        </Text>

        {/* Auth button */}
        {!isAuthenticated ? (
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleLogin}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={20} color="#FFFFFF" />
            <Text style={styles.authButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.accountInfo}>
            <View style={styles.accountRow}>
              <Ionicons name="person-circle-outline" size={24} color="#0891B2" />
              <View style={styles.accountDetails}>
                <Text style={styles.accountEmail}>{googleEmail}</Text>
                <Text style={styles.accountStatus}>Signed in</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ─── Sync Controls Section ─── */}
      {isAuthenticated && (
        <View style={styles.section}>
          {/* Sync toggle */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.rowTitle}>Auto Sync</Text>
              <Text style={styles.rowSubtitle}>
                {isSyncEnabled ? 'Syncing automatically' : 'Sync is disabled'}
              </Text>
            </View>
            <Switch
              value={isSyncEnabled}
              onValueChange={setSyncEnabled}
              trackColor={{ false: '#CBD5E1', true: '#0891B2' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CBD5E1"
            />
          </View>

          {/* Sync status */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.rowTitle}>Last Synced</Text>
              <Text style={styles.rowSubtitle}>{formatLastSync(lastSyncAt)}</Text>
            </View>
            {isSyncing && (
              <Text style={styles.syncingText}>Syncing…</Text>
            )}
          </View>

          {/* Sync Now button */}
          <TouchableOpacity
            style={[styles.syncNowButton, isSyncing && styles.syncNowButtonDisabled]}
            onPress={handleSyncNow}
            disabled={isSyncing}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSyncing ? 'sync' : 'sync-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.syncNowText}>
              {isSyncing ? 'Syncing…' : 'Sync Now'}
            </Text>
          </TouchableOpacity>

          {/* Error display */}
          {lastSyncError && (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{lastSyncError}</Text>
            </View>
          )}
        </View>
      )}

      {/* ─── Footer ─── */}
      <Text style={styles.footer}>
        Data is stored in your private Google Drive app folder.{'\n'}
        Only this app can access your backup.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 32,
  },

  // Section
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },

  // Auth button
  authButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#0F172A',
  },
  accountStatus: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  syncingText: {
    fontSize: 12,
    color: '#0891B2',
    fontWeight: '500',
  },

  // Sync Now button
  syncNowButton: {
    backgroundColor: '#0891B2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 12,
  },
  syncNowButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  syncNowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },

  // Footer
  footer: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
