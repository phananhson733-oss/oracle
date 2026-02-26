// Airwallex Service - handles Airwallex REST API calls
import {
  AIRWALLEX_API_BASE,
  AIRWALLEX_CREDENTIALS,
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

    const currencyKey = input.currency === 'CNY' ? 'cny' : 'usd';
    let priceId: string;
    let usedFirstDiscount = false;

    if (input.useFirstDiscount) {
      const firstPriceId = input.plan === 'yearly'
        ? AIRWALLEX_PRICES[`yearly_first_${currencyKey}` as keyof typeof AIRWALLEX_PRICES]
        : AIRWALLEX_PRICES[`monthly_first_${currencyKey}` as keyof typeof AIRWALLEX_PRICES];

      if (firstPriceId) {
        priceId = firstPriceId;
        usedFirstDiscount = true;
      } else {
        console.warn(`Airwallex first discount price not configured for ${input.plan} ${currencyKey}, falling back`);
        priceId = AIRWALLEX_PRICES[`${input.plan}_${currencyKey}` as keyof typeof AIRWALLEX_PRICES];
      }
    } else {
      priceId = AIRWALLEX_PRICES[`${input.plan}_${currencyKey}` as keyof typeof AIRWALLEX_PRICES];
    }

    if (!priceId) {
      throw new Error(`Airwallex price not configured for ${input.plan} ${currencyKey}`);
    }

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

  // Create PaymentIntent for credits purchase
  async createOrder(input: CreateOrderInput): Promise<{ checkoutUrl: string }> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }

    const packageInfo = AIRWALLEX_CREDITS_PACKAGES[input.packageId];
    if (!packageInfo) {
      throw new Error(`Invalid package ID: ${input.packageId}`);
    }

    const pricing = input.currency === 'CNY' ? packageInfo.cny : packageInfo.usd;
    const token = await this.getAccessToken();

    // Create PaymentIntent
    const piResponse = await fetch(`${AIRWALLEX_API_BASE}/api/v1/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: `credits_${input.userId}_${input.packageId}_${Date.now()}`,
        amount: pricing.amount / 100, // Airwallex uses major units (dollars/yuan), not cents
        currency: pricing.currency.toLowerCase(),
        merchant_order_id: `credits_${input.userId}_${Date.now()}`,
        metadata: {
          userId: input.userId,
          packageId: input.packageId,
          credits: String(packageInfo.credits),
        },
        return_url: input.successUrl,
      }),
    });

    if (!piResponse.ok) {
      const error = await piResponse.text();
      console.error('Airwallex create payment intent error:', error);
      throw new Error(`Failed to create Airwallex payment intent: ${piResponse.statusText}`);
    }

    const piData = await piResponse.json();

    // Create hosted payment page (checkout session)
    const checkoutResponse = await fetch(`${AIRWALLEX_API_BASE}/api/v1/pa/payment_links/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: `link_${input.userId}_${input.packageId}_${Date.now()}`,
        amount: pricing.amount / 100,
        currency: pricing.currency.toLowerCase(),
        title: packageInfo.name,
        description: packageInfo.description,
        reference: piData.id,
        return_url: input.successUrl,
        metadata: {
          userId: input.userId,
          packageId: input.packageId,
          credits: String(packageInfo.credits),
          paymentIntentId: piData.id,
        },
      }),
    });

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.text();
      console.error('Airwallex create payment link error:', error);
      throw new Error(`Failed to create Airwallex payment link: ${checkoutResponse.statusText}`);
    }

    const checkoutData = await checkoutResponse.json();

    return {
      checkoutUrl: checkoutData.url,
    };
  }

  // Get subscription details from Airwallex
  async getSubscriptionDetails(subscriptionId: string): Promise<{
    id: string;
    status: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
  }> {
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

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!isAirwallexConfigured()) {
      throw new Error('Airwallex not configured');
    }

    const token = await this.getAccessToken();

    const response = await fetch(
      `${AIRWALLEX_API_BASE}/api/v1/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prorate: false,
          cancel_at_period_end: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Airwallex cancel subscription error:', error);
      throw new Error(`Failed to cancel Airwallex subscription: ${response.statusText}`);
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
    const currencyKey = currency === 'CNY' ? 'cny' : 'usd';
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
