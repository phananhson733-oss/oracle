// @vitest-environment jsdom
// INPUT: <SEO> 组件 + jsdom document.head；@testing-library/react。
// OUTPUT: 守护"页面级 JSON-LD 去重"契约：runtime <SEO> 注入的 schema 不得与预渲染 stub 已 bake 的同 @type 重复。
// POS: 防止 GSC "字段 FAQPage/Article 重复"回归（stub + SPA 双发）。若改 SEO.tsx setJsonLd，同步此测试。

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SEO } from "../../components/SEO";

const LD_SELECTOR = 'script[type="application/ld+json"]';

// 收集 document.head 内所有 ld+json 脚本里的顶层 @type 列表。
const headLdTypes = (): string[] => {
  const types: string[] = [];
  document.head.querySelectorAll(LD_SELECTOR).forEach((s) => {
    try {
      const json = JSON.parse(s.textContent ?? "");
      (Array.isArray(json) ? json : [json]).forEach((entry) => {
        if (entry && typeof entry["@type"] === "string")
          types.push(entry["@type"]);
      });
    } catch {
      /* ignore */
    }
  });
  return types;
};
const countType = (t: string) => headLdTypes().filter((x) => x === t).length;

// 模拟预渲染 stub bake 进 <head> 的 un-owned ld+json 脚本。
const seedStubScript = (schema: unknown) => {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
  return script;
};

const article = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Rahu Mahadasha",
};
const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the Rahu period always bad?",
      acceptedAnswer: { "@type": "Answer", text: "No." },
    },
  ],
};
const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [],
};
const software = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Saturn Return Calculator",
};
const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AstrologyWiki",
};
const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AstrologyWiki",
};

beforeEach(() => {
  document.head.querySelectorAll(LD_SELECTOR).forEach((s) => s.remove());
});
afterEach(() => {
  cleanup();
  document.head.querySelectorAll(LD_SELECTOR).forEach((s) => s.remove());
});

describe("SEO — 页面级 JSON-LD 去重（stub + SPA 双发根因）", () => {
  it("stub 已 bake [Article, FAQPage] 时，runtime 注入同 schema 不产生重复 FAQPage/Article", () => {
    seedStubScript([article, faq]);
    render(<SEO title="Rahu" schema={[article, breadcrumb, faq]} />);
    expect(countType("FAQPage")).toBe(1);
    expect(countType("Article")).toBe(1);
    expect(countType("BreadcrumbList")).toBe(1);
  });

  it("landing-v2 形态：stub 同一脚本混了 [WebSite, Organization, SoftwareApplication, FAQPage]，去重只剥离 runtime 自己发的页面级类型，保留 Org/WebSite", () => {
    seedStubScript([website, organization, software, faq]);
    render(<SEO title="Landing" schema={[software, faq]} />);
    expect(countType("FAQPage")).toBe(1);
    expect(countType("SoftwareApplication")).toBe(1);
    // Org/WebSite 由 GlobalSchema 管控，去重不得误删
    expect(countType("Organization")).toBe(1);
    expect(countType("WebSite")).toBe(1);
  });

  it("无 stub 脚本时，runtime 正常创建唯一脚本", () => {
    render(<SEO title="Help" schema={[faq]} />);
    expect(countType("FAQPage")).toBe(1);
  });

  it("不碰带 data-astro-global-schema 标记的全局脚本（Org/WebSite）", () => {
    const global = document.createElement("script");
    global.type = "application/ld+json";
    global.setAttribute("data-astro-global-schema", "true");
    global.textContent = JSON.stringify([organization, website]);
    document.head.appendChild(global);
    render(<SEO title="X" schema={[faq]} />);
    expect(countType("Organization")).toBe(1);
    expect(countType("WebSite")).toBe(1);
    expect(countType("FAQPage")).toBe(1);
    expect(global.getAttribute("data-astro-global-schema")).toBe("true");
  });

  it("剥离单独注入的 runtime BreadcrumbList（如 hub 页 Breadcrumb 组件先注入、无 stub），爬虫仅见 1 份", () => {
    // 模拟 Breadcrumb 组件在 SEO 之前注入的独立 BreadcrumbList（un-owned，无 stub 场景）
    seedStubScript(breadcrumb);
    render(
      <SEO
        title="Hub"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: [],
          },
          breadcrumb,
        ]}
      />,
    );
    expect(countType("BreadcrumbList")).toBe(1);
    expect(countType("ItemList")).toBe(1);
  });

  it("unmount 后还原 stub 脚本原始内容，不残留 SPA 注入", () => {
    const stub = seedStubScript([article, faq]);
    const original = stub.textContent;
    const { unmount } = render(<SEO title="Rahu" schema={[article, faq]} />);
    unmount();
    // 还原后：FAQPage/Article 各回到 stub 的 1 份，且无 owner 脚本残留
    expect(countType("FAQPage")).toBe(1);
    expect(countType("Article")).toBe(1);
    expect(stub.textContent).toBe(original);
    expect(
      document.head.querySelectorAll("[data-astro-seo-owner]").length,
    ).toBe(0);
  });
});
