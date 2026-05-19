import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/services/theme';
import { FONT_MONO } from '@/utils/typography';
import { useExpenseStore } from '@/stores/expenseStore';

export function BalanceCard() {
  const { colors } = useTheme();
  const expensesByCategory = useExpenseStore((s) => s.expensesByCategory);

  const totalCents = Object.values(expensesByCategory).reduce((acc, catExpenses) => {
    return acc + catExpenses.reduce((sum, exp) => sum + exp.amountCents, 0);
  }, 0);

  const totalAmount = (totalCents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.cardContent}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>TOTAL BALANCE</Text>
          <Text style={[styles.amount, { color: colors.text, fontFamily: FONT_MONO }]}>{totalAmount}</Text>
          <View style={styles.footer}>
            <Text style={[styles.cardNumber, { color: colors.textMuted, fontFamily: FONT_MONO }]}>**** **** **** 1234</Text>
            <View style={[styles.chip, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  card: {
    height: 180,
    borderWidth: 3,
    borderRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 16,
    letterSpacing: 2,
  },
  chip: {
    width: 40,
    height: 30,
    borderRadius: 0,
  },
});
