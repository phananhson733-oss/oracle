// Stripe configuration
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// 尝试加载多个环境变量文件
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
];
envPaths.forEach((p) => dotenv.config({ path: p }));

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!stripeSecretKey) {
  console.warn('Warning: Stripe secret key not configured. Payment features will be disabled.');
}

// 使用占位密钥避免初始化错误 - 实际调用时检查 isStripeConfigured
const effectiveKey = stripeSecretKey || 'sk_test_placeholder';
export const stripe = new Stripe(effectiveKey);

export const STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;

// Check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!stripeSecretKey;
};

// Price IDs - Configure these in Stripe Dashboard
export const STRIPE_PRICES = {
  // Subscription prices
  MONTHLY_SUBSCRIPTION: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_699',
  YEARLY_SUBSCRIPTION: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_4999',

  // One-time purchase prices
  ASK_SINGLE: process.env.STRIPE_PRICE_ASK || 'price_ask_99',
  DETAIL_PACK_10: process.env.STRIPE_PRICE_DETAIL_PACK || 'price_detail_299',
  SYNASTRY_FULL: process.env.STRIPE_PRICE_SYNASTRY || 'price_synastry_399',
  CBT_ANALYSIS: process.env.STRIPE_PRICE_CBT || 'price_cbt_99',

  // Report prices
  REPORT_MONTHLY: process.env.STRIPE_PRICE_REPORT_MONTHLY || 'price_report_monthly_199',
  REPORT_ANNUAL: process.env.STRIPE_PRICE_REPORT_ANNUAL || 'price_report_annual_799',
  REPORT_CAREER: process.env.STRIPE_PRICE_REPORT_CAREER || 'price_report_career_499',
  REPORT_WEALTH: process.env.STRIPE_PRICE_REPORT_WEALTH || 'price_report_wealth_499',
  REPORT_LOVE: process.env.STRIPE_PRICE_REPORT_LOVE || 'price_report_love_499',
  REPORT_SATURN_RETURN: process.env.STRIPE_PRICE_REPORT_SATURN || 'price_report_saturn_699',
  REPORT_SYNASTRY_DEEP: process.env.STRIPE_PRICE_REPORT_SYNASTRY_DEEP || 'price_report_synastry_599',
};

// Product configuration with pricing info
export const PRODUCTS = {
  subscription: {
    monthly: {
      priceId: STRIPE_PRICES.MONTHLY_SUBSCRIPTION,
      amount: 699, // cents
      name: 'AstroMind Pro Monthly',
      interval: 'month' as const,
    },
    yearly: {
      priceId: STRIPE_PRICES.YEARLY_SUBSCRIPTION,
      amount: 4999, // cents
      name: 'AstroMind Pro Yearly',
      interval: 'year' as const,
    },
  },
  oneTime: {
    ask: {
      priceId: STRIPE_PRICES.ASK_SINGLE,
      amount: 99,
      name: 'Single Ask Question',
      quantity: 1,
    },
    detail_pack: {
      priceId: STRIPE_PRICES.DETAIL_PACK_10,
      amount: 299,
      name: 'Detail Reading Pack (10)',
      quantity: 10,
    },
    synastry: {
      priceId: STRIPE_PRICES.SYNASTRY_FULL,
      amount: 399,
      name: 'Full Synastry Reading',
      quantity: 1,
    },
    cbt_analysis: {
      priceId: STRIPE_PRICES.CBT_ANALYSIS,
      amount: 99,
      name: 'CBT Journal Analysis',
      quantity: 1,
    },
  },
  reports: {
    monthly: {
      priceId: STRIPE_PRICES.REPORT_MONTHLY,
      amount: 199,
      name: 'Monthly Forecast Report',
      type: 'monthly',
    },
    annual: {
      priceId: STRIPE_PRICES.REPORT_ANNUAL,
      amount: 799,
      name: 'Annual Forecast Report',
      type: 'annual',
    },
    career: {
      priceId: STRIPE_PRICES.REPORT_CAREER,
      amount: 499,
      name: 'Career & Profession Report',
      type: 'career',
    },
    wealth: {
      priceId: STRIPE_PRICES.REPORT_WEALTH,
      amount: 499,
      name: 'Wealth & Finance Report',
      type: 'wealth',
    },
    love: {
      priceId: STRIPE_PRICES.REPORT_LOVE,
      amount: 499,
      name: 'Love & Relationship Report',
      type: 'love',
    },
    saturn_return: {
      priceId: STRIPE_PRICES.REPORT_SATURN_RETURN,
      amount: 699,
      name: 'Saturn Return Report',
      type: 'saturn_return',
    },
    synastry_deep: {
      priceId: STRIPE_PRICES.REPORT_SYNASTRY_DEEP,
      amount: 599,
      name: 'Synastry Deep Report',
      type: 'synastry_deep',
    },
  },
};

// Subscriber discount percentage
export const SUBSCRIBER_DISCOUNT = 0.3; // 30% off

export default stripe;
