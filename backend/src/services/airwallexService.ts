// Airwallex Service - handles Airwallex REST API calls
import {
  AIRWALLEX_API_BASE,
  AIRWALLEX_CREDENTIALS,
  AIRWALLEX_ENV,
  AIRWALLEX_PRICES,
  AIRWALLEX_CREDITS_PACKAGES,
  AIRWALLEX_SUBSCRIPTION_PRICING,
  AIRWALLEX_FIRST_DISCOUNT_RATE,
  isAirwallexConfigured,
  type SupportedCurrency,
} from '../config/airwallex.js';
import { supabase, isSupabaseConfigured } from '../db/supabase.js';
import crypto from 'crypto';

// Bearer Token cache
let cachedToken: string | null = null;
let tokenExpiry = 0;

// Price-block keys (lowercase) for the per-currency price/pricing tables.
type CurrencyKey = 'usd' | 'cny' | 'eur' | 'gbp';
const VALID_CURRENCY_KEYS: ReadonlySet<CurrencyKey> = new Set<CurrencyKey>(['usd', 'cny', 'eur', 'gbp']);

/**
 * Lowercase a SupportedCurrency to its price-block key, defaulting to 'usd' for
 * any unexpected input. Replaces the old `=== 'CNY' ? 'cny' : 'usd'` ternaries.
 */
export const currencyKeyOf = (currency: SupportedCurrency): CurrencyKey => {
  const key = (currency ?? '').toLowerCase() as CurrencyKey;
  return VALID_CURRENCY_KEYS.has(key) ? key : 'usd';
};

/**
 * Resolve the Airwallex subscription price ID for a currency/plan, with a safe
 * USD fallback when the currency's price ID is not configured in the dashboard.
 *
 * Hard rule: we NEVER fabricate a charge amount. When EUR/GBP price IDs are
 * unset we charge the real USD price ID (logging a warning) rather than
 * inventing a EUR/GBP amount. Throws only when even the USD base price is unset.
 */
export const resolvePriceIdWithFallback = (
  prices: Record<string, string>,
  currency: SupportedCurrency,
  plan: 'monthly' | 'yearly',
  useFirstDiscount: boolean,
): { priceId: string; usedFirstDiscount: boolean; fellBackToUsd: boolean } => {
  const key = currencyKeyOf(currency);
  const pick = (k: string): string => prices[k] || '';

  let usedFirstDiscount = false;
  let priceId = '';

  if (useFirstDiscount) {
    priceId = pick(`${plan}_first_${key}`);
    if (priceId) {
      usedFirstDiscount = true;
    } else {
      // Try USD first-discount before dropping to non-discount prices.
      const usdFirst = pick(`${plan}_first_usd`);
      if (usdFirst) {
        console.warn(`Airwallex first-discount price not configured for ${plan} ${key}, falling back to USD first-discount price`);
        return { priceId: usdFirst, usedFirstDiscount: true, fellBackToUsd: true };
      }
    }
  }

  if (!priceId) {
    priceId = pick(`${plan}_${key}`);
  }

  if (priceId) {
    return { priceId, usedFirstDiscount, fellBackToUsd: false };
  }

  // Currency-specific price ID missing → fall back to the real USD price ID.
  const usdPriceId = pick(`${plan}_usd`);
  if (usdPriceId) {
    console.warn(`Airwallex price ID not configured for ${plan} ${key}; falling back to USD price ID (no amount fabricated)`);
    return { priceId: usdPriceId, usedFirstDiscount: false, fellBackToUsd: true };
  }

  throw new Error(`Airwallex price not configured for ${plan} ${key} (and no USD fallback price set)`);
};

interface CreateSubscriptionInput {
  userId: string;
  email: string;
  plan: 'monthly' | 'yearly';
  currency: SupportedCurrency;
  successUrl: string;
  cancelUrl: string;
  useFirstDiscount?: boolean;
}

interface CreateOrderInput {
  userId: string;
  packageId: string;
  currency: SupportedCurrency;
  successUrl: string;
  cancelUrl: string;
}

