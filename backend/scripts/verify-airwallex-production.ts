/**
 * Airwallex 生产环境验证脚本
 * 逐项检查生产环境的 API 连通性、配置完整性和关键功能
 *
 * 用法: npx tsx backend/scripts/verify-airwallex-production.ts
 *
 * 注意: 需要在 backend/.env 中设置生产环境凭证
 *       AIRWALLEX_ENVIRONMENT=production
 */
import dotenv from 'dotenv';
import path from 'path';

// Load env — search both project root and backend/
[
  'backend/.env', 'backend/.env.local',
  '.env', '.env.local',
  '../.env', '../.env.local',
].forEach((p) =>
  dotenv.config({ path: path.resolve(process.cwd(), p) })
);

// ── Config ──────────────────────────────────────────────
const CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID?.trim();
const API_KEY = process.env.AIRWALLEX_API_KEY?.trim();
const ENV = (process.env.AIRWALLEX_ENVIRONMENT || process.env.AIRWALLEX_ENV || 'demo').trim();
const WEBHOOK_SECRET = process.env.AIRWALLEX_WEBHOOK_SECRET?.trim();
const LEGAL_ENTITY_ID = process.env.AIRWALLEX_LEGAL_ENTITY_ID?.trim();
const PAYMENT_ACCOUNT_ID = process.env.AIRWALLEX_PAYMENT_ACCOUNT_ID?.trim();
const PRODUCT_ID = process.env.AIRWALLEX_PRODUCT_SUBSCRIPTION?.trim();

const PRICE_IDS = {
  monthly_usd: process.env.AIRWALLEX_PRICE_MONTHLY_USD?.trim(),
  yearly_usd: process.env.AIRWALLEX_PRICE_YEARLY_USD?.trim(),
  monthly_first_usd: process.env.AIRWALLEX_PRICE_MONTHLY_FIRST_USD?.trim(),
  yearly_first_usd: process.env.AIRWALLEX_PRICE_YEARLY_FIRST_USD?.trim(),
  monthly_cny: process.env.AIRWALLEX_PRICE_MONTHLY_CNY?.trim(),
  yearly_cny: process.env.AIRWALLEX_PRICE_YEARLY_CNY?.trim(),
  monthly_first_cny: process.env.AIRWALLEX_PRICE_MONTHLY_FIRST_CNY?.trim(),
  yearly_first_cny: process.env.AIRWALLEX_PRICE_YEARLY_FIRST_CNY?.trim(),
};

const API_BASE = ENV === 'production'
  ? 'https://api.airwallex.com'
  : 'https://api-demo.airwallex.com';

// ── Helpers ─────────────────────────────────────────────
let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
  passed++;
}

function fail(msg: string) {
  console.log(`  ❌ ${msg}`);
  failed++;
}

function warn(msg: string) {
  console.log(`  ⚠️  ${msg}`);
  warnings++;
}

