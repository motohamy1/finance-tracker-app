import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Holding } from '@/types';
import { useTheme } from '@/services/theme';
import { formatCurrency } from '@/utils/format';
import { FONT_MONO } from '@/utils/typography';

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

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <View style={styles.tickerRow}>
            <Text style={[styles.ticker, { color: colors.text }]}>{holding.ticker}</Text>
            {stale && hasPrice && (
              <Ionicons name="warning-outline" size={12} color={colors.warning} style={styles.staleIcon} />
            )}
          </View>
          <Text style={[styles.shares, { color: colors.textSecondary }]}>{holding.totalShares} SHARES</Text>
          <Text style={[styles.costBasis, { color: colors.textMuted }]}>
            AVG COST: {formatCurrency(holding.averageCostBasisCents)}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>CURRENT</Text>
          <Text style={[styles.priceValue, { color: colors.text }]}>
            {hasPrice ? formatCurrency(holding.currentPriceCents!) : 'SET PRICE'}
          </Text>
        </View>
      </View>
      {hasPrice && (
        <View style={[styles.pnlRow, { borderTopColor: colors.border }]}>
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

      <View style={[styles.sellSection, { borderTopColor: colors.border }]}>
        <View style={[styles.awaitingBadge, { borderColor: colors.border }]}>
          <Ionicons name="wallet-outline" size={12} color={colors.warning} />
          <Text style={[styles.awaitingText, { color: colors.warning }]}>
            {holding.totalShares} OPEN
          </Text>
        </View>
        {onAddSell && (
          <TouchableOpacity
            style={[styles.addSellButton, { backgroundColor: colors.danger, borderColor: '#FFFFFF' }]}
            onPress={(e) => {
              e.stopPropagation?.();
              onAddSell(holding.ticker, holding.totalShares, holding.averageCostBasisCents);
            }}
            activeOpacity={0.9}
          >
            <Ionicons name="swap-vertical" size={14} color="#FFFFFF" />
            <Text style={styles.addSellText}>ADD SELL</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasPrice && holding.priceUpdatedAt && (
        <Text style={[styles.updatedAt, { color: colors.textMuted }, stale && { color: colors.warning }]}>
          UPDATED {new Date(holding.priceUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    borderWidth: 2,
    padding: 14,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
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
  ticker: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  staleIcon: { marginLeft: 2 },
  shares: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  costBasis: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: FONT_MONO,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
  },
  pnlText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_MONO,
  },
  sellSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
  },
  awaitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 2,
  },
  awaitingText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  addSellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 2,
  },
  addSellText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  updatedAt: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
