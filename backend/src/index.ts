// INPUT: Express 服务器配置（含环境变量加载与百科路由挂载）。
// OUTPUT: 启动 HTTP 服务（含百科 API 路由）。
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
import authRouter from './api/auth.js';
import paymentRouter from './api/payment.js';
import entitlementsRouter from './api/entitlements.js';
import reportsRouter from './api/reports.js';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '.env.local'),
];

envPaths.forEach((envPath) => {
  dotenv.config({ path: envPath });
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Raw body parser for Stripe webhook (must be before express.json())
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

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

// Auth & Payment Routes
app.use('/api/auth', authRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/entitlements', entitlementsRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
