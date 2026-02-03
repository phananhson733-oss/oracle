## Context
The Synthetica tool is integrated but has contract and localization gaps:
- API response envelope mismatches the frontend report view.
- Backend hardcodes zh and ignores UI language.
- English Tools tab label is missing.
- Tool UI copy is static in component constants instead of project i18n.
- Aspect weighting diverges from the canonical context multipliers and key-house bonuses.

## Goals / Non-Goals
Goals:
- Align the response envelope with LocalizedContent (`lang`, `content`, optional `meta`).
- Ensure language flows from UI to API and output is single-language.
- Localize Tools tab label and tool UI copy via `TRANSLATIONS`.
- Align weighting algorithm with canonical constants and standardize house ids.
- Keep the report schema unchanged.

Non-Goals:
- Redesign the UI layout or add new report fields.
- Introduce a new AI provider or bilingual payloads.

## Decisions
- Response contract: `/api/synthetica/generate` returns `{ lang, content, meta? }`, where `content` matches `SyntheticaAnalysisResult`.
- Language: frontend passes `language` to API; backend uses it for the prompt.
- Static vs AI copy: tool labels/prompts/descriptions live in `TRANSLATIONS`; AI output is only the report content.
- Weighting: adopt the canonical multipliers and key-house sets (below), add key-house bonus, and standardize house ids to `h1`-`h12`.
- Caching: keep selection + language hash as the cache key (existing plan).

### Canonical constants
CONTEXT_PLANET_MULTIPLIERS:
- LOVE: venus 2.0, moon 1.8, mars 1.5, pluto 1.2, neptune 1.2, sun 0.8, mercury 1.0, saturn 1.2
- SELF: sun 2.0, moon 1.8, mars 1.2, mercury 1.2, venus 1.0, saturn 1.0, jupiter 1.0
- HEALING: moon 2.5, saturn 1.8, pluto 2.0, neptune 1.5, sun 1.0, mars 0.8, venus 0.8
- CAREER: saturn 2.0, mars 1.8, sun 1.5, jupiter 1.5, mercury 1.5, venus 0.8, moon 0.5
- TIMING: saturn 2.2, uranus 1.8, mercury 1.5, pluto 1.2, jupiter 1.2
- SOCIAL: mercury 1.8, venus 1.8, uranus 2.0, jupiter 1.5, moon 1.2, sun 1.0

CONTEXT_KEY_HOUSES:
- LOVE: [h7, h5, h8]
- SELF: [h1, h5, h9]
- HEALING: [h4, h8, h12]
- CAREER: [h10, h6, h2]
- TIMING: [h6, h3, h10]
- SOCIAL: [h11, h3, h7]

## Risks / Trade-offs
- Weighting changes may alter top-aspect order and report tone.
- Contract change requires frontend parsing updates.
- i18n coverage must be complete to avoid mixed-language UI.

## Migration Plan
1. Update spec delta and tasks to capture contract, i18n, and weighting rules.
2. Backend: response envelope, language propagation, weighting updates, house id normalization.
3. Frontend: pass language, unwrap content, update translations and UI copy.
4. Validate EN/ZH rendering, response shape, and weighting behavior.

## Open Questions
- None (choices confirmed: LocalizedContent envelope and project i18n).
