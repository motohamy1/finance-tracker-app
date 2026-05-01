import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { TradeCard } from '@/components/TradeCard';
import { EmptyState } from '@/components/EmptyState';
import type { Trade } from '@/types';

export default function InvestmentsScreen() {
  const router = useRouter();
  const trades = useTradeStore((s) => s.trades);
  const isLoading = useTradeStore((s) => s.isLoading);
  const isInitialized = useTradeStore((s) => s.isInitialized);
  const initialize = useTradeStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  const handleImportPress = () => {
    router.push('/(investments)/import');
  };

  const handleTradePress = (trade: Trade) => {
    router.push({ pathname: '/(investments)/review', params: { tradeId: trade.id } });
  };

  if (!isInitialized || isLoading) return null;

  if (trades.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="trending-up-outline"
          title="No Trades Yet"
          body="Import your first trading screenshot and we'll extract the trade data automatically."
          ctaText="Import Screenshot"
          onCtaPress={handleImportPress}
        />
        {/* Muted preview card per D-10 */}
        <View style={styles.previewCard}>
          <Ionicons name="image-outline" size={40} color="#CBD5E1" />
          <View style={styles.previewDetails}>
            <Text style={styles.previewTicker}>AAPL</Text>
            <Text style={styles.previewMeta}>10 shares · $185.50</Text>
            <Text style={styles.previewMeta}>Buy · Apr 28, 2026</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TradeCard trade={item} onPress={() => handleTradePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      {/* FAB per D-06 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleImportPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  listContent: { padding: 16, paddingBottom: 80 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0891B2',
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6,
  },
  previewCard: {
    position: 'absolute', bottom: 100, left: 32, right: 32,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    opacity: 0.6, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  previewDetails: { flex: 1, gap: 2 },
  previewTicker: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  previewMeta: { fontSize: 13, color: '#94A3B8' },
});
