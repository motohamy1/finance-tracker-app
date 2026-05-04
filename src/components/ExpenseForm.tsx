import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Modal, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Expense, ExpenseFormData } from '@/types';
import { useExpenseStore } from '@/stores/expenseStore';
import { useTheme } from '@/services/theme';
import { getTodayISO } from '@/utils/format';

interface ExpenseFormProps {
  visible: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
  preselectedCategoryId?: string;
  preselectedMoneySourceId?: string | null;
}

export function ExpenseForm({ visible, onClose, editingExpense, preselectedCategoryId, preselectedMoneySourceId }: ExpenseFormProps) {
  const { colors } = useTheme();
  const categories = useExpenseStore((s) => s.categories);
  const moneySources = useExpenseStore((s) => s.moneySources);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const editExpense = useExpenseStore((s) => s.editExpense);
  const addCategory = useExpenseStore((s) => s.addCategory);

  const isEditing = !!editingExpense;

  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [categoryId, setCategoryId] = useState('');
  const [moneySourceId, setMoneySourceId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showMoneySourcePicker, setShowMoneySourcePicker] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  React.useEffect(() => {
    if (visible) {
      setTitle(editingExpense?.title ?? '');
      setAmountText(editingExpense ? (editingExpense.amountCents / 100).toFixed(2) : '');
      setDate(editingExpense?.date ?? getTodayISO());
      setCategoryId(editingExpense?.categoryId ?? preselectedCategoryId ?? categories[0]?.id ?? '');
      setMoneySourceId(editingExpense?.moneySourceId ?? preselectedMoneySourceId ?? null);
      setNotes(editingExpense?.notes ?? '');
    }
  }, [visible, editingExpense, preselectedCategoryId, preselectedMoneySourceId, categories]);

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a title.');
      return;
    }
    const parsedAmount = parseFloat(amountText);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Missing Category', 'Please select a category.');
      return;
    }

    const amountCents = Math.round(parsedAmount * 100);
    const formData: ExpenseFormData = {
      title: title.trim(),
      amountCents,
      date,
      categoryId,
      moneySourceId: moneySourceId || null,
      notes: notes.trim() || '',
    };

    if (isEditing && editingExpense) {
      editExpense(editingExpense.id, formData);
    } else {
      addExpense(formData);
    }
    onClose();
  }, [title, amountText, date, categoryId, moneySourceId, notes, isEditing, editingExpense, editExpense, addExpense, onClose]);

  const handleCreateCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name) return;
    const newCat = addCategory({ name });
    setCategoryId(newCat.id);
    setNewCategoryName('');
    setShowNewCategoryInput(false);
    setShowCategoryPicker(false);
  }, [newCategoryName, addCategory]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedMoneySource = moneySources.find((s) => s.id === moneySourceId) ?? null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.bgCard }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.heading, { color: colors.text }]}>
              {isEditing ? 'Edit Expense' : 'New Expense'}
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.bgInput, borderColor: colors.border }]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <View style={[styles.colorDot, { backgroundColor: selectedCategory?.colorHex ?? colors.primary }]} />
              <Text style={[styles.selectText, { color: selectedCategory ? colors.text : colors.textMuted }]}>{selectedCategory?.name ?? 'Select category'}</Text>
              <Ionicons name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={[styles.dropdown, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.dropdownItem, cat.id === categoryId && { backgroundColor: colors.divider, borderRadius: 8 }]}
                    onPress={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}
                  >
                    <View style={[styles.colorDot, { backgroundColor: cat.colorHex }]} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowNewCategoryInput(true)}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                  <Text style={[styles.dropdownItemText, { color: colors.primary }]}>New Category</Text>
                </TouchableOpacity>
                {showNewCategoryInput && (
                  <View style={styles.newCategoryRow}>
                    <TextInput
                      style={[styles.newCategoryInput, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.text }]}
                      placeholder="Category name"
                      placeholderTextColor={colors.textMuted}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      onSubmitEditing={handleCreateCategory}
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleCreateCategory}>
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>Create</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Money Source Picker — inserted between Category and Title */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Money Source (optional)</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.bgInput, borderColor: colors.border }]}
              onPress={() => setShowMoneySourcePicker(!showMoneySourcePicker)}
            >
              {moneySourceId && selectedMoneySource ? (
                <>
                  <View style={[styles.colorDot, { backgroundColor: selectedMoneySource.colorHex }]} />
                  <Text style={[styles.selectText, { color: colors.text }]}>{selectedMoneySource.name}</Text>
                </>
              ) : (
                <>
                  <View style={[styles.colorDot, { backgroundColor: colors.textMuted }]} />
                  <Text style={[styles.selectText, { color: colors.textMuted }]}>None</Text>
                </>
              )}
              <Ionicons name={showMoneySourcePicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {showMoneySourcePicker && (
              <View style={styles.dropdown}>
                {/* "None" option at top */}
                <TouchableOpacity
                  style={[styles.dropdownItem, moneySourceId === null && styles.dropdownItemActive]}
                  onPress={() => { setMoneySourceId(null); setShowMoneySourcePicker(false); }}
                >
                  <View style={[styles.colorDot, { backgroundColor: '#94A3B8' }]} />
                  <Text style={styles.dropdownItemText}>None</Text>
                </TouchableOpacity>
                {/* All money sources */}
                {moneySources.map((source) => (
                  <TouchableOpacity
                    key={source.id}
                    style={[styles.dropdownItem, source.id === moneySourceId && styles.dropdownItemActive]}
                    onPress={() => { setMoneySourceId(source.id); setShowMoneySourcePicker(false); }}
                  >
                    <View style={[styles.colorDot, { backgroundColor: source.colorHex }]} />
                    <Text style={styles.dropdownItemText}>{source.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What did you spend on?"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                value={amountText}
                onChangeText={setAmountText}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={date}
              onChangeText={setDate}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add a note (optional)"
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Save Changes' : 'Save Expense'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    minHeight: '50%',
  },
  handle: { width: 36, height: 5, backgroundColor: '#CBD5E1', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  heading: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '500', color: '#475569', marginBottom: -8 },
  input: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14,
    fontSize: 16, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0',
  },
  notesInput: { minHeight: 80 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 20, fontWeight: '600', color: '#0F172A', marginRight: 8 },
  amountInput: { flex: 1 },
  selectButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  selectText: { flex: 1, fontSize: 16, color: '#0F172A' },
  dropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    marginTop: 4, padding: 4,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 12,
  },
  dropdownItemActive: { backgroundColor: '#F0F4F8', borderRadius: 8 },
  dropdownItemText: { fontSize: 16, color: '#0F172A' },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  newCategoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  newCategoryInput: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8,
    padding: 10, fontSize: 14, borderWidth: 1, borderColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#0891B2', margin: 16, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
