// INPUT: subscriptionReconcilerDriver(reconcileAllAirwallexSubscriptions)；CRON_SECRET 环境变量。
// OUTPUT: GET /api/cron/reconcile-subscriptions —— Vercel Cron 触发的服务端对账（首次回填存量受害者 + 持续兜底 webhook 漏接）。
// POS: 定时对账入口，跑在 Vercel 允许的 IP（大陆本地直连 Airwallex 生产 API 会被边缘 403 拦）。
//      若更新此文件，务必更新本头注释与所属 FOLDER.md。
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { reconcileAllAirwallexSubscriptions } from '../services/subscriptionReconcilerDriver.js';

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
    console.log(
      `[cron reconcile] dryRun=${dryRun} scanned=${report.scanned} reconciled=${report.reconciled} skipped=${report.skipped.length}`,
    );
    return res.json({ ok: true, ...report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron reconcile] failed:', msg);
    return res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
