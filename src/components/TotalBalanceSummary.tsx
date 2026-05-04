import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useExpenseStore } from '@/stores/expenseStore';
import { useTheme } from '@/services/theme';
import { formatCurrency } from '@/utils/format';

export function TotalBalanceSummary() {
  const { colors } = useTheme();
  const moneySources = useExpenseStore((s) => s.moneySources);

  const totalCents = moneySources.reduce(
    (sum, source) => sum + source.balanceCents,
    0,
  );
  const formattedTotal = formatCurrency(totalCents);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Total Balance</Text>
      <Text style={[styles.amount, { color: colors.text }]}>{formattedTotal}</Text>
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
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amount: {
    fontSize: 24,
    fontWeight: '600',
  },
});
