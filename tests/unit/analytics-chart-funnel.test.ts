// INPUT: sanitizeChartFunnelParams / trackChartFunnel from services/analytics.
// OUTPUT: vitest unit specs enforcing 隐私红线 #1 (default-deny PII allowlist) on the chart funnel.
// POS: Guards tool-led chart-start/signup funnel events against leaking DOB/city/coords/name.

import { describe, it, expect } from "vitest";
import { sanitizeChartFunnelParams } from "../../services/analytics";

// 隐私红线 #1 (CLAUDE.md): analytics 禁传 birthCity/birthCoordinates/nameA-B/question/hotThought 等。
// 工具页漏斗的事件必须 by-construction 守卫：默认拒绝，只放行白名单分类字段。
describe("sanitizeChartFunnelParams — 隐私红线 #1 by-construction guard", () => {
  it("keeps only allowlisted non-PII fields and strips every PII field", () => {
    const out = sanitizeChartFunnelParams({
      // allowlisted (categorical, non-PII):
      sign: "scorpio",
      module: "north-node",
      tool: "north-node-sign",
      step: "chart_start",
      placement: "wiki",
      // PII that must NEVER reach analytics:
      dob: "1990-01-01",
      birthDate: "1990-01-01",
      birthCity: "Paris",
      birthCoordinates: "48.8,2.3",
      lat: 48.8,
      lng: 2.3,
      nameA: "Alice",
      nameB: "Bob",
      name: "Alice",
      question: "will I find love",
      hotThought: "I am unlovable",
    } as never);

    expect(out).toEqual({
      sign: "scorpio",
      module: "north-node",
      tool: "north-node-sign",
      step: "chart_start",
      placement: "wiki",
    });
    for (const piiKey of [
      "dob",
      "birthDate",
      "birthCity",
      "birthCoordinates",
      "lat",
      "lng",
      "nameA",
      "nameB",
      "name",
      "question",
      "hotThought",
    ]) {
      expect(out).not.toHaveProperty(piiKey);
    }
  });

  it("drops unknown keys not on the allowlist (default-deny)", () => {
    const out = sanitizeChartFunnelParams({ sign: "leo", somethingNew: "x" } as never);
    expect(out).toEqual({ sign: "leo" });
  });

  it("returns an empty object when only PII/unknown fields are present", () => {
    expect(sanitizeChartFunnelParams({ dob: "1990-01-01" } as never)).toEqual({});
  });

  it("omits allowlisted keys whose value is undefined", () => {
    expect(
      sanitizeChartFunnelParams({ sign: undefined, module: "north-node" } as never),
    ).toEqual({ module: "north-node" });
  });
});
