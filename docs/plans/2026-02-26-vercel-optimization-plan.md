# AstrologyWiki Vercel Optimization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize AstrologyWiki's performance, architecture, and SEO using Vercel React Best Practices, delivered in 3 phases with independent commits.

**Architecture:** Gradual, non-breaking improvements to an existing React 19 + Vite 6 SPA deployed on Vercel. Each task is independently deployable. Phase 1 focuses on bundle/load optimizations, Phase 2 on code architecture, Phase 3 on SEO.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Tailwind CSS 3.4, Vercel (static + serverless)

---

## Phase 1: Quick Wins

### Task 1: Optimize Vite manualChunks — Split recharts, Remove lucide-react Forcing

**Files:**
- Modify: `vite.config.ts:24-28` (manualChunks) and `:35` (optimizeDeps)

**Step 1: Update manualChunks**

In `vite.config.ts`, replace the current `manualChunks` and `optimizeDeps` config:

```typescript
// vite.config.ts — build.rollupOptions.output.manualChunks
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'charts': ['recharts'],
  'google-ai': ['@google/genai'],
}
```

```typescript
// vite.config.ts — optimizeDeps.include
optimizeDeps: {
  include: ['react', 'react-dom', 'react-router-dom', 'recharts', '@google/genai'],
}
```

Key change: `lucide-react` is removed from both `manualChunks` and `optimizeDeps`. Vite's tree-shaking will only include the 54 icons actually imported (instead of bundling the full library into a forced chunk). `recharts` gets its own `charts` chunk, separating it from icon code.

**Step 2: Build and compare bundle sizes**

Run: `npm run build 2>&1 | tail -30`

Compare the output chunk sizes against the previous build. The old `ui-components` chunk (~399KB gzip containing lucide-react + recharts) should be replaced by a smaller `charts` chunk (recharts only) and lucide icons distributed across page chunks via tree-shaking.

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "perf: split recharts chunk, let Vite tree-shake lucide-react icons"
```

---

### Task 2: Remove Redundant importmap from index.html

**Files:**
- Modify: `index.html:139-149`

**Step 1: Remove the importmap block**

Delete lines 139-149 from `index.html` (the entire `<script type="importmap">...</script>` block). Vite bundles all these packages at build time, so the importmap pointing to esm.sh CDN is redundant in production and can cause module resolution conflicts.

```html
<!-- DELETE this entire block (lines 139-149): -->
  <script type="importmap">
{
  "imports": {
    "react-router-dom": "https://esm.sh/react-router-dom@^7.11.0",
    "@google/genai": "https://esm.sh/@google/genai",
    "react/": "https://esm.sh/react@^19.2.3/",
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/"
  }
}
</script>
```

**Step 2: Verify dev server still works**

Run: `npm run dev` and open http://localhost:3000 — confirm the app loads normally.

**Step 3: Build and verify**

Run: `npm run build && npm run preview` — confirm production build works.

**Step 4: Commit**

```bash
git add index.html
git commit -m "perf: remove redundant esm.sh importmap (Vite handles bundling)"
```

---

### Task 3: Defer Third-Party Auth SDKs (Google + Apple Sign-In)

**Files:**
- Modify: `index.html:35-38` (remove script tags)
- Modify: `components/auth/LoginModal.tsx` (add on-demand loading)

**Step 1: Remove SDK script tags from index.html**

Delete these two lines from `index.html`:

```html
<!-- DELETE line 36: -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>
<!-- DELETE lines 37-38: -->
    <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" async defer></script>
```

**Step 2: Add SDK loader utility**

Create a new file `utils/load-sdk.ts`:

```typescript
const sdkCache = new Map<string, Promise<void>>();

