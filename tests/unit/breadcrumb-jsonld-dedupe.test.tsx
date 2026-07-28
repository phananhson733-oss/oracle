// @vitest-environment jsdom
// INPUT: <Breadcrumb> 组件 + jsdom document；@testing-library/react + MemoryRouter。
// OUTPUT: 守护 BreadcrumbList JSON-LD 自去重契约：已存在 BreadcrumbList（stub/SEO）时不再注入第二份。
// POS: 防止 GSC "字段 BreadcrumbList 重复"回归（Breadcrumb 组件 + stub/SEO 双发）。改 Breadcrumb.tsx 时同步。

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Breadcrumb } from "../../components/Breadcrumb";

const LD = 'script[type="application/ld+json"]';

const countBreadcrumb = () =>
  Array.from(document.querySelectorAll(LD)).filter((s) => {
    try {
      const json = JSON.parse(s.textContent ?? "");
      return (Array.isArray(json) ? json : [json]).some(
        (e) => e && e["@type"] === "BreadcrumbList",
      );
    } catch {
      return false;
    }
  }).length;

const items = [
  { name: "Articles", path: "/wiki" },
  { name: "Rahu Mahadasha" },
];

const renderCrumb = () =>
  render(
    <MemoryRouter>
      <Breadcrumb items={items} homePath="/wiki" />
    </MemoryRouter>,
  );

beforeEach(() => {
  document.head.querySelectorAll(LD).forEach((s) => s.remove());
});
afterEach(() => {
  cleanup();
  document.head.querySelectorAll(LD).forEach((s) => s.remove());
});

describe("Breadcrumb — BreadcrumbList JSON-LD 自去重", () => {
  it("无既有 BreadcrumbList 时注入唯一一份（如 AuthorPage）", () => {
    renderCrumb();
    expect(countBreadcrumb()).toBe(1);
  });

  it("已存在 BreadcrumbList（stub/SEO 提供）时跳过注入，仍仅 1 份", () => {
    const stub = document.createElement("script");
    stub.type = "application/ld+json";
    stub.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    });
    document.head.appendChild(stub);

    renderCrumb();
    expect(countBreadcrumb()).toBe(1);
  });

  it("unmount 后移除自己注入的脚本", () => {
    const { unmount } = renderCrumb();
    expect(countBreadcrumb()).toBe(1);
    unmount();
    expect(document.querySelectorAll("[data-astro-breadcrumb]").length).toBe(0);
  });
});
