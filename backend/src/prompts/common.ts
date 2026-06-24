// INPUT: Prompt 共享类型、常量与工具函数（含 AI 安全护栏常量与 resolver）。
// OUTPUT: 导出 Prompt 类型定义、共享工具函数与双语 AI 安全护栏常量/resolver。
// POS: Prompt 公共模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

/**
 * Prompt 共享模块
 * - 类型定义
 * - 共享常量（语言指令、格式要求、AI 安全护栏）
 * - 工具函数（语言解析、上下文格式化、安全护栏 resolver）
 */

// === 类型定义 ===

export interface PromptMeta {
  id: string;
  version: string;
  scenario:
    | "natal"
    | "daily"
    | "ask"
    | "synastry"
    | "wiki"
    | "newsletter"
    | "transit";
}

export type PromptSystem =
  | string
  | ((context: Record<string, unknown>) => string);

export interface PromptTemplate {
  meta: PromptMeta;
  system: PromptSystem;
  user: (context: Record<string, unknown>) => string;
}

// === 共享常量 ===

export const SINGLE_LANGUAGE_INSTRUCTION = `必须使用指定语言输出 JSON，格式为：
{ "lang": "<lang>", "content": {...} }
其中 lang 必须与输入语言一致，只能为 "zh" 或 "en"。
确保 JSON 格式正确，不要添加额外的 markdown 标记或解释文本。`;

export const SINGLE_LANGUAGE_INSTRUCTION_EN = `Return JSON only in the specified language:
{ "lang": "<lang>", "content": {...} }
The lang field must exactly match the input language and be either "zh" or "en".
Do not add markdown fences or extra commentary.`;

// === 工具函数 ===

export const formatLang = (ctx: Record<string, unknown>) =>
  `语言：${String(ctx.lang || "zh")}`;

// === 合盘专用工具函数 ===

export const resolveSynastryLang = (ctx: Record<string, unknown>) =>
  ctx.lang === "en" ? "en" : "zh";

// Privacy red line: real names MUST NOT enter the LLM prompt context.
// Always return an alias regardless of whether ctx[key] is provided.
export const resolveSynastryName = (
  ctx: Record<string, unknown>,
  key: "nameA" | "nameB",
) => {
  if (resolveSynastryLang(ctx) === "en")
    return key === "nameA" ? "Person A" : "Person B";
  return key === "nameA" ? "A" : "B";
};

export const resolveRelationshipType = (ctx: Record<string, unknown>) =>
  String(ctx.relationship_type || ctx.relationshipType || "").trim();

export const formatSynastryContextBlock = (ctx: Record<string, unknown>) => {
  const nameA = resolveSynastryName(ctx, "nameA");
  const nameB = resolveSynastryName(ctx, "nameB");
  const relationshipType = resolveRelationshipType(ctx);
  const accuracy = ctx.birth_accuracy as
    | { nameA?: string; nameB?: string }
    | undefined;
  const accuracyLine = accuracy
    ? resolveSynastryLang(ctx) === "en"
      ? `Birth time accuracy: ${nameA}: ${accuracy.nameA || "unknown"}, ${nameB}: ${accuracy.nameB || "unknown"}`
      : `出生时间准确度：${nameA}：${accuracy.nameA || "未知"}，${nameB}：${accuracy.nameB || "未知"}`
    : null;
  const comparisonLine = ctx.comparison
    ? resolveSynastryLang(ctx) === "en"
      ? `Comparison cues: ${JSON.stringify(ctx.comparison)}`
      : `对比盘线索：${JSON.stringify(ctx.comparison)}`
    : null;
  const compositeLine = ctx.composite
    ? resolveSynastryLang(ctx) === "en"
      ? `Composite cues: ${JSON.stringify(ctx.composite)}`
      : `组合盘线索：${JSON.stringify(ctx.composite)}`
    : null;
  if (resolveSynastryLang(ctx) === "en") {
    return [
      `Language: en`,
      `Natal chart of ${nameA}: ${JSON.stringify(ctx.chartA)}`,
      `Natal chart of ${nameB}: ${JSON.stringify(ctx.chartB)}`,
      `Synastry: ${JSON.stringify(ctx.synastry)}`,
      `Relationship type: ${relationshipType || "unspecified"}`,
      ...(accuracyLine ? [accuracyLine] : []),
      ...(comparisonLine ? [comparisonLine] : []),
      ...(compositeLine ? [compositeLine] : []),
    ].join("\n");
  }
  return [
    `语言：zh`,
    `${nameA} 的本命盘：${JSON.stringify(ctx.chartA)}`,
    `${nameB} 的本命盘：${JSON.stringify(ctx.chartB)}`,
    `合盘：${JSON.stringify(ctx.synastry)}`,
    `关系类型：${relationshipType || "未指定"}`,
    ...(accuracyLine ? [accuracyLine] : []),
    ...(comparisonLine ? [comparisonLine] : []),
    ...(compositeLine ? [compositeLine] : []),
  ].join("\n");
};

// === 详情解读格式常量 ===

export const DETAIL_INTERPRETATION_FORMAT_ZH = `interpretation 格式要求：
- 必须使用 Markdown，且只允许 3 个以 ### 开头的分区标题，顺序固定：### 核心观点、### 机制拆解、### 可执行建议。
- 每个分区只使用 "-" 项列表，不要写成连续段落；每条 1 句。
- 每条要点必须以固定前缀开头：核心观点用"观点："，机制拆解用"机制："，可执行建议用"建议："。
- 条数要求：核心观点 2-4 条，机制拆解 2-3 条，可执行建议 3-5 条。
- 分区之间空行；不要使用粗体、编号或表格。
- 仅 interpretation 字段允许 Markdown，title/summary/highlights 保持纯文本。`;

