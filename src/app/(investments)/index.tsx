import {
  ActionSheetModal,
  type ActionSheetOption,
} from "@/components/ActionSheetModal";
import { BottomSheet } from "@/components/BottomSheet";
import { EmptyState } from "@/components/EmptyState";
import { HoldingCard } from "@/components/HoldingCard";
import { PnLPairCard } from "@/components/PnLPairCard";
import { PortfolioHeader } from "@/components/PortfolioHeader";
import { TradeCard } from "@/components/TradeCard";
import {
  TradeFilterSheet,
  type FilterState,
} from "@/components/TradeFilterSheet";
import { useTheme } from "@/services/theme";
import { useTradeStore } from "@/stores/tradeStore";
import type { Holding, PnLPair, Trade } from "@/types";
import { formatCurrency } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type ViewTab = "holdings" | "pairs" | "trades";

export default function InvestmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const trades = useTradeStore((s) => s.trades);
  const isLoading = useTradeStore((s) => s.isLoading);
  const isInitialized = useTradeStore((s) => s.isInitialized);
  const initialize = useTradeStore((s) => s.initialize);
  const getPnlPairs = useTradeStore((s) => s.getPnlPairs);
  const getHoldings = useTradeStore((s) => s.getHoldings);
  const getSummaryByTicker = useTradeStore((s) => s.getSummaryByTicker);
  const getCategorySummary = useTradeStore((s) => s.getCategorySummary);
  const getAvailableCategories = useTradeStore((s) => s.getAvailableCategories);
  const getTradesByCategory = useTradeStore((s) => s.getTradesByCategory);

  const [activeTab, setActiveTab] = useState<ViewTab>("holdings");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFabSheet, setShowFabSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetTitle, setActionSheetTitle] = useState("");
  const [actionSheetOptions, setActionSheetOptions] = useState<
    ActionSheetOption[]
  >([]);
  const [showHoldingSheet, setShowHoldingSheet] = useState(false);
  const [holdingSheetTicker, setHoldingSheetTicker] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState<FilterState>({
    direction: "all",
    dateFrom: null,
    dateTo: null,
    searchQuery: "",
  });

  useEffect(() => {
    initialize();
  }, []);

  const pnlPairs = useMemo(() => getPnlPairs(), [trades]);
  const holdings = useMemo(() => getHoldings(), [trades]);

  const tickers = useMemo(() => {
    const set = new Set(trades.map((t) => t.ticker));
    return [...set].sort();
  }, [trades]);

  const isFiltered =
    filters.direction !== "all" ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.searchQuery !== "";

  const availableCategories = useMemo(() => getAvailableCategories(), [trades]);

  // ── Filtered data for Positions tab ──
  const filteredHoldings = useMemo(() => {
    let result = holdings;
    if (selectedTicker) {
      result = result.filter((h) => h.ticker === selectedTicker);
    }
    return result;
  }, [holdings, selectedTicker]);

  const filteredPairs = useMemo(() => {
    let result = pnlPairs;
    if (selectedCategory) {
      result = result.filter((p) => {
        const buyTrade = trades.find((t) => t.id === p.buyTradeId);
        return buyTrade?.assetType === selectedCategory;
      });
    }
    if (selectedTicker) {
      result = result.filter((p) => p.ticker === selectedTicker);
    }
    if (filters.dateFrom) {
      result = result.filter((p) => p.sellDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((p) => p.sellDate <= filters.dateTo!);
    }
    return result;
  }, [pnlPairs, selectedTicker, selectedCategory, filters, trades]);

  // ── Filtered data for Trades tab ──
  const filteredTrades = useMemo(() => {
    let result = [...trades].sort((a, b) =>
      b.tradeDate.localeCompare(a.tradeDate),
    );
    if (selectedCategory) {
      result = result.filter((t) => t.assetType === selectedCategory);
    }
    if (selectedTicker) {
      result = result.filter((t) => t.ticker === selectedTicker);
    }
    if (filters.direction !== "all") {
      result = result.filter((t) => t.direction === filters.direction);
    }
    if (filters.dateFrom) {
      result = result.filter((t) => t.tradeDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((t) => t.tradeDate <= filters.dateTo!);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticker.toLowerCase().includes(q) ||
          (t.notes?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [trades, selectedTicker, selectedCategory, filters]);

  const pairedTradeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of pnlPairs) {
      ids.add(p.buyTradeId);
      ids.add(p.sellTradeId);
    }
    return ids;
  }, [pnlPairs]);

  // ── Handlers ──
  const handleGalleryImport = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library to import screenshots.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: "/(investments)/import",
        params: { sharedImageUri: result.assets[0].uri },
      });
    }
  };

  const handleManualEntry = () => {
    router.push("/(investments)/manual");
  };

  const handleAddSell = useCallback(
    (ticker: string, shares: number, avgCostCents: number) => {
      setShowFabSheet(false);
      router.push({
        pathname: "/(investments)/manual",
        params: {
          prefillTicker: ticker,
          prefillDirection: "sell",
          prefillShares: String(shares),
          avgCostCents: String(avgCostCents),
        },
      });
    },
    [router],
  );

  const handleHoldingPress = useCallback((holding: Holding) => {
    setHoldingSheetTicker(holding.ticker);
    setShowHoldingSheet(true);
  }, []);

  const handleFabPress = () => {
    setShowFabSheet(true);
  };

  const handleTradePress = (trade: Trade) => {
    router.push({
      pathname: "/(investments)/review",
      params: { tradeId: trade.id },
    });
  };

  const getPnlForTrade = useCallback(
    (tradeId: string): number | null => {
      const pair = pnlPairs.find(
        (p) => p.buyTradeId === tradeId || p.sellTradeId === tradeId,
      );
      if (!pair) return null;
      if (pair.buyTradeId === tradeId) return -pair.realizedPnlCents;
      return pair.realizedPnlCents;
    },
    [pnlPairs],
  );

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.bg }]}
        edges={["top"]}
      />
    );
  }

  if (trades.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
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
        <View
          style={[
            styles.emptyActions,
            { paddingBottom: Math.max(insets.bottom, 16) + 60 + 24 },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGalleryImport}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Import Screenshot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleManualEntry}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={20} color="#0891B2" />
            <Text style={styles.secondaryButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Tab header component ──
  const ListHeader = () => (
    <View>
      <PortfolioHeader />

      {/* Tab selector */}
      <View style={styles.tabBar}>
        <View
          style={[
            styles.segmentedPill,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.segment]}
            onPress={() => setActiveTab("holdings")}
            activeOpacity={0.7}
          >
            {activeTab === "holdings" && (
              <View
                style={[
                  styles.segmentActiveBg,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}
            <Text
              style={[
                styles.segmentText,
                activeTab === "holdings" && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Open
            </Text>
          </TouchableOpacity>
          {activeTab !== "pairs" && activeTab !== "holdings" && (
            <View
              style={[
                styles.segmentDivider,
                { backgroundColor: colors.border },
              ]}
            />
          )}
          <TouchableOpacity
            style={[styles.segment]}
            onPress={() => setActiveTab("pairs")}
            activeOpacity={0.7}
          >
            {activeTab === "pairs" && (
              <View
                style={[
                  styles.segmentActiveBg,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}
            <Text
              style={[
                styles.segmentText,
                activeTab === "pairs" && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Closed
            </Text>
          </TouchableOpacity>
          {activeTab !== "trades" && activeTab !== "pairs" && (
            <View
              style={[
                styles.segmentDivider,
                { backgroundColor: colors.border },
              ]}
            />
          )}
          <TouchableOpacity
            style={[styles.segment]}
            onPress={() => setActiveTab("trades")}
            activeOpacity={0.7}
          >
            {activeTab === "trades" && (
              <View
                style={[
                  styles.segmentActiveBg,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}
            <Text
              style={[
                styles.segmentText,
                activeTab === "trades" && styles.segmentTextActive,
              ]}
              numberOfLines={1}
            >
              Trades
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.filterIconButton,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
            isFiltered && styles.filterIconButtonActive,
          ]}
          onPress={() => setShowFilterSheet(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="filter"
            size={16}
            color={isFiltered ? "#FFFFFF" : "#64748B"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={["top"]}
    >
      {activeTab === "holdings" ? (
        <FlatList
          data={filteredHoldings}
          keyExtractor={(item: Holding) => `holding-${item.ticker}`}
          ListHeaderComponent={<ListHeader />}
          renderItem={({ item }: { item: Holding }) => (
            <View style={styles.sectionItemContainer}>
              <HoldingCard
                holding={item}
                onPress={() => handleHoldingPress(item)}
                onAddSell={handleAddSell}
              />
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 60 + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyTab}>
              <Ionicons name="time-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTabTitle}>No open positions</Text>
              <Text style={styles.emptyTabBody}>
                Add a buy trade to start tracking open positions.
              </Text>
            </View>
          }
        />
      ) : activeTab === "pairs" ? (
        <FlatList
          data={filteredPairs}
          keyExtractor={(item: PnLPair) =>
            `${item.buyTradeId}-${item.sellTradeId}`
          }
          ListHeaderComponent={<ListHeader />}
          renderItem={({ item }: { item: PnLPair }) => (
            <View style={styles.sectionItemContainer}>
              <PnLPairCard
                pair={item}
                onEditTrade={(tradeId) => {
                  router.push({
                    pathname: "/(investments)/review",
                    params: { tradeId },
                  });
                }}
              />
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 60 + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyTab}>
              <Ionicons
                name="checkmark-circle-outline"
                size={40}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTabTitle}>No completed trades</Text>
              <Text style={styles.emptyTabBody}>
                Sell a position to see completed P&amp;L trades here.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredTrades}
          keyExtractor={(item: Trade) => item.id}
          ListHeaderComponent={<ListHeader />}
          renderItem={({ item }: { item: Trade }) => {
            const trade = item;
            const paired = pairedTradeIds.has(trade.id);
            const pnlCents =
              trade.direction === "sell" ? getPnlForTrade(trade.id) : null;
            let multiplier: number | null = null;
            if (pnlCents !== null && trade.direction === "sell") {
              const pair = pnlPairs.find((p) => p.sellTradeId === trade.id);
              if (pair) {
                const buyTrade = trades.find((t) => t.id === pair.buyTradeId);
                if (buyTrade) {
                  const invested =
                    buyTrade.shares * buyTrade.pricePerShareCents;
                  multiplier =
                    invested > 0 ? (invested + pnlCents) / invested : null;
                }
              }
            }
            return (
              <TradeCard
                trade={trade}
                pnlCents={
                  trade.direction === "sell" && paired ? pnlCents : null
                }
                pnlMultiplier={multiplier}
                onPress={() => handleTradePress(trade)}
              />
            );
          }}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 60 + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyTab}>
              <Ionicons name="list-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTabTitle}>No trades yet</Text>
              <Text style={styles.emptyTabBody}>
                Import a screenshot or enter a trade manually to start.
              </Text>
            </View>
          }
        />
      )}

      <TradeFilterSheet
        visible={showFilterSheet}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilterSheet(false)}
      />

      <BottomSheet
        visible={showFabSheet}
        onClose={() => setShowFabSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetAction}
          onPress={() => {
            setShowFabSheet(false);
            handleManualEntry();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.sheetActionIcon}>
            <Ionicons name="create-outline" size={24} color="#0891B2" />
          </View>
          <View style={styles.sheetActionText}>
            <Text style={styles.sheetActionTitle}>Manual Entry</Text>
            <Text style={styles.sheetActionSubtitle}>
              Enter trade details yourself
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sheetAction}
          onPress={() => {
            setShowFabSheet(false);
            handleGalleryImport();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.sheetActionIcon}>
            <Ionicons name="scan-outline" size={24} color="#0891B2" />
          </View>
          <View style={styles.sheetActionText}>
            <Text style={styles.sheetActionTitle}>Scan Screenshot (OCR)</Text>
            <Text style={styles.sheetActionSubtitle}>
              Import and extract trade data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>
      </BottomSheet>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: Math.max(insets.bottom, 16) + 60 + 20,
            zIndex: 100,
            elevation: 100,
          },
        ]}
        onPress={handleFabPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <ActionSheetModal
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title={actionSheetTitle}
        options={actionSheetOptions}
      />

      <HoldingTradesSheet
        visible={showHoldingSheet}
        ticker={holdingSheetTicker}
        trades={trades}
        onClose={() => {
          setShowHoldingSheet(false);
          setHoldingSheetTicker(null);
        }}
        onEditTrade={(tradeId) => {
          setShowHoldingSheet(false);
          setHoldingSheetTicker(null);
          router.push({
            pathname: "/(investments)/review",
            params: { tradeId },
          });
        }}
        onDeleteTrade={(tradeId) => {
          const store = useTradeStore.getState();
          store.removeTrade(tradeId);
        }}
        onSell={(ticker, shares, avgCostCents) => {
          setShowHoldingSheet(false);
          setHoldingSheetTicker(null);
          handleAddSell(ticker, shares, avgCostCents);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Holding Trades Sheet ───
// Shows all individual buy trades for a ticker so user can edit/delete each one
function HoldingTradesSheet({
  visible,
  ticker,
  trades,
  onClose,
  onEditTrade,
  onDeleteTrade,
  onSell,
}: {
  visible: boolean;
  ticker: string | null;
  trades: Trade[];
  onClose: () => void;
  onEditTrade: (tradeId: string) => void;
  onDeleteTrade: (tradeId: string) => void;
  onSell: (ticker: string, shares: number, avgCostCents: number) => void;
}) {
  const { colors } = useTheme();

  const tickerTrades = useMemo(() => {
    if (!ticker) return [];
    return trades
      .filter((t) => t.ticker === ticker && t.direction === "buy")
      .sort((a, b) => b.tradeDate.localeCompare(a.tradeDate));
  }, [trades, ticker]);

  const totalShares = tickerTrades.reduce((s, t) => s + t.shares, 0);
  const avgCostCents =
    totalShares > 0
      ? Math.round(
          tickerTrades.reduce(
            (s, t) => s + t.shares * t.pricePerShareCents,
            0,
          ) / totalShares,
        )
      : 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={ticker ?? "Trades"}>
      {/* Summary row */}
      {ticker && (
        <View
          style={[styles.sheetSummary, { backgroundColor: colors.bgInput }]}
        >
          <Text
            style={[styles.sheetSummaryLabel, { color: colors.textSecondary }]}
          >
            {totalShares} shares · Avg {formatCurrency(avgCostCents)}
          </Text>
          <TouchableOpacity
            style={[styles.sheetSellBtn, { backgroundColor: colors.danger }]}
            onPress={() => onSell(ticker, totalShares, avgCostCents)}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-vertical" size={14} color="#FFFFFF" />
            <Text style={styles.sheetSellBtnText}>Sell</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Trade list */}
      <View style={{ gap: 8, marginTop: 8 }}>
        {tickerTrades.map((trade) => (
          <TouchableOpacity
            key={trade.id}
            style={[styles.sheetTradeRow, { backgroundColor: colors.bgInput }]}
            onPress={() => onEditTrade(trade.id)}
            onLongPress={() => {
              Alert.alert(
                "Delete Trade?",
                `${trade.ticker} · ${trade.shares} shares · ${formatCurrency(trade.pricePerShareCents)}`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDeleteTrade(trade.id),
                  },
                ],
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sheetTradeLeft}>
              <View
                style={[
                  styles.sheetTradeDirBadge,
                  { backgroundColor: colors.success + "20" },
                ]}
              >
                <Ionicons name="arrow-up" size={12} color={colors.success} />
                <Text
                  style={[styles.sheetTradeDirText, { color: colors.success }]}
                >
                  Buy
                </Text>
              </View>
              <Text
                style={[styles.sheetTradeDate, { color: colors.textSecondary }]}
              >
                {trade.tradeDate}
              </Text>
            </View>
            <View style={styles.sheetTradeRight}>
              <Text style={[styles.sheetTradeShares, { color: colors.text }]}>
                {trade.shares} shares
              </Text>
              <Text
                style={[
                  styles.sheetTradePrice,
                  { color: colors.textSecondary },
                ]}
              >
                {formatCurrency(trade.pricePerShareCents)}
              </Text>
            </View>
            <Ionicons
              name="pencil-outline"
              size={16}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingTop: 8, paddingBottom: 80 },
  filterBar: {
    paddingTop: 4,
    paddingBottom: 4,
  },

  // Tab bar — segmented pill
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  segmentedPill: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 44,
  },
  segment: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  segmentActiveBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    margin: 2,
  },
  segmentDivider: {
    width: 1,
    marginVertical: 10,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
    zIndex: 1,
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterIconButtonActive: {
    backgroundColor: "#0891B2",
    borderColor: "#0891B2",
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionItemContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  // Empty tab
  emptyTab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTabTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#475569",
  },
  emptyTabBody: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },

  // Existing styles
  emptyActions: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0891B2",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0891B2",
  },
  secondaryButtonText: { color: "#0891B2", fontSize: 16, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0891B2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  previewCard: {
    marginTop: 24,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    opacity: 0.6,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  previewDetails: { flex: 1, gap: 2 },
  previewTicker: { fontSize: 18, fontWeight: "700", color: "#64748B" },
  previewMeta: { fontSize: 13, color: "#94A3B8" },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTicker: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  summaryMultiplierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  summaryMultiplierGreen: { backgroundColor: "#DCFCE7" },
  summaryMultiplierRed: { backgroundColor: "#FEE2E2" },
  summaryMultiplierBadgeText: { fontSize: 14, fontWeight: "700" },
  summaryMultiplierGreenText: { color: "#059669" },
  summaryMultiplierRedText: { color: "#DC2626" },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryItem: { flex: 1 },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  summaryDivider: { width: 1, backgroundColor: "#F1F5F9" },
  gain: { color: "#059669" },
  loss: { color: "#DC2626" },
  sheetAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  sheetActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ECFEFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetActionText: { flex: 1 },
  sheetActionTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  sheetActionSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },

  // Holding trades sheet
  sheetSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
  },
  sheetSummaryLabel: { fontSize: 14, fontWeight: "600" },
  sheetSellBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sheetSellBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  sheetTradeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  sheetTradeLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sheetTradeDirBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sheetTradeDirText: { fontSize: 11, fontWeight: "600" },
  sheetTradeDate: { fontSize: 12 },
  sheetTradeRight: { flex: 1, alignItems: "flex-end" },
  sheetTradeShares: { fontSize: 14, fontWeight: "600" },
  sheetTradePrice: { fontSize: 12, marginTop: 2 },
});
