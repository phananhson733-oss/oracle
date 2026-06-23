// INPUT: subscriptionReconcilerDriver(reconcileAllAirwallexSubscriptions)；CRON_SECRET 环境变量。
// OUTPUT: GET /api/cron/reconcile-subscriptions —— Vercel Cron 触发的服务端对账（首次回填存量受害者 + 持续兜底 webhook 漏接）。
//         GET /api/cron/send-weekly-newsletter / send-monthly-newsletter —— Vercel Cron 触发的周报/月报：
//           生成本周期 issue（若无）+ 发送给本周期未发的已确认订阅者（per-cadence 水位独立去重）。
// POS: 定时对账入口，跑在 Vercel 允许的 IP（大陆本地直连 Airwallex 生产 API 会被边缘 403 拦）。
//      若更新此文件，务必更新本头注释与所属 FOLDER.md。
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { reconcileAllAirwallexSubscriptions } from '../services/subscriptionReconcilerDriver.js';
import { runWeeklyNewsletter, runMonthlyNewsletter } from '../services/newsletterWeekly.js';
import { logger } from '../utils/logger.js';

const router = Router();

// 恒定时间比较 Bearer token，避免时序侧信道。Vercel Cron 在设置了 CRON_SECRET 时
// 会自动给定时请求带上 `Authorization: Bearer <CRON_SECRET>`。
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // 未配置一律拒绝，避免裸奔
  const header = String(req.headers['authorization'] || '');
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// GET /api/cron/reconcile-subscriptions
// - 定时调用（无 query）→ dryRun=false，真正回填/同步。
// - 手动 ?dryRun=true → 只读预演，返回受害者名单不写库。
router.get('/reconcile-subscriptions', async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dryRun === 'true';
  try {
    const report = await reconcileAllAirwallexSubscriptions({ dryRun });
    logger.info('[cron reconcile] completed', {
      dryRun,
      scanned: report.scanned,
      reconciled: report.reconciled,
      skipped: report.skipped.length,
    });
    return res.json({ ok: true, ...report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[cron reconcile] failed', { error: msg });
    return res.status(500).json({ ok: false, error: msg });
  }
});

// GET /api/cron/send-weekly-newsletter
// - 定时调用（无 query）→ 生成本周 issue（若未生成）并发送给所有「已确认且本周未发」的订阅者。
// - 手动 ?dryRun=true → 只生成/读取 issue 并返回应发人数，不实际发送。
// - 可选 ?limit=N → 限制单次发送量（默认 500，超出部分靠 last_sent_at 水位下次续发）。
router.get('/send-weekly-newsletter', async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dryRun === 'true';
  const limitRaw = Number(req.query.limit);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : undefined;
  try {
    const report = await runWeeklyNewsletter({ now: new Date(), dryRun, limit });
    logger.info('[cron newsletter] completed', {
      dryRun,
      issueSlug: report.issueSlug,
      generated: report.generated,
      totalSendable: report.totalSendable,
      sent: report.sent,
      failed: report.failed,
      reason: report.reason,
    });
    return res.json({ ok: true, ...report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[cron newsletter] failed', { error: msg });
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

// GET /api/cron/send-monthly-newsletter
// 与周报同构，cadence=monthly：按 YYYY-MM 取/生成 issue，用 last_monthly_sent_at 水位去重。
// 与周报水位互不干扰 —— 同一订阅者既可收周报也可收月报。?dryRun / ?limit 同义。
router.get('/send-monthly-newsletter', async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.dryRun === 'true';
  const limitRaw = Number(req.query.limit);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : undefined;
  try {
    const report = await runMonthlyNewsletter({ now: new Date(), dryRun, limit });
    logger.info('[cron newsletter monthly] completed', {
      dryRun,
      issueSlug: report.issueSlug,
      generated: report.generated,
      totalSendable: report.totalSendable,
      sent: report.sent,
      failed: report.failed,
      reason: report.reason,
    });
    return res.json({ ok: true, ...report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[cron newsletter monthly] failed', { error: msg });
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

export default router;
