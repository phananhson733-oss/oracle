// INPUT: 无（纯数据 + 纯函数）。
// OUTPUT: Rodden 出生时间可信度分级——BIRTH_TIME_SOURCES（来源选项 + 双语标签）、classifyRodden（来源 → Rodden 码 +
//         信心档 + 盘要素可信度标志：angles/houses/moonExact）。
// POS: Rodden Rating 计算器（#21）纯算法层。无 IO、无出生数据存储、无 PII——仅把用户选择的「出生时间来源」
//      映射到占星数据质量分级，作教育/透明用途。若更新此文件，务必更新 calculators/FOLDER.md。

// 标准 Rodden 评级码（出生时间数据可信度）。
export type RoddenCode = "AA" | "A" | "B" | "C" | "DD" | "X";

export type BirthTimeSource =
  | "certificate"
  | "family_record"
  | "biography"
  | "memory"
  | "approximate"
  | "conflicting"
  | "unknown";

export type Confidence = "high" | "moderate" | "low" | "none";

export interface RoddenRating {
  code: RoddenCode;
  confidence: Confidence;
  // 该精度下哪些盘要素可信。上升/天顶（angles）与宫位（houses）对出生时间极敏感
  // （上升约每 4 分钟移动 1°）；月亮到度（moonExact）只在时间完全未知时才不确定。
  anglesReliable: boolean;
  housesReliable: boolean;
  moonExact: boolean;
}

interface SourceDef {
  id: BirthTimeSource;
  label: { en: string; zh: string };
  rating: RoddenRating;
}

// 来源 → 分级。anglesReliable 蕴含 housesReliable（两者都依赖精确出生时间）。
export const BIRTH_TIME_SOURCES: SourceDef[] = [
  {
    id: "certificate",
    label: {
      en: "Birth certificate or hospital record",
      zh: "出生证明 / 医院记录",
    },
    rating: {
      code: "AA",
      confidence: "high",
      anglesReliable: true,
      housesReliable: true,
      moonExact: true,
    },
  },
  {
    id: "family_record",
    label: {
      en: "Recorded by family (baby book, written note)",
      zh: "家人记录（成长册 / 手写记录）",
    },
    rating: {
      code: "A",
      confidence: "high",
      anglesReliable: true,
      housesReliable: true,
      moonExact: true,
    },
  },
  {
    id: "biography",
    label: {
      en: "From a biography or public record",
      zh: "传记或公开资料",
    },
    rating: {
      code: "B",
      confidence: "moderate",
      anglesReliable: false,
      housesReliable: false,
      moonExact: true,
    },
  },
  {
    id: "memory",
    label: {
      en: "From memory (mine or a parent's), rounded",
      zh: "凭记忆（本人或父母），大致时间",
    },
    rating: {
      code: "A",
      confidence: "moderate",
      anglesReliable: false,
      housesReliable: false,
      moonExact: true,
    },
  },
  {
    id: "approximate",
    label: {
      en: "Approximate only (e.g. 'sometime in the morning')",
      zh: "仅大致（如「早上某时」）",
    },
    rating: {
      code: "C",
      confidence: "low",
      anglesReliable: false,
      housesReliable: false,
      moonExact: true,
    },
  },
  {
    id: "conflicting",
    label: {
      en: "Conflicting sources (records disagree)",
      zh: "来源互相矛盾（记录不一致）",
    },
    rating: {
      code: "DD",
      confidence: "low",
      anglesReliable: false,
      housesReliable: false,
      moonExact: false,
    },
  },
  {
    id: "unknown",
    label: {
      en: "Time of birth unknown",
      zh: "出生时间未知",
    },
    rating: {
      code: "X",
      confidence: "none",
      anglesReliable: false,
      housesReliable: false,
      moonExact: false,
    },
  },
];

const BY_ID: Record<BirthTimeSource, RoddenRating> = Object.fromEntries(
  BIRTH_TIME_SOURCES.map((s) => [s.id, s.rating]),
) as Record<BirthTimeSource, RoddenRating>;

export function classifyRodden(source: BirthTimeSource): RoddenRating {
  return BY_ID[source];
}