function section(title: string) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(50)}`);
}

// ── Checks ──────────────────────────────────────────────

async function checkEnvironment() {
  section('1. 环境变量检查');

  if (ENV === 'production') {
    pass(`AIRWALLEX_ENVIRONMENT = production`);
  } else {
    fail(`AIRWALLEX_ENVIRONMENT = "${ENV}" (应为 "production")`);
  }

  if (API_BASE.includes('api.airwallex.com') && !API_BASE.includes('demo')) {
    pass(`API Base URL = ${API_BASE}`);
  } else {
    fail(`API Base URL = ${API_BASE} (仍指向 demo)`);
  }

  CLIENT_ID ? pass(`CLIENT_ID = ${CLIENT_ID.slice(0, 8)}...`) : fail('CLIENT_ID 未设置');
  API_KEY ? pass(`API_KEY = ${API_KEY.slice(0, 8)}...`) : fail('API_KEY 未设置');
  WEBHOOK_SECRET ? pass(`WEBHOOK_SECRET = ${WEBHOOK_SECRET.slice(0, 10)}...`) : fail('WEBHOOK_SECRET 未设置');
  LEGAL_ENTITY_ID ? pass(`LEGAL_ENTITY_ID = ${LEGAL_ENTITY_ID}`) : warn('LEGAL_ENTITY_ID 未设置（可选）');
  PAYMENT_ACCOUNT_ID ? pass(`PAYMENT_ACCOUNT_ID = ${PAYMENT_ACCOUNT_ID}`) : fail('PAYMENT_ACCOUNT_ID 未设置（PA 已通过，此值必需）');
  PRODUCT_ID ? pass(`PRODUCT_SUBSCRIPTION = ${PRODUCT_ID}`) : fail('PRODUCT_SUBSCRIPTION 未设置');

  // Check all 8 price IDs
  let priceOk = 0;
  for (const [key, val] of Object.entries(PRICE_IDS)) {
    if (val) {
      priceOk++;
    } else {
      fail(`PRICE_${key.toUpperCase()} 未设置`);
    }
  }
  if (priceOk === 8) {
    pass(`全部 8 个 Price ID 已配置`);
  }
}

async function checkAuthentication(): Promise<string | null> {
  section('2. API 认证测试');

  if (!CLIENT_ID || !API_KEY) {
    fail('缺少 CLIENT_ID 或 API_KEY，跳过认证测试');
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/authentication/login`, {
      method: 'POST',
      headers: {
        'x-client-id': CLIENT_ID,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    if (res.ok) {
      const data = await res.json();
      pass(`认证成功 — Token 有效期至 ${data.expires_at || '未知'}`);
      return data.token;
    } else {
      const text = await res.text();
      fail(`认证失败 (${res.status}): ${text.slice(0, 200)}`);
      return null;
    }
  } catch (e: any) {
    fail(`认证请求异常: ${e.message}`);
    return null;
  }
}

