// @vitest-environment jsdom
// INPUT: ToolPageShell + per-tool SEO content map.
// OUTPUT: Guards individual calculator pages: wide content shell + visible tool-specific landing sections.
// POS: Regression test for /:lang/<tool> pages so SEO copy is visible in the hydrated SPA, not only in static stubs.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolPageShell } from "../../components/calculators/ToolPageShell";
import { TOOL_SEO_CONTENT } from "../../components/calculators/toolSeoContent";
import { TOOLS } from "../../components/tools/toolsCatalog";

const uniqueValues = (values: string[]) =>
  new Set(values.map((value) => value.trim()));

describe("ToolPageShell", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  it("uses a wide default shell for individual tool pages", () => {
    const { container } = render(
      <ToolPageShell title="Moon Sign Calculator" slug="moon-sign-calculator">
        <div>calculator body</div>
      </ToolPageShell>,
    );

    expect(container.firstElementChild?.className).toContain("max-w-6xl");
  });

  it("renders tool-specific landing sections for calculator pages", () => {
    render(
      <ToolPageShell title="Moon Sign Calculator" slug="moon-sign-calculator">
        <div>calculator body</div>
      </ToolPageShell>,
    );

    expect(
      screen.getByRole("heading", {
        name: /When to use Moon Sign Calculator/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: /How to use Moon Sign Calculator/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /What is a Moon sign/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Moon Sign Calculator FAQ/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Do I need my birth time for my Moon sign/i),
    ).toBeTruthy();
  });

  it("has landing content for every public tool slug", () => {
    for (const tool of TOOLS) {
      expect(TOOL_SEO_CONTENT[tool.slug], tool.slug).toBeDefined();
      expect(
        TOOL_SEO_CONTENT[tool.slug].title.trim().length,
        tool.slug,
      ).toBeGreaterThan(0);
      expect(
        TOOL_SEO_CONTENT[tool.slug].useCases.length,
        `${tool.slug} use cases`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        TOOL_SEO_CONTENT[tool.slug].sections.length,
        `${tool.slug} sections`,
      ).toBeGreaterThanOrEqual(4);
      expect(
        TOOL_SEO_CONTENT[tool.slug].faqs.length,
        `${tool.slug} faqs`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps tool landing copy specific instead of sharing one generic template", () => {
    const content = TOOLS.map((tool) => TOOL_SEO_CONTENT[tool.slug]);

    expect(uniqueValues(content.map((item) => item.title)).size).toBe(
      TOOLS.length,
    );
    expect(uniqueValues(content.map((item) => item.summary)).size).toBe(
      TOOLS.length,
    );
    expect(
      uniqueValues(content.map((item) => item.useCases.join(" | "))).size,
    ).toBe(TOOLS.length);
    expect(
      uniqueValues(content.map((item) => item.sections[0].heading)).size,
    ).toBe(TOOLS.length);
    expect(uniqueValues(content.map((item) => item.faqs[0].heading)).size).toBe(
      TOOLS.length,
    );
  });
});
