import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { runMigrations } from '@/db/schema';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
        // Initialize sync store (check auth state, restore availability) — non-blocking
        const settingsStore = useSettingsStore.getState();
        settingsStore.initialize();
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

  // Cloud sync lifecycle triggers (D-04: app start, backgrounding)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const { isSyncEnabled, isAuthenticated, isSyncing } = useSettingsStore.getState();

      // Triple gate: sync must be enabled, user must be authenticated, no sync in progress
      if (!isSyncEnabled || !isAuthenticated || isSyncing) return;

      if (nextAppState === 'background') {
        // Trigger sync when app goes to background (D-04)
        useSettingsStore.getState().syncNow();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Trigger sync on app start if sync is enabled and user is authenticated
    const { isSyncEnabled, isAuthenticated } = useSettingsStore.getState();
    if (isSyncEnabled && isAuthenticated) {
      // Delay 2 seconds to avoid competing with splash screen and initial data load
      const timer = setTimeout(() => {
        useSettingsStore.getState().syncNow();
      }, 2000);

      return () => {
        subscription.remove();
        clearTimeout(timer);
      };
    }

    return () => {
      subscription.remove();
    };
  }, []);

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
