// Airwallex Payment API
import { Router, Request, Response } from 'express';
import { authMiddleware, requireAuth } from './auth.js';
import { airwallexService } from '../services/airwallexService.js';
import subscriptionService from '../services/subscriptionService.js';
import entitlementServiceV2 from '../services/entitlementServiceV2.js';
import {
  isAirwallexConfigured,
  AIRWALLEX_CREDITS_PACKAGES,
  AIRWALLEX_SUBSCRIPTION_PRICING,
  resolveCurrency,
} from '../config/airwallex.js';
import { SUBSCRIPTION_BENEFITS } from '../config/auth.js';
import { supabase, isSupabaseConfigured } from '../db/supabase.js';
import { emailService } from '../services/emailService.js';

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

    // Check if already subscribed — route to renewal flow
    const entitlements = await entitlementServiceV2.getEntitlements(req.userId!);
    if (entitlements.isSubscriber && !entitlements.isTrialing) {
      // Renewal: create a one-time payment instead of new subscription
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
      const result = await airwallexService.createRenewalPayment({
        userId: req.userId!,
        email,
        plan: plan as 'monthly' | 'yearly',
        currency,
        successUrl,
        cancelUrl,
      });
      return res.json({
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        currency: result.currency,
        env: result.env,
        renewalId: result.paymentIntentId,
        isRenewal: true,
      });
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

    // 试用期用户付费：将剩余试用天数追加到订阅到期时间
    if (isSupabaseConfigured()) {
      const { data: userRow } = await supabase
        .from('users')
        .select('trial_ends_at')
        .eq('id', userId)
        .single();

      if (userRow?.trial_ends_at) {
        const trialEnd = new Date(userRow.trial_ends_at);
        const now = new Date();
        if (trialEnd > now) {
          const remainingMs = trialEnd.getTime() - now.getTime();
          endDate.setTime(endDate.getTime() + remainingMs);
        }
      }
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

      // Award bonus credits via direct INSERT (idempotent by feature_id)
      const bonusFeatureId = `sub_bonus:${subscriptionId}`;
      const { data: bonusExists } = await supabase
        .from('purchase_records')
        .select('id')
        .eq('user_id', userId)
        .eq('feature_id', bonusFeatureId)
        .limit(1)
        .single();

      if (!bonusExists) {
        await supabase.from('purchase_records').insert({
          user_id: userId,
          feature_type: 'gm_credit',
          feature_id: bonusFeatureId,
          scope: 'consumable',
          price_cents: 0,
          quantity: SUBSCRIPTION_BENEFITS.SUBSCRIPTION_BONUS_CREDITS,
          consumed: 0,
        });
      }
    }

    res.json({ confirmed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Airwallex confirm-checkout error:', message);
    res.status(500).json({ error: 'Failed to confirm checkout' });
  }
});

