import { PLATFORM_SIGNATURES } from '@/types';
import type { Platform } from '@/types';

export { Platform };

interface DetectionResult {
  platform: Platform;
  confidence: number;
}

function testPlatformPattern(pattern: string, text: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(text);
  } catch {
    return false;
  }
}

export function detectPlatform(rawText: string): DetectionResult {
  const text = rawText || '';

  if (!text) {
    return { platform: 'generic', confidence: 0 };
  }

  let bestPlatform: Platform = 'generic';
  let bestConfidence = 0;

  for (const signature of PLATFORM_SIGNATURES) {
    let matchedCount = 0;
    const totalPatterns = signature.textPatterns.length;

    for (const pattern of signature.textPatterns) {
      if (testPlatformPattern(pattern, text)) {
        matchedCount++;
      }
    }

    const hasExplicitName = testPlatformPattern(
      signature.platform === 'robinhood' ? '(?:robinhood|\\bRH\\b)' :
      signature.platform === 'webull' ? 'webull' :
      signature.platform === 'etoro' ? 'etoro' : '',
      text
    );

    // Base match ratio scaled up to produce meaningful confidence values
    const matchRatio = matchedCount / totalPatterns;
    // Explicit name mention adds significant confidence
    const nameBoost = hasExplicitName ? 0.5 : 0;
    const confidence = Math.min(1.0, matchRatio * 2 + nameBoost);

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestPlatform = signature.platform;
    }
  }

  if (bestPlatform === 'generic' || bestConfidence < 0.5) {
    return { platform: 'generic', confidence: 0 };
  }

  return { platform: bestPlatform, confidence: bestConfidence };
}

export function getConfidenceKeywords(rawText: string, platform: Platform): string[] {
  const signature = PLATFORM_SIGNATURES.find(s => s.platform === platform);
  if (!signature || !rawText) return [];

  return signature.confidenceKeywords.filter(keyword =>
    new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(rawText)
  );
}
