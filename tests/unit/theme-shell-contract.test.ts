// INPUT: index.html 原文（fs 读取）+ services/themeStorage 常量。
// OUTPUT: SPA 壳的首帧主题契约测试（light 默认 body class、pre-paint 脚本、theme-color 三方一致）。
// POS: 钉死 index.html 与 themeStorage/pre-paint 的镜像关系（三处手工同步，此测试是唯一防漂移闸门）。

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  THEME_STORAGE_KEY,
  THEME_META_COLORS,
} from "../../services/themeStorage";

const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");

describe("index.html theme shell contract (editorial light-first)", () => {
  it("ships a light default body class (crawler / no-JS first paint)", () => {
    expect(html).toMatch(/<body class="light bg-paper-100 text-paper-900/);
  });

  it("carries the pre-paint restore script reading the v2 key before content", () => {
    const bodyStart = html.indexOf("<body");
    const scriptAt = html.indexOf(THEME_STORAGE_KEY, bodyStart);
    const mainAt = html.indexOf("<main", bodyStart);
    expect(scriptAt).toBeGreaterThan(bodyStart);
    expect(scriptAt).toBeLessThan(mainAt);
  });

  it("pre-paint script flips theme-color to the night value for dark users", () => {
    expect(html).toContain(THEME_META_COLORS.dark);
  });

  it("static theme-color meta is the paper brand value", () => {
    expect(html).toContain(
      `<meta name="theme-color" content="${THEME_META_COLORS.light}" />`,
    );
  });

  it("does not request the Newsreader opsz axis (font payload guard)", () => {
    expect(html).not.toContain("opsz");
    expect(html).toContain("family=Newsreader:ital,wght@0,400;0,500;1,400;1,500");
  });
});
