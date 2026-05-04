import { Stack } from 'expo-router';
import { useTheme } from '@/services/theme';

export default function ExpensesLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.headerTint,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
          headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Expenses' }}
      />
    </Stack>
  );
}
