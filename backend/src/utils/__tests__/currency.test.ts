// INPUT: 待测的 backend/src/utils/currency.ts 货币解析器与 backend/src/config/airwallex.ts 的 4 币种 price 块。
// OUTPUT: resolveCurrencyFromRequest 单测（国家头→货币、Accept-Language 兜底、USD 默认）+ price 块覆盖断言。
// POS: backend utils 单测；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { resolveCurrencyFromRequest, countryToCurrency } from "../currency.js";
import {
  AIRWALLEX_SUBSCRIPTION_PRICING,
  AIRWALLEX_CREDITS_PACKAGES,
  resolveCurrency,
  type SupportedCurrency,
} from "../../config/airwallex.js";

// Build a minimal Request-like object for the resolver under test.
function mockRequest(
  headers: Record<string, string | undefined>,
  query: Record<string, string> = {},
): Request {
  const lowered: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(headers)) {
    lowered[k.toLowerCase()] = v;
  }
  return {
    headers: lowered,
    query,
    get(name: string) {
      return lowered[name.toLowerCase()];
    },
  } as unknown as Request;
}

describe("countryToCurrency", () => {
  it("maps eurozone countries to EUR", () => {
    for (const cc of [
      "DE",
      "FR",
      "ES",
      "IT",
      "NL",
      "IE",
      "AT",
      "BE",
      "PT",
      "FI",
      "GR",
    ]) {
      expect(countryToCurrency(cc)).toBe("EUR");
    }
  });

  it("maps GB to GBP", () => {
    expect(countryToCurrency("GB")).toBe("GBP");
  });

  it("maps CN to CNY", () => {
    expect(countryToCurrency("CN")).toBe("CNY");
  });

  it("defaults unknown/other countries to USD", () => {
    expect(countryToCurrency("US")).toBe("USD");
    expect(countryToCurrency("JP")).toBe("USD");
    expect(countryToCurrency("XX")).toBe("USD");
    expect(countryToCurrency("")).toBe("USD");
  });

  it("is case-insensitive on country code", () => {
    expect(countryToCurrency("de")).toBe("EUR");
    expect(countryToCurrency("gb")).toBe("GBP");
    expect(countryToCurrency("cn")).toBe("CNY");
  });
});

describe("resolveCurrencyFromRequest", () => {
  it("prefers x-vercel-ip-country header (EUR)", () => {
    const req = mockRequest({
      "x-vercel-ip-country": "FR",
      "accept-language": "en-US",
    });
    expect(resolveCurrencyFromRequest(req)).toBe("EUR");
  });

  it("prefers x-vercel-ip-country header (GBP)", () => {
    const req = mockRequest({ "x-vercel-ip-country": "GB" });
    expect(resolveCurrencyFromRequest(req)).toBe("GBP");
  });

  it("country header takes precedence over Accept-Language", () => {
    // German browser language but UK IP -> GBP (IP wins)
    const req = mockRequest({
      "x-vercel-ip-country": "GB",
      "accept-language": "de-DE,de;q=0.9",
    });
    expect(resolveCurrencyFromRequest(req)).toBe("GBP");
  });

  it("falls back to Accept-Language region when no country header", () => {
    const req = mockRequest({ "accept-language": "de-DE,de;q=0.9,en;q=0.8" });
    expect(resolveCurrencyFromRequest(req)).toBe("EUR");
  });

  it("parses GB region from Accept-Language", () => {
    const req = mockRequest({ "accept-language": "en-GB,en;q=0.9" });
    expect(resolveCurrencyFromRequest(req)).toBe("GBP");
  });

  it("parses CN region from Accept-Language", () => {
    const req = mockRequest({ "accept-language": "zh-CN,zh;q=0.9" });
    expect(resolveCurrencyFromRequest(req)).toBe("CNY");
  });

  it("defaults to USD when no signals present", () => {
    const req = mockRequest({});
    expect(resolveCurrencyFromRequest(req)).toBe("USD");
  });

  it("defaults to USD for a US IP", () => {
    const req = mockRequest({ "x-vercel-ip-country": "US" });
    expect(resolveCurrencyFromRequest(req)).toBe("USD");
  });

  it("defaults to USD for unknown Accept-Language region", () => {
    const req = mockRequest({ "accept-language": "fr-CA,fr;q=0.9" }); // Canada -> USD default
    expect(resolveCurrencyFromRequest(req)).toBe("USD");
  });

  it("ignores Accept-Language without a region subtag", () => {
    const req = mockRequest({ "accept-language": "en" });
    expect(resolveCurrencyFromRequest(req)).toBe("USD");
  });

  it("honors explicit currency override query param when valid", () => {
    const req = mockRequest(
      { "x-vercel-ip-country": "US" },
      { currency: "EUR" },
    );
    expect(resolveCurrencyFromRequest(req)).toBe("EUR");
  });

  it("ignores invalid currency override query param", () => {
    const req = mockRequest(
      { "x-vercel-ip-country": "GB" },
      { currency: "JPY" },
    );
    expect(resolveCurrencyFromRequest(req)).toBe("GBP");
  });
});

describe("resolveCurrency (legacy lang-based, backward compat)", () => {
  it("still maps zh -> CNY and others -> USD", () => {
    expect(resolveCurrency("zh")).toBe("CNY");
    expect(resolveCurrency("en")).toBe("USD");
    expect(resolveCurrency(undefined)).toBe("USD");
  });
});

describe("AIRWALLEX_SUBSCRIPTION_PRICING covers 4 currencies", () => {
  const keys: Array<keyof typeof AIRWALLEX_SUBSCRIPTION_PRICING> = [
    "usd",
    "cny",
    "eur",
    "gbp",
  ];

  it("has usd/cny/eur/gbp tiers with monthly+yearly amounts", () => {
    for (const key of keys) {
      const tier = AIRWALLEX_SUBSCRIPTION_PRICING[key];
      expect(tier).toBeDefined();
      expect(tier.monthly.amount).toBeGreaterThan(0);
      expect(tier.yearly.amount).toBeGreaterThan(0);
    }
  });

  it("uses the correct ISO currency code per tier", () => {
    expect(AIRWALLEX_SUBSCRIPTION_PRICING.usd.monthly.currency).toBe("USD");
    expect(AIRWALLEX_SUBSCRIPTION_PRICING.cny.monthly.currency).toBe("CNY");
    expect(AIRWALLEX_SUBSCRIPTION_PRICING.eur.monthly.currency).toBe("EUR");
    expect(AIRWALLEX_SUBSCRIPTION_PRICING.gbp.monthly.currency).toBe("GBP");
  });
});

describe("AIRWALLEX_CREDITS_PACKAGES covers 4 currencies", () => {
  it("every package has usd/cny/eur/gbp price blocks", () => {
    for (const pkg of Object.values(AIRWALLEX_CREDITS_PACKAGES)) {
      expect(pkg.usd.amount).toBeGreaterThan(0);
      expect(pkg.cny.amount).toBeGreaterThan(0);
      expect(pkg.eur.amount).toBeGreaterThan(0);
      expect(pkg.gbp.amount).toBeGreaterThan(0);
      expect(pkg.usd.currency).toBe("USD");
      expect(pkg.cny.currency).toBe("CNY");
      expect(pkg.eur.currency).toBe("EUR");
      expect(pkg.gbp.currency).toBe("GBP");
    }
  });
});

// Type-level guard: SupportedCurrency must include all 4 codes.
const _currencyCoverage: Record<SupportedCurrency, true> = {
  USD: true,
  CNY: true,
  EUR: true,
  GBP: true,
};
void _currencyCoverage;
