import { View, Text, StyleSheet } from 'react-native';
import type { Expense } from '@/types';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { FONT_MONO } from '@/utils/typography';

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
    <View style={styles.card}>
      {/* Accent top strip — thin, functional, not decorative */}
      <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: '#F0F0F5' }]} numberOfLines={1}>
          {expense.title.toUpperCase()}
        </Text>
        <Text style={styles.amount}>
          {formatCurrency(expense.amountCents, moneySource?.currencySymbol)}
        </Text>
        <Text style={styles.date}>{formatDate(expense.date)}</Text>
        {moneySource && (
          <View style={styles.sourceRow}>
            <View style={[styles.sourceDot, { backgroundColor: moneySource.colorHex }]} />
            <Text style={styles.sourceName} numberOfLines={1}>
              {moneySource.name.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    minHeight: 112,
    backgroundColor: '#1A1A24',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    // No shadows: brutalist surfaces are flat
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 10,
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F0F0F5',
    marginBottom: 4,
    fontFamily: FONT_MONO,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B6B78',
    letterSpacing: 0.3,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 0, // square dot for brutalism
  },
  sourceName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B78',
    flexShrink: 1,
    letterSpacing: 0.3,
  },
});
