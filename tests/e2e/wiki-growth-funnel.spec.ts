// INPUT: Playwright、根首页、Haaland Wiki 文章、GA4 dataLayer 与 Birth Chart CTA。
// OUTPUT: 验证首次授权 PV 恢复、Wiki→工具 module_c、桌面/移动 Nav/Lead/Sticky，以及首页水合后 Title/H1/FAQ/schema。
// POS: 2026-07-13 增长漏斗浏览器验收；CTA 布局、埋点或首页发现契约变更时同步本测试与 tests/e2e/README.md。

import { expect, test, type Page } from "@playwright/test";

const ARTICLE = "/en/wiki/erling-haaland-birth-chart";

async function grantAnalyticsBeforeLoad(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("astro_analytics_consent", "granted");
    localStorage.setItem(
      "astro_consent_preferences",
      JSON.stringify({ essential: true, analytics: true, marketing: false }),
    );
  });
}

async function stubNonCriticalApi(page: Page) {
  await page.route("**/api/astro/today**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ date: "2026-07-13", positions: [] }),
    }),
  );
}

const analyticsEvents = (page: Page, event: string) =>
  page.evaluate((eventName) => {
    const layer = (window as typeof window & { dataLayer?: unknown[] }).dataLayer ?? [];
    return layer.filter(
      (entry) =>
        !!entry &&
        typeof entry === "object" &&
        (entry as Record<string, unknown>).event === eventName,
    );
  }, event);

test("first consent recovers the Wiki PV, then module_c records the tool journey", async ({
  page,
}) => {
  await stubNonCriticalApi(page);
  await page.goto(ARTICLE);
  await expect(
    page.getByRole("heading", { name: /Erling Haaland Birth Chart/i, level: 1 }),
  ).toBeVisible();

  await expect.poll(async () => (await analyticsEvents(page, "page_view")).length).toBe(0);
  await page.getByRole("button", { name: "Accept All" }).click();

  await expect
    .poll(async () => analyticsEvents(page, "page_view"))
    .toMatchObject([{ page_path: ARTICLE, page_category: "wiki" }]);

  await page
    .getByRole("link", { name: "Get Your Free Birth Chart" })
    .click();
  await expect(page).toHaveURL(/\/en\/birth-chart-calculator$/);
  await expect(
    page.getByRole("heading", { name: "Free Birth Chart Calculator", level: 1 }),
  ).toBeVisible();

  await expect.poll(async () => (await analyticsEvents(page, "page_view")).length).toBe(2);
  const pageViews = await analyticsEvents(page, "page_view");
  expect(pageViews.map((entry) => entry.page_category)).toEqual(["wiki", "tool"]);
  const toolClicks = await analyticsEvents(page, "tool_click");
  expect(toolClicks).toContainEqual(
    expect.objectContaining({
      cta_module: "module_c",
      tool_target: "/en/birth-chart-calculator",
    }),
  );
});

test("desktop Sticky appears below nav at 400px and reserves 48px", async ({
  page,
}) => {
  await grantAnalyticsBeforeLoad(page);
  await stubNonCriticalApi(page);
  await page.goto(ARTICLE);

  const sticky = page.getByTestId("wiki-sticky-tool-cta");
  await expect(sticky).toHaveAttribute("data-visible", "false");
  await page.evaluate(() => window.scrollTo(0, 450));
  await expect(sticky).toHaveAttribute("data-visible", "true");
  await expect(page.getByTestId("wiki-sticky-tool-spacer")).toHaveClass(/h-12/);

  await expect
    .poll(async () => Math.round((await sticky.boundingBox())?.y ?? -1))
    .toBe(64);
  const box = await sticky.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.height)).toBe(48);
  await expect(page.getByRole("link", { name: "Get Mine Free" })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 80));
  await expect(sticky).toHaveAttribute("data-visible", "false");
});

test.describe("mobile Wiki CTA", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Nav CTA is first-priority and Lead secondary tutorial is hidden", async ({
    page,
  }) => {
    await grantAnalyticsBeforeLoad(page);
    await stubNonCriticalApi(page);
    await page.goto(ARTICLE);
    await expect(
      page.getByRole("heading", { name: /Erling Haaland Birth Chart/i, level: 1 }),
    ).toBeVisible();

    const navCta = page.getByRole("link", { name: "Get Free Birth Chart" });
    await expect(navCta).toBeVisible();
    await expect(navCta.getByText("Free Birth Chart Calculator")).toBeVisible();
    const navBox = await navCta.boundingBox();
    expect(navBox).not.toBeNull();
    expect(navBox!.x + navBox!.width).toBeLessThanOrEqual(390);

    await expect(
      page.getByRole("link", { name: "Get Your Free Birth Chart" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "How to Read It" })).toBeHidden();
  });
});

test("hydrated homepage keeps short title, keyword H1, six visible FAQs and contactPoint", async ({
  page,
}) => {
  await grantAnalyticsBeforeLoad(page);
  await stubNonCriticalApi(page);
  await page.goto("/");

  await expect.poll(() => page.title()).toBe(
    "Free Birth Chart Calculator & Astrology | AstrologyWiki",
  );
  expect((await page.title()).length).toBeLessThanOrEqual(60);
  await expect(
    page.getByRole("heading", {
      name: "Free Birth Chart & Astrology Readings",
      level: 1,
    }),
  ).toBeVisible();

  const faq = page.locator("#homepage-faq");
  await faq.scrollIntoViewIfNeeded();
  await expect(faq.locator("details")).toHaveCount(6);
  await expect(faq.getByText("Is AstrologyWiki really free?")).toBeVisible();

  const contactPoint = await page.evaluate(() => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const parsed = JSON.parse(script.textContent ?? "null");
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        const org = entries.find((entry) => entry?.["@type"] === "Organization");
        if (org) return org.contactPoint;
      } catch {
        // Ignore unrelated invalid third-party JSON-LD.
      }
    }
    return null;
  });
  expect(contactPoint).toMatchObject({
    email: "support@astrologywiki.com",
    contactType: "customer support",
  });
});
