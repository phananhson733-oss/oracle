// PayPal Payment API
import { Router, Request, Response } from 'express';
import { authMiddleware, requireAuth } from './auth.js';
import { paypalService } from '../services/paypalService.js';
import subscriptionService from '../services/subscriptionService.js';
import entitlementServiceV2 from '../services/entitlementServiceV2.js';
import {
  isPayPalConfigured,
  PAYPAL_CREDENTIALS,
  CREDITS_PACKAGES,
  SUBSCRIPTION_PRICING,
  FIRST_DISCOUNT_PRICING,
  FIRST_DISCOUNT_RATE,
  PAYPAL_PLANS,
  usdToCny,
  formatUSD,
  formatCNYRef
} from '../config/paypal.js';
import { SUBSCRIPTION_BENEFITS } from '../config/auth.js';
import { supabase, isSupabaseConfigured } from '../db/supabase.js';

const router = Router();

// 校验重定向 URL，防止开放重定向攻击
function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // 仅允许 https 协议，或本地开发 http://localhost
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol === 'http:' && parsed.hostname === 'localhost') return true;
    return false;
  } catch {
    return false;
  }
}

// =====================================================
// 定价信息
// =====================================================

// GET /api/paypal/pricing
// 获取 PayPal 定价信息
router.get('/pricing', async (_req: Request, res: Response) => {
  res.json({
    subscription: {
      monthly: {
        amount: SUBSCRIPTION_PRICING.monthly.amount,
        currency: 'USD',
        cnyRef: usdToCny(SUBSCRIPTION_PRICING.monthly.amount),
        display: formatUSD(SUBSCRIPTION_PRICING.monthly.amount),
        cnyDisplay: formatCNYRef(SUBSCRIPTION_PRICING.monthly.amount),
        interval: 'month',
        name: SUBSCRIPTION_PRICING.monthly.name,
      },
      yearly: {
        amount: SUBSCRIPTION_PRICING.yearly.amount,
        currency: 'USD',
        cnyRef: usdToCny(SUBSCRIPTION_PRICING.yearly.amount),
        display: formatUSD(SUBSCRIPTION_PRICING.yearly.amount),
        cnyDisplay: formatCNYRef(SUBSCRIPTION_PRICING.yearly.amount),
        interval: 'year',
        name: SUBSCRIPTION_PRICING.yearly.name,
        savings: 20, // 20% off
      },
      // 首次折扣价格
      first_discount: {
        rate: FIRST_DISCOUNT_RATE,
        monthly: {
          amount: FIRST_DISCOUNT_PRICING.monthly.amount,
          display: formatUSD(FIRST_DISCOUNT_PRICING.monthly.amount),
          cnyDisplay: formatCNYRef(FIRST_DISCOUNT_PRICING.monthly.amount),
        },
        yearly: {
          amount: FIRST_DISCOUNT_PRICING.yearly.amount,
          display: formatUSD(FIRST_DISCOUNT_PRICING.yearly.amount),
          cnyDisplay: formatCNYRef(FIRST_DISCOUNT_PRICING.yearly.amount),
        },
      },
    },
    credits: Object.entries(CREDITS_PACKAGES).map(([id, pkg]) => ({
      id,
      credits: pkg.credits,
      amount: pkg.amount,
      currency: 'USD',
      cnyRef: usdToCny(pkg.amount),
      display: formatUSD(pkg.amount),
      cnyDisplay: formatCNYRef(pkg.amount),
      name: pkg.name,
    })),
  });
});

// =====================================================
// 订阅
// =====================================================

