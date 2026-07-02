// INPUT: airwallexService.createSubscription with mocked Airwallex API.
// OUTPUT: verifies manual Pro trial checkout sends trial_ends_at and paid checkout does not.
// POS: Airwallex trial checkout regression tests; update services/FOLDER.md when changing coverage.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

function mockResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('airwallexService.createSubscription trial checkout', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      AIRWALLEX_CLIENT_ID: 'client_123',
      AIRWALLEX_API_KEY: 'key_123',
      AIRWALLEX_PRICE_MONTHLY_USD: 'price_monthly_usd',
      AIRWALLEX_PRICE_YEARLY_USD: 'price_yearly_usd',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = ORIGINAL_ENV;
  });

  it('sends subscription_data.trial_ends_at for manual Pro trial checkout', async () => {
    const createBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const href = String(url);
      if (href.includes('/authentication/login')) {
        return mockResponse({ token: 'token_123' });
      }
      if (href.includes('/billing_checkouts/create')) {
        createBodies.push(JSON.parse(String(init?.body)));
        return mockResponse({ url: 'https://checkout.airwallex.test/trial', id: 'chk_trial' });
      }
      throw new Error(`Unexpected URL: ${href}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { airwallexService } = await import('../airwallexService.js');
    await airwallexService.createSubscription({
      userId: 'user-1',
      email: 'buyer@example.com',
      plan: 'monthly',
      currency: 'USD',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      trialEndsAt: '2026-07-09T00:00:00.000Z',
    });

    expect(createBodies).toHaveLength(1);
    expect(createBodies[0].subscription_data).toEqual({
      trial_ends_at: '2026-07-09T00:00:00.000Z',
    });
    expect(createBodies[0].metadata).toMatchObject({
      activationType: 'pro_trial',
      trialEndsAt: '2026-07-09T00:00:00.000Z',
      useFirstDiscount: 'false',
    });
  });

  it('omits subscription_data for immediate paid checkout', async () => {
    const createBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const href = String(url);
      if (href.includes('/authentication/login')) {
        return mockResponse({ token: 'token_123' });
      }
      if (href.includes('/billing_checkouts/create')) {
        createBodies.push(JSON.parse(String(init?.body)));
        return mockResponse({ url: 'https://checkout.airwallex.test/paid', id: 'chk_paid' });
      }
      throw new Error(`Unexpected URL: ${href}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { airwallexService } = await import('../airwallexService.js');
    await airwallexService.createSubscription({
      userId: 'user-1',
      email: 'buyer@example.com',
      plan: 'monthly',
      currency: 'USD',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(createBodies).toHaveLength(1);
    expect(createBodies[0]).not.toHaveProperty('subscription_data');
    expect(createBodies[0].metadata).not.toHaveProperty('activationType');
  });
});
