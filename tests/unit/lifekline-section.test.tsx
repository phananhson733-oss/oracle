// @vitest-environment jsdom
// INPUT: <LifeKlineSection>（编排容器）+ helpers/lifekline 共享工厂（PointerEvent polyfill/蜡烛/marker）+ mock analytics/AuthContext；LanguageContext 走默认 'en' 无需 Provider。
// OUTPUT: life 模式整块编排契约——EN 头部/100 蜡烛、空数据空态、缺年最近回退、真 pin（hover 锁定/Escape 解锁/重 pin）、键盘 ←/→ 浏览 vs Enter 锁定、hover tooltip rAF 管线（broadChip）、触屏 tap 判定、6 模块卡切换、定性徽章、fake-door paywall/modal（included 展开/toggle、焦点陷阱、body 滚动锁、Escape/backdrop 守卫、demo upsell）、view 埋点恰一次、卸载计时器清理。
// POS: lifekline 编排层（LifeKlineSection.tsx）回归基线；文案断言与 lifeKlineCopy.ts EN 字典逐字对齐，结构/类名变更需同步本测试与 tests/unit/FOLDER.md。

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("../../services/analytics", () => ({
  trackEvent: vi.fn(),
  setUserProperties: vi.fn(),
  setUserId: vi.fn(),
  trackPageView: vi.fn(),
  trackError: vi.fn(),
}));
// UIComponents 顶层 import AuthContext（拉起 supabase/entitlement 链）；useLanguage 只需默认 context，故仅掐断 auth。
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({}),
}));

import { trackEvent } from "../../services/analytics";
import { LifeKlineSection } from "../../components/timeline/lifekline/LifeKlineSection";
import type { TimelineCandle } from "../../types";
import {
  installPointerEventPolyfill,
  makeAspect,
  makeLifeCandles,
  makeLifeMarkers,
} from "./helpers/lifekline";

const trackEventMock = vi.mocked(trackEvent);

installPointerEventPolyfill();

// currentAge=36（默认选中年）给 Venus 相位 → love/money In focus；age 50 给 Saturn 供 pin 后仍有证据层。
const DEFAULT_TOP_ASPECTS = {
  36: [makeAspect("Venus")],
  50: [makeAspect("Saturn")],
};

interface RenderOverrides {
  candles?: TimelineCandle[];
  currentAge?: number;
  demo?: boolean;
  onUpsell?: () => void;
}

const renderSection = (over: RenderOverrides = {}) =>
  render(
    <LifeKlineSection
      candles={over.candles ?? makeLifeCandles(DEFAULT_TOP_ASPECTS)}
      markers={makeLifeMarkers()}
      birthYear={1990}
      currentAge={over.currentAge ?? 36}
      demo={over.demo ?? false}
      onUpsell={over.onUpsell}
    />,
  );

const hitRect = (container: HTMLElement, age: number): Element => {
  const rect = container.querySelector(`.lk-hit[data-age="${age}"]`);
  expect(rect).toBeTruthy();
  return rect as Element;
};

// 左侧节点面板 meta 行（Age {age} · {year} · {phase}[ · You are here]）。
const nodeMeta = (container: HTMLElement): string =>
  container.querySelector(".lk-panel.lk-soft .lk-muted")?.textContent ?? "";

// hover/浏览选中经 rAF 合流提交：跑一帧让 pending hover/select 落地。
const nextFrame = () =>
  act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });

// pointerdown+pointerup 同点（位移 0 < 8px 阈值）→ tap 判定 → onSelect(lock:true)。
const pinCandle = (container: HTMLElement, age: number): void => {
  const rect = hitRect(container, age);
  const init = { clientX: 100, clientY: 100, pointerType: "mouse" };
  fireEvent.pointerDown(rect, init);
  fireEvent.pointerUp(rect, init);
};

