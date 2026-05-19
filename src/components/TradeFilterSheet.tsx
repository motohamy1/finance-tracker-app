import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/services/theme';
import type { TradeDirection } from '@/types';

export interface FilterState {
  direction: TradeDirection | 'all';
  dateFrom: string | null;
  dateTo: string | null;
  searchQuery: string;
}

interface TradeFilterSheetProps {
  visible: boolean;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

export function TradeFilterSheet({ visible, filters, onApply, onClose }: TradeFilterSheetProps) {
  const { colors } = useTheme();
  const [direction, setDirection] = useState<TradeDirection | 'all'>(filters.direction);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState(filters.dateTo || '');
  const [search, setSearch] = useState(filters.searchQuery);

  useEffect(() => {
    if (visible) {
      setDirection(filters.direction);
      setDateFrom(filters.dateFrom || '');
      setDateTo(filters.dateTo || '');
      setSearch(filters.searchQuery);
    }
  }, [visible]);

  const handleApply = () => {
    onApply({
      direction,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      searchQuery: search,
    });
  };

  const handleReset = () => {
    onApply({
      direction: 'all',
      dateFrom: null,
      dateTo: null,
      searchQuery: '',
    });
  };

  const isFiltered = filters.direction !== 'all' || filters.dateFrom !== null || filters.dateTo !== null || filters.searchQuery !== '';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.bgCard, borderTopColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.text }]}>FILTER TRADES</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.9}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>SEARCH</Text>
              <View style={[styles.searchRow, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search ticker or notes..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>DIRECTION</Text>
              <View style={styles.toggleRow}>
                {(['all', 'buy', 'sell'] as const).map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.toggleOption,
                      { backgroundColor: colors.bgInput, borderColor: colors.border },
                      direction === d && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setDirection(d)}
                    activeOpacity={0.9}
                  >
                    <Text style={[
                      styles.toggleText,
                      { color: colors.textSecondary },
                      direction === d && { color: colors.textInverse },
                    ]}>
                      {d === 'all' ? 'All' : d === 'buy' ? 'Buy' : 'Sell'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>DATE RANGE</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>FROM</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.text }]}
                    value={dateFrom}
                    onChangeText={setDateFrom}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    maxLength={10}
                  />
                </View>
                <Text style={[styles.dateSep, { color: colors.textMuted }]}>TO</Text>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>TO</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.text }]}
                    value={dateTo}
                    onChangeText={setDateTo}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    maxLength={10}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            {isFiltered && (
              <TouchableOpacity
                style={[styles.resetButton, { borderColor: colors.border }]}
                onPress={handleReset}
                activeOpacity={0.9}
              >
                <Text style={[styles.resetText, { color: colors.textSecondary }]}>RESET</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              activeOpacity={0.9}
            >
              <Text style={[styles.applyText, { color: colors.textInverse }]}>APPLY FILTERS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: 3,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
  },
  title: { fontSize: 18, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { padding: 16 },
  section: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 2,
  },
  dateSep: { fontSize: 14, paddingBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  footer: {
    padding: 16,
    borderTopWidth: 2,
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 0,
    borderWidth: 2,
  },
  resetText: { fontSize: 15, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 0,
  },
  applyText: { fontSize: 15, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});