// POST /api/airwallex/confirm-renewal — verify renewal payment and extend subscription
router.post('/confirm-renewal', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isAirwallexConfigured()) {
      return res.status(503).json({ error: 'Airwallex service unavailable' });
    }

    const { renewalId } = req.body;
    if (!renewalId) {
      return res.status(400).json({ error: 'renewalId required' });
    }

    // Idempotency: check if this renewal was already processed
    if (isSupabaseConfigured()) {
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', req.userId)
        .contains('usage', { last_renewal_id: renewalId })
        .single();
      if (existing) {
        return res.json({ confirmed: true, alreadyProcessed: true });
      }
    }

    // Check PaymentIntent status
    const pi = await airwallexService.getPaymentIntent(renewalId);
    if (pi.status !== 'SUCCEEDED') {
      return res.json({ confirmed: false, status: pi.status });
    }

    const metadata = pi.metadata || {};
    if (metadata.userId !== req.userId) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    // Validate this is actually a renewal payment
    if (metadata.type !== 'renewal') {
      return res.status(400).json({ error: 'Invalid payment type' });
    }

    const plan = (metadata.plan === 'yearly' ? 'yearly' : 'monthly') as 'monthly' | 'yearly';

    if (isSupabaseConfigured()) {
      // Get current subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, current_period_end, usage')
        .eq('user_id', req.userId)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!sub) {
        return res.status(400).json({ error: 'No active subscription to renew' });
      }

      // Extend from current period end (or now if expired)
      const baseDate = new Date(sub.current_period_end || new Date());
      const now = new Date();
      const startFrom = baseDate > now ? baseDate : now;

      const newEnd = new Date(startFrom);
      if (plan === 'yearly') {
        newEnd.setDate(newEnd.getDate() + 366);
      } else {
        newEnd.setDate(newEnd.getDate() + 31);
      }

      // Update subscription and record renewal ID for idempotency
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          current_period_end: newEnd.toISOString(),
          status: 'active',
          usage: { ...(sub.usage || {}), last_renewal_id: renewalId },
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      if (updateError) {
        console.error('Failed to update subscription for renewal:', updateError);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      // Award renewal bonus credits (idempotent by feature_id)
      const bonusFeatureId = `renewal_bonus:${renewalId}`;
      const { data: bonusExists } = await supabase
        .from('purchase_records')
        .select('id')
        .eq('user_id', req.userId)
        .eq('feature_id', bonusFeatureId)
        .limit(1)
        .single();

      if (!bonusExists) {
        await supabase.from('purchase_records').insert({
          user_id: req.userId!,
          feature_type: 'gm_credit',
          feature_id: bonusFeatureId,
          scope: 'consumable',
          price_cents: 0,
          quantity: SUBSCRIPTION_BENEFITS.SUBSCRIPTION_BONUS_CREDITS,
          consumed: 0,
        });
      }
    }

    res.json({ confirmed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Airwallex confirm-renewal error:', message);
    res.status(500).json({ error: 'Failed to confirm renewal' });
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

    const { reason } = req.body || {};

    // Query specifically for Airwallex subscription to avoid provider mismatch
    let subscription: any = null;
    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', req.userId!)
        .eq('payment_provider', 'airwallex')
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      subscription = data;
    }

    if (!subscription) {
      return res.status(404).json({ error: 'No active Airwallex subscription' });
    }

    // Best-effort Airwallex API call — DB update is the source of truth
    let airwallexResult: { airwallexSuccess: boolean; error?: string } = { airwallexSuccess: false, error: 'no subscription id' };
    if (subscription.airwallex_subscription_id) {
      airwallexResult = await airwallexService.cancelSubscription(subscription.airwallex_subscription_id);
    }

    // Always update DB regardless of Airwallex API result
    if (isSupabaseConfigured()) {
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
    }

    if (reason) {
      const sanitizedReason = String(reason).replace(/[\n\r]/g, ' ').slice(0, 200);
      console.log(`[CancelSubscription] user=${req.userId} reason="${sanitizedReason}" airwallex=${airwallexResult.airwallexSuccess}`);
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
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
      currency: result.currency,
      env: result.env,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Airwallex create order error:', message, error);
    res.status(500).json({ error: `Failed to create order: ${message}` });
  }
});

