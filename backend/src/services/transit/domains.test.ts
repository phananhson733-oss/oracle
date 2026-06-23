// INPUT: domains.ts（scoreDomains 纯函数）。
// OUTPUT: B1 spike 校准/契约测试——house→域映射、Node→growth、self-relative 定性分档、flow/friction lean、出生时间未知降 confidence、输出禁数值 score。
// POS: B1 可行性 spike 回归（library-only，待签字纳入）。若域映射/分档阈值变更须同步 DOMAIN_ALGO_VERSION + 本测试。

import { describe, it, expect } from "vitest";
import type { ScoredAspectInput } from "./weights.js";
import {
  scoreDomains,
  natalHouseMap,
  aggregateDomainScores,
  DOMAINS,
  DOMAIN_ALGO_VERSION,
  DOMAINS_ENABLED,
  type Domain,
} from "./domains.js";

const aspect = (
  natalBody: string,
  type: ScoredAspectInput["type"],
  orb: number,
  transitBody = "Saturn",
): ScoredAspectInput => ({ transitBody, natalBody, type, orb });

const act = (r: ReturnType<typeof scoreDomains>, d: Domain) =>
  r.domains.find((x) => x.domain === d)!;

describe("scoreDomains — B1 spike domain activation (house→domain, qualitative)", () => {
  it("maps a triggered 7th-house natal point to relationships, flow lean (trine)", () => {
    const r = scoreDomains([aspect("Venus", "trine", 1, "Jupiter")], (b) =>
      b === "Venus" ? 7 : undefined,
    );
    expect(act(r, "relationships").activation).toBe("intense"); // only active domain → self-relative top
    expect(act(r, "relationships").lean).toBe("flow"); // trine = harmony
    expect(act(r, "career").activation).toBe("quiet");
    expect(r.confidence).toBe("full");
  });

  it("routes Nodes to growth regardless of house", () => {
    const r = scoreDomains(
      [aspect("North Node", "conjunction", 0.5)],
      () => undefined, // house unknown, but Node → growth, and Node doesn't reduce confidence
    );
    expect(act(r, "growth").activation).toBe("intense");
    expect(r.confidence).toBe("full");
  });

  it("is self-relative: the stronger domain is intense, friction vs flow lean is honest", () => {
    const r = scoreDomains(
      [
        aspect("Sun", "square", 0.3), // house 10 → career, strong + tension
        aspect("Mars", "sextile", 3.8, "Mercury"), // house 6 → wellness, weak + harmony
      ],
      (b) => ({ Sun: 10, Mars: 6 })[b],
    );
    expect(act(r, "career").activation).toBe("intense");
    expect(act(r, "career").lean).toBe("friction"); // square = tension
    expect(act(r, "wellness").lean).toBe("flow"); // sextile = harmony
    // wellness is weaker than career → not intense
    expect(act(r, "wellness").activation).not.toBe("intense");
  });

  it("reduces confidence when a non-Node natal point lacks a house (birth time unknown)", () => {
    const r = scoreDomains([aspect("Sun", "square", 1)], () => undefined);
    expect(r.confidence).toBe("reduced");
    // unmapped house + not a Node → not forced into any domain
    expect(r.domains.every((d) => d.activation === "quiet")).toBe(true);
  });

  it("CONTRACT: output is purely qualitative — no numeric score / '/100' anywhere", () => {
    const r = scoreDomains([aspect("Venus", "trine", 1)], () => 7);
    expect(r.domains).toHaveLength(DOMAINS.length);
    for (const d of r.domains) {
      expect(["quiet", "active", "intense"]).toContain(d.activation);
      expect(["flow", "friction", "mixed", "neutral"]).toContain(d.lean);
      // no score-like numeric field leaked into the activation entry
      expect(Object.keys(d).sort()).toEqual(["activation", "domain", "lean"]);
    }
    expect(JSON.stringify(r)).not.toMatch(/score|\/100/i);
    expect(r.version).toBe(DOMAIN_ALGO_VERSION);
  });

  it("empty aspects → all quiet, full confidence", () => {
    const r = scoreDomains([], () => 1);
    expect(r.domains.every((d) => d.activation === "quiet")).toBe(true);
    expect(r.confidence).toBe("full");
  });

  it("CALIBRATION: every house 1-12 maps to a domain — no triggered natal point is silently dropped", () => {
    // 落地校准：1/3/4/11 宫此前被静默丢弃（domainOfAspect→null），confidence 却报 full，不诚实。
    // 补全后全 12 宫各归一域：单个被触发本命点 → 恰一个域激活、confidence full。
    for (let h = 1; h <= 12; h++) {
      const r = scoreDomains([aspect("X", "trine", 1)], () => h);
      const active = r.domains.filter((d) => d.activation !== "quiet");
      expect(
        active,
        `house ${h} should map to exactly one domain`,
      ).toHaveLength(1);
      expect(r.confidence).toBe("full");
    }
  });

  it("CALIBRATION: a representative natal chart spreads activation across multiple domains", () => {
    // 常见行星分布（太阳10/月亮4/金星7/水星3/火星6/木星2）——含此前被丢弃的 4/3 宫。
    const houses: Record<string, number> = {
      Sun: 10,
      Moon: 4,
      Venus: 7,
      Mercury: 3,
      Mars: 6,
      Jupiter: 2,
    };
    const r = scoreDomains(
      [
        aspect("Sun", "trine", 1),
        aspect("Moon", "square", 2),
        aspect("Venus", "sextile", 1.5),
        aspect("Mercury", "trine", 2),
        aspect("Mars", "conjunction", 0.5),
        aspect("Jupiter", "square", 3),
      ],
      (b) => houses[b],
    );
    const active = r.domains.filter((d) => d.activation !== "quiet");
    // 多域激活（非全 quiet、非单域垄断），落地体验合理。
    expect(active.length).toBeGreaterThanOrEqual(3);
    expect(r.confidence).toBe("full");
  });
});

