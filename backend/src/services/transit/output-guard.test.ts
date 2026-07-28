// INPUT: output-guard.ts（生成文案安全校验层）。
// OUTPUT: vitest 套件——锁定 fate/medical/financial/market 四类禁词的检出 + 安全文案零误伤
//         （含 Codex 审计揪出的对抗 corpus：免责声明/自我成长文案不可误伤、宿命+金钱坏例必拦）+ guard 回落/telemetry。
// POS: Phase A0 安全底座回归测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, vi } from "vitest";
import {
  inspectGeneratedCopy,
  guardGeneratedCopy,
  SAFE_FALLBACK,
  type GuardCategory,
} from "./output-guard.js";

// =============================================================================
// 必过（A）：代表性已上线 timeline 文案 + 安全免责声明。
// NOTE: 这是一份"手维护的代表性 corpus"，不是从 components/timeline/copy.ts 自动派生
// （前后端分属不同构建，无法直接 import；共享层是 follow-up）。新增前端安全文案时需手动同步此处。
// 难点：免责声明本身含 diagnosis/诊断/必然/forecast/market 等否则会被禁的 token —— guard 必须放行。
// =============================================================================
const SHIPPED_SAFE = [
  "Your transit energy, day by day — a rhythm to notice, not a forecast.",
  "Height = how active the energy is (loud vs quiet), not good vs bad.",
  "Green — energy built through the day",
  "Red — energy eased through the day",
  "The thin line shows the day's full range; the bar shows start to end.",
  "Start / peak / low / end summarise the day — they are not market open/close.",
  "Heights are relative to your own range — not compared to anyone else.",
  "This maps tendencies in your transits to notice and work with. It doesn't predict events or outcomes.",
  "Blue leans flowing and easeful. Purple leans friction — challenge you can grow with. Most days are a mix.",
  "A steady stretch — a natural time to consolidate.",
  "Birth time is approximate, so Moon and angle timings are less precise.",
  // 安全免责声明（含被禁 token，必须放行 — Codex P1）
  "This is not a clinical diagnosis. If you're struggling, talk to a licensed professional.",
  "This is for self-reflection, not medical or financial advice.",
  // zh
  "你的行运能量，逐日呈现——一段值得留意的节奏，而非预测。",
  "起/高/低/末是对当天的概括，不是金融市场的开盘/收盘。",
  "它呈现你行运中的倾向，供你觉察与运用，并不预测具体事件或结果。",
  "高度 = 能量有多活跃（热闹还是平静），不代表好坏。",
  "平稳的一段——适合沉淀的自然时机。",
  "注意：这不是临床诊断。如有心理困扰，请咨询持证心理咨询师。",
];

// =============================================================================
// 必过（B）：未来自然的自我成长文案 —— 朴素的裸动词/裸词规则会误杀（Codex P1 false-positive）。
// =============================================================================
const FUTURE_BENIGN_SAFE = [
  "Invest in rest this week.",
  "A good time to invest in your relationships.",
  "Buy yourself time before saying yes.",
  "Don't sell yourself short.",
  "You may feel bound to a routine — that's worth noticing.",
  "这不是必然结果，只是一种倾向。",
  "投资你自己，而不是追逐结果。",
  // Codex + 对抗子代理揪出的金融/隐喻误伤（接入瞬间会破坏产品自身反思文案）
  "Invest energy, not money, into this.",
  "Invest in funds of patience.",
  "Profit from this lesson by reflecting.",
  "Profitable conversations could open up this week.",
  "Put your worries about money aside.",
  "投资你的关系，别太在意钱。",
  "卖力赚钱养家。",
  "买东西要花钱。",
];

