import { View, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Small sync activity indicator — shows a pulsing dot when sync is in progress.
 * Place in the header or tab bar area. Currently renders as a tiny colored dot.
 * 
 * D-10: Non-intrusive — only visible when syncing.
 */
export default function SyncIndicator() {
  const isSyncing = useSettingsStore((s) => s.isSyncing);

  if (!isSyncing) return null;

  return <View style={styles.dot} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0891B2',
    opacity: 0.8,
  },
});
