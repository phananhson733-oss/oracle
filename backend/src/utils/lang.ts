// INPUT: 类型 Language 与未知输入（query/body 字段、ai service fallback 上下文）。
// OUTPUT: resolveLang(value, fallback?) -> 'zh' | 'en'，唯一权威 lang 解析点。
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
