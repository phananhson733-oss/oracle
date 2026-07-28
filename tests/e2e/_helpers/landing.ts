// INPUT: Playwright Page.
// OUTPUT: stubLanding(page, overrides) — registers route mocks for all landing-v2 API surfaces;
//         revealLandingSection(page, anchorId) — scrolls a deferred section into view and waits for its lazy root;
//         fillLandingBirthDate(page, isoDate) — drives the locale-stable split date controls.
// POS: Shared helper for /landing-v2 E2E specs (today sky, newsletter, birth chart, wiki hub).
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { Page, Route } from "@playwright/test";

type Stub = (r: Route) => Promise<void> | void;
type Overrides = Partial<
  Record<"today" | "wikiHome" | "newsletter" | "natal" | "geo", Stub>
>;

export async function revealLandingSection(page: Page, anchorId: string) {
  // DeferredSection initially owns the anchor id on a lightweight placeholder.
  // Scrolling that placeholder into view trips IntersectionObserver; once the
  // lazy component resolves, its <section> takes over the same id.
  await page.locator(`#${anchorId}`).first().scrollIntoViewIfNeeded();
  await page.locator(`section#${anchorId}`).waitFor({
    state: "visible",
    timeout: 10_000,
  });
}

export async function fillLandingBirthDate(page: Page, isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Expected YYYY-MM-DD, received: ${isoDate}`);
  const [, year, month, day] = match;
  await page.locator("#bc-date-month").selectOption(String(Number(month)));
  await page.locator("#bc-date-day").selectOption(String(Number(day)));
  await page.locator("#bc-date-year").selectOption(year);
}

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
