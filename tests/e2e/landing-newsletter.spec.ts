// INPUT: Playwright test API + stubLanding helper.
// OUTPUT: 导出 Newsletter section 关键交互的 E2E 用例（5 个状态：success、already_subscribed、honeypot、429、400、网络错误）。
// POS: /landing-v2 落地页 Newsletter 模块 E2E 用例集。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { expect, test } from "@playwright/test";
import { stubLanding } from "./_helpers/landing";

const EMAIL = "e2e-newsletter@example.com";

const fillEmailAndSubmit = async (
  page: import("@playwright/test").Page,
  email = EMAIL,
) => {
  // The honeypot input is sr-only but matched by [name="website"].
  await page.locator("#newsletter-email").fill(email);
  await page
    .getByRole("button", { name: /subscribe|sign up/i })
    .first()
    .click();
};

test.describe("/landing-v2 — Newsletter signup states", () => {
  test("success: success=true renders confirmation", async ({ page }) => {
    await stubLanding(page, {
      newsletter: (r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        }),
    });

    await page.goto("/landing-v2");
    await fillEmailAndSubmit(page);

    const confirmation = page.getByRole("status").filter({
      hasText: /you're on the list|watch your inbox/i,
    });
    await expect(confirmation.first()).toBeVisible();
  });

  test("already_subscribed: success + flag renders existed copy", async ({
    page,
  }) => {
    await stubLanding(page, {
      newsletter: (r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, already_subscribed: true }),
        }),
    });

    await page.goto("/landing-v2");
    await fillEmailAndSubmit(page);

    const status = page.getByRole("status").filter({
      hasText: /already on the list|keep the cosmos coming/i,
    });
    await expect(status.first()).toBeVisible();
  });

  test("honeypot input is hidden from real users", async ({ page }) => {
    await stubLanding(page);
    await page.goto("/landing-v2");

    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveCount(1);
    // Honeypot hidden from real users via sr-only (off-screen, screen-reader
    // safe) + aria-hidden + tabIndex=-1. Playwright's toBeVisible treats
    // sr-only as visible (it has dimensions), so check the class + a11y
    // attributes + bounding box position is off-screen instead.
    await expect(honeypot).toHaveAttribute("aria-hidden", "true");
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
    await expect(honeypot).toHaveClass(/sr-only/);
    const box = await honeypot.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(1);
  });

  test("429 rate_limited shows rate-limit copy", async ({ page }) => {
    await stubLanding(page, {
      newsletter: (r) =>
        r.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Too many subscription attempts, please try again later.",
            code: "rate_limited",
          }),
        }),
    });

    await page.goto("/landing-v2");
    await fillEmailAndSubmit(page);

    const status = page.getByRole("status").filter({
      hasText: /too many attempts|try again in a bit/i,
    });
    await expect(status.first()).toBeVisible();
  });

  test("400 email_required surfaces server error message", async ({ page }) => {
    await stubLanding(page, {
      newsletter: (r) =>
        r.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Email is required.",
            code: "email_required",
          }),
        }),
    });

    await page.goto("/landing-v2");
    // Bypass HTML5 required by filling then clearing — or just submit with a value
    // the backend rejects. We submit anything; the stub forces the 400 branch.
    await fillEmailAndSubmit(page, "x@y.z");

    const status = page.getByRole("status").filter({
      hasText: /email is required\./i,
    });
    await expect(status.first()).toBeVisible();
  });

  test("network error shows generic error copy", async ({ page }) => {
    await stubLanding(page, {
      newsletter: (r) => r.abort("failed"),
    });

    await page.goto("/landing-v2");
    await fillEmailAndSubmit(page);

    const status = page.getByRole("status").filter({
      hasText: /could not subscribe|please try again/i,
    });
    await expect(status.first()).toBeVisible();
  });
});
