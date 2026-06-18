// INPUT: classifyRodden + BIRTH_TIME_SOURCES (components/calculators/rodden)。
// OUTPUT: Rodden 出生时间可信度分级纯算法测试——来源 → Rodden 码 + 信心档 + 哪些盘要素可信。
// POS: Rodden Rating 计算器（#21）纯算法契约；engine 变更需同步本测试。

import { describe, it, expect } from "vitest";
import {
  classifyRodden,
  BIRTH_TIME_SOURCES,
  type BirthTimeSource,
} from "../../components/calculators/rodden";

describe("classifyRodden", () => {
  it("birth certificate / hospital record => AA, high confidence, angles+houses+Moon all reliable", () => {
    const r = classifyRodden("certificate");
    expect(r.code).toBe("AA");
    expect(r.confidence).toBe("high");
    expect(r.anglesReliable).toBe(true);
    expect(r.housesReliable).toBe(true);
    expect(r.moonExact).toBe(true);
  });

  it("a remembered/rounded time => angles & houses NOT reliable (Ascendant moves ~1deg per 4 min)", () => {
    const mem = classifyRodden("memory");
    expect(mem.code).toBe("A");
    expect(mem.anglesReliable).toBe(false);
    expect(mem.housesReliable).toBe(false);
    // Moon sign still typically reliable for a rounded time
    expect(mem.moonExact).toBe(true);
  });

  it("conflicting sources => DD (dirty data), low confidence, nothing time-dependent trusted", () => {
    const r = classifyRodden("conflicting");
    expect(r.code).toBe("DD");
    expect(r.confidence).toBe("low");
    expect(r.anglesReliable).toBe(false);
    expect(r.housesReliable).toBe(false);
  });

  it("unknown time => X, no confidence, no houses/angles and Moon-to-degree not certain", () => {
    const r = classifyRodden("unknown");
    expect(r.code).toBe("X");
    expect(r.confidence).toBe("none");
    expect(r.anglesReliable).toBe(false);
    expect(r.housesReliable).toBe(false);
    expect(r.moonExact).toBe(false);
  });

  it("every Rodden code (incl. B) is reachable from at least one source", () => {
    const produced = new Set(
      BIRTH_TIME_SOURCES.map((s) => classifyRodden(s.id as BirthTimeSource).code),
    );
    for (const code of ["AA", "A", "B", "C", "DD", "X"]) {
      expect(produced.has(code as never)).toBe(true);
    }
  });

  it("every declared source classifies and exposes the canonical Rodden code", () => {
    const codes = new Set(["AA", "A", "B", "C", "DD", "X"]);
    for (const s of BIRTH_TIME_SOURCES) {
      const r = classifyRodden(s.id as BirthTimeSource);
      expect(codes.has(r.code)).toBe(true);
      // a degraded source must never claim angles reliable without houses reliable
      if (r.anglesReliable) expect(r.housesReliable).toBe(true);
    }
  });
});
