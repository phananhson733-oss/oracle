// GM Commands API - 测试/开发用命令
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authMiddleware, requireAuth } from './auth.js';
import { supabase, isSupabaseConfigured, DbUser } from '../db/supabase.js';
import { userService } from '../services/userService.js';
import { addDevGmCredits, clearDevGmCredits, resetDevEntitlements, setDevSubscription } from '../services/entitlementService.js';
import Redis from 'ioredis';
import { logger } from "../utils/logger.js";

const router = Router();
const AI_CACHE_PATTERN_MAX_LENGTH = 120;

// GM 命令仅在开发环境启用，或者可以添加管理员权限检查
const isGMEnabled = () => {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_GM_COMMANDS === 'true';
};

const getGMSecret = () => process.env.GM_COMMAND_SECRET?.trim() || "";

function timingSafeEquals(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
}

function hasValidGMSecret(req: Request): boolean {
  const secret = getGMSecret();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  const headerSecret = req.headers['x-gm-command-secret'];
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const provided = Array.isArray(headerSecret)
    ? headerSecret[0]
    : headerSecret || bearer;

  return typeof provided === 'string' && timingSafeEquals(provided, secret);
}

function requireGMAccess(req: Request, res: Response): boolean {
  if (!isGMEnabled()) {
    res.status(403).json({ error: 'GM commands are disabled' });
    return false;
  }

  if (!hasValidGMSecret(req)) {
    res.status(403).json({ error: 'GM command secret required' });
    return false;
  }

  return true;
}

// =====================================================
// GM: 解锁订阅
// =====================================================

