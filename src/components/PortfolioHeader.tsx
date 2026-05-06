import { useTheme } from "@/services/theme";
import { useTradeStore } from "@/stores/tradeStore";
import { formatCurrency } from "@/utils/format";
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
    <View style={[styles.container, { backgroundColor: "#F97316" }]}>
      {/* Velvet fabric effects */}
      <View style={styles.velvetOverlay} />
      <View style={styles.velvetSheen} />
      <View style={styles.velvetHighlight} />
      <TouchableOpacity
        style={[styles.header, { backgroundColor: "transparent" }]}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="briefcase-outline"
            size={20}
            color="rgba(255,255,255,0.9)"
          />
          <Text style={[styles.title, { color: "#FFFFFF" }]}>Portfolio</Text>
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
            name={isExpanded ? "chevron-up" : "chevron-forward"}
            size={20}
            color="rgba(255,255,255,0.7)"
          />
        </View>
      </TouchableOpacity>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: "rgba(255,255,255,0.7)" }]}>
            Realized P&amp;L
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: "#FFFFFF", fontWeight: "700" },
              totalRealizedPnl >= 0 ? styles.gain : styles.loss,
            ]}
          >
            {totalRealizedPnl >= 0 ? "+" : ""}
            {formatCurrency(Math.abs(totalRealizedPnl))}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: "rgba(255,255,255,0.7)" }]}>
            Unrealized P&amp;L
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: "#FFFFFF", fontWeight: "700" },
              totalUnrealizedPnl >= 0 ? styles.gain : styles.loss,
            ]}
          >
            {hasUnrealized
              ? `${totalUnrealizedPnl >= 0 ? "+" : ""}${formatCurrency(Math.abs(totalUnrealizedPnl))}`
              : "Set prices"}
          </Text>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statValue}>{holdings.length}</Text>
              <Text style={styles.statLabel}>Open</Text>
            </View>
            <View style={styles.statTile}>
              <Ionicons name="checkmark-circle-outline" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statValue}>{pnlPairs.length}</Text>
              <Text style={styles.statLabel}>Closed</Text>
            </View>
            <View style={styles.statTile}>
              <Ionicons name="swap-vertical-outline" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statValue}>{trades.length}</Text>
              <Text style={styles.statLabel}>Trades</Text>
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
        <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.divider }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Update Prices
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {holdings.map((h) => (
              <View
                key={h.ticker}
                style={[styles.priceRow, { borderBottomColor: colors.divider }]}
              >
                <Text style={[styles.priceTicker, { color: colors.text }]}>
                  {h.ticker}
                </Text>
                <View
                  style={[
                    styles.priceInputWrapper,
                    { backgroundColor: colors.bgInput },
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
                    style={styles.priceInput}
                    value={prices[h.ticker] ?? ""}
                    onChangeText={(v) =>
                      setPrices((prev) => ({
                        ...prev,
                        [h.ticker]: v.replace(/[^0-9.]/g, ""),
                      }))
                    }
                    placeholder="0.00"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.saveAllButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
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
    overflow: "hidden",
    position: "relative",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  velvetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    zIndex: 1,
  },
  velvetSheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    zIndex: 2,
  },
  velvetHighlight: {
    position: "absolute",
    top: -30,
    left: -40,
    width: 200,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 100,
    transform: [{ rotate: "-20deg" }],
    zIndex: 3,
  },
  velvetShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: "700" },
  staleBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staleBadgeText: { fontSize: 10, fontWeight: "600", color: "#D97706" },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#ECFEFF",
  },
  updateButtonText: { fontSize: 13, fontWeight: "600", color: "#0891B2" },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    zIndex: 10,
  },
  summaryItem: { flex: 1, zIndex: 10 },
  summaryLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: "#F1F5F9" },
  gain: { color: "#059669" },
  loss: { color: "#DC2626" },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 16 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  priceTicker: { fontSize: 16, fontWeight: "600", flex: 1 },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 140,
  },
  pricePrefix: { fontSize: 16, marginRight: 2 },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "500",
    paddingVertical: 8,
  },
  saveAllButton: {
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: "center",
  },
  saveAllText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
