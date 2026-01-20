# Change: Update Synthetica Tool Integration

## Why
The Synthetica tool integration has several gaps that prevent reliable use:
- The API response envelope does not match frontend expectations, leading to undefined fields in the report view.
- The backend hardcodes zh and ignores the UI language.
- The English Tools tab label is missing.
- Tool UI copy is not following the project i18n pattern and mixes static text with AI content.
- The aspect weighting logic diverges from the canonical context multipliers and key-house bonuses.

## What Changes
- Align `/api/synthetica/generate` to return a localized content envelope (`lang`, `content`, optional `meta`) with the existing report schema.
- Pass UI language from the frontend to the backend prompt and keep single-language output.
- Localize the Tools tab label (EN = "Synthetica") and migrate tool UI strings to `TRANSLATIONS`.
- Align weighting logic (context multipliers, key houses, aspect multipliers, house id format) across frontend and backend.
- Preserve the existing report schema and caching plan for identical selections.

## Impact
- Affected specs: `wiki`
- Affected code: `components/wiki/WikiHubPage.tsx`, `components/wiki/WikiSyntheticaPage.tsx`, `components/wiki/synthetica/*`, `services/apiClient.ts`, `constants.ts`, `types.ts`, `backend/src/api/synthetica.ts`, `backend/src/prompts/manager.ts`
