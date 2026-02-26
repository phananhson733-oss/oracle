// Airwallex Payment API
import { Router, Request, Response } from 'express';
import { authMiddleware, requireAuth } from './auth.js';
import { airwallexService } from '../services/airwallexService.js';
import subscriptionService from '../services/subscriptionService.js';
import entitlementServiceV2 from '../services/entitlementServiceV2.js';
import {
  isAirwallexConfigured,
  AIRWALLEX_CREDITS_PACKAGES,
  resolveCurrency,
} from '../config/airwallex.js';
import { SUBSCRIPTION_BENEFITS } from '../config/auth.js';
import { supabase, isSupabaseConfigured } from '../db/supabase.js';

const router = Router();

// Validate redirect URL to prevent open redirect
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol === 'http:' && parsed.hostname === 'localhost') return true;
    return false;
  } catch {
    return false;
  }
}

// =====================================================
// Pricing
// =====================================================

// GET /api/airwallex/pricing
router.get('/pricing', async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  const currency = resolveCurrency(lang);
  const pricing = airwallexService.getPricing(currency);
  res.json(pricing);
});

// =====================================================
// Subscription
// =====================================================

// POST /api/airwallex/subscribe
router.post('/subscribe', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isAirwallexConfigured()) {
      return res.status(503).json({ error: 'Airwallex service unavailable' });
    }

    const { plan, successUrl, cancelUrl, useFirstDiscount, lang } = req.body;

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'successUrl and cancelUrl required' });
    }

    if (!isValidRedirectUrl(successUrl) || !isValidRedirectUrl(cancelUrl)) {
      return res.status(400).json({ error: 'Invalid redirect URL' });
    }

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be monthly or yearly' });
    }

    // Check if already subscribed
    const entitlements = await entitlementServiceV2.getEntitlements(req.userId!);
    if (entitlements.isSubscriber && !entitlements.isTrialing) {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    // Check first discount eligibility
    let applyFirstDiscount = false;
    if (useFirstDiscount) {
      const eligible = await subscriptionService.isEligibleForFirstDiscount(req.userId!);
      if (eligible) {
        applyFirstDiscount = true;
      }
    }

    // Get user email
    let email = '';
    if (isSupabaseConfigured()) {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', req.userId)
        .single();
      email = user?.email || '';
    }

    const currency = resolveCurrency(lang);

    const result = await airwallexService.createSubscription({
      userId: req.userId!,
      email,
      plan: plan as 'monthly' | 'yearly',
      currency,
      successUrl,
      cancelUrl,
      useFirstDiscount: applyFirstDiscount,
    });

    res.json({
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
      usedFirstDiscount: result.usedFirstDiscount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Airwallex create subscription error:', message, error);
    res.status(500).json({ error: `Failed to create subscription: ${message}` });
  }
});

// POST /api/airwallex/confirm-checkout — verify billing checkout and activate subscription
router.post('/confirm-checkout', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isAirwallexConfigured()) {
      return res.status(503).json({ error: 'Airwallex service unavailable' });
    }

    const { checkoutId } = req.body;
    if (!checkoutId) {
      return res.status(400).json({ error: 'checkoutId required' });
    }

    // Query Airwallex for the billing checkout status
    const checkout = await airwallexService.getBillingCheckout(checkoutId);

    if (checkout.status !== 'COMPLETED') {
      return res.json({ confirmed: false, status: checkout.status });
    }

    const metadata = checkout.metadata || {};
    const userId = metadata.userId;

    // Verify the checkout belongs to this user
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Checkout does not belong to this user' });
    }

    const subscriptionId = checkout.subscription_id;
    if (!subscriptionId) {
      return res.json({ confirmed: false, status: 'NO_SUBSCRIPTION' });
    }

    // Get subscription details from Airwallex
    const subscription = await airwallexService.getSubscriptionDetails(subscriptionId);
    const plan = metadata.plan || 'monthly';
    const useFirstDiscount = metadata.useFirstDiscount === 'true';

    const startDate = new Date((subscription as any).current_period_starts_at || (subscription as any).starts_at || new Date());
    const endDate = new Date((subscription as any).current_period_ends_at || startDate);
    if (!(subscription as any).current_period_ends_at) {
      if (plan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);
    }

    if (isSupabaseConfigured()) {
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id, airwallex_subscription_id')
        .eq('user_id', userId)
        .single();

      // Skip if already activated with this subscription
      if (existing?.airwallex_subscription_id === subscriptionId) {
        return res.json({ confirmed: true, alreadyActive: true });
      }

      const subData = {
        user_id: userId,
        airwallex_subscription_id: subscriptionId,
        airwallex_customer_id: (checkout as any).billing_customer_id || null,
        payment_provider: 'airwallex',
        plan,
        status: 'active' as const,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('subscriptions').update(subData).eq('user_id', userId);
      } else {
        await supabase.from('subscriptions').insert({
          ...subData,
          usage: { synastryReads: 0, monthlyReportClaimed: false },
        });
      }

      // Mark first discount used
      if (useFirstDiscount) {
        await supabase.from('users').update({ used_first_discount: true }).eq('id', userId);
      }

      // Award bonus credits (ignore if RPC doesn't exist)
      try {
        await supabase.rpc('add_user_credits', {
          p_user_id: userId,
          p_amount: SUBSCRIPTION_BENEFITS.SUBSCRIPTION_BONUS_CREDITS,
        });
      } catch { /* RPC may not exist yet */ }
    }

    res.json({ confirmed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Airwallex confirm-checkout error:', message);
    res.status(500).json({ error: 'Failed to confirm checkout' });
  }
});

