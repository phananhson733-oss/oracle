// @vitest-environment jsdom
// INPUT: <SafetyFooter> (SPA render) — uses default LanguageContext (en).
// OUTPUT: jsdom specs asserting JS users see the SAME mandated disclaimer + crisis
//         lines the static stub carries (CLAUDE.md AI 安全边界 #1/#4).
// POS: 红线 guard — psych-adjacent pages MUST show the disclaimer to JS users too,
//      since inject-spa replaces (not hydrates) the stub. Copy is shared with the
//      stub via utils/safetyFooter; this guards the SPA render of it.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SafetyFooter from "../../components/SafetyFooter";
import {
  buildSafetyFooterHtml,
  SAFETY_FOOTER_COPY,
} from "../../utils/safetyFooter";

describe("SafetyFooter (SPA render)", () => {
  it("renders the clinical disclaimer and non-diagnostic framing", () => {
    render(<SafetyFooter />);
    const note = screen.getByRole("note");
    expect(note.textContent).toContain("not a clinical diagnosis");
    expect(note.textContent?.toLowerCase()).toContain(
      "licensed mental health professional",
    );
    expect(note.textContent).toContain("fatalistic predictions");
  });

  it("renders crisis helplines with dialable + web links", () => {
    render(<SafetyFooter />);
    expect(screen.getByText(/988 Suicide & Crisis Lifeline/)).toBeTruthy();
    expect(screen.getByText("Samaritans")).toBeTruthy();
    const tel = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === "tel:988");
    expect(tel).toBeTruthy();
    const befrienders = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === "https://www.befrienders.org");
    expect(befrienders?.getAttribute("rel")).toContain("nofollow");
  });

  it("renders the SAME mandated copy the static stub builder emits (stub/SPA parity)", () => {
    render(<SafetyFooter />);
    const noteText = screen.getByRole("note").textContent || "";
    const stubHtml = buildSafetyFooterHtml("en");
    const copy = SAFETY_FOOTER_COPY.en;
    // Both render paths must carry the same disclaimer + crisis-intro copy, since
    // they share utils/safetyFooter as the single source (no drift on the 红线 text).
    for (const text of [
      copy.clinical_note,
      copy.disclaimer,
      copy.crisis_intro,
    ]) {
      expect(noteText).toContain(text);
      expect(stubHtml).toContain(text);
    }
  });
});
