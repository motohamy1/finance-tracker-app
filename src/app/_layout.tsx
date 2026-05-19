import SyncIndicator from '@/components/SyncIndicator';
import { runMigrations } from '@/db/schema';
import { useExpenseStore } from '@/stores/expenseStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ThemeContext, darkTheme } from '@/services/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, Platform, StyleSheet, Text, View, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Neo-Brutalist tab bar constants
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BORDER_WIDTH = 3;
const TAB_BAR_RADIUS = 0; // sharp edges; brutalist

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const initialize = useExpenseStore((s) => s.initialize);

  useEffect(() => {
    async function init() {
      try {
        runMigrations();
        initialize();
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

  // Cloud sync lifecycle triggers
  useEffect(() => {
    let appStartSyncTimer: NodeJS.Timeout | null = null;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const { isSyncEnabled, isAuthenticated, isSyncing } = useSettingsStore.getState();
      if (!isSyncEnabled || !isAuthenticated || isSyncing) return;

      if (nextAppState === 'background') {
        setImmediate(() => {
          useSettingsStore.getState().syncNow();
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (dbReady) {
      const { isSyncEnabled, isAuthenticated, isSyncing } = useSettingsStore.getState();
      if (isSyncEnabled && isAuthenticated && !isSyncing) {
        appStartSyncTimer = setTimeout(() => {
          useSettingsStore.getState().syncNow();
        }, 2000);
      }
    }

    return () => {
      subscription.remove();
      if (appStartSyncTimer) clearTimeout(appStartSyncTimer);
    };
  }, [dbReady]);

  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const isOverlayInputVisible = useSettingsStore((s) => s.isOverlayInputVisible);
  const hideTabBar = segments.some(s => s === 'manual' || s === 'review' || s === 'import') || isOverlayInputVisible;

  const colors = darkTheme;

  const themeContext = useMemo(() => ({
    mode: 'dark' as const,
    colors,
  }), [colors]);

  if (!dbReady) {
    return (
      <View style={[splashStyles.container, { backgroundColor: colors.bg }]}>
        <Text style={[splashStyles.title, { color: colors.text }]}>FINANCE TRACKER</Text>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={themeContext}>
      <StatusBar barStyle="light-content" />
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarShowLabel: false,
            tabBarStyle: {
              display: hideTabBar ? 'none' : 'flex',
              position: 'absolute',
              bottom: Math.max(insets.bottom, 0),
              left: 0,
              right: 0,
              height: TAB_BAR_HEIGHT,
              backgroundColor: colors.tabBarBg,
              borderTopWidth: TAB_BAR_BORDER_WIDTH,
              borderTopColor: colors.tabBarBorder,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              shadowRadius: 0,
              shadowOffset: { width: 0, height: 0 },
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
              flex: 1,
            },
            tabBarIconStyle: {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            },
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerTint,
            headerTitleStyle: { fontWeight: '700', fontSize: 20 },
            headerShown: false,
          }}
          screenListeners={{
            tabPress: () => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }
            },
          }}
        >
          <Tabs.Screen
            name="(expenses)"
            options={{
              title: 'Wallet',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
                  <Ionicons
                    name={focused ? "wallet" : "wallet-outline"}
                    size={26}
                    color={focused ? colors.primary : color}
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
                <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
                  <Ionicons
                    name={focused ? "trending-up" : "trending-up-outline"}
                    size={26}
                    color={focused ? colors.primary : color}
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
                <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
                  <Ionicons
                    name={focused ? "settings" : "settings-outline"}
                    size={26}
                    color={focused ? colors.primary : color}
                  />
                </View>
              ),
            }}
          />
        </Tabs>
      </GestureHandlerRootView>
    </ThemeContext.Provider>
  );
}

// ─── Neo-Brutalist Styles ───
const styles = StyleSheet.create({
  iconWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0, // sharp corners
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeIconWrapper: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
  },
});

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F0F0F5',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
