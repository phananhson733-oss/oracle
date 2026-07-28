// INPUT: 后端 API 调用与 prompt key 映射（单语言 payload）。
// OUTPUT: 导出内容生成函数（含问答类别透传、单语言解析与概览结构兼容）。
// POS: AI 内容服务层。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Language, type NatalOverviewContent } from "../types";
import {
  fetchAskAnswer,
  fetchCycleNaming,
  fetchDailyDetail,
  fetchDailyForecast,
  fetchNatalCoreThemes,
  fetchNatalDimension,
  fetchNatalOverview,
  fetchSynastry,
} from "./apiClient";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const isBig3Module = (value: unknown): boolean =>
  isRecord(value) &&
  isString(value.title) &&
  isString(value.description) &&
  isStringArray(value.keywords);

const isNatalOverviewContent = (
  value: unknown,
): value is NatalOverviewContent =>
  isRecord(value) &&
  isBig3Module(value.sun) &&
  isBig3Module(value.moon) &&
  isBig3Module(value.rising);

const LEGACY_ZH_SIGNS = [
  "白羊",
  "金牛",
  "双子",
  "巨蟹",
  "狮子",
  "处女",
  "天秤",
  "天蝎",
  "射手",
  "摩羯",
  "水瓶",
  "双鱼",
];
const LEGACY_EN_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const BIG3_LABELS: Record<
  "sun" | "moon" | "rising",
  { zh: string; en: string }
> = {
  sun: { zh: "太阳", en: "Sun" },
  moon: { zh: "月亮", en: "Moon" },
  rising: { zh: "上升", en: "Rising" },
};

const BIG3_KEYWORDS: Record<
  "sun" | "moon" | "rising",
  { zh: string[]; en: string[] }
> = {
  sun: { zh: ["意志", "目标", "自我"], en: ["identity", "drive", "purpose"] },
  moon: { zh: ["情绪", "安全", "需求"], en: ["emotion", "security", "needs"] },
  rising: {
    zh: ["第一印象", "气质", "外在"],
    en: ["impression", "style", "expression"],
  },
};

const DEFAULT_DESC: Record<
  "sun" | "moon" | "rising",
  { zh: string; en: string }
> = {
  sun: {
    zh: "这是你本命盘的核心动力来源。",
    en: "This is a core source of your natal drive.",
  },
  moon: {
    zh: "这里反映你的情绪节奏与安全需求。",
    en: "This reflects your emotional rhythm and needs.",
  },
  rising: {
    zh: "这里展现你被他人感知的方式。",
    en: "This shapes how others experience you.",
  },
};

const extractLegacySign = (description: string, language: Language) => {
  if (!description) return undefined;
  if (language === "zh") {
    const match = description.match(
      new RegExp(`(${LEGACY_ZH_SIGNS.join("|")})座`),
    );
    return match?.[1];
  }
  const match = description.match(
    new RegExp(`\\b(${LEGACY_EN_SIGNS.join("|")})\\b`, "i"),
  );
  return match ? match[1] : undefined;
};

const resolveLegacyDescription = (value: unknown): string | undefined =>
  isRecord(value) && isString(value.description)
    ? value.description
    : undefined;

const convertLegacyNatalOverview = (
  legacy: Record<string, unknown>,
  language: Language,
): NatalOverviewContent => {
  const big3 = isRecord(legacy.big3) ? legacy.big3 : {};
  const personalPlanets = isRecord(legacy.personal_planets)
    ? legacy.personal_planets
    : {};
  const interpretation = isRecord(legacy.interpretation)
    ? legacy.interpretation
    : {};
  const overviewText = isString(interpretation.overview)
    ? interpretation.overview
    : undefined;

  const buildBig3 = (key: "sun" | "moon" | "rising") => {
    const entry = (big3 as Record<string, unknown>)[key];
    const description =
      resolveLegacyDescription(entry) || DEFAULT_DESC[key][language];
    const sign = extractLegacySign(description, language);
    const label = BIG3_LABELS[key][language];
    const title = sign
      ? language === "zh"
        ? `${label}${sign}`
        : `${label} in ${sign}`
      : label;
    return {
      title,
      keywords: BIG3_KEYWORDS[key][language],
      description,
    };
  };

  const mercuryText = resolveLegacyDescription(
    (personalPlanets as Record<string, unknown>).mercury,
  );
  const venusText = resolveLegacyDescription(
    (personalPlanets as Record<string, unknown>).venus,
  );

  return {
    sun: buildBig3("sun"),
    moon: buildBig3("moon"),
    rising: buildBig3("rising"),
    core_melody:
      language === "zh"
        ? {
            keywords: ["动力", "感受"],
            explanations: ["行动与情绪并重", "保持内在觉察"],
          }
        : {
            keywords: ["drive", "sensitivity"],
            explanations: [
              "Balances action with feeling",
              "Stays internally aware",
            ],
          },
    top_talent: {
      title: language === "zh" ? "思维与表达" : "Mind & Expression",
      example:
        mercuryText ||
        overviewText ||
        (language === "zh"
          ? "你的优势往往体现在表达与洞察上。"
          : "Your strengths show up in how you express and interpret."),
      advice:
        language === "zh"
          ? "把优势转化为清晰可执行的目标。"
          : "Channel it into clear, practical goals.",
    },
    top_pitfall: {
      title: language === "zh" ? "关系张力" : "Relational Tension",
      triggers: venusText
        ? [
            language === "zh" ? "投入过深" : "Over-investing",
            language === "zh" ? "期待落差" : "Expectation gaps",
          ]
        : [
            language === "zh" ? "节奏失衡" : "Overload",
            language === "zh" ? "情绪起伏" : "Emotional swings",
          ],
      protection:
        language === "zh"
          ? "放慢节奏，先稳定情绪再行动。"
          : "Slow down, steady emotions before acting.",
    },
    trigger_card: {
      auto_reactions:
        language === "zh"
          ? ["先防御", "先解释"]
          : ["defend quickly", "over-explain"],
      inner_need:
        language === "zh" ? "被理解与被接住" : "to be understood and supported",
      buffer_action:
        language === "zh"
          ? "先停三秒再回应。"
          : "Pause for three seconds before responding.",
    },
    share_text:
      overviewText ||
      (language === "zh"
        ? "我的星盘提醒我在行动与感受间寻找平衡。"
        : "My chart reminds me to balance action with sensitivity."),
  };
};

