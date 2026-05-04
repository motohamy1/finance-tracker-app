import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Image, KeyboardAvoidingView, Platform, Modal, Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { getTodayISO, formatCurrency } from '@/utils/format';
import {
  parseOCRToInitialValues,
  validateTradeFields,
  isMissingFromOCR,
  formatTradeFieldDisplay,
  canSaveTrade,
  getFieldConfidence,
  getConfidenceTier,
  CONFIDENCE_COLORS,
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
  const allTrades = useTradeStore((s) => s.trades);
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

  // Tooltip state for per-field confidence details (D-02)
  const [tooltipField, setTooltipField] = useState<{ key: FieldKey; label: string } | null>(null);

  // Get confidence for a field
  const fieldConfidence = useCallback((key: FieldKey): number | null => {
    return getFieldConfidence(ocrResult, key);
  }, [ocrResult]);

  // Get confidence color for a field
  const fieldConfidenceColor = useCallback((key: FieldKey): string | null => {
    const tier = getConfidenceTier(fieldConfidence(key));
    if (!tier) return null;
    return CONFIDENCE_COLORS[tier] || null;
  }, [fieldConfidence]);

  // Show confidence dot for OCR-extractable fields when AI metadata is available
  const showConfidenceDot = useCallback((key: FieldKey): boolean => {
    // Only show dots for fields that OCR attempts to extract and when aiMeta exists
    const extractableKeys: FieldKey[] = ['ticker', 'shares', 'pricePerShareCents', 'tradeDate', 'direction'];
    if (!extractableKeys.includes(key)) return false;
    return ocrResult?.aiMeta?.perFieldConfidence !== undefined;
  }, [ocrResult]);

  // Build confidence dot props for a field row
  const getConfidenceDotProps = useCallback((key: FieldKey, label: string) => {
    if (!showConfidenceDot(key)) return undefined;
    const conf = fieldConfidence(key);
    const color = fieldConfidenceColor(key);
    return {
      color: color || '#94A3B8',
      confidence: conf ?? 0,
      onPress: () => setTooltipField({ key, label }),
    };
  }, [showConfidenceDot, fieldConfidence, fieldConfidenceColor]);

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
            confidenceDot={getConfidenceDotProps('ticker', 'Ticker')}
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
            confidenceDot={getConfidenceDotProps('shares', 'Shares')}
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
            confidenceDot={getConfidenceDotProps('pricePerShareCents', 'Price/Share')}
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
            confidenceDot={getConfidenceDotProps('tradeDate', 'Date')}
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
          <View style={[
            styles.fieldRow,
            checkMissingFromOCR('direction') && !fieldError('direction') && styles.fieldRowWarning,
            fieldError('direction') && styles.fieldRowError,
          ]}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.label}>Direction</Text>
              {getConfidenceDotProps('direction', 'Direction') && (
                <TouchableOpacity
                  style={[styles.confidenceDot, {
                    backgroundColor: fieldConfidenceColor('direction') || '#94A3B8',
                  }]}
                  onPress={() => setTooltipField({ key: 'direction', label: 'Direction' })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.confidenceDotText}>
                    {Math.round((fieldConfidence('direction') ?? 0) * 100)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
            {fieldError('direction') && (
              <Text style={styles.errorText}>{fieldError('direction')}</Text>
            )}
            {checkMissingFromOCR('direction') && !fieldError('direction') && (
              <Text style={styles.warningText}>Not detected — please verify</Text>
            )}
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

          {/* AI Extraction metadata — replaces simple OCR confidence */}
          {ocrResult && (
            <View style={styles.confidenceSection}>
              {/* Main confidence row */}
              <View style={styles.confidenceRow}>
                <Ionicons
                  name={ocrResult.confidence >= 0.75 ? 'checkmark-circle' : 'warning'}
                  size={16}
                  color={ocrResult.confidence >= 0.75 ? '#059669' : '#D97706'}
                />
                <Text style={styles.confidenceText}>
                  Extraction Confidence: {Math.round(ocrResult.confidence * 100)}%
                </Text>
              </View>

              {/* AI-enhanced platform badge */}
              {ocrResult.aiMeta && ocrResult.aiMeta.platform !== 'generic' && (
                <View style={styles.aiMetaRow}>
                  <Ionicons name="hardware-chip-outline" size={14} color="#6366F1" />
                  <Text style={styles.aiMetaText}>
                    AI-enhanced · {ocrResult.aiMeta.platform.charAt(0).toUpperCase() + ocrResult.aiMeta.platform.slice(1)} template
                  </Text>
                  <View style={[
                    styles.aiPill,
                    ocrResult.aiMeta.platformConfidence >= 0.7 ? styles.aiPillHigh : styles.aiPillLow,
                  ]}>
                    <Text style={styles.aiPillText}>
                      {Math.round(ocrResult.aiMeta.platformConfidence * 100)}% match
                    </Text>
                  </View>
                </View>
              )}

              {/* Generic regex fallback indicator */}
              {(!ocrResult.aiMeta || ocrResult.aiMeta.platform === 'generic') && (
                <View style={styles.aiMetaRow}>
                  <Ionicons name="text-outline" size={14} color="#94A3B8" />
                  <Text style={styles.aiMetaTextMuted}>Generic text extraction</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* P&L Preview for sell trades */}
        {(() => {
          const dir = fields.direction.value;
          const tickerVal = fields.ticker.value.trim().toUpperCase();
          const sharesVal = parseInt(fields.shares.value, 10);
          const priceCentsVal = Math.round(parseFloat(fields.pricePerShareCents.value) * 100);
          const feesCentsVal = fields.feesCents.value ? Math.round(parseFloat(fields.feesCents.value) * 100) : 0;

          if (dir !== 'sell' || !tickerVal || isNaN(sharesVal) || sharesVal <= 0 || isNaN(priceCentsVal) || priceCentsVal <= 0) return null;

          const buyTrades = allTrades.filter(t => t.ticker === tickerVal && t.direction === 'buy');
          const sellTrades = allTrades.filter(t => t.ticker === tickerVal && t.direction === 'sell' && t.id !== existingTrade?.id);
          const totalBought = buyTrades.reduce((s, t) => s + t.shares, 0);
          const totalSold = sellTrades.reduce((s, t) => s + t.shares, 0);
          const remaining = totalBought - totalSold;

          if (remaining <= 0 || buyTrades.length === 0) return null;

          const avgBuyCostCents = Math.round(
            buyTrades.reduce((s, t) => s + t.shares * t.pricePerShareCents, 0) / totalBought
          );
          const matchShares = Math.min(sharesVal, remaining);
          const pnlCents = (priceCentsVal - avgBuyCostCents) * matchShares - feesCentsVal;
          const isProfitable = pnlCents >= 0;

          return (
            <View style={styles.pnlPreviewCard}>
              <Text style={styles.pnlPreviewTitle}>P&L Preview</Text>
              <View style={styles.pnlPreviewComparison}>
                <View style={styles.pnlPreviewSide}>
                  <View style={styles.pnlPreviewBuyBadge}>
                    <Ionicons name="arrow-up-circle" size={14} color="#059669" />
                    <Text style={styles.pnlPreviewBuyText}>Buy</Text>
                  </View>
                  <Text style={styles.pnlPreviewPrice}>{matchShares} × {formatCurrency(avgBuyCostCents)}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
                <View style={styles.pnlPreviewSide}>
                  <View style={styles.pnlPreviewSellBadge}>
                    <Ionicons name="arrow-down-circle" size={14} color="#DC2626" />
                    <Text style={styles.pnlPreviewSellText}>Sell</Text>
                  </View>
                  <Text style={styles.pnlPreviewPrice}>{matchShares} × {formatCurrency(priceCentsVal)}</Text>
                </View>
              </View>
              <View style={styles.pnlPreviewDivider} />
              <View style={styles.pnlPreviewResult}>
                <Text style={styles.pnlPreviewLabel}>Estimated P&L</Text>
                <Text style={[styles.pnlPreviewValue, { color: isProfitable ? '#059669' : '#DC2626' }]}>
                  {isProfitable ? '+' : ''}{formatCurrency(Math.abs(pnlCents))}
                </Text>
              </View>
              {sharesVal > remaining && (
                <Text style={styles.pnlPreviewWarning}>
                  ⚠ You own {remaining} shares but are selling {sharesVal}.
                </Text>
              )}
            </View>
          );
        })()}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
            {fields.direction.value === 'sell' ? 'Save Sell Trade' : 'Save Trade'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confidence tooltip popup (D-02, D-04) */}
      <Modal
        visible={tooltipField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipField(null)}
      >
        <Pressable style={styles.tooltipOverlay} onPress={() => setTooltipField(null)}>
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipTitle}>
              {tooltipField?.label} Extraction Confidence
            </Text>
            <Text style={styles.tooltipPercentage}>
              {tooltipField ? `${Math.round((fieldConfidence(tooltipField.key) ?? 0) * 100)}%` : ''}
            </Text>
            {ocrResult?.aiMeta && (
              <Text style={styles.tooltipMethod}>
                Method: {ocrResult.aiMeta.extractionMethod === 'template'
                  ? `${ocrResult.aiMeta.platform.charAt(0).toUpperCase() + ocrResult.aiMeta.platform.slice(1)} template`
                  : 'Generic regex'}
              </Text>
            )}
            <TouchableOpacity
              style={styles.tooltipClose}
              onPress={() => setTooltipField(null)}
            >
              <Text style={styles.tooltipCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── FieldRow sub-component for inline editing ───
function FieldRow({
  label, value, isEditing, error, isWarning, onPress, children,
  confidenceDot,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  error: string | null;
  isWarning: boolean;
  onPress: () => void;
  children?: React.ReactNode;
  confidenceDot?: { color: string; confidence: number; onPress: () => void };
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
      <View style={styles.fieldLabelRow}>
        <Text style={styles.label}>{label}</Text>
        {confidenceDot && (
          <TouchableOpacity
            style={[styles.confidenceDot, { backgroundColor: confidenceDot.color }]}
            onPress={(e) => {
              e.stopPropagation?.();
              confidenceDot.onPress();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.confidenceDotText}>
              {Math.round(confidenceDot.confidence * 100)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  },
  confidenceText: { fontSize: 13, color: '#64748B' },

  confidenceSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  aiMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
  },
  aiMetaText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    flex: 1,
  },
  aiMetaTextMuted: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
    flex: 1,
  },
  aiPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  aiPillHigh: {
    backgroundColor: '#EEF2FF',
  },
  aiPillLow: {
    backgroundColor: '#FEF3C7',
  },
  aiPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
  },

  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceDot: {
    width: 28,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltipContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  tooltipPercentage: {
    fontSize: 36,
    fontWeight: '700',
    color: '#6366F1',
  },
  tooltipMethod: {
    fontSize: 12,
    color: '#64748B',
  },
  tooltipClose: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  tooltipCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // P&L Preview styles
  pnlPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pnlPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  pnlPreviewComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pnlPreviewSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  pnlPreviewBuyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pnlPreviewBuyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  pnlPreviewSellBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pnlPreviewSellText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  pnlPreviewPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  pnlPreviewDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  pnlPreviewResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pnlPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  pnlPreviewValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  pnlPreviewWarning: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 8,
    fontWeight: '500',
  },

  saveButton: {
    backgroundColor: '#0891B2', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  saveButtonDisabled: { backgroundColor: '#CBD5E1' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  saveButtonTextDisabled: { color: '#94A3B8' },
});
