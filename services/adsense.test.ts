// @vitest-environment jsdom
// INPUT: adsense.ts 的门控与加载逻辑；consent.ts 写入营销同意/Do-Not-Sell；env stub。
// OUTPUT: 断言 isAdsenseConfigured、evaluateTcfConsent、hasAdConsent 各分支与 loadAdsense 单例注入。
// POS: adsense 服务单测；随 adsense.ts 变更同步。

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isAdsenseConfigured,
  evaluateTcfConsent,
  hasAdConsent,
  loadAdsense,
  pushAd,
  getAdsenseClientId,
  __resetAdsenseForTest,
} from "./adsense";
import { setConsentPreferences, setDoNotSell } from "./consent";
import type { RegionInfo } from "./region";

const US: RegionInfo = { country: "US", isGdpr: false };
const EEA: RegionInfo = { country: "DE", isGdpr: true };
const UNKNOWN: RegionInfo = { country: null, isGdpr: null };

const enableAdsense = () => {
  vi.stubEnv("VITE_ADSENSE_ENABLED", "true");
  vi.stubEnv("VITE_ADSENSE_CLIENT_ID", "ca-pub-1234567890123456");
};

beforeEach(() => {
  __resetAdsenseForTest();
  window.localStorage.clear();
  document.head.innerHTML = "";
  vi.unstubAllEnvs();
  delete (window as unknown as { adsbygoogle?: unknown }).adsbygoogle;
});

describe("isAdsenseConfigured (门控#4)", () => {
  it("enabled + client id → true", () => {
    enableAdsense();
    expect(isAdsenseConfigured()).toBe(true);
  });
  it("未 enable → false", () => {
    vi.stubEnv("VITE_ADSENSE_ENABLED", "false");
    vi.stubEnv("VITE_ADSENSE_CLIENT_ID", "ca-pub-1234567890123456");
    expect(isAdsenseConfigured()).toBe(false);
  });
  it("enable 但无 client id → false", () => {
    vi.stubEnv("VITE_ADSENSE_ENABLED", "true");
    vi.stubEnv("VITE_ADSENSE_CLIENT_ID", "");
    expect(isAdsenseConfigured()).toBe(false);
  });
});

describe("evaluateTcfConsent", () => {
  it("Purpose1 + Google vendor 同意 → true", () => {
    expect(
      evaluateTcfConsent({
        gdprApplies: true,
        purpose: { consents: { 1: true } },
        vendor: { consents: { 755: true } },
      }),
    ).toBe(true);
  });
  it("缺 Purpose1 或缺 Google vendor → false", () => {
    expect(
      evaluateTcfConsent({
        gdprApplies: true,
        purpose: { consents: { 1: false } },
        vendor: { consents: { 755: true } },
      }),
    ).toBe(false);
    expect(
      evaluateTcfConsent({
        gdprApplies: true,
        purpose: { consents: { 1: true } },
        vendor: { consents: { 755: false } },
      }),
    ).toBe(false);
  });
  it("gdprApplies=false / 空 → false", () => {
    expect(evaluateTcfConsent({ gdprApplies: false })).toBe(false);
    expect(evaluateTcfConsent(null)).toBe(false);
    expect(evaluateTcfConsent(undefined)).toBe(false);
  });
});

describe("hasAdConsent (门控#3, 地域分流)", () => {
  it("地域未知 → false（fail-safe 拒绝）", () => {
    setConsentPreferences({ essential: true, analytics: true, marketing: true });
    expect(hasAdConsent(UNKNOWN)).toBe(false);
  });
  it("EEA + 无 CMP/TCF → false（PR1 恒为 false）", () => {
    setConsentPreferences({ essential: true, analytics: true, marketing: true });
    expect(hasAdConsent(EEA)).toBe(false);
  });
  it("非 EEA + 营销同意 + 未 Do-Not-Sell → true", () => {
    setConsentPreferences({ essential: true, analytics: true, marketing: true });
    setDoNotSell(false);
    expect(hasAdConsent(US)).toBe(true);
  });
  it("非 EEA + 营销拒绝 → false", () => {
    setConsentPreferences({
      essential: true,
      analytics: true,
      marketing: false,
    });
    expect(hasAdConsent(US)).toBe(false);
  });
  it("非 EEA + 营销同意但 Do-Not-Sell 开 → false", () => {
    setConsentPreferences({ essential: true, analytics: true, marketing: true });
    setDoNotSell(true);
    expect(hasAdConsent(US)).toBe(false);
  });
});

describe("loadAdsense", () => {
  it("已配置 → 注入单个 adsbygoogle.js（带 client），重复调用不再注入", () => {
    enableAdsense();
    expect(loadAdsense()).toBe(true);
    const scripts = document.querySelectorAll("#astro-adsense");
    expect(scripts.length).toBe(1);
    const src = scripts[0].getAttribute("src") || "";
    expect(src).toContain("pagead2.googlesyndication.com");
    expect(src).toContain(`client=${getAdsenseClientId()}`);
    expect(loadAdsense()).toBe(true);
    expect(document.querySelectorAll("#astro-adsense").length).toBe(1);
  });
  it("未配置 → 不注入、返回 false", () => {
    vi.stubEnv("VITE_ADSENSE_ENABLED", "false");
    expect(loadAdsense()).toBe(false);
    expect(document.querySelectorAll("#astro-adsense").length).toBe(0);
  });
});

describe("pushAd", () => {
  it("永不抛错，adsbygoogle 变为数组", () => {
    expect(() => pushAd()).not.toThrow();
    expect(
      Array.isArray((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle),
    ).toBe(true);
  });
});
