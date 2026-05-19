import { useTheme } from "@/services/theme";
import { useTradeStore } from "@/stores/tradeStore";
import { formatCurrency } from "@/utils/format";
import { FONT_MONO } from "@/utils/typography";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PortfolioHeaderProps {}

export function PortfolioHeader({}: PortfolioHeaderProps) {
  const { colors } = useTheme();
  const trades = useTradeStore((s) => s.trades);
  const currentPrices = useTradeStore((s) => s.currentPrices);
  const getHoldings = useTradeStore((s) => s.getHoldings);
  const getPnlPairs = useTradeStore((s) => s.getPnlPairs);
  const bulkUpdatePrices = useTradeStore((s) => s.bulkUpdatePrices);

  const [isExpanded, setIsExpanded] = useState(true);
  const toggleExpanded = () => setIsExpanded((prev) => !prev);
  const [showBulkForm, setShowBulkForm] = useState(false);

  const holdings = useMemo(() => getHoldings(), [trades, currentPrices]);
  const pnlPairs = useMemo(() => getPnlPairs(), [trades]);

  const totalRealizedPnl = useMemo(
    () => pnlPairs.reduce((sum, p) => sum + p.realizedPnlCents, 0),
    [pnlPairs],
  );

  const totalUnrealizedPnl = useMemo(
    () =>
      holdings.reduce(
        (sum, h) =>
          h.unrealizedPnlCents !== null ? sum + h.unrealizedPnlCents : sum,
        0,
      ),
    [holdings],
  );

  const hasUnrealized = holdings.some((h) => h.currentPriceCents !== null);

  const getStaleCount = () => {
    const now = new Date();
    return holdings.filter((h) => {
      if (!h.priceUpdatedAt) return true;
      const diff =
        (now.getTime() - new Date(h.priceUpdatedAt).getTime()) /
        (1000 * 60 * 60 * 24);
      return diff > 7;
    }).length;
  };

  const staleCount = getStaleCount();

  return (
    <View style={[styles.container, { backgroundColor: colors.secondary }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.9}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="briefcase-outline"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.title}>PORTFOLIO</Text>
          {staleCount > 0 && (
            <View style={styles.staleBadge}>
              <Text style={styles.staleBadgeText}>{staleCount} STALE</Text>
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
            activeOpacity={0.9}
          >
            <Ionicons name="pricetag-outline" size={14} color="#0A0A0F" />
            <Text style={styles.updateButtonText}>PRICES</Text>
          </TouchableOpacity>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-forward"}
            size={20}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>REALIZED P&L</Text>
          <Text
            style={[
              styles.summaryValue,
              totalRealizedPnl >= 0 ? styles.gain : styles.loss,
            ]}
          >
            {totalRealizedPnl >= 0 ? "+" : ""}
            {formatCurrency(Math.abs(totalRealizedPnl))}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>UNREALIZED P&L</Text>
          <Text
            style={[
              styles.summaryValue,
              hasUnrealized
                ? totalUnrealizedPnl >= 0
                  ? styles.gain
                  : styles.loss
                : styles.neutral,
            ]}
          >
            {hasUnrealized
              ? `${totalUnrealizedPnl >= 0 ? "+" : ""}${formatCurrency(Math.abs(totalUnrealizedPnl))}`
              : "SET PRICES"}
          </Text>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Ionicons name="time-outline" size={18} color="#FFFFFF" />
              <Text style={styles.statValue}>{holdings.length}</Text>
              <Text style={styles.statLabel}>OPEN</Text>
            </View>
            <View style={styles.statTile}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.statValue}>{pnlPairs.length}</Text>
              <Text style={styles.statLabel}>CLOSED</Text>
            </View>
            <View style={styles.statTile}>
              <Ionicons name="swap-vertical-outline" size={18} color="#FFFFFF" />
              <Text style={styles.statValue}>{trades.length}</Text>
              <Text style={styles.statLabel}>TRADES</Text>
            </View>
          </View>
        </View>
      )}

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
      init[h.ticker] =
        h.currentPriceCents !== null
          ? (h.currentPriceCents / 100).toFixed(2)
          : "";
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
        <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 3 }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              UPDATE PRICES
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {holdings.map((h) => (
              <View
                key={h.ticker}
                style={[styles.priceRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.priceTicker, { color: colors.text }]}>
                  {h.ticker}
                </Text>
                <View
                  style={[
                    styles.priceInputWrapper,
                    { backgroundColor: colors.bgInput, borderColor: colors.border, borderWidth: 2 },
                  ]}
                >
                  <Text
                    style={[
                      styles.pricePrefix,
                      { color: colors.textSecondary },
                    ]}
                  >
                    $
                  </Text>
                  <TextInput
                    style={[styles.priceInput, { color: colors.text }]}
                    value={prices[h.ticker] ?? ""}
                    onChangeText={(v) =>
                      setPrices((prev) => ({
                        ...prev,
                        [h.ticker]: v.replace(/[^0-9.]/g, ""),
                      }))
                    }
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.saveAllButton, { backgroundColor: colors.primary, borderColor: '#FFFFFF', borderWidth: 2 }]}
            onPress={handleSave}
            activeOpacity={0.9}
          >
            <Text style={styles.saveAllText}>SAVE ALL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Neo-Brutalist Styles ───
const BORDER_WIDTH = 3;
const BORDER_COLOR = '#FFFFFF';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
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
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  staleBadge: {
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  staleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0A0A0F',
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0F',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  summaryItem: { flex: 1 },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    fontFamily: FONT_MONO,
  },
  summaryDivider: {
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gain: { color: '#39FF14' },
  loss: { color: '#FF0000' },
  neutral: { color: '#FFFFFF' },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONT_MONO,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalBody: { padding: 16 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 2,
  },
  priceTicker: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    paddingHorizontal: 10,
    width: 140,
  },
  pricePrefix: { fontSize: 16, marginRight: 2, fontWeight: '700' },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    fontFamily: FONT_MONO,
  },
  saveAllButton: {
    borderRadius: 0,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  saveAllText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
