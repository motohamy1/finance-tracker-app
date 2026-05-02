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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.summary}>
        <Ionicons
          name={isPositive ? 'trending-up' : 'trending-down'}
          size={16}
          color={isPositive ? '#059669' : '#DC2626'}
        />
        <Text style={styles.summaryText}>
          Bought {pair.matchedShares} @ {formatCurrency(pair.buyPriceCents)} → Sold @ {formatCurrency(pair.sellPriceCents)}
        </Text>
        <Text style={[styles.pnl, isPositive ? styles.gain : styles.loss]}>
          {isPositive ? '+' : ''}{formatCurrency(Math.abs(pair.realizedPnlCents))}
        </Text>
      </View>

      {expanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Buy</Text>
            <Text style={styles.detailValue}>{formatDate(pair.buyDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sell</Text>
            <Text style={styles.detailValue}>{formatDate(pair.sellDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Buy Price</Text>
            <Text style={styles.detailValue}>{formatCurrency(pair.buyPriceCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sell Price</Text>
            <Text style={styles.detailValue}>{formatCurrency(pair.sellPriceCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Buy Fees</Text>
            <Text style={styles.detailValue}>{formatCurrency(pair.buyFeesCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sell Fees</Text>
            <Text style={styles.detailValue}>{formatCurrency(pair.sellFeesCents)}</Text>
          </View>
          <View style={[styles.detailRow, styles.pnlRow]}>
            <Text style={styles.detailLabel}>P&L</Text>
            <Text style={[styles.detailValue, isPositive ? styles.gain : styles.loss, styles.pnlBold]}>
              {isPositive ? '+' : ''}{formatCurrency(Math.abs(pair.realizedPnlCents))}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    marginHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  pnl: { fontSize: 15, fontWeight: '700' },
  gain: { color: '#059669' },
  loss: { color: '#DC2626' },
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
  pnlRow: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 2,
  },
  pnlBold: { fontSize: 15, fontWeight: '700' },
  expandHint: {
    alignItems: 'center',
    marginTop: 4,
  },
});
