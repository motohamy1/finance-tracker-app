import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { Category, Expense } from '@/types';
import { ExpenseCard } from './ExpenseCard';

interface CategoryHeaderProps {
  category: Category;
  expenses: Expense[];
  isExpanded: boolean;
  onToggle: (categoryId: string) => void;
  onLongPress?: () => void;
  onAddExpense?: (categoryId: string) => void;
}

const CARD_WIDTH = 150 + 8;

export function CategoryHeader({ category, expenses, isExpanded, onToggle, onLongPress, onAddExpense }: CategoryHeaderProps) {
  const animationHeight = useSharedValue(0);
  const [contentHeight, setContentHeight] = useState(0);

  React.useEffect(() => {
    if (isExpanded && contentHeight > 0) {
      animationHeight.value = withTiming(contentHeight, { duration: 250 });
    } else {
      animationHeight.value = withTiming(0, { duration: 250 });
    }
  }, [isExpanded, contentHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animationHeight.value,
    opacity: animationHeight.value > 0 ? 1 : 0,
  }));

  const onContentLayout = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const h = event.nativeEvent.layout.height;
    if (h > 0 && h !== contentHeight) {
      setContentHeight(h);
    }
  }, [contentHeight]);

  const handleToggle = useCallback(() => {
    onToggle(category.id);
  }, [category.id, onToggle]);

  const renderExpenseCard = useCallback(({ item }: { item: Expense }) => (
    <ExpenseCard expense={item} accentColor={category.colorHex} />
  ), [category.colorHex]);

  const handleAddPress = useCallback(() => {
    onAddExpense?.(category.id);
  }, [category.id, onAddExpense]);

  return (
    <View style={[styles.container, isExpanded && styles.containerExpanded]}>
      <Pressable
        onPress={handleToggle}
        onLongPress={onLongPress}
        style={styles.header}
      >
        <View style={[styles.colorDot, { backgroundColor: category.colorHex }]} />
        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.count}>{expenses.length} items</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#0891B2"
        />
      </Pressable>

      <Animated.View style={[styles.contentOuter, animatedStyle]}>
        <View style={styles.contentInner} onLayout={onContentLayout}>
          {expenses.length > 0 ? (
            <FlatList
              horizontal
              data={expenses}
              renderItem={renderExpenseCard}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              contentContainerStyle={styles.cardRow}
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH,
                offset: CARD_WIDTH * index,
                index,
              })}
            />
          ) : (
            <TouchableOpacity style={emptyCardStyles.card} onPress={handleAddPress}>
              <Ionicons name="add" size={24} color="#0891B2" />
              <Text style={emptyCardStyles.text}>Add an expense</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  containerExpanded: {
    backgroundColor: '#F0F4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  count: {
    fontSize: 12,
    color: '#94A3B8',
  },
  contentOuter: {
    overflow: 'hidden',
  },
  contentInner: {
    padding: 8,
  },
  cardRow: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});

const emptyCardStyles = StyleSheet.create({
  card: {
    width: 150,
    height: 110,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    gap: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
});
