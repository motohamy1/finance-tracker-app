import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { formatCurrency } from '@/utils/format';

interface TickerSummaryCardProps {
  ticker: string;
}

export function TickerSummaryCard({ ticker }: TickerSummaryCardProps) {
  const getSummaryByTicker = useTradeStore((s) => s.getSummaryByTicker);
  const trades = useTradeStore((s) => s.trades);

  const summary = useMemo(() => getSummaryByTicker(ticker), [ticker, trades]);

  if (summary.pnlMultiplier === null && summary.buyCount === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#94A3B8" />
          <Text style={styles.emptyText}>No trade data for {ticker.toUpperCase()}</Text>
        </View>
      </View>
    );
  }

  const pnlMultiplier = summary.pnlMultiplier;
  const pnlPercent = summary.pnlPercent;
  const isGain = pnlMultiplier !== null && pnlMultiplier >= 1;
  const isLoss = pnlMultiplier !== null && pnlMultiplier < 1;
  const isNeutral = pnlMultiplier === 1 || pnlPercent === 0;

  const multiplierBadgeBg = isGain ? styles.multiplierGainBg : isLoss ? styles.multiplierLossBg : styles.multiplierNeutralBg;
  const multiplierBadgeTextColor = isGain ? styles.multiplierGainText : isLoss ? styles.multiplierLossText : styles.multiplierNeutralText;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.tickerText}>{ticker.toUpperCase()}</Text>
        {pnlPercent !== null ? (
          <View style={[styles.multiplierBadge, multiplierBadgeBg]}>
            <Text style={[styles.multiplierBadgeText, multiplierBadgeTextColor]}>
              {isNeutral ? '0%' : `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`}
            </Text>
          </View>
        ) : (
          <View style={[styles.multiplierBadge, styles.multiplierNeutralBg]}>
            <Text style={[styles.multiplierBadgeText, styles.multiplierNeutralText]}>—</Text>
          </View>
        )}
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Invested</Text>
          <Text style={styles.metricValue}>{formatCurrency(summary.totalInvestedCents)}</Text>
          <Text style={styles.metricSubLabel}>Cost Basis</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Net P&L</Text>
          <Text style={[styles.metricValue, summary.netPnlCents >= 0 ? styles.gain : styles.loss]}>
            {summary.netPnlCents >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.netPnlCents))}
          </Text>
          <Text style={styles.metricSubLabel}>After fees</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>P&L Multiplier</Text>
          <Text style={[styles.metricValue, isGain ? styles.gain : isLoss ? styles.loss : styles.metricValue]}>
            {pnlMultiplier !== null ? `${pnlMultiplier.toFixed(2)}x` : '—'}
          </Text>
          <Text style={styles.metricSubLabel}>{pnlPercent !== null ? `(${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)` : ''}</Text>
        </View>
      </View>

      <View style={styles.sectionDivider} />

      <View style={styles.comparisonRow}>
        <View style={styles.comparisonBlock}>
          <Text style={styles.comparisonLabel}>Buy Volume</Text>
          <Text style={styles.comparisonValue}>
            {summary.buyCount > 0 ? formatCurrency(summary.totalBuyVolumeCents) : '—'}
          </Text>
          <Text style={styles.comparisonSubText}>
            {summary.buyCount > 0 ? `${summary.buyCount} ${summary.buyCount === 1 ? 'buy' : 'buys'}` : 'No buy data'}
          </Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrowText}>→</Text>
        </View>
        <View style={styles.comparisonBlock}>
          <Text style={styles.comparisonLabel}>Sell Volume</Text>
          <Text style={styles.comparisonValue}>
            {summary.sellCount > 0 ? formatCurrency(summary.totalSellVolumeCents) : '—'}
          </Text>
          <Text style={styles.comparisonSubText}>
            {summary.sellCount > 0
              ? `${summary.sellCount} ${summary.sellCount === 1 ? 'sell' : 'sells'} · ${summary.pairCount} ${summary.pairCount === 1 ? 'pair' : 'pairs'}`
              : 'No sells yet'}
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{summary.buyCount} buys</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{summary.sellCount} sells</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{summary.pairCount} pairs</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
    color: '#0F172A',
  },
  multiplierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  multiplierGainBg: { backgroundColor: '#DCFCE7' },
  multiplierLossBg: { backgroundColor: '#FEE2E2' },
  multiplierNeutralBg: { backgroundColor: '#F1F5F9' },
  multiplierBadgeText: { fontSize: 15, fontWeight: '700' },
  multiplierGainText: { color: '#059669' },
  multiplierLossText: { color: '#DC2626' },
  multiplierNeutralText: { color: '#64748B' },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: { flex: 1 },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  metricSubLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  metricDivider: { width: 1, backgroundColor: '#F1F5F9' },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonValue: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  comparisonSubText: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  arrowContainer: { paddingHorizontal: 4 },
  arrowText: { fontSize: 20, color: '#CBD5E1', fontWeight: '700' },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontSize: 12, color: '#64748B' },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  emptyText: { fontSize: 15, color: '#94A3B8', fontWeight: '500' },
  gain: { color: '#059669' },
  loss: { color: '#DC2626' },
});
