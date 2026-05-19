import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/services/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  ctaText?: string;
  onCtaPress?: () => void;
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, body, ctaText, onCtaPress, children }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.iconBox, { borderColor: colors.border }]}>
        <Ionicons name={icon} size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title.toUpperCase()}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>

      {children}

      {ctaText && onCtaPress && (
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.primary, borderColor: '#FFFFFF', borderWidth: 2 }]}
          onPress={onCtaPress}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={20} color="#0A0A0F" />
          <Text style={styles.ctaText}>{ctaText.toUpperCase()}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconBox: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 0,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  body: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 0,
    marginTop: 24,
  },
  ctaText: {
    color: '#0A0A0F',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
