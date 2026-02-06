// PayPal Service - 处理 PayPal REST API 调用
import {
  PAYPAL_API_BASE,
  PAYPAL_CREDENTIALS,
  PAYPAL_PLANS,
  CREDITS_PACKAGES,
  isPayPalConfigured,
} from '../config/paypal.js';
import { supabase, isSupabaseConfigured } from '../db/supabase.js';

// 类型定义
interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  links?: PayPalLink[];
  plan_id?: string;
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: {
      amount: { value: string; currency_code: string };
      time: string;
    };
  };
  custom_id?: string;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { value: string; currency_code: string };
      }>;
    };
  }>;
}

interface CreateSubscriptionInput {
  userId: string;
  plan: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
  useFirstDiscount?: boolean;
}

interface CreateOrderInput {
  userId: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}

interface WebhookVerifyInput {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  webhookEvent: unknown;
}

// Access Token 缓存
let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

class PayPalService {
  // 获取 OAuth Access Token
  async getAccessToken(): Promise<string> {
    if (!isPayPalConfigured()) {
      throw new Error('PayPal not configured');
    }

    // 使用缓存的 token（如果未过期）
    if (cachedAccessToken && Date.now() < tokenExpiry - 60000) {
      return cachedAccessToken;
    }

    const auth = Buffer.from(
      `${PAYPAL_CREDENTIALS.clientId}:${PAYPAL_CREDENTIALS.clientSecret}`
    ).toString('base64');

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal OAuth error:', error);
      throw new Error(`PayPal OAuth failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    cachedAccessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;

    return cachedAccessToken!;
  }

  // 创建订阅
  async createSubscription(input: CreateSubscriptionInput): Promise<{ subscriptionId: string; approveUrl: string; usedFirstDiscount: boolean }> {
    if (!isPayPalConfigured()) {
      throw new Error('PayPal not configured');
    }

    // 根据是否使用首次折扣选择计划 ID
    let planId: string;
    let usedFirstDiscount = false;

    if (input.useFirstDiscount) {
      // 优先使用首次折扣计划
      const firstPlanId = input.plan === 'yearly' ? PAYPAL_PLANS.yearly_first : PAYPAL_PLANS.monthly_first;
      if (firstPlanId) {
        planId = firstPlanId;
        usedFirstDiscount = true;
      } else {
        // 如果首次折扣计划未配置，回退到标准计划
        console.warn(`PayPal first discount plan not configured for ${input.plan}, falling back to standard plan`);
        planId = input.plan === 'yearly' ? PAYPAL_PLANS.yearly : PAYPAL_PLANS.monthly;
      }
    } else {
      planId = input.plan === 'yearly' ? PAYPAL_PLANS.yearly : PAYPAL_PLANS.monthly;
    }

    if (!planId) {
      throw new Error(`PayPal plan not configured for ${input.plan}`);
    }

    const accessToken = await this.getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: 'AstroMind',
          locale: 'zh-CN',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: input.successUrl,
          cancel_url: input.cancelUrl,
        },
        // 自定义数据：userId + useFirstDiscount（实际是否使用了折扣）
        custom_id: JSON.stringify({
          userId: input.userId,
          useFirstDiscount: usedFirstDiscount,
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal create subscription error:', error);
      throw new Error(`Failed to create subscription: ${error.message || response.statusText}`);
    }

    const subscription: PayPalSubscriptionResponse = await response.json();

    // 找到 approve 链接
    const approveLink = subscription.links?.find((link) => link.rel === 'approve');
    if (!approveLink) {
      throw new Error('No approve link in PayPal response');
    }

    return {
      subscriptionId: subscription.id,
      approveUrl: approveLink.href,
      usedFirstDiscount,
    };
  }

  // 获取订阅详情
  async getSubscriptionDetails(subscriptionId: string): Promise<PayPalSubscriptionResponse> {
    if (!isPayPalConfigured()) {
      throw new Error('PayPal not configured');
    }

    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal get subscription error:', error);
      throw new Error(`Failed to get subscription: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  // 取消订阅
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    if (!isPayPalConfigured()) {
      throw new Error('PayPal not configured');
    }

    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || 'Customer requested cancellation',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal cancel subscription error:', error);
      throw new Error(`Failed to cancel subscription: ${error.message || response.statusText}`);
    }
  }

  // 创建积分购买订单
  async createOrder(input: CreateOrderInput): Promise<{ orderId: string; approvalUrl: string }> {
    if (!isPayPalConfigured()) {
      throw new Error('PayPal not configured');
    }

    const packageInfo = CREDITS_PACKAGES[input.packageId];
    if (!packageInfo) {
      throw new Error(`Invalid package ID: ${input.packageId}`);
    }

    const accessToken = await this.getAccessToken();
    const amountValue = (packageInfo.amount / 100).toFixed(2);

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: input.userId,
          description: packageInfo.description,
          custom_id: JSON.stringify({ userId: input.userId, packageId: input.packageId }),
          amount: {
            currency_code: 'USD',
            value: amountValue,
          },
        }],
        application_context: {
          brand_name: 'AstroMind',
          locale: 'zh-CN',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: input.successUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal create order error:', error);
      throw new Error(`Failed to create order: ${error.message || response.statusText}`);
    }

    const order: PayPalOrderResponse = await response.json();

    // 提取 approve 链接
    const approveLink = order.links?.find((link) => link.rel === 'approve');
    if (!approveLink) {
      throw new Error('No approve link in PayPal order response');
    }

    return {
      orderId: order.id,
      approvalUrl: approveLink.href,
    };
  }

  // 捕获订单（确认支付）
  async captureOrder(orderId: string): Promise<{
    success: boolean;
    captureId?: string;
    amount?: number;
    customData?: { userId: string; packageId: string };
  }> {
    if (!isPayPalConfigured()) {
      throw new Error('PayPal not configured');
    }

    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal capture order error:', error);
      throw new Error(`Failed to capture order: ${error.message || response.statusText}`);
    }

    const order: PayPalOrderResponse = await response.json();
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];

    if (!capture || capture.status !== 'COMPLETED') {
      return { success: false };
    }

    // 解析自定义数据
    let customData: { userId: string; packageId: string } | undefined;
    const customIdStr = order.purchase_units?.[0]?.custom_id;
    if (customIdStr) {
      try {
        customData = JSON.parse(customIdStr);
      } catch {
        console.warn('Failed to parse custom_id:', customIdStr);
      }
    }

    return {
      success: true,
      captureId: capture.id,
      amount: parseFloat(capture.amount.value) * 100, // 转为美分
      customData,
    };
  }

  // 验证 Webhook 签名
  async verifyWebhookSignature(input: WebhookVerifyInput): Promise<boolean> {
    if (!isPayPalConfigured()) {
      throw new Error('PayPal not configured');
    }

    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: input.authAlgo,
          cert_url: input.certUrl,
          transmission_id: input.transmissionId,
          transmission_sig: input.transmissionSig,
          transmission_time: input.transmissionTime,
          webhook_id: input.webhookId,
          webhook_event: input.webhookEvent,
        }),
      }
    );

    if (!response.ok) {
      console.error('PayPal verify webhook error:', await response.text());
      return false;
    }

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  }

  // 检查 Webhook 事件是否已处理（幂等性）
  async isEventProcessed(eventId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    return !!data;
  }

  // 记录 Webhook 事件
  async recordWebhookEvent(eventId: string, eventType: string, payload: unknown): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase.from('webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      provider: 'paypal',
      payload,
    });
  }
}

export const paypalService = new PayPalService();
export default paypalService;
