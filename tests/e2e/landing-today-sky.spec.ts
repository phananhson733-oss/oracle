// INPUT: Playwright test API + stubLanding helper.
// OUTPUT: 导出 CosmicWeather (Today's Sky) section 的 E2E 用例（渲染行 + Rx、错误后重试恢复、CTA 跳转 /forecast）。
// POS: /landing-v2 落地页 Today's Sky 模块 E2E 用例集。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { expect, test } from "@playwright/test";
import { stubLanding } from "./_helpers/landing";

const TODAY_PAYLOAD = {
  date: "2026-05-18",
  positions: [
    { name: "Sun", sign: "Taurus", degree: 27.5, retrograde: false },
    { name: "Moon", sign: "Leo", degree: 3.12, retrograde: false },
    { name: "Mercury", sign: "Gemini", degree: 12.0, retrograde: true },
    { name: "Venus", sign: "Aries", degree: 5.4, retrograde: false },
    { name: "Mars", sign: "Cancer", degree: 18.9, retrograde: false },
    { name: "Jupiter", sign: "Gemini", degree: 22.3, retrograde: false },
    { name: "Saturn", sign: "Pisces", degree: 8.8, retrograde: false },
    { name: "Uranus", sign: "Taurus", degree: 25.1, retrograde: false },
    { name: "Neptune", sign: "Pisces", degree: 29.5, retrograde: false },
    { name: "Pluto", sign: "Aquarius", degree: 1.7, retrograde: true },
  ],
};

test.describe("/landing-v2 — Cosmic Weather", () => {
  test("renders 10 planet rows including Mercury Rx label", async ({ page }) => {
    await stubLanding(page, {
      today: (r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(TODAY_PAYLOAD),
        }),
    });

    await page.goto("/landing-v2");

    const section = page.locator("section").filter({
      has: page.locator("#today-heading"),
    });
    await expect(section).toBeVisible();

    // All 10 planet names render.
    for (const p of TODAY_PAYLOAD.positions) {
      await expect(section.getByText(p.name, { exact: true }).first()).toBeVisible();
    }

    // Retrograde markers — there are two Rx entries (Mercury, Pluto).
    const rxBadges = section.getByLabel("retrograde");
    await expect(rxBadges).toHaveCount(2);
  });

  test("error then retry recovers", async ({ page }) => {
    let calls = 0;
    await stubLanding(page, {
      today: (r) => {
        calls += 1;
        if (calls === 1) {
          return r.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              error: "Failed to compute today's sky",
              code: "EPHEMERIS_UNAVAILABLE",
            }),
          });
        }
        return r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(TODAY_PAYLOAD),
        });
      },
    });

    await page.goto("/landing-v2");

    const section = page.locator("section").filter({
      has: page.locator("#today-heading"),
    });

    const errorStatus = section.getByRole("status").filter({
      hasText: /the sky is shy today/i,
    });
    await expect(errorStatus.first()).toBeVisible();

    await section
      .getByRole("button", { name: /try again/i })
      .click();

    await expect(section.getByText("Sun", { exact: true }).first()).toBeVisible();
    await expect(errorStatus).toHaveCount(0);
  });

  test("CTA navigates to /forecast", async ({ page }) => {
    await stubLanding(page, {
      today: (r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(TODAY_PAYLOAD),
        }),
    });

    await page.goto("/landing-v2");

    const section = page.locator("section").filter({
      has: page.locator("#today-heading"),
    });
    await expect(section).toBeVisible();

    await section
      .getByRole("button", { name: /see your personal forecast/i })
      .click();

    await expect(page).toHaveURL(/\/forecast(\/|$|\?)/);
  });
});
