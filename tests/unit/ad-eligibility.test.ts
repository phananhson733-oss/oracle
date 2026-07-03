// INPUT: components/ads/adEligibility 的 isAdEligibleArticle。
// OUTPUT: 断言广告投放资格：排除 embeddedTool(漏斗) / psychAdjacent(心理敏感) 文章（评审 B4）。
// POS: adEligibility 单测；随 adEligibility.ts 变更同步。

import { describe, it, expect } from "vitest";
import { isAdEligibleArticle } from "../../components/ads/adEligibility";

describe("isAdEligibleArticle (评审 B4：门控#1 结构化)", () => {
  it("普通文章 → true", () => {
    expect(isAdEligibleArticle({})).toBe(true);
  });
  it("embeddedTool(转化漏斗) → false（保护转化）", () => {
    expect(
      isAdEligibleArticle({ embeddedTool: { tool: "north-node-sign" } }),
    ).toBe(false);
  });
  it("psychAdjacent(心理敏感) → false（心理安全）", () => {
    expect(isAdEligibleArticle({ psychAdjacent: true })).toBe(false);
  });
  it("null / undefined → false", () => {
    expect(isAdEligibleArticle(null)).toBe(false);
    expect(isAdEligibleArticle(undefined)).toBe(false);
  });
});
