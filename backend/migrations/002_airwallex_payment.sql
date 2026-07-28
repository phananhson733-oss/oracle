-- Airwallex 支付集成数据库迁移
-- 执行方式: 在 Supabase SQL 编辑器中运行此脚本

-- =====================================================
-- 1. subscriptions 表新增 Airwallex 字段
-- =====================================================
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS airwallex_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS airwallex_customer_id TEXT;

-- 索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_airwallex_sub_id
  ON subscriptions(airwallex_subscription_id) WHERE airwallex_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_airwallex_cust_id
  ON subscriptions(airwallex_customer_id) WHERE airwallex_customer_id IS NOT NULL;

-- =====================================================
-- 2. 注释
-- =====================================================
COMMENT ON COLUMN subscriptions.airwallex_subscription_id IS 'Airwallex subscription ID (when payment_provider = airwallex)';
COMMENT ON COLUMN subscriptions.airwallex_customer_id IS 'Airwallex customer ID (when payment_provider = airwallex)';
