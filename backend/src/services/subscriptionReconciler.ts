// INPUT: db/supabase 客户端（users / subscriptions 表）。
// OUTPUT: reconcileAirwallexSubscription —— 把一条 Airwallex 订阅(可缺 metadata.userId)反查用户并 upsert 本地 subscriptions 行。
// POS: P0 对账核心。不依赖 webhook/前端 confirm-checkout，按 metadataUserId→customer_id→customer email 三级反查落库。
//      若更新此文件，务必更新本头注释与所属 FOLDER.md。
import { supabase, isSupabaseConfigured } from '../db/supabase.js';

export type LocalSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'expired';

export interface ReconcileInput {
  subscriptionId: string;
  customerId?: string;
  customerEmail?: string;
  /** 续费发票/自动扣款事件通常没有 userId；缺失时走 customer/email 反查。 */
  metadataUserId?: string;
  plan: 'monthly' | 'yearly';
  /** Airwallex 原始状态（ACTIVE / PAST_DUE / CANCELLED / ...）。 */
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  /** 只预演不写库（回填脚本默认 dry-run）。 */
  dryRun?: boolean;
}

export interface ReconcileResult {
  reconciled: boolean;
  userId?: string;
  action?: 'insert' | 'update';
  reason?: string;
}

/** Airwallex 状态 → 本地枚举。未知状态保守降级为 past_due，绝不误授予订阅权益。 */
export function mapAirwallexStatus(raw: string): LocalSubscriptionStatus {
  switch ((raw || '').toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'IN_TRIAL':
    case 'TRIALING':
    case 'TRIAL':
      return 'trialing';
    case 'PAST_DUE':
    case 'UNPAID':
      return 'past_due';
    case 'CANCELLED':
    case 'CANCELED':
      return 'canceled';
    case 'EXPIRED':
      return 'expired';
    default:
      return 'past_due';
  }
}

/** 三级反查 userId：metadata.userId → 现有订阅行的 customer 映射 → users.email。 */
async function resolveUserId(input: ReconcileInput): Promise<string | null> {
  if (input.metadataUserId) return input.metadataUserId;

  if (input.customerId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('airwallex_customer_id', input.customerId)
      .limit(1)
      .maybeSingle();
    const uid = (data as { user_id?: string } | null)?.user_id;
    if (uid) return uid;
  }

  if (input.customerEmail) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', input.customerEmail)
      .maybeSingle();
    const id = (data as { id?: string } | null)?.id;
    if (id) return id;
  }

  return null;
}

/** 计算 current_period_end：优先用 Airwallex 给的；缺失时按 plan 从 start(或现在)推算。 */
function resolvePeriodEnd(input: ReconcileInput, status: LocalSubscriptionStatus): string {
  if (status === 'trialing' && input.trialEnd) return input.trialEnd;
  if (input.currentPeriodEnd) return input.currentPeriodEnd;
  const start = new Date(input.currentPeriodStart || new Date().toISOString());
  const end = new Date(start);
  if (input.plan === 'yearly') end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end.toISOString();
}

/**
 * 把一条 Airwallex 订阅对账进本地 subscriptions 表。
 * 不依赖 webhook 或前端 confirm-checkout，可由对账任务/回填脚本/加固后的 webhook 共同调用。
 */
export async function reconcileAirwallexSubscription(
  input: ReconcileInput,
): Promise<ReconcileResult> {
  if (!isSupabaseConfigured()) {
    return { reconciled: false, reason: 'supabase_unconfigured' };
  }
  if (!input.subscriptionId) {
    return { reconciled: false, reason: 'missing_subscription_id' };
  }

  const userId = await resolveUserId(input);
  if (!userId) {
    return { reconciled: false, reason: 'no_user_mapping' };
  }

  const status = mapAirwallexStatus(input.status);
  const periodEnd = resolvePeriodEnd(input, status);
  const startIso = input.currentPeriodStart || new Date().toISOString();

  const subData = {
    user_id: userId,
    airwallex_subscription_id: input.subscriptionId,
    airwallex_customer_id: input.customerId || null,
    payment_provider: 'airwallex' as const,
    plan: input.plan,
    status,
    current_period_start: startIso,
    current_period_end: periodEnd,
    cancel_at_period_end: status === 'canceled',
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const action: 'insert' | 'update' = existing ? 'update' : 'insert';

  // dry-run：只解析+判定，不写库（回填脚本预演用）。
  if (input.dryRun) {
    return { reconciled: true, userId, action, reason: 'dry_run' };
  }

  if (existing) {
    await supabase.from('subscriptions').update(subData).eq('user_id', userId);
    return { reconciled: true, userId, action: 'update' };
  }

  await supabase.from('subscriptions').insert({
    ...subData,
    usage: { synastryReads: 0, monthlyReportClaimed: false },
  });
  return { reconciled: true, userId, action: 'insert' };
}
