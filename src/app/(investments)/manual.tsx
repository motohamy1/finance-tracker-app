import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { useTheme } from '@/services/theme';
import { getTodayISO, formatCurrency } from '@/utils/format';
import { validateTradeFields, canSaveTrade } from '@/utils/tradeValidation';
import type { TradeDirection, TradeFormData } from '@/types';
import { DEFAULT_INVESTMENT_KINDS } from '@/types';

export default function ManualEntryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    prefillTicker?: string;
    prefillDirection?: string;
    prefillShares?: string;
    avgCostCents?: string;
    imageUri?: string;
  }>();

  const addTrade = useTradeStore((s) => s.addTrade);
  const trades = useTradeStore((s) => s.trades);

  // Pre-fill from params (context-aware entry from holdings)
  const prefillDirection = (params.prefillDirection === 'buy' || params.prefillDirection === 'sell')
    ? params.prefillDirection : 'buy';
  const prefillTicker = params.prefillTicker?.toUpperCase() ?? '';
  const prefillShares = params.prefillShares ?? '';
  const avgCost = params.avgCostCents ? parseInt(params.avgCostCents, 10) : null;

  const [ticker, setTicker] = useState(prefillTicker);
  const [shares, setShares] = useState(prefillShares);
  const [pricePerShare, setPricePerShare] = useState('');
  const [tradeDate, setTradeDate] = useState(getTodayISO());
  const [direction, setDirection] = useState<TradeDirection>(prefillDirection);
  const [assetType, setAssetType] = useState<string>(DEFAULT_INVESTMENT_KINDS[0].id);
  const [fees, setFees] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedCount, setSavedCount] = useState(0);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = useCallback(() => {
    setShares('');
    setPricePerShare('');
    setFees('');
    setNotes('');
    setErrors({});
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Context: If selling, find existing buy info for the ticker
  const buyContext = useMemo(() => {
    if (direction !== 'sell' || !ticker) return null;
    const upperTicker = ticker.toUpperCase();
    const buyTrades = trades.filter(t => t.ticker === upperTicker && t.direction === 'buy');
    const sellTrades = trades.filter(t => t.ticker === upperTicker && t.direction === 'sell');
    const totalBought = buyTrades.reduce((s, t) => s + t.shares, 0);
    const totalSold = sellTrades.reduce((s, t) => s + t.shares, 0);
    const remaining = totalBought - totalSold;
    if (remaining <= 0) return null;
    const avgCostBasis = avgCost ?? (
      buyTrades.reduce((s, t) => s + t.shares * t.pricePerShareCents, 0) / totalBought
    );
    return { remaining, avgCostBasis: Math.round(avgCostBasis), totalBought };
  }, [direction, ticker, trades, avgCost]);

  // Live P&L preview when selling
  const pnlPreview = useMemo(() => {
    if (!buyContext || !pricePerShare || !shares) return null;
    const sellPriceCents = Math.round(parseFloat(pricePerShare) * 100);
    const shareCount = parseInt(shares, 10);
    if (isNaN(sellPriceCents) || isNaN(shareCount) || shareCount <= 0 || sellPriceCents <= 0) return null;
    const feesCents = fees ? Math.round(parseFloat(fees) * 100) : 0;
    const pnlCents = (sellPriceCents - buyContext.avgCostBasis) * shareCount - feesCents;
    return {
      pnlCents,
      sellPriceCents,
      shareCount,
      buyPriceCents: buyContext.avgCostBasis,
    };
  }, [buyContext, pricePerShare, shares, fees]);

  const validate = useCallback((): boolean => {
    const fieldValues = {
      ticker,
      shares,
      pricePerShareCents: pricePerShare,
      tradeDate,
      direction,
      assetType,
      feesCents: fees,
      notes,
    };
    const validationErrors = validateTradeFields(fieldValues);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [ticker, shares, pricePerShare, tradeDate, direction, fees, notes]);

  const canSaveResult = useMemo(() => {
    const fieldValues = {
      ticker,
      shares,
      pricePerShareCents: pricePerShare,
      tradeDate,
      direction,
      assetType,
    };
    return canSaveTrade(fieldValues, errors);
  }, [ticker, shares, pricePerShare, tradeDate, direction, errors]);

  const handleSave = useCallback((andClose: boolean) => {
    if (!validate()) return;

    const priceInCents = Math.round(parseFloat(pricePerShare) * 100);
    const feesInCents = fees ? Math.round(parseFloat(fees) * 100) : 0;

    const formData: TradeFormData = {
      ticker: ticker.trim().toUpperCase(),
      shares,
      pricePerShareCents: String(priceInCents),
      tradeDate,
      direction,
      assetType,
      feesCents: fees ? String(feesInCents) : '',
      notes,
    };
    addTrade(formData);

    if (andClose) {
      router.back();
      return;
    }

    resetForm();
    const count = savedCount + 1;
    setSavedCount(count);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedCount(0), 2500);
  }, [ticker, shares, pricePerShare, tradeDate, direction, fees, notes, savedCount, validate, addTrade, router, resetForm]);

  const handleClose = useCallback(() => router.back(), [router]);

  const isPrefilledSell = prefillDirection === 'sell' && prefillTicker !== '';

  const inputTheme = { backgroundColor: colors.bgInput, color: colors.text, borderColor: colors.border };
  const labelTheme = { color: colors.textSecondary };
  const toggleTheme = { backgroundColor: colors.bgCard, borderColor: colors.border };
  const toggleTextTheme = { color: colors.text };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isPrefilledSell ? `Sell ${prefillTicker}` : 'Enter Trade',
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >

        {/* Context banner when selling from a holding */}
        {buyContext && isPrefilledSell && (
          <View style={styles.contextBanner}>
            <View style={styles.contextHeader}>
              <Ionicons name="swap-vertical" size={18} color="#DC2626" />
              <Text style={styles.contextTitle}>Selling {ticker}</Text>
            </View>
            <View style={styles.contextDetails}>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>Open shares</Text>
                <Text style={styles.contextValue}>{buyContext.remaining}</Text>
              </View>
              <View style={styles.contextDivider} />
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>Avg buy price</Text>
                <Text style={styles.contextValue}>{formatCurrency(buyContext.avgCostBasis)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Ticker */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, labelTheme]}>Ticker *</Text>
          <TextInput
            style={[styles.input, inputTheme, errors.ticker && styles.inputError, isPrefilledSell && { backgroundColor: colors.bgInput, color: colors.textSecondary }]}
            value={ticker}
            onChangeText={setTicker}
            placeholder="e.g. AAPL"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={5}
            editable={!isPrefilledSell}
          />
          {errors.ticker && <Text style={styles.errorText}>{errors.ticker}</Text>}
        </View>

        {/* Shares */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, labelTheme]}>Shares *
            {buyContext ? ` (${buyContext.remaining} available)` : ''}
          </Text>
          <TextInput
            style={[styles.input, inputTheme, errors.shares && styles.inputError]}
            value={shares}
            onChangeText={(v) => setShares(v.replace(/[^0-9]/g, ''))}
            placeholder={buyContext ? `Max ${buyContext.remaining}` : 'e.g. 10'}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />
          {errors.shares && <Text style={styles.errorText}>{errors.shares}</Text>}
        </View>

        {/* Price per Share */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, labelTheme]}>Price per Share (EGP) *</Text>
          <TextInput
            style={[styles.input, inputTheme, errors.pricePerShareCents && styles.inputError]}
            value={pricePerShare}
            onChangeText={(v) => setPricePerShare(v.replace(/[^0-9.]/g, ''))}
            placeholder="e.g. 185.50"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          {errors.pricePerShareCents && <Text style={styles.errorText}>{errors.pricePerShareCents}</Text>}
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, labelTheme]}>Trade Date *</Text>
          <TextInput
            style={[styles.input, inputTheme, errors.tradeDate && styles.inputError]}
            value={tradeDate}
            onChangeText={setTradeDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            maxLength={10}
          />
          {errors.tradeDate && <Text style={styles.errorText}>{errors.tradeDate}</Text>}
        </View>

        {/* Asset Type */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, labelTheme]}>Asset Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            <View style={styles.typeRow}>
              {DEFAULT_INVESTMENT_KINDS.map((kind) => (
                <TouchableOpacity
                  key={kind.id}
                  style={[styles.typeOption, { backgroundColor: colors.bgCard, borderColor: colors.border }, assetType === kind.id && styles.typeOptionActive]}
                  onPress={() => setAssetType(kind.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeText, { color: colors.text }, assetType === kind.id && styles.typeTextActive]}>
                    {kind.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Direction toggle */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, labelTheme]}>Direction</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleOption, toggleTheme, direction === 'buy' && styles.toggleBuyActive]}
              onPress={() => setDirection('buy')}
              disabled={isPrefilledSell}
            >
              <Text style={[styles.toggleText, toggleTextTheme, direction === 'buy' && styles.toggleTextActive]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, toggleTheme, direction === 'sell' && styles.toggleSellActive]}
              onPress={() => setDirection('sell')}
              disabled={isPrefilledSell}
            >
              <Text style={[styles.toggleText, toggleTextTheme, direction === 'sell' && styles.toggleTextActive]}>Sell</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fees (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, labelTheme]}>Fees (EGP) — Optional</Text>
          <TextInput
            style={[styles.input, inputTheme]}
            value={fees}
            onChangeText={(v) => setFees(v.replace(/[^0-9.]/g, ''))}
            placeholder="e.g. 0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Notes (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, labelTheme]}>Notes — Optional</Text>
          <TextInput
            style={[styles.input, inputTheme, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        {/* Live P&L Preview when selling */}
        {pnlPreview && (
          <View style={[styles.pnlPreviewCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={styles.pnlPreviewTitle}>P&L Preview</Text>
            <View style={styles.pnlPreviewRow}>
              <View style={styles.pnlPreviewSide}>
                <View style={styles.pnlPreviewBadge}>
                  <Ionicons name="arrow-up-circle" size={14} color="#059669" />
                  <Text style={styles.pnlPreviewBadgeText}>Buy</Text>
                </View>
                <Text style={styles.pnlPreviewPrice}>
                  {pnlPreview.shareCount} × {formatCurrency(pnlPreview.buyPriceCents)}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
              <View style={styles.pnlPreviewSide}>
                <View style={[styles.pnlPreviewBadge, styles.pnlPreviewBadgeSell]}>
                  <Ionicons name="arrow-down-circle" size={14} color="#DC2626" />
                  <Text style={[styles.pnlPreviewBadgeText, styles.pnlPreviewBadgeTextSell]}>Sell</Text>
                </View>
                <Text style={styles.pnlPreviewPrice}>
                  {pnlPreview.shareCount} × {formatCurrency(pnlPreview.sellPriceCents)}
                </Text>
              </View>
            </View>
            <View style={styles.pnlPreviewDivider} />
            <View style={styles.pnlPreviewResult}>
              <Text style={styles.pnlPreviewLabel}>Estimated P&L</Text>
              <Text style={[
                styles.pnlPreviewValue,
                pnlPreview.pnlCents >= 0 ? styles.gain : styles.loss,
              ]}>
                {pnlPreview.pnlCents >= 0 ? '+' : ''}{formatCurrency(Math.abs(pnlPreview.pnlCents))}
              </Text>
            </View>
          </View>
        )}

        {/* Save buttons */}
        {savedCount > 0 && (
          <View style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.savedBannerText}>
              {savedCount} trade{savedCount > 1 ? 's' : ''} saved
            </Text>
          </View>
        )}
        <View style={styles.saveRow}>
          <TouchableOpacity
            style={[styles.saveAddButton, !canSaveResult && styles.saveButtonDisabled]}
            onPress={() => handleSave(false)}
            disabled={!canSaveResult}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={canSaveResult ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.saveButtonText, !canSaveResult && styles.saveButtonTextDisabled]}>
              Save & Add Another
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveCloseButton, !canSaveResult && styles.saveButtonDisabled]}
            onPress={() => handleSave(true)}
            disabled={!canSaveResult}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color={canSaveResult ? '#0891B2' : '#94A3B8'} />
            <Text style={[styles.saveCloseText, !canSaveResult && styles.saveButtonTextDisabled]}>
              Save & Close
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderRadius: 0, padding: 14,
    fontSize: 16, borderWidth: 2,
    backgroundColor: '#0A0A0F',
    color: '#F0F0F5',
  },
  inputError: { borderColor: '#FF0000', backgroundColor: 'rgba(255,0,0,0.08)' },
  inputLocked: { color: '#6B6B78' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#FF0000', marginTop: 4, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleOption: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 0, borderWidth: 2,
    backgroundColor: '#1A1A24',
  },
  toggleBuyActive: { backgroundColor: '#39FF14', borderColor: '#FFFFFF' },
  toggleSellActive: { backgroundColor: '#FF0000', borderColor: '#FFFFFF' },
  toggleText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  toggleTextActive: { color: '#0A0A0F' },
  saveButton: {
    backgroundColor: '#00E5FF', borderRadius: 0, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  saveButtonDisabled: { backgroundColor: '#3A3A45', borderColor: '#3A3A45' },
  saveButtonText: { color: '#0A0A0F', fontSize: 14, fontWeight: '700', flexShrink: 1, letterSpacing: 0.5 },
  saveButtonTextDisabled: { color: '#6B6B78' },
  saveRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  saveAddButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#00E5FF',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  saveCloseButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  saveCloseText: { color: '#00E5FF', fontSize: 14, fontWeight: '700', flexShrink: 1, letterSpacing: 0.5 },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#39FF14',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  savedBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 0.3,
  },

  // Context banner styles
  contextBanner: {
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
    borderRadius: 0,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF0000',
    letterSpacing: 0.3,
  },
  contextDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  contextItem: { flex: 1 },
  contextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B6B78',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contextValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0F0F5',
    marginTop: 2,
  },
  contextDivider: {
    width: 2,
    backgroundColor: 'rgba(255,0,0,0.3)',
  },

  // P&L Preview styles
  pnlPreviewCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  pnlPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B78',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  pnlPreviewRow: {
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
  pnlPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#39FF14',
  },
  pnlPreviewBadgeSell: {
    borderColor: '#FF0000',
  },
  pnlPreviewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 0.3,
  },
  pnlPreviewBadgeTextSell: {
    color: '#FF0000',
  },
  pnlPreviewPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F0F5',
  },
  pnlPreviewDivider: {
    height: 2,
    backgroundColor: '#FFFFFF',
    marginVertical: 12,
  },
  pnlPreviewResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pnlPreviewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F0F0F5',
  },
  pnlPreviewValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  gain: { color: '#39FF14' },
  loss: { color: '#FF0000' },
  typeScroll: { marginBottom: 4 },
  typeRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  typeOption: {
    backgroundColor: '#1A1A24',
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  typeOptionActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#FFFFFF',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0F0F5',
    letterSpacing: 0.3,
  },
  typeTextActive: {
    color: '#0A0A0F',
  },
});
