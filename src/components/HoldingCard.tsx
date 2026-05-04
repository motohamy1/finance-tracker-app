import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Holding } from '@/types';
import { useTheme } from '@/services/theme';
import { formatCurrency } from '@/utils/format';

interface HoldingCardProps {
  holding: Holding;
  onPress: () => void;
  onAddSell?: (ticker: string, shares: number, avgCostCents: number) => void;
}

function isStale(updatedAt: string | null): boolean {
  if (!updatedAt) return true;
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}

export function HoldingCard({ holding, onPress, onAddSell }: HoldingCardProps) {
  const { colors } = useTheme();
  const hasPrice = holding.currentPriceCents !== null;
  const isProfitable = holding.unrealizedPnlCents !== null && holding.unrealizedPnlCents >= 0;
  const stale = isStale(holding.priceUpdatedAt);

  const bgTint = hasPrice
    ? isProfitable
      ? 'rgba(34, 197, 94, 0.08)'
      : 'rgba(239, 68, 68, 0.08)'
    : colors.bgCardElevated;
  const borderTint = hasPrice
    ? isProfitable
      ? 'rgba(34, 197, 94, 0.2)'
      : 'rgba(239, 68, 68, 0.2)'
    : colors.border;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgTint, borderColor: borderTint }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <View style={styles.tickerRow}>
            <Text style={[styles.ticker, { color: colors.text }]}>{holding.ticker}</Text>
            {stale && hasPrice && (
              <Ionicons name="warning-outline" size={12} color="#D97706" style={styles.staleIcon} />
            )}
          </View>
          <Text style={[styles.shares, { color: colors.textSecondary }]}>{holding.totalShares} shares</Text>
          <Text style={[styles.costBasis, { color: colors.textMuted }]}>
            Avg cost: {formatCurrency(holding.averageCostBasisCents)}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Current</Text>
          <Text style={[styles.priceValue, { color: colors.text }]}>
            {hasPrice ? formatCurrency(holding.currentPriceCents!) : 'Set price'}
          </Text>
        </View>
      </View>
      {hasPrice && (
        <View style={[styles.pnlRow, { borderTopColor: colors.divider }, isProfitable ? styles.pnlPositive : styles.pnlNegative]}>
          <Ionicons
            name={isProfitable ? 'trending-up' : 'trending-down'}
            size={14}
            color={isProfitable ? colors.success : colors.danger}
          />
          <Text style={[styles.pnlText, { color: isProfitable ? colors.success : colors.danger }]}>
            {isProfitable ? '+' : ''}
            {holding.unrealizedPnlCents !== null ? formatCurrency(Math.abs(holding.unrealizedPnlCents)) : '—'}
            {holding.unrealizedPnlPercent !== null && (
              ` (${isProfitable ? '+' : ''}${holding.unrealizedPnlPercent.toFixed(1)}%)`
            )}
          </Text>
        </View>
      )}

      {/* Open Position badge + Add Sell CTA */}
      <View style={[styles.sellSection, { borderTopColor: colors.divider }]}>
        <View style={styles.awaitingBadge}>
          <Ionicons name="wallet-outline" size={12} color="#D97706" />
          <Text style={styles.awaitingText}>{holding.totalShares} share{holding.totalShares !== 1 ? 's' : ''} open</Text>
        </View>
        {onAddSell && (
          <TouchableOpacity
            style={styles.addSellButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onAddSell(holding.ticker, holding.totalShares, holding.averageCostBasisCents);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={14} color="#FFFFFF" />
            <Text style={styles.addSellText}>Add Sell</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasPrice && holding.priceUpdatedAt && (
        <Text style={[styles.updatedAt, { color: colors.textMuted }, stale && styles.stale]}>
          Updated {new Date(holding.priceUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftCol: { flex: 1 },
  rightCol: { alignItems: 'flex-end' },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ticker: { fontSize: 16, fontWeight: '700' },
  staleIcon: { marginLeft: 2 },
  shares: { fontSize: 13 },
  costBasis: { fontSize: 12, marginTop: 2 },
  priceLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  pnlPositive: {},
  pnlNegative: {},
  pnlText: { fontSize: 13, fontWeight: '600' },
  sellSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  awaitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  awaitingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  addSellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  updatedAt: { fontSize: 11, marginTop: 4 },
  stale: { color: '#D97706' },
});
