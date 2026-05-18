// INPUT: Playwright 测试 API、根路径冒烟用例。
// OUTPUT: 导出 landing 关键路径 smoke test。详细 hero/newsletter/birth-chart 覆盖率拆分到
//         landing-birth-chart.spec.ts / landing-newsletter.spec.ts / landing-today-sky.spec.ts。
// POS: 首页落地体验 smoke test。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { expect, test } from "@playwright/test";

test.describe("landing", () => {
  // ACTIVE SMOKE TEST — verifies the scaffold works against the current app.
  // The root path "/" redirects to "/{language}/wiki" (default language: en).
  //
  // Detailed landing-v2 coverage now lives in dedicated specs:
  //   - landing-birth-chart.spec.ts  Hero + BirthChart form + submit success
  //   - landing-newsletter.spec.ts   Newsletter form + honeypot trap
  //   - landing-today-sky.spec.ts    Today's Sky planet positions
  // The previous test.fixme placeholders in this file targeted Lane 1/2 work
  // that has since shipped; they were silently skipping after ship and were
  // removed in PR #14 (see the dedicated specs above for real coverage).
  test("home redirects to /:lang/wiki", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(en|zh)\/wiki(\/|$|\?)/);
  });
});
