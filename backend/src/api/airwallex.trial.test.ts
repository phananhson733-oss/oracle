// INPUT: /api/airwallex/start-pro-trial route with mocked auth, Pro trial service, and Airwallex checkout.
// OUTPUT: vitest integration coverage for manual Pro trial checkout creation and eligibility conflicts.
// POS: Airwallex Pro trial activation route regression test; update backend/src/FOLDER.md when changing route coverage.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';

const mockAssertEligible = vi.fn(async (_userId: string) => ({
  email: 'new@example.com',
  emailHash: 'hash_123',
  days: 7,
}));
const mockCreateSubscription = vi.fn(async (_input: unknown) => ({
  checkoutUrl: 'https://checkout.airwallex.test/trial',
  checkoutId: 'chk_trial',
  usedFirstDiscount: false,
}));

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

vi.mock('../services/proTrialService.js', () => ({
  default: {
    assertEligible: (userId: string) => mockAssertEligible(userId),
  },
  proTrialService: {
    assertEligible: (userId: string) => mockAssertEligible(userId),
  },
}));

vi.mock('../services/airwallexService.js', () => ({
  airwallexService: {
    createSubscription: (input: unknown) => mockCreateSubscription(input),
  },
  currencyKeyOf: () => 'usd',
}));

vi.mock('../db/supabase.js', () => ({
  supabase: { from: () => ({}) },
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

async function postStartProTrial(body: unknown) {
  const { default: supertest } = await import('supertest');
  return supertest(makeApp())
    .post('/api/airwallex/start-pro-trial')
    .send(body as object);
}

describe('POST /api/airwallex/start-pro-trial', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T00:00:00.000Z'));
    mockAssertEligible.mockReset();
    mockCreateSubscription.mockReset();
    mockAssertEligible.mockResolvedValue({
      email: 'new@example.com',
      emailHash: 'hash_123',
      days: 7,
    });
    mockCreateSubscription.mockResolvedValue({
      checkoutUrl: 'https://checkout.airwallex.test/trial',
      checkoutId: 'chk_trial',
      usedFirstDiscount: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates an Airwallex subscription checkout with a 7-day trial end', async () => {
    const res = await postStartProTrial({
      plan: 'monthly',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      checkoutUrl: 'https://checkout.airwallex.test/trial',
      checkoutId: 'chk_trial',
      trialEndsAt: '2026-07-09T00:00:00.000Z',
      trialDays: 7,
    });
    expect(mockAssertEligible).toHaveBeenCalledWith('user-1');
    expect(mockCreateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        email: 'new@example.com',
        plan: 'monthly',
        currency: 'USD',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        useFirstDiscount: false,
        trialEndsAt: '2026-07-09T00:00:00.000Z',
      }),
    );
  });

  it('returns 409 and does not create checkout when trial was already used', async () => {
    mockAssertEligible.mockRejectedValueOnce(new Error('trial_already_used'));

    const res = await postStartProTrial({
      plan: 'yearly',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'trial_already_used' });
    expect(mockCreateSubscription).not.toHaveBeenCalled();
  });
});
