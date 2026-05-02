import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Trades</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.section}>
              <Text style={styles.label}>Search</Text>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search ticker or notes..."
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Direction</Text>
              <View style={styles.toggleRow}>
                {(['all', 'buy', 'sell'] as const).map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.toggleOption, direction === d && styles.toggleActive]}
                    onPress={() => setDirection(d)}
                  >
                    <Text style={[styles.toggleText, direction === d && styles.toggleTextActive]}>
                      {d === 'all' ? 'All' : d === 'buy' ? 'Buy' : 'Sell'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Date Range</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.dateLabel}>From</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={dateFrom}
                    onChangeText={setDateFrom}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#CBD5E1"
                    maxLength={10}
                  />
                </View>
                <Text style={styles.dateSep}>to</Text>
                <View style={styles.dateField}>
                  <Text style={styles.dateLabel}>To</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={dateTo}
                    onChangeText={setDateTo}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#CBD5E1"
                    maxLength={10}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {isFiltered && (
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.8}>
              <Text style={styles.applyText}>Apply Filters</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  body: { padding: 16 },
  section: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 10,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: '#0891B2' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  toggleTextActive: { color: '#FFFFFF' },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  dateInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateSep: { fontSize: 14, color: '#94A3B8', paddingBottom: 12 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  applyButton: {
    flex: 1,
    backgroundColor: '#0891B2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