export function loadScript(id: string, src: string): Promise<void> {
  if (sdkCache.has(id)) return sdkCache.get(id)!;

  const existing = document.getElementById(id);
  if (existing) {
    const p = Promise.resolve();
    sdkCache.set(id, p);
    return p;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  sdkCache.set(id, promise);
  return promise;
}

export const loadGoogleSDK = () =>
  loadScript('google-gsi', 'https://accounts.google.com/gsi/client');

export const loadAppleSDK = () =>
  loadScript('apple-auth', 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
```

**Step 3: Update LoginModal.tsx to load SDK on demand**

In `LoginModal.tsx`, find the `useEffect` that calls `window.google.accounts.id.initialize()` (the polling/retry logic). Add SDK loading at the beginning:

```typescript
import { loadGoogleSDK } from '../../utils/load-sdk';

// Inside the useEffect that initializes Google Sign-In:
useEffect(() => {
  if (!showLoginModal) return;
  let cancelled = false;

  loadGoogleSDK().then(() => {
    if (cancelled) return;
    // existing google.accounts.id.initialize(...) code here
  });

  return () => { cancelled = true; };
}, [showLoginModal]);
```

**Step 4: Update App.tsx AuthPage to load SDKs on demand**

In `App.tsx` around line 7086, the AuthPage component directly uses `window.google.accounts.id.initialize()`. Wrap it similarly:

```typescript
import { loadGoogleSDK, loadAppleSDK } from './utils/load-sdk';

// Inside AuthPage's useEffect:
useEffect(() => {
  let cancelled = false;
  loadGoogleSDK().then(() => {
    if (cancelled) return;
    window.google!.accounts.id.initialize({ /* existing config */ });
    window.google!.accounts.id.prompt();
  });
  return () => { cancelled = true; };
}, []);
```

For Apple Sign-In, in the `handleAppleLogin` function:
```typescript
const handleAppleLogin = async () => {
  await loadAppleSDK();
  // existing AppleID.auth.init() and signIn() code
};
```

**Step 5: Verify login flow works**

Run dev server, open app, click login — confirm both Google and Apple sign-in buttons appear and function normally.

**Step 6: Commit**

```bash
git add index.html utils/load-sdk.ts components/auth/LoginModal.tsx App.tsx
git commit -m "perf: defer Google/Apple auth SDKs, load on demand when login opens"
```

---

### Task 4: Defer Analytics Initialization

**Files:**
- Modify: `index.tsx:24-26`

**Step 1: Wrap analytics init in requestIdleCallback**

Replace lines 24-26 in `index.tsx`:

```typescript
// Before:
initAnalytics();
reportWebVitalsToAnalytics();
trackFirstVisitIfNew();

// After:
const initNonCritical = () => {
  initAnalytics();
  reportWebVitalsToAnalytics();
  trackFirstVisitIfNew();
};

if ('requestIdleCallback' in window) {
  requestIdleCallback(initNonCritical);
} else {
  setTimeout(initNonCritical, 2000);
}
```

**Step 2: Commit**

```bash
git add index.tsx
git commit -m "perf: defer analytics init to idle callback (bundle-defer-third-party)"
```

---

### Task 5: Add Vercel Static Asset Cache Headers

**Files:**
- Modify: `vercel.json`

**Step 1: Add cache headers for hashed assets**

In `vercel.json`, add a new entry to the `headers` array (Vite outputs hashed filenames to `dist/assets/`, so these are safe to cache forever):

```json
{
  "source": "/assets/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```

The full `headers` array becomes:

```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      {
        "key": "Cross-Origin-Opener-Policy",
        "value": "same-origin-allow-popups"
      }
    ]
  },
  {
    "source": "/assets/(.*)",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }
    ]
  }
]
```

**Step 2: Commit**

```bash
git add vercel.json
git commit -m "perf: add immutable cache headers for hashed static assets"
```

---

### Task 6: Build and Validate Phase 1

**Step 1: Full build**

Run: `npm run build`

Capture the output and compare chunk sizes with the baseline. Document the results.

**Step 2: Preview and smoke test**

Run: `npm run preview`

Verify:
- App loads (landing page)
- Navigation works
- Login modal opens (SDKs load on demand)
- Wiki pages load
- No console errors

**Step 3: Commit build verification note (optional)**

If any adjustments were needed, commit them.

---

## Phase 2: Architecture Improvements

### Task 7: Extract Utility Functions from App.tsx

**Files:**
- Create: `utils/astro-helpers.ts`
- Modify: `App.tsx:108-175` (move utility functions out)

**Step 1: Create utils/astro-helpers.ts**

Extract these functions from App.tsx (lines ~108-175):

```typescript
// utils/astro-helpers.ts

export const getDateInTimeZone = (timeZone?: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

export const getTimeZoneOffsetMinutes = (timeZone: string, date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const valueMap = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const utcTime = Date.UTC(
    Number(valueMap.year),
    Number(valueMap.month) - 1,
    Number(valueMap.day),
    Number(valueMap.hour),
    Number(valueMap.minute),
    Number(valueMap.second)
  );

  return Math.round((utcTime - date.getTime()) / 60000);
};

export const formatTimezoneOffset = (timeZone?: string) => {
  if (!timeZone || timeZone === 'UTC') return 'UTC';
  try {
    const offsetMinutes = getTimeZoneOffsetMinutes(timeZone);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const minuteLabel = minutes ? `:${String(minutes).padStart(2, '0')}` : '';
    return `${timeZone} UTC${sign}${hours}${minuteLabel}`;
  } catch {
    return timeZone;
  }
};

const CJK_REGEX = /[\u4e00-\u9fff]/;
export const containsCjk = (value: string) => CJK_REGEX.test(value);
export const getLocationQueryMinLength = (value: string) => (containsCjk(value) ? 1 : 2);

export const buildBirthCacheKey = (profile: { birthDate?: string; birthTime?: string; birthCity?: string; lat?: number; lon?: number; timezone?: string; accuracyLevel?: string }) => [
  profile.birthDate,
  profile.birthTime || '',
  profile.birthCity,
  profile.lat ?? '',
  profile.lon ?? '',
  profile.timezone,
  profile.accuracyLevel,
].join('|');
```

**Step 2: Update App.tsx imports**

Replace the inline function definitions with:

```typescript
import { getDateInTimeZone, getTimeZoneOffsetMinutes, formatTimezoneOffset, containsCjk, getLocationQueryMinLength, buildBirthCacheKey } from './utils/astro-helpers';
```

Delete the original function definitions from App.tsx.

**Step 3: Build and verify**

Run: `npm run build` — no errors.

**Step 4: Commit**

```bash
git add utils/astro-helpers.ts App.tsx
git commit -m "refactor: extract utility functions from App.tsx to utils/astro-helpers.ts"
```

---

### Task 8: Extract Shared Sub-Components from App.tsx

**Files:**
- Create: `components/shared/FrameworkDisclaimer.tsx`
- Create: `components/shared/MiniLoader.tsx`
- Create: `components/shared/EntityPlanetCard.tsx`
- Create: `components/shared/QuickGlance.tsx`
- Modify: `App.tsx` (remove inlined definitions, add imports)

**Step 1: Extract FrameworkDisclaimer**

Move the `FrameworkDisclaimer` component (App.tsx ~line 238) into `components/shared/FrameworkDisclaimer.tsx`. Include all its dependencies (imports it needs from UIComponents, hooks, etc.).

**Step 2: Extract MiniLoader**

Move `MiniLoader` (App.tsx ~line 256) into `components/shared/MiniLoader.tsx`.

**Step 3: Extract EntityPlanetCard, QuickGlance, and rendering helpers**

Move `PLANET_GLYPHS`, `ZODIAC_GLYPHS`, `splitLabelParts`, `getZodiacGlyph`, `formatSignHouse`, `EntityPlanetCard`, `QuickGlance` into `components/shared/` files. Group related constants and components together logically.

**Step 4: Update App.tsx imports**

Replace removed definitions with imports from `./components/shared/`.

**Step 5: Build and verify**

Run: `npm run build` — no errors.

**Step 6: Commit**

```bash
git add components/shared/ App.tsx
git commit -m "refactor: extract shared sub-components from App.tsx"
```

---

### Task 9: Extract Page Components from App.tsx (Core Extraction)

This is the biggest task. Extract each page component one-by-one. Do them sequentially to avoid merge conflicts.

**Files:**
- Create: `pages/LandingPage.tsx`
- Create: `pages/OnboardingPage.tsx`
- Create: `pages/DashboardPage.tsx` (was MePage)
- Create: `pages/ForecastPage.tsx` (was TodayPage)
- Create: `pages/CyclesPage.tsx`
- Create: `pages/SynastryPage.tsx` (was UsPage)
- Create: `pages/OraclePage.tsx` (was AskOraclePage)
- Create: `pages/SettingsPage.tsx`
- Create: `pages/CreditsUsagePage.tsx`
- Create: `pages/AuthPage.tsx`
- Modify: `App.tsx` (replace inline definitions with lazy imports)

**Approach for each page:**

1. Copy the entire component function from App.tsx to a new `pages/<Name>.tsx` file
2. Add all necessary imports at the top of the new file
3. Export the component as default
4. In App.tsx, replace the inline definition with a `lazy()` import:
   ```typescript
   const LandingPage = lazy(() => import('./pages/LandingPage'));
   ```
5. Build after each page extraction to catch import errors immediately

**Key dependencies to watch:**
- `useUserProfile()` hook (defined in App.tsx ~line 179) — extract to `hooks/useUserProfile.ts`
- Shared state between AppContent and pages (passed as props like `profile`, `saveUser`)
- `PLANET_GLYPHS`, `ZODIAC_GLYPHS`, etc. (already extracted in Task 8)

**Step 1: Extract useUserProfile hook**

Move `useUserProfile` from App.tsx to `hooks/useUserProfile.ts`.

**Step 2: Extract pages one-by-one**

Start with the simplest (LandingPage ~60 lines), then work up to the largest (UsPage ~3000 lines, AskOraclePage ~900 lines).

Order: LandingPage → AuthPage → CreditsUsagePage → SettingsPage → OnboardingPage → DashboardPage → ForecastPage → CyclesPage → OraclePage → SynastryPage

**Step 3: Update App.tsx routes to use lazy imports**

The Routes section (lines ~7531-7557) should reference the lazy-imported components. Most are already lazily loaded if extracted properly.

**Step 4: Build and full smoke test**

Run: `npm run build && npm run preview`

Navigate to every route and confirm each page loads.

**Step 5: Commit**

```bash
git add pages/ hooks/useUserProfile.ts App.tsx
git commit -m "refactor: extract all page components from App.tsx into pages/ directory"
```

---

### Task 10: Add content-visibility to Long Lists

**Files:**
- Modify: `index.css` (or relevant component CSS)

**Step 1: Add content-visibility utility classes**

Add to `index.css`:

```css
/* content-visibility optimization for off-screen list items */
.cv-auto {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}

.cv-auto-lg {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px;
}
```

**Step 2: Apply to list components**

Add `cv-auto` class to repeating list items in:
- Wiki list items (WikiHubPage, WikiIndexPage)
- CBT timeline items (TimelineFeed)
- Any other long scrollable lists

**Step 3: Build and verify**

Run: `npm run build` — no errors. Scroll performance should be improved on long lists.

**Step 4: Commit**

```bash
git add index.css components/
git commit -m "perf: add content-visibility:auto to long list items (rendering-content-visibility)"
```

---

## Phase 3: SEO Enhancement

### Task 11: Migrate HashRouter to BrowserRouter

**Files:**
- Modify: `App.tsx` (HashRouter → BrowserRouter)
- Modify: `App.tsx` AppContent (add hash redirect logic)

**Step 1: Change router in App component**

In `App.tsx` (line ~7738), replace:

```typescript
// Before:
import { HashRouter, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
// ...
<HashRouter>

// After:
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
// ...
<BrowserRouter>
```

**Step 2: Add legacy hash URL redirect**

At the top of the `AppContent` component (before other effects), add:

```typescript
// Redirect old hash-based URLs to clean URLs
useEffect(() => {
  if (window.location.hash.startsWith('#/')) {
    const cleanPath = window.location.hash.slice(1); // Remove '#'
    window.history.replaceState(null, '', cleanPath);
  }
}, []);
```

**Step 3: Update PayPal redirect handler**

The existing PayPal redirect logic (App.tsx ~line 7358-7371) creates hash-based URLs. Update it to use clean URLs:

```typescript
// Before:
const targetUrl = `${window.location.origin}/#${targetPath}${window.location.search}`;

// After:
const targetUrl = `${window.location.origin}${targetPath}${window.location.search}`;
```

**Step 4: Update analytics tracking**

The page view tracking (App.tsx ~line 7401-7415) uses `window.location.hash`. Update to use `location.pathname` directly (from React Router):

```typescript
// Before:
const resolvedPath = window.location.hash?.replace(/^#/, '') || location.pathname || '/';

// After:
const resolvedPath = location.pathname || '/';
```

**Step 5: Verify vercel.json has SPA fallback**

Confirm `vercel.json` already has the catch-all rewrite (it does):
```json
{ "source": "/(.*)", "destination": "/index.html" }
```

This ensures direct URL access (e.g., `/wiki/aries`) serves `index.html` and React Router handles client-side routing.

**Step 6: Build, deploy preview, and test**

Run: `npm run build && npm run preview`

Test:
- Direct URL access: http://localhost:4173/wiki — should work
- Navigation between pages — should work
- Old hash URLs: http://localhost:4173/#/wiki — should redirect to /wiki
- PayPal callback URLs — should redirect correctly
- Browser back/forward — should work

**Step 7: Commit**

```bash
git add App.tsx
git commit -m "feat: migrate HashRouter to BrowserRouter for SEO-friendly URLs"
```

---

### Task 12: Add Per-Page SEO Meta Tags

**Files:**
- Modify: Each page component in `pages/` (or inline in App.tsx if not yet extracted)

**Step 1: Add SEO component to each page**

The `<SEO>` component (from `components/SEO.tsx`) supports: `title`, `description`, `image`, `url`, `type`, `schema`, `keywords`, `robots`.

Add it to every public page:

```typescript
// pages/LandingPage.tsx
<SEO
  title="AstrologyWiki — Modern Astrology & Self-Discovery"
  description="Discover your cosmic blueprint with AI-powered natal charts, daily forecasts, and psychological astrology insights."
  url="/"
/>

// Wiki pages already have SEO through generate-seo-pages.mjs for static render,
// but also add dynamic SEO for SPA navigation:
// WikiHubPage:
<SEO
  title="Astrology Wiki — AstrologyWiki"
  description="Explore the complete guide to zodiac signs, planets, houses, and aspects."
  url="/wiki"
  type="website"
/>

// WikiDetailPage (dynamic per item):
<SEO
  title={`${item.title} — Astrology Wiki`}
  description={item.summary}
  url={`/wiki/${item.id}`}
  type="article"
/>
```

**Step 2: Mark private pages as noindex**

For authenticated pages, add `robots="noindex,nofollow"`:

```typescript
// pages/SettingsPage.tsx, pages/CreditsUsagePage.tsx, etc.
<SEO robots="noindex,nofollow" />
```

**Step 3: Verify meta tags render correctly**

Open browser DevTools → Elements → `<head>` and verify meta tags update when navigating between pages.

**Step 4: Commit**

```bash
git add pages/ components/wiki/
git commit -m "seo: add per-page meta tags using SEO component"
```

---

### Task 13: Add Page-Specific Schema.org Structured Data

**Files:**
- Modify: Wiki page components (add Article schema)
- Modify: LandingPage (add SoftwareApplication schema)

**Step 1: Add Article schema to WikiDetailPage**

```typescript
<SEO
  title={`${item.title} — Astrology Wiki`}
  description={item.summary}
  url={`/wiki/${item.id}`}
  type="article"
  schema={{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.summary,
    url: `https://www.astrologywiki.com/wiki/${item.id}`,
    author: {
      '@type': 'Organization',
      name: 'AstrologyWiki',
    },
  }}
/>
```

**Step 2: Add BreadcrumbList schema to wiki pages**

```typescript
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.astrologywiki.com/' },
    { '@type': 'ListItem', position: 2, name: 'Wiki', item: 'https://www.astrologywiki.com/wiki' },
    { '@type': 'ListItem', position: 3, name: item.title },
  ],
};

<SEO schema={[articleSchema, breadcrumbSchema]} />
```

**Step 3: Add SoftwareApplication schema to LandingPage**

```typescript
<SEO
  schema={{
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AstrologyWiki',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }}
/>
```

**Step 4: Validate with Google Rich Results Test**

After deploying, test URLs with https://search.google.com/test/rich-results

**Step 5: Commit**

```bash
git add pages/ components/wiki/
git commit -m "seo: add Article, BreadcrumbList, and SoftwareApplication schemas"
```

---

### Task 14: Update robots.txt Routes for BrowserRouter

**Files:**
- Modify: `public/robots.txt`

**Step 1: Update robots.txt**

After migrating to BrowserRouter, the routes no longer use hash fragments. Update `robots.txt` to match the actual URL paths and add key public pages:

```
User-agent: *
Allow: /
Allow: /wiki
Allow: /wiki/classics

Disallow: /journal
Disallow: /dashboard
Disallow: /forecast
Disallow: /cycles
Disallow: /us
Disallow: /oracle
Disallow: /settings
Disallow: /usage
Disallow: /auth
Disallow: /payment
Disallow: /api/

Sitemap: https://www.astrologywiki.com/sitemap.xml
```

**Step 2: Commit**

```bash
git add public/robots.txt
git commit -m "seo: update robots.txt for BrowserRouter URL paths"
```

---

### Task 15: Update Sitemap for BrowserRouter Routes

**Files:**
- Modify: `scripts/generate-seo-pages.mjs` (if sitemap URLs need updating)
- Output: `public/sitemap.xml` (generated at build time)

**Step 1: Verify sitemap URL format**

The current `generate-seo-pages.mjs` already generates clean URLs (e.g., `/en/wiki/aries`). Verify that no hash-based URLs appear in the generated sitemap.

**Step 2: Add SPA routes to sitemap**

If the sitemap only covers pre-rendered pages, add the main SPA routes:

```xml
<url>
  <loc>https://www.astrologywiki.com/</loc>
  <lastmod>2026-02-26</lastmod>
  <priority>1.0</priority>
</url>
<url>
  <loc>https://www.astrologywiki.com/wiki</loc>
  <lastmod>2026-02-26</lastmod>
  <priority>0.9</priority>
</url>
```

**Step 3: Run build to regenerate sitemap**

Run: `npm run build`

Inspect `dist/sitemap.xml` (or `public/sitemap.xml`) to verify.

**Step 4: Commit**

```bash
git add scripts/generate-seo-pages.mjs public/sitemap.xml
git commit -m "seo: ensure sitemap covers all BrowserRouter public routes"
```

---

## Summary of All Tasks

| Task | Phase | Files Changed | Commit Message |
|------|-------|---------------|----------------|
| 1 | 1 | `vite.config.ts` | perf: split recharts chunk, let Vite tree-shake lucide-react |
| 2 | 1 | `index.html` | perf: remove redundant esm.sh importmap |
| 3 | 1 | `index.html`, `utils/load-sdk.ts`, `LoginModal.tsx`, `App.tsx` | perf: defer Google/Apple auth SDKs |
| 4 | 1 | `index.tsx` | perf: defer analytics init to idle callback |
| 5 | 1 | `vercel.json` | perf: add immutable cache headers for static assets |
| 6 | 1 | — | Build validation checkpoint |
| 7 | 2 | `utils/astro-helpers.ts`, `App.tsx` | refactor: extract utility functions |
| 8 | 2 | `components/shared/*`, `App.tsx` | refactor: extract shared sub-components |
| 9 | 2 | `pages/*`, `hooks/*`, `App.tsx` | refactor: extract page components |
| 10 | 2 | `index.css`, components | perf: content-visibility for long lists |
| 11 | 3 | `App.tsx` | feat: migrate HashRouter to BrowserRouter |
| 12 | 3 | `pages/*`, wiki components | seo: add per-page meta tags |
| 13 | 3 | `pages/*`, wiki components | seo: add structured data schemas |
| 14 | 3 | `public/robots.txt` | seo: update robots.txt for BrowserRouter |
| 15 | 3 | `scripts/generate-seo-pages.mjs`, `public/sitemap.xml` | seo: update sitemap for BrowserRouter |
