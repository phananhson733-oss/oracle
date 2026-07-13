// @vitest-environment jsdom
// INPUT: 根 index.html 的首字节正文、title、可见 FAQ 与 FAQPage JSON-LD。
// OUTPUT: 守护首页 Title≤60、H1 同含 astrology/birth chart、正文≥1000 英文词、关键内链及 FAQ UI/Schema 同源数量。
// POS: 需求清单首页优化回归；修改根首页 SEO/正文/FAQ 时同步本测试与 tests/unit/FOLDER.md。

import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  landingFaqs,
  landingHeroCopy,
  landingSeoTitles,
} from "../../pages/landing/landingContent";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, "..", "..", "index.html"), "utf-8");
let doc: Document;

beforeAll(() => {
  doc = new DOMParser().parseFromString(html, "text/html");
});

const jsonLdEntries = () =>
  Array.from(doc.querySelectorAll('script[type="application/ld+json"]')).flatMap(
    (script) => {
      const parsed = JSON.parse(script.textContent ?? "null");
      return Array.isArray(parsed) ? parsed : [parsed];
    },
  );

describe("根首页首字节内容发现契约", () => {
  it("Title 完整输出不超过 60 字符", () => {
    const title = doc.title.trim();
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).toBe(`${landingSeoTitles.en} | AstrologyWiki`);
  });

  it("唯一 H1 同时覆盖 astrology 与 birth chart，且不超过 70 字符", () => {
    const headings = doc.querySelectorAll("#root h1");
    expect(headings).toHaveLength(1);
    const h1 = headings[0].textContent?.trim() ?? "";
    expect(h1).toMatch(/astrology/i);
    expect(h1).toMatch(/birth chart/i);
    expect(h1.length).toBeLessThanOrEqual(70);
    expect(h1).toBe(landingHeroCopy.en.title);
  });

  it("首字节主内容达到 1000 英文词并提供工具/教程关键内链", () => {
    const mainText = doc.querySelector("#root main")?.textContent ?? "";
    const words = mainText.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) ?? [];
    expect(words.length).toBeGreaterThanOrEqual(1000);
    expect(doc.querySelector('a[href="/en/birth-chart-calculator"]')).toBeTruthy();
    expect(doc.querySelector('a[href="/en/wiki/how-to-read-birth-chart"]')).toBeTruthy();
  });

  it("可见 FAQ 与 FAQPage Schema 至少 5 条且问题完全一致", () => {
    const visibleQuestions = Array.from(
      doc.querySelectorAll("#homepage-faq details > summary"),
    ).map((node) => node.textContent?.trim());
    const faqSchema = jsonLdEntries().find((entry) => entry?.["@type"] === "FAQPage");
    const schemaQuestions = (faqSchema?.mainEntity ?? []).map(
      (entry: Record<string, unknown>) => entry.name,
    );

    expect(visibleQuestions.length).toBeGreaterThanOrEqual(5);
    expect(schemaQuestions).toEqual(visibleQuestions);
    expect(visibleQuestions).toEqual(
      landingFaqs.en.map((faq) => faq.question),
    );
  });
});
