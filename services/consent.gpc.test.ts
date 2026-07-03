// @vitest-environment jsdom
// INPUT: consent.ts 的 getDoNotSell/setDoNotSell/isGpcActive；stub navigator.globalPrivacyControl。
// OUTPUT: 断言 GPC 信号被当作有效 Do-Not-Sell/Share（评审 M3），且用户显式选择优先于 GPC。
// POS: consent GPC 单测；随 consent.ts 变更同步。

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDoNotSell, setDoNotSell, isGpcActive } from "./consent";

const setGpc = (value: boolean | undefined) => {
  Object.defineProperty(navigator, "globalPrivacyControl", {
    value,
    configurable: true,
  });
};

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  setGpc(undefined);
});

describe("GPC / getDoNotSell (评审 M3, CPRA §7025)", () => {
  it("GPC 开 + 无显式选择 → getDoNotSell true", () => {
    setGpc(true);
    expect(isGpcActive()).toBe(true);
    expect(getDoNotSell()).toBe(true);
  });
  it("GPC 开 但用户显式取消(setDoNotSell false) → false（显式选择优先）", () => {
    setGpc(true);
    setDoNotSell(false);
    expect(getDoNotSell()).toBe(false);
  });
  it("GPC 关 + 无显式选择 → false", () => {
    setGpc(false);
    expect(getDoNotSell()).toBe(false);
  });
  it("显式 setDoNotSell(true) → true（无论 GPC）", () => {
    setGpc(false);
    setDoNotSell(true);
    expect(getDoNotSell()).toBe(true);
  });
});
