import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { runMigrations } from '@/db/schema';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSettingsStore } from '@/stores/settingsStore';
import SyncIndicator from '@/components/SyncIndicator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// FUTURE: Import RestoreBanner in src/app/(expenses)/index.tsx
// and render <RestoreBanner /> at the top of the expenses list.
// This banner shows "Existing data found in Drive — Restore?" on fresh install.

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

  const insets = useSafeAreaInsets();

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
          tabBarShowLabel: false,
          tabBarStyle: { 
            position: 'absolute',
            bottom: Math.max(insets.bottom, 16),
            left: 20,
            right: 20,
            height: 60,
            borderRadius: 30,
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.75)',
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            paddingTop: 0,
            paddingBottom: 0,
          },
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: 0,
            marginBottom: 0,
            height: 60,
          },
          tabBarBackground: () => (
            <View style={{ 
              flex: 1, 
              borderRadius: 30, 
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}>
              {Platform.OS === 'ios' && (
                <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="ultraLight" />
              )}
              {/* Liquid glass light reflection */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
              }} />
            </View>
          ),
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTintColor: '#0F172A',
          headerTitleStyle: { fontWeight: '700', fontSize: 20 },
          headerShown: false,
        }}
        screenListeners={{
          state: () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        }}
      >
        <Tabs.Screen
          name="(expenses)"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.activeIconContainer]}>
                <Ionicons 
                  name={focused ? "wallet" : "wallet-outline"} 
                  size={28} 
                  color={color} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="(investments)"
          options={{
            title: 'Growth',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.activeIconContainer]}>
                <Ionicons 
                  name={focused ? "trending-up" : "trending-up-outline"} 
                  size={28} 
                  color={color} 
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: true,
            headerRight: () => <SyncIndicator />,
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.activeIconContainer]}>
                <Ionicons 
                  name={focused ? "settings" : "settings-outline"} 
                  size={28} 
                  color={color} 
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(8, 145, 178, 0.15)',
    shadowColor: '#0891B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});

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