export const DETAIL_INTERPRETATION_FORMAT_EN = `Interpretation format:
- Use Markdown with exactly 3 ### headings in this order: ### Key Takeaways, ### Mechanism Breakdown, ### Action Steps.
- Use "-" bullet lists only (no paragraphs); 1 sentence per bullet.
- Each bullet must start with a fixed prefix: "Key:", "Mechanism:", "Action:".
- Bullet counts: Key Takeaways 2-4, Mechanism Breakdown 2-3, Action Steps 3-5.
- Keep a blank line between sections; no bold, numbering, or tables.
- Only the interpretation field may include Markdown; keep title/summary/highlights plain text.`;

export const DETAIL_INTERPRETATION_FORMAT = `${DETAIL_INTERPRETATION_FORMAT_ZH}
${DETAIL_INTERPRETATION_FORMAT_EN}`;

export const DETAIL_OUTPUT_INSTRUCTION = `输出结构：
- title: 模块标题（简短有力，纯文本，必须先陈述占星术语的定义或基本信息）
- summary: 简要总结（2-3 句，纯文本，先解释该占星术语是什么，再说明其核心意义）
- highlights: 关键要点数组（3-5 条，每条 1 句，纯文本，第一条必须是对该占星术语的通俗解释，后续条目才是要点分析）
- interpretation: 详见格式要求（仅此字段允许 Markdown）
${DETAIL_INTERPRETATION_FORMAT}
${SINGLE_LANGUAGE_INSTRUCTION}`;

// === AI 安全护栏常量 ===

/**
 * SAFETY_INSTRUCTION（中文版）：注入到所有 51 个 prompt 模板的 system 字段最前面，
 * 强制 LLM 在生成时遵守三条核心安全边界：禁止医疗诊断、禁止宿命化表述、危机引导。
 * 与 add-cbt-crisis-detection 的 API 关键词短路构成深度防御。
 */
export const SAFETY_INSTRUCTION_ZH = `安全护栏（必须遵守）：
1. 你不是医疗专业人士，禁止诊断、开方或保证治疗效果。
2. 禁止使用"注定""必然""一定会""无法改变"等绝对化或宿命化表述；用"可能""倾向于""或许会""有这种潜在趋势"等克制语气替代。
3. 涉及严重困扰（持续低落、自伤想法、惊恐发作）时，温和建议用户寻求持证心理咨询师或精神科医生协助。`;

/**
 * SAFETY_INSTRUCTION（英文版）：lang === 'en' 时使用，语义与中文版一致。
 */
export const SAFETY_INSTRUCTION_EN = `Safety guardrails (mandatory):
1. You are NOT a medical professional. Do not diagnose, prescribe, or guarantee any clinical outcome.
2. Avoid absolute or fate-bound language ("will", "must", "destined to", "always"). Use tentative phrasing instead: "may", "could", "tends toward", "suggests a tendency".
3. When the user mentions persistent distress, self-harm, or panic, gently suggest consulting a licensed therapist or psychiatrist.`;

/**
 * CBT_DISCLAIMER_FOOTER（中文版）：追加到 6 个 cbt-* prompt 的 user 输出末尾，
 * 让 LLM 在结构化输出之外明确声明"非临床诊断"，避免用户误把 CBT 分析当作专业诊断。
 */
export const CBT_DISCLAIMER_FOOTER_ZH = `注意：这不是临床诊断。如果你正在经历持续的心理困扰，请考虑咨询持证心理咨询师或精神科医生。`;

/**
 * CBT_DISCLAIMER_FOOTER（英文版）。
 */
export const CBT_DISCLAIMER_FOOTER_EN = `Note: This is not a clinical diagnosis. If you're experiencing ongoing psychological distress, please consider consulting a licensed therapist or psychiatrist.`;

/**
 * NO_FATE_CERTAINTY_REMINDER（中文版）：注入到涉及未来/关系/周期/详情类 prompt 的 system，
 * 在 SAFETY_INSTRUCTION 之后追加一条强提醒，避免 LLM 在长输出中漂回宿命化措辞。
 */
export const NO_FATE_CERTAINTY_REMINDER_ZH = `重要：禁止使用绝对化/宿命化措辞（注定、必然、一定）；改用"可能""倾向于""或许""或许暗示"等表达。`;

/**
 * NO_FATE_CERTAINTY_REMINDER（英文版）。
 */
export const NO_FATE_CERTAINTY_REMINDER_EN = `Important: Avoid absolute/fated language (destined, definitely, must). Use tentative phrasing (may, could, tends toward, suggests a tendency).`;

// === AI 安全护栏 resolver ===

/**
 * 根据 ctx.lang 解析返回 zh/en SAFETY_INSTRUCTION，缺省回退到 zh。
 */
export const resolveSafetyInstruction = (ctx: Record<string, unknown>) =>
  ctx.lang === "en" ? SAFETY_INSTRUCTION_EN : SAFETY_INSTRUCTION_ZH;

/**
 * 根据 ctx.lang 解析返回 zh/en CBT_DISCLAIMER_FOOTER，缺省回退到 zh。
 */
export const resolveCbtDisclaimer = (ctx: Record<string, unknown>) =>
  ctx.lang === "en" ? CBT_DISCLAIMER_FOOTER_EN : CBT_DISCLAIMER_FOOTER_ZH;

/**
 * 根据 ctx.lang 解析返回 zh/en NO_FATE_CERTAINTY_REMINDER，缺省回退到 zh。
 */
export const resolveNoFateReminder = (ctx: Record<string, unknown>) =>
  ctx.lang === "en"
    ? NO_FATE_CERTAINTY_REMINDER_EN
    : NO_FATE_CERTAINTY_REMINDER_ZH;
