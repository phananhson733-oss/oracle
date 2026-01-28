# Synthetica ConfigUnit Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a ConfigUnit-based payload for Synthetica while keeping the current UI selection flow and the PRD prompt unchanged.

**Architecture:** Keep UI selection objects for display, add a ConfigUnit builder that emits planetId/signId/house/aspects for API calls, and normalize on the backend using a catalog map to recover tier/aspect category and localized labels for prompt tokens. Do not change prompt templates; only adjust data plumbing.

**Tech Stack:** React + TypeScript (Vite), Node 20, Express backend, TypeScript, Node built-in test runner.

---

### Task 0: Create a dedicated worktree

**Files:**
- None

**Step 1: Create the worktree**

Run:
```
git worktree add -b plan/synthetica-configunit ../oracle_CN-synthetica-configunit
```
Expected: Worktree created at `../oracle_CN-synthetica-configunit`.

**Step 2: Verify clean status**

Run:
```
git status -sb
```
Expected: Clean working tree.

**Step 3: Commit**

Skip (no code changes).

### Task 1: Add ConfigUnit types and a frontend builder

**Files:**
- Modify: `types.ts:1002-1072`
- Modify: `components/wiki/synthetica/types.ts:1-80`
- Create: `components/wiki/synthetica/buildConfig.ts`
- Create: `src/utils/syntheticaConfig.typecheck.ts`

**Step 1: Write a failing type-check test**

Create `src/utils/syntheticaConfig.typecheck.ts`:
```ts
import type { SyntheticaConfigUnit, SyntheticaSelectionState } from '../types';
import { buildSyntheticaConfig } from '../components/wiki/synthetica/buildConfig';

const selection = {
  context: 'LOVE',
  planet: { id: 'moon', name: 'Moon', symbol: '☽', keywords: [], archetype: '', tier: 1 },
  sign: { id: 'scorpio', name: 'Scorpio', symbol: '♏︎', element: 'Water', modality: 'Fixed', archetype: '' },
  house: { id: 'h8', name: '8th House', number: 8, archetype: '', isAngular: false },
  aspects: [],
} satisfies SyntheticaSelectionState;

const config: SyntheticaConfigUnit = buildSyntheticaConfig(selection);
void config;
```

**Step 2: Run typecheck to verify it fails**

Run:
```
npx tsc -p tsconfig.json
```
Expected: FAIL due to missing `SyntheticaConfigUnit` and `buildSyntheticaConfig`.

**Step 3: Add ConfigUnit types and builder**

Update `types.ts` to add:
```ts
export type SyntheticaAspectConfig = {
  targetPlanetId: string;
  aspectType: string;
  orb?: number;
  isApplying?: boolean;
  targetSignId?: string;
  targetHouse?: number;
};

export type SyntheticaConfigUnit = {
  planetId: string;
  signId: string;
  house?: number | null;
  degree?: number;
  minute?: number;
  isRetrograde?: boolean;
  aspects?: SyntheticaAspectConfig[];
};
```

Create `components/wiki/synthetica/buildConfig.ts`:
```ts
import type { SyntheticaConfigUnit, SyntheticaSelectionState } from '../../../types';

export function buildSyntheticaConfig(selection: SyntheticaSelectionState): SyntheticaConfigUnit {
  return {
    planetId: selection.planet?.id || '',
    signId: selection.sign?.id || '',
    house: selection.house?.number ?? null,
    aspects: selection.aspects.map((item) => ({
      targetPlanetId: item.planet.id,
      aspectType: item.aspect.id,
    })),
  };
}
```

Update `components/wiki/synthetica/types.ts` to re-export or align with the new ConfigUnit types (avoid duplicate definitions).

**Step 4: Run typecheck to verify it passes**

Run:
```
npx tsc -p tsconfig.json
```
Expected: PASS.

**Step 5: Commit**

```
git add types.ts components/wiki/synthetica/types.ts components/wiki/synthetica/buildConfig.ts src/utils/syntheticaConfig.typecheck.ts
git commit -m "feat: add synthetica config unit types"
```

