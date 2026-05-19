import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '@/stores/expenseStore';
import { useTheme } from '@/services/theme';
import { EmptyState } from '@/components/EmptyState';
import { BottomSheet } from '@/components/BottomSheet';
import { MoneySourceCard, MONEY_SOURCE_CARD_WIDTH } from '@/components/MoneySourceCard';
import { MONEY_SOURCE_PALETTE, CURRENCIES } from '@/types';
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
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.addButton, { borderColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityLabel="Add Money Source"
      accessibilityHint="Opens form to create a new money source"
    >
      <Ionicons name="add" size={28} color={colors.primary} />
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
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(MONEY_SOURCE_PALETTE[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed, selectedColor, selectedCurrency);
      setName('');
      setSelectedColor(MONEY_SOURCE_PALETTE[0]);
      setSelectedCurrency(CURRENCIES[0]);
      onClose();
    }
  }, [name, selectedColor, selectedCurrency, onCreate, onClose]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="NEW MONEY SOURCE">
      <View style={styles.sheetContent}>
        {/* Name input */}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SOURCE NAME</Text>
        <View style={[styles.nameInputContainer, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
          <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.nameInput, { color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Source name"
            placeholderTextColor={colors.textMuted}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Color swatch grid */}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>COLOR</Text>
        <View style={styles.colorGrid}>
          {MONEY_SOURCE_PALETTE.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                selectedColor === color && [styles.colorSwatchSelected, { borderColor: colors.border }],
              ]}
              onPress={() => setSelectedColor(color)}
              accessibilityLabel="Select color for money source"
              accessibilityHint="Tap a color to apply it"
              activeOpacity={0.9}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={18} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Currency selection */}
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CURRENCY</Text>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((symbol) => (
            <TouchableOpacity
              key={symbol}
              style={[
                styles.currencyChip,
                { backgroundColor: colors.bgInput, borderColor: colors.border },
                selectedCurrency === symbol && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedCurrency(symbol)}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.currencyChipText,
                  { color: colors.textSecondary },
                  selectedCurrency === symbol && { color: colors.textInverse },
                ]}
              >
                {symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: colors.primary },
            !name.trim() && { backgroundColor: colors.textMuted },
          ]}
          onPress={handleCreate}
          disabled={!name.trim()}
          activeOpacity={0.9}
        >
          <Text style={[styles.createButtonText, { color: colors.textInverse }]}>CREATE</Text>
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
  // Container spans edge-to-edge
  const availableWidth = screenWidth;
  
  // Always center the card based on screen width
  const sidePad = Math.max(12, (availableWidth - MONEY_SOURCE_CARD_WIDTH) / 2);

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

  // Calculate explicit snap offsets to avoid Android padding bugs with snapToInterval
  const snapOffsets = moneySources.map((_, i) => i * (MONEY_SOURCE_CARD_WIDTH + CARD_GAP));
  // Add a final snap point for the "Add" button so it doesn't bounce back
  snapOffsets.push(moneySources.length * (MONEY_SOURCE_CARD_WIDTH + CARD_GAP));

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
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
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
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 2,
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
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
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
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 2,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  createButton: {
    borderRadius: 0,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderRadius: 0,
    borderWidth: 2,
  },
  currencyChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
