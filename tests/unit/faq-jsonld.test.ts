// INPUT: buildFaqPageSchema / parseFaqsFromMarkdown / buildFaqSchemaFromMarkdown
//        from scripts/lib/faq-jsonld.mjs.
// OUTPUT: vitest specs for the schema.org FAQPage JSON-LD builder + the markdown
//         FAQ parser that feeds it in the static SEO generator.
// POS: Guards the FAQ rich-result schema shape AND the markdown→FAQ parser whose
//      logic must mirror WikiArticleDetailPage's inline parser (stub/SPA parity).

import { describe, it, expect } from "vitest";
// @ts-expect-error — .mjs lib has no type declarations
import * as faqLib from "../../scripts/lib/faq-jsonld.mjs";

const {
  buildFaqPageSchema,
  parseFaqsFromMarkdown,
  buildFaqSchemaFromMarkdown,
} = faqLib;

describe("buildFaqPageSchema", () => {
  it("builds a valid FAQPage schema from question/answer pairs", () => {
    const schema = buildFaqPageSchema([
      {
        question: "What is a North Node?",
        answer: "It marks your growth direction.",
      },
      {
        question: "Does birth time matter?",
        answer: "Not for the sign — the node moves slowly.",
      },
    ]);
    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a North Node?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It marks your growth direction.",
          },
        },
        {
          "@type": "Question",
          name: "Does birth time matter?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Not for the sign — the node moves slowly.",
          },
        },
      ],
    });
  });

  it("trims whitespace and drops entries missing a question or answer", () => {
    const schema = buildFaqPageSchema([
      { question: "  Padded?  ", answer: "  Trimmed.  " },
      { question: "No answer", answer: "" },
      { question: "", answer: "No question" },
      { answer: "Missing question key" },
    ]);
    expect(schema.mainEntity).toHaveLength(1);
    expect(schema.mainEntity[0].name).toBe("Padded?");
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe("Trimmed.");
  });

  it("returns null for empty, missing, or all-invalid input", () => {
    expect(buildFaqPageSchema([])).toBeNull();
    expect(buildFaqPageSchema(undefined)).toBeNull();
    expect(buildFaqPageSchema(null)).toBeNull();
    expect(buildFaqPageSchema("not an array")).toBeNull();
    expect(buildFaqPageSchema([{ question: "", answer: "" }])).toBeNull();
  });
});

// Mirrors the inline parser in WikiArticleDetailPage.tsx (stub/SPA FAQPage parity).
const EN_ARTICLE = `# North Node in Scorpio

Intro paragraph that is not a FAQ.

## What the Placement Means

Some body copy that should be ignored by the FAQ parser.

## Questions People Ask About the Scorpio Node

**What is the North Node in Scorpio?**
It marks an unlived growth direction.
The node moves slowly, so the sign is stable.

**Does my birth time change the sign?**
Not for the sign — only the house.

## 常见误读

This heading must NOT be treated as FAQ (no question token).
`;

const ZH_ARTICLE = `# 天蝎座北交点

引言段落，不是 FAQ。

## 关于 North Node in Scorpio 的常见问题

**天蝎座北交点是什么？**
它标记一条未活出的成长方向。

**出生时间会改变星座吗？**
不会改变星座，只影响宫位。
`;

describe("parseFaqsFromMarkdown", () => {
  it("extracts bold-question + following lines as answers, only inside FAQ sections", () => {
    const faqs = parseFaqsFromMarkdown(EN_ARTICLE);
    expect(faqs).toHaveLength(2);
    expect(faqs[0]).toEqual({
      question: "What is the North Node in Scorpio?",
      answer:
        "It marks an unlived growth direction. The node moves slowly, so the sign is stable.",
    });
    expect(faqs[1].question).toBe("Does my birth time change the sign?");
  });

  it("detects varied / localized FAQ headings (去模板感) and ignores non-FAQ ones", () => {
    expect(parseFaqsFromMarkdown(ZH_ARTICLE)).toHaveLength(2);
    // "常见误读" carries no question token → its content is not captured.
    const enFaqs = parseFaqsFromMarkdown(EN_ARTICLE);
    expect(JSON.stringify(enFaqs)).not.toContain("must NOT be treated");
  });

  it("returns an empty array when no FAQ section is present", () => {
    expect(parseFaqsFromMarkdown("# Title\n\nJust prose.\n")).toEqual([]);
    expect(parseFaqsFromMarkdown("")).toEqual([]);
  });
});

describe("buildFaqSchemaFromMarkdown", () => {
  it("builds a FAQPage schema when ≥2 Q&A are found", () => {
    const schema = buildFaqSchemaFromMarkdown(EN_ARTICLE);
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0].name).toBe(
      "What is the North Node in Scorpio?",
    );
  });

  it("returns null when fewer than 2 Q&A (mirrors SPA threshold)", () => {
    const oneQ = `## FAQ\n\n**Only one question?**\nYes, just one.\n`;
    expect(buildFaqSchemaFromMarkdown(oneQ)).toBeNull();
    expect(buildFaqSchemaFromMarkdown("# Title\n\nNo FAQ here.")).toBeNull();
  });
});