### Task 2: Add backend catalog and normalization utilities

**Files:**
- Create: `backend/src/data/synthetica-catalog.ts`
- Create: `backend/src/utils/syntheticaConfig.ts`
- Create: `backend/src/utils/__tests__/syntheticaConfig.test.ts`

**Step 1: Write a failing test**

Create `backend/src/utils/__tests__/syntheticaConfig.test.ts`:
```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSyntheticaConfig } from '../syntheticaConfig';

test('normalizeSyntheticaConfig maps ids to labels and tiers', () => {
  const result = normalizeSyntheticaConfig({
    planetId: 'moon',
    signId: 'scorpio',
    house: 8,
    aspects: [{ targetPlanetId: 'pluto', aspectType: 'conjunction', orb: 2 }],
  }, 'zh');

  assert.equal(result.planet.id, 'moon');
  assert.equal(result.planet.tier, 1);
  assert.equal(result.sign.id, 'scorpio');
  assert.equal(result.house?.id, 'h8');
  assert.equal(result.aspects[0].aspect.id, 'conjunction');
});
```

**Step 2: Run tests to verify they fail**

Run:
```
npx tsc -p backend/tsconfig.json
node --test backend/dist/utils/__tests__/syntheticaConfig.test.js
```
Expected: FAIL due to missing module/functions.

**Step 3: Implement catalog and normalization**

Create `backend/src/data/synthetica-catalog.ts` with minimal maps for:
```ts
export const SYNTHETICA_PLANETS = {
  moon: { id: 'moon', tier: 1, name: { zh: '月亮', en: 'Moon' } },
  // ... keep in sync with components/wiki/synthetica/constants.ts
};
export const SYNTHETICA_SIGNS = {
  scorpio: { id: 'scorpio', name: { zh: '天蝎座', en: 'Scorpio' } },
  // ...
};
export const SYNTHETICA_HOUSES = {
  h8: { id: 'h8', number: 8, name: { zh: '第8宫', en: '8th House' } },
  // ...
};
export const SYNTHETICA_ASPECTS = {
  conjunction: { id: 'conjunction', category: 'FUSION', name: { zh: '合相', en: 'Conjunction' } },
  // ...
};
```

Create `backend/src/utils/syntheticaConfig.ts`:
```ts
import type { Language } from '../types/api.js';
import { SYNTHETICA_ASPECTS, SYNTHETICA_HOUSES, SYNTHETICA_PLANETS, SYNTHETICA_SIGNS } from '../data/synthetica-catalog.js';

export type SyntheticaConfigUnit = {
  planetId: string;
  signId: string;
  house?: number | null;
  degree?: number;
  minute?: number;
  isRetrograde?: boolean;
  aspects?: Array<{ targetPlanetId: string; aspectType: string; orb?: number; isApplying?: boolean; targetSignId?: string; targetHouse?: number }>;
};

export function normalizeSyntheticaConfig(config: SyntheticaConfigUnit, lang: Language) {
  // Validate required ids
  // Map ids to catalog entries (planet, sign, house)
  // Return normalized selection: { planet, sign, house, aspects }
}
```

**Step 4: Run tests to verify they pass**

Run:
```
npx tsc -p backend/tsconfig.json
node --test backend/dist/utils/__tests__/syntheticaConfig.test.js
```
Expected: PASS.

**Step 5: Commit**

```
git add backend/src/data/synthetica-catalog.ts backend/src/utils/syntheticaConfig.ts backend/src/utils/__tests__/syntheticaConfig.test.ts
git commit -m "feat: add synthetica config normalization"
```

### Task 3: Wire backend API to ConfigUnit payload

**Files:**
- Modify: `backend/src/api/synthetica.ts:10-210`
- Modify: `backend/src/utils/__tests__/syntheticaConfig.test.ts`

**Step 1: Write a failing test for prompt tokens**

