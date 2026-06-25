// @vitest-environment jsdom
// INPUT: ToolPageShell + per-tool SEO content map.
// OUTPUT: Guards individual calculator pages: wide content shell + visible, non-duplicative, non-FAQ-like tool-specific landing sections.
// POS: Regression test for /:lang/<tool> pages so SEO copy is visible in the hydrated SPA, not only in static stubs, without repeated or question-template guide/FAQ headings.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolPageShell } from "../../components/calculators/ToolPageShell";
import { TOOL_SEO_CONTENT } from "../../components/calculators/toolSeoContent";
import { TOOLS } from "../../components/tools/toolsCatalog";

const uniqueValues = (values: string[]) =>
  new Set(values.map((value) => value.trim()));

const normalizeHeading = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const FAQ_STYLE_SECTION_HEADING =
  /^(what|when|why|how|using|reading|is|are|does|do|can|where)\b/i;

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

    expect(container.firstElementChild?.className).toContain("max-w-[88rem]");
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
        name: /About Moon Sign Calculator/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Moon placement basics/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Moon Sign Calculator FAQ/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Can I calculate my Moon sign without a birth time/i),
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

  it("does not repeat visible guide or FAQ headings within a tool page", () => {
    for (const tool of TOOLS) {
      const content = TOOL_SEO_CONTENT[tool.slug];
      const headings = [
        `When to use ${content.title}?`,
        `About ${content.title}`,
        ...content.sections.map((section) => section.heading),
        `${content.title} FAQ`,
        ...content.faqs.map((faq) => faq.heading),
      ].map(normalizeHeading);

      const duplicates = headings.filter(
        (heading, index) => headings.indexOf(heading) !== index,
      );

      expect(duplicates, `${tool.slug} duplicate headings`).toEqual([]);
    }
  });

  it("keeps explainer section headings distinct from FAQ-style questions", () => {
    for (const tool of TOOLS) {
      const content = TOOL_SEO_CONTENT[tool.slug];

      for (const section of content.sections) {
        expect(
          FAQ_STYLE_SECTION_HEADING.test(section.heading),
          `${tool.slug} section heading reads like FAQ: ${section.heading}`,
        ).toBe(false);
      }
    }
  });
});
