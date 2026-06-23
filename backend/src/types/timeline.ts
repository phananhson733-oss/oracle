// INPUT: ./api.js 的 BirthInput / Language / AccuracyLevel / Aspect 类型。
// OUTPUT: transit timeline（月度/人生 K 线）的 API 请求/响应 schema 类型与蜡烛诚实契约。
// POS: GET/POST /api/transit/timeline 的数据契约（#1 设计 → #2 实现 → #3 前端共用）。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type { BirthInput, Language, AccuracyLevel, Aspect } from "./api.js";

// 复用星历相位类型，避免与 services 层耦合（结构同构、可赋值）。
export type TimelineAspectType = Aspect["type"];

export type TimelineGranularity = "day" | "month" | "year";

// B1 域 activation（house→6 域定性，禁数值 score）。引擎在 services/transit/domains.ts。
export type Domain =
  | "career"
  | "relationships"
  | "money"
  | "creativity"
  | "wellness"
  | "growth";
export type Activation = "quiet" | "active" | "intense";
export type Lean = "flow" | "friction" | "mixed" | "neutral";
export interface DomainActivation {
  domain: Domain;
  activation: Activation;
  lean: Lean;
}
export interface DomainScore {
  domains: DomainActivation[];
  confidence: "full" | "reduced";
  version: string;
}

// 数据质量分级：ok=全部核心天体真实；partial=部分派生点降级（已从权重剔除）；
// approximate_time=出生时间未知/近似，ASC/宫位敏感项已降级（设计 B9）。
export type DataQuality = "ok" | "partial" | "approximate_time";

// 相位运动方向。P0 若未算运动则为 'unknown'，UI 与文案双重声明「实体只代表区间首末
// 强度差，不代表能量增强/减弱趋势」（设计 B8）。
export type DominantPhase =
  | "applying"
  | "exact"
  | "separating"
  | "mixed"
  | "unknown";

export interface TimelineCandleAspect {
  episodeId: string;
  transitBody: string;
  natalBody: string;
  type: TimelineAspectType;
  phase: DominantPhase;
}

// 一根蜡烛 = 一个 bucket 的区间摘要（start/peak/dip/end），非金融 OHLC 涨跌语义（设计 B8）。
// 所有强度字段均为 0-100 的 range-independent 相对刻度。
export interface TimelineCandle {
  date?: string; // YYYY-MM-DD（granularity 'day'）
  age?: number; // 年龄（granularity 'year'）
  start: number; // 区间首
  peak: number; // 区间最高
  dip: number; // 区间最低
  end: number; // 区间末
  intensity: number; // 当根代表强度
  harmony: number; // 柔和通道分量
  tension: number; // 强硬通道分量
  dominantPhase: DominantPhase;
  dataQuality: DataQuality;
  sampleCount: number; // 该 bucket 的采样点数（诚实契约）
  topAspects: TimelineCandleAspect[];
}

export type TimelineMarkerType =
  | "saturn-return"
  | "jupiter-return"
  | "nodal-return"
  | "outer-square"
  | "outer-opposition";

export interface TimelineMarker {
  date?: string;
  age?: number;
  type: TimelineMarkerType;
  label: string;
}

// 蜡烛诚实契约（响应级，常量不逐根重复，节省 100 点 payload 体积）。
export interface TimelineCandleContract {
  semantics: "interval-summary"; // start/peak/dip/end，非 open/high/low/close
  smoothingVersion: string;
  sourceVersion: string;
}

export interface TimelineRange {
  granularity: TimelineGranularity;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface TimelineRequest {
  birth: BirthInput;
  range: TimelineRange;
  tz: string; // viewer 时区锚（按本地「日」分桶用）
  lang?: Language;
}

export interface TimelineResponse {
  granularity: TimelineGranularity;
  tz: string;
  contract: TimelineCandleContract;
  candles: TimelineCandle[];
  markers: TimelineMarker[];
  dataQuality: DataQuality; // 整体（取最差的逐根质量）
  accuracy: AccuracyLevel;
  // B1（DOMAINS_ENABLED gate OFF 时 undefined）：6 域定性 activation，供 deep card 消费。
  domainScores?: DomainScore;
}