// POST /api/airwallex/confirm-order — verify credits payment and add credits
router.post('/confirm-order', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isAirwallexConfigured()) {
      return res.status(503).json({ error: 'Airwallex service unavailable' });
    }

    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId required' });
    }

    // Check PaymentIntent status
    const pi = await airwallexService.getPaymentIntent(paymentIntentId);
    if (pi.status !== 'SUCCEEDED') {
      return res.json({ confirmed: false, status: pi.status });
    }

    const metadata = pi.metadata || {};
    if (metadata.userId !== req.userId) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    const packageId = metadata.packageId;
    if (!packageId) {
      return res.status(400).json({ error: 'Missing packageId in payment metadata' });
    }

    const packageInfo = AIRWALLEX_CREDITS_PACKAGES[packageId];
    if (!packageInfo) {
      return res.status(400).json({ error: `Unknown package: ${packageId}` });
    }

    const credits = packageInfo.credits;

    if (isSupabaseConfigured()) {
      // Idempotency: use paymentIntentId as unique key (shared with webhook handler)
      const idempotencyKey = `${packageId}:${paymentIntentId}`;
      const { data: existing } = await supabase
        .from('purchase_records')
        .select('id')
        .eq('user_id', req.userId)
        .eq('feature_id', idempotencyKey)
        .limit(1)
        .single();

      if (existing) {
        return res.json({ confirmed: true, alreadyProcessed: true, credits });
      }

      // Use actual payment amount/currency from PaymentIntent
      const priceCents = pi.amount ? Math.round(pi.amount * 100) : packageInfo.usd.amount;

      // Insert with race-condition guard (duplicate key = already processed by webhook)
      const { error: insertErr } = await supabase.from('purchase_records').insert({
        user_id: req.userId,
        feature_type: 'gm_credit',
        feature_id: idempotencyKey,
        scope: 'consumable',
        price_cents: priceCents,
        quantity: credits,
        consumed: 0,
      });

      if (insertErr) {
        // Duplicate key means webhook already processed — safe to skip
        if (insertErr.code === '23505') {
          return res.json({ confirmed: true, alreadyProcessed: true, credits });
        }
        throw insertErr;
      }
    }

    res.json({ confirmed: true, credits });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Airwallex confirm-order error:', message);
    res.status(500).json({ error: 'Failed to confirm order' });
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
// Webhook Helpers
// =====================================================

/** Fire-and-forget email sender — logs errors, never blocks webhook response. */
function sendEmailBestEffort(fn: () => Promise<void>, label: string): void {
  fn().catch((err) => console.error(`Failed to send ${label} email:`, err));
}

