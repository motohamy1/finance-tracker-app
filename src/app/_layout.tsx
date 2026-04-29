import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { runMigrations } from '@/db/schema';
import { useExpenseStore } from '@/stores/expenseStore';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const initialize = useExpenseStore((s) => s.initialize);
  const isInitialized = useExpenseStore((s) => s.isInitialized);

  useEffect(() => {
    async function init() {
      try {
        runMigrations();
        initialize();
        setDbReady(true);
      } catch (error) {
        console.error('Init failed:', error);
        setDbReady(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (dbReady) {
      SplashScreen.hideAsync();
    }
  }, [dbReady]);

  if (!dbReady) {
    return (
      <View style={splashStyles.container}>
        <Text style={splashStyles.title}>Finance Tracker</Text>
        <ActivityIndicator size="small" color="#0891B2" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0891B2',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0' },
          headerStyle: { backgroundColor: '#F0F4F8' },
          headerTintColor: '#0F172A',
          headerTitleStyle: { fontWeight: '600', fontSize: 18 },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="(expenses)"
          options={{
            title: 'Expenses',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(investments)"
          options={{
            title: 'Investments',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-up-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
});
