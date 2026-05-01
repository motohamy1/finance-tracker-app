# Phase 2: OCR Pipeline - Discussion Log

**Gathered:** 2026-05-01
**Areas Discussed:** 4

## Area 1: Import Entry Point

### Q1: How should the user trigger screenshot import?
- Options: FAB on trades list | Dual entry (empty state + FAB) | Dedicated import screen as default
- **Selected:** Dual entry: empty state + FAB

### Q2: How does share sheet land?
- **User clarified:** Screenshots imported from phone gallery; share sheet secondary. Both required per INV-01.

### Q3: Single or multi-select?
- Options: Single screenshot at a time | Multi-select batch
- **Selected:** Single screenshot at a time

### Q4: Image preview — integrated or separate step?
- Options: Integrated (preview + review together) | Two-step (confirm image then review data)
- **Selected:** Integrated: preview + review together

### Q5: Both gallery + share sheet, or gallery only?
- Options: Gallery only for Phase 2 | Both: gallery + share sheet
- **Selected:** Both: gallery + share sheet

### Q6: Share sheet landing behavior?
- Options: Modal overlay | Navigate to Investments tab
- **Selected:** Modal overlay

### Q7: Empty state design?
- Options: Import CTA + feature description | Import CTA + sample preview
- **Selected:** Import CTA + sample preview

### Q8: FAB behavior when trades exist?
- Options: Direct to gallery picker | Show import options menu
- **Selected:** Show import options menu

### Q9: Navigation structure for import/review?
- Options: Stack screens within Investments tab | Separate top-level modal stack
- **Selected:** Stack screens within Investments tab

### Q10: Trade list card style?
- Options: Simple trade list | Trade list with thumbnail
- **Selected:** Trade list with thumbnail

### Q11: Gallery picker filtering and crop?
- Options: All photos, auto-resize for OCR | All photos, optional crop
- **Selected:** All photos, auto-resize for OCR

## Area 2: OCR Processing UX

### Q12: What does user see during OCR?
- Options: Image + progress overlay | Full-screen processing
- **Selected:** Image + progress overlay

### Q13: Can user cancel mid-processing?
- Options: Yes, cancel returns to picker | No, let it finish
- **Selected:** Yes, cancel returns to picker

### Q14: Transition after successful OCR?
- Options: Auto-advance to review | Brief success, then review
- **Selected:** Brief success, then review

### Q15: Detect trading platform?
- Options: Detect and show platform | Generic extraction only
- **Selected:** Generic extraction only

### Q16: Bounding boxes on extracted data?
- Options: Just extracted values | Highlight found regions
- **Selected:** Just extracted values

### Q17: Buy/sell direction detection?
- Options: OCR attempts detection, user can override | User always selects manually
- **Selected:** OCR attempts detection, user can override

### Q18: Ticker symbol cleanup?
- Options: Auto-clean + user review | Raw output, user cleans
- **Selected:** Auto-clean + user review

### Q19: Trade date handling?
- Options: Auto-detect from screenshot | Default to today
- **Selected:** Auto-detect from screenshot

## Area 3: Review/Edit Screen

### Q20: Extracted fields layout?
- Options: Stacked form fields | Card preview + inline edit
- **Selected:** Card preview + inline edit

### Q21: Trade fields to include?
- Options: Full set with fees | Core fields without fees
- **Selected:** Ticker, Shares, Price/Share, Date, Direction, Fees

### Q22: Validation before saving?
- Options: All fields required (except fees) | Ticker + direction only
- **Selected:** All fields required (except fees)

### Q23: Discard option?
- Options: Yes, with confirmation dialog | Back button is enough
- **Selected:** Yes, with confirmation dialog

## Area 4: OCR Error Handling

### Q24: Complete OCR failure behavior?
- Options: Error + manual entry fallback | Error + retry option | Both
- **Selected:** Show error + manual entry fallback

### Q25: Partial extraction handling?
- Options: Show review with blanks highlighted | Warn then show review
- **Selected:** Show review with blanks highlighted

### Q26: Keep failed OCR attempts?
- Options: Silently discard | Keep for analytics
- **Selected:** Keep failed attempts for analytics

### Q27: Manual trade entry without screenshot?
- Options: No, screenshot required | Yes, add manual entry option
- **Selected:** Yes, add manual entry option

### Q28: Image format restrictions?
- Options: Standard formats only | Accept any format
- **Selected:** Accept any image format

### Q29: File size limit?
- Options: No hard limit, auto-downscale | Warn above 20MB
- **Selected:** Warn above 20MB

### Q30: Screenshot storage policy?
- Options: Store permanently | Keep temporarily, delete after save
- **Selected:** Keep temporarily, delete after save

### Q31: Thumbnail save policy?
- Options: Yes, save compressed thumbnail | No thumbnail, text-only list
- **Selected:** Yes, save compressed thumbnail

### Q32: OCR engine?
- Options: ML Kit (firm) | ML Kit primary, explore alternatives
- **Selected:** ML Kit (firm)

---

*Discussion completed: 2026-05-01*
