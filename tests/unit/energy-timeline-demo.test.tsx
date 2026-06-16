// @vitest-environment jsdom
// INPUT: <EnergyTimelineDemoPage> + mock TimelinePage / useAuth。
// OUTPUT: 公开 demo 页契约测试 — 示例徽章 + 注册 CTA 渲染、CTA 触发 openLoginModal、TimelinePage 收到 demo 模式、DEMO_PROFILE 字段有效。
// POS: SEO 公开 demo 页（/:lang/energy-timeline）渲染契约；EnergyTimelineDemoPage 变更需同步本测试。

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";

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

describe("EnergyTimelineDemoPage", () => {
  it("renders the sample badge + a sign-up CTA and embeds the timeline in demo mode", () => {
    const { getByText, getByTestId } = render(<EnergyTimelineDemoPage />);
    expect(getByText(/Sample chart/i)).toBeTruthy();
    expect(getByTestId("timeline-body")).toBeTruthy();
    expect(captured.demo).toBe(true);
    expect(typeof captured.onUpsell).toBe("function");
  });

  it("opens the login modal when the create-your-own CTA is clicked", () => {
    openLoginModal.mockClear();
    const { getByText } = render(<EnergyTimelineDemoPage />);
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
