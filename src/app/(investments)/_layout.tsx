import { Stack } from 'expo-router';

export default function InvestmentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F0F4F8' },
        headerTintColor: '#0F172A',
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
