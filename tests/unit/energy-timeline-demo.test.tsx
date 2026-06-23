// @vitest-environment jsdom
// INPUT: <EnergyTimelineDemoPage> + mock TimelinePage / useAuth；getTimelineCopy（SPA H1 源）+ generate-seo-pages.mjs（stub title 源）。
// OUTPUT: 公开 demo 页契约测试（示例徽章 + 注册 CTA + demo 模式 + DEMO_PROFILE）+ A0-3 漂移守卫（SPA H1 ↔ 静态 stub canonical 都锁 "Energy Timeline"，禁 "Life K-Line"，防 soft-404）。
// POS: SEO 公开 demo 页（/:lang/energy-timeline）渲染契约 + canonical 漂移回归；EnergyTimelineDemoPage / copy.ts title / stub 生成器变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const openLoginModal = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ openLoginModal }),
}));

// stub TimelinePage 以隔离重型 fetch/onboarding；记录收到的 props。
let captured: { demo?: boolean; onUpsell?: () => void } = {};
vi.mock("../../pages/TimelinePage", () => ({
  default: (props: { demo?: boolean; onUpsell?: () => void }) => {
    captured = props;
    return <div data-testid="timeline-body" />;
  },
}));

import EnergyTimelineDemoPage, {
  DEMO_PROFILE,
} from "../../pages/EnergyTimelineDemoPage";
import { getTimelineCopy } from "../../components/timeline/copy";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("EnergyTimelineDemoPage", () => {
  it("renders the sample badge + a sign-up CTA and embeds the timeline in demo mode", () => {
    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <EnergyTimelineDemoPage />
      </MemoryRouter>,
    );
    expect(getByText(/Sample chart/i)).toBeTruthy();
    expect(getByTestId("timeline-body")).toBeTruthy();
    expect(captured.demo).toBe(true);
    expect(typeof captured.onUpsell).toBe("function");
  });

  it("opens the login modal when the create-your-own CTA is clicked", () => {
    openLoginModal.mockClear();
    const { getByText } = render(
      <MemoryRouter>
        <EnergyTimelineDemoPage />
      </MemoryRouter>,
    );
    fireEvent.click(getByText(/Create your own timeline/i));
    expect(openLoginModal).toHaveBeenCalledTimes(1);
  });

  it("ships a valid fixed demo birth profile (so the anonymous fetch won't 400)", () => {
    expect(DEMO_PROFILE.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof DEMO_PROFILE.lat).toBe("number");
    expect(typeof DEMO_PROFILE.lon).toBe("number");
    expect(DEMO_PROFILE.timezone).toBeTruthy();
    expect(DEMO_PROFILE.birthCity).toBeTruthy();
  });
});

// A0-3: 防 SPA-vs-stub 漂移（soft-404 类）。SPA 的 H1 = getTimelineCopy(lang).title（TimelinePage.tsx:178），
// 静态 stub 的 <title>/<h1> 来自 generate-seo-pages.mjs 的 timelineTitle。两侧必须都保持 "Energy Timeline"
// canonical（plan §5 冲突1：Life K-Line 仅营销，禁入 URL/H1/meta/canonical）。
describe("Energy Timeline canonical H1 ↔ static stub (no SPA-vs-stub drift, A0-3)", () => {
  const CANONICAL = "Energy Timeline";
  const FORBIDDEN = [/life\s*k-?line/i, /k-?line/i, /k线/];

  it("SPA H1 copy stays the canonical 'Energy Timeline' (en) / '能量时间轴' (zh)", () => {
    expect(getTimelineCopy("en").title).toBe(CANONICAL);
    expect(getTimelineCopy("zh").title).toBe("能量时间轴");
    for (const re of FORBIDDEN) {
      expect(getTimelineCopy("en").title).not.toMatch(re);
    }
  });

  it("static stub generator title shares the SPA canonical prefix (never 'Life K-Line')", () => {
    const genPath = join(process.cwd(), "scripts/generate-seo-pages.mjs");
    const src = readFileSync(genPath, "utf8");
    const m = src.match(/timelineTitle\s*=\s*['"]([^'"]+)['"]/);
    expect(
      m,
      "timelineTitle literal not found in generate-seo-pages.mjs — A0-3 drift guard cannot anchor",
    ).toBeTruthy();
    const stubTitle = m![1];
    expect(stubTitle.startsWith(CANONICAL)).toBe(true);
    for (const re of FORBIDDEN) {
      expect(stubTitle).not.toMatch(re);
    }
  });

  it("generated stub HTML (when built) renders an H1/title under the canonical", () => {
    const stubPath = join(
      process.cwd(),
      "public/en/energy-timeline/index.html",
    );
    if (!existsSync(stubPath)) return; // 构建产物未生成时跳过（源真相已被上一条锁定）
    const html = readFileSync(stubPath, "utf8");
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1] ?? "";
    expect(title.startsWith(CANONICAL)).toBe(true);
    expect(h1.startsWith(CANONICAL)).toBe(true);
    for (const re of FORBIDDEN) {
      expect(title).not.toMatch(re);
      expect(h1).not.toMatch(re);
    }
  });
});
