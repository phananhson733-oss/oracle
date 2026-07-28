// INPUT: 净新付费面 feature key + 用户是否持有 entitlement。
// OUTPUT: TIMELINE_PAYWALL_ENABLED gate（默认 OFF）+ TIMELINE_PREMIUM_FEATURES 注册表 + isTimelineFeatureUnlocked。
// POS: 付费 entitlement scaffold（**gated OFF**）。plan §5冲突4：建墙前先 fake-door 验 WTP、$6.99 别过度建 entitlement、排最后。
//      故 flag OFF 时一切免费、不强建 entitlement；只注册"哪些净新面可 gate"，**不接** entitlementServiceV2/pricing（验 WTP 后再做）。
//      安全 affordance（disclaimer/危机响应）+ 图表+近期视图 永不付费墙——不在本注册表内。

// 先 fake-door 验 WTP 再翻（与 B1 的 DOMAINS_ENABLED 同模式：代码已落、墙未开）。
export const TIMELINE_PAYWALL_ENABLED = false;

// 仅"净新面"可 gate（plan §4 付费：只对净新面挂 FeatureType，免费/安全面永不墙）。
export type TimelinePremiumFeature =
  | "full_year_narrative" // 完整年度叙事
  | "arbitrary_history" // 任意历史年/月度
  | "domain_kline" // 分类（域）K 线
  | "pdf_export" // PDF 导出
  | "deep_ask"; // deep Ask-on-report

export const TIMELINE_PREMIUM_FEATURES: readonly TimelinePremiumFeature[] = [
  "full_year_narrative",
  "arbitrary_history",
  "domain_kline",
  "pdf_export",
  "deep_ask",
];

/**
 * 某净新面是否对该用户解锁。
 * - gate OFF（默认）→ 恒 true：WTP 验证前不建墙，一切免费。
 * - gate ON → 净新面需 entitlement；非注册面恒解锁。
 */
export function isTimelineFeatureUnlocked(
  _feature: TimelinePremiumFeature,
  hasEntitlement: boolean,
): boolean {
  // _feature 暂未细分（所有净新面同档 gate）；保留入参以备未来 per-feature 定价。
  if (!TIMELINE_PAYWALL_ENABLED) return true;
  return hasEntitlement;
}
