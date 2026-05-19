import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/services/theme';
import { useState } from 'react';

export default function RestoreBanner() {
  const { colors } = useTheme();
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
    <View style={[styles.banner, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.bgInput }]}>
        <Ionicons name="cloud-download-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>EXISTING DATA FOUND IN DRIVE</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Restore your categories, expenses, and trades?
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.restoreButton,
            { backgroundColor: colors.primary },
            restoring && { backgroundColor: colors.textMuted },
          ]}
          onPress={handleRestore}
          disabled={restoring}
          activeOpacity={0.9}
        >
          <Text style={[styles.restoreText, { color: colors.textInverse }]}>
            {restoring ? 'RESTORING…' : 'RESTORE'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={dismissRestorePrompt}
          style={styles.dismissButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.9}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 0,
    borderWidth: 2,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 0,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restoreButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 0,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dismissButton: {
    padding: 4,
  },
});
