import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trade } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

interface TradeCardProps {
  trade: Trade;
  onPress: () => void;
}

export function TradeCard({ trade, onPress }: TradeCardProps) {
  const isBuy = trade.direction === 'buy';
  const directionColor = isBuy ? '#059669' : '#DC2626';
  const directionLabel = isBuy ? 'Buy' : 'Sell';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: Thumbnail or placeholder */}
      <View style={styles.thumbnailContainer}>
        {trade.thumbnailUri ? (
          <Image
            source={{ uri: trade.thumbnailUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="document-text-outline" size={28} color="#94A3B8" />
          </View>
        )}
      </View>

      {/* Center: Trade details */}
      <View style={styles.details}>
        <Text style={styles.ticker}>{trade.ticker}</Text>
        <Text style={styles.meta}>
          {trade.shares} shares · {formatCurrency(trade.pricePerShareCents)}
        </Text>
        <Text style={styles.date}>{formatDate(trade.tradeDate)}</Text>
      </View>

      {/* Right: Direction badge + total value */}
      <View style={styles.rightCol}>
        <View style={[styles.directionBadge, { backgroundColor: directionColor }]}>
          <Text style={styles.directionText}>{directionLabel}</Text>
        </View>
        <Text style={styles.totalValue}>
          {formatCurrency(trade.shares * trade.pricePerShareCents)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  thumbnailContainer: {
    width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
    marginRight: 12,
  },
  thumbnail: { width: 56, height: 56 },
  thumbnailPlaceholder: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  details: { flex: 1, gap: 3 },
  ticker: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  meta: { fontSize: 13, color: '#475569' },
  date: { fontSize: 12, color: '#94A3B8' },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  directionBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  directionText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
});
