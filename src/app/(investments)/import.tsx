import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert,
  ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { processScreenshot, cancelOCR } from '@/services/ocr';
import type { OCRResult } from '@/types';

type ImportStage = 'idle' | 'processing' | 'success' | 'error';

export default function ImportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sharedImageUri?: string }>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [stage, setStage] = useState<ImportStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  // ─── Handle incoming share sheet image (D-03: modal overlay) ───
  useEffect(() => {
    if (params.sharedImageUri) {
      setImageUri(params.sharedImageUri);
      startOCR(params.sharedImageUri);
    }
  }, [params.sharedImageUri]);

  // ─── Gallery picker (D-02, D-09) ───
  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library to import screenshots.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;

      // Check file size and warn if > 20MB (D-30)
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Large Image',
            'This image is over 20MB and may be slow to process. Continue?',
            [
              { text: 'Pick Different', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Proceed', onPress: () => resolve(true) },
            ]
          );
        });
        if (!proceed) return;
      }

      setImageUri(uri);
      startOCR(uri);
    }
  }, []);

  // ─── OCR Processing ───
  const startOCR = useCallback(async (uri: string) => {
    setStage('processing');
    setErrorMessage('');

    try {
      const result = await processScreenshot(uri);
      setOcrResult(result);

      // Brief success confirmation (D-13: ~1 second)
      setStage('success');
      setTimeout(() => {
        router.push({
          pathname: '/(investments)/review',
          params: {
            ocrResult: JSON.stringify(result),
            imageUri: uri,
          },
        });
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR processing failed';
      setErrorMessage(message);
      setStage('error');
    }
  }, [router]);

  // ─── Cancel OCR (D-12) ───
  const handleCancel = useCallback(() => {
    cancelOCR();
    setStage('idle');
    setImageUri(null);
  }, []);

  // ─── Handle complete OCR failure (D-25) ───
  const handleManualEntry = useCallback(() => {
    router.push({
      pathname: '/(investments)/manual',
      params: imageUri ? { imageUri } : {},
    });
  }, [router, imageUri]);

  // ─── Try again ───
  const handleRetry = useCallback(() => {
    if (imageUri) {
      startOCR(imageUri);
    }
  }, [imageUri, startOCR]);

  // ─── Idle state: show gallery picker prompt ───
  if (stage === 'idle' && !imageUri) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.idleContent}>
          <Ionicons name="image-outline" size={80} color="#CBD5E1" />
          <Text style={styles.idleTitle}>Import Trade</Text>
          <Text style={styles.idleBody}>
            Select a screenshot from a trading app and we'll extract the trade data automatically.
          </Text>
          <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={22} color="#FFFFFF" />
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Processing state (D-11: overlay + progress) ───
  if (stage === 'processing' && imageUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />
        <View style={styles.overlay}>
          <View style={styles.progressCard}>
            <ActivityIndicator size="large" color="#0891B2" />
            <Text style={styles.progressTitle}>Extracting trade data...</Text>
            <Text style={styles.progressSubtitle}>This may take a few seconds</Text>
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Success state (D-13: brief confirmation before auto-advance) ───
  if (stage === 'success' && imageUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />
        <View style={styles.overlay}>
          <View style={styles.progressCard}>
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
            <Text style={styles.successTitle}>Data Extracted ✓</Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── Error state (D-25: complete failure) ───
  if (stage === 'error') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.idleContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Couldn't Extract Data</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.errorPreview} resizeMode="contain" />
          )}
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          {/* D-25: "Enter Manually" button in error state */}
          <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={20} color="#0891B2" />
            <Text style={styles.manualButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  backButton: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  fullImage: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center', alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 12, marginHorizontal: 32,
  },
  progressTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
  progressSubtitle: { fontSize: 14, color: '#64748B' },
  successTitle: { fontSize: 18, fontWeight: '600', color: '#059669', marginTop: 8 },
  cancelButton: {
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 12,
  },
  cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },

  idleContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, backgroundColor: '#F0F4F8',
  },
  idleTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginTop: 16 },
  idleBody: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 21 },
  galleryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0891B2', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, marginTop: 24,
  },
  galleryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  errorTitle: { fontSize: 20, fontWeight: '600', color: '#0F172A', marginTop: 16 },
  errorBody: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8, marginBottom: 16 },
  errorPreview: {
    width: '100%', height: 200, borderRadius: 12,
    marginBottom: 16, backgroundColor: '#1E293B',
  },
  retryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0891B2', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  manualButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
    marginTop: 12, borderWidth: 1, borderColor: '#0891B2',
  },
  manualButtonText: { color: '#0891B2', fontSize: 16, fontWeight: '600' },
});
