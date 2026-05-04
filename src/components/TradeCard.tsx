import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trade } from '@/types';
import { useTheme } from '@/services/theme';
import { formatCurrency, formatDate } from '@/utils/format';

interface TradeCardProps {
  trade: Trade;
  pnlCents?: number | null;
  pnlMultiplier?: number | null;
  onPress: () => void;
}

export function TradeCard({ trade, pnlCents, pnlMultiplier, onPress }: TradeCardProps) {
  const { colors } = useTheme();
  const isBuy = trade.direction === 'buy';
  const directionColor = isBuy ? colors.success : colors.danger;
  const directionLabel = isBuy ? 'Buy' : 'Sell';
  const hasPnl = pnlCents !== null && pnlCents !== undefined;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        {trade.thumbnailUri ? (
          <Image
            source={{ uri: trade.thumbnailUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.bgInput }]}>
            <Ionicons name="document-text-outline" size={28} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={[styles.ticker, { color: colors.text }]}>{trade.ticker}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {trade.shares} shares · {formatCurrency(trade.pricePerShareCents)}
        </Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(trade.tradeDate)}</Text>
      </View>

      <View style={styles.rightCol}>
        <View style={[styles.directionBadge, { backgroundColor: directionColor }]}>
          <Text style={styles.directionText}>{directionLabel}</Text>
        </View>
        <Text style={[styles.totalValue, { color: colors.text }]}>
          {formatCurrency(trade.shares * trade.pricePerShareCents)}
        </Text>
        {hasPnl && (
          <View style={[styles.pnlBadge, pnlCents >= 0 ? styles.pnlGain : styles.pnlLoss]}>
            <Ionicons
              name={pnlCents >= 0 ? 'trending-up' : 'trending-down'}
              size={11}
              color={pnlCents >= 0 ? colors.success : colors.danger}
            />
            <Text style={[styles.pnlText, { color: pnlCents >= 0 ? colors.success : colors.danger }]}>
              {pnlCents >= 0 ? '+' : ''}{formatCurrency(Math.abs(pnlCents))}
            </Text>
          </View>
        )}
        {pnlMultiplier !== null && pnlMultiplier !== undefined && (
          <View style={[styles.multiplierBadge, pnlMultiplier >= 1 ? styles.multiplierGain : styles.multiplierLoss]}>
            <Text style={[styles.multiplierText, pnlMultiplier >= 1 ? styles.multiplierGainText : styles.multiplierLossText]}>
              {pnlMultiplier >= 1 ? '+' : ''}{((pnlMultiplier - 1) * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
    justifyContent: 'center', alignItems: 'center',
  },
  details: { flex: 1, gap: 3 },
  ticker: { fontSize: 18, fontWeight: '700' },
  meta: { fontSize: 13 },
  date: { fontSize: 12 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  directionBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  directionText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  totalValue: { fontSize: 16, fontWeight: '700' },
  pnlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pnlGain: { backgroundColor: 'rgba(5, 150, 105, 0.1)' },
  pnlLoss: { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
  pnlText: { fontSize: 11, fontWeight: '700' },
  multiplierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  multiplierGain: { backgroundColor: '#DCFCE7' },
  multiplierLoss: { backgroundColor: '#FEE2E2' },
  multiplierText: { fontSize: 12, fontWeight: '700' },
  multiplierGainText: { color: '#059669' },
  multiplierLossText: { color: '#DC2626' },
});
