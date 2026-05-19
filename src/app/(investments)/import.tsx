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
      let uri = result.assets[0].uri;

      // Copy to a safe cache directory to avoid Expo Go Android path encoding bugs
      try {
        const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const cleanUri = `${FileSystem.cacheDirectory}ocr-import-${Date.now()}.${ext}`;
        await FileSystem.copyAsync({ from: uri, to: cleanUri });
        uri = cleanUri;
      } catch (_err) {
        console.warn('Failed to copy to cache, using original URI:', _err);
      }

      // Check file size and warn if > 20MB (D-30)
      try {
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
      } catch (_sizeErr) {
        // Size check failed — proceed anyway, OCR will handle errors
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

      // Success — show confirmation and let user tap to continue
      setStage('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR processing failed';
      setErrorMessage(message);
      setStage('error');
    }
  }, []);

  // Navigate to review screen
  const navigateToReview = useCallback(() => {
    if (!ocrResult) return;
    router.push({
      pathname: '/(investments)/review',
      params: {
        ocrResult: JSON.stringify(ocrResult),
        imageUri: imageUri ?? '',
      },
    });
  }, [router, ocrResult, imageUri]);

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

  // ─── Success state: confirmation with manual Continue button ───
  if (stage === 'success' && imageUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />
        <View style={styles.overlay}>
          <View style={styles.progressCard}>
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
            <Text style={styles.successTitle}>Data Extracted</Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={navigateToReview}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  backButton: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 0, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0A0A0F',
  },
  fullImage: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#1A1A24', borderRadius: 0, padding: 32,
    alignItems: 'center', gap: 12, marginHorizontal: 32,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  progressTitle: { fontSize: 18, fontWeight: '700', color: '#F0F0F5', letterSpacing: 0.3 },
  progressSubtitle: { fontSize: 14, color: '#6B6B78', fontWeight: '600' },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#39FF14', marginTop: 8, letterSpacing: 0.3 },
  continueButton: {
    marginTop: 16,
    backgroundColor: '#00E5FF',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  continueButtonText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  cancelButton: {
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 0,
  },
  cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  idleContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, backgroundColor: '#0A0A0F',
  },
  idleTitle: { fontSize: 24, fontWeight: '700', color: '#F0F0F5', marginTop: 16, letterSpacing: 0.5 },
  idleBody: { fontSize: 14, color: '#6B6B78', textAlign: 'center', marginTop: 8, lineHeight: 21, fontWeight: '600' },
  galleryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#00E5FF', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 0, marginTop: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  galleryButtonText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  errorTitle: { fontSize: 20, fontWeight: '700', color: '#F0F0F5', marginTop: 16, letterSpacing: 0.3 },
  errorBody: { fontSize: 14, color: '#6B6B78', textAlign: 'center', marginTop: 8, marginBottom: 16, fontWeight: '600' },
  errorPreview: {
    width: '100%', height: 200, borderRadius: 0,
    marginBottom: 16, backgroundColor: '#1A1A24',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  retryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#00E5FF', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  retryButtonText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  manualButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 0,
    marginTop: 12, borderWidth: 2, borderColor: '#00E5FF',
  },
  manualButtonText: { color: '#00E5FF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
