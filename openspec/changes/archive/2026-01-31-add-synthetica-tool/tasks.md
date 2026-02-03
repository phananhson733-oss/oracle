## 1. Planning & Specs
- [x] 1.1 Confirm response envelope (LocalizedContent) and language flow.
- [x] 1.2 Align canonical weighting constants and key-house sets for Synthetica.
- [x] 1.3 Update wiki spec delta for localization, response contract, and weighting rules.

## 2. Backend Implementation
- [x] 2.1 Accept lang in `/api/synthetica/generate` and return `{ lang, content, meta? }`.
- [x] 2.2 Update weighting to use canonical context multipliers + key-house bonus.
- [x] 2.3 Normalize house ids to `h1`-`h12` and accept legacy values if present.
- [x] 2.4 Ensure caching uses selection + language hash.

## 3. Frontend Implementation
- [x] 3.1 Pass language to `generateSyntheticaReport` and parse `LocalizedContent`.
- [x] 3.2 Update report rendering to read `content` payload and handle meta.
- [x] 3.3 Localize Tools tab label (EN "Synthetica") and move tool UI copy to `TRANSLATIONS`.
- [x] 3.4 Align Synthetica constants with canonical ids and i18n patterns.

## 4. Verification
- [x] 4.1 Tools tab label is localized (EN "Synthetica", ZH via existing translation key).
- [x] 4.2 Report generation returns correct `lang` and renders all report fields in EN/ZH.
- [x] 4.3 Context weighting and key-house bonus influence aspect ranking.
- [x] 4.4 Cache reuse returns identical report for identical selection + language.
