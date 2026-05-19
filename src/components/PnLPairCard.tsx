import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PnLPair } from '@/types';
import { useTheme } from '@/services/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { FONT_MONO } from '@/utils/typography';

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

  const handleEditPress = () => {
    if (!onEditTrade) return;
    Alert.alert(
      'EDIT TRADE',
      'Which side do you want to edit?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'EDIT BUY',
          onPress: () => onEditTrade(pair.buyTradeId),
        },
        {
          text: 'EDIT SELL',
          onPress: () => onEditTrade(pair.sellTradeId),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.9}
    >
      {/* Header: Ticker + P&L percentage badge + Edit */}
      <View style={styles.header}>
        <View style={styles.tickerSection}>
          <Text style={[styles.ticker, { color: colors.text }]}>{pair.ticker}</Text>
          <Text style={[styles.shares, { color: colors.textSecondary }]}>{pair.matchedShares} SHARES</Text>
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
          <View style={[styles.pnlBadge, { borderColor: isPositive ? colors.success : colors.danger }]}>
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
          <View style={[styles.dirBadge, { borderColor: colors.success }]}>
            <Ionicons name="arrow-up-circle-outline" size={14} color={colors.success} />
            <Text style={[styles.dirBadgeText, { color: colors.success }]}>BUY</Text>
          </View>
          <Text style={[styles.price, { color: colors.text }]}>{formatCurrency(pair.buyPriceCents)}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(pair.buyDate)}</Text>
        </View>

        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
        </View>

        <View style={styles.side}>
          <View style={[styles.dirBadge, { borderColor: colors.danger }]}>
            <Ionicons name="arrow-down-circle-outline" size={14} color={colors.danger} />
            <Text style={[styles.dirBadgeText, { color: colors.danger }]}>SELL</Text>
          </View>
          <Text style={[styles.price, { color: colors.text }]}>{formatCurrency(pair.sellPriceCents)}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(pair.sellDate)}</Text>
        </View>
      </View>

      {/* Result row */}
      <View style={[styles.resultRow, { borderTopColor: colors.border }]}>
        <View style={styles.resultLeft}>
          <Ionicons
            name={isPositive ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={isPositive ? colors.success : colors.danger}
          />
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>REALIZED P&L</Text>
        </View>
        <Text style={[styles.resultValue, { color: isPositive ? colors.success : colors.danger }]}>
          {isPositive ? '+' : ''}{formatCurrency(Math.abs(pair.realizedPnlCents))}
        </Text>
      </View>

      {expanded && (
        <View style={[styles.details, { borderTopColor: colors.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>BUY FEES</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(pair.buyFeesCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>SELL FEES</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(pair.sellFeesCents)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>HELD FOR</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {Math.max(1, Math.ceil((new Date(pair.sellDate).getTime() - new Date(pair.buyDate).getTime()) / (1000 * 60 * 60 * 24)))} DAYS
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tickerSection: {},
  ticker: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shares: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
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
    borderRadius: 0,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  pnlBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_MONO,
  },

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
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
    borderWidth: 2,
  },
  dirBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONT_MONO,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  arrow: {
    paddingHorizontal: 4,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 2,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_MONO,
  },

  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_MONO,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 6,
  },
});
