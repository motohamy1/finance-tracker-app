import type { OCRResult, Platform } from '@/types';

export interface FieldAccuracy {
  field: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface AccuracyReport {
  overallAccuracy: number;
  fieldAccuracies: FieldAccuracy[];
  totalFields: number;
  correctFields: number;
  platform: Platform;
  extractionMethod: 'template' | 'regex';
  sampleCount: number;
}

export interface ComparisonReport {
  regexAccuracy: number;
  aiAccuracy: number;
  improvement: number;
  fieldsImproved: string[];
  fieldsRegressed: string[];
  verdict: 'ai_wins' | 'regex_wins' | 'tie';
  regexReport: AccuracyReport;
  aiReport: AccuracyReport;
}

const EXTRACTABLE_FIELDS = ['ticker', 'shares', 'pricePerShare', 'tradeDate', 'direction'] as const;

function fieldEquals(a: unknown, b: unknown): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() === b.toLowerCase();
  return a === b;
}

export function evaluateAccuracy(groundTruth: OCRResult, extracted: OCRResult): AccuracyReport {
  let correctFields = 0;

  const fieldAccuracies: FieldAccuracy[] = EXTRACTABLE_FIELDS.map(field => {
    const gtVal = groundTruth[field as keyof OCRResult];
    const exVal = extracted[field as keyof OCRResult];
    const correct = fieldEquals(gtVal, exVal) ? 1 : 0;
    correctFields += correct;
    return {
      field,
      correct,
      total: 1,
      accuracy: correct,
    };
  });

  const totalFields = EXTRACTABLE_FIELDS.length;
  const overallAccuracy = correctFields / totalFields;

  return {
    overallAccuracy,
    fieldAccuracies,
    totalFields,
    correctFields,
    platform: extracted.aiMeta?.platform || 'generic',
    extractionMethod: extracted.aiMeta?.extractionMethod || 'regex',
    sampleCount: 1,
  };
}

export function compareExtractions(
  regexResult: OCRResult,
  aiResult: OCRResult,
  groundTruth: OCRResult
): ComparisonReport {
  const regexReport = evaluateAccuracy(groundTruth, regexResult);
  const aiReport = evaluateAccuracy(groundTruth, aiResult);

  const improvement = aiReport.overallAccuracy - regexReport.overallAccuracy;

  const fieldsImproved: string[] = [];
  const fieldsRegressed: string[] = [];

  for (const field of EXTRACTABLE_FIELDS) {
    const gtVal = groundTruth[field];
    const regexVal = regexResult[field];
    const aiVal = aiResult[field];

    const regexCorrect = fieldEquals(gtVal, regexVal);
    const aiCorrect = fieldEquals(gtVal, aiVal);

    if (aiCorrect && !regexCorrect) fieldsImproved.push(field);
    if (!aiCorrect && regexCorrect) fieldsRegressed.push(field);
  }

  let verdict: 'ai_wins' | 'regex_wins' | 'tie';
  if (improvement > 0) verdict = 'ai_wins';
  else if (improvement < 0) verdict = 'regex_wins';
  else verdict = 'tie';

  return {
    regexAccuracy: regexReport.overallAccuracy,
    aiAccuracy: aiReport.overallAccuracy,
    improvement,
    fieldsImproved,
    fieldsRegressed,
    verdict,
    regexReport,
    aiReport,
  };
}

export function formatAccuracyReport(report: AccuracyReport): string {
  const method = report.extractionMethod === 'template' ? report.platform : 'regex';
  const pct = Math.round(report.overallAccuracy * 100);
  const fieldsStr = report.fieldAccuracies
    .map(f => `${f.field.charAt(0).toUpperCase() + f.field.slice(1)}: ${Math.round(f.accuracy * 100)}%`)
    .join(', ');

  return `AI (${method}/${report.extractionMethod}): ${pct}% overall accuracy (${report.correctFields}/${report.totalFields} fields). ${fieldsStr}`;
}

export function formatComparisonReport(report: ComparisonReport): string {
  const pct = Math.round(Math.abs(report.improvement) * 100);
  if (report.verdict === 'ai_wins') {
    return `AI wins: ${Math.round(report.aiAccuracy * 100)}% vs regex ${Math.round(report.regexAccuracy * 100)}% (+${pct}% improvement). Fields improved: ${report.fieldsImproved.join(', ') || 'none'}.`;
  }
  if (report.verdict === 'regex_wins') {
    return `Regex wins: ${Math.round(report.regexAccuracy * 100)}% vs AI ${Math.round(report.aiAccuracy * 100)}% (${-pct}% regression). Fields regressed: ${report.fieldsRegressed.join(', ') || 'none'}.`;
  }
  return `Tie: both ${Math.round(report.aiAccuracy * 100)}%.`;
}