// POST /api/gm/unlock-subscription
router.post('/unlock-subscription', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  if (!requireGMAccess(req, res)) return;

  try {
    const userId = req.userId!;

    if (!isSupabaseConfigured()) {
      setDevSubscription(userId, true);
      return res.json({ success: true, message: 'Subscription unlocked' });
    }

    // 设置订阅状态
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: `gm_sub_${Date.now()}`,
        stripe_customer_id: `gm_cus_${Date.now()}`,
        plan: 'monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 年后
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      logger.error('GM unlock subscription error', { error });
      return res.status(500).json({ error: 'Failed to unlock subscription' });
    }

    // 清除试用期（因为现在是正式订阅）
    await supabase
      .from('users')
      .update({ trial_ends_at: null })
      .eq('id', userId);

    res.json({ success: true, message: 'Subscription unlocked' });
  } catch (error) {
    logger.error('GM unlock subscription error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// GM: 取消订阅
// =====================================================

// POST /api/gm/cancel-subscription
router.post('/cancel-subscription', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  if (!requireGMAccess(req, res)) return;

  try {
    const userId = req.userId!;

    if (!isSupabaseConfigured()) {
      setDevSubscription(userId, false);
      return res.json({ success: true, message: 'Subscription cancelled' });
    }

    // 删除订阅记录
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      logger.error('GM cancel subscription error', { error });
      return res.status(500).json({ error: 'Failed to cancel subscription' });
    }

    // 同时清除试用期
    await supabase
      .from('users')
      .update({ trial_ends_at: null })
      .eq('id', userId);

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    logger.error('GM cancel subscription error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// GM: 添加代币（Ask 问答次数）
// =====================================================

// POST /api/gm/add-tokens
router.post('/add-tokens', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  if (!requireGMAccess(req, res)) return;

  try {
    const userId = req.userId!;
    const { amount = 9999 } = req.body;

    if (!isSupabaseConfigured()) {
      addDevGmCredits(userId, amount);
      return res.json({ success: true, message: `Added ${amount} credits` });
    }

    const { error } = await supabase
      .from('purchase_records')
      .insert({
        user_id: userId,
        feature_type: 'gm_credit',
        feature_id: null,
        scope: 'consumable',
        price_cents: 0,
        valid_until: null,
        quantity: amount,
        consumed: 0,
        stripe_payment_intent_id: `gm_pi_${Date.now()}`,
        stripe_checkout_session_id: `gm_sess_${Date.now()}`,
      });

    if (error) {
      logger.error('GM add tokens error', { error });
      return res.status(500).json({ error: 'Failed to add tokens' });
    }

    res.json({ success: true, message: `Added ${amount} credits` });
  } catch (error) {
    logger.error('GM add tokens error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// GM: 清零代币
// =====================================================

// POST /api/gm/clear-tokens
router.post('/clear-tokens', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  if (!requireGMAccess(req, res)) return;

  try {
    const userId = req.userId!;

    if (!isSupabaseConfigured()) {
      clearDevGmCredits(userId);
      return res.json({ success: true, message: 'Credits cleared' });
    }

    const { error: deleteError } = await supabase
      .from('purchase_records')
      .delete()
      .eq('user_id', userId)
      .eq('feature_type', 'gm_credit');

    if (deleteError) {
      logger.error('GM clear tokens error', { deleteError });
      return res.status(500).json({ error: 'Failed to clear tokens' });
    }

    // 重置免费使用记录
    const { error: usageError } = await supabase
      .from('free_usage')
      .upsert({
        user_id: userId,
        ask_used: 9999, // 设置为已用完
        synastry_used: 0,
      }, {
        onConflict: 'user_id',
      });

    if (usageError) {
      logger.error('GM clear tokens usage error', { usageError });
    }

    // 重置订阅使用记录
    const weekStart = getWeekStart();
    await supabase
      .from('subscription_usage')
      .upsert({
        user_id: userId,
        week_start: weekStart,
        ask_used: 9999, // 设置为已用完
        synastry_used: 0,
      }, {
        onConflict: 'user_id,week_start',
      });

    res.json({ success: true, message: 'Credits cleared' });
  } catch (error) {
    logger.error('GM clear tokens error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// GM: 重置所有权益（完全重置）
// =====================================================

// POST /api/gm/reset-all
router.post('/reset-all', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  if (!requireGMAccess(req, res)) return;

  try {
    const userId = req.userId!;

    if (!isSupabaseConfigured()) {
      resetDevEntitlements(userId);
      return res.json({ success: true, message: 'All entitlements reset' });
    }

    // 删除订阅
    await supabase.from('subscriptions').delete().eq('user_id', userId);

    // 删除所有购买记录
    await supabase.from('purchase_records').delete().eq('user_id', userId);

    // 删除合盘记录
    await supabase.from('synastry_records').delete().eq('user_id', userId);

    // 重置免费使用
    await supabase.from('free_usage').delete().eq('user_id', userId);

    // 重置订阅使用
    await supabase.from('subscription_usage').delete().eq('user_id', userId);

    // 清除试用期
    await supabase.from('users').update({ trial_ends_at: null }).eq('id', userId);

    res.json({ success: true, message: 'All entitlements reset' });
  } catch (error) {
    logger.error('GM reset all error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/dev-session', async (req: Request, res: Response) => {
  if (!requireGMAccess(req, res)) return;

  try {
    const email = 'gm-dev@local';
    let user: DbUser;

    if (isSupabaseConfigured()) {
      const existingUser = await userService.findByEmail(email);

      if (existingUser) {
        user = existingUser;
      } else {
        user = await userService.createUser({
          email,
          name: 'GM Dev',
          provider: 'email',
          password: `gm-dev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        });
        await userService.verifyEmail(user.id);
      }
    } else {
      const now = new Date().toISOString();
      user = {
        id: 'gm-dev-local',
        email,
        name: 'GM Dev',
        avatar: null,
        provider: 'email',
        provider_id: null,
        password_hash: null,
        birth_profile: null,
        preferences: { theme: 'dark', language: 'zh' },
        email_verified: true,
        trial_ends_at: null,
        used_first_discount: false,
        created_at: now,
        updated_at: now,
      };
    }

    const tokens = userService.generateTokens(user);

    res.json({
      success: true,
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      },
    });
  } catch (error) {
    logger.error('GM dev session error', { error });
    res.status(500).json({ error: 'Failed to create GM session' });
  }
});

// =====================================================
// GM: 检查 GM 命令是否启用
// =====================================================

// GET /api/gm/status
router.get('/status', (req: Request, res: Response) => {
  if (!isGMEnabled()) {
    return res.json({ enabled: false });
  }

  if (!hasValidGMSecret(req)) {
    return res.status(403).json({ error: 'GM status unavailable' });
  }

  res.json({
    enabled: true,
    environment: process.env.NODE_ENV || 'development',
    secretConfigured: Boolean(getGMSecret()),
  });
});

// =====================================================
// GM: 清除 AI 缓存
// =====================================================

// POST /api/gm/clear-ai-cache
router.post('/clear-ai-cache', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  if (!requireGMAccess(req, res)) return;

  try {
    const { pattern } = req.body; // 可选：指定清除的模式，如 'ai:natal-overview:*'
    const searchPattern =
      typeof pattern === 'string' && pattern.trim() ? pattern.trim() : 'ai:*';
    if (
      searchPattern.length > AI_CACHE_PATTERN_MAX_LENGTH ||
      !searchPattern.startsWith('ai:')
    ) {
      return res.status(400).json({
        error: 'Invalid AI cache pattern',
        code: 'INVALID_AI_CACHE_PATTERN',
      });
    }
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      return res.status(500).json({ error: 'Redis not configured' });
    }

    const redis = new Redis(redisUrl);

    const keys = await redis.keys(searchPattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await redis.quit();

    res.json({
      success: true,
      message: `Cleared ${keys.length} cache entries`,
      pattern: searchPattern,
    });
  } catch (error) {
    logger.error('GM clear AI cache error', { error });
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// 辅助函数：获取本周开始日期
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 周一为一周开始
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split('T')[0];
}

export default router;
