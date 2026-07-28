// Airwallex configuration for global payment collection
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import path from 'path';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
];
envPaths.forEach((p) => dotenv.config({ path: p }));

// Helper: read env var with trim (Vercel CLI may inject trailing newlines)
const env = (key: string, fallback = ''): string => (process.env[key] || fallback).trim();

// Airwallex API credentials
const airwallexClientId = env('AIRWALLEX_CLIENT_ID');
const airwallexApiKey = env('AIRWALLEX_API_KEY');
const airwallexWebhookSecret = env('AIRWALLEX_WEBHOOK_SECRET');
const airwallexEnv = env('AIRWALLEX_ENVIRONMENT', env('AIRWALLEX_ENV', 'demo')) as 'demo' | 'production';

// Airwallex API Base URL
export const AIRWALLEX_API_BASE = airwallexEnv === 'production'
  ? 'https://api.airwallex.com'
  : 'https://api-demo.airwallex.com';

export const AIRWALLEX_ENV = airwallexEnv;

// Check if Airwallex is configured
export const isAirwallexConfigured = (): boolean => {
  return !!(airwallexClientId && airwallexApiKey);
};

// Airwallex credentials
export const AIRWALLEX_CREDENTIALS = {
  clientId: airwallexClientId,
  apiKey: airwallexApiKey,
  webhookSecret: airwallexWebhookSecret,
  env: airwallexEnv,
  legalEntityId: env('AIRWALLEX_LEGAL_ENTITY_ID'),
  paymentAccountId: env('AIRWALLEX_PAYMENT_ACCOUNT_ID'),
};

// Subscription price IDs (created in Airwallex Dashboard)
// EUR/GBP price IDs are read here but may be unset until configured in the
// Airwallex dashboard; airwallexService falls back to USD price IDs in that case
// (it never fabricates an amount — see resolvePriceIdWithFallback).
export const AIRWALLEX_PRICES = {
  // USD prices
  monthly_usd: env('AIRWALLEX_PRICE_MONTHLY_USD'),
  yearly_usd: env('AIRWALLEX_PRICE_YEARLY_USD'),
  monthly_first_usd: env('AIRWALLEX_PRICE_MONTHLY_FIRST_USD'),
  yearly_first_usd: env('AIRWALLEX_PRICE_YEARLY_FIRST_USD'),
  // CNY prices
  monthly_cny: env('AIRWALLEX_PRICE_MONTHLY_CNY'),
  yearly_cny: env('AIRWALLEX_PRICE_YEARLY_CNY'),
  monthly_first_cny: env('AIRWALLEX_PRICE_MONTHLY_FIRST_CNY'),
  yearly_first_cny: env('AIRWALLEX_PRICE_YEARLY_FIRST_CNY'),
  // EUR prices (configure in Airwallex dashboard; falls back to USD until set)
  monthly_eur: env('AIRWALLEX_PRICE_MONTHLY_EUR'),
  yearly_eur: env('AIRWALLEX_PRICE_YEARLY_EUR'),
  monthly_first_eur: env('AIRWALLEX_PRICE_MONTHLY_FIRST_EUR'),
  yearly_first_eur: env('AIRWALLEX_PRICE_YEARLY_FIRST_EUR'),
  // GBP prices (configure in Airwallex dashboard; falls back to USD until set)
  monthly_gbp: env('AIRWALLEX_PRICE_MONTHLY_GBP'),
  yearly_gbp: env('AIRWALLEX_PRICE_YEARLY_GBP'),
  monthly_first_gbp: env('AIRWALLEX_PRICE_MONTHLY_FIRST_GBP'),
  yearly_first_gbp: env('AIRWALLEX_PRICE_YEARLY_FIRST_GBP'),
};

// Product IDs
export const AIRWALLEX_PRODUCTS = {
  subscription: env('AIRWALLEX_PRODUCT_SUBSCRIPTION'),
};