// GET /api/airwallex/subscription
router.get('/subscription', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const subscription = await subscriptionService.getSubscription(req.userId!);

    if (!subscription) {
      return res.json({ subscription: null });
    }

    // If Airwallex subscription, try to get latest status
    if (subscription.payment_provider === 'airwallex' && subscription.airwallex_subscription_id) {
      try {
        // Fetch latest from Airwallex (validates subscription still active)
        await airwallexService.getSubscriptionDetails(subscription.airwallex_subscription_id);

        return res.json({
          subscription: {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            provider: 'airwallex',
            airwallexSubscriptionId: subscription.airwallex_subscription_id,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
      } catch {
        // Airwallex API failed, return DB info
      }
    }

    res.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        provider: subscription.payment_provider,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// POST /api/airwallex/cancel-subscription
router.post('/cancel-subscription', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isAirwallexConfigured()) {
      return res.status(503).json({ error: 'Airwallex service unavailable' });
    }

    const subscription = await subscriptionService.getSubscription(req.userId!);

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription' });
    }

    if (subscription.payment_provider !== 'airwallex' || !subscription.airwallex_subscription_id) {
      return res.status(400).json({ error: 'Not an Airwallex subscription' });
    }

    await airwallexService.cancelSubscription(subscription.airwallex_subscription_id);

    // Update DB status
    if (isSupabaseConfigured()) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// =====================================================
// Credits Purchase
// =====================================================

// POST /api/airwallex/create-order
router.post('/create-order', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isAirwallexConfigured()) {
      return res.status(503).json({ error: 'Airwallex service unavailable' });
    }

    const { packageId, successUrl, cancelUrl, lang } = req.body;

    if (!packageId || !AIRWALLEX_CREDITS_PACKAGES[packageId]) {
      return res.status(400).json({ error: 'Invalid packageId' });
    }

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'successUrl and cancelUrl required' });
    }

    if (!isValidRedirectUrl(successUrl) || !isValidRedirectUrl(cancelUrl)) {
      return res.status(400).json({ error: 'Invalid redirect URL' });
    }

    const currency = resolveCurrency(lang);

    const result = await airwallexService.createOrder({
      userId: req.userId!,
      packageId: packageId as string,
      currency,
      successUrl,
      cancelUrl,
    });

    res.json({
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    console.error('Airwallex create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// =====================================================
// Webhook
// =====================================================

// POST /api/airwallex/webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!isAirwallexConfigured()) {
      return res.status(503).json({ error: 'Airwallex service unavailable' });
    }

    // Parse raw body
    let payload: string;
    let event: any;
    if (Buffer.isBuffer(req.body)) {
      payload = req.body.toString();
      event = JSON.parse(payload);
    } else if (typeof req.body === 'string') {
      payload = req.body;
      event = JSON.parse(payload);
    } else {
      payload = JSON.stringify(req.body);
      event = req.body;
    }

    // Verify signature (required in production)
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;

    if (!signature || !timestamp) {
      console.error('Airwallex webhook missing signature headers');
      return res.status(401).json({ error: 'Missing signature headers' });
    }

    const isValid = airwallexService.verifyWebhookSignature(payload, signature, timestamp);
    if (!isValid) {
      console.error('Airwallex webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const eventId = event.id || event.name + '_' + Date.now();
    const eventType = event.name || event.type;

    // Idempotency check
    if (await airwallexService.isEventProcessed(eventId)) {
      console.log(`Airwallex webhook event already processed: ${eventId}`);
      return res.json({ received: true, status: 'already_processed' });
    }

    // Record event
    await airwallexService.recordWebhookEvent(eventId, eventType, event);

    // Handle event types
    switch (eventType) {
      case 'subscription.active':
      case 'subscription.activated':
        await handleSubscriptionActive(event);
        break;

      case 'subscription.cancelled':
      case 'subscription.canceled':
        await handleSubscriptionCancelled(event);
        break;

      case 'subscription.unpaid':
        await handleSubscriptionUnpaid(event);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;

      default:
        console.log(`Unhandled Airwallex webhook event: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Airwallex webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =====================================================
// Webhook Event Handlers
// =====================================================

async function handleSubscriptionActive(event: any): Promise<void> {
  const data = event.data || event;
  const subscriptionId = data.id || data.subscription_id;
  const customerId = data.customer_id;
  const metadata = data.metadata || {};
  const userId = metadata.userId;
  const plan = metadata.plan || 'monthly';
  const useFirstDiscount = metadata.useFirstDiscount === 'true';

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in Airwallex subscription event');
    return;
  }

  const startDate = new Date(data.current_period_start || data.start_date || new Date());
  const endDate = new Date(data.current_period_end || startDate);
  if (data.current_period_end == null) {
    if (plan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);
  }

  if (isSupabaseConfigured()) {
    // Upsert subscription
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    const subData = {
      user_id: userId,
      airwallex_subscription_id: subscriptionId,
      airwallex_customer_id: customerId || null,
      payment_provider: 'airwallex',
      plan,
      status: 'active' as const,
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('subscriptions')
        .update(subData)
        .eq('user_id', userId);
    } else {
      await supabase.from('subscriptions').insert({
        ...subData,
        usage: { synastryReads: 0, monthlyReportClaimed: false },
      });
    }

    // Mark first discount used
    if (useFirstDiscount) {
      await supabase
        .from('users')
        .update({ used_first_discount: true })
        .eq('id', userId);
    }

    // Award bonus credits
    await supabase.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: SUBSCRIPTION_BENEFITS.SUBSCRIPTION_BONUS_CREDITS,
    });
  }

  console.log(`Airwallex subscription activated: ${subscriptionId} for user ${userId}`);
}

async function handleSubscriptionCancelled(event: any): Promise<void> {
  const data = event.data || event;
  const subscriptionId = data.id || data.subscription_id;

  if (!subscriptionId) return;

  if (isSupabaseConfigured()) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('airwallex_subscription_id', subscriptionId);
  }

  console.log(`Airwallex subscription cancelled: ${subscriptionId}`);
}

async function handleSubscriptionUnpaid(event: any): Promise<void> {
  const data = event.data || event;
  const subscriptionId = data.id || data.subscription_id;

  if (!subscriptionId) return;

  if (isSupabaseConfigured()) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('airwallex_subscription_id', subscriptionId);
  }

  console.log(`Airwallex subscription unpaid: ${subscriptionId}`);
}

async function handlePaymentIntentSucceeded(event: any): Promise<void> {
  const data = event.data || event;
  const metadata = data.metadata || {};
  const userId = metadata.userId;
  const packageId = metadata.packageId;

  if (!userId || !packageId) {
    console.error('Missing metadata in Airwallex payment_intent.succeeded event');
    return;
  }

  const packageInfo = AIRWALLEX_CREDITS_PACKAGES[packageId];
  if (!packageInfo) {
    console.error(`Unknown package ID: ${packageId}`);
    return;
  }

  // Use server-side package credits, not metadata (prevent spoofing)
  const credits = packageInfo.credits;

  if (isSupabaseConfigured()) {
    // Record purchase
    await supabase.from('purchase_records').insert({
      user_id: userId,
      feature_type: 'credits',
      feature_id: packageId,
      scope: 'consumable',
      price_cents: packageInfo.usd.amount, // Record in USD for consistency
      quantity: credits,
      consumed: 0,
    });

    // Add credits
    await supabase.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: credits,
    });
  }

  console.log(`Airwallex credits purchase: ${credits} credits for user ${userId}`);
}

export default router;
