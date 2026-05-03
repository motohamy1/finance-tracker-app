import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { OCRResult, TradeDirection } from '@/types';

// Track cancellation state
let cancelled = false;

/** Cancel any in-progress OCR operation */
export function cancelOCR(): void {
  cancelled = true;
}

/**
 * Helper to ensure the URI is a clean local file path without URL encoding issues.
 * Expo Go on Android can have issues with % characters in the cache directory path.
 */
async function standardizeImageUri(uri: string): Promise<string> {
  try {
    // If it's already a clean URI without % encoding, it might just work,
    // but copying it ensures we have a safe file to manipulate.
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanUri = `${FileSystem.cacheDirectory}ocr-safe-${Date.now()}.${ext}`;
    
    try {
      await FileSystem.copyAsync({ from: uri, to: cleanUri });
      return cleanUri;
    } catch (err1) {
      try {
        await FileSystem.copyAsync({ from: decodeURIComponent(uri), to: cleanUri });
        return cleanUri;
      } catch (err2) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        await FileSystem.writeAsStringAsync(cleanUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return cleanUri;
      }
    }
  } catch (err) {
    console.warn('Failed to standardize image URI:', err);
    return uri; // fallback to original
  }
}

/**
 * Process a screenshot image through the OCR pipeline.
 * Steps: validate file → downscale → run ML Kit → parse text → return OCRResult.
 *
 * @param imageUri - Local file URI of the screenshot
 * @returns Structured OCR result with extracted fields and confidence
 * @throws If image format is unsupported or OCR fails entirely
 */
