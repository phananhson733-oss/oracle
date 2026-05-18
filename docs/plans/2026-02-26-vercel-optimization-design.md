# AstrologyWiki Website Optimization Design

**Date**: 2026-02-26
**Approach**: Phased, gradual optimization (low risk)
**Skills**: Vercel React Best Practices (57 rules), React Composition Patterns

---

## Phase 1: Quick Wins (Low Risk, High Impact)

### 1.1 Fix Barrel Imports (`bundle-barrel-imports`)

**Problem**: 26 files import from `lucide-react` via barrel imports (54 unique icons). Combined with `recharts` in a single `ui-components` chunk (399KB gzip).

**Solution**:
- Remove `lucide-react` from `manualChunks` — let Vite tree-shake unused icons
- Separate `recharts` into its own chunk (only 3 lazy-loaded pages use it)

**Files**: `vite.config.ts`

### 1.2 Separate recharts Chunk

**Solution**: Update `manualChunks`:
```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'charts': ['recharts'],
  'google-ai': ['@google/genai'],
}
```

**Files**: `vite.config.ts`

### 1.3 Defer Third-Party Scripts (`bundle-defer-third-party`)

**Problem**: Google Sign-In SDK and Apple Sign-In SDK load eagerly in `<head>`, blocking first paint.

**Solution**: Remove from `index.html`, load on-demand when user opens login modal.

**Files**: `index.html`, `components/auth/LoginModal.tsx` (or relevant auth component)

### 1.4 Remove Redundant importmap

**Problem**: `index.html` lines 139-149 contain an importmap pointing to esm.sh CDN. Vite bundles these packages at build time, making the importmap redundant in production.

**Solution**: Remove the `<script type="importmap">` block.

**Files**: `index.html`

### 1.5 Defer Analytics Initialization

**Problem**: `initAnalytics()` runs synchronously after render in `index.tsx`.

**Solution**: Wrap in `requestIdleCallback` / `setTimeout` fallback.

**Files**: `index.tsx`

### 1.6 Vercel Static Asset Cache Headers

**Problem**: No long-cache headers for hashed static assets.

**Solution**: Add immutable cache headers for `/assets/` in `vercel.json`.

**Files**: `vercel.json`

---

## Phase 2: Architecture Improvements (Medium Risk, Medium Impact)

### 2.1 Split App.tsx (7727 lines)

**Problem**: Single monolithic file containing all page components, utilities, contexts, and routes.

**Solution**: Extract into:
```
App.tsx (~200 lines)          → Router + Provider nesting only
routes.tsx (~80 lines)        → Route definitions
pages/LandingPage.tsx         → Landing page
pages/DashboardPage.tsx       → Dashboard (was MePage)
pages/ForecastPage.tsx        → Daily forecast (was TodayPage)
pages/CyclesPage.tsx          → Cycles page
pages/SynastryPage.tsx        → Synastry (was UsPage)
pages/OraclePage.tsx          → AI Q&A (was AskOraclePage)
pages/SettingsPage.tsx        → Settings
pages/AuthPage.tsx            → Auth page
pages/CreditsUsagePage.tsx    → Credits usage
utils/astro-helpers.ts        → Utility functions
```

All page components use `lazy()` imports for automatic code splitting.

### 2.2 Compound Component Patterns (`architecture-compound-components`)

Review Paywall, Modal, and auth components for boolean prop proliferation. Refactor to composition pattern where beneficial.

### 2.3 Re-render Optimizations

- `rerender-memo`: Wrap list rendering components with `React.memo()`
- `rerender-functional-setstate`: Use functional updates for state derived from previous state
- `rerender-derived-state-no-effect`: Replace effect-based derived state with `useMemo`
- `rerender-lazy-state-init`: Lazy initialize expensive `useState` values

### 2.4 Conditional Module Loading (`bundle-conditional`)

Payment modules (Airwallex, PayPal) should only load when user triggers purchase flow, not at initial load.

### 2.5 CSS content-visibility (`rendering-content-visibility`)

Add `content-visibility: auto` to long list items (Wiki lists, CBT timeline items).

---

## Phase 3: SEO Enhancement (Medium Risk, Long-term Impact)

### 3.1 HashRouter → BrowserRouter Migration

**Problem**: `HashRouter` URLs (`/#/wiki/123`) are invisible to search engines.

**Solution**:
- Replace `HashRouter` with `BrowserRouter`
- `vercel.json` already has SPA fallback rewrite
- Add legacy hash URL redirect component

### 3.2 Dynamic Meta Tags

**Problem**: All pages share the same static meta tags from `index.html`.

**Solution**: Ensure every page component uses the `<SEO>` component with page-specific title, description, and canonical URL.

### 3.3 Enhanced Pre-rendering

Expand `scripts/generate-seo-pages.mjs` to generate full HTML for high-traffic pages (Wiki articles, landing page). Configure route priority in `vercel.json`.

### 3.4 Schema.org Structured Data

Add page-specific schemas:
- Wiki articles: `Article` schema
- FAQ pages: `FAQPage` schema
- Landing page: `SoftwareApplication` schema
- Navigation: `BreadcrumbList` schema

### 3.5 Sitemap & robots.txt

Auto-generate sitemap during build to cover all indexable pages. Verify robots.txt allows crawling of all public routes.

---

## Vercel Rules Applied

| Rule | Phase | Target |
|------|-------|--------|
| `bundle-barrel-imports` | 1 | lucide-react imports |
| `bundle-defer-third-party` | 1 | Google/Apple SDKs, Analytics |
| `bundle-dynamic-imports` | 1+2 | recharts, payment modules |
| `bundle-conditional` | 2 | Payment modules |
| `rerender-memo` | 2 | List components |
| `rerender-functional-setstate` | 2 | State updates |
| `rerender-derived-state-no-effect` | 2 | Effect-based state |
| `rerender-lazy-state-init` | 2 | Expensive initial state |
| `rendering-content-visibility` | 2 | Long lists |
| `architecture-compound-components` | 2 | Paywall, Modal |

## Expected Impact

| Metric | Before | Target |
|--------|--------|--------|
| UI chunk size | 399KB gzip | <100KB gzip |
| Initial JS load | ~175KB gzip | <120KB gzip |
| Third-party blocking | 2 SDKs in head | 0 blocking scripts |
| App.tsx | 7727 lines | ~200 lines |
| SEO indexability | Hash-based (poor) | Full URL paths |
| Static asset caching | No policy | Immutable 1yr cache |
