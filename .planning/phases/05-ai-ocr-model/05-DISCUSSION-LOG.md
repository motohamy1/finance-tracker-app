# Phase 5: AI OCR Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 05-ai-ocr-model
**Areas discussed:** AI metadata display in review, Accuracy thresholds, Validation with AI confidence

---

## AI Metadata Display in Review

| Option | Description | Selected |
|--------|-------------|----------|
| Platform + method only | Show platform name, extraction method, and platform confidence percentage | |
| Full per-field confidence | Platform info + per-field confidence badges (colored indicators on each field row) | ✓ |
| Minimal badge only | Minimal badge indicating 'AI-enhanced' or 'Generic' without percentages | |

**User's choice:** Full per-field confidence

---

| Option | Description | Selected |
|--------|-------------|----------|
| Colored dots | Small colored dot (green/yellow/red) beside each field label | |
| Percentage badges | Percentage badge like '95%' beside each field, color-coded | |
| Dots + tap for details | Dots for at-a-glance scanning with percentages shown on tap | ✓ |

**User's choice:** Dots + tap for details (tooltip popup on tap)

---

| Option | Description | Selected |
|--------|-------------|----------|
| 3-tier (Green/Yellow/Red) | Green >= 0.7, Yellow 0.3-0.69, Red < 0.3 | ✓ |
| Gradient (continuous) | Continuous gradient from red to green | |

**User's choice:** 3-tier with thresholds

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expand | Tapping dot expands field row inline | |
| Tooltip popup | Small tooltip/popup with percentage, dismisses on tap-away | ✓ |
| Long-press detail | Long-press to see details | |

**User's choice:** Tooltip popup

---

## Accuracy Thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| Target >90% (roadmap) | Aim for roadmap target, requires tighter templates | ✓ |
| 80% baseline, 90% stretch | Keep 80% as proven, 90% as future goal | |

**User's choice:** >90% as target

---

| Option | Description | Selected |
|--------|-------------|----------|
| Uniform >90% | Same target for Robinhood, Webull, eToro | ✓ |
| Platform-specific targets | Higher for well-understood platforms, relaxed for eToro | |

**User's choice:** Uniform >90%

---

| Option | Description | Selected |
|--------|-------------|----------|
| All fields >90% | Every field must independently meet the target | |
| Overall >90%, per-field relaxed | Aggregate average >90%, individual fields can dip | ✓ |
| Tiered per-field targets | Critical fields >95%, others >80% | |

**User's choice:** Overall >90%, per-field relaxed

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast in CI | Tests block CI when below threshold | |
| Warn, don't block | Tests warn, accuracy tracked as improving metric | ✓ |

**User's choice:** Warn, don't block CI

---

## Validation with AI Confidence

| Option | Description | Selected |
|--------|-------------|----------|
| Warn only, always savable | Low confidence never blocks save | |
| Block on critical lows | Save disabled when ticker/direction < 0.3 | |
| Block miss, warn on low | Confidence=0 blocks, 0.01-0.69 warns, >=0.7 silent | ✓ |

**User's choice:** Block on missing (0), warn on low, pass on high

---

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time inline check | Confidence validation updates as fields are edited | ✓ |
| On save tap only | Check only when user taps Save | |

**User's choice:** Real-time inline check

---

| Option | Description | Selected |
|--------|-------------|----------|
| Template = higher trust | Template fields get better visual treatment regardless of confidence | |
| Uniform — confidence is king | Per-field confidence is the only signal for trust | ✓ |

**User's choice:** Uniform — per-field confidence only, no method-based trust

---

## the agent's Discretion

- Tooltip popup implementation (positioning, animation, dismiss)
- Color hex values for 3-tier dots
- Text copy for platform badge and generic fallback

## Deferred Ideas

None — discussion stayed within phase scope.
