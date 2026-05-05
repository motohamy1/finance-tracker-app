import React, { useState, useCallback, useMemo } from 'react';
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
import { ExpenseForm } from '@/components/ExpenseForm';
import { EmptyState } from '@/components/EmptyState';
import { MoneySourceRow } from '@/components/MoneySourceRow';
import { MONEY_SOURCE_CARD_WIDTH } from '@/components/MoneySourceCard';
import { TotalBalanceSummary } from '@/components/TotalBalanceSummary';
import { ActionSheetModal, type ActionSheetOption } from '@/components/ActionSheetModal';
import { useTheme } from '@/services/theme';
import { getCategoryLightTint } from '@/types';
import type { Category, Expense } from '@/types';

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
            // Fallback for Android: use a simple prompt alternative
            setCategoryNameInput(category.name);
            // For simplicity, use inline rename by setting up a modal
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

  // List header combining TotalBalanceSummary + MoneySourceRow (replaces BalanceCard)
  const ListHeader = () => (
    <View style={[styles.moneySection, { backgroundColor: colors.bgSecondary }]}>
      <TotalBalanceSummary />
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

  // Category input bar — full width, sits directly above keyboard (zero gap)
  const CategoryInputBar = () => (
    <View style={[styles.categoryInputBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border }]}>
      <TextInput
        style={styles.categoryInputField}
        placeholder="Category name"
        placeholderTextColor="#94A3B8"
        value={categoryNameInput}
        onChangeText={setCategoryNameInput}
        onSubmitEditing={handleCreateCategory}
        autoFocus
        returnKeyType="done"
      />
      <TouchableOpacity style={styles.createBtn} onPress={handleCreateCategory}>
        <Text style={styles.createBtnText}>Create</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dismissBtn} onPress={dismissCategoryInput}>
        <Ionicons name="close" size={20} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );

  if (categories.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>
          <TotalBalanceSummary />
          <MoneySourceRow onSelectSource={(source) => setSelectedMoneySourceId(source.id)} />
          <EmptyState
            icon="wallet-outline"
            title="Start Tracking"
            body="Create your first spending category to begin logging expenses."
            ctaText={showCategoryInput ? undefined : "Create Category"}
            onCtaPress={() => setShowCategoryInput(true)}
          />
        </View>
        {showCategoryInput && <CategoryInputBar />}
      </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {!showCategoryInput && (
        <TouchableOpacity
          style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 60 + 20, zIndex: 100, elevation: 100, backgroundColor: colors.primary }]}
          onPress={() => openAddForm()}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <View style={{ flex: 1 }}>
        <FlatList
          ListHeaderComponent={<ListHeader />}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            showCategoryInput ? null : (
              <TouchableOpacity
                style={[styles.addCategoryButton, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                onPress={() => setShowCategoryInput(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addCategoryText, { color: colors.primary }]}>Create Category</Text>
                </View>
              </TouchableOpacity>
            )
          }
          renderItem={({ item }) => {
            const expenses = expensesByCategory[item.id] || [];
            return (
              <TouchableOpacity
                style={[styles.categoryBlock, { backgroundColor: item.colorHex, width: MONEY_SOURCE_CARD_WIDTH, alignSelf: 'center' }]}
                onPress={() => openAddForm(item.id)}
                onLongPress={() => handleCategoryLongPress(item)}
                activeOpacity={0.9}
              >
                {/* Velvet fabric effects */}
                <View style={styles.velvetOverlay} />
                <View style={styles.velvetSheen} />
                <View style={styles.velvetHighlight} />
                <View style={styles.velvetShadow} />
                <View style={styles.velvetTexture} />
                
                <View style={styles.blockHeader}>
                  <Text style={styles.blockName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
                </View>

                {expenses.length === 0 ? (
                  <View style={styles.emptyBlockContent}>
                    <Text style={styles.emptyBlockText}>No expenses yet</Text>
                  </View>
                ) : (
                  <FlatList
                    horizontal
                    data={expenses}
                    keyExtractor={(exp) => exp.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.expenseRow}
                    renderItem={({ item: exp }) => (
                      <TouchableOpacity 
                        style={styles.expenseItem}
                        onPress={() => openEditForm(exp)}
                        onLongPress={() => handleExpenseLongPress(exp)}
                      >
                        <Text style={styles.expenseTitle} numberOfLines={1}>{exp.title}</Text>
                        <Text style={styles.expenseAmount}>{moneySourceById[exp.moneySourceId ?? '']?.currencySymbol ?? 'EGP'} {(exp.amountCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {showCategoryInput && <CategoryInputBar />}

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
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12, paddingBottom: 100 },
  categoryBlock: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
    backgroundColor: '#334155', // Fallback
  },
  velvetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  velvetSheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  velvetHighlight: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 300,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 150,
    transform: [{ rotate: '-30deg' }],
  },
  velvetShadow: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 100,
  },
  velvetTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    zIndex: 2,
  },
  blockName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  emptyBlockContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    opacity: 0.6,
  },
  emptyBlockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  expenseRow: {
    paddingLeft: 20,
    paddingRight: 12,
    paddingBottom: 20,
    zIndex: 2,
    gap: 10,
  },
  expenseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 120,
    maxWidth: 160,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  expenseTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  expenseAmount: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute', bottom: 20, right: 20, zIndex: 10,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  addCategoryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 24,
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1,
  },
  addCategoryText: { fontSize: 16, fontWeight: '600' },
  // Category input bar — full width section, sits flush against keyboard
  categoryInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  categoryInputField: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#0891B2',
  },
  createBtn: {
    backgroundColor: '#0891B2',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  dismissBtn: { padding: 4 },
  moneySection: {
    paddingBottom: 12,
    marginBottom: 8,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
