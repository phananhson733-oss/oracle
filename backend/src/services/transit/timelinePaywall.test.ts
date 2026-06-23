// INPUT: timelinePaywall.ts（TIMELINE_PAYWALL_ENABLED / TIMELINE_PREMIUM_FEATURES / isTimelineFeatureUnlocked）。
// OUTPUT: 付费 scaffold 单测 —— gate 默认 OFF 契约 + 净新面注册表 + ON/OFF 解锁语义。
// POS: 付费 entitlement scaffold 回归；锁"墙默认 OFF（WTP 验证前不建墙）"这个 plan 契约不被无意翻开。

import { describe, it, expect } from "vitest";
import {
  TIMELINE_PAYWALL_ENABLED,
  TIMELINE_PREMIUM_FEATURES,
  isTimelineFeatureUnlocked,
  type TimelinePremiumFeature,
} from "./timelinePaywall.js";

describe("timeline paywall scaffold (gated OFF)", () => {
  it("ships the paywall flag OFF — no wall until WTP validates", () => {
    // 这是一个故意的契约：建墙前先 fake-door 验 WTP（plan §5 冲突4）。
    // 翻这个 flag 必须是有意识的决定（会让此测试失败，提醒改契约）。
    expect(TIMELINE_PAYWALL_ENABLED).toBe(false);
  });

  it("registers exactly the net-new premium surfaces (free/safety surfaces excluded)", () => {
    expect([...TIMELINE_PREMIUM_FEATURES].sort()).toEqual(
      [
        "arbitrary_history",
        "deep_ask",
        "domain_kline",
        "full_year_narrative",
        "pdf_export",
      ].sort(),
    );
  });

  it("unlocks every premium surface while the gate is OFF, regardless of entitlement", () => {
    for (const feature of TIMELINE_PREMIUM_FEATURES) {
      expect(isTimelineFeatureUnlocked(feature, false)).toBe(true);
      expect(isTimelineFeatureUnlocked(feature, true)).toBe(true);
    }
  });

  it("would gate on entitlement only when the wall is ON (documents the ON semantics)", () => {
    // gate 逻辑独立可测：OFF→恒解锁；ON→需 entitlement。
    const gate = (enabled: boolean, has: boolean): boolean =>
      !enabled ? true : has;
    const feature: TimelinePremiumFeature = "full_year_narrative";
    // 当前实现（OFF）：两者皆解锁
    expect(isTimelineFeatureUnlocked(feature, false)).toBe(gate(false, false));
    // 翻墙后的语义（纯函数验证，不改全局 flag）
    expect(gate(true, false)).toBe(false); // 无 entitlement → 锁
    expect(gate(true, true)).toBe(true); // 有 entitlement → 解锁
  });
});
