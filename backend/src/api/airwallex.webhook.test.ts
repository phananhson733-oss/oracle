// INPUT: /api/airwallex/webhook 路由（mock 签名校验/幂等/对账驱动器/supabase/config）。
// OUTPUT: vitest 集成测试，覆盖 invoice.* 事件路由到 reconcileAirwallexSubscriptionById（续费落库兜底），含缺 subscription_id 跳过。
// POS: airwallex webhook invoice 处理测试；若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';

const mockReconcileById = vi.fn();
vi.mock('../services/subscriptionReconcilerDriver.js', () => ({
  reconcileAirwallexSubscriptionById: (...a: unknown[]) =>
    mockReconcileById(...a),
}));

const mockVerify = vi.fn((..._a: unknown[]) => true);
const mockIsProcessed = vi.fn(async (..._a: unknown[]) => false);
const mockRecord = vi.fn(async (..._a: unknown[]) => undefined);
vi.mock('../services/airwallexService.js', () => ({
  airwallexService: {
    verifyWebhookSignature: (...a: unknown[]) => mockVerify(...a),
    isEventProcessed: (...a: unknown[]) => mockIsProcessed(...a),
    recordWebhookEvent: (...a: unknown[]) => mockRecord(...a),
  },
  currencyKeyOf: () => 'usd',
}));

vi.mock('../db/supabase.js', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  },
  isSupabaseConfigured: () => true,
}));

vi.mock('../config/airwallex.js', async (importActual) => {
  const actual = await importActual<Record<string, unknown>>();
  return { ...actual, isAirwallexConfigured: () => true };
});

const { default: airwallexRouter } = await import('./airwallex.js');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/airwallex', airwallexRouter);
  return app;
}

async function postWebhook(event: unknown) {
  const { default: supertest } = await import('supertest');
  return supertest(makeApp())
    .post('/api/airwallex/webhook')
    .set('x-signature', 'sig')
    .set('x-timestamp', '123')
    .set('Content-Type', 'application/json')
    .send(event as object);
}

const invoiceEvent = (subId: string | undefined) => ({
  id: 'evt_1',
  name: 'invoice.finalized',
  data: {
    id: 'inv_1',
    subscription_id: subId,
    billing_customer_id: 'bcus_1',
    status: 'FINALIZED',
    payment_status: 'PAID',
  },
});

describe('POST /api/airwallex/webhook — invoice.* 路由', () => {
  beforeEach(() => {
    mockReconcileById.mockReset();
    mockReconcileById.mockResolvedValue({
      reconciled: true,
      userId: 'u1',
      action: 'update',
    });
    mockVerify.mockReturnValue(true);
    mockIsProcessed.mockResolvedValue(false);
  });

  it('invoice 事件 → 以 data.subscription_id 调对账驱动器', async () => {
    const res = await postWebhook(invoiceEvent('sub_abc'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(mockReconcileById).toHaveBeenCalledWith('sub_abc');
  });

  it('invoice 事件缺 subscription_id → 不调对账（安全跳过）', async () => {
    const res = await postWebhook(invoiceEvent(undefined));

    expect(res.status).toBe(200);
    expect(mockReconcileById).not.toHaveBeenCalled();
  });

  it('签名校验失败 → 401，不处理', async () => {
    mockVerify.mockReturnValue(false);

    const res = await postWebhook(invoiceEvent('sub_abc'));

    expect(res.status).toBe(401);
    expect(mockReconcileById).not.toHaveBeenCalled();
  });
});
