// INPUT: Playwright test API + mocked auth/entitlement/Airwallex API routes.
// OUTPUT: E2E coverage for registration -> eligible Pro trial CTA -> Airwallex trial checkout redirect.
// POS: Manual Pro trial activation E2E. Verifies the browser path without touching real Airwallex.

import { expect, test, type Page, type Route } from "@playwright/test";

const E2E_EMAIL = "manual-pro-trial-e2e@example.com";
const E2E_PASSWORD = "ValidPass123";
const E2E_NAME = "Manual Trial E2E";
const CHECKOUT_PATH = "/mock-airwallex-checkout?trial=1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-device-fingerprint, x-user-timezone",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const registeredUser = {
  id: "usr_manual_pro_trial_e2e",
  email: E2E_EMAIL,
  name: E2E_NAME,
  provider: "email",
  emailVerified: true,
  preferences: { theme: "dark", language: "en" },
};

const freeEligibleEntitlements = {
  isLoggedIn: true,
  isSubscriber: false,
  isTrialing: false,
  trialEndsAt: null,
  isFirstDiscountEligible: false,
  proTrial: { eligible: true, days: 7 },
  credits: 0,
  discount: 0,
  ask: { freeLeft: 3, subscriptionLeft: 0, purchasedLeft: 0, totalLeft: 3, resetAt: "" },
  synastry: { freeLeft: 3, subscriptionLeft: 0, totalLeft: 3, resetAt: "" },
  synthetica: { freeLeft: 3, subscriptionLeft: 0, purchasedLeft: 0, totalLeft: 3, resetAt: "" },
  purchasedFeatures: {
    dimensions: [],
    coreThemes: [],
    synastryHashes: [],
    details: [],
  },
  monthlyUnlocked: { cbtStats: false },
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  if (route.request().method() === "OPTIONS") {
    await route.fulfill({ status: 204, headers: corsHeaders });
    return;
  }

  await route.fulfill({
    status,
    contentType: "application/json",
    headers: corsHeaders,
    body: JSON.stringify(body),
  });
}

async function stubManualTrialApis(page: Page) {
  const observed: {
    registrationBody?: Record<string, unknown>;
    trialBody?: Record<string, unknown>;
    trialAuthHeader?: string | null;
    normalSubscribeCalled: boolean;
  } = {
    normalSubscribeCalled: false,
  };

  await page.route("**/api/auth/register", async (route) => {
    if (route.request().method() !== "OPTIONS") {
      observed.registrationBody = JSON.parse(route.request().postData() || "{}");
    }

    await fulfillJson(route, {
      success: true,
      tokens: {
        accessToken: "e2e-access-token",
        refreshToken: "e2e-refresh-token",
        expiresIn: 3600,
      },
      user: registeredUser,
    });
  });

  await page.route("**/api/auth/me", async (route) => {
    await fulfillJson(route, registeredUser);
  });

  await page.route("**/api/entitlements/v2**", async (route) => {
    await fulfillJson(route, freeEligibleEntitlements);
  });

  await page.route("**/api/airwallex/pricing**", async (route) => {
    await fulfillJson(route, {
      currency: "USD",
      subscription: {
        monthly: { amount: 699, currency: "USD" },
        yearly: { amount: 4199, currency: "USD" },
        firstDiscount: {
          rate: 0.5,
          monthly: { amount: 349, currency: "USD" },
          yearly: { amount: 2099, currency: "USD" },
        },
      },
      credits: [],
    });
  });

  await page.route("**/api/airwallex/start-pro-trial", async (route) => {
    if (route.request().method() !== "OPTIONS") {
      observed.trialBody = JSON.parse(route.request().postData() || "{}");
      observed.trialAuthHeader = route.request().headers().authorization || null;
    }

    await fulfillJson(route, {
      checkoutUrl: CHECKOUT_PATH,
      checkoutId: "chk_manual_trial_e2e",
      trialEndsAt: "2026-07-09T00:00:00.000Z",
      trialDays: 7,
    });
  });

  await page.route("**/api/airwallex/subscribe", async (route) => {
    if (route.request().method() !== "OPTIONS") {
      observed.normalSubscribeCalled = true;
    }
    await fulfillJson(route, { error: "normal checkout should not be used" }, 500);
  });

  return observed;
}

test.describe("manual Airwallex Pro trial activation", () => {
  test("newly registered eligible user starts Pro trial through payment-info checkout", async ({
    page,
  }) => {
    const observed = await stubManualTrialApis(page);
    await page.addInitScript(() => {
      localStorage.setItem("astro_lang", "en");
      localStorage.setItem("astro_analytics_consent", "denied");
      localStorage.setItem(
        "astro_consent_preferences",
        JSON.stringify({ essential: true, analytics: false, marketing: false }),
      );
    });

    await page.goto("/auth");
    await page
      .getByRole("button", { name: /don't have an account\? sign up/i })
      .click();
    await page.getByLabel(/name/i).fill(E2E_NAME);
    await page.getByLabel(/email/i).fill(E2E_EMAIL);
    await page.getByLabel(/^password$/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /^sign up$/i }).click();

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("astro_access_token")))
      .toBe("e2e-access-token");
    expect(observed.registrationBody).toMatchObject({
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
      name: E2E_NAME,
    });

    await page.goto("/en/pricing");
    await page.getByRole("button", { name: /^go pro$/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("7-day trial", { exact: true })).toBeVisible();
    await expect(
      dialog.getByText(
        /payment information is required\. after 7 days, the selected plan renews automatically at \$41\.99 unless cancelled\./i,
      ),
    ).toBeVisible();

    const trialRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/airwallex/start-pro-trial") &&
        request.method() === "POST",
    );
    await dialog
      .getByRole("button", { name: /start 7-day pro trial/i })
      .click();
    await trialRequest;
    await expect(page).toHaveURL(/\/mock-airwallex-checkout\?trial=1$/);

    expect(observed.trialBody).toMatchObject({
      plan: "yearly",
      lang: "en",
    });
    expect(String(observed.trialBody?.successUrl)).toMatch(/\/payment\/success$/);
    expect(String(observed.trialBody?.cancelUrl)).toMatch(/\/en\/pricing/);
    expect(observed.trialAuthHeader).toBe("Bearer e2e-access-token");
    expect(observed.normalSubscribeCalled).toBe(false);

    const checkoutSession = await page.evaluate(() => ({
      id: sessionStorage.getItem("aw_checkout_id"),
      kind: sessionStorage.getItem("aw_checkout_kind"),
      renewal: sessionStorage.getItem("aw_renewal_id"),
    }));
    expect(checkoutSession).toEqual({
      id: "chk_manual_trial_e2e",
      kind: "pro_trial",
      renewal: null,
    });
  });
});
