// INPUT: /api/airwallex/cancel-subscription 路由（mock auth + supabase + airwallexService + config）。
// OUTPUT: vitest 集成测试，覆盖 B1：provider 取消成功才标记 cancel_at_period_end，失败返回 502 且不改本地。
// POS: airwallex 取消接口 B1 回归测试；若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';

// ---- supabase chainable mock ----
let subscriptionRow: Record<string, unknown> | null = null;
const updates: Array<{
  payload: Record<string, unknown>;
  eq: Record<string, unknown>;
}> = [];

function makeBuilder() {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => Promise.resolve({ data: subscriptionRow, error: null }),
    update: (payload: Record<string, unknown>) => ({
      eq: (col: string, val: unknown) => {
        updates.push({ payload, eq: { [col]: val } });
        return Promise.resolve({ data: payload, error: null });
      },
    }),
  };
  return builder;
}

vi.mock('../db/supabase.js', () => ({
  supabase: { from: () => makeBuilder() },
  isSupabaseConfigured: () => true,
}));

// ---- airwallexService mock（含 isAirwallexConfigured via service? 实际 from config）----
const mockCancel = vi.fn();
vi.mock('../services/airwallexService.js', () => ({
  airwallexService: {
    cancelSubscription: (...a: unknown[]) => mockCancel(...a),
  },
  currencyKeyOf: () => 'usd',
}));

// isAirwallexConfigured 来自 config/airwallex —— 部分 mock，仅强制 configured=true。
vi.mock('../config/airwallex.js', async (importActual) => {
  const actual = await importActual<Record<string, unknown>>();
  return { ...actual, isAirwallexConfigured: () => true };
});

// auth：注入 userId 越过鉴权。
vi.mock('./auth.js', () => ({
  authMiddleware: (
    req: { userId?: string },
    _res: unknown,
    next: () => void,
  ) => {
    req.userId = 'user-1';
    next();
  },
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const { default: airwallexRouter } = await import('./airwallex.js');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/airwallex', airwallexRouter);
  return app;
}

async function postCancel(body: unknown) {
  const { default: supertest } = await import('supertest');
  return supertest(makeApp())
    .post('/api/airwallex/cancel-subscription')
    .send(body as object);
}

describe('POST /api/airwallex/cancel-subscription (B1)', () => {
  beforeEach(() => {
    mockCancel.mockReset();
    updates.length = 0;
    subscriptionRow = {
      id: 'sub-row-1',
      airwallex_subscription_id: 'sub_abc',
      status: 'active',
      payment_provider: 'airwallex',
    };
  });

  it('provider 取消成功 → 200 success，标记 cancel_at_period_end', async () => {
    mockCancel.mockResolvedValueOnce({ airwallexSuccess: true });

    const res = await postCancel({ reason: 'too expensive' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockCancel).toHaveBeenCalledWith('sub_abc');
    expect(updates).toHaveLength(1);
    expect(updates[0].payload.cancel_at_period_end).toBe(true);
  });

  it('provider 取消失败 → 502，且不改本地（不谎报成功）', async () => {
    mockCancel.mockResolvedValueOnce({
      airwallexSuccess: false,
      error: 'Update 500, Cancel 500',
    });

    const res = await postCancel({ reason: 'cancel me' });

    expect(res.status).toBe(502);
    expect(res.body.success).toBeUndefined();
    expect(updates).toHaveLength(0); // 关键：失败时绝不标记已取消
  });

  it('订阅行无 airwallex_subscription_id → 不谎报成功（502）', async () => {
    subscriptionRow = {
      id: 'sub-row-2',
      airwallex_subscription_id: null,
      status: 'active',
      payment_provider: 'airwallex',
    };

    const res = await postCancel({});

    expect(res.status).toBe(502);
    expect(mockCancel).not.toHaveBeenCalled();
    expect(updates).toHaveLength(0);
  });

  it('查无订阅 → 404', async () => {
    subscriptionRow = null;

    const res = await postCancel({});

    expect(res.status).toBe(404);
  });
});
