import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TickerChipsProps {
  tickers: string[];
  selected: string | null;
  onSelect: (ticker: string | null) => void;
}

export function TickerChips({ tickers, selected, onSelect }: TickerChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onSelect(null)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, !selected && styles.chipTextActive]}>All</Text>
      </TouchableOpacity>
      {tickers.map(ticker => {
        const isActive = selected === ticker;
        return (
          <TouchableOpacity
            key={ticker}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(isActive ? null : ticker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {ticker}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#0891B2',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
