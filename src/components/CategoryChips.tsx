import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/services/theme';

interface CategoryChipsProps {
  categories: { id: string; label: string; tradeCount: number }[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
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
          !selected && { backgroundColor: colors.primary, borderColor: '#FFFFFF' },
          selected && { backgroundColor: colors.bgCard, borderColor: colors.border },
        ]}
        onPress={() => onSelect(null)}
        activeOpacity={0.9}
      >
        <Text style={[
          styles.chipText,
          !selected && { color: '#0A0A0F' },
          selected && { color: colors.text },
        ]}>ALL</Text>
      </TouchableOpacity>
      {categories.map(cat => {
        const isActive = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              isActive && { backgroundColor: colors.primary, borderColor: '#FFFFFF' },
              !isActive && { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
            onPress={() => onSelect(isActive ? null : cat.id)}
            activeOpacity={0.9}
          >
            <Text style={[
              styles.chipText,
              isActive && { color: '#0A0A0F' },
              !isActive && { color: colors.text },
            ]}>
              {cat.label.toUpperCase()} {cat.tradeCount > 0 ? ` ${cat.tradeCount}` : ''}
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
    borderWidth: 2,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
