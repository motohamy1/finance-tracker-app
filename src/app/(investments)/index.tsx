import { View, FlatList, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useMemo, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTradeStore } from '@/stores/tradeStore';
import { TradeCard } from '@/components/TradeCard';
import { PortfolioHeader } from '@/components/PortfolioHeader';
import { TickerChips } from '@/components/TickerChips';
import { CategoryChips } from '@/components/CategoryChips';
import { TickerSummaryCard } from '@/components/TickerSummaryCard';
import { BottomSheet } from '@/components/BottomSheet';
import { TradeFilterSheet, type FilterState } from '@/components/TradeFilterSheet';
import { PnLPairCard } from '@/components/PnLPairCard';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency } from '@/utils/format';
import type { Trade, PnLPair } from '@/types';

export default function InvestmentsScreen() {
  const router = useRouter();
  const trades = useTradeStore((s) => s.trades);
  const isLoading = useTradeStore((s) => s.isLoading);
  const isInitialized = useTradeStore((s) => s.isInitialized);
  const initialize = useTradeStore((s) => s.initialize);
  const getPnlPairs = useTradeStore((s) => s.getPnlPairs);
  const getSummaryByTicker = useTradeStore((s) => s.getSummaryByTicker);
  const getCategorySummary = useTradeStore((s) => s.getCategorySummary);
  const getAvailableCategories = useTradeStore((s) => s.getAvailableCategories);
  const getTradesByCategory = useTradeStore((s) => s.getTradesByCategory);

  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFabSheet, setShowFabSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    direction: 'all',
    dateFrom: null,
    dateTo: null,
    searchQuery: '',
  });

  useEffect(() => {
    initialize();
  }, []);

  const pnlPairs = useMemo(() => getPnlPairs(), [trades]);

  const tickers = useMemo(() => {
    const set = new Set(trades.map(t => t.ticker));
    return [...set].sort();
  }, [trades]);

  const isFiltered = filters.direction !== 'all' || filters.dateFrom !== null || filters.dateTo !== null || filters.searchQuery !== '';

  const availableCategories = useMemo(() => getAvailableCategories(), [trades]);

  const filteredTrades = useMemo(() => {
    let result = [...trades].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate));
    if (selectedCategory) {
      result = result.filter(t => t.assetType === selectedCategory);
    }
    if (selectedTicker) {
      result = result.filter(t => t.ticker === selectedTicker);
    }
    if (filters.direction !== 'all') {
      result = result.filter(t => t.direction === filters.direction);
    }
    if (filters.dateFrom) {
      result = result.filter(t => t.tradeDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(t => t.tradeDate <= filters.dateTo!);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        t => t.ticker.toLowerCase().includes(q) || (t.notes?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [trades, selectedTicker, selectedCategory, filters]);

  const filteredPairs = useMemo(() => {
    let result = pnlPairs;
    if (selectedCategory) {
      result = result.filter(p => {
        const buyTrade = trades.find(t => t.id === p.buyTradeId);
        return buyTrade?.assetType === selectedCategory;
      });
    }
    if (selectedTicker) {
      result = result.filter(p => p.ticker === selectedTicker);
    }
    if (filters.dateFrom) {
      result = result.filter(p => p.sellDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(p => p.sellDate <= filters.dateTo!);
    }
    return result;
  }, [pnlPairs, selectedTicker, selectedCategory, filters, trades]);

  const pairedTradeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of pnlPairs) {
      ids.add(p.buyTradeId);
      ids.add(p.sellTradeId);
    }
    return ids;
  }, [pnlPairs]);

  const showGroupedView = selectedTicker !== null;

  const handleGalleryImport = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library to import screenshots.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/(investments)/import',
        params: { sharedImageUri: result.assets[0].uri },
      });
    }
  };

  const handleManualEntry = () => {
    router.push('/(investments)/manual');
  };

  const handleFabPress = () => {
    setShowFabSheet(true);
  };

  const handleTradePress = (trade: Trade) => {
    router.push({ pathname: '/(investments)/review', params: { tradeId: trade.id } });
  };

  const getPnlForTrade = useCallback((tradeId: string): number | null => {
    const pair = pnlPairs.find(p => p.buyTradeId === tradeId || p.sellTradeId === tradeId);
    if (!pair) return null;
    if (pair.buyTradeId === tradeId) return -pair.realizedPnlCents;
    return pair.realizedPnlCents;
  }, [pnlPairs]);

  if (!isInitialized || isLoading) return null;

  if (trades.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="trending-up-outline"
          title="No Trades Yet"
          body="Import your first trading screenshot and we'll extract the trade data automatically."
        >
          <View style={styles.previewCard}>
            <Ionicons name="image-outline" size={40} color="#CBD5E1" />
            <View style={styles.previewDetails}>
              <Text style={styles.previewTicker}>AAPL</Text>
              <Text style={styles.previewMeta}>10 shares · $185.50</Text>
              <Text style={styles.previewMeta}>Buy · Apr 28, 2026</Text>
            </View>
          </View>
        </EmptyState>
        <View style={styles.emptyActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGalleryImport} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Import Screenshot</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleManualEntry} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={20} color="#0891B2" />
            <Text style={styles.secondaryButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={showGroupedView ? 'pairs' : 'trades'}
        data={showGroupedView ? filteredPairs : filteredTrades}
        keyExtractor={(item: PnLPair | Trade) =>
          'sellTradeId' in item
            ? `${item.buyTradeId}-${item.sellTradeId}`
            : (item as Trade).id
        }
        ListHeaderComponent={
          <View>
            <PortfolioHeader />
            <View style={styles.filterBar}>
              <TickerChips
                tickers={tickers}
                selected={selectedTicker}
                onSelect={setSelectedTicker}
              />
              <CategoryChips
                categories={availableCategories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
              <TouchableOpacity
                style={[styles.filterButton, isFiltered && styles.filterButtonActive]}
                onPress={() => setShowFilterSheet(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="filter"
                  size={16}
                  color={isFiltered ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[styles.filterButtonText, isFiltered && styles.filterButtonTextActive]}>
                  Filter{isFiltered ? ' · on' : ''}
                </Text>
              </TouchableOpacity>
            </View>
            {selectedTicker ? (
              <TickerSummaryCard ticker={selectedTicker} />
            ) : null}
            {selectedCategory && !selectedTicker ? (() => {
              const summary = getCategorySummary(selectedCategory);
              const catName = availableCategories.find(c => c.id === selectedCategory)?.label ?? selectedCategory;
              return (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTicker}>{catName}</Text>
                    {summary.pnlMultiplier !== null && (
                      <View style={[styles.summaryMultiplierBadge, summary.pnlMultiplier >= 1 ? styles.summaryMultiplierGreen : styles.summaryMultiplierRed]}>
                        <Text style={[styles.summaryMultiplierBadgeText, summary.pnlMultiplier >= 1 ? styles.summaryMultiplierGreenText : styles.summaryMultiplierRedText]}>
                          {summary.pnlMultiplier >= 1 ? '+' : ''}{((summary.pnlMultiplier - 1) * 100).toFixed(1)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Invested</Text>
                      <Text style={styles.summaryValue}>{formatCurrency(summary.totalInvestedCents)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Realized P&L</Text>
                      <Text style={[styles.summaryValue, summary.totalRealizedCents >= 0 ? styles.gain : styles.loss]}>
                        {summary.totalRealizedCents >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.totalRealizedCents))}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Trades</Text>
                      <Text style={styles.summaryValue}>{summary.tradeCount}</Text>
                    </View>
                  </View>
                </View>
              );
            })() : null}
          </View>
        }
        renderItem={({ item }: { item: PnLPair | Trade }) => {
          if ('sellTradeId' in item) {
            return <PnLPairCard pair={item as PnLPair} />;
          }
          const trade = item as Trade;
          const paired = pairedTradeIds.has(trade.id);
          const pnlCents = trade.direction === 'sell' ? getPnlForTrade(trade.id) : null;
          let multiplier: number | null = null;
          if (pnlCents !== null && trade.direction === 'sell') {
            const pair = pnlPairs.find(p => p.sellTradeId === trade.id);
            if (pair) {
              const buyTrade = trades.find(t => t.id === pair.buyTradeId);
              if (buyTrade) {
                const invested = buyTrade.shares * buyTrade.pricePerShareCents;
                multiplier = invested > 0 ? (invested + pnlCents) / invested : null;
              }
            }
          }
          return (
            <TradeCard
              trade={trade}
              pnlCents={trade.direction === 'sell' && paired ? pnlCents : null}
              pnlMultiplier={multiplier}
              onPress={() => handleTradePress(trade)}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TradeFilterSheet
        visible={showFilterSheet}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilterSheet(false)}
      />

      <BottomSheet visible={showFabSheet} onClose={() => setShowFabSheet(false)}>
        <TouchableOpacity style={styles.sheetAction} onPress={() => { setShowFabSheet(false); handleManualEntry(); }} activeOpacity={0.7}>
          <View style={styles.sheetActionIcon}>
            <Ionicons name="create-outline" size={24} color="#0891B2" />
          </View>
          <View style={styles.sheetActionText}>
            <Text style={styles.sheetActionTitle}>Manual Entry</Text>
            <Text style={styles.sheetActionSubtitle}>Enter trade details yourself</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetAction} onPress={() => { setShowFabSheet(false); handleGalleryImport(); }} activeOpacity={0.7}>
          <View style={styles.sheetActionIcon}>
            <Ionicons name="scan-outline" size={24} color="#0891B2" />
          </View>
          <View style={styles.sheetActionText}>
            <Text style={styles.sheetActionTitle}>Scan Screenshot (OCR)</Text>
            <Text style={styles.sheetActionSubtitle}>Import and extract trade data</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>
      </BottomSheet>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  listContent: { paddingBottom: 80 },
  filterBar: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  filterButtonActive: {
    backgroundColor: '#0891B2',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyActions: {
    alignItems: 'center', gap: 12, paddingHorizontal: 32,
    paddingBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0891B2', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, width: '100%', justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
    width: '100%', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#0891B2',
  },
  secondaryButtonText: { color: '#0891B2', fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0891B2',
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6,
  },
  previewCard: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    opacity: 0.6, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  previewDetails: { flex: 1, gap: 2 },
  previewTicker: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  previewMeta: { fontSize: 13, color: '#94A3B8' },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTicker: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  summaryMultiplierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  summaryMultiplierGreen: { backgroundColor: '#DCFCE7' },
  summaryMultiplierRed: { backgroundColor: '#FEE2E2' },
  summaryMultiplierBadgeText: { fontSize: 14, fontWeight: '700' },
  summaryMultiplierGreenText: { color: '#059669' },
  summaryMultiplierRedText: { color: '#DC2626' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryItem: { flex: 1 },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#F1F5F9' },
  gain: { color: '#059669' },
  loss: { color: '#DC2626' },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  sheetActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetActionText: { flex: 1 },
  sheetActionTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  sheetActionSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
});