describe("B1 house plumbing — natalHouseMap + const gate", () => {
  it("builds a name→house map from natal positions, skipping missing houses", () => {
    const map = natalHouseMap([
      { name: "Sun", house: 10 },
      { name: "Venus", house: 7 },
      { name: "Moon", house: undefined }, // birth time unknown for this point
      { name: "Mars", house: null },
    ]);
    expect(map).toEqual({ Sun: 10, Venus: 7 });
  });

  it("the house map drives scoreDomains end-to-end (Sun@10 → career)", () => {
    const map = natalHouseMap([{ name: "Sun", house: 10 }]);
    const r = scoreDomains(
      [{ transitBody: "Saturn", natalBody: "Sun", type: "trine", orb: 1 }],
      (b) => map[b],
    );
    expect(r.domains.find((d) => d.domain === "career")!.activation).toBe(
      "intense",
    );
    expect(r.confidence).toBe("full");
  });

  it("ships ENABLED (B1 域引擎已落地：接线完成 + 全 12 宫映射校准)", () => {
    // 翻这个开关是有意识的落地决定（DOMAINS_ENABLED OFF→ON，2026-06-23）。回退须同步本断言。
    expect(DOMAINS_ENABLED).toBe(true);
  });

  it("aggregateDomainScores derives range-level activation from per-day repAspects + natal", () => {
    const perDay = [
      [
        {
          transitBody: "Saturn",
          natalBody: "Venus",
          type: "trine" as const,
          orb: 1,
        },
      ],
      [
        {
          transitBody: "Mars",
          natalBody: "Venus",
          type: "square" as const,
          orb: 2,
        },
      ],
    ];
    const r = aggregateDomainScores(perDay, [{ name: "Venus", house: 7 }]);
    // Venus@7 across both days → relationships is the active domain, mixed lean (trine + square)
    expect(
      r.domains.find((d) => d.domain === "relationships")!.activation,
    ).toBe("intense");
    expect(r.confidence).toBe("full");
    expect(r.version).toBe(DOMAIN_ALGO_VERSION);
  });
});
