import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { getTodayISO } from '@/utils/format';
import {
  parseOCRToInitialValues,
  validateTradeFields,
  isMissingFromOCR,
  formatTradeFieldDisplay,
  canSaveTrade,
} from '@/utils/tradeValidation';
import type { TradeDirection, TradeFormData, OCRResult } from '@/types';

type FieldKey = 'ticker' | 'shares' | 'pricePerShareCents' | 'tradeDate' | 'direction' | 'feesCents' | 'notes';

interface FieldState {
  value: string;
  isEditing: boolean;
  error: string | null;
}

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    ocrResult?: string;
    imageUri?: string;
    tradeId?: string;
  }>();

  const addTrade = useTradeStore((s) => s.addTrade);
  const editTrade = useTradeStore((s) => s.editTrade);
  const existingTrade = useTradeStore((s) =>
    params.tradeId ? s.trades.find((t) => t.id === params.tradeId) : undefined
  );

  // Parse OCR result from params (try/catch handles malformed data per T-02-09)
  const ocrResult: OCRResult | null = useMemo(() => {
    if (!params.ocrResult) return null;
    try { return JSON.parse(params.ocrResult); } catch { return null; }
  }, [params.ocrResult]);

  // Initial values: OCR result or existing trade or empty defaults
  const initialValues = useMemo(() => {
    if (existingTrade) {
      return {
        ticker: existingTrade.ticker,
        shares: String(existingTrade.shares),
        pricePerShareCents: String(existingTrade.pricePerShareCents),
        tradeDate: existingTrade.tradeDate,
        direction: existingTrade.direction,
        feesCents: existingTrade.feesCents ? String(existingTrade.feesCents) : '',
        notes: existingTrade.notes || '',
      };
    }
    return parseOCRToInitialValues(ocrResult);
  }, [ocrResult, existingTrade]);

  const [fields, setFields] = useState<Record<FieldKey, FieldState>>({
    ticker: { value: initialValues.ticker, isEditing: false, error: null },
    shares: { value: initialValues.shares, isEditing: false, error: null },
    pricePerShareCents: { value: initialValues.pricePerShareCents, isEditing: false, error: null },
    tradeDate: { value: initialValues.tradeDate, isEditing: false, error: null },
    direction: { value: initialValues.direction, isEditing: false, error: null },
    feesCents: { value: initialValues.feesCents, isEditing: false, error: null },
    notes: { value: initialValues.notes, isEditing: false, error: null },
  });

  // Extract current field values for validation utilities
  const fieldValues = useMemo(() => ({
    ticker: fields.ticker.value,
    shares: fields.shares.value,
    pricePerShareCents: fields.pricePerShareCents.value,
    tradeDate: fields.tradeDate.value,
    direction: fields.direction.value,
    feesCents: fields.feesCents.value,
    notes: fields.notes.value,
  }), [fields]);

  // Update a single field value
  const updateField = useCallback((key: FieldKey, value: string) => {
    setFields((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
  }, []);

  // Toggle edit mode for a field
  const toggleEdit = useCallback((key: FieldKey) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], isEditing: !prev[key].isEditing, error: null },
    }));
  }, []);

  // Validate all fields and update error state
  const validate = useCallback((): boolean => {
    const errors = validateTradeFields(fieldValues);
    if (Object.keys(errors).length === 0) {
      // Clear all errors
      setFields((prev) => {
        const cleared = { ...prev };
        for (const key of Object.keys(cleared)) {
          cleared[key as FieldKey] = { ...cleared[key as FieldKey], error: null };
        }
        return cleared;
      });
      return true;
    }
    // Set errors on each field
    setFields((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated) as FieldKey[]) {
        updated[key] = { ...updated[key], error: errors[key] || null };
      }
      return updated;
    });
    return false;
  }, [fieldValues]);

  // Check if save is enabled (all required fields present, no errors)
  const canSave = useMemo(() => {
    const currentErrors = validateTradeFields(fieldValues);
    return canSaveTrade(fieldValues, currentErrors);
  }, [fieldValues]);

  // Save trade
  const handleSave = useCallback(() => {
    if (!validate()) return;

    const formData: TradeFormData = {
      ticker: fields.ticker.value.trim().toUpperCase(),
      shares: fields.shares.value.trim(),
      pricePerShareCents: fields.pricePerShareCents.value.trim(),
      tradeDate: fields.tradeDate.value.trim(),
      direction: fields.direction.value as TradeDirection,
      feesCents: fields.feesCents.value.trim(),
      notes: fields.notes.value.trim(),
    };

    if (existingTrade) {
      editTrade(existingTrade.id, formData);
    } else {
      addTrade(formData);
    }

    router.back();
  }, [fields, validate, existingTrade, editTrade, addTrade, router]);

  // Discard with confirmation per D-23
  const handleDiscard = useCallback(() => {
    Alert.alert(
      'Discard Trade',
      'Discard this trade?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }, [router]);

  // Format display value for a field
  const displayValue = useCallback((key: FieldKey, raw: string): string => {
    if (!raw) return '\u2014';
    return formatTradeFieldDisplay(key, raw);
  }, []);

  // Check if a field was missing from OCR
  const checkMissingFromOCR = useCallback((key: FieldKey): boolean => {
    return isMissingFromOCR(ocrResult, key);
  }, [ocrResult]);

  const fieldError = useCallback((key: FieldKey): string | null => {
    return fields[key].error;
  }, [fields]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={handleDiscard} style={styles.headerButton}>
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Screenshot preview if available */}
        {params.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: params.imageUri }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        {/* Card preview layout per D-20 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {existingTrade ? 'Edit Trade' : 'Review Trade'}
          </Text>

          {/* Ticker */}
          <FieldRow
            label="Ticker"
            value={displayValue('ticker', fields.ticker.value)}
            isEditing={fields.ticker.isEditing}
            error={fieldError('ticker')}
            isWarning={!fieldError('ticker') && checkMissingFromOCR('ticker')}
            onPress={() => toggleEdit('ticker')}
          >
            {fields.ticker.isEditing && (
              <TextInput
                style={styles.input}
                value={fields.ticker.value}
                onChangeText={(v) => updateField('ticker', v.toUpperCase())}
                placeholder="e.g. AAPL"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                autoFocus
                maxLength={5}
                onBlur={() => toggleEdit('ticker')}
              />
            )}
          </FieldRow>

          {/* Shares */}
          <FieldRow
            label="Shares"
            value={fields.shares.value ? `${fields.shares.value}` : '\u2014'}
            isEditing={fields.shares.isEditing}
            error={fieldError('shares')}
            isWarning={!fieldError('shares') && checkMissingFromOCR('shares')}
            onPress={() => toggleEdit('shares')}
          >
            {fields.shares.isEditing && (
              <TextInput
                style={styles.input}
                value={fields.shares.value}
                onChangeText={(v) => updateField('shares', v.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 10"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                autoFocus
                onBlur={() => toggleEdit('shares')}
              />
            )}
          </FieldRow>

          {/* Price per Share */}
          <FieldRow
            label="Price/Share"
            value={fields.pricePerShareCents.value ? displayValue('pricePerShareCents', fields.pricePerShareCents.value) : '\u2014'}
            isEditing={fields.pricePerShareCents.isEditing}
            error={fieldError('pricePerShareCents')}
            isWarning={!fieldError('pricePerShareCents') && checkMissingFromOCR('pricePerShareCents')}
            onPress={() => toggleEdit('pricePerShareCents')}
          >
            {fields.pricePerShareCents.isEditing && (
              <TextInput
                style={styles.input}
                value={fields.pricePerShareCents.value}
                onChangeText={(v) => updateField('pricePerShareCents', v.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 185.50"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                autoFocus
                onBlur={() => toggleEdit('pricePerShareCents')}
              />
            )}
          </FieldRow>

          {/* Trade Date */}
          <FieldRow
            label="Date"
            value={fields.tradeDate.value || '\u2014'}
            isEditing={fields.tradeDate.isEditing}
            error={fieldError('tradeDate')}
            isWarning={!fieldError('tradeDate') && checkMissingFromOCR('tradeDate')}
            onPress={() => toggleEdit('tradeDate')}
          >
            {fields.tradeDate.isEditing && (
              <TextInput
                style={styles.input}
                value={fields.tradeDate.value}
                onChangeText={(v) => updateField('tradeDate', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                autoFocus
                maxLength={10}
                onBlur={() => toggleEdit('tradeDate')}
              />
            )}
          </FieldRow>

          {/* Direction toggle per D-16: user can override */}
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Direction</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  fields.direction.value === 'buy' && styles.toggleBuyActive,
                ]}
                onPress={() => updateField('direction', 'buy')}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={fields.direction.value === 'buy' ? '#FFFFFF' : '#059669'}
                />
                <Text
                  style={[
                    styles.toggleText,
                    fields.direction.value === 'buy' && styles.toggleTextActive,
                  ]}
                >
                  Buy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  fields.direction.value === 'sell' && styles.toggleSellActive,
                ]}
                onPress={() => updateField('direction', 'sell')}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={fields.direction.value === 'sell' ? '#FFFFFF' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.toggleText,
                    fields.direction.value === 'sell' && styles.toggleTextActive,
                  ]}
                >
                  Sell
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fees (optional per D-22) */}
          <FieldRow
            label="Fees"
            value={fields.feesCents.value ? formatTradeFieldDisplay('pricePerShareCents', fields.feesCents.value) : 'None'}
            isEditing={fields.feesCents.isEditing}
            error={fieldError('feesCents')}
            isWarning={false}
            onPress={() => toggleEdit('feesCents')}
          >
            {fields.feesCents.isEditing && (
              <TextInput
                style={styles.input}
                value={fields.feesCents.value}
                onChangeText={(v) => updateField('feesCents', v.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                autoFocus
                onBlur={() => toggleEdit('feesCents')}
              />
            )}
          </FieldRow>

          {/* Notes (optional) */}
          <FieldRow
            label="Notes"
            value={fields.notes.value || 'None'}
            isEditing={fields.notes.isEditing}
            error={null}
            isWarning={false}
            onPress={() => toggleEdit('notes')}
          >
            {fields.notes.isEditing && (
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={fields.notes.value}
                onChangeText={(v) => updateField('notes', v)}
                placeholder="Optional notes..."
                placeholderTextColor="#94A3B8"
                autoFocus
                multiline
                onBlur={() => toggleEdit('notes')}
              />
            )}
          </FieldRow>

          {/* OCR confidence indicator */}
          {ocrResult && (
            <View style={styles.confidenceRow}>
              <Ionicons
                name={ocrResult.confidence >= 0.75 ? 'checkmark-circle' : 'warning'}
                size={16}
                color={ocrResult.confidence >= 0.75 ? '#059669' : '#D97706'}
              />
              <Text style={styles.confidenceText}>
                OCR Confidence: {Math.round(ocrResult.confidence * 100)}%
              </Text>
            </View>
          )}
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

// ─── FieldRow sub-component for inline editing ───
function FieldRow({
  label, value, isEditing, error, isWarning, onPress, children,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  error: string | null;
  isWarning: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.fieldRow,
        isWarning && styles.fieldRowWarning,
        error && styles.fieldRowError,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isEditing}
    >
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        children
      ) : (
        <Text style={[styles.value, (value === '\u2014') && styles.valuePlaceholder]}>
          {value}
        </Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {isWarning && !error && (
        <Text style={styles.warningText}>Not detected — please verify</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  headerButton: { paddingHorizontal: 8 },
  discardText: { color: '#DC2626', fontSize: 16, fontWeight: '500' },
  content: { padding: 16, paddingBottom: 40 },
  imagePreview: {
    width: '100%', height: 180, borderRadius: 14,
    overflow: 'hidden', marginBottom: 16, backgroundColor: '#1E293B',
  },
  image: { width: '100%', height: '100%' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 16 },
  fieldRow: {
    flexDirection: 'column', gap: 4,
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    borderRadius: 8,
  },
  fieldRowWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  fieldRowError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  label: { fontSize: 12, fontWeight: '500', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, color: '#0F172A', fontWeight: '500' },
  valuePlaceholder: { color: '#CBD5E1' },
  errorText: { fontSize: 12, color: '#DC2626', marginTop: 2 },
  warningText: { fontSize: 12, color: '#D97706', marginTop: 2 },
  input: {
    fontSize: 16, color: '#0F172A', fontWeight: '500',
    backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  notesInput: { minHeight: 60, textAlignVertical: 'top' },

  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  toggleOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  toggleBuyActive: { backgroundColor: '#059669', borderColor: '#059669' },
  toggleSellActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  toggleTextActive: { color: '#FFFFFF' },

  confidenceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  confidenceText: { fontSize: 13, color: '#64748B' },

  saveButton: {
    backgroundColor: '#0891B2', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  saveButtonDisabled: { backgroundColor: '#CBD5E1' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  saveButtonTextDisabled: { color: '#94A3B8' },
});
