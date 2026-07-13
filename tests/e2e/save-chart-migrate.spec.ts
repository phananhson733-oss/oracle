// INPUT: Playwright test API + stubLanding helper.
// OUTPUT: 导出 save-chart -> login -> migrate 续接流程的 E2E 用例（golden path +
//         未登录边界：关闭弹窗不写 localStorage 盘数据 / dashboard 无继承盘）。
// POS: backlog #7 free-chart save->login->migrate E2E 用例集。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
//
// ⚠️ 运行前置（CI / 手动跑，默认 fixme 跳过）：
//   - dev server（npm run dev，端口 3000）
//   - backend（/api/auth/* 真实可用，含 login + /auth/migrate）
//   - 一个可登录的测试账号（见下方 TEST_EMAIL / TEST_PASSWORD env）
// golden path 需要真实鉴权会话，无法在 stub 黑盒里跑通，故整组 describe 用
// test.fixme() 标注，待全栈 fixture 接入后由 #7 后续 lane 去掉 fixme。
// 未登录边界用例（不写 localStorage 盘 / dashboard 无继承盘）不依赖鉴权，
// 但与 golden path 同组保持，统一在全栈环境下验收。

import { expect, test } from "@playwright/test";
import {
  fillLandingBirthDate,
  revealLandingSection,
  stubLanding,
} from "./_helpers/landing";

const FILL_DATE = "1990-06-15";
const FILL_CITY = "New York, USA";

// Seeded test account for the authenticated golden path. Supplied via env so
// no credentials are committed. Empty defaults keep the spec importable when
// unset; the fixme guard prevents it from actually running without them.
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "";

const natalPayload = {
  positions: [
    { name: "Sun", sign: "Gemini", degree: 24, minute: 12, isRetrograde: false },
    { name: "Moon", sign: "Pisces", degree: 8, minute: 45, isRetrograde: false },
    {
      name: "Ascendant",
      sign: "Leo",
      degree: 15,
      minute: 30,
      isRetrograde: false,
    },
  ],
  aspects: [],
  dominance: {
    elements: { fire: 1, earth: 0, air: 1, water: 1 },
    modalities: { cardinal: 0, fixed: 1, mutable: 2 },
  },
  houseCusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
};

// Cast an anonymous chart on /landing-v2 and click "Save my chart" to reach
// the onboarding handoff. Shared by golden-path and boundary specs.
async function castAndSave(page: import("@playwright/test").Page) {
  await page.goto("/landing-v2");
  await revealLandingSection(page, "birth-chart-tool");
  // Include the optional name so the onboarding prefill is complete and can
  // immediately reach the save_chart auth handoff this suite is exercising.
  await page.locator("#bc-name").fill("E2E User");
  await fillLandingBirthDate(page, FILL_DATE);
  await page.locator("#bc-city").fill(FILL_CITY);
  await page
    .getByRole("button", { name: /cast my chart|casting your chart/i })
    .click();

  const resultContainer = page.locator("#birth-chart-result");
  await expect(resultContainer).toBeVisible({ timeout: 10_000 });

  const saveCta = page.getByRole("button", { name: /save my chart/i });
  await expect(saveCta).toBeVisible();
  await saveCta.click();
  await expect(page).toHaveURL(/\/onboarding(\/|$|\?)/);
}

test.describe.fixme(
  "save-chart -> login -> migrate resume (requires full stack + seeded user)",
  () => {
    test("golden path: login in the save_chart modal lands /dashboard with the chart, no second entry", async ({
      page,
    }) => {
      // The /natal/chart stub keeps the cast deterministic; auth + migrate hit
      // the REAL backend, which is why this group is fixme until a full-stack
      // fixture exists.
      await stubLanding(page, {
        natal: (r) =>
          r.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ chart: natalPayload }),
          }),
      });

      await castAndSave(page);

      // Onboarding auto-completes (date + city already prefilled) and, while
      // anonymous, fires the save_chart login modal instead of saving.
      const loginModal = page.getByRole("dialog");
      await expect(loginModal).toBeVisible();

      // Sign in with the seeded account inside the modal.
      await loginModal.getByLabel(/email/i).fill(TEST_EMAIL);
      await loginModal.getByLabel(/password/i).fill(TEST_PASSWORD);
      await loginModal
        .getByRole("button", { name: /sign in|log in/i })
        .click();

      // Resume effect migrates the in-memory chart to the cloud and lands
      // /dashboard — WITHOUT routing back through onboarding (no re-entry).
      await expect(page).toHaveURL(/\/dashboard(\/|$|\?)/, { timeout: 15_000 });
      await expect(page).not.toHaveURL(/\/onboarding/);

      // The migrated chart is visible on the dashboard (Gemini Sun from the
      // cast payload above).
      await expect(page.getByText("Gemini")).toBeVisible({ timeout: 15_000 });

      // The resume marks the migration so the legacy localStorage prompt
      // doesn't also fire.
      const migrated = await page.evaluate(() =>
        localStorage.getItem("astro_profile_migrated"),
      );
      expect(migrated).toBe("1");
    });
  },
);

test.describe(
  "save-chart anonymous boundary (2026-05-20 invariant: zero localStorage chart writes)",
  () => {
    test("closing the login modal without signing in writes NO chart to localStorage", async ({
      page,
    }) => {
      await stubLanding(page, {
        natal: (r) =>
          r.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ chart: natalPayload }),
          }),
      });

      await castAndSave(page);

      // The save_chart login modal appears. Dismiss it without authenticating.
      const loginModal = page.getByRole("dialog");
      await expect(loginModal).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(loginModal).toBeHidden();

      // INVARIANT: no chart data may be persisted to localStorage while the
      // visitor is anonymous — not under astro_user nor any guest namespace.
      const leaked = await page.evaluate(({ fillDate, city }) => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (!key) continue;
          const value = localStorage.getItem(key) || "";
          // Flag any key whose value smells like the cast birth chart: the
          // birth date / city we typed must never reach localStorage.
          if (value.includes(fillDate) || value.includes(city)) {
            keys.push(key);
          }
        }
        return keys;
      }, { fillDate: FILL_DATE, city: "New York" });
      expect(leaked).toEqual([]);

      // Specifically, the legacy migration source key must be absent.
      const astroUser = await page.evaluate(() =>
        localStorage.getItem("astro_user"),
      );
      expect(astroUser).toBeNull();
    });

    test("an anonymous visitor visiting /dashboard does NOT inherit a cast chart", async ({
      page,
    }) => {
      await stubLanding(page, {
        natal: (r) =>
          r.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ chart: natalPayload }),
          }),
      });

      await castAndSave(page);

      // Dismiss the login modal, then navigate to a protected route directly.
      await page.keyboard.press("Escape");
      await page.goto("/dashboard");

      // ProtectedRedirect must NOT render a populated dashboard for an
      // unauthenticated visitor whose chart only ever lived in router state.
      await expect(page).not.toHaveURL(/\/dashboard$/);
    });
  },
);
