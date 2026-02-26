// INPUT: Express 服务器配置（含环境变量加载与统一响应中间件）。
// OUTPUT: 启动 HTTP 服务（含百科与支付等 API 路由）。
// POS: 后端入口文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { natalRouter } from './api/natal.js';
import { dailyRouter } from './api/daily.js';
import { askRouter } from './api/ask.js';
import { synastryRouter } from './api/synastry.js';
import { cycleRouter } from './api/cycle.js';
import { cbtRouter } from './api/cbt.js';
import { geoRouter } from './api/geo.js';
import { detailRouter } from './api/detail.js';
import { wikiRouter } from './api/wiki.js';
import { syntheticaRouter } from './api/synthetica.js';
import { astroRouter } from './api/astro.js';
import { userRouter } from './api/user.js';
import authRouter from './api/auth.js';
import paymentRouter from './api/payment.js';
import paymentV2Router from './api/paymentV2.js';
import paypalRouter from './api/paypal.js';
import airwallexRouter from './api/airwallex.js';
import entitlementsRouter from './api/entitlements.js';
import entitlementsV2Router from './api/entitlementsV2.js';
import reportsRouter from './api/reports.js';
import gmRouter from './api/gm.js';
import { apiResponseMiddleware } from './utils/apiResponse.js';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '.env.local'),
];

envPaths.forEach((envPath) => {
  dotenv.config({ path: envPath });
});

// Payment provider switch (default: airwallex) — must be after dotenv.config
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'airwallex';
const isProviderEnabled = (provider: string) =>
  PAYMENT_PROVIDER === 'all' || PAYMENT_PROVIDER === provider;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Raw body parsers for payment webhooks (must be before express.json())
if (isProviderEnabled('stripe')) {
  app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
  app.use('/api/payment/v2/webhook', express.raw({ type: 'application/json' }));
}
if (isProviderEnabled('paypal')) {
  app.use('/api/paypal/webhook', express.raw({ type: 'application/json' }));
}
if (isProviderEnabled('airwallex')) {
  app.use('/api/airwallex/webhook', express.raw({ type: 'application/json' }));
}

app.use(express.json());
app.use(apiResponseMiddleware);

// API Routes
app.use('/api/natal', natalRouter);
app.use('/api/daily', dailyRouter);
app.use('/api/ask', askRouter);
app.use('/api/synastry', synastryRouter);
app.use('/api/cycle', cycleRouter);
app.use('/api/cbt', cbtRouter);
app.use('/api/geo', geoRouter);
app.use('/api/detail', detailRouter);
app.use('/api/wiki', wikiRouter);
app.use('/api/synthetica', syntheticaRouter);
app.use('/api/astro', astroRouter);
app.use('/api/user', userRouter);

// Auth Routes
app.use('/api/auth', authRouter);

// Payment Routes (conditional based on PAYMENT_PROVIDER)
if (isProviderEnabled('stripe')) {
  app.use('/api/payment', paymentRouter);
}
if (isProviderEnabled('paypal')) {
  app.use('/api/paypal', paypalRouter);
}
if (isProviderEnabled('airwallex')) {
  app.use('/api/airwallex', airwallexRouter);
}

// V2 payment routes (credits system — always enabled, independent of payment provider)
app.use('/api/payment', paymentV2Router);

// Config endpoint - returns active payment provider
app.get('/api/config', (_, res) => res.json({ paymentProvider: PAYMENT_PROVIDER }));

console.log(`💳 Payment provider: ${PAYMENT_PROVIDER}`);

app.use('/api/entitlements', entitlementsRouter);
app.use('/api/entitlements', entitlementsV2Router);  // V2 路由挂载在 /v2 子路径
app.use('/api/reports', reportsRouter);
app.use('/api/gm', gmRouter);  // GM 测试命令

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
