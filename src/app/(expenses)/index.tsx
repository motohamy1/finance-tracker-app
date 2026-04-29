import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useExpenseStore } from '@/stores/expenseStore';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

export default function ExpensesScreen() {
  const categories = useExpenseStore((s) => s.categories);
  const expensesByCategory = useExpenseStore((s) => s.expensesByCategory);
  const isLoading = useExpenseStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>Loading...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="wallet-outline" size={64} color="#94A3B8" />
        <Text style={styles.emptyTitle}>Start Tracking</Text>
        <Text style={styles.emptyBody}>
          Create your first spending category{'\n'}to begin logging expenses.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const expenses = expensesByCategory[item.id] || [];
        return (
          <View style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <View style={[styles.colorDot, { backgroundColor: item.colorHex }]} />
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryCount}>{expenses.length} items</Text>
            </View>
            {expenses.length > 0 && (
              <View style={styles.expensePreview}>
                {expenses.slice(0, 3).map((e, i) => (
                  <View key={i} style={styles.previewCard}>
                    <Text style={styles.previewTitle} numberOfLines={1}>{e.title}</Text>
                    <Text style={styles.previewAmount}>{formatCurrency(e.amountCents)}</Text>
                    <Text style={styles.previewDate}>{formatDate(e.date)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8', padding: 32 },
  emptyTitle: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginTop: 16 },
  emptyBody: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 21 },
  list: { padding: 16, backgroundColor: '#F0F4F8' },
  categoryItem: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, padding: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { fontSize: 18, fontWeight: '600', color: '#0F172A', flex: 1 },
  categoryCount: { fontSize: 12, color: '#94A3B8' },
  expensePreview: { flexDirection: 'row', gap: 8, marginTop: 12 },
  previewCard: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, width: 140 },
  previewTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  previewAmount: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  previewDate: { fontSize: 12, color: '#475569', marginTop: 2 },
  body: { fontSize: 14, color: '#475569' },
});
