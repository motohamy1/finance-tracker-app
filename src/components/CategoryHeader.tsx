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
      animHeight.value = withTiming(contentHeight, { duration: 200 });
    } else {
      animHeight.value = withTiming(0, { duration: 200 });
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
    <View style={[styles.cardWrapper, { borderColor: category.colorHex }]}>
      <ExpenseCard expense={item} accentColor="#FFFFFF" />
    </View>
  ), [category.colorHex]);

  return (
    <View style={[styles.container, { borderColor: category.colorHex }]}>
      <Pressable
        onPress={handleToggle}
        onLongPress={onLongPress}
        style={[styles.header, { backgroundColor: category.colorHex, borderColor: '#0A0A0F' }]}
      >
        <Text style={styles.name}>{category.name.toUpperCase()}</Text>
        <Text style={styles.count}>{expenses.length} ITEMS</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#0A0A0F"
        />
      </Pressable>

      <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
        <View style={[styles.contentInner, { backgroundColor: '#0A0A0F' }]} onLayout={onContentLayout}>
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
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={emptyCardStyles.text}>ADD EXPENSE</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    color: '#0A0A0F',
    letterSpacing: 0.5,
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0F',
    letterSpacing: 0.3,
    opacity: 0.8,
  },
  contentInner: {
    padding: 10,
  },
  cardRow: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  cardWrapper: {
    borderRadius: 0,
    marginRight: 8,
    borderWidth: 2,
  },
});

const emptyCardStyles = StyleSheet.create({
  card: {
    width: 150,
    height: 110,
    backgroundColor: '#1A1A24',
    borderRadius: 0,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    gap: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