// =============================================================================
// 必过（C）：占星核心文案 + 否定式安全免责声明（Codex 二审揪出的 false-positives）。
// Cancer=巨蟹座（产品最高频词），绝不可当病名误杀；否定的 guaranteed/一定会 是合规免责声明。
// =============================================================================
const ZODIAC_AND_NEGATED_SAFE = [
  // 巨蟹座（曾被 have+cancer 医疗规则灾难性误杀）
  "You have Cancer rising and a Capricorn Moon.",
  "You have a Cancer Moon and a Leo Sun.",
  "People who have Cancer placements value home and family.",
  "Having Cancer prominent in your chart, you feel things deeply.",
  "You've got Cancer rising this lifetime.",
  "You have Cancer in your 4th house.",
  "Cancer season invites you to nurture yourself.",
  "As a Cancer, you feel things deeply this season.",
  // 否定式确定性 = 反宿命的安全表达，不可误杀
  "No outcome is guaranteed; use this as reflection, not prediction.",
  "Growth here is not guaranteed — it is an invitation, not a promise.",
  "Nothing is guaranteed; this is a rhythm to notice.",
  "不一定会分手，只是提醒你多沟通。",
  "未必会如你所想，保持开放就好。",
  // 临床精度：裸 anxiety/depression 在日常语境下是普通情绪词，不可误杀（仅 "...disorder" 等临床短语才拦）
  "You may have anxiety about this transit, and that's okay to sit with.",
  "A heavy, low mood may visit — let it move through you.",
  // 跨行善意文案：\n 视为句界（同 .!?），两独立短行不得拼成跨行窗口（review P2 回归锁；
  // 换行拆分的 FN 属精度优先可接受延后项，见 plan INVESTIGATE ①）。
  "Sell yourself short\nMoney can wait",
  "You will rest\nMeet your needs",
];

// =============================================================================
// 必拒：四类禁词坏例（原始 corpus + Codex 揪出的漏网 false-negatives）。
// =============================================================================
const BAD: Array<{ text: string; category: GuardCategory }> = [
  // fate-certainty
  {
    text: "You will definitely meet your soulmate this year.",
    category: "fate",
  },
  { text: "This period is destined to bring heartbreak.", category: "fate" },
  {
    text: "Your success is guaranteed once Saturn moves on.",
    category: "fate",
  },
  { text: "You are bound to fail this quarter.", category: "fate" },
  { text: "今年注定会失败。", category: "fate" },
  { text: "这段关系必然破裂。", category: "fate" },
  { text: "你一定会升职。", category: "fate" },
  // medical
  {
    text: "You may be diagnosed with depression this month.",
    category: "medical",
  },
  { text: "This transit will cure your anxiety.", category: "medical" },
  { text: "这个月你可能会得抑郁症。", category: "medical" },
  // financial advice
  {
    text: "A great time to invest in stocks and buy crypto.",
    category: "financial",
  },
  {
    text: "You should sell your shares before the eclipse.",
    category: "financial",
  },
  { text: "适合抄底买入股票。", category: "financial" },
  // market-direction framing on the energy chart
  { text: "Your energy is bullish today — buy the dip.", category: "market" },
  {
    text: "Momentum closed lower; a bearish signal to sell.",
    category: "market",
  },
  { text: "你的能量看涨，建议抄底。", category: "market" },
  // ---- Codex 揪出的 false-negatives（高精度但漏拦的现实坏输出）----
  { text: "You will meet your soulmate this month.", category: "fate" },
  { text: "You must leave this relationship.", category: "fate" },
  { text: "This transit means you have depression.", category: "medical" },
  {
    text: "This is a profitable window; put money into Bitcoin.",
    category: "financial",
  },
  {
    text: "You will get rich after Jupiter activates your 2nd house.",
    category: "fate",
  },
  { text: "He felt destined for heartbreak this season.", category: "fate" },
  // ---- Codex 二审揪出的临床精神健康病名（低 FP、高 harm — mental-health 相邻产品 pre-wiring blocker）----
  {
    text: "This transit means you have an anxiety disorder.",
    category: "medical",
  },
  { text: "This transit means you have panic disorder.", category: "medical" },
  {
    text: "You may develop an eating disorder under this Moon.",
    category: "medical",
  },
  { text: "You develop PTSD after this transit.", category: "medical" },
  {
    text: "You suffer from bipolar disorder, the chart says.",
    category: "medical",
  },
];

describe("inspectGeneratedCopy — shipped + benign copy passes (zero false positives)", () => {
  for (const text of [
    ...SHIPPED_SAFE,
    ...FUTURE_BENIGN_SAFE,
    ...ZODIAC_AND_NEGATED_SAFE,
  ]) {
    it(`passes: "${text.slice(0, 48)}…"`, () => {
      const report = inspectGeneratedCopy(text);
      expect(report.safe, JSON.stringify(report.hits)).toBe(true);
      expect(report.hits).toHaveLength(0);
    });
  }
});

describe("inspectGeneratedCopy — forbidden copy is flagged with the right category", () => {
  for (const { text, category } of BAD) {
    it(`flags ${category}: "${text.slice(0, 48)}…"`, () => {
      const report = inspectGeneratedCopy(text);
      expect(report.safe).toBe(false);
      expect(report.hits.length).toBeGreaterThan(0);
      expect(report.hits.map((h) => h.category)).toContain(category);
    });
  }
});

