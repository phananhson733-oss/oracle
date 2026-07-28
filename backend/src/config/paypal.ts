// PayPal configuration for China Enterprise Account
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import path from 'path';

// 加载环境变量
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
];
envPaths.forEach((p) => dotenv.config({ path: p }));

// PayPal API 凭证
const paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
const paypalMode = (process.env.PAYPAL_MODE || 'sandbox') as 'sandbox' | 'live';
const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID || '';

// PayPal API 基础 URL
export const PAYPAL_API_BASE = paypalMode === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// 检查 PayPal 是否已配置
export const isPayPalConfigured = (): boolean => {
  return !!(paypalClientId && paypalClientSecret);
};

// PayPal 凭证
export const PAYPAL_CREDENTIALS = {
  clientId: paypalClientId,
  clientSecret: paypalClientSecret,
  mode: paypalMode,
  webhookId: paypalWebhookId,
};

// PayPal 产品和计划 ID（在 PayPal Dashboard 创建后配置）
export const PAYPAL_PRODUCTS = {
  subscription: process.env.PAYPAL_PRODUCT_SUBSCRIPTION || '',
  credits: process.env.PAYPAL_PRODUCT_CREDITS || '',
};

// 订阅计划 ID（标准价格 + 首次折扣价格）
export const PAYPAL_PLANS = {
  monthly: process.env.PAYPAL_PLAN_MONTHLY || '',
  yearly: process.env.PAYPAL_PLAN_YEARLY || '',
  // 首次订阅折扣计划（50% off）
  monthly_first: process.env.PAYPAL_PLAN_MONTHLY_FIRST || '',
  yearly_first: process.env.PAYPAL_PLAN_YEARLY_FIRST || '',
};

// 积分套餐定价（美分）
export const CREDITS_PACKAGES: Record<string, {
  id: string;
  credits: number;
  amount: number;
  name: string;
  description: string;
}> = {
  credits_100: {
    id: 'credits_100',
    credits: 100,
    amount: 499, // $4.99
    name: '基础包 - 100 积分',
    description: '100 credits for AstrologyWiki features',
  },
  credits_300: {
    id: 'credits_300',
    credits: 300,
    amount: 1249, // $12.49 (~17% off)
    name: '标准包 - 300 积分',
    description: '300 credits for AstrologyWiki features (17% savings)',
  },
  credits_500: {
    id: 'credits_500',
    credits: 500,
    amount: 1999, // $19.99 (~20% off)
    name: '超值包 - 500 积分',
    description: '500 credits for AstrologyWiki features (20% savings)',
  },
  credits_1000: {
    id: 'credits_1000',
    credits: 1000,
    amount: 3499, // $34.99 (~30% off)
    name: '专业包 - 1000 积分',
    description: '1000 credits for AstrologyWiki features (30% savings)',
  },
};

// 订阅定价（美分）
export const SUBSCRIPTION_PRICING = {
  monthly: {
    amount: 699, // $6.99
    interval: 'MONTH' as const,
    name: 'AstrologyWiki Pro 月度订阅',
  },
  yearly: {
    amount: 4199, // $41.99 (50% off)
    interval: 'YEAR' as const,
    name: 'AstrologyWiki Pro 年度订阅',
  },
};

// 首次订阅折扣
export const FIRST_DISCOUNT_RATE = 0.5; // 50% off

// 首次折扣价格（美分）
export const FIRST_DISCOUNT_PRICING = {
  monthly: {
    amount: Math.round(SUBSCRIPTION_PRICING.monthly.amount * (1 - FIRST_DISCOUNT_RATE)), // $3.50
    interval: 'MONTH' as const,
    name: 'AstrologyWiki Pro 月度订阅（首次特惠）',
  },
  yearly: {
    amount: Math.round(SUBSCRIPTION_PRICING.yearly.amount * (1 - FIRST_DISCOUNT_RATE)), // $21.00
    interval: 'YEAR' as const,
    name: 'AstrologyWiki Pro 年度订阅（首次特惠）',
  },
};

// 汇率配置（用于显示人民币参考价格）
export const CNY_EXCHANGE_RATE = 7.2;

// 美元转人民币（向上取整）
export const usdToCny = (usdCents: number): number => {
  return Math.ceil((usdCents / 100) * CNY_EXCHANGE_RATE);
};

// 格式化美元价格
export const formatUSD = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

// 格式化人民币参考价格
export const formatCNYRef = (usdCents: number): string => {
  return `约 ¥${usdToCny(usdCents)}`;
};

if (!isPayPalConfigured()) {
  logger.warn('PayPal credentials not configured; PayPal payment features disabled.');
} else {
  logger.info('PayPal configured', { mode: paypalMode });
}
