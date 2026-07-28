// INPUT: TypeScript 类型定义（snake_case 字段与嵌套键，含危机短路响应）。
// OUTPUT: 导出 CBT 数据类型 + CBTCrisisResponse。
// POS: CBT 类型定义。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

export interface MoodEntry {
  id: string;
  name: string;
  initialIntensity: number; // 0-100
  finalIntensity?: number; // 0-100
}

export interface BalancedEntry {
  id: string;
  text: string;
  belief: number; // 0-100
}

export type EmojiMood =
  | "very_happy"
  | "happy"
  | "okay"
  | "annoyed"
  | "terrible";

export type MoodImages = Record<EmojiMood, string>;

export interface CBTRecord {
  id: string;
  timestamp: number;
  situation: string; // Step 1
  moods: MoodEntry[]; // Step 2 & 9
  bodySymptoms?: string[]; // Step 3
  automaticThoughts: string[]; // Step 4
  hotThought: string; // Step 5
  evidenceFor: string[]; // Step 6
  evidenceAgainst: string[]; // Step 7
  balancedEntries: BalancedEntry[]; // Step 8
  emojiMood?: EmojiMood; // Step 10
  analysis?: AnalysisReport;
  completedActionIndices?: number[];
}

export interface AnalysisReport {
  cognitive_analysis: {
    distortions: string[];
    summary: string;
  };
  astro_context: {
    aspect: string;
    interpretation: string;
  };
  jungian_insight: {
    archetype_active: string;
    archetype_solution: string;
    insight: string;
  };
  actions: string[];
}

// 后端 CBT 危机短路响应：与 backend/src/types/api.ts 的 CBTCrisisResponse 对齐。
// 命中关键词时所有 6 个 CBT 分析端点都返回此结构（HTTP 200，非错误分支）。
export interface CBTCrisisHelpline {
  region: string;
  name_en: string;
  name_zh: string;
  phone: string;
  url: string;
}

export interface CBTCrisisResponse {
  status: "crisis_detected";
  helpline: CBTCrisisHelpline;
  message_zh: string;
  message_en: string;
}

export function isCBTCrisisResponse(
  payload: unknown,
): payload is CBTCrisisResponse {
  return (
    !!payload &&
    typeof payload === "object" &&
    (payload as { status?: unknown }).status === "crisis_detected"
  );
}
