import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Holding } from '@/types';
import { formatCurrency } from '@/utils/format';

interface HoldingCardProps {
  holding: Holding;
  onPress: () => void;
}

function isStale(updatedAt: string | null): boolean {
  if (!updatedAt) return true;
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}

export function HoldingCard({ holding, onPress }: HoldingCardProps) {
  const hasPrice = holding.currentPriceCents !== null;
  const isProfitable = holding.unrealizedPnlCents !== null && holding.unrealizedPnlCents >= 0;
  const stale = isStale(holding.priceUpdatedAt);

  const bgTint = hasPrice
    ? isProfitable
      ? 'rgba(34, 197, 94, 0.08)'
      : 'rgba(239, 68, 68, 0.08)'
    : '#F8FAFC';
  const borderTint = hasPrice
    ? isProfitable
      ? 'rgba(34, 197, 94, 0.2)'
      : 'rgba(239, 68, 68, 0.2)'
    : '#E2E8F0';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgTint, borderColor: borderTint }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <View style={styles.tickerRow}>
            <Text style={styles.ticker}>{holding.ticker}</Text>
            {stale && hasPrice && (
              <Ionicons name="warning-outline" size={12} color="#D97706" style={styles.staleIcon} />
            )}
          </View>
          <Text style={styles.shares}>{holding.totalShares} shares</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.priceLabel}>Current</Text>
          <Text style={styles.priceValue}>
            {hasPrice ? formatCurrency(holding.currentPriceCents!) : 'Set price'}
          </Text>
        </View>
      </View>
      {hasPrice && (
        <View style={[styles.pnlRow, isProfitable ? styles.pnlPositive : styles.pnlNegative]}>
          <Ionicons
            name={isProfitable ? 'trending-up' : 'trending-down'}
            size={14}
            color={isProfitable ? '#059669' : '#DC2626'}
          />
          <Text style={[styles.pnlText, { color: isProfitable ? '#059669' : '#DC2626' }]}>
            {isProfitable ? '+' : ''}
            {holding.unrealizedPnlCents !== null ? formatCurrency(Math.abs(holding.unrealizedPnlCents)) : '—'}
            {holding.unrealizedPnlPercent !== null && (
              ` (${isProfitable ? '+' : ''}${holding.unrealizedPnlPercent.toFixed(1)}%)`
            )}
          </Text>
        </View>
      )}
      {hasPrice && holding.priceUpdatedAt && (
        <Text style={[styles.updatedAt, stale && styles.stale]}>
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
  ticker: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  staleIcon: { marginLeft: 2 },
  shares: { fontSize: 13, color: '#64748B' },
  priceLabel: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceValue: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginTop: 2 },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pnlPositive: {},
  pnlNegative: {},
  pnlText: { fontSize: 13, fontWeight: '600' },
  updatedAt: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  stale: { color: '#D97706' },
});
