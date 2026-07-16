// INPUT: Approved Saturn Return v3.0 content brief.
// OUTPUT: One-to-one content, internal-link, and JSON-LD regression contract.
// POS: Prevents the Saturn Return SPA/static/schema content from drifting from the approved brief.

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  renderSaturnReturnLandingHtml,
  saturnReturnBreadcrumbSchema,
  saturnReturnFaqSchema,
  saturnReturnHowToSchema,
  saturnReturnLandingContent,
  saturnReturnWebApplicationSchema,
} from "../../data/saturnReturnLandingContent.js";

const approvedQuestions = [
  "Can I calculate my Saturn Return without a birth time?",
  "What birth information do I need?",
  "Why does my Saturn Return show a date range instead of one day?",
  "How many Saturn Returns does the calculator show?",
  "What does it mean if I'm in two Saturn Return windows at once?",
  "Is this Saturn Return calculator accurate?",
  "Is the Saturn Return calculator free?",
  "How is a Saturn Return different from other Saturn transits?",
  "What should I do during a Saturn Return?",
  "Can a Saturn Return affect me before the exact window dates?",
];

describe("Saturn Return landing content", () => {
  it("keeps the approved English meta and Hero copy exactly aligned", () => {
    expect(saturnReturnLandingContent.language).toBe("en");
    expect(saturnReturnLandingContent.title + " | AstrologyWiki").toBe(
      "Saturn Return Calculator – Free Saturn Return Dates | AstrologyWiki",
    );
    expect(saturnReturnLandingContent.description).toBe(
      "Calculate your Saturn Return dates free. Enter your birth date to find your exact return window — first, second, and third returns included. No sign-up required.",
    );
    expect(saturnReturnLandingContent.h1).toBe(
      "Saturn Return Calculator — Free Saturn Return Dates",
    );
    expect(saturnReturnLandingContent.heroSubtitle).toBe(
      "Enter your birth date to calculate your personal Saturn Return window. Discover when your first, second, and third returns fall, how long each lasts, and what it means for this chapter of your life.",
    );
    expect(saturnReturnLandingContent.trustLine).toBe(
      "Free · No sign-up required · Instant results",
    );
  });

  it("keeps every required visible heading and all fifteen approved H3s", () => {
    expect(saturnReturnLandingContent.sections.map((section) => section.heading)).toEqual([
      "How to Use the Saturn Return Calculator",
      "What Your Saturn Return Results Mean",
      "Who Should Use the Saturn Return Calculator",
      "Frequently Asked Questions",
    ]);
    expect(saturnReturnLandingContent.relatedToolsHeading).toBe(
      "Other Free Astrology Calculators",
    );
    expect(
      saturnReturnLandingContent.sections.flatMap((section) =>
        section.items.map((item) => item.heading),
      ),
    ).toEqual([
      "Step 1 — Enter Your Birth Date",
      "Step 2 — Read Your Return Window",
      "Step 3 — Identify Your Peak Date",
      "Tips for More Accurate Results",
      "First Saturn Return — Ages 27 to 30",
      "Second Saturn Return — Ages 56 to 60",
      "Third Saturn Return — Ages 85 to 90",
      "Your Saturn Return Window — Start and End Dates",
      "Saturn Return by Zodiac Sign",
      "Saturn Return Retrograde Periods",
      "Reading the Peak Conjunction Date",
      "You're in Your Late 20s and Feeling Stuck",
      "You Want to Understand a Major Life Transition",
      "You're Preparing for a Career or Relationship Decision",
      "You're a Practitioner Reading for Clients",
    ]);
    const signGuide = saturnReturnLandingContent.sections
      .flatMap((section) => section.items)
      .find((item) => item.heading === "Saturn Return by Zodiac Sign");
    expect(signGuide?.table?.rows).toHaveLength(12);
  });

  it("keeps the approved ten FAQ questions, visible/schema parity, and substantive answers", () => {
    expect(saturnReturnLandingContent.faqs.map((faq) => faq.question)).toEqual(
      approvedQuestions,
    );
    expect(saturnReturnLandingContent.faqs).toHaveLength(10);
    for (const faq of saturnReturnLandingContent.faqs) {
      expect(faq.answer.trim().split(/\s+/).length).toBeGreaterThanOrEqual(40);
    }
    expect(saturnReturnFaqSchema.mainEntity).toEqual(
      saturnReturnLandingContent.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    );
  });

  it("uses the brief's tool cards and hides unpublished articles by explicit decision", () => {
    expect(saturnReturnLandingContent.relatedTools).toEqual([
      expect.objectContaining({
        label: "Free Birth Chart Calculator",
        href: "/en/birth-chart-calculator",
        cta: "Calculate your birth chart",
      }),
      expect.objectContaining({
        label: "Compatibility Calculator",
        href: "/en/compatibility-calculator",
        cta: "Check compatibility",
      }),
      expect.objectContaining({
        label: "Moon Sign Calculator",
        href: "/en/moon-sign-calculator",
        cta: "Find your Moon sign",
      }),
    ]);
    expect(saturnReturnLandingContent.relatedArticles).toEqual([]);
  });

  it("renders the same hierarchy, FAQ, breadcrumb, and internal links in the static page", () => {
    const html = renderSaturnReturnLandingHtml();

    expect((html.match(/<h2>/g) ?? [])).toHaveLength(5);
    expect((html.match(/<h3>/g) ?? [])).toHaveLength(15);
    expect((html.match(/<details>/g) ?? [])).toHaveLength(10);
    const words = (html.replace(/<[^>]+>/g, " ").match(/[A-Za-z0-9][A-Za-z0-9'–-]*/g) ?? []).length;
    expect(words).toBeGreaterThanOrEqual(2000);
    expect(html).toContain('aria-label="Breadcrumb"');
    for (const href of [
      "/en/birth-chart-calculator",
      "/en/compatibility-calculator",
      "/en/moon-sign-calculator",
      "/en/wiki/saturn-return-in-scorpio",
      "/en/wiki/saturn-return-complete-guide",
    ]) {
      expect(html).toContain('href="' + href + '"');
    }
  });

  it("ships the four required JSON-LD types with the specified WebApplication provider", () => {
    expect(saturnReturnWebApplicationSchema).toMatchObject({
      "@type": "WebApplication",
      url: "https://www.astrologywiki.com/en/saturn-return-calculator",
      description: saturnReturnLandingContent.description,
      provider: {
        "@type": "Organization",
        name: "AstrologyWiki",
        url: "https://www.astrologywiki.com",
      },
    });
    expect(saturnReturnBreadcrumbSchema["@type"]).toBe("BreadcrumbList");
    expect(saturnReturnHowToSchema["@type"]).toBe("HowTo");
    expect(saturnReturnHowToSchema.step).toHaveLength(3);
  });

  it("keeps the generated static artifact synchronized with content and all schema types", () => {
    const staticHtml = fs.readFileSync(
      path.resolve("public/en/saturn-return-calculator/index.html"),
      "utf8",
    );
    const schema = JSON.parse(
      staticHtml.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1] ?? "[]",
    );

    expect(staticHtml).toContain("<h1>" + saturnReturnLandingContent.h1 + "</h1>");
    expect(staticHtml).toContain(
      "<title>Saturn Return Calculator – Free Saturn Return Dates | AstrologyWiki</title>",
    );
    expect(staticHtml).toContain(
      '<meta name="description" content="' + saturnReturnLandingContent.description + '" />',
    );
    expect(staticHtml).toContain(saturnReturnLandingContent.heroSubtitle);
    expect(staticHtml).toContain(saturnReturnLandingContent.relatedToolsHeading);
    expect((staticHtml.match(/<h2/g) ?? [])).toHaveLength(5);
    expect((staticHtml.match(/<h3/g) ?? [])).toHaveLength(15);
    expect((staticHtml.match(/<details/g) ?? [])).toHaveLength(10);
    expect(schema.map((entry: { "@type": string }) => entry["@type"])).toEqual([
      "WebApplication",
      "FAQPage",
      "BreadcrumbList",
      "HowTo",
    ]);
    expect(schema.find((entry: { "@type": string }) => entry["@type"] === "FAQPage").mainEntity).toEqual(
      saturnReturnFaqSchema.mainEntity,
    );
  });
});
