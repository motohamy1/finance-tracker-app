import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ExpenseForm } from '@/components/ExpenseForm';
import { EmptyState } from '@/components/EmptyState';
import { MoneySourceRow } from '@/components/MoneySourceRow';
import { TotalBalanceSummary } from '@/components/TotalBalanceSummary';
import { ActionSheetModal, type ActionSheetOption } from '@/components/ActionSheetModal';
import { useTheme } from '@/services/theme';
import { getCategoryLightTint } from '@/types';
import type { Category, Expense } from '@/types';

// ─── ExpenseRow (memo'd, extracted to avoid nested FlatList measurement issues) ───

const EXPENSE_CARD_WIDTH = 100;

const ExpenseRow = memo(function ExpenseRow({
  expenses,
  moneySourceById,
  onEdit,
  onLongPress,
}: {
  expenses: Expense[];
  moneySourceById: Record<string, { currencySymbol?: string }>;
  onEdit: (exp: Expense) => void;
  onLongPress: (exp: Expense) => void;
}) {
  return (
    <FlatList
      horizontal
      data={expenses}
      keyExtractor={(exp) => exp.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.expenseRow}
      getItemLayout={(_, index) => ({
        length: EXPENSE_CARD_WIDTH,
        offset: EXPENSE_CARD_WIDTH * index,
        index,
      })}
      renderItem={({ item: exp }) => (
        <TouchableOpacity
          style={styles.expenseItem}
          onPress={() => onEdit(exp)}
          onLongPress={() => onLongPress(exp)}
        >
          <Text style={styles.expenseTitle} numberOfLines={1}>{exp.title}</Text>
          <Text style={styles.expenseAmount}>
            {moneySourceById[exp.moneySourceId ?? '']?.currencySymbol ?? 'EGP'}{' '}
            {(exp.amountCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
});

// ─── CategoryInputBar (memo'd, outside render to prevent remount on keystrokes) ───

const CategoryInputBar = memo(function CategoryInputBar({
  value,
  onChangeText,
  onSubmit,
  onDismiss,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.categoryInputBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border }]}>
      <TextInput
        style={styles.categoryInputField}
        placeholder="Category name"
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        autoFocus
        returnKeyType="done"
      />
      <TouchableOpacity style={styles.createBtn} onPress={onSubmit}>
        <Text style={styles.createBtnText}>Create</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Ionicons name="close" size={20} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );
});

// ─── Main Component ───

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const categories = useExpenseStore((s) => s.categories);
  const expensesByCategory = useExpenseStore((s) => s.expensesByCategory);
  const isLoading = useExpenseStore((s) => s.isLoading);
  const moneySources = useExpenseStore((s) => s.moneySources);
  const addCategory = useExpenseStore((s) => s.addCategory);
  const renameCategory = useExpenseStore((s) => s.renameCategory);
  const removeCategory = useExpenseStore((s) => s.removeCategory);
  const getExpenseCount = useExpenseStore((s) => s.getExpenseCount);
  const setOverlayInputVisible = useSettingsStore((s) => s.setOverlayInputVisible);

  const moneySourceById = useMemo(() => {
    const map: Record<string, typeof moneySources[0]> = {};
    for (const source of moneySources) {
      map[source.id] = source;
    }
    return map;
  }, [moneySources]);

  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedMoneySourceId, setSelectedMoneySourceId] = useState<string | null>(null);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetTitle, setActionSheetTitle] = useState('');
  const [actionSheetOptions, setActionSheetOptions] = useState<ActionSheetOption[]>([]);

  // Hide tab bar when category input overlay is active
  useEffect(() => {
    setOverlayInputVisible(showCategoryInput);
    return () => {
      if (showCategoryInput) setOverlayInputVisible(false);
    };
  }, [showCategoryInput, setOverlayInputVisible]);

  const showActionSheet = useCallback((title: string, options: ActionSheetOption[]) => {
    setActionSheetTitle(title);
    setActionSheetOptions(options);
    setActionSheetVisible(true);
  }, []);

  const insets = useSafeAreaInsets();

  const handleCreateCategory = useCallback(() => {
    const name = categoryNameInput.trim();
    if (!name) return;
    addCategory({ name });
    setCategoryNameInput('');
    setShowCategoryInput(false);
    Keyboard.dismiss();
  }, [categoryNameInput, addCategory]);

  const dismissCategoryInput = useCallback(() => {
    setShowCategoryInput(false);
    setCategoryNameInput('');
    Keyboard.dismiss();
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
    const options: ActionSheetOption[] = [
      {
        label: 'Rename',
        icon: 'pencil-outline',
        onPress: () => {
          setActionSheetVisible(false);
          if (Platform.OS === 'ios') {
            const { Alert } = require('react-native');
            Alert.prompt?.('Rename Category', undefined, (newName: string) => {
              if (newName?.trim()) renameCategory(category.id, newName.trim());
            }, 'plain-text', category.name);
          } else {
            setCategoryNameInput(category.name);
            renameCategory(category.id, category.name + ' (tap to rename)');
          }
        },
      },
      {
        label: `Delete${expenseCount > 0 ? ` (${expenseCount} expense${expenseCount !== 1 ? 's' : ''})` : ''}`,
        icon: 'trash-outline',
        destructive: true,
        onPress: () => {
          if (expenseCount > 0) {
            setActionSheetVisible(false);
            const { Alert } = require('react-native');
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
        },
      },
    ];
    showActionSheet(category.name, options);
  }, [getExpenseCount, renameCategory, removeCategory, showActionSheet]);

  const handleExpenseLongPress = useCallback((expense: Expense) => {
    const options: ActionSheetOption[] = [
      {
        label: 'Edit',
        icon: 'pencil-outline',
        onPress: () => openEditForm(expense),
      },
      {
        label: 'Delete',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => {
          const { Alert } = require('react-native');
          Alert.alert('Delete Expense?', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: () => useExpenseStore.getState().removeExpense(expense.id), style: 'destructive' },
          ]);
        },
      },
    ];
    showActionSheet(expense.title, options);
  }, [openEditForm, showActionSheet]);

  const ListHeader = () => (
    <View style={styles.moneySection}>
      <View style={{ paddingHorizontal: 12 }}>
        <TotalBalanceSummary />
      </View>
      <MoneySourceRow onSelectSource={(source) => setSelectedMoneySourceId(source.id)} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <EmptyState icon="hourglass-outline" title="Loading..." body="Preparing your expense tracker." />
      </SafeAreaView>
    );
  }

  // ─── Empty state (no categories yet) ───
  if (categories.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12 }}>
            <ListHeader />
            <EmptyState
              icon="wallet-outline"
              title="START TRACKING"
              body="Create your first spending category to begin logging expenses."
              ctaText={showCategoryInput ? undefined : 'CREATE CATEGORY'}
              onCtaPress={() => setShowCategoryInput(true)}
            />
          </View>
          {showCategoryInput && (
            <CategoryInputBar
              value={categoryNameInput}
              onChangeText={setCategoryNameInput}
              onSubmit={handleCreateCategory}
              onDismiss={dismissCategoryInput}
              colors={colors}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Main content (categories exist) ───
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {!showCategoryInput && (
          <TouchableOpacity
            style={[styles.fab, {
              bottom: Math.max(insets.bottom, 16) + 60 + 20,
              zIndex: 100,
              elevation: 100,
              backgroundColor: colors.primary,
            }]}
            onPress={() => openAddForm()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <FlatList
          style={{ flex: 1 }}
          ListHeaderComponent={<ListHeader />}
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => {
            const expenses = expensesByCategory[item.id] || [];
            return (
              <TouchableOpacity
                style={[styles.categoryBlock, { backgroundColor: item.colorHex, borderColor: '#FFFFFF' }]}
                onPress={() => openAddForm(item.id)}
                onLongPress={() => handleCategoryLongPress(item)}
                activeOpacity={0.9}
              >
                <View style={styles.blockHeader}>
                  <Text style={styles.blockName}>{item.name.toUpperCase()}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#0A0A0F" />
                </View>

                {expenses.length === 0 ? (
                  <View style={styles.emptyBlockContent}>
                    <Text style={styles.emptyBlockText}>NO EXPENSES</Text>
                  </View>
                ) : (
                  <ExpenseRow
                    expenses={expenses}
                    moneySourceById={moneySourceById}
                    onEdit={openEditForm}
                    onLongPress={handleExpenseLongPress}
                  />
                )}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            !showCategoryInput ? (
              <TouchableOpacity
                style={[styles.addCategoryButton, { backgroundColor: colors.bgCard, borderColor: colors.border, marginTop: 16 }]}
                onPress={() => setShowCategoryInput(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addCategoryText, { color: colors.primary }]}>Create Category</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
        />

        <ExpenseForm
          visible={formVisible}
          onClose={() => {
            setFormVisible(false);
            setEditingExpense(null);
            setSelectedMoneySourceId(null);
          }}
          editingExpense={editingExpense}
          preselectedCategoryId={selectedCategoryId}
          preselectedMoneySourceId={selectedMoneySourceId}
        />

        <ActionSheetModal
          visible={actionSheetVisible}
          onClose={() => setActionSheetVisible(false)}
          title={actionSheetTitle}
          options={actionSheetOptions}
        />

        {/* CategoryInputBar — KeyboardAvoidingView pushes it above keyboard */}
        {showCategoryInput && (
          <CategoryInputBar
            value={categoryNameInput}
            onChangeText={setCategoryNameInput}
            onSubmit={handleCreateCategory}
            onDismiss={dismissCategoryInput}
            colors={colors}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 100 },
  categoryBlock: {
    width: '48%',
    borderRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    position: 'relative',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  blockName: {
    color: '#0A0A0F',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  emptyBlockContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    opacity: 0.7,
  },
  emptyBlockText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  expenseRow: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
    gap: 8,
  },
  expenseItem: {
    backgroundColor: '#1A1A24',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 0,
    width: EXPENSE_CARD_WIDTH,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  expenseTitle: {
    color: '#F0F0F5',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  expenseAmount: {
    color: '#F0F0F5',
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
    width: 56,
    height: 56,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 0,
    marginBottom: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderWidth: 2,
  },
  addCategoryText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 3,
    borderTopColor: '#FFFFFF',
    backgroundColor: '#14141A',
  },
  categoryInputField: {
    flex: 1,
    fontSize: 16,
    color: '#F0F0F5',
    backgroundColor: '#0A0A0F',
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  createBtn: {
    backgroundColor: '#00E5FF',
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  createBtnText: {
    color: '#0A0A0F',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dismissBtn: { padding: 4 },
  moneySection: {
    paddingBottom: 12,
    marginBottom: 8,
    marginTop: 8,
    borderRadius: 0,
    marginHorizontal: -12,
  },
});
