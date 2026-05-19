import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/services/theme';

interface TickerChipsProps {
  tickers: string[];
  selected: string | null;
  onSelect: (ticker: string | null) => void;
}

export function TickerChips({ tickers, selected, onSelect }: TickerChipsProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          { borderColor: !selected ? colors.primary : colors.border },
          !selected && { backgroundColor: colors.primary },
        ]}
        onPress={() => onSelect(null)}
        activeOpacity={0.9}
      >
        <Text style={[
          styles.chipText,
          { color: !selected ? colors.textInverse : colors.textSecondary },
        ]}>ALL</Text>
      </TouchableOpacity>
      {tickers.map(ticker => {
        const isActive = selected === ticker;
        return (
          <TouchableOpacity
            key={ticker}
            style={[
              styles.chip,
              { borderColor: isActive ? colors.primary : colors.border },
              isActive && { backgroundColor: colors.primary },
            ]}
            onPress={() => onSelect(isActive ? null : ticker)}
            activeOpacity={0.9}
          >
            <Text style={[
              styles.chipText,
              { color: isActive ? colors.textInverse : colors.textSecondary },
            ]}>
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
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
