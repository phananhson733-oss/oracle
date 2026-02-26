// Airwallex configuration for global payment collection
import dotenv from 'dotenv';
import path from 'path';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
];
envPaths.forEach((p) => dotenv.config({ path: p }));

// Airwallex API credentials
const airwallexClientId = process.env.AIRWALLEX_CLIENT_ID || '';
const airwallexApiKey = process.env.AIRWALLEX_API_KEY || '';
const airwallexWebhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET || '';
const airwallexEnv = (process.env.AIRWALLEX_ENVIRONMENT || process.env.AIRWALLEX_ENV || 'demo') as 'demo' | 'production';

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
  legalEntityId: process.env.AIRWALLEX_LEGAL_ENTITY_ID || '',
  paymentAccountId: process.env.AIRWALLEX_PAYMENT_ACCOUNT_ID || '',
};

// Subscription price IDs (created in Airwallex Dashboard)
export const AIRWALLEX_PRICES = {
  // USD prices
  monthly_usd: process.env.AIRWALLEX_PRICE_MONTHLY_USD || '',
  yearly_usd: process.env.AIRWALLEX_PRICE_YEARLY_USD || '',
  monthly_first_usd: process.env.AIRWALLEX_PRICE_MONTHLY_FIRST_USD || '',
  yearly_first_usd: process.env.AIRWALLEX_PRICE_YEARLY_FIRST_USD || '',
  // CNY prices
  monthly_cny: process.env.AIRWALLEX_PRICE_MONTHLY_CNY || '',
  yearly_cny: process.env.AIRWALLEX_PRICE_YEARLY_CNY || '',
  monthly_first_cny: process.env.AIRWALLEX_PRICE_MONTHLY_FIRST_CNY || '',
  yearly_first_cny: process.env.AIRWALLEX_PRICE_YEARLY_FIRST_CNY || '',
};

// Product IDs
export const AIRWALLEX_PRODUCTS = {
  subscription: process.env.AIRWALLEX_PRODUCT_SUBSCRIPTION || '',
};

// Subscription pricing (cents/分)
export const AIRWALLEX_SUBSCRIPTION_PRICING = {
  usd: {
    monthly: { amount: 699, currency: 'USD' as const },  // $6.99
    yearly: { amount: 5599, currency: 'USD' as const },   // $55.99
  },
  cny: {
    monthly: { amount: 4900, currency: 'CNY' as const },  // ¥49
    yearly: { amount: 39800, currency: 'CNY' as const },   // ¥398
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
    usd: { amount: 999, currency: 'USD' },    // $9.99
    cny: { amount: 6800, currency: 'CNY' },    // ¥68
    name: 'Starter Pack - 100 Credits',
    description: '100 credits for AstroMind features',
  },
  credits_300: {
    id: 'credits_300',
    credits: 300,
    usd: { amount: 2499, currency: 'USD' },   // $24.99
    cny: { amount: 16800, currency: 'CNY' },   // ¥168
    name: 'Standard Pack - 300 Credits',
    description: '300 credits for AstroMind features (17% savings)',
  },
  credits_500: {
    id: 'credits_500',
    credits: 500,
    usd: { amount: 3999, currency: 'USD' },   // $39.99
    cny: { amount: 26800, currency: 'CNY' },   // ¥268
    name: 'Value Pack - 500 Credits',
    description: '500 credits for AstroMind features (20% savings)',
  },
  credits_1000: {
    id: 'credits_1000',
    credits: 1000,
    usd: { amount: 6999, currency: 'USD' },   // $69.99
    cny: { amount: 46800, currency: 'CNY' },   // ¥468
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
