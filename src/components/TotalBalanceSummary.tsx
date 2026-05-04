import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency } from '@/utils/format';

/**
 * Compact row displaying the sum of all money source balances.
 * Reactively updates when any money source balance changes (via Zustand).
 * 
 * UI-SPEC: Label "Total Balance" (uppercase, 14px/600, #475569),
 * amount (24px/600, #0F172A), horizontal row layout.
 */
export function TotalBalanceSummary() {
  const moneySources = useExpenseStore((s) => s.moneySources);

  const totalCents = moneySources.reduce(
    (sum, source) => sum + source.balanceCents,
    0,
  );
  const formattedTotal = formatCurrency(totalCents);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.amount}>{formattedTotal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0F172A',
  },
});
