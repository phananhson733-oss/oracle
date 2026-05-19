// INPUT: Playwright test API + stubLanding helper.
// OUTPUT: 导出 BirthChart section 关键交互的 E2E 用例（错误分支、成功流程、表单校验）。
// POS: /landing-v2 落地页 Birth Chart 模块 E2E 用例集。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { expect, test } from "@playwright/test";
import { stubLanding } from "./_helpers/landing";

const FILL_DATE = "1990-06-15";
const FILL_CITY = "New York, USA";

test.describe("/landing-v2 — BirthChart submit flow", () => {
  test("400 LOCATION_UNRESOLVED renders mystic city error", async ({
    page,
  }) => {
    await stubLanding(page, {
      natal: (r) =>
        r.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Location not found",
            code: "LOCATION_UNRESOLVED",
          }),
        }),
    });

    await page.goto("/landing-v2");

    await page.locator("#bc-date").fill(FILL_DATE);
    await page.locator("#bc-city").fill("Atlantis");
    await page
      .getByRole("button", { name: /cast my chart|casting your chart/i })
      .click();

    const cityError = page.locator("#bc-city-error");
    await expect(cityError).toBeVisible();
    await expect(cityError).toHaveText(
      /couldn't find that place|specific name/i,
    );
  });

  test("503 GEOCODING_SERVICE_UNAVAILABLE shows service banner", async ({
    page,
  }) => {
    await stubLanding(page, {
      natal: (r) =>
        r.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Geocoding service unavailable",
            code: "GEOCODING_SERVICE_UNAVAILABLE",
          }),
        }),
    });

    await page.goto("/landing-v2");

    await page.locator("#bc-date").fill(FILL_DATE);
    await page.locator("#bc-city").fill(FILL_CITY);
    await page
      .getByRole("button", { name: /cast my chart|casting your chart/i })
      .click();

    const banner = page.getByRole("alert").filter({
      hasText:
        /location service is temporarily unavailable|try again in a moment/i,
    });
    await expect(banner.first()).toBeVisible();
  });

  test("generic 500 shows generic copy", async ({ page }) => {
    await stubLanding(page, {
      natal: (r) =>
        r.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal error" }),
        }),
    });

    await page.goto("/landing-v2");

    await page.locator("#bc-date").fill(FILL_DATE);
    await page.locator("#bc-city").fill(FILL_CITY);
    await page
      .getByRole("button", { name: /cast my chart|casting your chart/i })
      .click();

    const generic = page.getByRole("alert").filter({
      hasText: /something went wrong/i,
    });
    await expect(generic.first()).toBeVisible();
  });

  test("success 200 reveals 3 highlight cards and Save CTA navigates /onboarding", async ({
    page,
  }) => {
    const natalPayload = {
      positions: [
        {
          name: "Sun",
          sign: "Gemini",
          degree: 24,
          minute: 12,
          isRetrograde: false,
        },
        {
          name: "Moon",
          sign: "Pisces",
          degree: 8,
          minute: 45,
          isRetrograde: false,
        },
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

    await stubLanding(page, {
      natal: (r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          // Backend returns { chart: NatalFacts } — fetchNatalChart unwraps
          // data.chart, so the stub must mirror that envelope.
          body: JSON.stringify({ chart: natalPayload }),
        }),
    });

    await page.goto("/landing-v2");

    await page.locator("#bc-date").fill(FILL_DATE);
    await page.locator("#bc-city").fill(FILL_CITY);
    await page
      .getByRole("button", { name: /cast my chart|casting your chart/i })
      .click();

    // Three highlight cards (Sun, Moon, Rising) become visible after a successful render.
    const resultContainer = page.locator("#birth-chart-result");
    await expect(resultContainer).toBeVisible({ timeout: 10_000 });
    await expect(resultContainer.getByText("Gemini")).toBeVisible();
    await expect(resultContainer.getByText("Pisces")).toBeVisible();
    await expect(resultContainer.getByText("Leo")).toBeVisible();

    const saveCta = page.getByRole("button", {
      name: /save my chart/i,
    });
    await expect(saveCta).toBeVisible();
    await saveCta.click();
    await expect(page).toHaveURL(/\/onboarding(\/|$|\?)/);
  });

  test("validation: missing date shows inline alert", async ({ page }) => {
    await stubLanding(page);

    await page.goto("/landing-v2");

    // Leave date empty, fill city only, click submit.
    await page.locator("#bc-city").fill(FILL_CITY);
    // The submit button is reachable; the form uses noValidate so JS validation fires.
    await page
      .getByRole("button", { name: /cast my chart|casting your chart/i })
      .click();

    const alert = page.getByRole("alert").filter({
      hasText: /please enter your birth date/i,
    });
    await expect(alert.first()).toBeVisible();
  });

  test("validation: missing city shows inline alert", async ({ page }) => {
    await stubLanding(page);

    await page.goto("/landing-v2");

    await page.locator("#bc-date").fill(FILL_DATE);
    await page
      .getByRole("button", { name: /cast my chart|casting your chart/i })
      .click();

    const alert = page.getByRole("alert").filter({
      hasText: /please enter the city/i,
    });
    await expect(alert.first()).toBeVisible();
  });

  test("city autocomplete: keyboard ArrowDown + Enter selects a suggestion", async ({
    page,
  }) => {
    // The shared useCityAutocomplete hook owns the WAI-ARIA combobox keyboard
    // contract. This covers the regression we'd otherwise miss with the
    // pure-function unit tests in hooks/useCityAutocomplete.test.ts —
    // verifying that aria-activedescendant updates, that Enter commits the
    // active option into the input, and that the listbox closes after select.
    await stubLanding(page);

    await page.goto("/landing-v2");

    const cityInput = page.locator("#bc-city");
    // "Lon" matches London in the local cities index — keeps the spec
    // independent of network fallback and stable across data revisions.
    await cityInput.fill("Lon");
    // Wait for the debounced search to populate the listbox.
    const listbox = page.locator("#bc-city-listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option").first()).toBeVisible();

    // ArrowDown moves keyboard focus to the first option without moving DOM
    // focus off the input — aria-activedescendant must point at the option's id.
    await cityInput.press("ArrowDown");
    await expect(cityInput).toHaveAttribute(
      "aria-activedescendant",
      /^bc-city-option-0$/,
    );

    // Enter selects the active option, which closes the listbox and writes
    // the canonical display label (with country/admin1) into the input.
    await cityInput.press("Enter");
    await expect(listbox).toBeHidden();
    await expect(cityInput).not.toHaveValue("Lon");
    // London resolves to a label containing the city name (allow any locale).
    await expect(cityInput).toHaveValue(/London/i);
  });
});