// Airwallex 订阅列表项的真实形状（已实测，仅取对账需要的字段）。
export interface AirwallexSubscriptionListItem {
  id: string;
  billing_customer_id?: string;
  status: string;
  current_period_starts_at?: string;
  current_period_ends_at?: string;
  cancel_at_period_end?: boolean;
  recurring?: { period?: number; period_unit?: string };
}

class AirwallexService {
  // Get Bearer Token (with caching and auto-refresh)
  async getAccessToken(): Promise<string> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }

    // Reuse cached token if not expiring within 5 minutes
    if (cachedToken && Date.now() < tokenExpiry - 5 * 60 * 1000) {
      return cachedToken;
    }

    const response = await fetch(`${AIRWALLEX_API_BASE}/api/v1/authentication/login`, {
      method: 'POST',
      headers: {
        'x-client-id': AIRWALLEX_CREDENTIALS.clientId,
        'x-api-key': AIRWALLEX_CREDENTIALS.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Airwallex auth error:', error);
      throw new Error(`Airwallex authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    cachedToken = data.token;
    // Token TTL is typically 30 minutes
    tokenExpiry = Date.now() + (data.expires_at ? new Date(data.expires_at).getTime() - Date.now() : 30 * 60 * 1000);

    return cachedToken!;
  }

  // Create subscription via Billing Checkout
  async createSubscription(input: CreateSubscriptionInput): Promise<{ checkoutUrl: string; checkoutId: string; usedFirstDiscount: boolean }> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }

    const resolved = resolvePriceIdWithFallback(
      AIRWALLEX_PRICES as Record<string, string>,
      input.currency,
      input.plan,
      Boolean(input.useFirstDiscount),
    );
    const priceId = resolved.priceId;
    const usedFirstDiscount = resolved.usedFirstDiscount;

    const token = await this.getAccessToken();

    const response = await fetch(`${AIRWALLEX_API_BASE}/api/v1/billing_checkouts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(AIRWALLEX_CREDENTIALS.legalEntityId && { legal_entity_id: AIRWALLEX_CREDENTIALS.legalEntityId }),
        ...(AIRWALLEX_CREDENTIALS.paymentAccountId && { linked_payment_account_id: AIRWALLEX_CREDENTIALS.paymentAccountId }),
        customer_data: { email: input.email },
        line_items: [{ price_id: priceId, quantity: 1 }],
        mode: 'SUBSCRIPTION',
        subscription_data: {},
        request_id: `sub_${input.userId}_${Date.now()}`,
        metadata: {
          userId: input.userId,
          plan: input.plan,
          currency: input.currency,
          useFirstDiscount: String(usedFirstDiscount),
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Airwallex create subscription error:', response.status, errorBody);
      throw new Error(`Airwallex ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    return {
      checkoutUrl: data.url,
      checkoutId: data.id,
      usedFirstDiscount,
    };
  }

  // Get billing checkout details (to confirm subscription after payment)
  async getBillingCheckout(checkoutId: string): Promise<{
    id: string;
    status: string;
    subscription_id?: string;
    metadata?: Record<string, string>;
  }> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }

    const token = await this.getAccessToken();

    const response = await fetch(
      `${AIRWALLEX_API_BASE}/api/v1/billing_checkouts/${checkoutId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Airwallex ${response.status}: ${errorBody}`);
    }

    return await response.json();
  }

  // Create a one-time payment for subscription renewal
  async createRenewalPayment(input: {
    userId: string;
    email: string;
    plan: 'monthly' | 'yearly';
    currency: SupportedCurrency;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ paymentIntentId: string; clientSecret: string; currency: string; env: string }> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }

    const currencyKey = currencyKeyOf(input.currency);
    const pricing = AIRWALLEX_SUBSCRIPTION_PRICING[currencyKey][input.plan];
    const token = await this.getAccessToken();
    const shortId = input.userId.replace(/-/g, '').slice(0, 12);

    // Create PaymentIntent (one-time) — return_url controls post-payment redirect
    const piResponse = await fetch(`${AIRWALLEX_API_BASE}/api/v1/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: `renew_${shortId}_${input.plan}_${Date.now()}`,
        amount: pricing.amount / 100,
        currency: pricing.currency.toLowerCase(),
        merchant_order_id: `renew_${shortId}_${Date.now()}`,
        reusable: false,
        metadata: {
          userId: input.userId,
          plan: input.plan,
          type: 'renewal',
        },
        return_url: input.successUrl,
      }),
    });

    if (!piResponse.ok) {
      const errorBody = await piResponse.text();
      console.error('Airwallex renewal payment intent error:', errorBody);
      throw new Error(`Airwallex ${piResponse.status}: ${errorBody}`);
    }

    const piData = await piResponse.json();

    return {
      paymentIntentId: piData.id,
      clientSecret: piData.client_secret,
      currency: pricing.currency,
      env: AIRWALLEX_ENV,
    };
  }

  // Get PaymentIntent status
  async getPaymentIntent(paymentIntentId: string): Promise<{ id: string; status: string; amount?: number; currency?: string; metadata?: Record<string, string> }> {
    const token = await this.getAccessToken();
    const response = await fetch(`${AIRWALLEX_API_BASE}/api/v1/pa/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Airwallex ${response.status}: ${errorBody}`);
    }
    return await response.json();
  }

  // Create PaymentIntent for credits purchase
  async createOrder(input: CreateOrderInput): Promise<{ paymentIntentId: string; clientSecret: string; currency: string; env: string }> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }

    const packageInfo = AIRWALLEX_CREDITS_PACKAGES[input.packageId];
    if (!packageInfo) {
      throw new Error(`Invalid package ID: ${input.packageId}`);
    }

    const pricing = packageInfo[currencyKeyOf(input.currency)];
    const token = await this.getAccessToken();

    // Create PaymentIntent — return_url controls post-payment redirect on HPP
    const piResponse = await fetch(`${AIRWALLEX_API_BASE}/api/v1/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: `cr_${input.userId.replace(/-/g, '').slice(0, 12)}_${input.packageId.replace('credits_', '')}_${Date.now()}`,
        amount: pricing.amount / 100, // Airwallex uses major units (dollars/yuan), not cents
        currency: pricing.currency.toLowerCase(),
        merchant_order_id: `cr_${input.userId.replace(/-/g, '').slice(0, 12)}_${Date.now()}`,
        reusable: false,
        metadata: {
          userId: input.userId,
          packageId: input.packageId,
          credits: String(packageInfo.credits),
        },
        return_url: input.successUrl,
      }),
    });

    if (!piResponse.ok) {
      const errorBody = await piResponse.text();
      console.error('Airwallex create payment intent error:', errorBody);
      throw new Error(`Airwallex payment intent ${piResponse.status}: ${errorBody}`);
    }

    const piData = await piResponse.json();

    return {
      paymentIntentId: piData.id,
      clientSecret: piData.client_secret,
      currency: pricing.currency,
      env: AIRWALLEX_ENV,
    };
  }

  // Get subscription details from Airwallex (returns the full subscription object;
  // shape verified — includes billing_customer_id / current_period_*_at / recurring).
  async getSubscriptionDetails(subscriptionId: string): Promise<AirwallexSubscriptionListItem> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }

    const token = await this.getAccessToken();

    const response = await fetch(
      `${AIRWALLEX_API_BASE}/api/v1/subscriptions/${subscriptionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Airwallex get subscription error:', error);
      throw new Error(`Failed to get Airwallex subscription: ${response.statusText}`);
    }

    return await response.json();
  }

  // List subscriptions (paginated). Used by reconciliation/backfill — webhook-independent.
  // Real Airwallex shape (verified): items[] with id, billing_customer_id,
  // current_period_starts_at/ends_at, status, cancel_at_period_end, recurring.period_unit.
  async listSubscriptions(pageNum = 0, pageSize = 100): Promise<{
    items: AirwallexSubscriptionListItem[];
    hasMore: boolean;
  }> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }
    const token = await this.getAccessToken();
    const response = await fetch(
      `${AIRWALLEX_API_BASE}/api/v1/subscriptions?page_num=${pageNum}&page_size=${pageSize}`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Airwallex list subscriptions ${response.status}: ${errorBody}`);
    }
    const data = await response.json();
    const items: AirwallexSubscriptionListItem[] = Array.isArray(data.items) ? data.items : [];
    return { items, hasMore: items.length >= pageSize };
  }

  // Fetch a billing customer by its bcus_ id to resolve the email we set at checkout.
  // Real endpoint (verified): GET /api/v1/billing_customers/{id} -> { id, email, name, ... }.
  async getBillingCustomer(billingCustomerId: string): Promise<{ id: string; email?: string }> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }
    const token = await this.getAccessToken();
    const response = await fetch(
      `${AIRWALLEX_API_BASE}/api/v1/billing_customers/${billingCustomerId}`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Airwallex get billing customer ${response.status}: ${errorBody}`);
    }
    return await response.json();
  }

  // Cancel subscription at end of current period (best-effort — DB is source of truth)
  async cancelSubscription(subscriptionId: string): Promise<{ airwallexSuccess: boolean; error?: string }> {
    if (!isAirwallexConfigured()) {
      return { airwallexSuccess: false, error: 'Airwallex not configured' };
    }

    try {
      const token = await this.getAccessToken();

      // Try Update API first: set cancel_at_period_end
      const response = await fetch(
        `${AIRWALLEX_API_BASE}/api/v1/subscriptions/${subscriptionId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancel_at_period_end: true,
          }),
        }
      );

      if (response.ok) {
        return { airwallexSuccess: true };
      }

      const errorText = await response.text();
      console.warn('Airwallex update subscription error:', response.status, errorText);

      // Fallback: try the cancel endpoint directly
      const cancelResponse = await fetch(
        `${AIRWALLEX_API_BASE}/api/v1/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proration_behavior: 'NONE',
          }),
        }
      );

      if (cancelResponse.ok) {
        return { airwallexSuccess: true };
      }

      const cancelError = await cancelResponse.text();
      console.warn('Airwallex cancel (fallback) error:', cancelResponse.status, cancelError);
      return { airwallexSuccess: false, error: `Update ${response.status}, Cancel ${cancelResponse.status}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Airwallex cancel subscription network error:', msg);
      return { airwallexSuccess: false, error: msg };
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    if (!AIRWALLEX_CREDENTIALS.webhookSecret) {
      console.error('Airwallex webhook secret not configured, rejecting webhook');
      return false;
    }

    const message = `${timestamp}${payload}`;
    const expectedSig = crypto
      .createHmac('sha256', AIRWALLEX_CREDENTIALS.webhookSecret)
      .update(message)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  }

  // Check if webhook event is already processed (idempotency)
  async isEventProcessed(eventId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    return !!data;
  }

  // Record webhook event
  async recordWebhookEvent(eventId: string, eventType: string, payload: unknown): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase.from('webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      provider: 'airwallex',
      payload,
    });
  }

  // Get pricing info for API response
  getPricing(currency: SupportedCurrency) {
    const currencyKey = currencyKeyOf(currency);
    const subPricing = AIRWALLEX_SUBSCRIPTION_PRICING[currencyKey];

    const creditsPackages = Object.values(AIRWALLEX_CREDITS_PACKAGES).map((pkg) => ({
      id: pkg.id,
      credits: pkg.credits,
      amount: pkg[currencyKey].amount,
      currency,
      name: pkg.name,
      description: pkg.description,
    }));

    return {
      currency,
      subscription: {
        monthly: { amount: subPricing.monthly.amount, currency },
        yearly: { amount: subPricing.yearly.amount, currency },
        firstDiscount: {
          rate: AIRWALLEX_FIRST_DISCOUNT_RATE,
          monthly: { amount: Math.round(subPricing.monthly.amount * (1 - AIRWALLEX_FIRST_DISCOUNT_RATE)), currency },
          yearly: { amount: Math.round(subPricing.yearly.amount * (1 - AIRWALLEX_FIRST_DISCOUNT_RATE)), currency },
        },
      },
      credits: creditsPackages,
    };
  }
}

export const airwallexService = new AirwallexService();
export default airwallexService;
