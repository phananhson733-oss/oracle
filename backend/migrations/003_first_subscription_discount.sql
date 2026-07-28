-- 首次订阅折扣 & PayPal 订阅支持 数据库迁移
-- 执行方式: 在 Supabase SQL 编辑器中运行此脚本

-- =====================================================
-- 1. 添加首次折扣使用标记
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS used_first_discount BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.used_first_discount IS '是否已使用首次订阅 50% 折扣';

-- =====================================================
-- 2. 添加 PayPal 订阅字段到 subscriptions 表
-- =====================================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) DEFAULT 'stripe';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255);

COMMENT ON COLUMN subscriptions.payment_provider IS '支付提供商: stripe 或 paypal';
COMMENT ON COLUMN subscriptions.paypal_subscription_id IS 'PayPal 订阅 ID';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id
ON subscriptions(paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL;

-- =====================================================
-- 3. 创建 webhook_events 表（用于幂等性）
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE webhook_events IS 'Webhook 事件记录表，用于支付事件幂等性处理';

-- 索引
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
ON webhook_events(event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider
ON webhook_events(provider);

-- RLS 策略
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 4. 为 purchase_records 表添加 PayPal 相关字段
-- =====================================================
ALTER TABLE purchase_records ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255);
ALTER TABLE purchase_records ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) DEFAULT 'stripe';

COMMENT ON COLUMN purchase_records.paypal_order_id IS 'PayPal 订单 ID';
COMMENT ON COLUMN purchase_records.payment_provider IS '支付提供商: stripe 或 paypal';

-- =====================================================
-- 5. 积分系统函数（如果尚不存在）
-- =====================================================

-- 添加用户积分函数
CREATE OR REPLACE FUNCTION add_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  -- 插入或更新 purchase_records 表中的 gm_credit 记录
  INSERT INTO purchase_records (user_id, feature_type, feature_id, scope, price_cents, quantity, consumed)
  VALUES (p_user_id, 'gm_credit', 'added_' || NOW()::text, 'consumable', 0, p_amount, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_user_credits IS '为用户添加积分';
