import { Stack } from 'expo-router';

export default function ExpensesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F0F4F8' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Expenses' }}
      />
    </Stack>
  );
}
