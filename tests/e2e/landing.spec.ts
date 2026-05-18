// INPUT: Playwright 测试 API、首页/落地页相关交互断言。
// OUTPUT: 导出 landing 关键路径 E2E 用例（含当前可运行的根路径冒烟用例与待集成 fixme 占位）。
// POS: 首页落地体验 E2E 用例集。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { expect, test } from '@playwright/test';

test.describe('landing', () => {
  // ---------------------------------------------------------------------------
  // ACTIVE SMOKE TEST — verifies the scaffold works against the current app.
  // The root path "/" redirects to "/{language}/wiki" (default language: en).
  // ---------------------------------------------------------------------------
  test('home redirects to /:lang/wiki', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(en|zh)\/wiki(\/|$|\?)/);
  });

  // ---------------------------------------------------------------------------
  // FIXME — depends on Lane 1 (frontend /landing-v2 page with Hero).
  // ---------------------------------------------------------------------------
  test.fixme('hero renders and CTA is visible', async ({ page }) => {
    // TODO(Lane 1): Update once /landing-v2 lands. Hero should be visible and
    // expose a primary CTA via an accessible role/name.
    await page.goto('/landing-v2');
    const hero = page.getByRole('heading', { level: 1 });
    await expect(hero).toBeVisible();
    const cta = page.getByRole('link', { name: /get started|start/i });
    await expect(cta).toBeVisible();
  });

  test.fixme('primary CTA navigates to /onboarding', async ({ page }) => {
    // TODO(Lane 1): Confirm CTA accessible name once Lane 1 ships.
    await page.goto('/landing-v2');
    const cta = page.getByRole('link', { name: /get started|start/i });
    await cta.click();
    await expect(page).toHaveURL(/\/onboarding(\/|$|\?)/);
  });

  // ---------------------------------------------------------------------------
  // FIXME — depends on Lane 1 (form UI) + Lane 2 (POST /api/newsletter).
  // ---------------------------------------------------------------------------
  test.fixme(
    'newsletter accepts valid email and shows confirmation',
    async ({ page }) => {
      // TODO(Lane 1+2): Update selectors once newsletter form lands.
      await page.goto('/landing-v2');
      const emailInput = page.getByRole('textbox', { name: /email/i });
      await emailInput.fill('e2e-test@example.com');
      const submit = page.getByRole('button', { name: /subscribe|sign up/i });
      await submit.click();
      const confirmation = page.getByText(
        /thanks|subscribed|check your inbox/i,
      );
      await expect(confirmation).toBeVisible();
    },
  );

  test.fixme(
    'newsletter rejects honeypot bot submission',
    async ({ page }) => {
      // TODO(Lane 1+2): The honeypot field is expected to be a hidden input
      // (e.g. name="company"). Filling it should cause the API to silently
      // reject the submission without showing a success confirmation.
      await page.goto('/landing-v2');
      const emailInput = page.getByRole('textbox', { name: /email/i });
      await emailInput.fill('bot@example.com');
      const honeypot = page.locator('input[name="company"]');
      await honeypot.fill('Acme Spam Co');
      const submit = page.getByRole('button', { name: /subscribe|sign up/i });
      await submit.click();
      const confirmation = page.getByText(
        /thanks|subscribed|check your inbox/i,
      );
      await expect(confirmation).toHaveCount(0);
    },
  );
});
