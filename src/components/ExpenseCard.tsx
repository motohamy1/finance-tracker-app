import { View, Text, StyleSheet } from 'react-native';
import type { Expense } from '@/types';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency, formatDate } from '@/utils/format';

interface ExpenseCardProps {
  expense: Expense;
  accentColor: string;
}

export function ExpenseCard({ expense, accentColor }: ExpenseCardProps) {
  const moneySources = useExpenseStore((s) => s.moneySources);
  const moneySource = expense.moneySourceId
    ? moneySources.find((s) => s.id === expense.moneySourceId)
    : null;

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
      <Text style={styles.amount}>{formatCurrency(expense.amountCents, moneySource?.currencySymbol)}</Text>
      <Text style={styles.date}>{formatDate(expense.date)}</Text>
      {moneySource && (
        <View style={styles.sourceRow}>
          <View style={[styles.sourceDot, { backgroundColor: moneySource.colorHex }]} />
          <Text style={styles.sourceName} numberOfLines={1}>{moneySource.name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    minHeight: 108,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  amount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  date: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceName: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
    flexShrink: 1,
  },
});