Extend `backend/src/utils/__tests__/syntheticaConfig.test.ts`:
```ts
import { buildPromptTokens } from '../syntheticaConfig';

test('buildPromptTokens uses localized labels', () => {
  const tokens = buildPromptTokens({
    planetId: 'moon',
    signId: 'scorpio',
    house: 8,
    aspects: [{ targetPlanetId: 'pluto', aspectType: 'conjunction' }],
  }, 'zh');

  assert.equal(tokens.planet, '月亮');
  assert.equal(tokens.sign, '天蝎座');
});
```

**Step 2: Run tests to verify they fail**

Run:
```
npx tsc -p backend/tsconfig.json
node --test backend/dist/utils/__tests__/syntheticaConfig.test.js
```
Expected: FAIL due to missing `buildPromptTokens`.

**Step 3: Implement token builder and use it in the API**

Update `backend/src/utils/syntheticaConfig.ts` to export `buildPromptTokens` and re-use the catalog.

Update `backend/src/api/synthetica.ts`:
- Replace `SelectionState` payload with `config: SyntheticaConfigUnit` + `context` + `lang`.
- Call `normalizeSyntheticaConfig(config, lang)` to produce `planet/sign/house/aspects`.
- Use `buildPromptTokens(config, lang)` to fill prompt placeholders.
- Keep existing weighting logic by feeding normalized `planet` and `aspects` objects.
- Preserve backward compatibility: if `config` missing, build config from old payload.

**Step 4: Run tests to verify they pass**

Run:
```
npx tsc -p backend/tsconfig.json
node --test backend/dist/utils/__tests__/syntheticaConfig.test.js
```
Expected: PASS.

**Step 5: Commit**

```
git add backend/src/api/synthetica.ts backend/src/utils/syntheticaConfig.ts backend/src/utils/__tests__/syntheticaConfig.test.ts
git commit -m "feat: accept synthetica config payload"
```

### Task 4: Update frontend API payload and cache key

**Files:**
- Modify: `services/apiClient.ts:1127-1170`
- Modify: `components/wiki/WikiSyntheticaPage.tsx:45-190`

**Step 1: Write a failing typecheck**

Update `src/utils/syntheticaConfig.typecheck.ts` to require the new API call signature:
```ts
import { generateSyntheticaReport } from '../services/apiClient';
import { buildSyntheticaConfig } from '../components/wiki/synthetica/buildConfig';
// Call the function with a config payload shape
```

**Step 2: Run typecheck to verify it fails**

Run:
```
npx tsc -p tsconfig.json
```
Expected: FAIL due to outdated API signature.

**Step 3: Update API client and UI wiring**

In `services/apiClient.ts`:
- Change `buildSyntheticaCacheKey` to use `planetId/signId/house/aspects` from ConfigUnit.
- Send `{ config, context, lang }` instead of spreading the selection object.

In `components/wiki/WikiSyntheticaPage.tsx`:
- Use `buildSyntheticaConfig(selection)` to construct `config`.
- Keep `localizeSelection` only for display; do not send localized objects.

**Step 4: Run typecheck to verify it passes**

Run:
```
npx tsc -p tsconfig.json
```
Expected: PASS.

**Step 5: Commit**

```
git add services/apiClient.ts components/wiki/WikiSyntheticaPage.tsx src/utils/syntheticaConfig.typecheck.ts
git commit -m "feat: send synthetica config unit payload"
```

### Task 5: Smoke test and regression checks

**Files:**
- None

**Step 1: Run backend typecheck and unit tests**

Run:
```
npx tsc -p backend/tsconfig.json
node --test backend/dist/utils/__tests__/syntheticaConfig.test.js
```
Expected: PASS.

**Step 2: Run frontend typecheck**

Run:
```
npx tsc -p tsconfig.json
```
Expected: PASS.

**Step 3: Manual UI check**

- Open the Synthetica tool.
- Select context, planet, sign, optional house, and add one aspect.
- Generate report and confirm the request payload uses `config` fields.

**Step 4: Commit**

Skip (verification only).
