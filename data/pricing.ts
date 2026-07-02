// INPUT: None — static display constants that mirror backend AIRWALLEX_SUBSCRIPTION_PRICING / AIRWALLEX_CREDITS_PACKAGES.
// OUTPUT: SUBSCRIPTION_DISPLAY_PRICING, CREDIT_PACKS_DISPLAY, pricing meta constants, formatDisplayPrice/displayCurrencyFor.
// POS: Single frontend source for the PRICE TEXT shown on the public /:lang/pricing page (static-first render, no API on first paint). Amounts MUST stay in sync with backend/src/config/airwallex.ts; tests/unit/pricing-consistency.test.ts guards drift. On price change, update airwallex.ts + docs/PRD.md §3 + here. Update data/FOLDER.md if this file's role changes.

export type DisplayCurrency = "USD" | "CNY";

export interface DisplayAmount {
  /** Minor units (cents for USD, fen for CNY). */
  amount: number;
  currency: DisplayCurrency;
}

export interface SubscriptionDisplay {
  monthly: DisplayAmount;
  yearly: DisplayAmount;
}

// en → USD, zh → CNY. Mirrors the lang→currency default in
// backend/src/config/airwallex.ts (resolveCurrency) and the UpgradeModal
// fallback amounts. EUR/GBP are resolved from real request signals at
// checkout; the marketing page shows the language default.
export const SUBSCRIPTION_DISPLAY_PRICING: Record<
  "en" | "zh",
  SubscriptionDisplay
> = {
  en: {
    monthly: { amount: 699, currency: "USD" }, // $6.99
    yearly: { amount: 4199, currency: "USD" }, // $41.99 (save 50%)
  },
  zh: {
    monthly: { amount: 4900, currency: "CNY" }, // ¥49
    yearly: { amount: 29400, currency: "CNY" }, // ¥294 (save 50%)
  },
};

/** Yearly plan saving vs 12× monthly. */
export const YEARLY_SAVE_PERCENT = 50;
/** First-subscription discount for eligible users who do not take the Pro trial. */
export const FIRST_DISCOUNT_PERCENT = 50;
/** Manual Pro trial length after Airwallex payment setup. */
export const TRIAL_DAYS = 7;

export interface CreditPackDisplay {
  credits: number;
  /** Minor units. */
  usd: number;
  /** Minor units. */
  cny: number;
  /** Headline saving vs the Starter pack, when applicable. */
  savePercent?: number;
}

// Mirrors AIRWALLEX_CREDITS_PACKAGES (USD/CNY columns).
export const CREDIT_PACKS_DISPLAY: CreditPackDisplay[] = [
  { credits: 100, usd: 499, cny: 3400 },
  { credits: 300, usd: 1249, cny: 8400, savePercent: 17 },
  { credits: 500, usd: 1999, cny: 13400, savePercent: 20 },
  { credits: 1000, usd: 3499, cny: 23400, savePercent: 30 },
];

const CURRENCY_SYMBOLS: Record<DisplayCurrency, string> = {
  USD: "$",
  CNY: "¥",
};

// Deterministic, locale-free formatter so the hydrated SPA render matches the
// prerendered SEO stub exactly (CNY renders whole-yuan, others 2 decimals).
// Mirrors backend formatPrice in airwallex.ts.
export const formatDisplayPrice = (
  amountMinor: number,
  currency: DisplayCurrency,
): string => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "$";
  const fractionDigits = currency === "CNY" ? 0 : 2;
  return `${symbol}${(amountMinor / 100).toFixed(fractionDigits)}`;
};

/** Display currency for the pricing page, by UI language. */
export const displayCurrencyFor = (lang: "en" | "zh"): DisplayCurrency =>
  lang === "zh" ? "CNY" : "USD";
