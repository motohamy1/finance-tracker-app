import { View, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/services/theme';

/**
 * Small sync activity indicator — shows a pulsing square when sync is in progress.
 * Place in the header or tab bar area. Currently renders as a tiny colored square.
 * 
 * D-10: Non-intrusive — only visible when syncing.
 */
export default function SyncIndicator() {
  const { colors } = useTheme();
  const isSyncing = useSettingsStore((s) => s.isSyncing);

  if (!isSyncing) return null;

  return <View style={[styles.dot, { backgroundColor: colors.primary }]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 0,
  },
});
