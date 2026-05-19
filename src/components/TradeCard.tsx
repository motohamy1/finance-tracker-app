import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trade } from '@/types';
import { useTheme } from '@/services/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { FONT_MONO } from '@/utils/typography';

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
  const directionLabel = isBuy ? 'BUY' : 'SELL';
  const hasPnl = pnlCents !== null && pnlCents !== undefined;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.thumbnailContainer}>
        {trade.thumbnailUri ? (
          <Image
            source={{ uri: trade.thumbnailUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
            <Ionicons name="document-text-outline" size={28} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={[styles.ticker, { color: colors.text }]}>{trade.ticker}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {trade.shares} SHARES · {formatCurrency(trade.pricePerShareCents)}
        </Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(trade.tradeDate)}</Text>
      </View>

      <View style={styles.rightCol}>
        <View style={[styles.directionBadge, { backgroundColor: directionColor, borderColor: '#FFFFFF', borderWidth: 2 }]}>
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
            <Text style={[styles.multiplierText, { color: pnlMultiplier >= 1 ? colors.success : colors.danger }]}>
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
    borderRadius: 0,
    borderWidth: 2,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  thumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 0,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  thumbnail: { width: 56, height: 56 },
  thumbnailPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  details: { flex: 1, gap: 3 },
  ticker: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  meta: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  directionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
  },
  directionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0F',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_MONO,
  },
  pnlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
    borderWidth: 1,
  },
  pnlGain: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  pnlLoss: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  pnlText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONT_MONO,
  },
  multiplierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
    borderWidth: 1,
  },
  multiplierGain: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  multiplierLoss: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_MONO,
  },
});
