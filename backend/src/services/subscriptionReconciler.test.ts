// INPUT: subscriptionReconciler 模块 + mock 的 supabase 客户端。
// OUTPUT: vitest 套件，覆盖「缺 metadata.userId 时按 customer email / customer_id 反查并 upsert 订阅行」的对账核心。
// POS: P0 对账核心测试；若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---- supabase mock：可配置的链式查询构造器 ----
// 每个 from(table) 返回一个 builder，收集 .eq() 过滤，终结于 maybeSingle/single。
// 测试通过 setResponse(table, predicateKey, value) 注入返回；insert/update 载荷被捕获。
type Row = Record<string, unknown>;
const responses = new Map<string, { data: Row | null; error: unknown }>();
const inserts: Row[] = [];
const updates: Array<{ payload: Row; eq: Record<string, unknown> }> = [];

function keyOf(table: string, filters: Record<string, unknown>): string {
  const f = Object.entries(filters)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('&');
  return `${table}|${f}`;
}

function makeBuilder(table: string) {
  const filters: Record<string, unknown> = {};
  let pendingInsert: Row | null = null;
  const builder: Record<string, unknown> = {
    select: () => builder,
    insert: (row: Row) => {
      pendingInsert = row;
      inserts.push(row);
      return Promise.resolve({ data: row, error: null });
    },
    update: (payload: Row) => {
      return {
        eq: (col: string, val: unknown) => {
          updates.push({ payload, eq: { [col]: val } });
          return Promise.resolve({ data: payload, error: null });
        },
      };
    },
    eq: (col: string, val: unknown) => {
      filters[col] = val;
      return builder;
    },
    in: (col: string, vals: unknown[]) => {
      filters[col] = vals.join(',');
      return builder;
    },
    order: () => builder,
    limit: () => builder,
    maybeSingle: () =>
      Promise.resolve(
        responses.get(keyOf(table, filters)) ?? { data: null, error: null },
      ),
    single: () =>
      Promise.resolve(
        responses.get(keyOf(table, filters)) ?? { data: null, error: null },
      ),
  };
  void pendingInsert;
  return builder;
}

const mockIsConfigured = vi.fn(() => true);
vi.mock('../db/supabase.js', () => ({
  supabase: { from: (table: string) => makeBuilder(table) },
  isSupabaseConfigured: () => mockIsConfigured(),
}));

import {
  mapAirwallexStatus,
  reconcileAirwallexSubscription,
} from './subscriptionReconciler.js';

function setResponse(
  table: string,
  filters: Record<string, unknown>,
  data: Row | null,
) {
  responses.set(keyOf(table, filters), { data, error: null });
}

describe('reconcileAirwallexSubscription', () => {
  beforeEach(() => {
    responses.clear();
    inserts.length = 0;
    updates.length = 0;
    mockIsConfigured.mockReturnValue(true);
  });

  it('缺 metadata.userId 时按 customer email 反查用户并新建订阅行（用户的精确场景）', async () => {
    // 系统里该用户没有订阅行（这正是 bug：扣了款却没行）
    setResponse('users', { email: 'buyer@example.com' }, { id: 'user-1' });
    // subscriptions 按 customer_id 查不到（首次落库）
    setResponse('subscriptions', { airwallex_customer_id: 'cus_x' }, null);
    // subscriptions 按 user_id 查不到既有行
    setResponse('subscriptions', { user_id: 'user-1' }, null);

    const result = await reconcileAirwallexSubscription({
      subscriptionId: 'sub_abc',
      customerId: 'cus_x',
      customerEmail: 'buyer@example.com',
      metadataUserId: undefined, // 关键：续费发票事件没有 userId
      plan: 'monthly',
      status: 'ACTIVE',
      currentPeriodStart: '2026-06-04T00:00:00.000Z',
      currentPeriodEnd: '2026-07-04T00:00:00.000Z',
    });

    expect(result.reconciled).toBe(true);
    expect(result.userId).toBe('user-1');
    expect(inserts).toHaveLength(1);
    const row = inserts[0];
    expect(row.user_id).toBe('user-1');
    expect(row.airwallex_subscription_id).toBe('sub_abc');
    expect(row.airwallex_customer_id).toBe('cus_x');
    expect(row.payment_provider).toBe('airwallex');
    expect(row.status).toBe('active');
    expect(row.current_period_end).toBe('2026-07-04T00:00:00.000Z');
    expect(row.cancel_at_period_end).toBe(false);
  });

  it('完全无法映射用户时不写库、返回 reconciled=false', async () => {
    // email 查不到用户，customerId 也查不到
    setResponse(
      'subscriptions',
      { airwallex_customer_id: 'cus_unknown' },
      null,
    );
    setResponse('users', { email: 'ghost@example.com' }, null);

    const result = await reconcileAirwallexSubscription({
      subscriptionId: 'sub_ghost',
      customerId: 'cus_unknown',
      customerEmail: 'ghost@example.com',
      metadataUserId: undefined,
      plan: 'monthly',
      status: 'ACTIVE',
    });

    expect(result.reconciled).toBe(false);
    expect(result.reason).toBe('no_user_mapping');
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it('已有订阅行时更新而非新建，并把 Airwallex 状态映射为本地枚举', async () => {
    setResponse('users', { email: 'buyer@example.com' }, { id: 'user-1' });
    setResponse(
      'subscriptions',
      { airwallex_customer_id: 'cus_x' },
      { user_id: 'user-1' },
    );
    setResponse('subscriptions', { user_id: 'user-1' }, { id: 'row-1' });

    const result = await reconcileAirwallexSubscription({
      subscriptionId: 'sub_abc',
      customerId: 'cus_x',
      customerEmail: 'buyer@example.com',
      metadataUserId: undefined,
      plan: 'monthly',
      status: 'PAST_DUE',
      currentPeriodEnd: '2026-07-04T00:00:00.000Z',
    });

    expect(result.reconciled).toBe(true);
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(1);
    expect(updates[0].payload.status).toBe('past_due');
    expect(updates[0].eq).toEqual({ user_id: 'user-1' });
  });

  it('Airwallex IN_TRIAL 映射为本地 trialing，并优先使用 trial_ends_at', async () => {
    expect(mapAirwallexStatus('IN_TRIAL')).toBe('trialing');
    setResponse('users', { email: 'trial@example.com' }, { id: 'user-trial' });
    setResponse('subscriptions', { airwallex_customer_id: 'cus_trial' }, null);
    setResponse('subscriptions', { user_id: 'user-trial' }, null);

    const result = await reconcileAirwallexSubscription({
      subscriptionId: 'sub_trial',
      customerId: 'cus_trial',
      customerEmail: 'trial@example.com',
      plan: 'monthly',
      status: 'IN_TRIAL',
      currentPeriodStart: '2026-07-02T00:00:00.000Z',
      currentPeriodEnd: '2026-08-02T00:00:00.000Z',
      trialEnd: '2026-07-09T00:00:00.000Z',
    });

    expect(result.reconciled).toBe(true);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].status).toBe('trialing');
    expect(inserts[0].current_period_end).toBe('2026-07-09T00:00:00.000Z');
  });

  it('映射 ACTIVE / UNPAID / CANCELLED 到本地订阅状态', () => {
    expect(mapAirwallexStatus('ACTIVE')).toBe('active');
    expect(mapAirwallexStatus('UNPAID')).toBe('past_due');
    expect(mapAirwallexStatus('CANCELLED')).toBe('canceled');
  });
});
