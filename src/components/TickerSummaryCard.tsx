import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { useTheme } from '@/services/theme';
import { FONT_MONO } from '@/utils/typography';
import { formatCurrency } from '@/utils/format';

interface TickerSummaryCardProps {
  ticker: string;
}

export function TickerSummaryCard({ ticker }: TickerSummaryCardProps) {
  const { colors } = useTheme();
  const getSummaryByTicker = useTradeStore((s) => s.getSummaryByTicker);
  const trades = useTradeStore((s) => s.trades);

  const summary = useMemo(() => getSummaryByTicker(ticker), [ticker, trades]);

  if (summary.pnlMultiplier === null && summary.buyCount === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={24} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No trade data for {ticker.toUpperCase()}</Text>
        </View>
      </View>
    );
  }

  const pnlMultiplier = summary.pnlMultiplier;
  const pnlPercent = summary.pnlPercent;
  const isGain = pnlMultiplier !== null && pnlMultiplier >= 1;
  const isLoss = pnlMultiplier !== null && pnlMultiplier < 1;
  const isNeutral = pnlMultiplier === 1 || pnlPercent === 0;

  const multiplierBadgeBorder = isGain
    ? { borderColor: colors.success }
    : isLoss
    ? { borderColor: colors.danger }
    : { borderColor: colors.border };

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.tickerText, { color: colors.text }]}>{ticker.toUpperCase()}</Text>
        {pnlPercent !== null ? (
          <View style={[styles.multiplierBadge, { backgroundColor: colors.bgInput }, multiplierBadgeBorder]}>
            <Text style={[styles.multiplierBadgeText, { color: isGain ? colors.success : isLoss ? colors.danger : colors.textMuted }]}>
              {isNeutral ? '0%' : `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`}
            </Text>
          </View>
        ) : (
          <View style={[styles.multiplierBadge, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
            <Text style={[styles.multiplierBadgeText, { color: colors.textMuted }]}>—</Text>
          </View>
        )}
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOTAL INVESTED</Text>
          <Text style={[styles.metricValue, { color: colors.text, fontFamily: FONT_MONO }]}>{formatCurrency(summary.totalInvestedCents)}</Text>
          <Text style={[styles.metricSubLabel, { color: colors.textMuted }]}>COST BASIS</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>NET P&L</Text>
          <Text style={[styles.metricValue, { color: summary.netPnlCents >= 0 ? colors.success : colors.danger, fontFamily: FONT_MONO }]}>
            {summary.netPnlCents >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.netPnlCents))}
          </Text>
          <Text style={[styles.metricSubLabel, { color: colors.textMuted }]}>AFTER FEES</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>P&L MULTIPLIER</Text>
          <Text style={[styles.metricValue, { color: isGain ? colors.success : isLoss ? colors.danger : colors.text, fontFamily: FONT_MONO }]}>
            {pnlMultiplier !== null ? `${pnlMultiplier.toFixed(2)}x` : '—'}
          </Text>
          <Text style={[styles.metricSubLabel, { color: colors.textMuted }]}>{pnlPercent !== null ? `(${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)` : ''}</Text>
        </View>
      </View>

      <View style={[styles.sectionDivider, { borderTopColor: colors.divider }]} />

      <View style={styles.comparisonRow}>
        <View style={styles.comparisonBlock}>
          <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>BUY VOLUME</Text>
          <Text style={[styles.comparisonValue, { color: colors.text, fontFamily: FONT_MONO }]}>
            {summary.buyCount > 0 ? formatCurrency(summary.totalBuyVolumeCents) : '—'}
          </Text>
          <Text style={[styles.comparisonSubText, { color: colors.textMuted }]}>
            {summary.buyCount > 0 ? `${summary.buyCount} ${summary.buyCount === 1 ? 'buy' : 'buys'}` : 'No buy data'}
          </Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={[styles.arrowText, { color: colors.border }]}>→</Text>
        </View>
        <View style={styles.comparisonBlock}>
          <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>SELL VOLUME</Text>
          <Text style={[styles.comparisonValue, { color: colors.text, fontFamily: FONT_MONO }]}>
            {summary.sellCount > 0 ? formatCurrency(summary.totalSellVolumeCents) : '—'}
          </Text>
          <Text style={[styles.comparisonSubText, { color: colors.textMuted }]}>
            {summary.sellCount > 0
              ? `${summary.sellCount} ${summary.sellCount === 1 ? 'sell' : 'sells'} · ${summary.pairCount} ${summary.pairCount === 1 ? 'pair' : 'pairs'}`
              : 'No sells yet'}
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <View style={[styles.chip, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
          <Text style={[styles.chipText, { color: colors.textSecondary }]}>{summary.buyCount} BUYS</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
          <Text style={[styles.chipText, { color: colors.textSecondary }]}>{summary.sellCount} SELLS</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
          <Text style={[styles.chipText, { color: colors.textSecondary }]}>{summary.pairCount} PAIRS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 0,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tickerText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  multiplierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 0,
    borderWidth: 2,
  },
  multiplierBadgeText: { fontSize: 15, fontWeight: '700' },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: { flex: 1 },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  metricSubLabel: { fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricDivider: { width: 2 },
  sectionDivider: {
    borderTopWidth: 2,
    marginVertical: 14,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  comparisonBlock: { flex: 1 },
  comparisonLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  comparisonSubText: { fontSize: 13, marginTop: 2 },
  arrowContainer: { paddingHorizontal: 4 },
  arrowText: { fontSize: 20, fontWeight: '700' },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 2,
  },
  chipText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  emptyText: { fontSize: 15, fontWeight: '500' },
});
