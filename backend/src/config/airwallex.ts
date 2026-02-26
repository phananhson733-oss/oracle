// Airwallex configuration for global payment collection
import dotenv from 'dotenv';
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
};

// Product IDs
export const AIRWALLEX_PRODUCTS = {
  subscription: env('AIRWALLEX_PRODUCT_SUBSCRIPTION'),
};

// Subscription pricing (cents/分)
export const AIRWALLEX_SUBSCRIPTION_PRICING = {
  usd: {
    monthly: { amount: 699, currency: 'USD' as const },  // $6.99
    yearly: { amount: 4199, currency: 'USD' as const },   // $41.99 (save 50%)
  },
  cny: {
    monthly: { amount: 4900, currency: 'CNY' as const },  // ¥49
    yearly: { amount: 29400, currency: 'CNY' as const },   // ¥294 (save 50%)
  },
};

// First-time discount rate
export const AIRWALLEX_FIRST_DISCOUNT_RATE = 0.5; // 50% off

// Credits packages (dual currency)
export const AIRWALLEX_CREDITS_PACKAGES: Record<string, {
  id: string;
  credits: number;
  usd: { amount: number; currency: 'USD' };
  cny: { amount: number; currency: 'CNY' };
  name: string;
  description: string;
}> = {
  credits_100: {
    id: 'credits_100',
    credits: 100,
    usd: { amount: 499, currency: 'USD' },    // $4.99
    cny: { amount: 3400, currency: 'CNY' },    // ¥34
    name: 'Starter Pack - 100 Credits',
    description: '100 credits for AstroMind features',
  },
  credits_300: {
    id: 'credits_300',
    credits: 300,
    usd: { amount: 1249, currency: 'USD' },   // $12.49
    cny: { amount: 8400, currency: 'CNY' },   // ¥84
    name: 'Standard Pack - 300 Credits',
    description: '300 credits for AstroMind features (17% savings)',
  },
  credits_500: {
    id: 'credits_500',
    credits: 500,
    usd: { amount: 1999, currency: 'USD' },   // $19.99
    cny: { amount: 13400, currency: 'CNY' },   // ¥134
    name: 'Value Pack - 500 Credits',
    description: '500 credits for AstroMind features (20% savings)',
  },
  credits_1000: {
    id: 'credits_1000',
    credits: 1000,
    usd: { amount: 3499, currency: 'USD' },   // $34.99
    cny: { amount: 23400, currency: 'CNY' },   // ¥234
    name: 'Pro Pack - 1000 Credits',
    description: '1000 credits for AstroMind features (30% savings)',
  },
};

// Resolve currency from language
export type SupportedCurrency = 'USD' | 'CNY';

export const resolveCurrency = (lang?: string): SupportedCurrency => {
  return lang === 'zh' ? 'CNY' : 'USD';
};

// Format price for display
export const formatPrice = (amountCents: number, currency: SupportedCurrency): string => {
  if (currency === 'CNY') {
    return `¥${(amountCents / 100).toFixed(0)}`;
  }
  return `$${(amountCents / 100).toFixed(2)}`;
};

if (!isAirwallexConfigured()) {
  console.warn('⚠️  Airwallex credentials not configured. Airwallex payment features will be disabled.');
} else {
  console.log(`✅ Airwallex configured (Env: ${airwallexEnv})`);
}
