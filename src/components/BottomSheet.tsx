import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/services/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(300);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 250 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      sheetTranslateY.value = withTiming(300, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle, { backgroundColor: colors.overlay }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>
      <Animated.View style={[
        styles.sheet,
        sheetStyle,
        {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        },
      ]}>
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>
        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 3,
    paddingBottom: 34,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