// Subscription pricing (minor units: cents / 分 / pence)
// EUR/GBP amounts here drive the pricing API response and email receipts; the
// actual charge is governed by the Airwallex price ID (subscriptions) or the
// PaymentIntent amount (renewals). When an EUR/GBP price ID is unset, the
// service charges via the USD price ID — it never fabricates a charge amount.
export const AIRWALLEX_SUBSCRIPTION_PRICING = {
  usd: {
    monthly: { amount: 699, currency: 'USD' as const },  // $6.99
    yearly: { amount: 4199, currency: 'USD' as const },   // $41.99 (save 50%)
  },
  cny: {
    monthly: { amount: 4900, currency: 'CNY' as const },  // ¥49
    yearly: { amount: 29400, currency: 'CNY' as const },   // ¥294 (save 50%)
  },
  eur: {
    monthly: { amount: 699, currency: 'EUR' as const },  // €6.99
    yearly: { amount: 4199, currency: 'EUR' as const },   // €41.99 (save 50%)
  },
  gbp: {
    monthly: { amount: 599, currency: 'GBP' as const },  // £5.99
    yearly: { amount: 3599, currency: 'GBP' as const },   // £35.99 (save 50%)
  },
};

// First-time discount rate
export const AIRWALLEX_FIRST_DISCOUNT_RATE = 0.5; // 50% off

// Credits packages (multi-currency: USD / CNY / EUR / GBP)
export const AIRWALLEX_CREDITS_PACKAGES: Record<string, {
  id: string;
  credits: number;
  usd: { amount: number; currency: 'USD' };
  cny: { amount: number; currency: 'CNY' };
  eur: { amount: number; currency: 'EUR' };
  gbp: { amount: number; currency: 'GBP' };
  name: string;
  description: string;
}> = {
  credits_100: {
    id: 'credits_100',
    credits: 100,
    usd: { amount: 499, currency: 'USD' },    // $4.99
    cny: { amount: 3400, currency: 'CNY' },    // ¥34
    eur: { amount: 499, currency: 'EUR' },    // €4.99
    gbp: { amount: 429, currency: 'GBP' },    // £4.29
    name: 'Starter Pack - 100 Credits',
    description: '100 credits for AstrologyWiki features',
  },
  credits_300: {
    id: 'credits_300',
    credits: 300,
    usd: { amount: 1249, currency: 'USD' },   // $12.49
    cny: { amount: 8400, currency: 'CNY' },   // ¥84
    eur: { amount: 1249, currency: 'EUR' },   // €12.49
    gbp: { amount: 1099, currency: 'GBP' },   // £10.99
    name: 'Standard Pack - 300 Credits',
    description: '300 credits for AstrologyWiki features (17% savings)',
  },
  credits_500: {
    id: 'credits_500',
    credits: 500,
    usd: { amount: 1999, currency: 'USD' },   // $19.99
    cny: { amount: 13400, currency: 'CNY' },   // ¥134
    eur: { amount: 1999, currency: 'EUR' },   // €19.99
    gbp: { amount: 1749, currency: 'GBP' },   // £17.49
    name: 'Value Pack - 500 Credits',
    description: '500 credits for AstrologyWiki features (20% savings)',
  },
  credits_1000: {
    id: 'credits_1000',
    credits: 1000,
    usd: { amount: 3499, currency: 'USD' },   // $34.99
    cny: { amount: 23400, currency: 'CNY' },   // ¥234
    eur: { amount: 3499, currency: 'EUR' },   // €34.99
    gbp: { amount: 2999, currency: 'GBP' },   // £29.99
    name: 'Pro Pack - 1000 Credits',
    description: '1000 credits for AstrologyWiki features (30% savings)',
  },
};

// Supported settlement currencies for Airwallex collection
export type SupportedCurrency = 'USD' | 'CNY' | 'EUR' | 'GBP';

// Legacy lang-based currency resolver (kept for backward compatibility).
// Prefer resolveCurrencyFromRequest (backend/src/utils/currency.ts), which
// derives currency from real request signals (IP country, Accept-Language).
export const resolveCurrency = (lang?: string): SupportedCurrency => {
  return lang === 'zh' ? 'CNY' : 'USD';
};

// Format price for display
const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: '$',
  CNY: '¥',
  EUR: '€',
  GBP: '£',
};

export const formatPrice = (amountCents: number, currency: SupportedCurrency): string => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$';
  // CNY renders without decimals (whole yuan); the rest use 2 decimals.
  const fractionDigits = currency === 'CNY' ? 0 : 2;
  return `${symbol}${(amountCents / 100).toFixed(fractionDigits)}`;
};

if (!isAirwallexConfigured()) {
  logger.warn('Airwallex credentials not configured; Airwallex payment features disabled.');
} else {
  logger.info('Airwallex configured', { env: airwallexEnv });
}
