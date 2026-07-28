// INPUT: services/themeStorage.ts（THEME_STORAGE_KEY/readStoredTheme/writeStoredTheme）。
// OUTPUT: 主题键迁移（astro_theme -> astro_theme_v2）与严格归一化的契约测试。
// POS: 钉死编辑部改版的主题语义：light 品牌默认、旧键刻意忽略、污染值归一化、storage 禁用不炸。

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  THEME_META_COLORS,
  readStoredTheme,
  writeStoredTheme,
} from "../../services/themeStorage";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  });
});

describe("theme key migration (astro_theme_v2)", () => {
  it("defaults to light when no v2 key exists", () => {
    expect(readStoredTheme()).toBe("light");
  });

  it("honors an explicit v2 dark choice", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("ignores the legacy astro_theme key (auto-persisted dark-era value)", () => {
    localStorage.setItem("astro_theme", "dark");
    expect(readStoredTheme()).toBe("light");
  });

  it("normalizes garbage / polluted values to light", () => {
    for (const v of ["blue", "dark ", "dark injected", "system", "__proto__"]) {
      localStorage.setItem(THEME_STORAGE_KEY, v);
      expect(readStoredTheme(), `value: ${v}`).toBe("light");
    }
  });

  it("writeStoredTheme persists under the v2 key only", () => {
    writeStoredTheme("dark");
    expect(store.get(THEME_STORAGE_KEY)).toBe("dark");
    expect(store.has("astro_theme")).toBe(false);
  });

  it("cleans up the orphaned legacy key on explicit write", () => {
    localStorage.setItem("astro_theme", "dark");
    writeStoredTheme("light");
    expect(store.has("astro_theme")).toBe(false);
    expect(store.get(THEME_STORAGE_KEY)).toBe("light");
  });

  it("never throws when storage access is blocked (Safari strict privacy)", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(readStoredTheme()).toBe("light");
    expect(() => writeStoredTheme("dark")).not.toThrow();
  });

  it("meta theme-color pair mirrors the paper / night-sky brand values", () => {
    expect(THEME_META_COLORS.light).toBe("#F4EFE4");
    expect(THEME_META_COLORS.dark).toBe("#16130F");
  });
});