const openPaywallModal = (): HTMLElement => {
  // 打开前 "Register interest" 唯一（paywall 面板 unlockCta）；modal primaryCta 同文案但尚未挂载。
  fireEvent.click(screen.getByText("Register interest"));
  return screen.getByRole("dialog");
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LifeKlineSection", () => {
  it("renders EN header title/subhead and exactly 100 candle bodies", () => {
    const { container } = renderSection();
    expect(container.querySelector("h2.lk-title")?.textContent).toBe(
      "Life Energy Chart · Ages 0–99",
    );
    expect(container.querySelector(".lk-subhead")?.textContent).toBe(
      "RELATIVE TO YOUR OWN BASELINE",
    );
    expect(container.querySelectorAll(".lk-candle-body").length).toBe(100);
  });

  it("renders the EN empty note (not a blank block) when candles is empty", () => {
    const { container } = renderSection({ candles: [] });
    expect(container.querySelector(".lk-footer")?.textContent).toBe(
      "No usable timeline data yet — please try reloading.",
    );
    expect(container.querySelector(".lk-kline-card")).toBeNull();
    expect(container.querySelector(".lk-candle-body")).toBeNull();
  });

  it("node panel defaults to the current age (metaFmt 'Age 36 · 2026') with the You-are-here mark", () => {
    const { container } = renderSection();
    const meta = nodeMeta(container);
    expect(meta).toContain("Age 36 · 2026");
    expect(meta).toContain("You are here");
  });

  it("falls back to the nearest available age when the selected year is missing", () => {
    // ages 0-30 与 40-99（缺 31-39），currentAge=35 → 等距 30/40 由 reduce 严格小于保留先到者 → 30。
    const gapped = makeLifeCandles().filter(
      (c) => (c.age as number) <= 30 || (c.age as number) >= 40,
    );
    const { container } = renderSection({ candles: gapped, currentAge: 35 });
    expect(container.querySelectorAll(".lk-candle-body").length).toBe(91);
    expect(nodeMeta(container)).toContain("Age 30 · 2020");
  });

  it("pinning a candle updates the node panel, shows a toast and tracks the age bucket", () => {
    const { container } = renderSection();
    pinCandle(container, 50);
    expect(nodeMeta(container)).toContain("Age 50 · 2040");
    expect(screen.getByText("Pinned age 50")).toBeTruthy();
    expect(trackEventMock).toHaveBeenCalledWith("lifekline_candle_pin", {
      age_bucket: "50s",
    });
  });

  it("true pin: hover browse cannot move the pinned panel; Escape restores browsing; a new tap re-pins", async () => {
    const { container } = renderSection();
    pinCandle(container, 50);
    expect(nodeMeta(container)).toContain("Age 50 · 2040");

    // pinned 期间 mouse enter/move 只驱动 tooltip（hover 链独立），面板锁定在 50。
    const rect60 = hitRect(container, 60);
    const hoverInit = { clientX: 200, clientY: 150, pointerType: "mouse" };
    fireEvent.pointerEnter(rect60, hoverInit);
    fireEvent.pointerMove(rect60, hoverInit);
    await nextFrame();
    expect(nodeMeta(container)).toContain("Age 50 · 2040");
    expect(document.querySelector(".lk-tooltip")?.textContent).toContain(
      "2050",
    );

    // Escape 解锁 → 浏览型选中恢复驱动面板。
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerEnter(rect60, hoverInit);
    await nextFrame();
    expect(nodeMeta(container)).toContain("Age 60 · 2050");

    // pin 后点其它蜡烛 → 重 pin。
    pinCandle(container, 50);
    pinCandle(container, 70);
    expect(nodeMeta(container)).toContain("Age 70 · 2060");
    expect(screen.getByText("Pinned age 70")).toBeTruthy();
  });

  it("ArrowRight browses to the neighbour rect (focus moves, no pin toast/event); Enter pins", () => {
    const { container } = renderSection();
    const rect40 = hitRect(container, 40) as SVGRectElement;
    rect40.focus();
    fireEvent.keyDown(rect40, { key: "ArrowRight" });
    expect(document.activeElement).toBe(hitRect(container, 41));
    expect(screen.queryByText(/Pinned age/)).toBeNull();
    expect(trackEventMock).not.toHaveBeenCalledWith(
      "lifekline_candle_pin",
      expect.anything(),
    );

    fireEvent.keyDown(hitRect(container, 41), { key: "Enter" });
    expect(screen.getByText("Pinned age 41")).toBeTruthy();
    expect(trackEventMock).toHaveBeenCalledWith("lifekline_candle_pin", {
      age_bucket: "40s",
    });
  });

  it("right/middle mouse button never pins (no toast, no pin event)", () => {
    const { container } = renderSection();
    const rect40 = hitRect(container, 40);
    const init = {
      clientX: 100,
      clientY: 100,
      pointerType: "mouse",
      button: 2,
    };
    fireEvent.pointerDown(rect40, init);
    fireEvent.pointerUp(rect40, init);
    expect(screen.queryByText(/Pinned age/)).toBeNull();
    expect(trackEventMock).not.toHaveBeenCalledWith(
      "lifekline_candle_pin",
      expect.anything(),
    );
  });

  it("while pinned, ArrowRight silently moves the pin itself (panel follows, no extra toast/event)", () => {
    const { container } = renderSection();
    pinCandle(container, 40);
    expect(nodeMeta(container)).toContain("Age 40");
    fireEvent.keyDown(hitRect(container, 40), { key: "ArrowRight" });
    expect(nodeMeta(container)).toContain("Age 41");
    expect(screen.queryByText("Pinned age 41")).toBeNull();
    const pinCalls = trackEventMock.mock.calls.filter(
      ([name]) => name === "lifekline_candle_pin",
    );
    expect(pinCalls.length).toBe(1);
  });

  it("a flat candle (delta 0, first doji) shows the flat pattern copy, not rising", () => {
    const { container } = renderSection();
    pinCandle(container, 0);
    expect(screen.getByText(/A flat candle suggests/)).toBeTruthy();
    expect(screen.queryByText(/An up candle suggests/)).toBeNull();
  });

  it("mouse move shows the rich tooltip after a frame (year + broad chip); leave hides it", async () => {
    const { container } = renderSection();
    const rect40 = hitRect(container, 40);
    fireEvent.pointerMove(rect40, {
      clientX: 300,
      clientY: 200,
      pointerType: "mouse",
    });
    await nextFrame();
    const tooltip = document.querySelector(".lk-tooltip");
    expect(tooltip).toBeTruthy();
    expect(tooltip?.querySelector(".lk-tip-year")?.textContent).toContain(
      "2030",
    );
    // age 40 无 topAspects → 模块 chips 回落单枚宽泛年份。
    expect(tooltip?.textContent).toContain("Broad year");

    fireEvent.pointerLeave(rect40);
    await nextFrame();
    expect(document.querySelector(".lk-tooltip")).toBeNull();
  });

  it("touch tap selects without a tooltip; a 10px drag between down/up does not select", async () => {
    const { container } = renderSection();
    const rect25 = hitRect(container, 25);
    const touchInit = { clientX: 100, clientY: 100, pointerType: "touch" };
    fireEvent.pointerDown(rect25, touchInit);
    fireEvent.pointerUp(rect25, touchInit);
    expect(nodeMeta(container)).toContain("Age 25 · 2015");
    expect(screen.getByText("Pinned age 25")).toBeTruthy();
    await nextFrame();
    expect(document.querySelector(".lk-tooltip")).toBeNull();

    // 位移 10px ≥ 8px 阈值 → 不判 tap、选中不变。
    const rect60 = hitRect(container, 60);
    fireEvent.pointerDown(rect60, touchInit);
    fireEvent.pointerUp(rect60, {
      clientX: 110,
      clientY: 100,
      pointerType: "touch",
    });
    expect(nodeMeta(container)).toContain("Age 25 · 2015");
    expect(screen.queryByText("Pinned age 60")).toBeNull();
  });

  it("renders 6 module cards; clicking the 2nd toggles lk-active and swaps the detail title", () => {
    const { container } = renderSection();
    const cards = container.querySelectorAll(".lk-module-card");
    expect(cards.length).toBe(6);
    expect(cards[0].className).toContain("lk-active"); // love 默认激活
    fireEvent.click(cards[1]);
    const after = container.querySelectorAll(".lk-module-card");
    expect(after[1].className).toContain("lk-active");
    expect(after[0].className).not.toContain("lk-active");
    expect(container.querySelector(".lk-module-detail h2")?.textContent).toBe(
      "Self & Emotions · Age 36 preview",
    );
  });

  it("module badges are qualitative — no digits in any .lk-module-score", () => {
    const { container } = renderSection();
    const scores = container.querySelectorAll(".lk-module-score");
    expect(scores.length).toBe(6);
    for (const score of Array.from(scores)) {
      expect(score.textContent ?? "").not.toMatch(/\d/);
    }
  });

  it("Venus aspect on the selected year marks love+money 'In focus', the rest 'Background'", () => {
    const { container } = renderSection();
    // 卡片固定顺序 love, self, work, money, home, energy；Venus 命中 love 与 money 亲和表。
    const badges = Array.from(
      container.querySelectorAll(".lk-module-score"),
    ).map((el) => el.textContent);
    expect(badges).toEqual([
      "In focus",
      "Background",
      "Background",
      "In focus",
      "Background",
      "Background",
    ]);
  });

  it("paywall unlock CTA opens the fake-door modal with coming-soon copy + tracks unlock/modal_open", () => {
    renderSection();
    const dialog = openPaywallModal();
    expect(dialog.textContent).toContain(
      "The full report isn't available yet — it's coming soon.",
    );
    expect(trackEventMock).toHaveBeenCalledWith("lifekline_unlock_click", {
      source: "paywall",
    });
    expect(trackEventMock).toHaveBeenCalledWith("lifekline_modal_open", {
      source: "paywall",
    });
  });

  it("'See what's planned' opens the modal with the included list expanded and never fires unlock_click", () => {
    renderSection();
    fireEvent.click(screen.getByText("See what's planned"));
    const dialog = screen.getByRole("dialog");
    const included = dialog.querySelector(".lk-included");
    expect(included).toBeTruthy();
    for (const title of [
      "Full-chart HD export",
      "Year-by-year readings, ages 0–99",
      "Detailed module reports",
      "Why this reading",
    ]) {
      expect(included?.textContent).toContain(title);
    }
    expect(trackEventMock).not.toHaveBeenCalledWith(
      "lifekline_unlock_click",
      expect.anything(),
    );
    expect(trackEventMock).toHaveBeenCalledWith("lifekline_modal_open", {
      source: "paywall",
    });
  });

  it("the modal's included toggle fires lifekline_included_toggle and collapses the list", () => {
    renderSection();
    fireEvent.click(screen.getByText("See what's planned"));
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".lk-included")).toBeTruthy();
    fireEvent.click(within(dialog).getByText("See what's planned"));
    expect(trackEventMock).toHaveBeenCalledWith(
      "lifekline_included_toggle",
      {},
    );
    expect(dialog.querySelector(".lk-included")).toBeNull();
  });

  it("modal primary CTA tracks register_interest, closes the modal and shows the thanks toast", () => {
    renderSection();
    const dialog = openPaywallModal();
    fireEvent.click(within(dialog).getByText("Register interest"));
    expect(trackEventMock).toHaveBeenCalledWith("lifekline_register_interest", {
      source: "paywall",
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Thanks — your interest is noted.")).toBeTruthy();
  });

  it("demo modal offers 'Create your own chart' which closes the modal and fires onUpsell", () => {
    const onUpsell = vi.fn();
    renderSection({ demo: true, onUpsell });
    const dialog = openPaywallModal();
    fireEvent.click(within(dialog).getByText("Create your own chart"));
    expect(onUpsell).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape closes; backdrop click closes only when pointerdown also started on the backdrop", () => {
    renderSection();
    openPaywallModal();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    const dialog = openPaywallModal();
    const backdrop = document.querySelector(".lk-modal-backdrop");
    expect(backdrop).toBeTruthy();
    // 反向：pointerdown 起于 modal 内（选择文本拖到 backdrop 释放）→ 仅 click 不关闭（误关守卫）。
    fireEvent.pointerDown(dialog);
    fireEvent.click(backdrop as Element);
    expect(screen.queryByRole("dialog")).toBeTruthy();
    // 正向：pointerdown 与 click 都落在 backdrop → 关闭。
    fireEvent.pointerDown(backdrop as Element);
    fireEvent.click(backdrop as Element);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("focus trap: primary focused on open, Tab wraps last→first, Shift+Tab wraps back, close restores the trigger", () => {
    renderSection();
    const trigger = screen.getByText("Register interest"); // paywall unlockCta
    (trigger as HTMLElement).focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    const primary = within(dialog).getByText("Register interest");
    expect(document.activeElement).toBe(primary);

    // primary 是 modal 焦点序最后一个（toggle → Close → primary）：Tab 由 document 级
    // keydown listener preventDefault 并回卷到第一个。
    const notPrevented = fireEvent.keyDown(document, { key: "Tab" });
    expect(notPrevented).toBe(false); // preventDefault 已调用
    expect(document.activeElement).toBe(
      within(dialog).getByText("See what's planned"),
    );

    // Shift+Tab 从第一个回卷到最后一个。
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(primary);

    fireEvent.click(within(dialog).getByText("Close"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("locks body scroll while the modal is open and restores it on close", () => {
    renderSection();
    expect(document.body.style.overflow).toBe("");
    openPaywallModal();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("fires lifekline_view exactly once ({demo:'false'}); the demo variant reports {demo:'true'}", () => {
    const first = renderSection();
    expect(
      trackEventMock.mock.calls.filter(([name]) => name === "lifekline_view"),
    ).toEqual([["lifekline_view", { demo: "false" }]]);
    first.unmount();
    vi.clearAllMocks();
    renderSection({ demo: true });
    expect(
      trackEventMock.mock.calls.filter(([name]) => name === "lifekline_view"),
    ).toEqual([["lifekline_view", { demo: "true" }]]);
  });

  it("unmount cleans up the toast timer (advancing timers after unmount is safe)", () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { container, unmount } = renderSection();
      pinCandle(container, 40); // 武装 1800ms toast 计时器
      unmount();
      expect(() => vi.advanceTimersByTime(4000)).not.toThrow();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
