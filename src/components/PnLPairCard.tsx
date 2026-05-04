import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PnLPair } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

interface PnLPairCardProps {
  pair: PnLPair;
}

export function PnLPairCard({ pair }: PnLPairCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = pair.realizedPnlCents >= 0;
  const pnlPercent = pair.buyPriceCents > 0
    ? ((pair.sellPriceCents - pair.buyPriceCents) / pair.buyPriceCents) * 100
    : 0;

  const bgTint = isPositive
    ? 'rgba(34, 197, 94, 0.06)'
    : 'rgba(239, 68, 68, 0.06)';
  const borderTint = isPositive
    ? 'rgba(34, 197, 94, 0.15)'
    : 'rgba(239, 68, 68, 0.15)';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgTint, borderColor: borderTint }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      {/* Header: Ticker + P&L percentage badge */}
      <View style={styles.header}>
        <View style={styles.tickerSection}>
          <Text style={styles.ticker}>{pair.ticker}</Text>
          <Text style={styles.shares}>{pair.matchedShares} shares</Text>
        </View>
        <View style={[styles.pnlBadge, isPositive ? styles.pnlBadgeGain : styles.pnlBadgeLoss]}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={isPositive ? '#059669' : '#DC2626'}
          />
          <Text style={[styles.pnlBadgeText, { color: isPositive ? '#059669' : '#DC2626' }]}>
            {isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Buy → Sell visual comparison */}
      <View style={styles.comparisonRow}>
        <View style={styles.side}>
          <View style={styles.dirBadge}>
            <Ionicons name="arrow-up-circle-outline" size={14} color="#059669" />
            <Text style={styles.dirBadgeText}>Buy</Text>
          </View>
          <Text style={styles.price}>{formatCurrency(pair.buyPriceCents)}</Text>
          <Text style={styles.date}>{formatDate(pair.buyDate)}</Text>
        </View>

        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={16} color="#CBD5E1" />
        </View>

        <View style={styles.side}>
          <View style={[styles.dirBadge, styles.dirBadgeSell]}>
            <Ionicons name="arrow-down-circle-outline" size={14} color="#DC2626" />
            <Text style={[styles.dirBadgeText, styles.dirBadgeTextSell]}>Sell</Text>
          </View>
          <Text style={styles.price}>{formatCurrency(pair.sellPriceCents)}</Text>
          <Text style={styles.date}>{formatDate(pair.sellDate)}</Text>
        </View>
      </View>

      {/* Result row */}
      <View style={[styles.resultRow, isPositive ? styles.resultGain : styles.resultLoss]}>
        <View style={styles.resultLeft}>
          <Ionicons
            name={isPositive ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={isPositive ? '#059669' : '#DC2626'}
          />
          <Text style={styles.resultLabel}>Realized P&L</Text>
        </View>
        <Text style={[styles.resultValue, { color: isPositive ? '#059669' : '#DC2626' }]}>
          {isPositive ? '+' : ''}{formatCurrency(Math.abs(pair.realizedPnlCents))}
        </Text>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Buy Fees</Text>
            <Text style={styles.detailValue}>{formatCurrency(pair.buyFeesCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sell Fees</Text>
            <Text style={styles.detailValue}>{formatCurrency(pair.sellFeesCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Held for</Text>
            <Text style={styles.detailValue}>
              {Math.max(1, Math.ceil((new Date(pair.sellDate).getTime() - new Date(pair.buyDate).getTime()) / (1000 * 60 * 60 * 24)))} days
            </Text>
          </View>
        </View>
      )}

      <View style={styles.expandHint}>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#94A3B8"
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tickerSection: {},
  ticker: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  shares: { fontSize: 12, color: '#64748B', marginTop: 1 },
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
  price: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  date: { fontSize: 11, color: '#94A3B8' },
  arrow: {
    paddingHorizontal: 4,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultGain: { borderTopColor: 'rgba(34, 197, 94, 0.15)' },
  resultLoss: { borderTopColor: 'rgba(239, 68, 68, 0.15)' },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultValue: { fontSize: 16, fontWeight: '700' },

  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: { fontSize: 13, color: '#64748B' },
  detailValue: { fontSize: 13, color: '#0F172A', fontWeight: '500' },
  expandHint: {
    alignItems: 'center',
    marginTop: 6,
  },
  gain: { color: '#059669' },
  loss: { color: '#DC2626' },
});
