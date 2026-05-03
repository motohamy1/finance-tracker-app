import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useState } from 'react';

export default function RestoreBanner() {
  const restoreAvailable = useSettingsStore((s) => s.restoreAvailable);
  const restorePromptDismissed = useSettingsStore((s) => s.restorePromptDismissed);
  const doRestore = useSettingsStore((s) => s.doRestore);
  const dismissRestorePrompt = useSettingsStore((s) => s.dismissRestorePrompt);
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState(false);

  // Don't show if restore not available, already dismissed, or already restored
  if (!restoreAvailable || restorePromptDismissed || restored) return null;

  const handleRestore = async () => {
    setRestoring(true);
    const result = await doRestore();
    setRestoring(false);
    if (result.success) {
      setRestored(true);
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-download-outline" size={22} color="#0891B2" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Existing data found in Drive</Text>
        <Text style={styles.subtitle}>
          Restore your categories, expenses, and trades?
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.restoreButton, restoring && styles.restoreButtonDisabled]}
          onPress={handleRestore}
          disabled={restoring}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreText}>
            {restoring ? 'Restoring…' : 'Restore'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={dismissRestorePrompt}
          style={styles.dismissButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restoreButton: {
    backgroundColor: '#0891B2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  restoreButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  restoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
});
