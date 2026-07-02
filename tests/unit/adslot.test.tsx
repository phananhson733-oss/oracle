// @vitest-environment jsdom
// INPUT: AdSlot 组件；真实 AuthContext.Provider 控制登录态；mock useRegion/adsense 服务隔离门控。
// OUTPUT: 断言 AdSlot 仅在四重门控全过时渲染 <ins> 并 push，否则返回 null。
// POS: AdSlot 组件单测；随 AdSlot.tsx 变更同步。

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import AuthContext from "../../contexts/AuthContext";
import { notifyAdConsentChanged } from "../../services/adConsentBus";

const h = vi.hoisted(() => ({
  region: { country: "US", isGdpr: false } as {
    country: string | null;
    isGdpr: boolean | null;
  },
  configured: true,
  consent: true,
  loadAdsense: vi.fn(() => true),
  pushAd: vi.fn(),
}));

vi.mock("../../hooks/useRegion", () => ({
  useRegion: () => h.region,
}));
vi.mock("../../services/adsense", () => ({
  isAdsenseConfigured: () => h.configured,
  hasAdConsent: () => h.consent,
  getAdsenseClientId: () => "ca-pub-test",
  loadAdsense: h.loadAdsense,
  pushAd: h.pushAd,
}));

import { AdSlot } from "../../components/ads/AdSlot";

let authed = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderSlot = (slot: string) =>
  render(
    <AuthContext.Provider value={{ isAuthenticated: authed } as any}>
      <AdSlot slot={slot} />
    </AuthContext.Provider>,
  );

beforeEach(() => {
  authed = false;
  h.region = { country: "US", isGdpr: false };
  h.configured = true;
  h.consent = true;
  h.loadAdsense.mockClear();
  h.pushAd.mockClear();
});

describe("AdSlot 四重门控", () => {
  it("全过 → 渲染 <ins class=adsbygoogle> 并 push 一次", () => {
    const { container } = renderSlot("123");
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).not.toBeNull();
    expect(ins?.getAttribute("data-ad-slot")).toBe("123");
    expect(ins?.getAttribute("data-ad-client")).toBe("ca-pub-test");
    expect(h.pushAd).toHaveBeenCalledTimes(1);
  });

  it("未配置(flag off) → null，不 push", () => {
    h.configured = false;
    const { container } = renderSlot("123");
    expect(container.querySelector("ins")).toBeNull();
    expect(h.pushAd).not.toHaveBeenCalled();
  });

  it("登录用户 → null（保护漏斗 + 注册去广告）", () => {
    authed = true;
    const { container } = renderSlot("123");
    expect(container.querySelector("ins")).toBeNull();
  });

  it("无广告同意 → null", () => {
    h.consent = false;
    const { container } = renderSlot("123");
    expect(container.querySelector("ins")).toBeNull();
  });

  it("slot 为空 → null（PR1 未配置 slot 时的防御）", () => {
    const { container } = renderSlot("");
    expect(container.querySelector("ins")).toBeNull();
  });

  it("无 AuthProvider 也不抛错（叶子降级为匿名）", () => {
    // 直接渲染，不套 Provider —— 复现 wiki SEO 测试独立渲染场景
    const { container } = render(<AdSlot slot="123" />);
    // configured+consent+匿名 → 渲染广告
    expect(container.querySelector("ins.adsbygoogle")).not.toBeNull();
  });

  it("授予同意后同页立即出广告并 push 一次（评审 B2 反应式）", () => {
    h.consent = false; // 初始无广告同意
    const { container } = renderSlot("123");
    expect(container.querySelector("ins")).toBeNull();
    expect(h.pushAd).not.toHaveBeenCalled();

    // 用户在当前页授予同意 → 派发事件 → useAdConsentVersion 重渲染 → gated 重算
    h.consent = true;
    act(() => {
      notifyAdConsentChanged();
    });

    expect(container.querySelector("ins.adsbygoogle")).not.toBeNull();
    expect(h.pushAd).toHaveBeenCalledTimes(1); // 恰一次，不重复
  });

  it("gated false→true→false 重挂 <ins> 时重新 push（评审 B2' pushedRef 重置）", () => {
    const { container } = renderSlot("123"); // 初始出广告
    expect(container.querySelector("ins.adsbygoogle")).not.toBeNull();
    expect(h.pushAd).toHaveBeenCalledTimes(1);

    // 撤回同意 → 无广告
    h.consent = false;
    act(() => notifyAdConsentChanged());
    expect(container.querySelector("ins")).toBeNull();

    // 再次授予 → 新 <ins> 重新 push（pushedRef 已在 gated 时重置）
    h.consent = true;
    act(() => notifyAdConsentChanged());
    expect(container.querySelector("ins.adsbygoogle")).not.toBeNull();
    expect(h.pushAd).toHaveBeenCalledTimes(2);
  });
});
