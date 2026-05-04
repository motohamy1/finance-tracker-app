import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '@/stores/expenseStore';
import { EmptyState } from '@/components/EmptyState';
import { BottomSheet } from '@/components/BottomSheet';
import { MoneySourceCard, MONEY_SOURCE_CARD_WIDTH } from '@/components/MoneySourceCard';
import { MONEY_SOURCE_PALETTE } from '@/types';
import type { MoneySource } from '@/types';

// ─── Constants ───
const CARD_GAP = 12; // sm+ token per UI-SPEC
const ADD_BUTTON_WIDTH = 72;
const CARD_HEIGHT = 180;

// ─── Props ───
export interface MoneySourceRowProps {
  onSelectSource?: (source: MoneySource) => void;
}

// ─── Add Source Button (ListFooterComponent) ───
function AddSourceButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel="Add Money Source"
      accessibilityHint="Opens form to create a new money source"
    >
      <Ionicons name="add" size={28} color="rgba(255,255,255,0.8)" />
    </TouchableOpacity>
  );
}

// ─── Creation Sheet ───
function CreationSheet({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, colorHex: string, currencySymbol: string) => void;
}) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(MONEY_SOURCE_PALETTE[0]);
  const currencies = ['$', 'EGP', '€', '£', '¥'];
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed, selectedColor, selectedCurrency);
      setName('');
      setSelectedColor(MONEY_SOURCE_PALETTE[0]);
      setSelectedCurrency(currencies[0]);
      onClose();
    }
  }, [name, selectedColor, selectedCurrency, onCreate, onClose, currencies]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="New Money Source">
      <View style={styles.sheetContent}>
        {/* Name input */}
        <Text style={styles.fieldLabel}>Source Name</Text>
        <View style={styles.nameInputContainer}>
          <Ionicons name="wallet-outline" size={20} color="#475569" />
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Source name"
            placeholderTextColor="#94A3B8"
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Color swatch grid */}
        <Text style={styles.fieldLabel}>Color</Text>
        <View style={styles.colorGrid}>
          {MONEY_SOURCE_PALETTE.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                selectedColor === color && styles.colorSwatchSelected,
              ]}
              onPress={() => setSelectedColor(color)}
              accessibilityLabel={`Select color for money source`}
              accessibilityHint="Tap a color to apply it"
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Currency selection */}
        <Text style={styles.fieldLabel}>Currency</Text>
        <View style={styles.currencyRow}>
          {currencies.map((symbol) => (
            <TouchableOpacity
              key={symbol}
              style={[
                styles.currencyChip,
                selectedCurrency === symbol && styles.currencyChipSelected,
              ]}
              onPress={() => setSelectedCurrency(symbol)}
            >
              <Text
                style={[
                  styles.currencyChipText,
                  selectedCurrency === symbol && styles.currencyChipTextSelected,
                ]}
              >
                {symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create button */}
        <TouchableOpacity
          style={[styles.createButton, !name.trim() && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!name.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ─── Main Component ───
export function MoneySourceRow({ onSelectSource }: MoneySourceRowProps) {
  const moneySources = useExpenseStore((s) => s.moneySources);
  const addMoneySource = useExpenseStore((s) => s.addMoneySource);
  const getMoneySourceExpenseCount = useExpenseStore((s) => s.getMoneySourceExpenseCount);

  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  // Total width of all cards + gaps + trailing add button
  const totalWidth = moneySources.length * (MONEY_SOURCE_CARD_WIDTH + CARD_GAP) + ADD_BUTTON_WIDTH - CARD_GAP;
  // Center when content fits, otherwise use base padding for scroll
  const sidePad = totalWidth < screenWidth ? (screenWidth - totalWidth) / 2 : 12;

  const handleCreateSource = useCallback(
    (name: string, colorHex: string, currencySymbol: string) => {
      addMoneySource({
        name,
        colorHex,
        currencySymbol,
        iconName: 'wallet-outline',
      });
    },
    [addMoneySource],
  );

  // ─── Empty state ───
  if (moneySources.length === 0) {
    return (
      <EmptyState
        icon="wallet-outline"
        title="No Money Sources"
        body="Add a money source to track your balances across Cash, Bank, Savings, and more."
        ctaText="Add Money Source"
        onCtaPress={() => setShowCreateSheet(true)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={moneySources}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MoneySourceCard
            source={item}
            expenseCount={getMoneySourceExpenseCount(item.id)}
            onTap={(source) => onSelectSource?.(source)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        snapToInterval={MONEY_SOURCE_CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: sidePad },
        ]}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={() => (
          <AddSourceButton onPress={() => setShowCreateSheet(true)} />
        )}
      />

      {/* Creation Sheet */}
      <CreationSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onCreate={handleCreateSource}
      />
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  listContent: {
    gap: CARD_GAP,
    alignItems: 'center',
  },
  // Add button
  addButton: {
    width: ADD_BUTTON_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: 'rgba(8,145,178,0.15)',
    borderWidth: 2,
    borderColor: '#0891B2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Creation sheet
  sheetContent: {
    gap: 16,
    paddingBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  placeholder: {
    color: '#94A3B8',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButton: {
    backgroundColor: '#0891B2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencyChipSelected: {
    backgroundColor: '#0891B2',
    borderColor: '#0891B2',
  },
  currencyChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  currencyChipTextSelected: {
    color: '#FFFFFF',
  },
});
