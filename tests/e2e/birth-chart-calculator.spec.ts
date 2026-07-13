// INPUT: Playwright、独立 birth-chart-calculator 路由、geo/natal API stub。
// OUTPUT: 验证 CTA 目标页可初始化、选择出生资料、提交并渲染完整出生盘结果。
// POS: Wiki CTA P0 上线前置的工具全链路 E2E；计算器表单或 API 契约变更时同步本测试与 tests/e2e/README.md。

import { expect, test } from "@playwright/test";

test("/en/birth-chart-calculator initializes and completes a chart", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.route("**/api/geo/search**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cities: [
          {
            city: "New York",
            admin1: "New York",
            country: "United States",
            lat: 40.7128,
            lon: -74.006,
            timezone: "America/New_York",
          },
        ],
      }),
    }),
  );

  let natalRequestBody: Record<string, unknown> | null = null;
  await page.route("**/api/natal/chart**", async (route) => {
    natalRequestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        chart: {
          positions: [
            {
              name: "Sun",
              sign: "Gemini",
              degree: 23,
              minute: 46,
              house: 10,
              isRetrograde: false,
            },
            {
              name: "Moon",
              sign: "Pisces",
              degree: 10,
              minute: 22,
              house: 7,
              isRetrograde: false,
            },
            {
              name: "Ascendant",
              sign: "Virgo",
              degree: 9,
              minute: 41,
              house: 1,
              isRetrograde: false,
            },
            {
              name: "Midheaven",
              sign: "Gemini",
              degree: 6,
              minute: 24,
              house: 10,
              isRetrograde: false,
            },
          ],
          aspects: [],
          dominance: {
            elements: { fire: 0, earth: 1, air: 2, water: 1 },
            modalities: { cardinal: 0, fixed: 0, mutable: 4 },
          },
          houseCusps: [159, 183, 213, 246, 279, 303, 339, 3, 33, 66, 99, 123],
        },
      }),
    });
  });

  await page.goto("/en/birth-chart-calculator");

  await expect(
    page.getByRole("heading", { name: "Free Birth Chart Calculator", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Calculate my birth chart" })).toBeEnabled();

  await page.locator("#birth-chart-date-month").selectOption("6");
  await page.locator("#birth-chart-date-day").selectOption("15");
  await page.locator("#birth-chart-date-year").selectOption("1990");
  await page.locator("#birth-chart-time").fill("08:00");

  const city = page.locator("#birth-chart-city");
  await city.fill("New York");
  await page.getByRole("option", { name: /New York, New York/ }).click();
  await page.getByRole("button", { name: "Calculate my birth chart" }).click();

  await expect(
    page.getByRole("heading", { name: "Your Birth Chart", level: 2 }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Gemini").first()).toBeVisible();
  await expect(page.getByText("Pisces").first()).toBeVisible();
  expect(natalRequestBody).toMatchObject({
    date: "1990-06-15",
    time: "08:00",
    city: "New York",
    timezone: "America/New_York",
  });
  expect(runtimeErrors).toEqual([]);
});
