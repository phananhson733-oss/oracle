// INPUT: entitlementServiceV2 with mocked subscription/proTrial services and stubbed data readers.
// OUTPUT: verifies Pro trial eligibility and trialing subscription entitlement behavior.
// POS: Pro trial entitlement regression tests; update services/FOLDER.md when changing coverage.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSubscription = vi.fn();
const mockGetProTrialEligibility = vi.fn();

vi.mock('../db/supabase.js', () => ({
  supabase: { from: () => ({}) },
  isSupabaseConfigured: () => true,
}));

vi.mock('./subscriptionService.js', () => ({
  default: {
    getSubscription: (userId: string) => mockGetSubscription(userId),
  },
}));

vi.mock('./proTrialService.js', () => ({
  default: {
    getEligibility: (userId: string) => mockGetProTrialEligibility(userId),
  },
}));

import entitlementServiceV2 from './entitlementServiceV2.js';

const service = entitlementServiceV2 as any;

describe('entitlementServiceV2 Pro trial behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetSubscription.mockReset();
    mockGetProTrialEligibility.mockReset();
    mockGetSubscription.mockResolvedValue(null);
    mockGetProTrialEligibility.mockResolvedValue({ eligible: false, days: 7 });

    vi.spyOn(service, 'getUser').mockResolvedValue({
      id: 'user-1',
      email: 'trial@example.com',
      used_first_discount: false,
      trial_ends_at: null,
    });
    vi.spyOn(service, 'getOrCreateFreeUsageForUser').mockResolvedValue({
      id: 'free-1',
      ask_used: 0,
      ask_reset_at: '2999-01-01T00:00:00.000Z',
      synthetica_used: 0,
      synthetica_reset_at: '2999-01-01T00:00:00.000Z',
      synastry_total_used: 0,
    });
    vi.spyOn(service, 'getOrCreateSubscriptionUsage').mockResolvedValue({
      id: 'usage-1',
      ask_used: 0,
      synastry_used: 0,
    });
    vi.spyOn(service, 'getPurchaseRecords').mockResolvedValue([]);
  });

  it('grants subscriber benefits for an active Airwallex trialing subscription', async () => {
    mockGetSubscription.mockResolvedValue({
      plan: 'monthly',
      status: 'trialing',
      current_period_end: '2999-01-08T00:00:00.000Z',
      payment_provider: 'airwallex',
    });

    const entitlements = await entitlementServiceV2.getEntitlements('user-1');

    expect(entitlements.isSubscriber).toBe(true);
    expect(entitlements.isTrialing).toBe(true);
    expect(entitlements.trialEndsAt).toBe('2999-01-08T00:00:00.000Z');
    expect(entitlements.subscription).toMatchObject({
      plan: 'monthly',
      status: 'trialing',
      provider: 'airwallex',
    });
    expect(entitlements.ask.subscriptionLeft).toBeGreaterThan(0);
    expect(entitlements.monthlyUnlocked.cbtStats).toBe(true);
  });

  it('does not grant subscriber benefits for an expired trialing subscription', async () => {
    mockGetSubscription.mockResolvedValue({
      plan: 'monthly',
      status: 'trialing',
      current_period_end: '2000-01-08T00:00:00.000Z',
      payment_provider: 'airwallex',
    });

    const entitlements = await entitlementServiceV2.getEntitlements('user-1');

    expect(entitlements.isSubscriber).toBe(false);
    expect(entitlements.isTrialing).toBe(false);
    expect(entitlements.subscription).toBeUndefined();
    expect(entitlements.ask.subscriptionLeft).toBe(0);
  });

  it('returns Pro trial eligibility and hides first discount while trial can be claimed', async () => {
    mockGetProTrialEligibility.mockResolvedValue({
      eligible: true,
      days: 7,
    });

    const entitlements = await entitlementServiceV2.getEntitlements('user-1');

    expect(entitlements.proTrial).toEqual({ eligible: true, days: 7 });
    expect(entitlements.isFirstDiscountEligible).toBe(false);
  });
});
