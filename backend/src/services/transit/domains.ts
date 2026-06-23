// INPUT: ScoredAspectInput[]（带 orb→aspectStrength，禁用 topAspects 摘要）+ natalHouseOf(natalBody)→宫位（plumb 自 PlanetPosition.house）。
// OUTPUT: scoreDomains → 6 域定性 activation（quiet/active/intense + flow/friction lean），self-relative、零 LLM、确定性、可缓存。
// POS: B1 域引擎（**已落地上线** 2026-06-23）。接 buildMonthlyTimeline/buildYearOfMonthsTimeline（DOMAINS_ENABLED ON）→ 响应 domainScores → TimelineDomains deep card。
//      诚实契约：主=被触发本命点所在宫位→域；Node→growth；aspect type 只拆 flow/friction 通道；transit 星不决定域。
//      输出**禁 "/100" 禁 "Score"**——只给定性 activation（对齐 blocker #2）。出生时间未知(house=undefined 且非 Node)→该相位降为 low-confidence，不强行归域。

import type { ScoredAspectInput } from "./weights.js";
import { aspectStrength } from "./intensity.js";
import { ASPECT_POLARITY } from "./weights.js";
import type {
  Domain,
  Activation,
  Lean,
  DomainActivation,
  DomainScore,
} from "../../types/timeline.js";

// 类型规范在 types/timeline.ts（响应契约共用）；此处 re-export 保持消费方从 domains 导入不变。
export type { Domain, Activation, Lean, DomainActivation, DomainScore };

// domain 映射独立版本——别和 intensity 的 TIMELINE_ALGO_VERSION 绑死，否则调映射会无谓失效全部日缓存。
// v1：落地（全 12 宫映射校准）。升版本作废 v0-spike 缓存，避免旧 spike 输出污染。
export const DOMAIN_ALGO_VERSION = "domains-v1";

// const gate：domains 引擎**已落地上线**（2026-06-23，接线 + 全 12 宫映射校准完成）。
export const DOMAINS_ENABLED = true;

export const DOMAINS: readonly Domain[] = [
  "career",
  "relationships",
  "money",
  "creativity",
  "wellness",
  "growth",
];

// 宫位→域（占星共识，**全 12 宫覆盖**——落地校准，不静默丢弃任何被触发的本命宫位）。
const HOUSE_DOMAIN: Record<number, Domain> = {
  1: "wellness", // 自我/身体/活力
  2: "money", // 收入/价值
  3: "growth", // 心智/学习/沟通
  4: "relationships", // 家庭/根基
  5: "creativity", // 创造/恋爱/玩乐
  6: "wellness", // 健康/日常
  7: "relationships", // 一对一伙伴（+ DSC 同义）
  8: "money", // 共有资源/转化
  9: "growth", // 哲学/远行/高等学习
  10: "career", // 事业/公众（+ MC 同义）
  11: "relationships", // 朋友/社群
  12: "growth", // 灵性/潜意识/退省
};

// 交点 → growth（无论宫位），与 9/12 同归内在成长。
const NODE_NAMES = new Set([
  "North Node",
  "South Node",
  "true node",
  "mean node",
  "Rahu",
  "Ketu",
  "Node",
]);

function domainOfAspect(
  natalBody: string,
  house: number | undefined,
): Domain | null {
  if (NODE_NAMES.has(natalBody)) return "growth";
  if (house == null) return null; // 出生时间未知/宫位缺失 → 不强行归域
  return HOUSE_DOMAIN[house] ?? null;
}

/**
 * 纯函数：把带 orb 的相位 + 本命宫位映射成 6 域定性 activation。
 * - 强度来自 aspectStrength(orb×bodyWeights×polarity)，按被触发本命点的宫位累加到域。
 * - activation 用 self-relative 阈值（与你自己最活跃的域比），非绝对分数。
 * - lean 由 harmony/tension 通道占比决定（flow/friction/mixed/neutral）。
 */
export function scoreDomains(
  aspects: ScoredAspectInput[],
  natalHouseOf: (natalBody: string) => number | undefined,
): DomainScore {
  const flow: Record<Domain, number> = blank();
  const friction: Record<Domain, number> = blank();
  let reduced = false;

  for (const a of aspects) {
    const house = natalHouseOf(a.natalBody);
    if (house == null && !NODE_NAMES.has(a.natalBody)) reduced = true;
    const domain = domainOfAspect(a.natalBody, house);
    if (!domain) continue;
    const s = Math.max(0, aspectStrength(a));
    const polarity = ASPECT_POLARITY[a.type];
    if (polarity === "harmony") flow[domain] += s;
    else if (polarity === "tension") friction[domain] += s;
    else {
      // neutral(合相)：均分入两通道，只贡献总活跃度、不偏 flow/friction。
      flow[domain] += s / 2;
      friction[domain] += s / 2;
    }
  }

  const total: Record<Domain, number> = blank();
  for (const d of DOMAINS) total[d] = flow[d] + friction[d];
  const maxTotal = Math.max(0, ...DOMAINS.map((d) => total[d]));

  const domains: DomainActivation[] = DOMAINS.map((d) => ({
    domain: d,
    activation: activationOf(total[d], maxTotal),
    lean: leanOf(flow[d], friction[d]),
  }));

  return {
    domains,
    confidence: reduced ? "reduced" : "full",
    version: DOMAIN_ALGO_VERSION,
  };
}

// B1 house 透传原语：从本命 positions（含 PlanetPosition.house）建 name→house 映射，
// 供 scoreDomains 的 natalHouseOf 查表。buildNatalLongitudes 只取经度丢了宫位，这里单独保留宫位。
// 出生时间未知时 house 缺失 → 该名不入表 → natalHouseOf 返回 undefined → scoreDomains 降 confidence。
export function natalHouseMap(
  positions: ReadonlyArray<{ name: string; house?: number | null }>,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of positions) {
    if (p.house != null) map[p.name] = p.house;
  }
  return map;
}

// B1 派生入口：从各日 cached repAspects（保持 CachedDay 形状稳定，不另存）+ 本命 positions
// 聚合出整段区间的 domain activation。builder 在 DOMAINS_ENABLED 时调它并挂到响应。纯函数、可测。
export function aggregateDomainScores(
  perDayAspects: ReadonlyArray<ReadonlyArray<ScoredAspectInput>>,
  natalPositions: ReadonlyArray<{ name: string; house?: number | null }>,
): DomainScore {
  const map = natalHouseMap(natalPositions);
  const all = perDayAspects.flat();
  return scoreDomains(all, (b) => map[b]);
}

function blank(): Record<Domain, number> {
  return {
    career: 0,
    relationships: 0,
    money: 0,
    creativity: 0,
    wellness: 0,
    growth: 0,
  };
}

// self-relative 定性分档：与你自己最活跃的域比（非绝对刻度），输出 3 档。
function activationOf(value: number, maxTotal: number): Activation {
  if (value <= 0 || maxTotal <= 0) return "quiet";
  const share = value / maxTotal;
  if (share >= 0.66) return "intense";
  if (share >= 0.25) return "active";
  return "quiet";
}

// flow/friction 倾向：主导通道（差距 <20% 视为 mixed；两通道都为 0 = neutral）。
function leanOf(flow: number, friction: number): Lean {
  const sum = flow + friction;
  if (sum <= 0) return "neutral";
  const diff = Math.abs(flow - friction) / sum;
  if (diff < 0.2) return "mixed";
  return flow > friction ? "flow" : "friction";
}
