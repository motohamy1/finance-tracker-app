# Phase 5: AI OCR Model - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace plain-text OCR with AI-powered extraction that detects trading platforms (Robinhood, Webull, eToro) from screenshot text and applies platform-specific templates for higher accuracy. Plan 01 (platform detection + template extraction) is complete. Plan 02 (evaluation framework, regression tests, review UI metadata display) is pending.
</domain>

<decisions>
## Implementation Decisions

### AI Metadata Display in Review
- **D-01:** Full per-field confidence — platform info badge + colored confidence dots beside each field row in the review form
- **D-02:** Dots for at-a-glance scanning; tap reveals percentage detail via tooltip popup
- **D-03:** 3-tier color scheme: Green (>= 0.7), Yellow (0.3–0.69), Red (< 0.3)
- **D-04:** Tooltip popup shows exact confidence percentage and extraction method used for that field
- **D-05:** When no aiMeta is present (Phase 2 result or manual entry), show "Generic text extraction" muted label — no dots

### Accuracy Thresholds
- **D-06:** Target >90% overall accuracy — must match the roadmap success criterion
- **D-07:** Uniform >90% target across all platforms (Robinhood, Webull, eToro)
- **D-08:** Overall >90% with per-field relaxed — individual fields can dip as long as aggregate meets 90%
- **D-09:** Accuracy regression tests warn but do NOT block CI — accuracy tracked as an improving metric

### Validation with AI Confidence
- **D-10:** Confidence = 0 blocks save (field missing — user must fill manually)
- **D-11:** Confidence 0.01–0.69 shows warning styling but allows save
- **D-12:** Confidence >= 0.7 passes silently (no warning needed)
- **D-13:** Real-time inline check — confidence-based save button state updates as fields are edited
- **D-14:** Uniform trust — per-field confidence is the only visual signal; extraction method (template vs regex) doesn't change trust indicators

### the agent's Discretion
- Exact tooltip popup implementation (positioning, animation, dismiss behavior)
- Color hex values for 3-tier dot colors (within green/yellow/red spectrum)
- Exact text copy for platform badge and generic fallback labels
- Tooltip content formatting (percentage display precision, field name labeling)
</decisions>

<specifics>
## Specific Ideas

- Confidence dots should be unobtrusive but immediately scannable — the user should know at a glance which fields need attention
- Blocking save on confidence=0 prevents submitting bad data, but never blocks for low confidence — user is the final authority
- Accuracy is a journey metric — 90% is the lighthouse, not the gatekeeper
</specifics>

<canonical_refs>
## Canonical References

### Project Requirements
- `.planning/PROJECT.md` — Project constraints (on-device AI, no paid cloud APIs), key decisions
- `.planning/REQUIREMENTS.md` — INV-06 requirement (platform-specific layout templates for improved OCR accuracy)
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria (>90% accuracy, 2 success criteria)

### Phase Plans
- `.planning/phases/05-ai-ocr-model/05-01-PLAN.md` — Completed: Platform detection + template extraction
- `.planning/phases/05-ai-ocr-model/05-02-PLAN.md` — Pending: Evaluation framework, regression tests, review UI

### Prior Phase Context
- `.planning/phases/02-ocr-pipeline/02-CONTEXT.md` — Import flow UX decisions, review screen patterns, OCRResult contract, error handling

### Source Code (key files for Plan 02)
- `src/services/ocr.ts` — parseTradeFromText with platform-aware extraction; EXTRACTION_TEMPLATES
- `src/services/platformDetector.ts` — detectPlatform, platform detection logic
- `src/services/evaluator.ts` — evaluateAccuracy, compareExtractions (exists, needs tests)
- `src/types/index.ts` — OCRResult, AIExtractionMeta, perFieldConfidence type
- `src/app/(investments)/review.tsx` — Review screen (needs AI metadata UI)
- `src/utils/tradeValidation.ts` — isMissingFromOCR (needs per-field confidence enhancement)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **evaluator.ts** (`src/services/evaluator.ts`): Already has evaluateAccuracy, compareExtractions, formatAccuracyReport, formatComparisonReport — matches Plan 02 Task 1
- **review.tsx confidence row** (line 396-407): Existing OCR confidence display — replace with enhanced AI metadata section
- **isMissingFromOCR** (`src/utils/tradeValidation.ts`): Currently null-check only — enhance with perFieldConfidence from aiMeta
- **Platform detector** (`src/services/platformDetector.ts`): detectPlatform already working from Plan 01
- **EXTRACTION_TEMPLATES** (`src/services/ocr.ts`): 3 templates registered, parseTradeFromText already integrated

### Established Patterns
- Zustand stores for state management (tradeStore)
- expo-sqlite with migration pattern
- FlatList with virtualization for scrollable lists
- Financial values stored as cents
- Expo Router file-based routing with route groups
- All async operations show loading states

### Integration Points
- Review screen: `src/app/(investments)/review.tsx` — existing OCR confidence row replaced/expanded
- Trade validation: `src/utils/tradeValidation.ts` — isMissingFromOCR enhanced with aiMeta
- Evaluator: `src/services/evaluator.ts` — evaluateAccuracy and compareExtractions wired into tests
- Test files: `src/__tests__/evaluator.test.ts`, `src/__tests__/ocr-accuracy.test.ts` — new test files
</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 05-ai-ocr-model*
*Context gathered: 2026-05-02*
