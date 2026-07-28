// INPUT: scripts/inject-spa-into-stubs.mjs 的导出（injectInto/STUB_FALLBACK_STYLE/STUB_LOADER_HTML/STUB_PREPAINT_SCRIPT）。
// OUTPUT: stub 注入器的承重契约测试（选择器作用域、幂等、守卫状态、纸/夜双主题 loader、pre-paint 注入）。
// POS: 442+ 生产 stub 的唯一注入源此前无任何测试；本文件钉死「裸选择器不得泄漏到 SPA」「dark 用户 stub 不纸闪」两条红线。

import { describe, it, expect } from "vitest";
import {
  injectInto,
  STUB_FALLBACK_STYLE,
  STUB_LOADER_HTML,
  STUB_PREPAINT_SCRIPT,
} from "../../scripts/inject-spa-into-stubs.mjs";

const STUB =
  "<html><head><style>main{max-width:780px}</style></head><body><main><h1>t</h1></main></body></html>";
const PAYLOAD = '<script src="/assets/index-x.js"></script>';

describe("inject-spa-into-stubs contracts", () => {
  it("scopes every fallback rule to stub namespaces or theme-mirroring body rules", () => {
    const rules = STUB_FALLBACK_STYLE.split("\n")
      .map((l: string) => l.trim())
      .filter(
        (l: string) => l && !l.startsWith("<style") && !l.startsWith("</style"),
      );
    for (const r of rules) {
      // body/body.dark 规则是 SPA 主题的等值镜像（防过滚动露白）；其余必须限定在
      // [data-seo-stub*]，否则会在 React 挂载后继续污染 SPA。
      expect(
        /^(\[data-seo-stub|body\.dark\b|body\{|@keyframes seo-stub-spin)/.test(
          r,
        ),
        r,
      ).toBe(true);
    }
  });

  it("is idempotent (already-injected on second run)", () => {
    const first = injectInto(STUB, PAYLOAD);
    expect(first.status).toBe("injected");
    expect(injectInto(first.html, PAYLOAD).status).toBe("already-injected");
  });

  it("fails loudly on malformed stubs (guard clauses)", () => {
    expect(
      injectInto("<html><head></head><body></body></html>", PAYLOAD).status,
    ).toBe("no-main");
    expect(
      injectInto("<html><body><main></main></body></html>", PAYLOAD).status,
    ).toBe("no-head-close");
  });

  it("loader ground matches the light-default paper color with a night variant", () => {
    expect(STUB_FALLBACK_STYLE).toMatch(
      /\[data-seo-stub-loader\]\{[^}]*background:#F4EFE4/,
    );
    expect(STUB_FALLBACK_STYLE).toMatch(
      /body\.dark \[data-seo-stub-loader\]\{background:#16130F\}/,
    );
    expect(STUB_LOADER_HTML).toContain('aria-hidden="true"');
  });

  it("injects the pre-paint theme restore as the first child of <body>", () => {
    const { html } = injectInto(STUB, PAYLOAD);
    // 锚定真 body 标签（</head> 之后），而非任意 "<body" 字样
    expect(html).toMatch(/<\/head>\s*<body[^>]*><script>/);
    expect(STUB_PREPAINT_SCRIPT).toContain("astro_theme_v2");
    expect(STUB_PREPAINT_SCRIPT).toContain("#16130F");
    // 脚本必须先于 stub 内容执行（body 开标签之后、<main> 之前）
    expect(html.indexOf("astro_theme_v2")).toBeLessThan(html.indexOf("<main"));
  });

  it("does not splice the script into head content containing a literal '<body>'", () => {
    // 回归钉：SPA 字体脚本的注释含字面 "<body>"，曾把 pre-paint 插进注释中间撕裂脚本
    const payloadWithComment =
      "<script>/* resolves BEFORE <body> is parsed */ if ('fonts' in document) {}</script>";
    const { html } = injectInto(STUB, payloadWithComment);
    expect(html).toMatch(/<\/head>\s*<body[^>]*><script>\(function\(\)/);
    // 注释内的 "<body>" 保持原样，未被注入撕裂
    expect(html).toContain("/* resolves BEFORE <body> is parsed */ if ('fonts' in document) {}");
  });
});