const normalizeNatalOverviewContent = (
  value: unknown,
  language: Language,
): NatalOverviewContent | null => {
  if (!value || !isRecord(value)) return null;
  if (isNatalOverviewContent(value)) return value;
  if (isRecord(value.big3)) return convertLegacyNatalOverview(value, language);
  return null;
};

/**
 * This service now delegates to backend APIs.
 * The backend handles AI generation via DeepSeek.
 */
export const generateContent = async <T>(
  promptKey: string,
  data: Record<string, unknown>,
  language: Language = "zh",
): Promise<T | null> => {
  try {
    const pickContent = (result?: Record<string, unknown>) => {
      if (!result?.content) return null;
      return result.content as T;
    };

    // Map prompt keys to API calls
    if (promptKey === "NATAL_OVERVIEW" && data.profile) {
      const result = await fetchNatalOverview(
        data.profile as Parameters<typeof fetchNatalOverview>[0],
        language,
      );
      const raw = pickContent(result);
      return (normalizeNatalOverviewContent(raw, language) || raw) as T | null;
    }

    if (promptKey === "CORE_THEMES" && data.profile) {
      const result = await fetchNatalCoreThemes(
        data.profile as Parameters<typeof fetchNatalCoreThemes>[0],
        language,
      );
      return pickContent(result);
    }

    if (
      promptKey === "DIMENSION_REPORT" &&
      data.profile &&
      (data.dimension || data.dimension_key)
    ) {
      const result = await fetchNatalDimension(
        data.profile as Parameters<typeof fetchNatalDimension>[0],
        String(data.dimension || data.dimension_key),
        language,
      );
      return pickContent(result);
    }

    if (promptKey === "DAILY_FORECAST" && data.profile && data.date) {
      const result = await fetchDailyForecast(
        data.profile as Parameters<typeof fetchDailyForecast>[0],
        data.date as string,
        language,
      );
      return pickContent(result);
    }

    if (promptKey === "DAILY_PUBLIC" && data.profile && data.date) {
      const result = await fetchDailyForecast(
        data.profile as Parameters<typeof fetchDailyForecast>[0],
        data.date as string,
        language,
      );
      return pickContent(result);
    }

    if (promptKey === "DAILY_DETAIL" && data.profile && data.date) {
      const result = await fetchDailyDetail(
        data.profile as Parameters<typeof fetchDailyDetail>[0],
        data.date as string,
        language,
      );
      return pickContent(result);
    }

    if (promptKey === "CYCLE_CARD_NAMING" && (data.cycle || data.input_json)) {
      const cycle = (data.cycle || data.input_json) as Parameters<
        typeof fetchCycleNaming
      >[0];
      const result = await fetchCycleNaming(cycle, language);
      return pickContent(result);
    }

    if (promptKey === "SYNASTRY_OVERVIEW" && data.profile && data.partner) {
      const result = await fetchSynastry(
        data.profile as Parameters<typeof fetchSynastry>[0],
        data.partner as Parameters<typeof fetchSynastry>[1],
        language,
        data.relationship_type as string | undefined,
      );
      return pickContent(result);
    }

    if (promptKey === "ASK_ANSWER" && data.profile && data.question) {
      const category = data.category as string | undefined;
      const result = await fetchAskAnswer(
        data.profile as Parameters<typeof fetchAskAnswer>[0],
        data.question as string,
        (data.context as string | undefined) ??
          (data.context_json as string | undefined),
        language,
        category,
      );
      return pickContent(result);
    }

    console.warn(`[AstrologyWiki] Unhandled prompt key: ${promptKey}`);
    return null;
  } catch (error) {
    console.error("Error generating content", error);
    return null;
  }
};
