import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/services/theme';

export interface ActionSheetOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

export function ActionSheetModal({ visible, onClose, title, options }: ActionSheetModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>
      <View style={[styles.sheet, { backgroundColor: colors.bgCard }]}>
        {title && (
          <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        )}
        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.option,
              i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
            ]}
            onPress={() => {
              onClose();
              opt.onPress();
            }}
            activeOpacity={0.6}
          >
            {opt.icon && (
              <Ionicons
                name={opt.icon}
                size={22}
                color={opt.destructive ? colors.danger : colors.primary}
              />
            )}
            <Text
              style={[
                styles.optionText,
                { color: opt.destructive ? colors.danger : colors.text },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.bgInput }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 34,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '500',
  },
  cancelButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 8,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
