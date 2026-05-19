import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActionSheetIOS,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '@/stores/expenseStore';
import { ActionSheetModal, type ActionSheetOption } from '@/components/ActionSheetModal';
import { formatCurrency } from '@/utils/format';
import { MONEY_SOURCE_PALETTE, CURRENCIES } from '@/types';
import { FONT_MONO } from '@/utils/typography';
import type { MoneySource } from '@/types';

// ─── Neo-Brutalist Constants ───
export const MONEY_SOURCE_CARD_WIDTH = Math.min(
  Dimensions.get('window').width - 24,
  360,
);

const CARD_HEIGHT = 180;
const CARD_RADIUS = 0;        // sharp corners
const INTERNAL_PADDING = 20;
const BORDER_WIDTH = 3;       // thick white border
const ANIMATION_DURATION = 120;

// ─── Props ───
export interface MoneySourceCardProps {
  source: MoneySource;
  expenseCount: number;
  isSelected?: boolean;
  onTap?: (source: MoneySource) => void;
}

// ─── Component ───
export function MoneySourceCard({
  source,
  expenseCount,
  isSelected = false,
  onTap,
}: MoneySourceCardProps) {
  // Store actions
  const updateMoneySourceBalance = useExpenseStore((s) => s.updateMoneySourceBalance);
  const renameMoneySource = useExpenseStore((s) => s.renameMoneySource);
  const updateMoneySourceColor = useExpenseStore((s) => s.updateMoneySourceColor);
  const updateMoneySourceCurrency = useExpenseStore((s) => s.updateMoneySourceCurrency);
  const removeMoneySource = useExpenseStore((s) => s.removeMoneySource);

  // ─── Balance editing state ───
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const balanceOpacity = useRef(new Animated.Value(1)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;

  // ─── Name editing state ───
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  // ─── Action sheet state ───
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // ─── Balance edit handlers ───
  const validateAndSave = useCallback(
    (value: string) => {
      const trimmed = value.trim();

      if (trimmed === '') {
        updateMoneySourceBalance(source.id, 0);
        exitEditMode();
        return;
      }

      const parsed = parseFloat(trimmed);
      if (isNaN(parsed)) {
        setIsInvalid(true);
        setTimeout(() => {
          setEditValue((source.balanceCents / 100).toFixed(2));
          setIsInvalid(false);
        }, 500);
        return;
      }

      const cents = Math.round(parsed * 100);
      updateMoneySourceBalance(source.id, cents);
      exitEditMode();
    },
    [source.id, source.balanceCents, updateMoneySourceBalance],
  );

  const enterEditMode = useCallback(() => {
    setEditValue((source.balanceCents / 100).toFixed(2));
    setIsEditingBalance(true);
    Animated.parallel([
      Animated.timing(balanceOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    ]).start();
  }, [source.balanceCents, balanceOpacity, inputOpacity]);

  const exitEditMode = useCallback(() => {
    setEditValue((source.balanceCents / 100).toFixed(2));
    setIsEditingBalance(false);
    Animated.parallel([
      Animated.timing(balanceOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(inputOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    ]).start();
  }, [source.balanceCents, balanceOpacity, inputOpacity]);

  // ─── Long-press menu ───
  const handleLongPress = useCallback(() => {
    setActionSheetVisible(true);
  }, []);

  // ─── Edit Name flow ───
  const handleEditName = useCallback(() => {
    setEditNameValue(source.name);
    setIsEditingName(true);
  }, [source.name]);

  const submitNameEdit = useCallback(() => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== source.name) {
      renameMoneySource(source.id, trimmed);
    }
    setIsEditingName(false);
  }, [editNameValue, source.name, source.id, renameMoneySource]);

  // ─── Edit Currency flow ───
  const handleEditCurrency = useCallback(() => {
    const currencies = [...CURRENCIES];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...currencies, 'Cancel'],
          cancelButtonIndex: currencies.length,
          title: 'Select Currency',
        },
        (index) => {
          if (index < currencies.length) {
            updateMoneySourceCurrency(source.id, currencies[index]);
          }
        },
      );
    } else {
      Alert.alert(
        'Select Currency',
        undefined,
        [
          ...currencies.map((symbol) => ({
            text: symbol,
            onPress: () => updateMoneySourceCurrency(source.id, symbol),
          })),
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true },
      );
    }
  }, [source.id, updateMoneySourceCurrency]);

  // ─── Change Color flow ───
  const handleChangeColor = useCallback(() => {
    const currentIndex = MONEY_SOURCE_PALETTE.indexOf(source.colorHex);
    const nextIndex = (currentIndex + 1) % MONEY_SOURCE_PALETTE.length;
    updateMoneySourceColor(source.id, MONEY_SOURCE_PALETTE[nextIndex]);
  }, [source.colorHex, source.id, updateMoneySourceColor]);

  // ─── Delete flow ───
  const handleDeleteConfirm = useCallback(() => {
    Alert.alert(
      `DELETE ${source.name.toUpperCase()}?`,
      'Linked expenses will be unlinked. Cannot be undone.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE',
          onPress: () => removeMoneySource(source.id),
          style: 'destructive',
        },
      ],
    );
  }, [source.name, source.id, removeMoneySource]);

  const actionSheetOptions = useMemo<ActionSheetOption[]>(() => [
    { label: 'Edit Name', icon: 'pencil-outline', onPress: handleEditName },
    { label: 'Change Currency', icon: 'cash-outline', onPress: handleEditCurrency },
    { label: 'Change Color', icon: 'color-palette-outline', onPress: handleChangeColor },
    { label: 'Delete', icon: 'trash-outline', destructive: true, onPress: handleDeleteConfirm },
  ], [handleEditName, handleEditCurrency, handleChangeColor, handleDeleteConfirm]);

  const expenseCountLabel =
    expenseCount === 1
      ? '1 EXPENSE'
      : `${expenseCount} EXPENSES`;

  const invalidBorderStyle = isInvalid
    ? { borderColor: '#FF0000', borderWidth: 4 }
    : {};

  const selectedBorderStyle = isSelected
    ? { borderColor: '#FFFFFF', borderWidth: 4 }
    : {};

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: source.colorHex },
        invalidBorderStyle,
        selectedBorderStyle,
      ]}
      onPress={() => onTap?.(source)}
      onLongPress={handleLongPress}
      activeOpacity={0.95}
    >
      {/* ─── Top: Icon + Name ─── */}
      <View style={styles.header}>
        <Ionicons
          name={source.iconName as any}
          size={24}
          color="#0A0A0F"
        />
        {isEditingName ? (
          <TextInput
            style={styles.nameInput}
            value={editNameValue}
            onChangeText={setEditNameValue}
            onSubmitEditing={submitNameEdit}
            onBlur={submitNameEdit}
            autoFocus
            selectTextOnFocus
            placeholderTextColor="rgba(10,10,15,0.5)"
          />
        ) : (
          <Text style={styles.sourceName} numberOfLines={1}>
            {source.name.toUpperCase()}
          </Text>
        )}
      </View>

      {/* ─── Center: Balance ─── */}
      <View style={styles.balanceContainer}>
        {isEditingBalance ? (
          <TextInput
            style={styles.balanceInput}
            value={editValue}
            onChangeText={setEditValue}
            onBlur={() => validateAndSave(editValue)}
            onSubmitEditing={() => validateAndSave(editValue)}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            placeholderTextColor="rgba(10,10,15,0.5)"
          />
        ) : (
          <Animated.View style={{ opacity: balanceOpacity }}>
            <Text style={styles.balanceText}>
              {formatCurrency(source.balanceCents, source.currencySymbol)}
            </Text>
          </Animated.View>
        )}

        {!isEditingBalance && (
          <TouchableOpacity
            style={styles.balanceTapArea}
            onPress={enterEditMode}
            activeOpacity={1}
          >
            <View />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Bottom: Expense Count ─── */}
      <View style={styles.footer}>
        <Text style={styles.expenseCount}>{expenseCountLabel}</Text>
      </View>

      <ActionSheetModal
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title={source.name}
        options={actionSheetOptions}
      />
    </TouchableOpacity>
  );
}

// ─── Neo-Brutalist Styles ───
const styles = StyleSheet.create({
  card: {
    width: MONEY_SOURCE_CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    padding: INTERNAL_PADDING,
    justifyContent: 'space-between',
    borderWidth: BORDER_WIDTH,
    borderColor: '#FFFFFF',
    // No soft shadows: brutalist surfaces sit flat
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0A0F',
    flexShrink: 1,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nameInput: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0A0F',
    flexShrink: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0F',
    paddingVertical: 2,
    minWidth: 80,
    letterSpacing: 0.5,
  },
  balanceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  balanceText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0A0A0F',
    textAlign: 'center',
    fontFamily: FONT_MONO,
  },
  balanceInput: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0A0A0F',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0F',
    paddingVertical: 4,
    minWidth: 150,
    fontFamily: FONT_MONO,
  },
  balanceTapArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  footer: {
    alignItems: 'center',
  },
  expenseCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0F',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
});
