// INPUT: Playwright 测试 API、根路径冒烟用例。
// OUTPUT: 导出 landing 关键路径 smoke test。详细 hero/newsletter/birth-chart 覆盖率拆分到
//         landing-birth-chart.spec.ts / landing-newsletter.spec.ts / landing-today-sky.spec.ts。
// POS: 首页落地体验 smoke test。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { expect, test } from "@playwright/test";
import { stubLanding } from "./_helpers/landing";

test.describe("landing", () => {
  // ACTIVE SMOKE TEST — verifies the v2 landing renders at the root path.
  // Cutover landed 2026-05-19 (L2): "/" used to redirect to "/:lang/wiki",
  // now renders LandingPageV2 directly with canonical="/", index,follow.
  // Wiki center remains reachable at /:lang/wiki for direct entry.
  //
  // Detailed landing-v2 coverage now lives in dedicated specs:
  //   - landing-birth-chart.spec.ts  Hero + BirthChart form + submit success
  //   - landing-newsletter.spec.ts   Newsletter form + honeypot trap
  //   - landing-today-sky.spec.ts    Today's Sky planet positions
  test("root path renders v2 landing (hero + birth-chart anchor)", async ({
    page,
  }) => {
    await stubLanding(page);
    await page.goto("/");
    // URL stays at root (no redirect to /:lang/wiki anymore).
    await expect(page).toHaveURL(/\/(\?|$)/);
    // Hero section heading is visible on first paint.
    await expect(
      page.locator('section[aria-labelledby="hero-heading"]'),
    ).toBeVisible();
    // BirthChart anchor (CTA convergence target) is present in the DOM.
    await expect(page.locator("#birth-chart-tool")).toBeAttached();
    // SEO: canonical points to root, robots is indexable.
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toMatch(/\/$/);
    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(robots).toBe("index,follow");
  });
});
