// @vitest-environment jsdom
// INPUT: SaturnReturnLandingSections and React Testing Library.
// OUTPUT: Guards the human-visible brief hierarchy, FAQ, related-tool links, and published article cards.
// POS: SPA presentation coverage for the Saturn Return source-of-truth content.

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { SaturnReturnLandingSections } from "../../components/SaturnReturnLandingSections";

describe("SaturnReturnLandingSections", () => {
  it("renders every visible brief section, fifteen H3s, ten FAQs, three tools, and four published articles", () => {
    const { container, getByRole } = render(
      <SaturnReturnLandingSections isDark={false} />,
    );

    expect(container.querySelectorAll("h2")).toHaveLength(6);
    expect(container.querySelectorAll("h3")).toHaveLength(15);
    expect(container.querySelectorAll("details")).toHaveLength(10);
    expect(container.querySelectorAll("table tbody tr")).toHaveLength(12);
    expect(container.querySelectorAll(".saturn-related-tool")).toHaveLength(3);
    expect(getByRole("heading", { name: "Frequently Asked Questions" })).toBeTruthy();
    expect(
      getByRole("link", { name: /Free Birth Chart Calculator/ }).getAttribute(
        "href",
      ),
    ).toBe("/en/birth-chart-calculator");
    expect(
      getByRole("link", { name: /Compatibility Calculator/ }).getAttribute(
        "href",
      ),
    ).toBe("/en/compatibility-calculator");
    expect(
      getByRole("link", { name: /Moon Sign Calculator/ }).getAttribute("href"),
    ).toBe("/en/moon-sign-calculator");
    expect(
      getByRole("link", { name: "Saturn Return wiki series →" }).getAttribute(
        "href",
      ),
    ).toBe("/en/wiki/saturn-return-in-scorpio");
    expect(
      getByRole("link", { name: "Saturn Return guides in the wiki →" }).getAttribute(
        "href",
      ),
    ).toBe("/en/wiki/saturn-return-guide");
    expect(getByRole("heading", { name: "Learn More About Saturn Return" })).toBeTruthy();
    expect(container.querySelectorAll(".saturn-related-article")).toHaveLength(4);
    expect(
      getByRole("link", {
        name: /Your Saturn Return Guide to the Three-Pass Timeline, Not One Birthday/,
      }).getAttribute("href"),
    ).toBe("/en/wiki/saturn-return-guide");
    expect(
      getByRole("link", {
        name: /What Saturn Return in Scorpio Puts Under Structural Review/,
      }).getAttribute("href"),
    ).toBe("/en/wiki/saturn-return-in-scorpio");
    expect(
      getByRole("link", {
        name: /What Saturn Return Age 29 Actually Marks in Your Chart/,
      }).getAttribute("href"),
    ).toBe("/en/wiki/saturn-return-age-29");
    expect(
      getByRole("link", {
        name: /What the Second Saturn Return Really Asks of You Near 60/,
      }).getAttribute("href"),
    ).toBe("/en/wiki/second-saturn-return");
  });

  it("keeps related article cards on the dark editorial-paper token branch", () => {
    const { container } = render(<SaturnReturnLandingSections isDark={true} />);
    const articleGrid = container.querySelector(".grid.gap-4.md\\:grid-cols-2");
    const articleCards = container.querySelectorAll<HTMLAnchorElement>(
      ".saturn-related-article",
    );

    expect(articleGrid).toBeTruthy();
    expect(articleCards).toHaveLength(4);
    for (const card of articleCards) {
      expect(card.className).toContain("bg-space-900/45");
      expect(card.className).toContain("border-gold-500/15");
    }
  });
});