export async function processScreenshot(imageUri: string): Promise<OCRResult> {
  cancelled = false;

  // ─── Step 1: Standardize and Validate image ───
  let safeUri = await standardizeImageUri(imageUri);
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(safeUri);
    if (!fileInfo.exists) {
      // If safeUri claims to not exist, check original
      const origInfo = await FileSystem.getInfoAsync(imageUri);
      if (!origInfo.exists) {
        throw new Error('Image file not found');
      }
      safeUri = imageUri;
    } else if (fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
      console.warn('Large image may be slow to process');
    }
  } catch (err) {
    // If getInfoAsync throws due to encoding bugs, proceed to manipulation anyway
    console.warn('getInfoAsync failed, proceeding anyway', err);
  }

  // ─── Step 2: Downscale image (D-09: max 1200px longest edge) ───
  const MAX_EDGE = 1200;
  let downscaled;
  try {
    downscaled = await ImageManipulator.manipulateAsync(
      safeUri,
      [{ resize: { width: MAX_EDGE } }], // aspect ratio preserved
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );
  } catch (error) {
    throw new Error(`Could not load the image: ${safeUri}\n\nTried URIs:\n1. ${imageUri}\n2. ${safeUri}\n\nLast error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (cancelled) {
    throw new Error('OCR cancelled by user');
  }

  // ─── Step 3: Run ML Kit text recognition ───
  let rawText: string;
  try {
    const result = await TextRecognition.recognize(downscaled.uri);
    rawText = result.text || '';

    // Also collect block-level text for better structure
    if (result.blocks) {
      for (const block of result.blocks) {
        if (block.text) rawText += '\n' + block.text;
      }
    }
  } catch (error) {
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (cancelled) {
    throw new Error('OCR cancelled by user');
  }

  // ─── Step 4: Parse extracted text into structured fields ───
  const parsed = parseTradeFromText(rawText);

  // ─── Step 5: Clean up downscaled temp file ───
  if (downscaled.uri !== imageUri) {
    FileSystem.deleteAsync(downscaled.uri, { idempotent: true }).catch(() => {});
  }

  return parsed;
}

/**
 * Parse raw OCR text to extract trade fields.
 * Uses regex patterns to find ticker, shares, price, date, and direction.
 * Per D-14: generic extraction only — no platform-specific templates in Phase 2.
 *
 * @param rawText - Full raw text output from ML Kit
 * @returns OCRResult with extracted fields and confidence score
 */
export function parseTradeFromText(rawText: string): OCRResult {
  const text = rawText || '';

  // ─── Ticker extraction (D-17: uppercase, strip artifacts) ───
  // First, clean common OCR noise characters from the text
  const cleanedText = text.replace(/[$%^&*#@!~`]+/g, ' ');
  // Pattern: 1-5 uppercase letters, possibly preceded by white space or start of string
  const tickerPattern = /(?:\s|^)([A-Z]{1,5})(?:\s|$|,|\.|\s|%)/g;
  const tickerMatches = [...cleanedText.matchAll(tickerPattern)];
  let ticker: string | null = null;
  for (const match of tickerMatches) {
    const candidate = match[1];
    // Filter out common OCR noise words that happen to be uppercase
    const noise = ['BUY', 'SELL', 'LMT', 'MKT', 'STP', 'GTC', 'DAY', 'IOC', 'TOTAL', 'PRICE', 'QTY', 'AMT', 'USD', 'THE', 'FOR'];
    if (!noise.includes(candidate)) {
      ticker = candidate;
      break;
    }
  }

  // ─── Direction detection (D-16) ───
  let direction: TradeDirection | null = null;
  const buyPattern = /\b(buy|bought|purchased|buying)\b/i;
  const sellPattern = /\b(sell|sold|selling)\b/i;
  if (buyPattern.test(text) && !sellPattern.test(text)) {
    direction = 'buy';
  } else if (sellPattern.test(text) && !buyPattern.test(text)) {
    direction = 'sell';
  }
  // If both or neither found, leave null (user can set in review)

  // ─── Shares extraction ───
  let shares: number | null = null;
  // Patterns: "10 shares", "Qty: 10", "10 sh", "Shares: 10"
  const keywordSharesPattern = /(\d+(?:\.\d+)?)\s*(?:shares?|sh|qty|quantity)/i;
  const keywordSharesMatch = text.match(keywordSharesPattern);
  if (keywordSharesMatch) {
    shares = parseInt(keywordSharesMatch[1], 10) || null;
  }
  // Fallback: "Bought 10 AAPL" / "Sold 5 TSLA" — number before ticker
  if (shares === null && ticker) {
    const tickerEscaped = ticker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const numBeforeTickerPattern = new RegExp(
      `(\\d+(?:\\.\\d+)?)\\s+${tickerEscaped}\\b`, 'i'
    );
    const numMatch = text.match(numBeforeTickerPattern);
    if (numMatch) {
      shares = parseInt(numMatch[1], 10) || null;
    }
  }

  // ─── Price extraction ───
  let pricePerShare: number | null = null;
  // Pattern: "$185.50" or "185.50" near "price" or "per share"
  const priceContextPattern = /(?:price|per\s*share|@|at)\s*\$?(\d+(?:\.\d{1,2})?)/i;
  const priceMatch = text.match(priceContextPattern);
  if (priceMatch) {
    pricePerShare = parseFloat(priceMatch[1]) || null;
  } else {
    // Fallback: find any dollar amount
    const dollarPattern = /\$(\d+(?:\.\d{1,2})?)/g;
    const dollarMatches = [...text.matchAll(dollarPattern)];
    if (dollarMatches.length >= 1) {
      const values = dollarMatches.map(m => parseFloat(m[1]));
      // Take the middle value as price (not the total, not zero)
      values.sort((a, b) => a - b);
      pricePerShare = values[Math.floor(values.length / 2)] || null;
    }
  }

  // ─── Date extraction (D-18: detect date, fall back to today) ───
  let tradeDate: string | null = null;
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,     // MM/DD/YYYY or M/D/YY
    /(\d{4}-\d{2}-\d{2})/,              // YYYY-MM-DD
    /([A-Z][a-z]{2}\s+\d{1,2},?\s*\d{4})/, // Apr 28, 2026 or Apr 28 2026
    /(\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4})/,   // 28 Apr 2026
    /([A-Z][a-z]{2}\s+\d{1,2})/,           // Apr 28 (no year — assume current year)
    /(\d{1,2}\s+[A-Z][a-z]{2})/,           // 28 Apr (no year — assume current year)
  ];
  const currentYear = new Date().getFullYear();
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let dateStr = match[1];
      // If no year in the matched date, append current year
      if (!/\d{4}/.test(dateStr)) {
        dateStr = `${dateStr} ${currentYear}`;
      }
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        tradeDate = parsed.toISOString().split('T')[0];
        break;
      }
    }
  }
  // Fall back to today per D-18
  if (!tradeDate) {
    tradeDate = new Date().toISOString().split('T')[0];
  }

  // ─── Confidence calculation ───
  let fieldsFound = 0;
  const totalFields = 4; // ticker, shares, price, direction
  if (ticker) fieldsFound++;
  if (shares) fieldsFound++;
  if (pricePerShare) fieldsFound++;
  if (direction) fieldsFound++;
  const confidence = fieldsFound / totalFields;

  return {
    ticker,
    shares,
    pricePerShare,
    tradeDate,
    direction,
    rawText: text,
    confidence,
  };
}
