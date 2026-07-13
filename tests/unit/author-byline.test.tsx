// @vitest-environment jsdom
// INPUT: AuthorByline / AuthorMonogram 组件 + data/authors 注册表；@testing-library/react + MemoryRouter。
// OUTPUT: AuthorByline 两 variant 的渲染单测（card 不链接 / detail 链接+披露+日期）。
// POS: 守护 byline 唯一渲染点的行为契约（链接、就近披露、卡片态无链接）。若改组件，同步此测试。

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  AuthorByline,
  AuthorMonogram,
} from "../../components/wiki/AuthorByline";
import { getAuthorById } from "../../data/authors/index";

const elena = getAuthorById("elena-vane")!;

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("AuthorByline — card variant", () => {
  it("渲染姓名但不渲染链接（列表卡 byline 不可点）", () => {
    renderInRouter(
      <AuthorByline persona={elena} variant="card" lang="en" isDark={false} />,
    );
    expect(screen.getByText("Elena Vane")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("AuthorByline — detail variant", () => {
  it("姓名链到作者页 + 显示职位、日期与就近披露", () => {
    renderInRouter(
      <AuthorByline
        persona={elena}
        variant="detail"
        lang="en"
        isDark={false}
        date="2026-05-20"
        langPath={(p) => `/en${p}`}
        formatDate={(d) => `formatted:${d}`}
      />,
    );
    const link = screen.getByRole("link", { name: "Elena Vane" });
    expect(link.getAttribute("href")).toBe("/en/wiki/author/elena-vane");
    expect(screen.getByText(/Aura & Energy Columnist/)).toBeTruthy();
    expect(screen.getByText("formatted:2026-05-20")).toBeTruthy();
    expect(
      screen.getByText("Editorial persona · AI-assisted"),
    ).toBeTruthy();
  });

  it("ZH 文章作者名渲染为纯文本（不链接），不强制把用户切到英文界面（AW-5）", () => {
    renderInRouter(
      <AuthorByline
        persona={elena}
        variant="detail"
        lang="zh"
        isDark={false}
        langPath={(p) => `/zh${p}`}
      />,
    );
    // 作者页为 EN-only canonical；zh 文章不生成指向 /en 的强制跳转链接，改纯文本。
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Elena Vane")).toBeTruthy();
  });

  it("无 langPath 时姓名不可点（降级为纯文本）", () => {
    renderInRouter(
      <AuthorByline
        persona={elena}
        variant="detail"
        lang="en"
        isDark={false}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Elena Vane")).toBeTruthy();
  });

  it("zh 语境渲染中文披露文案", () => {
    const julian = getAuthorById("julian-thorne")!;
    renderInRouter(
      <AuthorByline
        persona={julian}
        variant="detail"
        lang="zh"
        isDark={false}
      />,
    );
    expect(screen.getByText("编辑人设 · AI 辅助创作")).toBeTruthy();
  });
});

describe("AuthorMonogram", () => {
  it("渲染姓名首字母（取前两词），装饰性 aria-hidden", () => {
    const { container } = renderInRouter(
      <AuthorMonogram persona={elena} size="md" />,
    );
    const root = container.querySelector('[aria-hidden="true"]')!;
    expect(within(root as HTMLElement).getByText("EV")).toBeTruthy();
  });
});
