import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useExpenseStore } from '@/stores/expenseStore';

export function BalanceCard() {
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
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.label}>Total Balance</Text>
          <Text style={styles.amount}>{totalAmount}</Text>
          <View style={styles.footer}>
            <Text style={styles.cardNumber}>**** **** **** 1234</Text>
            <View style={styles.chip} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 60,
    paddingBottom: 16,
  },
  card: {
    height: 180,
    backgroundColor: '#0891B2',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  label: {
    color: '#E0F2FE',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    color: '#E0F2FE',
    fontSize: 16,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    opacity: 0.8,
  },
});
