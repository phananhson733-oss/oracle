// @vitest-environment jsdom
// INPUT: SaturnReturnLandingSections and React Testing Library.
// OUTPUT: Guards the human-visible brief hierarchy, FAQ, and related-tool links.
// POS: SPA presentation coverage for the Saturn Return source-of-truth content.

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { SaturnReturnLandingSections } from "../../components/SaturnReturnLandingSections";

describe("SaturnReturnLandingSections", () => {
  it("renders every visible brief section, fifteen H3s, ten FAQs, and three specified tools", () => {
    const { container, getByRole } = render(
      <SaturnReturnLandingSections isDark={false} />,
    );

    expect(container.querySelectorAll("h2")).toHaveLength(5);
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
    ).toBe("/en/wiki/saturn-return-complete-guide");
  });
});
