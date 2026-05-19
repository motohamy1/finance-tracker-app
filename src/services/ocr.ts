import type { OCRResult, TradeDirection } from "@/types";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

// Per-operation cancellation controller
let activeController: { cancelled: boolean } | null = null;

/** Cancel any in-progress OCR operation */
export function cancelOCR(): void {
  if (activeController) {
    activeController.cancelled = true;
  }
}

/**
 * Helper to ensure the URI is a clean local file path without URL encoding issues.
 * Expo Go on Android can have issues with % characters in the cache directory path.
 */
async function standardizeImageUri(uri: string): Promise<string> {
  try {
    // If it's already a clean URI without % encoding, it might just work,
    // but copying it ensures we have a safe file to manipulate.
    const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
    const cleanUri = `${FileSystem.cacheDirectory}ocr-safe-${Date.now()}.${ext}`;

    try {
      await FileSystem.copyAsync({ from: uri, to: cleanUri });
      return cleanUri;
    } catch (err1) {
      try {
        await FileSystem.copyAsync({
          from: decodeURIComponent(uri),
          to: cleanUri,
        });
        return cleanUri;
      } catch (err2) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve((reader.result as string).split(",")[1]);
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
    console.warn("Failed to standardize image URI:", err);
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
  const controller = { cancelled: false };
  activeController = controller;

  // Temp files to clean up on any exit path
  let safeUri: string | null = null;
  let downscaled: { uri: string } | null = null;

  try {
    // ─── Step 1: Standardize and Validate image ───
    safeUri = await standardizeImageUri(imageUri);

    try {
      const fileInfo = await FileSystem.getInfoAsync(safeUri);
      if (!fileInfo.exists) {
        // If safeUri claims to not exist, check original
        const origInfo = await FileSystem.getInfoAsync(imageUri);
        if (!origInfo.exists) {
          throw new Error("Image file not found");
        }
        safeUri = imageUri;
      } else if (fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
        console.warn("Large image may be slow to process");
      }
    } catch (err) {
      // If getInfoAsync throws due to encoding bugs, proceed to manipulation anyway
      console.warn("getInfoAsync failed, proceeding anyway", err);
    }

    // ─── Step 2: Downscale image (D-09: max 1200px longest edge) ───
    const MAX_EDGE = 1200;
    try {
      downscaled = await ImageManipulator.manipulateAsync(
        safeUri,
        [{ resize: { width: MAX_EDGE } }], // aspect ratio preserved
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
    } catch (error) {
      throw new Error(
        `Could not load the image: ${safeUri}\n\nTried URIs:\n1. ${imageUri}\n2. ${safeUri}\n\nLast error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    if (controller.cancelled) {
      throw new Error("OCR cancelled by user");
    }

    // ─── Step 3: Run ML Kit text recognition ───
    let rawText: string;
    try {
      const result = await TextRecognition.recognize(downscaled.uri);
      rawText = result.text || "";

      // Also collect block-level text for better structure
      if (result.blocks) {
        for (const block of result.blocks) {
          if (block.text) rawText += "\n" + block.text;
        }
      }
    } catch (error) {
      throw new Error(
        `OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    if (controller.cancelled) {
      throw new Error("OCR cancelled by user");
    }

    // ─── Step 4: Parse extracted text into structured fields ───
    const parsed = parseTradeFromText(rawText);

    return parsed;
  } finally {
    // ─── Cleanup: delete all temp files on any exit path ───
    if (downscaled?.uri && downscaled.uri !== imageUri) {
      FileSystem.deleteAsync(downscaled.uri, { idempotent: true }).catch(() => {});
    }
    if (safeUri && safeUri !== imageUri) {
      FileSystem.deleteAsync(safeUri, { idempotent: true }).catch(() => {});
    }
    activeController = null;
  }
}

/**
 * Parse raw OCR text to extract trade fields.
 * Uses regex patterns to find ticker, shares, price, date, and direction.
 * Per D-14: generic extraction only — no platform-specific templates in Phase 2.
 *
 * @param rawText - Full raw text output from ML Kit
 * @returns OCRResult with extracted fields and confidence score
 */
import { detectPlatform } from "@/services/platformDetector";

function normalizeArabicDigits(input: string): string {
  const map: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return input.replace(/[٠-٩]/g, (d) => map[d] ?? d);
}

function normalizePriceNumber(input: string): string {
  // Arabic digits -> western digits, keep first decimal separator
  const norm = normalizeArabicDigits(input).trim();
  // convert comma decimal to dot
  return norm.replace(/,/g, ".");
}

export function parseTradeFromText(rawText: string): OCRResult {
  const originalText = rawText || "";
  const text = normalizeArabicDigits(originalText);

  // ─── Platform detection (for aiMeta) ───
  const platformDetection = detectPlatform(originalText);
  const platform = platformDetection.platform;
  const platformConfidence = platformDetection.confidence;

  // ─── Ticker extraction ───
  // Heuristic: ticker often appears in top header as a standalone 1-5 uppercase token.
  // On Thndr: first line is ticker, second line is Arabic company name.
  // On Robinhood/Webull: ticker appears near top in header area.
  const noise: Set<string> = new Set([
    "BUY", "SELL", "LMT", "MKT", "STP", "GTC", "DAY", "IOC",
    "TOTAL", "PRICE", "QTY", "AMT", "USD", "EGP", "THE", "FOR",
    "AND", "NOT", "ALL", "NEW", "FEE", "NET", "TAX", "VIA", "EST",
    "NYSE", "NASDAQ", "STOCK", "TRADE", "ORDER", "LIMIT", "STOP",
    "FILL", "OPEN", "HIGH", "LOW", "VOL", "AVG", "COST", "FEES",
    "COMM", "SEC", "TXN", "TXNS", "MARKET", "VALUE", "SHARES",
    "THNDR", "ROBINHOOD", "WEBULL", "ETORO", "EGX", "CASH",
    "POWER", "MARGIN", "BROKER", "EXECUTED", "PENDING", "CANCEL",
    "AM", "PM", "PAGE", "CARD", "MENU", "HOME", "BACK", "EDIT",
    "DONE", "SAVE", "HELP", "INFO", "MORE", "LESS", "NEXT", "PREV",
    "SOLD", "BOUGHT", "PURCHASED", "SELLING", "BUYING", "FILLED",
  ]);

  const cleanedText = text.replace(/[$%^&*#@!~`'"\-_=+\[\]{}|:;<>]+/g, " ");
  const upperText = cleanedText.toUpperCase();

  let ticker: string | null = null;

  // Strategy 1: Look for standalone 1-5 uppercase token on its own line in top section.
  // This catches tickers that appear as headers (Thndr, Robinhood headers).
  const allLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const topLines = allLines.slice(0, 12);

  // First pass: look for lines that are ALMOST entirely a single uppercase token
  // (possibly with small surrounding chars like spaces, colons, etc.)
  for (const line of topLines) {
    const cleaned = line.replace(/[^A-Za-z0-9\s]/g, " ").trim();
    const words = cleaned.split(/\s+/);
    // If the line is mostly one uppercase word, it's likely a ticker header
    for (const word of words) {
      if (/^[A-Z]{1,5}$/.test(word) && !noise.has(word)) {
        ticker = word;
        break;
      }
    }
    if (ticker) break;
  }

  // Strategy 2: Scan within first lines for any non-noise ticker candidate
  if (!ticker) {
    const tickerPattern = /(?:\s|^)([A-Z]{1,5})(?:\s|$|,|\.|%|\b)/g;
    for (const line of topLines) {
      const lineUpper = line.toUpperCase();
      const m = [...lineUpper.matchAll(tickerPattern)];
      for (const mm of m) {
        const cand = mm[1];
        if (!noise.has(cand)) {
          ticker = cand;
          break;
        }
      }
      if (ticker) break;
    }
  }

  // Strategy 3: Full text scan fallback
  if (!ticker) {
    const tickerPattern = /(?:\s|^)([A-Z]{1,5})(?:\s|$|,|\.|%|\b)/g;
    const tickerCandidates = [...upperText.matchAll(tickerPattern)].map((m) => m[1]);
    for (const cand of tickerCandidates) {
      if (!noise.has(cand)) {
        ticker = cand;
        break;
      }
    }
  }

  // Strategy 4: Keyword-adjacent ticker (e.g., "shares of AAPL", "symbol: AAPL")
  if (!ticker) {
    const tickerNearKeyword =
      /(?:shares?\s*of\s*|symbol\s*:?\s*|order\s*(?:for|to)\s*(?:buy|sell)\s*)([A-Z]{1,5})\b/i;
    const nearMatch = originalText.match(tickerNearKeyword);
    if (nearMatch) ticker = nearMatch[1].toUpperCase();
  }

  // ─── Direction detection ───
  let direction: TradeDirection | null = null;

  // English keywords
  const buyPattern = /\b(buy|bought|purchased|buying|open\s+trade)\b/i;
  const sellPattern = /\b(sell|sold|selling|close\s+trade)\b/i;

  // Arabic (Thndr)
  const arabicSellPattern = /طلب\s*بيع|نوع\s*الطلب\s*طلب\s*بيع/i;
  const arabicBuyPattern = /طلب\s*شراء|نوع\s*الطلب\s*طلب\s*شراء/i;

  const isBuy =
    arabicBuyPattern.test(text) || buyPattern.test(text);
  const isSell =
    arabicSellPattern.test(text) || sellPattern.test(text);

  if (isBuy && !isSell) {
    direction = "buy";
  } else if (isSell && !isBuy) {
    direction = "sell";
  }

  // ─── Shares extraction ───
  let shares: number | null = null;

  // English patterns (including fractional shares)
  const sharesPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:shares?|sh\b|qty|quantity|units?)/i,
    /(?:shares?|qty|quantity|units?)\s*:?\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const pat of sharesPatterns) {
    const m = text.match(pat);
    if (m) {
      shares = parseInt(m[1], 10) || parseFloat(m[1]) || null;
      break;
    }
  }

  // Arabic patterns
  if (shares === null) {
    const arabicPatterns = [
      /وحدات\s+(\d+)/i,
      /(?:عدد|كمية)\s*(?:الأسهم|الوحدات)?\s*:?\s*(\d+)/i,
      /(\d+)\s*(?:سهم|أسهم|وحدة|وحدات)/i,
    ];
    for (const pat of arabicPatterns) {
      const m = text.match(pat);
      if (m) {
        shares = parseInt(m[1], 10) || null;
        break;
      }
    }
  }

  // Fallback: standalone number on a line near "وحدات" or "shares"
  if (shares === null) {
    for (let i = 0; i < allLines.length; i++) {
      if (/وحدات|shares?|qty/i.test(allLines[i])) {
        // Check current line and next line for a standalone number
        for (let j = i; j < Math.min(i + 2, allLines.length); j++) {
          const numMatch = allLines[j].match(/^(\d+(?:\.\d+)?)\s*$/);
          if (numMatch) {
            shares = parseInt(numMatch[1], 10) || null;
            break;
          }
          const numInLine = allLines[j].match(/\b(\d+)\b/);
          if (numInLine && parseInt(numInLine[1], 10) > 0 && parseInt(numInLine[1], 10) < 1000000) {
            shares = parseInt(numInLine[1], 10) || null;
            break;
          }
        }
        if (shares !== null) break;
      }
    }
  }

  // Fallback: number before ticker
  if (shares === null && ticker) {
    const tickerEscaped = ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const numBeforeTickerPattern = new RegExp(
      `(\\d+(?:\\.\\d+)?)\\s+${tickerEscaped}\\b`,
      "i",
    );
    const numMatch = text.match(numBeforeTickerPattern);
    if (numMatch) shares = parseInt(numMatch[1], 10) || null;
  }

  // ─── Price extraction ───
  let pricePerShare: number | null = null;

  // Pattern set ordered by reliability (strongest signals first)
  const pricePatterns: RegExp[] = [
    // Arabic: "@ 4.40 ج.م" or "@ 197.70 ج.م" (Thndr — very reliable)
    /@\s*([0-9]+(?:[.,][0-9]{1,4})?)\s*ج\.?م/i,
    // Arabic: "سعر محدد @ 197 ج.م" or "سعر محدد 197 ج.م"
    /سعر\s*محدد\s*@?\s*([0-9]+(?:[.,][0-9]{1,4})?)\s*ج\.?م/i,
    // Arabic: any number followed by ج.م on a line with تفاصيل or سعر
    /(?:تفاصيل|سعر).*?([0-9]+(?:[.,][0-9]{1,4})?)\s*ج\.?م/i,
    // English: "price per share: $N" or "price: $N"
    /(?:price\s*(?:per\s*share)?)\s*:?\s*\$?([0-9]+(?:[.,][0-9]{1,4})?)/i,
    // English: "@ $N" or "@ N" (most common in trade confirmations)
    /@\s*\$?([0-9]+(?:[.,][0-9]{1,4})?)/i,
    // English: "at $N"
    /\bat\s*\$?([0-9]+(?:[.,][0-9]{1,4})?)/i,
    // English: "avg price: $N" or "avg fill: $N" or "filled at $N"
    /(?:avg\.?\s*(?:price|fill)|filled\s*(?:at|price)|executed\s*(?:at|price))\s*:?\s*\$?([0-9]+(?:[.,][0-9]{1,4})?)/i,
    // English: "per share: $N"
    /per\s*share\s*:?\s*\$?([0-9]+(?:[.,][0-9]{1,4})?)/i,
  ];

  for (const pat of pricePatterns) {
    const m = text.match(pat);
    if (m) {
      const val = parseFloat(normalizePriceNumber(m[1]));
      if (!isNaN(val) && val > 0) {
        pricePerShare = val;
        break;
      }
    }
  }

  // Fallback: find a number on a line that contains price context but not total/amount
  if (pricePerShare === null) {
    const priceLines = allLines.filter(
      (line) =>
        /price|سعر|filled|executed|@/i.test(line) &&
        !/(?:total|amount|value|cost|proceeds|subtotal|net|الاجمالي|المتوقع)/i.test(line),
    );
    for (const line of priceLines) {
      const numMatch = line.match(/\$?([0-9]+(?:[.,][0-9]{1,4})?)/);
      if (numMatch) {
        const val = parseFloat(normalizePriceNumber(numMatch[1]));
        if (!isNaN(val) && val > 0) {
          pricePerShare = val;
          break;
        }
      }
    }
  }

  // Last resort: smallest sensible dollar value (excluding obviously large totals)
  if (pricePerShare === null) {
    const stripped = allLines
      .filter(
        (line) =>
          !/(?:total|amount|value|cost|proceeds|subtotal|net\s+amount|الاجمالي|المتوقع)/i.test(line),
      )
      .join("\n");
    const numbers = [...stripped.matchAll(/\$?([0-9]+(?:[.,][0-9]{1,4})?)/g)]
      .map((m) => parseFloat(normalizePriceNumber(m[1])))
      .filter((v) => v > 0 && v < 100000);
    if (numbers.length > 0) {
      numbers.sort((a, b) => a - b);
      pricePerShare = numbers[0] || null;
    }
  }

  // ─── Date extraction ───
  let tradeDate: string | null = null;

  // Helper to build ISO date without timezone issues
  function buildISO(y: number, m: number, d: number): string {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Strategy 1: "الوقت DD-MM-YYYY" pattern (Arabic "time" label)
  const timeMatch = text.match(/الوقت\s+(\d{2}-\d{2}-\d{4})/i);
  if (timeMatch) {
    const [d, m, y] = timeMatch[1].split("-").map(Number);
    tradeDate = buildISO(y, m, d);
  }

  // Strategy 2: DD-MM-YYYY on a line that also contains a time (HH:MM)
  if (!tradeDate) {
    for (const line of allLines) {
      const ddMatch = line.match(/\b(\d{2}-\d{2}-\d{4})\b/);
      const hasTime = /\d{1,2}:\d{2}/.test(line);
      if (ddMatch && hasTime) {
        const [d, m, y] = ddMatch[1].split("-").map(Number);
        tradeDate = buildISO(y, m, d);
        break;
      }
    }
  }

  // Strategy 3: Look near date-related keywords
  if (!tradeDate) {
    const dateNearKeywords = [
      /trade\s*date\s*:?\s*(\d{2}-\d{2}-\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /order\s*date\s*:?\s*(\d{2}-\d{2}-\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /executed\s*(?:on|at|date)?\s*:?\s*(\d{2}-\d{2}-\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /filled\s*(?:on|at|date)?\s*:?\s*(\d{2}-\d{2}-\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /تاريخ\s*(?:التنفيذ|الصفقة|الطلب)\s*:?\s*(\d{2}-\d{2}-\d{4})/i,
    ];
    for (const pat of dateNearKeywords) {
      const m = text.match(pat);
      if (m) {
        const dateStr = m[1];
        if (dateStr.includes("-")) {
          const [d, mm, y] = dateStr.split("-").map(Number);
          tradeDate = buildISO(y, mm, d);
        } else {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            tradeDate = parsed.toISOString().split("T")[0];
          }
        }
        if (tradeDate) break;
      }
    }
  }

  // Strategy 4: First DD-MM-YYYY found in text
  if (!tradeDate) {
    const ddMatch = text.match(/\b(\d{2}-\d{2}-\d{4})\b/);
    if (ddMatch) {
      const [d, m, y] = ddMatch[1].split("-").map(Number);
      tradeDate = buildISO(y, m, d);
    }
  }

  // Strategy 5: Other common date formats
  if (!tradeDate) {
    const genericPatterns = [
      /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
      /\b(\d{4}-\d{2}-\d{2})\b/,
      /\b([A-Z][a-z]{2}\s+\d{1,2},?\s*\d{4})\b/,
      /\b(\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4})\b/,
    ];
    for (const pat of genericPatterns) {
      const m = text.match(pat);
      if (m) {
        const parsed = new Date(m[1]);
        if (!isNaN(parsed.getTime())) {
          tradeDate = parsed.toISOString().split("T")[0];
          break;
        }
      }
    }
  }

  if (!tradeDate) {
    tradeDate = new Date().toISOString().split("T")[0];
  }

  // ─── Fees / commission extraction ───
  let feesCents: number | null = null;

  const feesPatterns = [
    // Arabic: "الرسوم المتوقعة 5.57 ج.م" (Thndr)
    /الرسوم\s*المتوقعة\s+([0-9]+(?:[.,][0-9]{1,4})?)\s*ج\.?م/i,
    // Arabic: "رسوم N ج.م" or "الرسوم N ج.م"
    /(?:ال)?رسوم\s*\:?\s*([0-9]+(?:[.,][0-9]{1,4})?)\s*ج\.?م/i,
    // Arabic: "عمولة N ج.م"
    /عمولة\s*\:?\s*([0-9]+(?:[.,][0-9]{1,4})?)\s*ج\.?م/i,
    // English: "commission: $N" or "commission $N"
    /commission\s*:?\s*\$?([0-9]+(?:\.[0-9]{1,4})?)/i,
    // English: "fees: $N" or "fee: $N"
    /fees?\s*:?\s*\$?([0-9]+(?:\.[0-9]{1,4})?)/i,
    // English: "brokerage: $N" or "brokerage fee: $N"
    /brokerage(?:\s*fee)?\s*:?\s*\$?([0-9]+(?:\.[0-9]{1,4})?)/i,
    // English: "service charge: $N"
    /service\s*charge\s*:?\s*\$?([0-9]+(?:\.[0-9]{1,4})?)/i,
    // English: "sec fee: $N" or "SEC fee: $N"
    /sec\s*fee\s*:?\s*\$?([0-9]+(?:\.[0-9]{1,4})?)/i,
    // English: "TAF: $N"
    /taf\s*:?\s*\$?([0-9]+(?:\.[0-9]{1,4})?)/i,
    // English: "fees & charges: $N"
    /fees?\s*(?:&|and)\s*(?:commissions?|charges?)\s*:?\s*\$?([0-9]+(?:\.[0-9]{1,4})?)/i,
  ];

  for (const pat of feesPatterns) {
    const m = text.match(pat);
    if (m) {
      const feesValue = parseFloat(normalizePriceNumber(m[1]));
      if (!isNaN(feesValue) && feesValue > 0) {
        feesCents = Math.round(feesValue * 100);
        break;
      }
    }
  }

  // Fallback: look for a small number near fees-related words in the last lines
  if (feesCents === null) {
    const lowerLines = allLines.slice(Math.max(0, allLines.length - 8));
    for (const line of lowerLines) {
      if (/fees?|commission|charge|رسوم|عمولة/i.test(line)) {
        const numMatch = line.match(/\$?([0-9]+(?:\.[0-9]{1,4})?)/);
        if (numMatch) {
          const val = parseFloat(normalizePriceNumber(numMatch[1]));
          if (!isNaN(val) && val > 0 && val < 1000) {
            feesCents = Math.round(val * 100);
            break;
          }
        }
      }
    }
  }

  // ─── Asset Type Detection ───
  let assetType: string | null = "stock";
  const lowerText = text.toLowerCase();
  if (
    lowerText.includes("crypto") ||
    lowerText.includes("btc") ||
    lowerText.includes("eth") ||
    lowerText.includes("sol")
  ) {
    assetType = "crypto";
  } else if (
    lowerText.includes("forex") ||
    lowerText.includes("eur/") ||
    lowerText.includes("usd/")
  ) {
    assetType = "forex";
  } else if (
    lowerText.includes("call") ||
    lowerText.includes("put") ||
    lowerText.includes("strike") ||
    lowerText.includes("expir")
  ) {
    assetType = "options";
  }

  // ─── Confidence calculation + aiMeta ───
  const perFieldConfidence: Record<string, number> = {
    ticker: ticker ? 1 : 0,
    shares: shares !== null ? 1 : 0,
    pricePerShare: pricePerShare !== null ? 1 : 0,
    tradeDate: tradeDate ? 0.95 : 0,
    direction: direction ? 1 : 0,
  };

  // Slightly soften tradeDate confidence if it was the fallback "today"
  const todayISO = new Date().toISOString().split("T")[0];
  if (
    tradeDate === todayISO &&
    !/^\d{4}-\d{2}-\d{2}$/.test(originalText.trim())
  ) {
    perFieldConfidence.tradeDate = 0.6;
  }

  const confidenceCore =
    (perFieldConfidence.ticker +
      (shares !== null ? 1 : 0) +
      (pricePerShare !== null ? 1 : 0) +
      (direction ? 1 : 0)) /
    4;

  const extractionMethod: "template" | "regex" =
    platform !== "generic" && platformConfidence >= 0.5 ? "template" : "regex";
  const overallConfidence = Math.max(
    confidenceCore,
    platform !== "generic" && extractionMethod === "template"
      ? platformConfidence
      : confidenceCore,
  );

  const aiMeta =
    platform !== "generic" && extractionMethod === "template"
      ? {
          platform,
          extractionMethod,
          platformConfidence: platformConfidence,
          perFieldConfidence,
        }
      : {
          platform: platform,
          extractionMethod: "regex" as const,
          platformConfidence: platformConfidence,
          perFieldConfidence,
        };

  return {
    ticker,
    shares,
    pricePerShare,
    tradeDate,
    direction,
    feesCents,
    assetType,
    rawText: text,
    confidence: overallConfidence,
    aiMeta: platform !== "generic" ? aiMeta : undefined,
  };
}