async function checkProduct(token: string) {
  section('3. 产品 & 价格验证');

  if (!PRODUCT_ID) {
    fail('PRODUCT_ID 未设置，跳过');
    return;
  }

  // Check product exists
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/${PRODUCT_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      pass(`产品 "${data.name || PRODUCT_ID}" 存在 (status: ${data.status || 'active'})`);
    } else {
      fail(`产品查询失败 (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
  } catch (e: any) {
    fail(`产品查询异常: ${e.message}`);
  }

  // Check a sample price
  const samplePriceId = PRICE_IDS.monthly_usd;
  if (samplePriceId) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/prices/${samplePriceId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        pass(`价格 monthly_usd (${samplePriceId}) 有效 — ${data.currency?.toUpperCase()} ${data.unit_amount || data.amount}`);
      } else {
        fail(`价格查询失败 (${res.status}): ${(await res.text()).slice(0, 200)}`);
      }
    } catch (e: any) {
      fail(`价格查询异常: ${e.message}`);
    }
  }
}

async function checkPAModule(token: string) {
  section('4. PA（收单）模块验证');

  if (!PAYMENT_ACCOUNT_ID) {
    fail('PAYMENT_ACCOUNT_ID 未设置，无法验证 PA 模块');
    return;
  }

  // Try to list payment intents (will fail if PA not active)
  try {
    const res = await fetch(`${API_BASE}/api/v1/pa/payment_intents?page_size=1`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (res.ok) {
      pass('PA API 可访问 — payment_intents 列表正常');
    } else {
      const text = await res.text();
      if (text.includes('resource_not_found') || text.includes('not_found')) {
        fail(`PA 模块未激活或账户未关联: ${text.slice(0, 200)}`);
      } else {
        fail(`PA API 异常 (${res.status}): ${text.slice(0, 200)}`);
      }
    }
  } catch (e: any) {
    fail(`PA API 请求异常: ${e.message}`);
  }
}

async function checkBillingModule(token: string) {
  section('5. Billing（订阅）模块验证');

  // Try to list subscriptions
  try {
    const res = await fetch(`${API_BASE}/api/v1/subscriptions?page_size=1`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      const count = data.items?.length ?? 0;
      pass(`Billing API 可访问 — 当前有 ${count} 个订阅`);
    } else {
      const text = await res.text();
      fail(`Billing API 异常 (${res.status}): ${text.slice(0, 200)}`);
    }
  } catch (e: any) {
    fail(`Billing API 请求异常: ${e.message}`);
  }
}

async function checkWebhook(token: string) {
  section('6. Webhook 配置验证');

  if (!WEBHOOK_SECRET) {
    fail('WEBHOOK_SECRET 未设置');
  } else {
    pass('WEBHOOK_SECRET 已配置');
  }

  // Try to list webhooks
  try {
    const res = await fetch(`${API_BASE}/api/v1/webhook_endpoints?page_size=10`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      const endpoints = data.items || [];
      if (endpoints.length === 0) {
        warn('未找到 Webhook 端点 — 请在 Dashboard 中配置');
      } else {
        for (const ep of endpoints) {
          const url = ep.url || '(unknown)';
          const active = ep.active !== false;
          const events = ep.enabled_events?.join(', ') || '(all)';
          if (active) {
            pass(`Webhook: ${url}\n         Events: ${events}`);
          } else {
            warn(`Webhook 已禁用: ${url}`);
          }
        }
      }
    } else {
      // Webhook list API might not be available for all account types
      warn(`Webhook 列表查询失败 (${res.status}) — 请在 Dashboard 中手动确认`);
    }
  } catch (e: any) {
    warn(`Webhook 列表查询异常: ${e.message} — 请在 Dashboard 中手动确认`);
  }
}

async function checkFrontendDeployment() {
  section('7. 前端部署验证');

  const siteUrl = 'https://www.astrologywiki.com';

  // Check pricing API on production
  try {
    const res = await fetch(`${siteUrl}/api/airwallex/pricing?lang=en`, {
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.subscription || data.credits) {
        pass(`生产站点 Pricing API 正常 — ${siteUrl}/api/airwallex/pricing`);
      } else {
        warn(`Pricing API 返回了数据但格式异常: ${JSON.stringify(data).slice(0, 200)}`);
      }
    } else {
      fail(`生产站点 Pricing API 失败 (${res.status})`);
    }
  } catch (e: any) {
    fail(`无法访问生产站点: ${e.message}`);
  }
}

// ── Main ────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Airwallex 生产环境验证                          ║');
  console.log('║  AstrologyWiki — www.astrologywiki.com               ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n  环境: ${ENV}`);
  console.log(`  API:  ${API_BASE}`);
  console.log(`  时间: ${new Date().toISOString()}`);

  // 1. Environment vars
  await checkEnvironment();

  // 2. Auth
  const token = await checkAuthentication();

  if (token) {
    // 3. Product & Prices
    await checkProduct(token);

    // 4. PA Module
    await checkPAModule(token);

    // 5. Billing Module
    await checkBillingModule(token);

    // 6. Webhook
    await checkWebhook(token);
  }

  // 7. Frontend
  await checkFrontendDeployment();

  // ── Summary ─────────────────────────────────────────
  section('汇总');
  console.log(`  ✅ 通过: ${passed}`);
  console.log(`  ❌ 失败: ${failed}`);
  console.log(`  ⚠️  警告: ${warnings}`);
  console.log();

  if (failed === 0) {
    console.log('  🎉 所有检查通过！可以进行生产环境支付测试。');
    console.log();
    console.log('  下一步:');
    console.log('  1. 用真实信用卡在 www.astrologywiki.com 完成一笔月度订阅');
    console.log('  2. 在 Airwallex Dashboard 确认交易和 Webhook 投递');
    console.log('  3. 测试积分充值（最小包 $4.99）');
    console.log('  4. 测试取消订阅');
    console.log('  5. 在 Dashboard 中退款测试交易');
  } else {
    console.log('  ⛔ 存在失败项，请修复后重新运行验证。');
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n💥 脚本异常:', err);
  process.exit(1);
});
