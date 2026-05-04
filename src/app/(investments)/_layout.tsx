import { Stack } from 'expo-router';
import { useTheme } from '@/services/theme';

export default function InvestmentsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.headerTint,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Investments', headerShown: false }}
      />
      <Stack.Screen
        name="import"
        options={{
          title: 'Import Trade',
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="review"
        options={{
          title: 'Review Trade',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="manual"
        options={{
          title: 'Enter Trade',
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
