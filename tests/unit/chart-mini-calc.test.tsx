// @vitest-environment jsdom
// INPUT: <ChartMiniCalc> + mocked services/analytics trackChartFunnel.
// OUTPUT: jsdom specs — renders, resolves the right sign client-side, fires the
//         funnel steps, and (critically) never leaks the birth date to analytics.
// POS: Behavioral contract for the tool-led mini-calc shell. If the component
//      changes, sync this test.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../services/analytics", () => ({
  trackChartFunnel: vi.fn(),
}));

import { ChartMiniCalc } from "../../components/ChartMiniCalc";
import { trackChartFunnel } from "../../services/analytics";

const mockTrack = vi.mocked(trackChartFunnel);

// Drive the three Month/Day/Year selects so DateSelectGroup composes the ISO.
const pickDate = (month: string, day: string, year: string) => {
  const selects = screen.getAllByRole("combobox");
  fireEvent.change(selects[2], { target: { value: year } }); // year
  fireEvent.change(selects[0], { target: { value: month } }); // month
  fireEvent.change(selects[1], { target: { value: day } }); // day
};

beforeEach(() => {
  mockTrack.mockClear();
});

describe("ChartMiniCalc", () => {
  it("renders the title and disables reveal until a date is chosen", () => {
    render(<ChartMiniCalc />);
    expect(screen.getByText("Find Your North Node Sign")).toBeTruthy();
    const button = screen.getByRole("button", {
      name: /Reveal My North Node/i,
    });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("resolves the North Node sign client-side and shows the signup CTA", () => {
    render(<ChartMiniCalc module="north-node" placement="wiki" />);
    pickDate("8", "15", "1990"); // 1990-08-15 → Aquarius
    fireEvent.click(
      screen.getByRole("button", { name: /Reveal My North Node/i }),
    );

    expect(screen.getByText("Aquarius")).toBeTruthy();
    const cta = screen.getByRole("link", {
      name: /Get your full birth chart/i,
    });
    expect(cta.getAttribute("href")).toBe("/en/auth");
  });

  it("fires chart_start once and result_shown with the categorical sign", () => {
    render(<ChartMiniCalc module="north-node" placement="wiki" />);
    pickDate("8", "15", "1990");
    fireEvent.click(
      screen.getByRole("button", { name: /Reveal My North Node/i }),
    );

    const steps = mockTrack.mock.calls.map((c) => c[0].step);
    expect(steps.filter((s) => s === "chart_start").length).toBe(1);

    const resultShown = mockTrack.mock.calls
      .map((c) => c[0])
      .find((p) => p.step === "result_shown");
    expect(resultShown).toMatchObject({
      step: "result_shown",
      sign: "aquarius",
      module: "north-node",
      tool: "north-node-sign",
      placement: "wiki",
    });
  });

  it("advances to the fullChartHref target and fires full_chart_cta_click (layered funnel)", () => {
    render(
      <ChartMiniCalc fullChartHref="/en/wiki/north-node-in-scorpio#birth-chart-tool" />,
    );
    pickDate("8", "15", "1990");
    fireEvent.click(
      screen.getByRole("button", { name: /Reveal My North Node/i }),
    );

    const cta = screen.getByRole("link", {
      name: /Get your full birth chart/i,
    });
    expect(cta.getAttribute("href")).toBe(
      "/en/wiki/north-node-in-scorpio#birth-chart-tool",
    );

    fireEvent.click(cta);
    const ctaStep = mockTrack.mock.calls
      .map((c) => c[0])
      .find((p) => p.step === "full_chart_cta_click");
    expect(ctaStep).toBeTruthy();
    expect(ctaStep).not.toHaveProperty("step", "signup_cta_click");
  });

  it("NEVER passes the birth date (or any part of it) to analytics", () => {
    render(<ChartMiniCalc />);
    pickDate("8", "15", "1990");
    fireEvent.click(
      screen.getByRole("button", { name: /Reveal My North Node/i }),
    );
    fireEvent.click(
      screen.getByRole("link", { name: /Get your full birth chart/i }),
    );

    for (const [params] of mockTrack.mock.calls) {
      const serialized = JSON.stringify(params);
      expect(serialized).not.toContain("1990");
      expect(serialized).not.toContain("08-15");
      expect(params).not.toHaveProperty("birthDate");
      expect(params).not.toHaveProperty("dob");
      expect(params).not.toHaveProperty("date");
    }
  });
});
