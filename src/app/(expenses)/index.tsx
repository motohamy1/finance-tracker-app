import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert,
  ActionSheetIOS, Platform, TouchableOpacity,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '@/stores/expenseStore';
import { CategoryHeader } from '@/components/CategoryHeader';
import { ExpenseForm } from '@/components/ExpenseForm';
import { EmptyState } from '@/components/EmptyState';
import type { Category, Expense } from '@/types';

export default function ExpensesScreen() {
  const categories = useExpenseStore((s) => s.categories);
  const expensesByCategory = useExpenseStore((s) => s.expensesByCategory);
  const isLoading = useExpenseStore((s) => s.isLoading);
  const addCategory = useExpenseStore((s) => s.addCategory);
  const renameCategory = useExpenseStore((s) => s.renameCategory);
  const removeCategory = useExpenseStore((s) => s.removeCategory);
  const reorderCategories = useExpenseStore((s) => s.reorderCategories);
  const getExpenseCount = useExpenseStore((s) => s.getExpenseCount);

  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const openAddForm = useCallback((categoryId?: string) => {
    setEditingExpense(null);
    setSelectedCategoryId(categoryId);
    setFormVisible(true);
  }, []);

  const openEditForm = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setSelectedCategoryId(undefined);
    setFormVisible(true);
  }, []);

  const handleCategoryLongPress = useCallback((category: Category) => {
    const expenseCount = getExpenseCount(category.id);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Rename', 'Delete', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 0) {
            Alert.prompt
              ? Alert.prompt('Rename Category', undefined, (newName) => {
                  if (newName?.trim()) renameCategory(category.id, newName.trim());
                }, 'plain-text', category.name)
              : null;
          }
          if (index === 1) {
            if (expenseCount > 0) {
              Alert.alert(
                `Delete ${category.name}?`,
                `This will also delete ${expenseCount} expense${expenseCount !== 1 ? 's' : ''}. This action cannot be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', onPress: () => removeCategory(category.id), style: 'destructive' },
                ]
              );
            } else {
              removeCategory(category.id);
            }
          }
        }
      );
    } else {
      Alert.alert(
        category.name,
        undefined,
        [
          { text: 'Rename', onPress: () => {
            Alert.prompt
              ? Alert.prompt('Rename Category', undefined, (newName) => {
                  if (newName?.trim()) renameCategory(category.id, newName.trim());
                }, 'plain-text', category.name)
              : null;
          }},
          { text: 'Delete', onPress: () => {
            if (expenseCount > 0) {
              Alert.alert(
                `Delete ${category.name}?`,
                `This will also delete ${expenseCount} expense${expenseCount !== 1 ? 's' : ''}. This action cannot be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', onPress: () => removeCategory(category.id), style: 'destructive' },
                ]
              );
            } else {
              removeCategory(category.id);
            }
          }, style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, [getExpenseCount, renameCategory, removeCategory]);

  const handleExpenseLongPress = useCallback((expense: Expense) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Edit', 'Delete', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (index) => {
          if (index === 0) openEditForm(expense);
          if (index === 1) {
            Alert.alert(
              'Delete Expense?',
              'This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', onPress: () => useExpenseStore.getState().removeExpense(expense.id), style: 'destructive' },
              ]
            );
          }
        }
      );
    } else {
      Alert.alert(expense.title, undefined, [
        { text: 'Edit', onPress: () => openEditForm(expense) },
        { text: 'Delete', onPress: () => {
          Alert.alert(
            'Delete Expense?',
            'This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', onPress: () => useExpenseStore.getState().removeExpense(expense.id), style: 'destructive' },
            ]
          );
        }, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [openEditForm]);

  const handleDragEnd = useCallback(({ data }: { data: Category[] }) => {
    reorderCategories(data.map((c) => c.id));
  }, [reorderCategories]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <EmptyState icon="hourglass-outline" title="Loading..." body="Preparing your expense tracker." />
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="wallet-outline"
          title="Start Tracking"
          body="Create your first spending category to begin logging expenses."
          ctaText="Create Category"
          onCtaPress={() => addCategory({ name: 'Food & Dining' })}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openAddForm()}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <DraggableFlatList
        data={categories}
        keyExtractor={(item) => item.id}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.list}
        renderItem={({ item, drag, isActive }) => (
          <ScaleDecorator>
            <CategoryHeader
              category={item}
              expenses={expensesByCategory[item.id] || []}
              isExpanded={expandedIds.has(item.id)}
              onToggle={toggleCategory}
              onLongPress={() => handleCategoryLongPress(item)}
              onAddExpense={(catId) => openAddForm(catId)}
            />
          </ScaleDecorator>
        )}
      />

      <TouchableOpacity
        style={styles.addCategoryButton}
        onPress={() => addCategory({ name: 'New Category' })}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={22} color="#0891B2" />
        <View style={{ flex: 1 }}>
          <Text style={styles.addCategoryText}>Create Category</Text>
        </View>
      </TouchableOpacity>

      <ExpenseForm
        visible={formVisible}
        onClose={() => { setFormVisible(false); setEditingExpense(null); }}
        editingExpense={editingExpense}
        preselectedCategoryId={selectedCategoryId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  list: { padding: 16, paddingBottom: 80 },
  fab: {
    position: 'absolute', bottom: 20, right: 20, zIndex: 10,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0891B2',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  addCategoryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  addCategoryText: { fontSize: 16, fontWeight: '600', color: '#0891B2' },
});
