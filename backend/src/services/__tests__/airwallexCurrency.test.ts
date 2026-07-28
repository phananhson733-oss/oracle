// INPUT: 待测的 backend/src/services/airwallexService.ts 货币键解析与 price ID 缺失 fallback。
// OUTPUT: currencyKeyOf / resolvePriceIdWithFallback 单测（4 币种查表 + EUR/GBP price ID 缺失→USD 兜底 + warn）。
// POS: backend services 单测；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  currencyKeyOf,
  resolvePriceIdWithFallback,
  airwallexService,
} from "../airwallexService.js";
import {
  AIRWALLEX_SUBSCRIPTION_PRICING,
  AIRWALLEX_CREDITS_PACKAGES,
  type SupportedCurrency,
} from "../../config/airwallex.js";

describe("currencyKeyOf", () => {
  it("lowercases each supported currency to its price-block key", () => {
    expect(currencyKeyOf("USD")).toBe("usd");
    expect(currencyKeyOf("CNY")).toBe("cny");
    expect(currencyKeyOf("EUR")).toBe("eur");
    expect(currencyKeyOf("GBP")).toBe("gbp");
  });

  it("falls back to usd for unexpected input", () => {
    expect(currencyKeyOf("JPY" as SupportedCurrency)).toBe("usd");
    expect(currencyKeyOf(undefined as unknown as SupportedCurrency)).toBe(
      "usd",
    );
  });
});

describe("resolvePriceIdWithFallback", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  const prices = {
    monthly_usd: "px_monthly_usd",
    yearly_usd: "px_yearly_usd",
    monthly_first_usd: "px_monthly_first_usd",
    yearly_first_usd: "px_yearly_first_usd",
    monthly_cny: "px_monthly_cny",
    yearly_cny: "px_yearly_cny",
    monthly_eur: "", // EUR not yet configured in dashboard
    yearly_eur: "",
    monthly_gbp: "", // GBP not yet configured in dashboard
    yearly_gbp: "",
  } as Record<string, string>;

  it("returns the EUR price ID when configured", () => {
    const configured = { ...prices, monthly_eur: "px_monthly_eur" };
    const result = resolvePriceIdWithFallback(
      configured,
      "EUR",
      "monthly",
      false,
    );
    expect(result.priceId).toBe("px_monthly_eur");
    expect(result.fellBackToUsd).toBe(false);
  });

  it("falls back to USD price ID + warns when EUR price ID missing (no fabricated amount)", () => {
    const result = resolvePriceIdWithFallback(prices, "EUR", "monthly", false);
    expect(result.priceId).toBe("px_monthly_usd");
    expect(result.fellBackToUsd).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("falls back to USD price ID + warns when GBP yearly price ID missing", () => {
    const result = resolvePriceIdWithFallback(prices, "GBP", "yearly", false);
    expect(result.priceId).toBe("px_yearly_usd");
    expect(result.fellBackToUsd).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("CNY uses its own configured price ID (no fallback)", () => {
    const result = resolvePriceIdWithFallback(prices, "CNY", "monthly", false);
    expect(result.priceId).toBe("px_monthly_cny");
    expect(result.fellBackToUsd).toBe(false);
  });

  it("first-discount EUR missing falls back to USD first-discount, then base USD", () => {
    // No EUR first price, no EUR base, no USD first either -> base USD
    const sparse = {
      monthly_usd: "px_monthly_usd",
      yearly_usd: "px_yearly_usd",
    } as Record<string, string>;
    const result = resolvePriceIdWithFallback(sparse, "EUR", "monthly", true);
    expect(result.priceId).toBe("px_monthly_usd");
    expect(result.fellBackToUsd).toBe(true);
  });

  it("uses USD first-discount price when available for an unconfigured currency", () => {
    const withUsdFirst = {
      ...prices,
      monthly_first_usd: "px_monthly_first_usd",
    };
    const result = resolvePriceIdWithFallback(
      withUsdFirst,
      "GBP",
      "monthly",
      true,
    );
    expect(result.priceId).toBe("px_monthly_first_usd");
    expect(result.fellBackToUsd).toBe(true);
    expect(result.usedFirstDiscount).toBe(true);
  });

  it("throws when even USD base price is unconfigured", () => {
    expect(() =>
      resolvePriceIdWithFallback({}, "EUR", "monthly", false),
    ).toThrow();
  });
});

describe("airwallexService.getPricing returns per-currency amounts", () => {
  const cases: Array<{
    currency: SupportedCurrency;
    key: "usd" | "cny" | "eur" | "gbp";
  }> = [
    { currency: "USD", key: "usd" },
    { currency: "CNY", key: "cny" },
    { currency: "EUR", key: "eur" },
    { currency: "GBP", key: "gbp" },
  ];

  for (const { currency, key } of cases) {
    it(`returns ${currency} subscription + credits amounts`, () => {
      const pricing = airwallexService.getPricing(currency);
      expect(pricing.currency).toBe(currency);
      expect(pricing.subscription.monthly.amount).toBe(
        AIRWALLEX_SUBSCRIPTION_PRICING[key].monthly.amount,
      );
      expect(pricing.subscription.monthly.currency).toBe(currency);
      expect(pricing.subscription.yearly.amount).toBe(
        AIRWALLEX_SUBSCRIPTION_PRICING[key].yearly.amount,
      );

      // Every credits package reports the currency-specific amount.
      const expectedFirst = AIRWALLEX_CREDITS_PACKAGES.credits_100[key].amount;
      const firstPkg = pricing.credits.find((c) => c.id === "credits_100");
      expect(firstPkg?.amount).toBe(expectedFirst);
      expect(firstPkg?.currency).toBe(currency);
    });
  }
});
