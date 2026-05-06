# OCR Improvement TODO

## Plan

1. Update `src/services/ocr.ts` to attach `aiMeta` for platform-specific (template) extraction using `detectPlatform`.
2. Add `perFieldConfidence` generation for required fields: `ticker`, `shares`, `pricePerShare`, `tradeDate`, `direction`.
3. Improve field extraction with:
   - Arabic-Indic digit normalization
   - Thndr-specific patterns for `@ <price> ج.م`, `وحدات <n>`, and trade date extraction from the “الوقت ...” line
   - Fees extraction from “الرسوم المتوقعة ... ج.م”
4. Keep generic regex extraction as fallback for `platform='generic'` and/or low platform confidence.
5. Run `vitest` to ensure all OCR tests pass (`ocr-accuracy`, `ocr-enhanced`, `ocr-thndr`).
