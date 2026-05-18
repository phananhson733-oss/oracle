// INPUT: 待测的 backend/src/utils/lang.ts 工具函数。
// OUTPUT: resolveLang 行为单测（默认值、英文识别、非法输入回退）。
// POS: backend utils 单测；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, expect, it } from "vitest";
import { resolveLang } from "../lang.js";

describe("resolveLang", () => {
  it('returns "en" when value is exactly "en"', () => {
    expect(resolveLang("en")).toBe("en");
  });

  it('returns "zh" when value is "zh" (explicit override of default)', () => {
    expect(resolveLang("zh")).toBe("zh");
  });

  it('returns default "en" when value is undefined', () => {
    expect(resolveLang(undefined)).toBe("en");
  });

  it('returns default "en" when value is null', () => {
    expect(resolveLang(null)).toBe("en");
  });

  it('returns default "en" for arbitrary strings', () => {
    expect(resolveLang("fr")).toBe("en");
    expect(resolveLang("")).toBe("en");
    expect(resolveLang("EN")).toBe("en");
  });

  it('returns default "en" for non-string types', () => {
    expect(resolveLang(123)).toBe("en");
    expect(resolveLang({})).toBe("en");
    expect(resolveLang([])).toBe("en");
    expect(resolveLang(true)).toBe("en");
  });

  it("honors explicit fallback override", () => {
    expect(resolveLang(undefined, "zh")).toBe("zh");
    expect(resolveLang(null, "zh")).toBe("zh");
    expect(resolveLang("fr", "zh")).toBe("zh");
    expect(resolveLang("en", "zh")).toBe("en");
    expect(resolveLang("zh", "en")).toBe("zh");
  });
});
