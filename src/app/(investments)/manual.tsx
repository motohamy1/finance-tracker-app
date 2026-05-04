import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTradeStore } from '@/stores/tradeStore';
import { getTodayISO, formatCurrency } from '@/utils/format';
import { validateTradeFields, canSaveTrade } from '@/utils/tradeValidation';
import type { TradeDirection, TradeFormData } from '@/types';
import { DEFAULT_INVESTMENT_KINDS } from '@/types';

export default function ManualEntryScreen() {
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

  const handleSave = useCallback(() => {
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
    router.back();
  }, [ticker, shares, pricePerShare, tradeDate, direction, fees, notes, validate, addTrade, router]);

  const handleClose = useCallback(() => router.back(), [router]);

  const isPrefilledSell = prefillDirection === 'sell' && prefillTicker !== '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: isPrefilledSell ? `Sell ${prefillTicker}` : 'Enter Trade',
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

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
          <Text style={styles.label}>Ticker *</Text>
          <TextInput
            style={[styles.input, errors.ticker && styles.inputError, isPrefilledSell && styles.inputLocked]}
            value={ticker}
            onChangeText={setTicker}
            placeholder="e.g. AAPL"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            maxLength={5}
            editable={!isPrefilledSell}
          />
          {errors.ticker && <Text style={styles.errorText}>{errors.ticker}</Text>}
        </View>

        {/* Shares */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Shares *
            {buyContext ? ` (${buyContext.remaining} available)` : ''}
          </Text>
          <TextInput
            style={[styles.input, errors.shares && styles.inputError]}
            value={shares}
            onChangeText={(v) => setShares(v.replace(/[^0-9]/g, ''))}
            placeholder={buyContext ? `Max ${buyContext.remaining}` : 'e.g. 10'}
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

        {/* Asset Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Asset Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            <View style={styles.typeRow}>
              {DEFAULT_INVESTMENT_KINDS.map((kind) => (
                <TouchableOpacity
                  key={kind.id}
                  style={[styles.typeOption, assetType === kind.id && styles.typeOptionActive]}
                  onPress={() => setAssetType(kind.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeText, assetType === kind.id && styles.typeTextActive]}>
                    {kind.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Direction toggle */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Direction</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleOption, direction === 'buy' && styles.toggleBuyActive]}
              onPress={() => setDirection('buy')}
              disabled={isPrefilledSell}
            >
              <Text style={[styles.toggleText, direction === 'buy' && styles.toggleTextActive]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, direction === 'sell' && styles.toggleSellActive]}
              onPress={() => setDirection('sell')}
              disabled={isPrefilledSell}
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

        {/* Live P&L Preview when selling */}
        {pnlPreview && (
          <View style={styles.pnlPreviewCard}>
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

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, !canSaveResult && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSaveResult}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, !canSaveResult && styles.saveButtonTextDisabled]}>
            {direction === 'sell' ? 'Save Sell Trade' : 'Save Trade'}
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
  inputLocked: { backgroundColor: '#F1F5F9', color: '#64748B' },
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

  // Context banner styles
  contextBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
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
    color: '#DC2626',
  },
  contextDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  contextItem: { flex: 1 },
  contextLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  contextDivider: {
    width: 1,
    backgroundColor: '#FECACA',
  },

  // P&L Preview styles
  pnlPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pnlPreviewBadgeSell: {
    backgroundColor: '#FEE2E2',
  },
  pnlPreviewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  pnlPreviewBadgeTextSell: {
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
  gain: { color: '#059669' },
  loss: { color: '#DC2626' },
  typeScroll: { marginBottom: 4 },
  typeRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  typeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeOptionActive: {
    backgroundColor: '#0891B2',
    borderColor: '#0891B2',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
});
