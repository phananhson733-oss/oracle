// @vitest-environment jsdom
// INPUT: <ToolsHubPage> (SPA render) + 默认 LanguageContext (en) / ThemeContext；@testing-library/react + MemoryRouter。
// OUTPUT: 守护 tools hub 顶部 featured「引导式解读」(Synthetica) 入口的契约：link 指向 /en/wiki?tab=tools、
//         显示 Synthetica 文案、并明确告知每日配额限制（用户强调的次数限制）。
// POS: Synthetica 是带配额的转化型 AI 解读，不是免费可爬取计算器，故以 featured 入口呈现而非进 toolsCatalog。
//      若改 featured 区文案/链接，同步此测试。

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ToolsHubPage from "../../components/tools/ToolsHubPage";

const renderHub = () =>
  render(
    <MemoryRouter>
      <ToolsHubPage />
    </MemoryRouter>,
  );

describe("tools hub — Synthetica featured entry", () => {
  it("renders a Synthetica entry linking to the wiki tools tab", () => {
    renderHub();
    const link = screen.getByRole("link", { name: /Synthetica/i });
    expect(link.getAttribute("href")).toBe("/en/wiki?tab=tools");
  });

  it("surfaces the daily usage limit so it does not read as an unlimited free tool", () => {
    renderHub();
    const link = screen.getByRole("link", { name: /Synthetica/i });
    const text = (link.textContent || "").toLowerCase();
    // 配额提示：含具体免费次数 + "a day"，让用户知道这是有每日上限的功能
    expect(text).toMatch(/free/);
    expect(text).toMatch(/day/);
    expect(text).toMatch(/3/);
  });

  it("keeps the featured copy free of deterministic fate language (AI safety red line)", () => {
    renderHub();
    const link = screen.getByRole("link", { name: /Synthetica/i });
    const text = link.textContent || "";
    expect(/\b(will|destined|guaranteed|must|always|never)\b/i.test(text)).toBe(
      false,
    );
  });
});