async function getUserEmail(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
  if (error) {
    console.error(`getUserEmail failed for user ${userId}:`, error.message);
    return null;
  }
  return data?.email || null;
}

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
    // 试用期用户付费：将剩余试用天数追加到订阅到期时间
    const { data: userRow } = await supabase
      .from('users')
      .select('trial_ends_at')
      .eq('id', userId)
      .single();

    if (userRow?.trial_ends_at) {
      const trialEnd = new Date(userRow.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        const remainingMs = trialEnd.getTime() - now.getTime();
        endDate.setTime(endDate.getTime() + remainingMs);
      }
    }

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

    // Award bonus credits via direct INSERT (idempotent by feature_id)
    const bonusFeatureId = `sub_bonus:${subscriptionId}`;
    const { data: bonusExists } = await supabase
      .from('purchase_records')
      .select('id')
      .eq('user_id', userId)
      .eq('feature_id', bonusFeatureId)
      .limit(1)
      .single();

    if (!bonusExists) {
      await supabase.from('purchase_records').insert({
        user_id: userId,
        feature_type: 'gm_credit',
        feature_id: bonusFeatureId,
        scope: 'consumable',
        price_cents: 0,
        quantity: SUBSCRIPTION_BENEFITS.SUBSCRIPTION_BONUS_CREDITS,
        consumed: 0,
      });
    }
  }

  console.log(`Airwallex subscription activated: ${subscriptionId} for user ${userId}`);

  // Send payment receipt email (fire-and-forget, don't block webhook)
  sendEmailBestEffort(async () => {
    const email = await getUserEmail(userId);
    if (email) {
      await emailService.sendPaymentReceipt(email, {
        amount: data.amount ? String(data.amount) : (() => {
          const cur = (data.currency || 'USD').toUpperCase();
          const tier = cur === 'CNY' ? AIRWALLEX_SUBSCRIPTION_PRICING.cny : AIRWALLEX_SUBSCRIPTION_PRICING.usd;
          return (plan === 'yearly' ? tier.yearly.amount : tier.monthly.amount) / 100;
        })().toFixed(2),
        currency: data.currency || 'USD',
        description: `AstrologyWiki Pro — ${plan === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
        transactionId: subscriptionId,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
    }
  }, 'subscription receipt');
}

async function handleSubscriptionCancelled(event: any): Promise<void> {
  const data = event.data || event;
  const subscriptionId = data.id || data.subscription_id;

  if (!subscriptionId) return;

  // Fetch subscription info before update (for email)
  let subUserId: string | null = null;
  let periodEnd: string | null = null;

  if (isSupabaseConfigured()) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id, current_period_end')
      .eq('airwallex_subscription_id', subscriptionId)
      .single();

    subUserId = sub?.user_id || null;
    periodEnd = sub?.current_period_end || null;

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

  // Send cancellation confirmation email (fire-and-forget)
  if (subUserId) {
    const capturedUserId = subUserId;
    const capturedPeriodEnd = periodEnd;
    sendEmailBestEffort(async () => {
      const email = await getUserEmail(capturedUserId);
      if (email) {
        const endDate = capturedPeriodEnd
          ? new Date(capturedPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'your current billing period end';
        await emailService.sendCancellationConfirmation(email, { endDate });
      }
    }, 'cancellation confirmation');
  }
}

async function handleSubscriptionUnpaid(event: any): Promise<void> {
  const data = event.data || event;
  const subscriptionId = data.id || data.subscription_id;

  if (!subscriptionId) return;

  // Fetch user_id before update (for email)
  let subUserId: string | null = null;

  if (isSupabaseConfigured()) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('airwallex_subscription_id', subscriptionId)
      .single();

    subUserId = sub?.user_id || null;

    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('airwallex_subscription_id', subscriptionId);
  }

  console.log(`Airwallex subscription unpaid: ${subscriptionId}`);

  // Send payment failed notice email (fire-and-forget)
  if (subUserId) {
    const capturedUserId = subUserId;
    sendEmailBestEffort(async () => {
      const email = await getUserEmail(capturedUserId);
      if (email) {
        await emailService.sendPaymentFailedNotice(email, {
          subscriptionId,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        });
      }
    }, 'payment failed notice');
  }
}

async function handlePaymentIntentSucceeded(event: any): Promise<void> {
  const data = event.data || event;
  const piId = data.id;
  const metadata = data.metadata || {};
  const userId = metadata.userId;
  const packageId = metadata.packageId;

  if (!userId || !packageId) {
    // May be a renewal or non-credits payment — skip silently
    console.log('Airwallex payment_intent.succeeded: no packageId in metadata, skipping credits flow');
    return;
  }

  const packageInfo = AIRWALLEX_CREDITS_PACKAGES[packageId];
  if (!packageInfo) {
    console.error(`Unknown package ID: ${packageId}`);
    return;
  }

  // Use server-side package credits, not metadata (prevent spoofing)
  const credits = packageInfo.credits;
  // Use actual payment amount from PI event when available
  const priceCents = data.amount ? Math.round(data.amount * 100) : packageInfo.usd.amount;

  if (isSupabaseConfigured()) {
    // Idempotency: use same key format as confirm-order to prevent double-credit
    const idempotencyKey = `${packageId}:${piId}`;
    const { data: existing } = await supabase
      .from('purchase_records')
      .select('id')
      .eq('user_id', userId)
      .eq('feature_id', idempotencyKey)
      .limit(1)
      .single();

    if (existing) {
      console.log(`Airwallex credits already processed for PI ${piId}, skipping`);
      return;
    }

    // Record purchase (race-condition guard: unique constraint on feature_id)
    const { error: insertErr } = await supabase.from('purchase_records').insert({
      user_id: userId,
      feature_type: 'gm_credit',
      feature_id: idempotencyKey,
      scope: 'consumable',
      price_cents: priceCents,
      quantity: credits,
      consumed: 0,
    });

    if (insertErr) {
      if (insertErr.code === '23505') {
        console.log(`Airwallex webhook: duplicate insert for PI ${piId}, already processed`);
        return;
      }
      throw insertErr;
    }
  }

  console.log(`Airwallex credits purchase: ${credits} credits for user ${userId}`);

  // Send payment receipt email for credits purchase (fire-and-forget)
  sendEmailBestEffort(async () => {
    const email = await getUserEmail(userId);
    if (email) {
      const amountStr = (priceCents / 100).toFixed(2);
      await emailService.sendPaymentReceipt(email, {
        amount: amountStr,
        currency: data.currency || 'USD',
        description: `${credits} GM Credits`,
        transactionId: piId || 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
    }
  }, 'credits purchase receipt');
}

export default router;
