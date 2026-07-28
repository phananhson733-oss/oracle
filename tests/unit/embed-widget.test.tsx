// @vitest-environment jsdom
// INPUT: <EmbedCodeBox> / <EmbedWidgetShell> / EmbedContext from components/calculators/embed。
// OUTPUT: embed widget 契约测试 — code box 生成正确 /embed/<slug> iframe 片段 + 复制按钮、embed 上下文内自隐藏；
//         shell 渲染 children + dofollow 品牌回链到 canonical 计算器页、并提供 embed 上下文（嵌套 code box 隐藏）。
// POS: 计算器 embed widget（#14）渲染契约；embed.tsx 变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("../../components/UIComponents", () => ({
  useLanguage: () => ({ t: {}, language: "en" }),
  useTheme: () => ({ theme: "light" }),
}));

import {
  EmbedCodeBox,
  EmbedWidgetShell,
  EmbedContext,
  SITE_URL,
} from "../../components/calculators/embed";

describe("EmbedCodeBox", () => {
  it("renders an iframe snippet pointing at /embed/<slug> with a copy control", () => {
    const { container, getByRole } = render(
      <EmbedCodeBox slug="moon-sign-calculator" />,
    );
    const text = container.textContent || "";
    expect(text).toContain(`${SITE_URL}/embed/moon-sign-calculator`);
    expect(text).toContain("<iframe");
    // a copy button exists
    expect(getByRole("button")).toBeTruthy();
  });

  it("self-hides when rendered inside an embed context (no nested code box on embed pages)", () => {
    const { container } = render(
      <EmbedContext.Provider value={true}>
        <EmbedCodeBox slug="moon-sign-calculator" />
      </EmbedContext.Provider>,
    );
    expect(container.textContent).toBe("");
    expect(container.querySelector("iframe")).toBeNull();
  });
});

describe("EmbedWidgetShell", () => {
  it("renders children plus a dofollow branded backlink to the canonical calculator page", () => {
    const { getByText, getByRole } = render(
      <EmbedWidgetShell slug="synastry-calculator">
        <div>calculator-body</div>
      </EmbedWidgetShell>,
    );
    expect(getByText("calculator-body")).toBeTruthy();
    const link = getByRole("link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(
      `${SITE_URL}/en/synastry-calculator`,
    );
    // dofollow: rel must not contain nofollow
    expect(link.getAttribute("rel") || "").not.toContain("nofollow");
  });

  it("provides embed context so a nested EmbedCodeBox hides itself", () => {
    const { container } = render(
      <EmbedWidgetShell slug="composite-calculator">
        <EmbedCodeBox slug="composite-calculator" />
      </EmbedWidgetShell>,
    );
    // shell backlink present, but no embed-code iframe snippet rendered
    expect(container.querySelector("textarea")).toBeNull();
    expect(container.textContent || "").not.toContain("<iframe");
  });
});