// POST /api/paypal/subscribe
// 创建订阅
router.post('/subscribe', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isPayPalConfigured()) {
      return res.status(503).json({ error: 'PayPal service unavailable' });
    }

    const { plan, successUrl, cancelUrl, useFirstDiscount } = req.body;

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'successUrl and cancelUrl required' });
    }

    if (!isValidRedirectUrl(successUrl) || !isValidRedirectUrl(cancelUrl)) {
      return res.status(400).json({ error: 'Invalid redirect URL' });
    }

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be monthly or yearly' });
    }

    // 检查是否已订阅
    const entitlements = await entitlementServiceV2.getEntitlements(req.userId!);
    if (entitlements.isSubscriber && !entitlements.isTrialing) {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    // 检查首次折扣资格
    let applyFirstDiscount = false;
    if (useFirstDiscount) {
      const eligible = await subscriptionService.isEligibleForFirstDiscount(req.userId!);
      if (eligible) {
        // 验证 PayPal 折扣计划已配置
        const planId = plan === 'yearly' ? PAYPAL_PLANS.yearly_first : PAYPAL_PLANS.monthly_first;
        if (planId) {
          applyFirstDiscount = true;
        }
      }
    }

    const result = await paypalService.createSubscription({
      userId: req.userId!,
      plan: plan as 'monthly' | 'yearly',
      successUrl,
      cancelUrl,
      useFirstDiscount: applyFirstDiscount,
    });

    res.json({
      subscriptionId: result.subscriptionId,
      approveUrl: result.approveUrl,
      usedFirstDiscount: result.usedFirstDiscount,
    });
  } catch (error) {
    console.error('PayPal create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// GET /api/paypal/subscription
// 获取订阅状态
router.get('/subscription', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const subscription = await subscriptionService.getSubscription(req.userId!);

    if (!subscription) {
      return res.json({ subscription: null });
    }

    // 如果是 PayPal 订阅，获取最新状态
    if (subscription.payment_provider === 'paypal' && subscription.paypal_subscription_id) {
      try {
        const paypalDetails = await paypalService.getSubscriptionDetails(
          subscription.paypal_subscription_id
        );

        return res.json({
          subscription: {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            provider: 'paypal',
            paypalSubscriptionId: subscription.paypal_subscription_id,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            nextBillingTime: paypalDetails.billing_info?.next_billing_time,
          },
        });
      } catch {
        // PayPal API 失败时返回数据库中的信息
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

// POST /api/paypal/confirm-subscription
// 支付成功页兜底确认订阅（防止 webhook 未送达）
router.post('/confirm-subscription', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isPayPalConfigured()) {
      return res.status(503).json({ error: 'PayPal service unavailable' });
    }

    const { subscriptionId } = req.body as { subscriptionId?: string };
    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId required' });
    }

    const details = await paypalService.getSubscriptionDetails(subscriptionId);
    const customIdStr = details.custom_id;

    let customData: { userId: string; useFirstDiscount?: boolean } | null = null;
    if (customIdStr) {
      try {
        customData = JSON.parse(customIdStr);
      } catch {
        customData = { userId: customIdStr };
      }
    }

    if (!customData?.userId || customData.userId !== req.userId) {
      return res.status(403).json({ error: 'Subscription does not belong to current user' });
    }

    const plan = details.plan_id === PAYPAL_PLANS.yearly || details.plan_id === PAYPAL_PLANS.yearly_first
      ? 'yearly'
      : 'monthly';

    const parseDate = (value?: string | null) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startDate = parseDate(details.start_time) || new Date();
    const nextBilling = parseDate(details.billing_info?.next_billing_time);
    let endDate = nextBilling ? new Date(nextBilling) : new Date(startDate);

    if (!nextBilling) {
      if (plan === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);
    }

    if (isSupabaseConfigured()) {
      const { data: existingByPayPal } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('paypal_subscription_id', subscriptionId)
        .maybeSingle();

      if (existingByPayPal) {
        await supabase
          .from('subscriptions')
          .update({
            user_id: req.userId,
            payment_provider: 'paypal',
            plan,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);
      } else {
        await supabase.from('subscriptions').insert({
          user_id: req.userId,
          paypal_subscription_id: subscriptionId,
          payment_provider: 'paypal',
          plan,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          usage: { synastryReads: 0, monthlyReportClaimed: false },
        });

        // Award bonus credits via direct INSERT (idempotent by feature_id)
        const bonusFeatureId = `sub_bonus:paypal:${subscriptionId}`;
        const { data: bonusExists } = await supabase
          .from('purchase_records')
          .select('id')
          .eq('user_id', req.userId)
          .eq('feature_id', bonusFeatureId)
          .limit(1)
          .single();

        if (!bonusExists) {
          await supabase.from('purchase_records').insert({
            user_id: req.userId,
            feature_type: 'gm_credit',
            feature_id: bonusFeatureId,
            scope: 'consumable',
            price_cents: 0,
            quantity: SUBSCRIPTION_BENEFITS.SUBSCRIPTION_BONUS_CREDITS,
            consumed: 0,
          });
        }
      }

      if (customData.useFirstDiscount) {
        await supabase
          .from('users')
          .update({ used_first_discount: true })
          .eq('id', req.userId);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Confirm PayPal subscription error:', error);
    res.status(500).json({ error: 'Failed to confirm subscription' });
  }
});

// POST /api/paypal/cancel-subscription
// 取消订阅
router.post('/cancel-subscription', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isPayPalConfigured()) {
      return res.status(503).json({ error: 'PayPal service unavailable' });
    }

    const subscription = await subscriptionService.getSubscription(req.userId!);

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription' });
    }

    if (subscription.payment_provider !== 'paypal' || !subscription.paypal_subscription_id) {
      return res.status(400).json({ error: 'Not a PayPal subscription' });
    }

    const { reason } = req.body;
    await paypalService.cancelSubscription(subscription.paypal_subscription_id, reason);

    // 更新数据库状态
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
// 积分购买
// =====================================================

// POST /api/paypal/create-order
// 创建积分购买订单
router.post('/create-order', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isPayPalConfigured()) {
      return res.status(503).json({ error: 'PayPal service unavailable' });
    }

    const { packageId, successUrl, cancelUrl } = req.body;

    if (!packageId || !CREDITS_PACKAGES[packageId]) {
      return res.status(400).json({ error: 'Invalid packageId' });
    }

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'successUrl and cancelUrl required' });
    }

    if (!isValidRedirectUrl(successUrl) || !isValidRedirectUrl(cancelUrl)) {
      return res.status(400).json({ error: 'Invalid redirect URL' });
    }

    const result = await paypalService.createOrder({
      userId: req.userId!,
      packageId: packageId as string,
      successUrl,
      cancelUrl,
    });

    res.json({
      orderId: result.orderId,
      approvalUrl: result.approvalUrl,
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// POST /api/paypal/capture-order
// 捕获订单（确认支付）
router.post('/capture-order', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isPayPalConfigured()) {
      return res.status(503).json({ error: 'PayPal service unavailable' });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }

    const result = await paypalService.captureOrder(orderId);

    if (!result.success) {
      return res.status(400).json({ error: 'Payment capture failed' });
    }

    // 验证用户 ID
    if (result.customData?.userId !== req.userId) {
      console.error('User ID mismatch in capture:', result.customData?.userId, req.userId);
      return res.status(400).json({ error: 'Invalid order' });
    }

    // 获取套餐信息
    const packageId = result.customData?.packageId;
    if (!packageId || !CREDITS_PACKAGES[packageId]) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const packageInfo = CREDITS_PACKAGES[packageId];

    // 发放积分
    if (isSupabaseConfigured()) {
      // 记录购买
      await supabase.from('purchase_records').insert({
        user_id: req.userId,
        feature_type: 'gm_credit',
        feature_id: packageId,
        scope: 'consumable',
        price_cents: packageInfo.amount,
        paypal_order_id: orderId,
        payment_provider: 'paypal',
        quantity: packageInfo.credits,
        consumed: 0,
      });
    }

    // 获取更新后的权益
    const entitlements = await entitlementServiceV2.getEntitlements(req.userId!);

    res.json({
      success: true,
      credits: packageInfo.credits,
      newBalance: entitlements.credits,
    });
  } catch (error) {
    console.error('PayPal capture order error:', error);
    res.status(500).json({ error: 'Failed to capture order' });
  }
});

