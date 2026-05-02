import { View, FlatList, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTradeStore } from '@/stores/tradeStore';
import { TradeCard } from '@/components/TradeCard';
import { PortfolioHeader } from '@/components/PortfolioHeader';
import { EmptyState } from '@/components/EmptyState';
import type { Trade } from '@/types';

export default function InvestmentsScreen() {
  const router = useRouter();
  const trades = useTradeStore((s) => s.trades);
  const isLoading = useTradeStore((s) => s.isLoading);
  const isInitialized = useTradeStore((s) => s.isInitialized);
  const initialize = useTradeStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  const handleGalleryImport = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library to import screenshots.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      base64: true,
    });
    
    if (!result.canceled && result.assets[0]) {
      let finalUri = result.assets[0].uri;
      
      // If we got base64, save it to a clean path to avoid Expo Android double-encoding path bugs
      if (result.assets[0].base64) {
        try {
          const ext = finalUri.split('.').pop()?.toLowerCase() || 'jpg';
          const cleanUri = `${FileSystem.cacheDirectory}ocr-safe-${Date.now()}.${ext}`;
          await FileSystem.writeAsStringAsync(cleanUri, result.assets[0].base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          finalUri = cleanUri;
        } catch (err) {
          console.warn('Failed to save clean copy, using original URI', err);
        }
      }
      
      router.push({
        pathname: '/(investments)/import',
        params: { sharedImageUri: finalUri },
      });
    }
  };

  const handleManualEntry = () => {
    router.push('/(investments)/manual');
  };

  const handleFabPress = () => {
    Alert.alert('New Trade', undefined, [
      { text: 'Import from Gallery', onPress: handleGalleryImport },
      { text: 'Enter Manually', onPress: handleManualEntry },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleTradePress = (trade: Trade) => {
    router.push({ pathname: '/(investments)/review', params: { tradeId: trade.id } });
  };

  if (!isInitialized || isLoading) return null;

  if (trades.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="trending-up-outline"
          title="No Trades Yet"
          body="Import your first trading screenshot and we'll extract the trade data automatically."
        >
          <View style={styles.previewCard}>
            <Ionicons name="image-outline" size={40} color="#CBD5E1" />
            <View style={styles.previewDetails}>
              <Text style={styles.previewTicker}>AAPL</Text>
              <Text style={styles.previewMeta}>10 shares · $185.50</Text>
              <Text style={styles.previewMeta}>Buy · Apr 28, 2026</Text>
            </View>
          </View>
        </EmptyState>

        <View style={styles.emptyActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGalleryImport} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Import Screenshot</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleManualEntry} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={20} color="#0891B2" />
            <Text style={styles.secondaryButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trades}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<PortfolioHeader />}
        renderItem={({ item }) => (
          <TradeCard trade={item} onPress={() => handleTradePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  listContent: { padding: 16, paddingBottom: 80 },
  emptyActions: {
    alignItems: 'center', gap: 12, paddingHorizontal: 32,
    paddingBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0891B2', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, width: '100%', justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
    width: '100%', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#0891B2',
  },
  secondaryButtonText: { color: '#0891B2', fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0891B2',
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6,
  },
  previewCard: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    opacity: 0.6, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  previewDetails: { flex: 1, gap: 2 },
  previewTicker: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  previewMeta: { fontSize: 13, color: '#94A3B8' },
});
