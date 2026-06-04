// INPUT: subscriptionReconcilerDriver(reconcileAllAirwallexSubscriptions)；生产 Airwallex 凭证(env) + 生产 Supabase。
// OUTPUT: 扫描 Airwallex 全部订阅并对账进 DB，打印报告；默认 dry-run，加 --apply 才真正写库。
// POS: P0 存量受害者回填 CLI。属 backend/scripts。更新请同步本头注释。
//
// 用法：
//   预演(只读，强烈建议先跑)：  cd backend && npx tsx scripts/backfill-subscriptions.ts
//   真正写库：                  cd backend && npx tsx scripts/backfill-subscriptions.ts --apply
// 前置：backend/.env 的 AIRWALLEX_* 必须是【生产】凭证 + AIRWALLEX_ENVIRONMENT=production；Supabase 已是生产。
import { reconcileAllAirwallexSubscriptions } from '../src/services/subscriptionReconcilerDriver.js';
import { AIRWALLEX_ENV } from '../src/config/airwallex.js';

async function main() {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply;

  console.log('─'.repeat(72));
  console.log(
    `Airwallex 订阅回填对账  (ENV=${AIRWALLEX_ENV}, mode=${dryRun ? 'DRY-RUN(只读)' : 'APPLY(写库)'})`,
  );
  if (AIRWALLEX_ENV !== 'production') {
    console.log(
      '⚠️  当前不是 production 环境，扫到的是沙箱订阅。回填真实受害者请先把 AIRWALLEX_ENVIRONMENT=production。',
    );
  }
  console.log('─'.repeat(72));

  const report = await reconcileAllAirwallexSubscriptions({ dryRun });

  console.log(`扫描订阅总数 : ${report.scanned}`);
  console.log(
    `${dryRun ? '将会对账(预演)' : '已对账落库'} : ${report.reconciled}`,
  );
  console.log(`跳过/失败     : ${report.skipped.length}`);
  if (report.skipped.length) {
    console.log('─ 跳过明细（subscriptionId | 原因）─');
    for (const s of report.skipped) {
      console.log(`  ${s.subscriptionId}  |  ${s.reason}`);
    }
    console.log(
      '  提示：reason=no_user_mapping 表示该订阅的 customer email 在 users 表查无此人，',
    );
    console.log('        需人工核对（可能用别的邮箱注册，或纯访客付费）。');
  }
  console.log('─'.repeat(72));
  if (dryRun) {
    console.log('这是预演，未写任何库。确认无误后加 --apply 真正回填。');
  } else {
    console.log(
      '回填完成。建议再跑一次 diagnose-billing.ts 抽查若干用户确认订阅行已恢复。',
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('backfill failed:', e);
  process.exit(1);
});
