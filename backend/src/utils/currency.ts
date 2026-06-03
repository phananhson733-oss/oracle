// INPUT: Express Request（x-vercel-ip-country 头、Accept-Language 头、可选 currency query）+ SupportedCurrency 类型。
// OUTPUT: resolveCurrencyFromRequest(req) -> SupportedCurrency + countryToCurrency(cc) 国家→货币映射；纯函数无 I/O。
// POS: backend 货币解析共享工具，airwallex 计费按真实请求信号选币种；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { Request } from "express";
import type { SupportedCurrency } from "../config/airwallex.js";

// Eurozone ISO 3166-1 alpha-2 country codes (settle in EUR).
const EUROZONE_COUNTRIES: ReadonlySet<string> = new Set([
  "AT", // Austria
  "BE", // Belgium
  "HR", // Croatia
  "CY", // Cyprus
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PT", // Portugal
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
]);

const VALID_CURRENCIES: ReadonlySet<string> = new Set([
  "USD",
  "CNY",
  "EUR",
  "GBP",
]);

/**
 * Map an ISO 3166-1 alpha-2 country code to a settlement currency.
 * Eurozone -> EUR, GB -> GBP, CN -> CNY, everything else -> USD (default).
 */
export const countryToCurrency = (
  countryCode?: string | null,
): SupportedCurrency => {
  if (typeof countryCode !== "string" || countryCode.length === 0) return "USD";
  const cc = countryCode.trim().toUpperCase();
  if (cc === "GB") return "GBP";
  if (cc === "CN") return "CNY";
  if (EUROZONE_COUNTRIES.has(cc)) return "EUR";
  return "USD";
};

/**
 * Extract the first region subtag (e.g. "de-DE" -> "DE") from an Accept-Language
 * header and map it to a currency. Returns null when no usable region is found.
 */
const currencyFromAcceptLanguage = (
  header?: string | null,
): SupportedCurrency | null => {
  if (typeof header !== "string" || header.length === 0) return null;
  // Take the highest-priority language tag (before the first comma / quality marker).
  const firstTag = header.split(",")[0]?.trim() ?? "";
  const parts = firstTag.split("-");
  if (parts.length < 2) return null; // No region subtag (e.g. plain "en").
  const region = parts[1]?.split(";")[0]?.trim();
  if (!region) return null;
  const currency = countryToCurrency(region);
  // Only treat the header as a signal when it maps to a non-default currency;
  // a region like "fr-CA" should fall through to USD via the caller's default.
  return currency;
};

const normalizeOverride = (value: unknown): SupportedCurrency | null => {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  return VALID_CURRENCIES.has(upper) ? (upper as SupportedCurrency) : null;
};

/**
 * Resolve the settlement currency for a request from real signals, in order:
 *   1. Explicit ?currency= override (when valid).
 *   2. Vercel-injected x-vercel-ip-country header (IP geolocation).
 *   3. Accept-Language region subtag.
 *   4. USD default.
 */
export const resolveCurrencyFromRequest = (req: Request): SupportedCurrency => {
  // 1. Explicit override (lets the client force a currency, e.g. a manual switcher).
  const override = normalizeOverride(req.query?.currency);
  if (override) return override;

  // 2. IP-based country (most reliable signal Vercel provides).
  const country = req.headers["x-vercel-ip-country"];
  const countryCode = Array.isArray(country) ? country[0] : country;
  if (typeof countryCode === "string" && countryCode.length > 0) {
    return countryToCurrency(countryCode);
  }

  // 3. Accept-Language region fallback.
  const acceptLanguage = req.headers["accept-language"];
  const header = Array.isArray(acceptLanguage)
    ? acceptLanguage[0]
    : acceptLanguage;
  const fromLang = currencyFromAcceptLanguage(header);
  if (fromLang) return fromLang;

  // 4. Default.
  return "USD";
};
