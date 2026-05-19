// INPUT: Playwright Page.
// OUTPUT: stubLanding(page, overrides) — registers route mocks for all landing-v2 API surfaces
//         with sensible defaults so individual specs only need to override the route under test.
// POS: Shared helper for /landing-v2 E2E specs (today sky, newsletter, birth chart, wiki hub).
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { Page, Route } from "@playwright/test";

type Stub = (r: Route) => Promise<void> | void;
type Overrides = Partial<
  Record<"today" | "wikiHome" | "newsletter" | "natal" | "geo", Stub>
>;

export async function stubLanding(page: Page, overrides: Overrides = {}) {
  await page.route(
    "**/api/astro/today",
    overrides.today ??
      ((r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ date: "2026-05-18", positions: [] }),
        })),
  );
  await page.route(
    "**/api/wiki/home*",
    overrides.wikiHome ??
      ((r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            content: { pillars: [], daily_transit: null, trending_tags: [] },
          }),
        })),
  );
  await page.route(
    "**/api/newsletter",
    overrides.newsletter ??
      ((r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        })),
  );
  // Default natal stub: a minimal but valid 200 chart payload. Previously
  // defaulted to 500 — any spec that forgot to provide its own override
  // would silently exercise the error path. New default lets specs that
  // don't care about /natal/chart pass without surprise; specs that do
  // care still override per-test.
  await page.route(
    "**/api/natal/chart**",
    overrides.natal ??
      ((r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            chart: {
              positions: [],
              houses: [],
              aspects: [],
            },
          }),
        })),
  );
  // /api/geo/search defaults to empty so specs that don't care about the
  // autocomplete network fallback still pass (the city autocomplete prefers
  // local data/cities.ts and only hits backend on a miss). Specs that test
  // the dropdown can override.
  await page.route(
    "**/api/geo/search**",
    overrides.geo ??
      ((r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ cities: [] }),
        })),
  );
}
