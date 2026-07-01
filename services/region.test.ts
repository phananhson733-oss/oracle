// @vitest-environment jsdom
// INPUT: region.ts 的纯函数与 fetchRegion（mock fetch + sessionStorage）。
// OUTPUT: 断言 GDPR 国家判定、响应解析与 fail-safe（失败→UNKNOWN）。
// POS: region 服务单测；随 region.ts 变更同步。

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  isGdprCountry,
  parseRegionResponse,
  fetchRegion,
  getCachedRegion,
  shouldDeferToCmp,
  isCmpPresent,
  UNKNOWN_REGION,
  __resetRegionCacheForTest,
} from "./region";

describe("isGdprCountry", () => {
  it("EU/UK/CH 国家为 true（大小写不敏感）", () => {
    expect(isGdprCountry("DE")).toBe(true);
    expect(isGdprCountry("de")).toBe(true);
    expect(isGdprCountry("FR")).toBe(true);
    expect(isGdprCountry("GB")).toBe(true);
    expect(isGdprCountry("CH")).toBe(true);
  });
  it("非 GDPR 区 / 空值为 false", () => {
    expect(isGdprCountry("US")).toBe(false);
    expect(isGdprCountry("JP")).toBe(false);
    expect(isGdprCountry(null)).toBe(false);
    expect(isGdprCountry(undefined)).toBe(false);
    expect(isGdprCountry("")).toBe(false);
  });
});

describe("parseRegionResponse", () => {
  it("已知非 GDPR 国家 → isGdpr=false", () => {
    expect(parseRegionResponse({ country: "US" })).toEqual({
      country: "US",
      isGdpr: false,
    });
  });
  it("GDPR 国家（小写归一化）→ isGdpr=true", () => {
    expect(parseRegionResponse({ country: "de" })).toEqual({
      country: "DE",
      isGdpr: true,
    });
  });
  it("缺 country / 非字符串 / null → 未知（country=null,isGdpr=null）", () => {
    expect(parseRegionResponse({})).toEqual({ country: null, isGdpr: null });
    expect(parseRegionResponse({ country: 123 })).toEqual({
      country: null,
      isGdpr: null,
    });
    expect(parseRegionResponse(null)).toEqual({ country: null, isGdpr: null });
  });
});

describe("shouldDeferToCmp (评审 #1 fail-safe)", () => {
  it("GDPR 区 且 CMP 就位 → 抑制自研横幅", () => {
    expect(shouldDeferToCmp({ country: "DE", isGdpr: true }, true)).toBe(true);
  });
  it("GDPR 区 但 CMP 未就位 → 不抑制（fail-safe 保留横幅，绝不让 EEA 失去同意入口）", () => {
    expect(shouldDeferToCmp({ country: "DE", isGdpr: true }, false)).toBe(
      false,
    );
  });
  it("非 GDPR 区 → 不抑制（保留品牌横幅）", () => {
    expect(shouldDeferToCmp({ country: "US", isGdpr: false }, true)).toBe(
      false,
    );
  });
  it("地域未知 → 不抑制（fail-safe）", () => {
    expect(shouldDeferToCmp(UNKNOWN_REGION, true)).toBe(false);
  });
});

describe("isCmpPresent", () => {
  afterEach(() => {
    delete (window as unknown as { __tcfapi?: unknown }).__tcfapi;
  });
  it("window.__tcfapi 缺失 → false", () => {
    expect(isCmpPresent()).toBe(false);
  });
  it("window.__tcfapi 为函数 → true", () => {
    (window as unknown as { __tcfapi?: unknown }).__tcfapi = () => {};
    expect(isCmpPresent()).toBe(true);
  });
});

describe("fetchRegion", () => {
  beforeEach(() => {
    __resetRegionCacheForTest();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("成功响应 → 解析 + 缓存（第二次不再请求）", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ country: "FR" }) });
    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchRegion();
    expect(first).toEqual({ country: "FR", isGdpr: true });

    const second = await fetchRegion();
    expect(second).toEqual({ country: "FR", isGdpr: true });
    expect(fetchMock).toHaveBeenCalledTimes(1); // 命中缓存
    expect(getCachedRegion()).toEqual({ country: "FR", isGdpr: true });
  });

  it("非 2xx → UNKNOWN（fail-safe）", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchRegion()).toEqual(UNKNOWN_REGION);
  });

  it("fetch 抛错 → UNKNOWN（fail-safe，不抛出）", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await fetchRegion()).toEqual(UNKNOWN_REGION);
  });
});
