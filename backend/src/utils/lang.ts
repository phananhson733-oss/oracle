// INPUT: 类型 Language 与未知输入（query/body 字段、ai service fallback 上下文、AI 输出内容）。
// OUTPUT: resolveLang(value, fallback?) 解析 lang；detectDominantLang(content) 按内容判主导语言。
// POS: 后端语言解析共享工具；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { Language } from "../types/api.js";

const SUPPORTED_LANGS: ReadonlySet<Language> = new Set<Language>(["zh", "en"]);

export const resolveLang = (
  value: unknown,
  fallback: Language = "en",
): Language => {
  if (typeof value !== "string") return fallback;
  if (SUPPORTED_LANGS.has(value as Language)) return value as Language;
  return fallback;
};

// 递归收集对象/数组中的字符串值（仅值，不含键），用于内容语言检测。
// 限深度与数量，避免超大内容拖慢热路径。
function collectStringValues(
  value: unknown,
  acc: string[],
  depth: number,
): void {
  if (depth > 6 || acc.length > 400) return;
  if (typeof value === "string") {
    acc.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, acc, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectStringValues(v, acc, depth + 1);
    }
  }
}

/**
 * 按内容实际文字判断主导语言（用于 AI 输出语言校验，防止错语言被缓存）。
 *
 * 只统计字符串「值」（忽略 JSON 键），比较 CJK 与拉丁字母占比：
 * - CJK 占比 >= 10% -> 'zh'（中文常夹少量拉丁术语/人名，故阈值偏低）
 * - CJK 占比 <= 2%  -> 'en'（英文几乎不含 CJK）
 * - 信号过少或介于其间 -> null（不下结论，调用方按未知处理）
 */
export const detectDominantLang = (content: unknown): Language | null => {
  const strings: string[] = [];
  collectStringValues(content, strings, 0);
  const text = strings.join(" ");
  let cjk = 0;
  let latin = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x4e00 && code <= 0x9fff) cjk += 1;
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a))
      latin += 1;
  }
  const total = cjk + latin;
  if (total < 8) return null;
  const cjkRatio = cjk / total;
  if (cjkRatio >= 0.1) return "zh";
  if (cjkRatio <= 0.02) return "en";
  return null;
};
