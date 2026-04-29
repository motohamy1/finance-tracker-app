import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InvestmentsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="trending-up-outline" size={64} color="#94A3B8" />
      <Text style={styles.heading}>Coming Soon</Text>
      <Text style={styles.body}>
        Track your investments with smart{'\n'}
        screenshot OCR. Buy, sell, profit —{'\n'}
        all extracted automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8', padding: 32 },
  heading: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginTop: 16 },
  body: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 21 },
});
