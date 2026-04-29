import { View, Text, StyleSheet } from 'react-native';
import type { Expense } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

interface ExpenseCardProps {
  expense: Expense;
  accentColor: string;
}

export function ExpenseCard({ expense, accentColor }: ExpenseCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
      <Text style={styles.amount}>{formatCurrency(expense.amountCents)}</Text>
      <Text style={styles.date}>{formatDate(expense.date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    fontWeight: '400',
    color: '#475569',
  },
});
