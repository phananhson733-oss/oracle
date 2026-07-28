// INPUT: cron 路由 + mock 的对账驱动器。
// OUTPUT: vitest 集成测试，覆盖 CRON_SECRET 鉴权（无/错→401，对→200）+ dryRun 透传 + 报告返回。
// POS: cron 对账入口测试；若更新此文件，务必更新本头注释与所属 FOLDER.md。
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';

const mockReconcileAll = vi.fn();
vi.mock('../services/subscriptionReconcilerDriver.js', () => ({
  reconcileAllAirwallexSubscriptions: (...a: unknown[]) =>
    mockReconcileAll(...a),
}));

const { default: cronRouter } = await import('./cron.js');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/cron', cronRouter);
  return app;
}

async function get(path: string, auth?: string) {
  const { default: supertest } = await import('supertest');
  const req = supertest(makeApp()).get(path);
  if (auth) req.set('authorization', auth);
  return req;
}

const SECRET = 'test-cron-secret';

describe('GET /api/cron/reconcile-subscriptions', () => {
  beforeEach(() => {
    mockReconcileAll.mockReset();
    mockReconcileAll.mockResolvedValue({
      scanned: 5,
      reconciled: 4,
      skipped: [{ subscriptionId: 'sub_x', reason: 'no_user_mapping' }],
      dryRun: false,
    });
    process.env.CRON_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('无 Authorization → 401，不触发对账', async () => {
    const res = await get('/api/cron/reconcile-subscriptions');
    expect(res.status).toBe(401);
    expect(mockReconcileAll).not.toHaveBeenCalled();
  });

  it('错误 secret → 401', async () => {
    const res = await get('/api/cron/reconcile-subscriptions', 'Bearer wrong');
    expect(res.status).toBe(401);
    expect(mockReconcileAll).not.toHaveBeenCalled();
  });

  it('CRON_SECRET 未配置 → 一律 401（不裸奔）', async () => {
    delete process.env.CRON_SECRET;
    const res = await get(
      '/api/cron/reconcile-subscriptions',
      `Bearer ${SECRET}`,
    );
    expect(res.status).toBe(401);
  });

  it('正确 secret + 默认 → 200，dryRun=false，返回报告', async () => {
    const res = await get(
      '/api/cron/reconcile-subscriptions',
      `Bearer ${SECRET}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.reconciled).toBe(4);
    expect(mockReconcileAll).toHaveBeenCalledWith({ dryRun: false });
  });

  it('?dryRun=true → 透传 dryRun=true（只读预演）', async () => {
    await get(
      '/api/cron/reconcile-subscriptions?dryRun=true',
      `Bearer ${SECRET}`,
    );
    expect(mockReconcileAll).toHaveBeenCalledWith({ dryRun: true });
  });

  it('驱动器抛错 → 500', async () => {
    mockReconcileAll.mockRejectedValueOnce(new Error('boom'));
    const res = await get(
      '/api/cron/reconcile-subscriptions',
      `Bearer ${SECRET}`,
    );
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
