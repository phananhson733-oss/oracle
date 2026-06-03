// INPUT: an array of { question, answer } pairs, or raw article markdown.
// OUTPUT: buildFaqPageSchema / parseFaqsFromMarkdown / buildFaqSchemaFromMarkdown
//         — a schema.org FAQPage object (or null), ready to be stringified by
//         safe-jsonld.mjs and injected into a static stub.
// POS: Build-time SEO helper for FAQ rich results. Pure + side-effect-free so it
//      is unit-tested in isolation; consumed by scripts/generate-seo-pages.mjs.
//      The markdown parser MIRRORS WikiArticleDetailPage.tsx's inline FAQ parser
//      so the static stub and the SPA emit the SAME FAQPage (stub/SPA parity).

/**
 * Builds a schema.org FAQPage object from question/answer pairs. Entries missing
 * a non-empty question or answer are dropped; returns null when nothing valid
 * remains (so callers can skip emitting an empty <script>).
 *
 * @param {Array<{question?: string, answer?: string}>} faqs
 * @returns {{ "@context": string, "@type": "FAQPage", mainEntity: object[] } | null}
 */
export const buildFaqPageSchema = (faqs) => {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  const mainEntity = faqs
    .filter(
      (f) =>
        f &&
        typeof f.question === "string" &&
        typeof f.answer === "string" &&
        f.question.trim() !== "" &&
        f.answer.trim() !== "",
    )
    .map((f) => ({
      "@type": "Question",
      name: f.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer.trim(),
      },
    }));

  if (mainEntity.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
};

// FAQ rich results need at least a couple of Q&A to be worth emitting; this
// mirrors the SPA's threshold so the static stub and the hydrated page agree.
const MIN_FAQS = 2;

// Heading is treated as an FAQ section when it carries a question/FAQ token.
// MIRRORS WikiArticleDetailPage.tsx — keep both regexes identical. Non-FAQ
// false positives are harmless (no bold-? lines inside → no Q&A captured).
const FAQ_HEADING_RE =
  /\bfaqs?\b|\bquestions?\b|\bq\s*&\s*a\b|问题|问答|常问|疑问|問題|問答|常問|疑問/i;

/**
 * Parses an article's markdown into { question, answer } pairs by scanning ##
 * sections whose heading reads as an FAQ, then pairing each bold question line
 * (**...?**) with the prose lines that follow it. Pure string logic.
 *
 * @param {string} markdown
 * @returns {Array<{ question: string, answer: string }>}
 */
export const parseFaqsFromMarkdown = (markdown) => {
  if (typeof markdown !== "string" || markdown === "") return [];
  const faqs = [];
  let inFaq = false;
  let cur = null;
  const flush = () => {
    if (cur && cur.answer.trim()) {
      faqs.push({ question: cur.question, answer: cur.answer.trim() });
    }
    cur = null;
  };
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      flush();
      inFaq = FAQ_HEADING_RE.test(h2[1]);
      continue;
    }
    if (!inFaq) continue;
    const q = line.match(/^\*\*(.+?)\*\*$/);
    if (q && /[?？]/.test(q[1])) {
      flush();
      cur = { question: q[1].trim(), answer: "" };
      continue;
    }
    if (cur && line) cur.answer += (cur.answer ? " " : "") + line;
  }
  flush();
  return faqs;
};

/**
 * Convenience: parse markdown → FAQPage schema, applying the SPA's ≥2 threshold.
 * Returns null when too few Q&A are present (so callers skip the empty script).
 *
 * @param {string} markdown
 * @returns {object | null}
 */
export const buildFaqSchemaFromMarkdown = (markdown) => {
  const faqs = parseFaqsFromMarkdown(markdown);
  if (faqs.length < MIN_FAQS) return null;
  return buildFaqPageSchema(faqs);
};
