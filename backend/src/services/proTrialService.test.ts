// INPUT: userService/proTrialService modules + mocked Supabase client.
// OUTPUT: vitest coverage for free registration RPC usage and Pro trial eligibility rules.
// POS: Manual Pro trial activation regression tests; update services/FOLDER.md when changing coverage.

import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, any>;
type ResponseValue = { data: Row | null; error: any };

const responses = new Map<string, ResponseValue>();
const inserts: Array<{ table: string; row: Row }> = [];
const updates: Array<{ table: string; payload: Row; eq: Record<string, unknown> }> = [];
const rpcCalls: Array<{ name: string; args: Row }> = [];
let rpcResponse: ResponseValue = { data: null, error: null };

function keyOf(table: string, filters: Record<string, unknown>): string {
  const f = Object.entries(filters)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('&');
  return `${table}|${f}`;
}

function setResponse(table: string, filters: Record<string, unknown>, data: Row | null) {
  responses.set(keyOf(table, filters), { data, error: null });
}

function makeBuilder(table: string) {
  const filters: Record<string, unknown> = {};
  const builder: Record<string, any> = {
    select: () => builder,
    eq: (col: string, val: unknown) => {
      filters[col] = val;
      return builder;
    },
    in: (col: string, vals: unknown[]) => {
      filters[col] = vals.join(',');
      return builder;
    },
    limit: () => builder,
    single: () =>
      Promise.resolve(
        responses.get(keyOf(table, filters)) ?? { data: null, error: null },
      ),
    maybeSingle: () =>
      Promise.resolve(
        responses.get(keyOf(table, filters)) ?? { data: null, error: null },
      ),
    insert: (row: Row) => {
      inserts.push({ table, row });
      return Promise.resolve({ data: row, error: null });
    },
    update: (payload: Row) => ({
      eq: (col: string, val: unknown) => {
        updates.push({ table, payload, eq: { [col]: val } });
        return Promise.resolve({ data: payload, error: null });
      },
    }),
  };
  return builder;
}

const mockIsConfigured = vi.fn(() => true);
const mockEnrollAccountSubscriber = vi.fn(async (_email: string) => undefined);

vi.mock('../db/supabase.js', () => ({
  supabase: {
    from: (table: string) => makeBuilder(table),
    rpc: (name: string, args: Row) => {
      rpcCalls.push({ name, args });
      return {
        single: () => Promise.resolve(rpcResponse),
      };
    },
  },
  isSupabaseConfigured: () => mockIsConfigured(),
}));

vi.mock('./newsletterEnroll.js', () => ({
  enrollAccountSubscriber: (email: string) => mockEnrollAccountSubscriber(email),
}));

import userService from './userService.js';
import proTrialService from './proTrialService.js';

function baseUser(overrides: Row = {}): Row {
  return {
    id: 'user-new',
    email: 'New@Example.com',
    used_first_discount: false,
    trial_ends_at: null,
    ...overrides,
  };
}

describe('manual Pro trial activation services', () => {
  beforeEach(() => {
    responses.clear();
    inserts.length = 0;
    updates.length = 0;
    rpcCalls.length = 0;
    rpcResponse = { data: null, error: null };
    mockIsConfigured.mockReturnValue(true);
    mockEnrollAccountSubscriber.mockClear();
  });

  it('creates new users through the no-trial RPC', async () => {
    rpcResponse = {
      data: {
        id: 'user-new',
        email: 'new@example.com',
        provider: 'google',
        trial_ends_at: null,
        used_first_discount: false,
      },
      error: null,
    };

    const user = await userService.createUser({
      email: ' New@Example.COM ',
      name: 'New User',
      provider: 'google',
      providerId: 'google-1',
    });

    expect(user.id).toBe('user-new');
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].name).toBe('create_user_without_trial');
    expect(rpcCalls[0].args).toMatchObject({
      p_email: 'new@example.com',
      p_provider: 'google',
      p_provider_id: 'google-1',
      p_email_verified: true,
    });
    expect(rpcCalls[0].args).not.toHaveProperty('p_trial_days');
  });

  it('allows a new user with no subscription, legacy trial, claim, or first discount', async () => {
    const emailHash = proTrialService.emailHash('new@example.com');
    setResponse('users', { id: 'user-new' }, baseUser());
    setResponse('subscriptions', { status: 'active,trialing,past_due', user_id: 'user-new' }, null);
    setResponse('pro_trial_claims', { email_hash: emailHash }, null);

    await expect(proTrialService.getEligibility('user-new')).resolves.toEqual({
      eligible: true,
      days: 7,
    });
  });

  it('rejects users who already have an active local subscription', async () => {
    setResponse('users', { id: 'user-new' }, baseUser());
    setResponse('subscriptions', { status: 'active,trialing,past_due', user_id: 'user-new' }, { id: 'sub-1' });

    await expect(proTrialService.getEligibility('user-new')).resolves.toMatchObject({
      eligible: false,
      reason: 'active_subscription',
    });
  });

  it('rejects users while a legacy registration-time trial is still active', async () => {
    setResponse(
      'users',
      { id: 'user-new' },
      baseUser({ trial_ends_at: '2999-01-01T00:00:00.000Z' }),
    );
    setResponse('subscriptions', { status: 'active,trialing,past_due', user_id: 'user-new' }, null);

    await expect(proTrialService.getEligibility('user-new')).resolves.toMatchObject({
      eligible: false,
      reason: 'legacy_trial_active',
    });
  });

  it('rejects users who already have an Airwallex-backed Pro trial claim', async () => {
    const emailHash = proTrialService.emailHash('new@example.com');
    setResponse('users', { id: 'user-new' }, baseUser());
    setResponse('subscriptions', { status: 'active,trialing,past_due', user_id: 'user-new' }, null);
    setResponse('pro_trial_claims', { email_hash: emailHash }, {
      email_hash: emailHash,
      user_id: 'user-new',
      airwallex_subscription_id: 'sub_trial',
      plan: 'monthly',
    });

    await expect(proTrialService.getEligibility('user-new')).resolves.toMatchObject({
      eligible: false,
      reason: 'trial_already_used',
    });
  });

  it('records a successful trial claim and marks first discount used', async () => {
    setResponse('pro_trial_claims', { airwallex_subscription_id: 'sub_trial' }, null);

    await proTrialService.recordClaim({
      userId: 'user-new',
      email: 'New@Example.com',
      airwallexSubscriptionId: 'sub_trial',
      airwallexCustomerId: 'cus_trial',
      plan: 'monthly',
      trialStartedAt: '2026-07-02T00:00:00.000Z',
      trialEndsAt: '2026-07-09T00:00:00.000Z',
    });

    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe('pro_trial_claims');
    expect(inserts[0].row).toMatchObject({
      user_id: 'user-new',
      airwallex_subscription_id: 'sub_trial',
      airwallex_customer_id: 'cus_trial',
      plan: 'monthly',
    });
    expect(updates).toEqual([
      {
        table: 'users',
        payload: { used_first_discount: true },
        eq: { id: 'user-new' },
      },
    ]);
  });
});
