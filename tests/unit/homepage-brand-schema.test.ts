// @vitest-environment jsdom
// INPUT: 真实 index.html 文本 + jsdom DOMParser。
// OUTPUT: 守护首页首字节 brand JSON-LD 契约（合法 JSON + Organization/WebSite 字段 + dedup gate 必命中 + og:url=canonical）。
// POS: 防 index.html 静态 brand schema 语法错误/字段退化致 App.tsx GlobalSchema 与 SEO.tsx 的去重静默失效而产生重复。
//      若改 index.html 的 brand 块或 App.tsx GlobalSchema 的 Organization/WebSite 输出，须同步此测试。

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML_PATH = resolve(here, "..", "..", "index.html");
const SITE = "https://www.astrologywiki.com";

let doc: Document;
let brandEntries: Array<Record<string, any>>;

beforeAll(() => {
  const html = readFileSync(INDEX_HTML_PATH, "utf-8");
  doc = new DOMParser().parseFromString(html, "text/html");

  // 收集所有 data-astro-global-schema 脚本里的顶层条目。每个脚本 textContent
  // 必须是合法 JSON —— 任何语法错误都会让 GlobalSchema(App.tsx) 与 SEO.tsx 的
  // try/catch 静默吞掉、dedup gate 落空，从而在 WRS 渲染后产生重复 brand schema。
  brandEntries = [];
  doc
    .querySelectorAll('script[type="application/ld+json"][data-astro-global-schema="true"]')
    .forEach((s) => {
      const parsed = JSON.parse(s.textContent ?? ""); // 故意不 try/catch：非法 JSON 直接让测试失败
      (Array.isArray(parsed) ? parsed : [parsed]).forEach((e) => brandEntries.push(e));
    });
});

const findType = (t: string) => brandEntries.find((e) => e && e["@type"] === t);

describe("index.html 首字节 brand JSON-LD 契约", () => {
  it("至少存在一个 data-astro-global-schema 脚本且 JSON 全部合法（防去重 footgun）", () => {
    expect(brandEntries.length).toBeGreaterThan(0);
  });

  it("dedup gate 必命中：顶层 @type 集合同时含 Organization 与 WebSite", () => {
    // 这正是 App.tsx GlobalSchema:129 的 existingTypes.has('Organization') &&
    // existingTypes.has('WebSite') 跳过条件 —— 命中才能保证运行时不再注入第二份。
    const types = new Set(brandEntries.map((e) => e && e["@type"]));
    expect(types.has("Organization")).toBe(true);
    expect(types.has("WebSite")).toBe(true);
  });

  it("Organization 字段与 GlobalSchema EN 输出一致（logo=/logo.png + sameAs 三连）", () => {
    const org = findType("Organization");
    expect(org).toBeTruthy();
    expect(org!.name).toBe("AstrologyWiki");
    expect(org!.url).toBe(`${SITE}/`);
    // logo 站内统一为 /logo.png（与 App.tsx GlobalSchema 及 landing-v2 stub 一致），
    // 不得退回 brief 原始的 /icon-192.png，否则同一实体声明两个 logo URL 造成消歧噪音。
    expect(org!.logo).toBe(`${SITE}/logo.png`);
    expect(Array.isArray(org!.sameAs)).toBe(true);
    expect(org!.sameAs).toHaveLength(3);
  });

  it("WebSite 字段与 GlobalSchema EN 输出一致（inLanguage:en + SearchAction EntryPoint）", () => {
    const site = findType("WebSite");
    expect(site).toBeTruthy();
    expect(site!.name).toBe("AstrologyWiki");
    expect(site!.url).toBe(`${SITE}/`);
    // 根 "/" 是规范英文主页，inLanguage 固定 en；勿在此本地化。
    expect(site!.inLanguage).toBe("en");
    const action = site!.potentialAction;
    expect(action?.["@type"]).toBe("SearchAction");
    // EntryPoint 对象形式是 Google 当前文档/推荐形态（非裸字符串 target）。
    expect(action?.target?.["@type"]).toBe("EntryPoint");
    expect(typeof action?.target?.urlTemplate).toBe("string");
    expect(action?.target?.urlTemplate).toContain("{search_term_string}");
  });

  it("og:url 带尾斜杠且与 canonical 完全一致", () => {
    const ogUrl = doc
      .querySelector('meta[property="og:url"]')
      ?.getAttribute("content");
    const canonical = doc
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");
    expect(ogUrl).toBe(`${SITE}/`);
    expect(ogUrl).toBe(canonical);
  });
});
