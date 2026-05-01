import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { getTodayISO } from '@/utils/format';
import { validateTradeFields, canSaveTrade } from '@/utils/tradeValidation';
import type { TradeDirection, TradeFormData } from '@/types';

export default function ManualEntryScreen() {
  const router = useRouter();
  const addTrade = useTradeStore((s) => s.addTrade);

  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [tradeDate, setTradeDate] = useState(getTodayISO());
  const [direction, setDirection] = useState<TradeDirection>('buy');
  const [fees, setFees] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const fieldValues = {
      ticker,
      shares,
      pricePerShareCents: pricePerShare,
      tradeDate,
      direction,
      feesCents: fees,
      notes,
    };
    const validationErrors = validateTradeFields(fieldValues);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [ticker, shares, pricePerShare, tradeDate, direction, fees, notes]);

  const canSave = useMemo(() => {
    const fieldValues = {
      ticker,
      shares,
      pricePerShareCents: pricePerShare,
      tradeDate,
      direction,
    };
    return canSaveTrade(fieldValues, errors);
  }, [ticker, shares, pricePerShare, tradeDate, direction, errors]);

  const handleSave = useCallback(() => {
    if (!validate()) return;

    const formData: TradeFormData = {
      ticker: ticker.trim().toUpperCase(),
      shares,
      pricePerShareCents: pricePerShare,
      tradeDate,
      direction,
      feesCents: fees,
      notes,
    };
    addTrade(formData);
    router.back();
  }, [ticker, shares, pricePerShare, tradeDate, direction, fees, notes, validate, addTrade, router]);

  const handleClose = useCallback(() => router.back(), [router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Enter Trade',
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Ticker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ticker *</Text>
          <TextInput
            style={[styles.input, errors.ticker && styles.inputError]}
            value={ticker}
            onChangeText={setTicker}
            placeholder="e.g. AAPL"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            maxLength={5}
          />
          {errors.ticker && <Text style={styles.errorText}>{errors.ticker}</Text>}
        </View>

        {/* Shares */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Shares *</Text>
          <TextInput
            style={[styles.input, errors.shares && styles.inputError]}
            value={shares}
            onChangeText={(v) => setShares(v.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 10"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />
          {errors.shares && <Text style={styles.errorText}>{errors.shares}</Text>}
        </View>

        {/* Price per Share */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Price per Share ($) *</Text>
          <TextInput
            style={[styles.input, errors.pricePerShareCents && styles.inputError]}
            value={pricePerShare}
            onChangeText={(v) => setPricePerShare(v.replace(/[^0-9.]/g, ''))}
            placeholder="e.g. 185.50"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
          {errors.pricePerShareCents && <Text style={styles.errorText}>{errors.pricePerShareCents}</Text>}
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Trade Date *</Text>
          <TextInput
            style={[styles.input, errors.tradeDate && styles.inputError]}
            value={tradeDate}
            onChangeText={setTradeDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            maxLength={10}
          />
          {errors.tradeDate && <Text style={styles.errorText}>{errors.tradeDate}</Text>}
        </View>

        {/* Direction toggle */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Direction</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleOption, direction === 'buy' && styles.toggleBuyActive]}
              onPress={() => setDirection('buy')}
            >
              <Text style={[styles.toggleText, direction === 'buy' && styles.toggleTextActive]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, direction === 'sell' && styles.toggleSellActive]}
              onPress={() => setDirection('sell')}
            >
              <Text style={[styles.toggleText, direction === 'sell' && styles.toggleTextActive]}>Sell</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fees (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Fees ($) — Optional</Text>
          <TextInput
            style={styles.input}
            value={fees}
            onChangeText={(v) => setFees(v.replace(/[^0-9.]/g, ''))}
            placeholder="e.g. 0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Notes (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes — Optional</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor="#94A3B8"
            multiline
          />
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
            Save Trade
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  content: { padding: 16, paddingBottom: 40 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0',
  },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleOption: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  toggleBuyActive: { backgroundColor: '#059669', borderColor: '#059669' },
  toggleSellActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  toggleTextActive: { color: '#FFFFFF' },
  saveButton: {
    backgroundColor: '#0891B2', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveButtonDisabled: { backgroundColor: '#CBD5E1' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  saveButtonTextDisabled: { color: '#94A3B8' },
});
