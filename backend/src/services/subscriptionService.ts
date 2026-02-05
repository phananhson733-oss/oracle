// Subscription Service - handles subscriptions and purchases
import { supabase, DbSubscription, DbPurchase, isSupabaseConfigured } from '../db/supabase.js';
import { stripe, PRODUCTS, STRIPE_PRICES, isStripeConfigured, SUBSCRIBER_DISCOUNT } from '../config/stripe.js';
import { SUBSCRIPTION_BENEFITS } from '../config/auth.js';
import { FIRST_DISCOUNT_RATE } from '../config/paypal.js';

// 重新导出供其他模块使用
export const FIRST_SUBSCRIPTION_DISCOUNT = FIRST_DISCOUNT_RATE;

export interface CreateCheckoutInput {
  userId: string;
  email: string;
  plan: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
  applyFirstDiscount?: boolean;
}

export interface CreatePurchaseCheckoutInput {
  userId: string;
  email: string;
  productType: 'ask' | 'detail_pack' | 'synastry' | 'cbt_analysis' | 'report';
  productId?: string; // For reports
  successUrl: string;
  cancelUrl: string;
  isSubscriber?: boolean;
}

class SubscriptionService {
  // 检查首次折扣资格
  async isEligibleForFirstDiscount(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data: user } = await supabase
      .from('users')
      .select('used_first_discount')
      .eq('id', userId)
      .single();

