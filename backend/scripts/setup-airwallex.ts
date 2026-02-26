/**
 * Airwallex 初始化脚本
 * 自动创建订阅产品、价格，并输出需要配置的环境变量
 *
 * 用法: npx tsx backend/scripts/setup-airwallex.ts
 */
import dotenv from 'dotenv';
import path from 'path';

// Load env
['.env', '.env.local', '../.env', '../.env.local'].forEach((p) =>
  dotenv.config({ path: path.resolve(process.cwd(), p) })
);

const CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID;
const API_KEY = process.env.AIRWALLEX_API_KEY;
const ENV = process.env.AIRWALLEX_ENVIRONMENT || 'demo';
const API_BASE = ENV === 'production'
  ? 'https://api.airwallex.com'
  : 'https://api-demo.airwallex.com';

if (!CLIENT_ID || !API_KEY) {
  console.error('❌ Missing AIRWALLEX_CLIENT_ID or AIRWALLEX_API_KEY in .env');
  process.exit(1);
}

console.log(`🔧 Airwallex Setup (${ENV})`);
console.log(`   API Base: ${API_BASE}\n`);

async function getToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/authentication/login`, {
    method: 'POST',
    headers: {
      'x-client-id': CLIENT_ID!,
      'x-api-key': API_KEY!,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Auth failed:', res.status, text);
    process.exit(1);
  }

  const data = await res.json();
  console.log('✅ Authentication successful\n');
  return data.token;
}

async function apiCall(token: string, endpoint: string, body: any): Promise<any> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ API call failed: ${endpoint}`, res.status, text);
    return null;
  }

  return JSON.parse(text);
}

async function apiGet(token: string, endpoint: string): Promise<any> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error(`❌ GET failed: ${endpoint}`, res.status);
    return null;
  }

  return res.json();
}

async function main() {
  const token = await getToken();

  // Step 0: Get account info (legal_entity_id, payment_account_id)
  console.log('📋 Fetching account info...');
  const accountInfo = await apiGet(token, '/api/v1/account');
  const legalEntityId = accountInfo?.legal_entity_id || accountInfo?.id || '';
  console.log(`   Legal Entity ID: ${legalEntityId || '(not found)'}`);

  // Try to get linked payment accounts
  const accounts = await apiGet(token, '/api/v1/linked_accounts');
  const paymentAccountId = accounts?.items?.[0]?.id || '';
  console.log(`   Payment Account ID: ${paymentAccountId || '(not found - may need to set up in dashboard)'}\n`);

  // Step 1: Create subscription product
  console.log('📦 Creating subscription product...');
  const product = await apiCall(token, '/api/v1/products/create', {
    request_id: `product_astromind_subscription_${Date.now()}`,
    name: 'AstroMind Pro Subscription',
    description: 'AstroMind Pro subscription with unlimited access to all premium features',
  });

  if (!product) {
    console.error('Failed to create product. It may already exist.');
    console.log('💡 Try listing existing products with: GET /api/v1/products\n');

    // Try to list existing products
    const existingProducts = await apiGet(token, '/api/v1/products');
    if (existingProducts?.items?.length) {
      console.log('Existing products:');
      for (const p of existingProducts.items) {
        console.log(`   ${p.id} - ${p.name}`);
      }
    }
    return;
  }

  const productId = product.id;
  console.log(`   Product ID: ${productId}\n`);

  // Step 2: Create prices
  console.log('💰 Creating prices...\n');

  const prices: Record<string, string> = {};

  const priceConfigs = [
    { key: 'monthly_usd', currency: 'USD', amount: 6.99, period: 1, unit: 'MONTH', name: 'Monthly USD' },
    { key: 'yearly_usd', currency: 'USD', amount: 55.99, period: 1, unit: 'YEAR', name: 'Yearly USD' },
    { key: 'monthly_first_usd', currency: 'USD', amount: 3.49, period: 1, unit: 'MONTH', name: 'Monthly USD (First-time 50% off)' },
    { key: 'yearly_first_usd', currency: 'USD', amount: 27.99, period: 1, unit: 'YEAR', name: 'Yearly USD (First-time 50% off)' },
    { key: 'monthly_cny', currency: 'CNY', amount: 49, period: 1, unit: 'MONTH', name: 'Monthly CNY' },
    { key: 'yearly_cny', currency: 'CNY', amount: 398, period: 1, unit: 'YEAR', name: 'Yearly CNY' },
    { key: 'monthly_first_cny', currency: 'CNY', amount: 24.5, period: 1, unit: 'MONTH', name: 'Monthly CNY (First-time 50% off)' },
    { key: 'yearly_first_cny', currency: 'CNY', amount: 199, period: 1, unit: 'YEAR', name: 'Yearly CNY (First-time 50% off)' },
  ];

  for (const cfg of priceConfigs) {
    console.log(`   Creating ${cfg.name}...`);
    const price = await apiCall(token, '/api/v1/prices/create', {
      request_id: `price_${cfg.key}_${Date.now()}`,
      product_id: productId,
      currency: cfg.currency,
      pricing_model: 'FLAT',
      flat_amount: cfg.amount,
      recurring: {
        period: cfg.period,
        period_unit: cfg.unit,
      },
    });

    if (price) {
      prices[cfg.key] = price.id;
      console.log(`   ✅ ${cfg.key}: ${price.id}`);
    } else {
      console.log(`   ❌ Failed to create ${cfg.key}`);
    }
  }

  // Output environment variables
  console.log('\n' + '='.repeat(60));
  console.log('📋 Add these to your .env and deployment environment:');
  console.log('='.repeat(60) + '\n');

  const envLines = [
    `AIRWALLEX_PRODUCT_SUBSCRIPTION=${productId}`,
    `AIRWALLEX_LEGAL_ENTITY_ID=${legalEntityId}`,
    `AIRWALLEX_PAYMENT_ACCOUNT_ID=${paymentAccountId}`,
    '',
    `AIRWALLEX_PRICE_MONTHLY_USD=${prices.monthly_usd || ''}`,
    `AIRWALLEX_PRICE_YEARLY_USD=${prices.yearly_usd || ''}`,
    `AIRWALLEX_PRICE_MONTHLY_FIRST_USD=${prices.monthly_first_usd || ''}`,
    `AIRWALLEX_PRICE_YEARLY_FIRST_USD=${prices.yearly_first_usd || ''}`,
    '',
    `AIRWALLEX_PRICE_MONTHLY_CNY=${prices.monthly_cny || ''}`,
    `AIRWALLEX_PRICE_YEARLY_CNY=${prices.yearly_cny || ''}`,
    `AIRWALLEX_PRICE_MONTHLY_FIRST_CNY=${prices.monthly_first_cny || ''}`,
    `AIRWALLEX_PRICE_YEARLY_FIRST_CNY=${prices.yearly_first_cny || ''}`,
  ];

  for (const line of envLines) {
    console.log(line);
  }

  console.log('\n✅ Setup complete!');
}

main().catch(console.error);
