import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Image, KeyboardAvoidingView, Platform, Modal, Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { useTheme } from '@/services/theme';
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
import { DEFAULT_INVESTMENT_KINDS } from '@/types';

type FieldKey = 'ticker' | 'shares' | 'pricePerShareCents' | 'tradeDate' | 'direction' | 'assetType' | 'feesCents' | 'notes';

interface FieldState {
  value: string;
  isEditing: boolean;
  error: string | null;
}

export default function ReviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
        assetType: existingTrade.assetType || 'stock',
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
    assetType: { value: initialValues.assetType, isEditing: false, error: null },
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
    assetType: fields.assetType.value,
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
    const extractableKeys: FieldKey[] = ['ticker', 'shares', 'pricePerShareCents', 'tradeDate', 'direction', 'assetType'];
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
      setFields((prev) => {
        const cleared = { ...prev };
        for (const key of Object.keys(cleared)) {
          cleared[key as FieldKey] = { ...cleared[key as FieldKey], error: null };
        }
        return cleared;
      });
      return true;
    }
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
      assetType: fields.assetType.value,
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

  const themedStyles = useMemo(() => getThemedStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={handleDiscard} style={styles.headerButton}>
              <Text style={[styles.discardText, { color: colors.danger }]}>Discard</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Screenshot preview if available */}
        {params.imageUri && (
          <View style={[styles.imagePreview, { backgroundColor: colors.bgInput }]}>
            <Image source={{ uri: params.imageUri }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        {/* Card preview layout per D-20 */}
        <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
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
            colors={colors}
          >
            {fields.ticker.isEditing && (
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.bgInput, borderColor: colors.border }]}
                value={fields.ticker.value}
                onChangeText={(v) => updateField('ticker', v.toUpperCase())}
                placeholder="e.g. AAPL"
                placeholderTextColor={colors.textMuted}
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
            colors={colors}
          >
            {fields.shares.isEditing && (
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.bgInput, borderColor: colors.border }]}
                value={fields.shares.value}
                onChangeText={(v) => updateField('shares', v.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 10"
                placeholderTextColor={colors.textMuted}
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
            colors={colors}
          >
            {fields.pricePerShareCents.isEditing && (
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.bgInput, borderColor: colors.border }]}
                value={fields.pricePerShareCents.value}
                onChangeText={(v) => updateField('pricePerShareCents', v.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 185.50"
                placeholderTextColor={colors.textMuted}
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
            colors={colors}
          >
            {fields.tradeDate.isEditing && (
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.bgInput, borderColor: colors.border }]}
                value={fields.tradeDate.value}
                onChangeText={(v) => updateField('tradeDate', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                autoFocus
                maxLength={10}
                onBlur={() => toggleEdit('tradeDate')}
              />
            )}
          </FieldRow>

          {/* Direction toggle per D-16: user can override */}
          <View style={[
            styles.fieldRow,
            { borderBottomColor: colors.divider },
            checkMissingFromOCR('direction') && !fieldError('direction') && [styles.fieldRowWarning, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }],
            fieldError('direction') && [styles.fieldRowError, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }],
          ]}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Direction</Text>
              {getConfidenceDotProps('direction', 'Direction') && (
                <TouchableOpacity
                  style={[styles.confidenceDot, {
                    backgroundColor: fieldConfidenceColor('direction') || colors.textMuted,
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
                  { borderColor: colors.border },
                  fields.direction.value === 'buy' && [styles.toggleBuyActive, { backgroundColor: colors.success, borderColor: colors.success }],
                ]}
                onPress={() => updateField('direction', 'buy')}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={fields.direction.value === 'buy' ? '#FFFFFF' : colors.success}
                />
                <Text
                  style={[
                    styles.toggleText,
                    { color: colors.textSecondary },
                    fields.direction.value === 'buy' && styles.toggleTextActive,
                  ]}
                >
                  Buy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  { borderColor: colors.border },
                  fields.direction.value === 'sell' && [styles.toggleSellActive, { backgroundColor: colors.danger, borderColor: colors.danger }],
                ]}
                onPress={() => updateField('direction', 'sell')}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={fields.direction.value === 'sell' ? '#FFFFFF' : colors.danger}
                />
                <Text
                  style={[
                    styles.toggleText,
                    { color: colors.textSecondary },
                    fields.direction.value === 'sell' && styles.toggleTextActive,
                  ]}
                >
                  Sell
                </Text>
              </TouchableOpacity>
            </View>
            {fieldError('direction') && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{fieldError('direction')}</Text>
            )}
            {checkMissingFromOCR('direction') && !fieldError('direction') && (
              <Text style={[styles.warningText, { color: colors.warning }]}>Not detected — please verify</Text>
            )}
          </View>

          {/* Asset Type selection */}
          <View style={[
            styles.fieldRow,
            { borderBottomColor: colors.divider },
            checkMissingFromOCR('assetType') && !fieldError('assetType') && [styles.fieldRowWarning, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }],
            fieldError('assetType') && [styles.fieldRowError, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }],
          ]}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Asset Type</Text>
              {getConfidenceDotProps('assetType', 'Asset Type') && (
                <TouchableOpacity
                  style={[styles.confidenceDot, {
                    backgroundColor: fieldConfidenceColor('assetType') || colors.textMuted,
                  }]}
                  onPress={() => setTooltipField({ key: 'assetType', label: 'Asset Type' })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.confidenceDotText}>
                    {Math.round((fieldConfidence('assetType') ?? 0) * 100)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.assetTypeScroll}
            >
              {DEFAULT_INVESTMENT_KINDS.map((kind) => {
                const isActive = fields.assetType.value === kind.id;
                return (
                  <TouchableOpacity
                    key={kind.id}
                    style={[
                      styles.assetTypeOption,
                      { backgroundColor: colors.bgInput, borderColor: colors.border },
                      isActive && [styles.assetTypeOptionActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                    ]}
                    onPress={() => updateField('assetType', kind.id)}
                  >
                    <Ionicons
                      name={kind.icon as any}
                      size={14}
                      color={isActive ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.assetTypeText,
                        { color: colors.textSecondary },
                        isActive && styles.assetTypeTextActive,
                      ]}
                    >
                      {kind.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {fieldError('assetType') && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{fieldError('assetType')}</Text>
            )}
            {checkMissingFromOCR('assetType') && !fieldError('assetType') && (
              <Text style={[styles.warningText, { color: colors.warning }]}>Not detected — please verify</Text>
            )}
          </View>

          {/* Fees (optional per D-22) */}
          <FieldRow
            label="Fees"
            value={fields.feesCents.value ? formatTradeFieldDisplay('pricePerShareCents', fields.feesCents.value) : 'None'}
            isEditing={fields.feesCents.isEditing}
            error={fieldError('feesCents')}
            isWarning={!fieldError('feesCents') && ocrResult !== null && checkMissingFromOCR('feesCents')}
            onPress={() => toggleEdit('feesCents')}
            colors={colors}
          >
            {fields.feesCents.isEditing && (
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.bgInput, borderColor: colors.border }]}
                value={fields.feesCents.value}
                onChangeText={(v) => updateField('feesCents', v.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 0.00"
                placeholderTextColor={colors.textMuted}
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
            colors={colors}
          >
            {fields.notes.isEditing && (
              <TextInput
                style={[styles.input, styles.notesInput, { color: colors.text, backgroundColor: colors.bgInput, borderColor: colors.border }]}
                value={fields.notes.value}
                onChangeText={(v) => updateField('notes', v)}
                placeholder="Optional notes..."
                placeholderTextColor={colors.textMuted}
                autoFocus
                multiline
                onBlur={() => toggleEdit('notes')}
              />
            )}
          </FieldRow>

          {/* AI Extraction metadata — replaces simple OCR confidence */}
          {ocrResult && (
            <View style={[styles.confidenceSection, { borderTopColor: colors.divider }]}>
              {/* Main confidence row */}
              <View style={styles.confidenceRow}>
                <Ionicons
                  name={ocrResult.confidence >= 0.75 ? 'checkmark-circle' : 'warning'}
                  size={16}
                  color={ocrResult.confidence >= 0.75 ? colors.success : colors.warning}
                />
                <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                  Extraction Confidence: {Math.round(ocrResult.confidence * 100)}%
                </Text>
              </View>

              {/* AI-enhanced platform badge */}
              {ocrResult.aiMeta && ocrResult.aiMeta.platform !== 'generic' && (
                <View style={styles.aiMetaRow}>
                  <Ionicons name="hardware-chip-outline" size={14} color="#6366F1" />
                  <Text style={[styles.aiMetaText, { color: '#6366F1' }]}>
                    AI-enhanced · {ocrResult.aiMeta.platform.charAt(0).toUpperCase() + ocrResult.aiMeta.platform.slice(1)} template
                  </Text>
                  <View style={[
                    styles.aiPill,
                    ocrResult.aiMeta.platformConfidence >= 0.7
                      ? [styles.aiPillHigh, { backgroundColor: colors.primary + '15' }]
                      : [styles.aiPillLow, { backgroundColor: colors.warning + '15' }],
                  ]}>
                    <Text style={[styles.aiPillText, { color: colors.primary }]}>
                      {Math.round(ocrResult.aiMeta.platformConfidence * 100)}% match
                    </Text>
                  </View>
                </View>
              )}

              {/* Generic regex fallback indicator */}
              {(!ocrResult.aiMeta || ocrResult.aiMeta.platform === 'generic') && (
                <View style={styles.aiMetaRow}>
                  <Ionicons name="text-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.aiMetaTextMuted, { color: colors.textMuted }]}>Generic text extraction</Text>
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
            <View style={[styles.pnlPreviewCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.pnlPreviewTitle, { color: colors.textSecondary }]}>P&L Preview</Text>
              <View style={styles.pnlPreviewComparison}>
                <View style={styles.pnlPreviewSide}>
                  <View style={[styles.pnlPreviewBuyBadge, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="arrow-up-circle" size={14} color={colors.success} />
                    <Text style={[styles.pnlPreviewBuyText, { color: colors.success }]}>Buy</Text>
                  </View>
                  <Text style={[styles.pnlPreviewPrice, { color: colors.text }]}>{matchShares} × {formatCurrency(avgBuyCostCents)}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
                <View style={styles.pnlPreviewSide}>
                  <View style={[styles.pnlPreviewSellBadge, { backgroundColor: colors.danger + '15' }]}>
                    <Ionicons name="arrow-down-circle" size={14} color={colors.danger} />
                    <Text style={[styles.pnlPreviewSellText, { color: colors.danger }]}>Sell</Text>
                  </View>
                  <Text style={[styles.pnlPreviewPrice, { color: colors.text }]}>{matchShares} × {formatCurrency(priceCentsVal)}</Text>
                </View>
              </View>
              <View style={[styles.pnlPreviewDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.pnlPreviewResult}>
                <Text style={[styles.pnlPreviewLabel, { color: colors.textSecondary }]}>Estimated P&L</Text>
                <Text style={[styles.pnlPreviewValue, { color: isProfitable ? colors.success : colors.danger }]}>
                  {isProfitable ? '+' : ''}{formatCurrency(Math.abs(pnlCents))}
                </Text>
              </View>
              {sharesVal > remaining && (
                <Text style={[styles.pnlPreviewWarning, { color: colors.warning }]}>
                  ⚠ You own {remaining} shares but are selling {sharesVal}.
                </Text>
              )}
            </View>
          );
        })()}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, !canSave && { backgroundColor: colors.textMuted }]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, !canSave && { color: colors.bg }]}>
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
        <Pressable style={[styles.tooltipOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => setTooltipField(null)}>
          <View style={[styles.tooltipContent, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.tooltipTitle, { color: colors.text }]}>
              {tooltipField?.label} Extraction Confidence
            </Text>
            <Text style={[styles.tooltipPercentage, { color: colors.primary }]}>
              {tooltipField ? `${Math.round((fieldConfidence(tooltipField.key) ?? 0) * 100)}%` : ''}
            </Text>
            {ocrResult?.aiMeta && (
              <Text style={[styles.tooltipMethod, { color: colors.textSecondary }]}>
                Method: {ocrResult.aiMeta.extractionMethod === 'template'
                  ? `${ocrResult.aiMeta.platform.charAt(0).toUpperCase() + ocrResult.aiMeta.platform.slice(1)} template`
                  : 'Generic regex'}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.tooltipClose, { backgroundColor: colors.primary }]}
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
  confidenceDot, colors,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  error: string | null;
  isWarning: boolean;
  onPress: () => void;
  children?: React.ReactNode;
  confidenceDot?: { color: string; confidence: number; onPress: () => void };
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.fieldRow,
        { borderBottomColor: colors.divider },
        isWarning && !error && [styles.fieldRowWarning, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }],
        error && [styles.fieldRowError, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }],
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isEditing}
    >
      <View style={styles.fieldLabelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
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
        <Text style={[styles.value, { color: colors.text }, (value === '\u2014' || value === 'None') && { color: colors.textMuted }]}>
          {value}
        </Text>
      )}
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
      {isWarning && !error && (
        <Text style={[styles.warningText, { color: colors.warning }]}>Not detected — please verify</Text>
      )}
    </TouchableOpacity>
  );
}

function getThemedStyles(colors: any) {
  return StyleSheet.create({
    // This is a placeholder so we don't break anything
  });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: { paddingHorizontal: 8 },
  discardText: { fontSize: 16, fontWeight: '500' },
  content: { padding: 16, paddingBottom: 40 },
  imagePreview: {
    width: '100%', height: 180, borderRadius: 14,
    overflow: 'hidden', marginBottom: 16,
  },
  image: { width: '100%', height: '100%' },
  card: {
    borderRadius: 16, padding: 20,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  fieldRow: {
    flexDirection: 'column', gap: 4,
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  fieldRowWarning: { borderRadius: 8 },
  fieldRowError: { borderRadius: 8 },
  label: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: '500' },
  errorText: { fontSize: 12, marginTop: 2 },
  warningText: { fontSize: 12, marginTop: 2 },
  input: {
    fontSize: 16, fontWeight: '500',
    borderRadius: 8, padding: 10,
    borderWidth: 1,
  },
  notesInput: { minHeight: 60, textAlignVertical: 'top' },

  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  toggleOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1,
  },
  toggleBuyActive: {},
  toggleSellActive: {},
  toggleText: { fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#FFFFFF' },

  confidenceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  confidenceText: { fontSize: 13 },

  confidenceSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
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
    fontWeight: '500',
    flex: 1,
  },
  aiMetaTextMuted: {
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
  },
  aiPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  aiPillHigh: {},
  aiPillLow: {},
  aiPillText: {
    fontSize: 11,
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltipContent: {
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
  assetTypeScroll: {
    paddingVertical: 8,
    gap: 8,
  },
  assetTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  assetTypeOptionActive: {},
  assetTypeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  assetTypeTextActive: {
    color: '#FFFFFF',
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tooltipPercentage: {
    fontSize: 36,
    fontWeight: '700',
  },
  tooltipMethod: {
    fontSize: 12,
  },
  tooltipClose: {
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
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pnlPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pnlPreviewBuyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pnlPreviewSellBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pnlPreviewSellText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pnlPreviewPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  pnlPreviewDivider: {
    height: 1,
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
  },
  pnlPreviewValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  pnlPreviewWarning: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },

  saveButton: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