    // 如果字段不存在或为 false，则有资格
    return !user?.used_first_discount;
  }

  // 标记已使用首次折扣
  async markFirstDiscountUsed(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase
      .from('users')
      .update({ used_first_discount: true })
      .eq('id', userId);
  }

  // Create Stripe checkout session for subscription
  async createSubscriptionCheckout(input: CreateCheckoutInput): Promise<string> {
    if (!isStripeConfigured()) {
      throw new Error('Stripe not configured');
    }

    const basePrice = input.plan === 'monthly'
      ? PRODUCTS.subscription.monthly.amount
      : PRODUCTS.subscription.yearly.amount;

    const productName = input.plan === 'monthly'
      ? PRODUCTS.subscription.monthly.name
      : PRODUCTS.subscription.yearly.name;

    // 计算实际价格（如果使用首次折扣）
    const finalPrice = input.applyFirstDiscount
      ? Math.round(basePrice * (1 - FIRST_SUBSCRIPTION_DISCOUNT))
      : basePrice;

    // 使用 price_data 动态定价（与报告折扣保持一致）
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: input.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: input.applyFirstDiscount
                ? `${productName}（首次特惠 50% OFF）`
                : productName,
            },
            unit_amount: finalPrice,
            recurring: {
              interval: input.plan === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: input.userId,
        plan: input.plan,
        applyFirstDiscount: input.applyFirstDiscount ? 'true' : 'false',
      },
      subscription_data: {
        metadata: {
          userId: input.userId,
          applyFirstDiscount: input.applyFirstDiscount ? 'true' : 'false',
        },
      },
    });

    return session.url || '';
  }

  // Create Stripe checkout session for one-time purchase
  async createPurchaseCheckout(input: CreatePurchaseCheckoutInput): Promise<string> {
    if (!isStripeConfigured()) {
      throw new Error('Stripe not configured');
    }

    let priceId: string;
    let amount: number;

    switch (input.productType) {
      case 'ask':
        priceId = STRIPE_PRICES.ASK_SINGLE;
        amount = PRODUCTS.oneTime.ask.amount;
        break;
      case 'detail_pack':
        priceId = STRIPE_PRICES.DETAIL_PACK_10;
        amount = PRODUCTS.oneTime.detail_pack.amount;
        break;
      case 'synastry':
        priceId = STRIPE_PRICES.SYNASTRY_FULL;
        amount = PRODUCTS.oneTime.synastry.amount;
        break;
      case 'cbt_analysis':
        priceId = STRIPE_PRICES.CBT_ANALYSIS;
        amount = PRODUCTS.oneTime.cbt_analysis.amount;
        break;
      case 'report':
        const reportConfig = PRODUCTS.reports[input.productId as keyof typeof PRODUCTS.reports];
        if (!reportConfig) {
          throw new Error('Invalid report type');
        }
        priceId = reportConfig.priceId;
        amount = reportConfig.amount;
        break;
      default:
        throw new Error('Invalid product type');
    }

    // Apply subscriber discount for reports
    if (input.isSubscriber && input.productType === 'report') {
      amount = Math.round(amount * (1 - SUBSCRIBER_DISCOUNT));
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: this.getProductName(input.productType, input.productId),
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: input.userId,
        productType: input.productType,
        productId: input.productId || '',
      },
    });

    return session.url || '';
  }

  private getProductName(productType: string, productId?: string): string {
    if (productType === 'report' && productId) {
      const report = PRODUCTS.reports[productId as keyof typeof PRODUCTS.reports];
      return report?.name || 'Report';
    }
    const product = PRODUCTS.oneTime[productType as keyof typeof PRODUCTS.oneTime];
    return product?.name || productType;
  }

  // Create Stripe Customer Portal session
  async createPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
    if (!isStripeConfigured()) {
      throw new Error('Stripe not configured');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  // Get user's subscription
  async getSubscription(userId: string): Promise<DbSubscription | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as DbSubscription;
  }

  // Create or update subscription from Stripe webhook
  async upsertSubscription(
    userId: string,
    stripeSubscription: {
      id: string;
      customer: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      cancel_at_period_end: boolean;
      items: { data: Array<{ price: { id: string } }> };
    }
  ): Promise<DbSubscription> {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured');
    }

    const priceId = stripeSubscription.items.data[0]?.price.id;
    const plan = priceId === STRIPE_PRICES.YEARLY_SUBSCRIPTION ? 'yearly' : 'monthly';

    // Map Stripe status to our status
    let status: DbSubscription['status'];
    switch (stripeSubscription.status) {
      case 'active':
        status = 'active';
        break;
      case 'trialing':
        status = 'trialing';
        break;
      case 'past_due':
        status = 'past_due';
        break;
      case 'canceled':
      case 'unpaid':
        status = 'canceled';
        break;
      default:
        status = 'expired';
    }

    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeSubscription.customer as string,
      stripe_price_id: priceId,
      plan,
      status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    };

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', stripeSubscription.id)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('stripe_subscription_id', stripeSubscription.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update subscription: ${error.message}`);
      return data as DbSubscription;
    } else {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw new Error(`Failed to create subscription: ${error.message}`);
      return data as DbSubscription;
    }
  }

  // Cancel subscription
  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    if (!isStripeConfigured()) {
      throw new Error('Stripe not configured');
    }

    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Resume canceled subscription
  async resumeSubscription(stripeSubscriptionId: string): Promise<void> {
    if (!isStripeConfigured()) {
      throw new Error('Stripe not configured');
    }

    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  }

  // Record a purchase
  async recordPurchase(
    userId: string,
    productType: DbPurchase['product_type'],
    productId: string | null,
    amount: number,
    stripePaymentIntentId?: string,
    stripeCheckoutSessionId?: string
  ): Promise<DbPurchase> {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured');
    }

    let quantity = 1;
    if (productType === 'detail_pack') {
      quantity = PRODUCTS.oneTime.detail_pack.quantity;
    }

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_type: productType,
        product_id: productId,
        amount,
        stripe_payment_intent_id: stripePaymentIntentId,
        stripe_checkout_session_id: stripeCheckoutSessionId,
        status: 'completed',
        quantity,
        consumed: 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to record purchase: ${error.message}`);
    return data as DbPurchase;
  }

  // Get user's purchases
  async getPurchases(userId: string): Promise<DbPurchase[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as DbPurchase[];
  }

  // Get available purchase credits
  async getAvailableCredits(
    userId: string,
    productType: 'ask' | 'detail_pack' | 'synastry' | 'cbt_analysis'
  ): Promise<number> {
    if (!isSupabaseConfigured()) return 0;

    const { data } = await supabase
      .from('purchases')
      .select('quantity, consumed')
      .eq('user_id', userId)
      .eq('product_type', productType)
      .eq('status', 'completed');

    if (!data) return 0;

    return data.reduce((total, p) => total + (p.quantity - p.consumed), 0);
  }

  // Consume a purchase credit
  async consumeCredit(userId: string, productType: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    // Find a purchase with available credits
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', productType)
      .eq('status', 'completed')
      .gt('quantity', supabase.rpc('consumed'))
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!purchase) return false;

    // Increment consumed count
    const { error } = await supabase
      .from('purchases')
      .update({ consumed: purchase.consumed + 1 })
      .eq('id', purchase.id);

    return !error;
  }

  // Check if user has purchased a report
  async hasReport(userId: string, reportType: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('product_type', 'report')
      .eq('product_id', reportType)
      .eq('status', 'completed')
      .limit(1)
      .single();

    return !!data;
  }

  // Use synastry read from subscription
  async useSynastryRead(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const subscription = await this.getSubscription(userId);
    if (!subscription || subscription.status !== 'active') return false;

    const usage = subscription.usage;
    if (usage.synastryReads >= SUBSCRIPTION_BENEFITS.SYNASTRY_READS_PER_MONTH) {
      return false;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        usage: {
          ...usage,
          synastryReads: usage.synastryReads + 1,
        },
      })
      .eq('id', subscription.id);

    return !error;
  }

  // Claim monthly report
  async claimMonthlyReport(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const subscription = await this.getSubscription(userId);
    if (!subscription || subscription.status !== 'active') return false;

    if (subscription.usage.monthlyReportClaimed) {
      return false;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        usage: {
          ...subscription.usage,
          monthlyReportClaimed: true,
        },
      })
      .eq('id', subscription.id);

    return !error;
  }

  // Reset monthly usage (called by cron job or webhook)
  async resetMonthlyUsage(subscriptionId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase
      .from('subscriptions')
      .update({
        usage: {
          synastryReads: 0,
          monthlyReportClaimed: false,
        },
      })
      .eq('id', subscriptionId);
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
