// INPUT: buildSafetyFooterHtml from utils/safetyFooter.ts (single source of truth).
// OUTPUT: vitest specs enforcing the mandatory psych-adjacent safety footer
//         (clinical disclaimer + crisis helplines) per CLAUDE.md AI 安全边界 #1/#4.
// POS: Compliance guard — psych-adjacent static stubs must carry the disclaimer
//      and crisis lines. The SPA <SafetyFooter> reuses the SAME copy, so guarding
//      the HTML builder guards both. If the required copy changes, update in lockstep.

import { describe, it, expect } from "vitest";
import { buildSafetyFooterHtml } from "../../utils/safetyFooter";

describe("buildSafetyFooter (EN)", () => {
  const html = buildSafetyFooterHtml("en");

  it("carries the clinical-diagnosis disclaimer", () => {
    expect(html).toContain("not a clinical diagnosis");
    expect(html.toLowerCase()).toContain("licensed mental health professional");
  });

  it("states we do not diagnose or make fatalistic predictions", () => {
    expect(html).toContain("medical diagnosis");
    expect(html).toContain("fatalistic predictions");
  });

  it("lists US, UK and international crisis helplines with links", () => {
    expect(html).toContain("988");
    expect(html).toContain("988lifeline.org");
    expect(html).toContain("Samaritans");
    expect(html).toContain("116 123");
    expect(html).toContain("befrienders.org");
    expect(html).toContain('href="tel:988"');
  });

  it("renders a labelled note region", () => {
    expect(html).toContain('role="note"');
  });
});

describe("buildSafetyFooter (ZH)", () => {
  const html = buildSafetyFooterHtml("zh");

  it("carries the exact mandated Chinese clinical note", () => {
    expect(html).toContain("这不是临床诊断");
    expect(html).toContain("持证心理咨询师");
  });

  it("still lists crisis helplines", () => {
    expect(html).toContain("988");
    expect(html).toContain("撒玛利亚会");
  });
});

describe("buildSafetyFooter defaults", () => {
  it("falls back to English for unknown/missing lang", () => {
    expect(buildSafetyFooterHtml("fr")).toBe(buildSafetyFooterHtml("en"));
    expect(buildSafetyFooterHtml()).toBe(buildSafetyFooterHtml("en"));
  });
});
