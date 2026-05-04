import React, { useState, useCallback, useEffect } from 'react';
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
  const [contentHeight, setContentHeight] = useState(0);
  const animHeight = useSharedValue(0);

  useEffect(() => {
    if (isExpanded && contentHeight > 0) {
      animHeight.value = withTiming(contentHeight, { duration: 250 });
    } else {
      animHeight.value = withTiming(0, { duration: 250 });
    }
  }, [isExpanded, contentHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animHeight.value,
    opacity: animHeight.value > 0 ? 1 : 0,
  }));

  const handleToggle = useCallback(() => {
    onToggle(category.id);
  }, [category.id, onToggle]);

  const handleAddPress = useCallback(() => {
    onAddExpense?.(category.id);
  }, [category.id, onAddExpense]);

  const onContentLayout = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const h = event.nativeEvent.layout.height;
    if (h > 0 && h !== contentHeight) setContentHeight(h);
  }, [contentHeight]);

  const renderExpenseCard = useCallback(({ item }: { item: Expense }) => (
    <View style={[styles.cardWrapper, { backgroundColor: category.colorHex, borderColor: category.colorHex }]}>
      <ExpenseCard expense={item} accentColor="#FFFFFF" />
    </View>
  ), [category.colorHex]);

  const textColor = '#FFFFFF';
  const subtitleColor = 'rgba(255,255,255,0.8)';

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleToggle}
        onLongPress={onLongPress}
        style={[styles.header, { backgroundColor: category.colorHex }]}
      >
        <Text style={[styles.name, { color: textColor }]}>{category.name}</Text>
        <Text style={[styles.count, { color: subtitleColor }]}>{expenses.length} items</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={textColor}
        />
      </Pressable>

      <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
        <View style={[styles.contentInner, { backgroundColor: category.colorHex }]} onLayout={onContentLayout}>
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
            <TouchableOpacity style={[emptyCardStyles.card, { borderColor: category.colorHex }]} onPress={handleAddPress}>
              <Ionicons name="add" size={24} color={category.colorHex} />
              <Text style={[emptyCardStyles.text, { color: category.colorHex }]}>Add an expense</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
  },
  contentInner: {
    padding: 10,
  },
  cardRow: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  cardWrapper: {
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});

const emptyCardStyles = StyleSheet.create({
  card: {
    width: 150,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    gap: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
