import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { HoldingCard } from './HoldingCard';
import { useTheme } from '@/services/theme';
import { formatCurrency } from '@/utils/format';

export function PortfolioHeader() {
  const { colors } = useTheme();
  const trades = useTradeStore((s) => s.trades);
  const currentPrices = useTradeStore((s) => s.currentPrices);
  const getHoldings = useTradeStore((s) => s.getHoldings);
  const getPnlPairs = useTradeStore((s) => s.getPnlPairs);
  const updateCurrentPrice = useTradeStore((s) => s.updateCurrentPrice);
  const bulkUpdatePrices = useTradeStore((s) => s.bulkUpdatePrices);

  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const animHeight = useSharedValue(300);

  const holdings = useMemo(() => getHoldings(), [trades, currentPrices]);
  const pnlPairs = useMemo(() => getPnlPairs(), [trades]);

  const totalRealizedPnl = useMemo(
    () => pnlPairs.reduce((sum, p) => sum + p.realizedPnlCents, 0),
    [pnlPairs]
  );

  const totalUnrealizedPnl = useMemo(
    () => holdings.reduce(
      (sum, h) => (h.unrealizedPnlCents !== null ? sum + h.unrealizedPnlCents : sum),
      0
    ),
    [holdings]
  );

  const hasUnrealized = holdings.some(h => h.currentPriceCents !== null);

  useEffect(() => {
    if (isExpanded && contentHeight > 0) {
      animHeight.value = withTiming(contentHeight, { duration: 250 });
    } else {
      animHeight.value = withTiming(0, { duration: 250 });
    }
  }, [isExpanded, contentHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animHeight.value,
    opacity: animHeight.value > 0 ? 1 : 0,
  }));

  const getStaleCount = () => {
    const now = new Date();
    return holdings.filter(h => {
      if (!h.priceUpdatedAt) return true;
      const diff = (now.getTime() - new Date(h.priceUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return diff > 7;
    }).length;
  };

  const staleCount = getStaleCount();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
      <TouchableOpacity
        style={[styles.header, { backgroundColor: colors.bgCardElevated }]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Portfolio</Text>
          {staleCount > 0 && (
            <View style={styles.staleBadge}>
              <Text style={styles.staleBadgeText}>{staleCount} stale</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={(e) => {
              e.stopPropagation?.();
              setShowBulkForm(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag-outline" size={14} color="#0891B2" />
            <Text style={styles.updateButtonText}>Prices</Text>
          </TouchableOpacity>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-forward'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Realized P&L</Text>
          <Text style={[styles.summaryValue, totalRealizedPnl >= 0 ? styles.gain : styles.loss]}>
            {totalRealizedPnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalRealizedPnl))}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Unrealized P&L</Text>
          <Text style={[styles.summaryValue, totalUnrealizedPnl >= 0 ? styles.gain : styles.loss]}>
            {hasUnrealized
              ? `${totalUnrealizedPnl >= 0 ? '+' : ''}${formatCurrency(Math.abs(totalUnrealizedPnl))}`
              : 'Set prices'}
          </Text>
        </View>
      </View>

      <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
        <View
          style={styles.content}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) setContentHeight(h);
          }}
        >
          {holdings.length === 0 ? (
            <View style={styles.emptyHoldings}>
              <Ionicons name="briefcase-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No open positions</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>All trades have been fully sold</Text>
            </View>
          ) : (
            holdings.map(h => (
              <HoldingCard
                key={h.ticker}
                holding={h}
                onPress={() => {
                  updateCurrentPrice(h.ticker, h.currentPriceCents ?? 0);
                }}
              />
            ))
          )}
        </View>
      </Animated.View>

      <BulkPriceForm
        visible={showBulkForm}
        holdings={holdings}
        onClose={() => setShowBulkForm(false)}
        onSave={(prices) => {
          bulkUpdatePrices(prices);
          setShowBulkForm(false);
        }}
      />
    </View>
  );
}

function BulkPriceForm({
  visible,
  holdings,
  onClose,
  onSave,
}: {
  visible: boolean;
  holdings: { ticker: string; currentPriceCents: number | null }[];
  onClose: () => void;
  onSave: (prices: Record<string, number>) => void;
}) {
  const { colors } = useTheme();
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, string> = {};
    for (const h of holdings) {
      init[h.ticker] = h.currentPriceCents !== null ? (h.currentPriceCents / 100).toFixed(2) : '';
    }
    setPrices(init);
  }, [holdings, visible]);

  const handleSave = () => {
    const result: Record<string, number> = {};
    for (const [ticker, val] of Object.entries(prices)) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        result[ticker] = Math.round(num * 100);
      }
    }
    onSave(result);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Update Prices</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {holdings.map(h => (
              <View key={h.ticker} style={[styles.priceRow, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.priceTicker, { color: colors.text }]}>{h.ticker}</Text>
                <View style={[styles.priceInputWrapper, { backgroundColor: colors.bgInput }]}>
                  <Text style={[styles.pricePrefix, { color: colors.textSecondary }]}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={prices[h.ticker] ?? ''}
                    onChangeText={(v) => setPrices(prev => ({ ...prev, [h.ticker]: v.replace(/[^0-9.]/g, '') }))}
                    placeholder="0.00"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.saveAllButton, { backgroundColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveAllText}>Save All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: '700' },
  staleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staleBadgeText: { fontSize: 10, fontWeight: '600', color: '#D97706' },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ECFEFF',
  },
  updateButtonText: { fontSize: 13, fontWeight: '600', color: '#0891B2' },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#F1F5F9' },
  gain: { color: '#059669' },
  loss: { color: '#DC2626' },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyHoldings: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptySubtext: { fontSize: 13 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 16 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  priceTicker: { fontSize: 16, fontWeight: '600', flex: 1 },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 140,
  },
  pricePrefix: { fontSize: 16, marginRight: 2 },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 8,
  },
  saveAllButton: {
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  saveAllText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
