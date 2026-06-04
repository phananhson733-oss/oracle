// INPUT: airwallexService(listSubscriptions/getSubscriptionDetails/getBillingCustomer) + subscriptionReconciler 核心。
// OUTPUT: reconcileFromSubscriptionObject(对账单个订阅对象)、reconcileAirwallexSubscriptionById(按 id 拉详情后对账)、
//         reconcileAllAirwallexSubscriptions(全量扫描对账，返回聚合报告)。
// POS: P0 对账驱动器，不依赖 webhook。供回填脚本/定时任务/webhook(invoice.*) 调用。
//      若更新此文件，务必更新本头注释与所属 FOLDER.md。
import { airwallexService } from './airwallexService.js';
import type { AirwallexSubscriptionListItem } from './airwallexService.js';
import {
  reconcileAirwallexSubscription,
  type ReconcileResult,
} from './subscriptionReconciler.js';

export interface ReconcileReport {
  scanned: number;
  reconciled: number;
  skipped: Array<{ subscriptionId: string; reason: string }>;
  dryRun: boolean;
}

const MAX_PAGES = 200; // 安全上限，防止分页死循环

function planFromPeriodUnit(unit?: string): 'monthly' | 'yearly' {
  return (unit || '').toUpperCase() === 'YEAR' ? 'yearly' : 'monthly';
}

/** 对账单个 Airwallex 订阅对象（列表项或详情）：按 billing_customer_id 取 email → 调对账核心。 */
export async function reconcileFromSubscriptionObject(
  item: AirwallexSubscriptionListItem,
  dryRun = false,
): Promise<ReconcileResult> {
  let email: string | undefined;
  if (item.billing_customer_id) {
    const customer = await airwallexService.getBillingCustomer(
      item.billing_customer_id,
    );
    email = customer.email;
  }
  return reconcileAirwallexSubscription({
    subscriptionId: item.id,
    customerId: item.billing_customer_id,
    customerEmail: email,
    plan: planFromPeriodUnit(item.recurring?.period_unit),
    status: item.status,
    currentPeriodStart: item.current_period_starts_at,
    currentPeriodEnd: item.current_period_ends_at,
    dryRun,
  });
}

/**
 * 按订阅 id 对账：拉完整订阅详情 → 对账。
 * 供 webhook 的 invoice 与 subscription 事件调用（事件只给 subscription_id，详情用 API 拉，不靠事件 payload 形状）。
 */
export async function reconcileAirwallexSubscriptionById(
  subscriptionId: string,
  opts: { dryRun?: boolean } = {},
): Promise<ReconcileResult> {
  const sub = await airwallexService.getSubscriptionDetails(subscriptionId);
  return reconcileFromSubscriptionObject(sub, opts.dryRun ?? false);
}

/**
 * 扫描 Airwallex 所有订阅并对账进本地 DB。
 * 单条失败(取 customer/对账异常)被隔离记入 skipped，不中断整体。
 */
export async function reconcileAllAirwallexSubscriptions(
  opts: { dryRun?: boolean } = {},
): Promise<ReconcileReport> {
  const dryRun = opts.dryRun ?? false;
  let scanned = 0;
  let reconciled = 0;
  const skipped: Array<{ subscriptionId: string; reason: string }> = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const { items, hasMore } = await airwallexService.listSubscriptions(
      page,
      100,
    );

    for (const item of items) {
      scanned++;
      try {
        const result = await reconcileFromSubscriptionObject(item, dryRun);
        if (result.reconciled) reconciled++;
        else
          skipped.push({
            subscriptionId: item.id,
            reason: result.reason || 'unknown',
          });
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        skipped.push({ subscriptionId: item.id, reason });
      }
    }

    if (!hasMore) break;
  }

  return { scanned, reconciled, skipped, dryRun };
}