describe("guardGeneratedCopy — returns text when safe, fallback when unsafe", () => {
  const FALLBACK = "A period worth noticing in your own rhythm.";

  it("returns the original string when safe", () => {
    const safe = "A steady stretch — a natural time to consolidate.";
    expect(guardGeneratedCopy(safe, FALLBACK)).toBe(safe);
  });

  it("returns the fallback when unsafe (never leaks the flagged string)", () => {
    const bad = "You will definitely get rich this year.";
    expect(guardGeneratedCopy(bad, FALLBACK)).toBe(FALLBACK);
  });

  it("calls onHit with sanitized hits only on unsafe input", () => {
    const onHit = vi.fn();
    guardGeneratedCopy("A steady stretch.", FALLBACK, {
      onHit,
      label: "timeline.node",
    });
    expect(onHit).not.toHaveBeenCalled();

    guardGeneratedCopy("destined to fail", FALLBACK, {
      onHit,
      label: "timeline.node",
    });
    expect(onHit).toHaveBeenCalledTimes(1);
    const [hits, label] = onHit.mock.calls[0];
    expect(label).toBe("timeline.node");
    expect(hits[0].category).toBe("fate");
    // sanitized: telemetry carries category + stable rule token, never user PII / full surrounding text
    expect(hits[0]).toHaveProperty("token");
    expect(hits[0]).not.toHaveProperty("match");
    expect(hits[0].token).toBe("fate-destined-to");
  });

  it("never lets an onHit telemetry failure break the deterministic fallback (Codex P2)", () => {
    const throwing = () => {
      throw new Error("telemetry sink down");
    };
    expect(() =>
      guardGeneratedCopy("destined to fail", FALLBACK, { onHit: throwing }),
    ).not.toThrow();
    expect(
      guardGeneratedCopy("destined to fail", FALLBACK, { onHit: throwing }),
    ).toBe(FALLBACK);
  });

  it("never leaks an unsafe fallback — degrades to SAFE_FALLBACK (Codex二审)", () => {
    const unsafeInput = "You will definitely meet your soulmate.";
    const unsafeFallback = "This period is destined to bring heartbreak.";
    expect(guardGeneratedCopy(unsafeInput, unsafeFallback)).toBe(SAFE_FALLBACK);
    // a safe fallback is still honoured
    const safeFallback = "A steady stretch — a natural time to consolidate.";
    expect(guardGeneratedCopy(unsafeInput, safeFallback)).toBe(safeFallback);
    // SAFE_FALLBACK itself must be clean
    expect(inspectGeneratedCopy(SAFE_FALLBACK).safe).toBe(true);
  });
});

describe("guardGeneratedCopy — label is sanitized before telemetry (no PII channel)", () => {
  const FALLBACK = "A period worth noticing in your own rhythm.";

  it("drops a non-whitelisted label (e.g. a leaked user.email)", () => {
    const onHit = vi.fn();
    guardGeneratedCopy("destined to fail", FALLBACK, {
      onHit,
      label: "user@example.com",
    });
    expect(onHit).toHaveBeenCalledTimes(1);
    expect(onHit.mock.calls[0][1]).toBeUndefined();
  });

  it("keeps a valid static label", () => {
    const onHit = vi.fn();
    guardGeneratedCopy("destined to fail", FALLBACK, {
      onHit,
      label: "timeline.node-narrative",
    });
    expect(onHit.mock.calls[0][1]).toBe("timeline.node-narrative");
  });
});

describe("inspectGeneratedCopy — hit token is a stable PII-free rule id (never user text)", () => {
  // 带 PII 的窗口型坏输入：旧实现 match=m[0] 会把姓名/病情等中段原文塞进 telemetry。
  const PII_LADEN = [
    "Marcus, you will leave your husband Daniel before spring.",
    "You should sell Daniel Chen's shares before Friday.",
    "You got severe untreated depression that no transit can explain.",
    "You will, after your divorce from David Chen, finally marry.",
  ];
  for (const text of PII_LADEN) {
    it(`token carries no input text for: "${text.slice(0, 40)}…"`, () => {
      const { hits } = inspectGeneratedCopy(text);
      expect(hits.length).toBeGreaterThan(0);
      const lowered = text.toLowerCase();
      for (const h of hits) {
        // token 是固定的 ascii 规则标识（小写 + 连字符），绝不来自用户输入
        expect(h.token).toMatch(/^[a-z][a-z-]+$/);
        expect(lowered).not.toContain(h.token);
      }
    });
  }
});