// =====================================================
// Webhook
// =====================================================

// POST /api/paypal/webhook
// PayPal Webhook 处理
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!isPayPalConfigured()) {
      return res.status(503).json({ error: 'PayPal service unavailable' });
    }

    // 获取签名相关 header
    const headers = req.headers;
    const authAlgo = headers['paypal-auth-algo'] as string;
    const certUrl = headers['paypal-cert-url'] as string;
    const transmissionId = headers['paypal-transmission-id'] as string;
    const transmissionSig = headers['paypal-transmission-sig'] as string;
    const transmissionTime = headers['paypal-transmission-time'] as string;

    if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
      console.error('Missing PayPal webhook headers');
      return res.status(400).json({ error: 'Missing webhook headers' });
    }

    // 解析请求体
    let webhookEvent: any;
    if (Buffer.isBuffer(req.body)) {
      webhookEvent = JSON.parse(req.body.toString());
    } else if (typeof req.body === 'string') {
      webhookEvent = JSON.parse(req.body);
    } else {
      webhookEvent = req.body;
    }

    // 验证签名
    const isValid = await paypalService.verifyWebhookSignature({
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
      webhookId: PAYPAL_CREDENTIALS.webhookId,
      webhookEvent,
    });

    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const eventId = webhookEvent.id;
    const eventType = webhookEvent.event_type;

    // 幂等性检查
    if (await paypalService.isEventProcessed(eventId)) {
      console.log(`PayPal webhook event already processed: ${eventId}`);
      return res.json({ received: true, status: 'already_processed' });
    }

    // 记录事件
    await paypalService.recordWebhookEvent(eventId, eventType, webhookEvent);

    // 处理不同事件类型
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(webhookEvent);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        // 一次性支付已在 capture-order 端点处理，这里仅记录
        console.log('Payment capture completed:', eventId);
        break;

      default:
        console.log(`Unhandled PayPal webhook event: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =====================================================
// Webhook 事件处理函数
// =====================================================

async function handleSubscriptionActivated(event: any): Promise<void> {
  const resource = event.resource;
  const subscriptionId = resource.id;
  const customIdStr = resource.custom_id;
  const planId = resource.plan_id;
  const startTime = resource.start_time;

  // 解析 custom_id
  let customData: { userId: string; useFirstDiscount?: boolean } | null = null;
  if (customIdStr) {
    try {
      customData = JSON.parse(customIdStr);
    } catch {
      // 旧版格式：custom_id 直接是 userId
      customData = { userId: customIdStr };
    }
  }

  if (!customData?.userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in subscription activated event');
    return;
  }

  const userId = customData.userId;
  const useFirstDiscount = customData.useFirstDiscount || false;

  // 确定订阅计划
  const plan = planId === PAYPAL_PLANS.yearly || planId === PAYPAL_PLANS.yearly_first
    ? 'yearly'
    : 'monthly';

  // 计算周期结束时间
  const startDate = new Date(startTime);
  const endDate = new Date(startDate);
  if (plan === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  if (isSupabaseConfigured()) {
    // 创建或更新订阅记录
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('subscriptions')
        .update({
          paypal_subscription_id: subscriptionId,
          payment_provider: 'paypal',
          plan,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      await supabase.from('subscriptions').insert({
        user_id: userId,
        paypal_subscription_id: subscriptionId,
        payment_provider: 'paypal',
        plan,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
        usage: { synastryReads: 0, monthlyReportClaimed: false },
      });
    }

    // 如果使用了首次折扣，标记已使用
    if (useFirstDiscount) {
      await supabase
        .from('users')
        .update({ used_first_discount: true })
        .eq('id', userId);
    }

    // Award bonus credits via direct INSERT (idempotent by feature_id)
    const bonusFeatureId = `sub_bonus:paypal:${subscriptionId}`;
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

  console.log(`PayPal subscription activated: ${subscriptionId} for user ${userId}, firstDiscount: ${useFirstDiscount}`);
}

async function handleSubscriptionCancelled(event: any): Promise<void> {
  const resource = event.resource;
  const subscriptionId = resource.id;

  if (!subscriptionId) return;

  if (isSupabaseConfigured()) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', subscriptionId);
  }

  console.log(`PayPal subscription cancelled: ${subscriptionId}`);
}

async function handleSubscriptionExpired(event: any): Promise<void> {
  const resource = event.resource;
  const subscriptionId = resource.id;

  if (!subscriptionId) return;

  if (isSupabaseConfigured()) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', subscriptionId);
  }

  console.log(`PayPal subscription expired: ${subscriptionId}`);
}

async function handlePaymentFailed(event: any): Promise<void> {
  const resource = event.resource;
  const subscriptionId = resource.id;

  if (!subscriptionId) return;

  if (isSupabaseConfigured()) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', subscriptionId);
  }

  console.log(`[PAYMENT_FAILED] PayPal subscription payment failed: subscriptionId=${subscriptionId}`);
}

export default router;
