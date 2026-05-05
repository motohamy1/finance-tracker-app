import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PnLPair } from '@/types';
import { useTheme } from '@/services/theme';
import { formatCurrency, formatDate } from '@/utils/format';

interface PnLPairCardProps {
  pair: PnLPair;
  onEditTrade?: (tradeId: string) => void;
}

export function PnLPairCard({ pair, onEditTrade }: PnLPairCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isPositive = pair.realizedPnlCents >= 0;
  const pnlPercent = pair.buyPriceCents > 0
    ? ((pair.sellPriceCents - pair.buyPriceCents) / pair.buyPriceCents) * 100
    : 0;

  const bgTint = 'rgba(5, 150, 105, 0.15)';
  const borderTint = 'rgba(5, 150, 105, 0.3)';

  const handleEditPress = () => {
    if (!onEditTrade) return;
    Alert.alert(
      'Edit Trade',
      'Which side do you want to edit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit Buy',
          onPress: () => onEditTrade(pair.buyTradeId),
        },
        {
          text: 'Edit Sell',
          onPress: () => onEditTrade(pair.sellTradeId),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgTint, borderColor: borderTint }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      {/* Velvet fabric effects */}
      <View style={[styles.velvetOverlay, { backgroundColor: 'rgba(0,0,0,0.06)' }]} />
      <View style={[styles.velvetSheen, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
      <View style={[styles.velvetHighlight, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
      {/* Header: Ticker + P&L percentage badge + Edit */}
      <View style={styles.header}>
        <View style={styles.tickerSection}>
          <Text style={[styles.ticker, { color: colors.text }]}>{pair.ticker}</Text>
          <Text style={[styles.shares, { color: colors.textSecondary }]}>{pair.matchedShares} shares</Text>
        </View>
        <View style={styles.headerRight}>
          {onEditTrade && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                handleEditPress();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <View style={[styles.pnlBadge, isPositive ? styles.pnlBadgeGain : styles.pnlBadgeLoss]}>
            <Ionicons
              name={isPositive ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={isPositive ? colors.success : colors.danger}
            />
            <Text style={[styles.pnlBadgeText, { color: isPositive ? colors.success : colors.danger }]}>
              {isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Buy → Sell visual comparison */}
      <View style={styles.comparisonRow}>
        <View style={styles.side}>
          <View style={styles.dirBadge}>
            <Ionicons name="arrow-up-circle-outline" size={14} color="#059669" />
            <Text style={styles.dirBadgeText}>Buy</Text>
          </View>
          <Text style={[styles.price, { color: colors.text }]}>{formatCurrency(pair.buyPriceCents)}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(pair.buyDate)}</Text>
        </View>

        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
        </View>

        <View style={styles.side}>
          <View style={[styles.dirBadge, styles.dirBadgeSell]}>
            <Ionicons name="arrow-down-circle-outline" size={14} color={colors.danger} />
            <Text style={[styles.dirBadgeText, styles.dirBadgeTextSell]}>Sell</Text>
          </View>
          <Text style={[styles.price, { color: colors.text }]}>{formatCurrency(pair.sellPriceCents)}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(pair.sellDate)}</Text>
        </View>
      </View>

      {/* Result row */}
      <View style={[styles.resultRow, isPositive ? styles.resultGain : styles.resultLoss]}>
        <View style={styles.resultLeft}>
          <Ionicons
            name={isPositive ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={isPositive ? colors.success : colors.danger}
          />
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Realized P&L</Text>
        </View>
        <Text style={[styles.resultValue, { color: isPositive ? colors.success : colors.danger }]}>
          {isPositive ? '+' : ''}{formatCurrency(Math.abs(pair.realizedPnlCents))}
        </Text>
      </View>

      {expanded && (
        <View style={[styles.details, { borderTopColor: colors.divider }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Buy Fees</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(pair.buyFeesCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Sell Fees</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(pair.sellFeesCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Held for</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {Math.max(1, Math.ceil((new Date(pair.sellDate).getTime() - new Date(pair.buyDate).getTime()) / (1000 * 60 * 60 * 24)))} days
            </Text>
          </View>
        </View>
      )}

      <View style={styles.expandHint}>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  velvetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  velvetSheen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  velvetHighlight: {
    position: 'absolute',
    top: -15,
    left: -20,
    width: 120,
    height: 40,
    borderRadius: 60,
    transform: [{ rotate: '-20deg' }],
    zIndex: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    zIndex: 10,
  },
  tickerSection: {},
  ticker: { fontSize: 16, fontWeight: '700' },
  shares: { fontSize: 12, marginTop: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    padding: 4,
  },
  pnlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pnlBadgeGain: { backgroundColor: '#DCFCE7' },
  pnlBadgeLoss: { backgroundColor: '#FEE2E2' },
  pnlBadgeText: { fontSize: 12, fontWeight: '700' },

  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
    zIndex: 10,
  },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dirBadgeSell: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  dirBadgeText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  dirBadgeTextSell: { color: '#DC2626' },
  price: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 11 },
  arrow: {
    paddingHorizontal: 4,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    zIndex: 10,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  resultGain: { borderTopColor: 'rgba(34, 197, 94, 0.15)' },
  resultLoss: { borderTopColor: 'rgba(239, 68, 68, 0.15)' },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    zIndex: 10,
  },
  resultValue: { fontSize: 16, fontWeight: '700', zIndex: 10 },

  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 6,
    zIndex: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  detailLabel: { fontSize: 13, zIndex: 10 },
  detailValue: { fontSize: 13, fontWeight: '500', zIndex: 10 },
  expandHint: {
    alignItems: 'center',
    marginTop: 6,
    zIndex: 10,
  },
  gain: { color: '#059669' },
  loss: { color: '#DC2626' },
});
