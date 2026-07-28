// INPUT: a language code ('en' | 'zh').
// OUTPUT: the SINGLE source of truth for the psych-adjacent safety footer —
//         structured copy (SAFETY_FOOTER_COPY) + crisis lines (SAFETY_CRISIS_LINES)
//         the SPA <SafetyFooter> renders as themed JSX, plus buildSafetyFooterHtml()
//         the static SEO generator injects into stubs.
// POS: tool-led psych-adjacent compliance (CLAUDE.md AI 安全边界 #1/#4). The static
//      stub and the hydrated SPA MUST show the SAME clinical disclaimer + crisis
//      lines; this module is the one place that copy lives, so it cannot drift.
//      Pure + import-free so the SEO generator can load it via loadTsModule. If
//      updated, sync utils/FOLDER.md + components/SafetyFooter.tsx + the stub CSS.

export type SafetyLang = "en" | "zh";

export interface CrisisLine {
  name_en: string;
  name_zh: string;
  /** Empty string when the service is web-only (no dialable number). */
  phone: string;
  url: string;
}

// Mirrors backend/src/data/helplines.ts (source of truth for crisis lines).
// Static pages have no user geo at build time, so we list the primary EN-market
// lines (US, UK) plus Befrienders Worldwide as the international fallback.
export const SAFETY_CRISIS_LINES: CrisisLine[] = [
  {
    name_en: "988 Suicide & Crisis Lifeline",
    name_zh: "988 自杀与危机求助热线",
    phone: "988",
    url: "https://988lifeline.org",
  },
  {
    name_en: "Samaritans",
    name_zh: "撒玛利亚会",
    phone: "116 123",
    url: "https://www.samaritans.org",
  },
  {
    name_en: "Befrienders Worldwide",
    name_zh: "Befrienders 全球热线",
    phone: "",
    url: "https://www.befrienders.org",
  },
];

export interface SafetyFooterCopy {
  aria: string;
  clinical_note: string;
  disclaimer: string;
  crisis_intro: string;
}

export const SAFETY_FOOTER_COPY: Record<SafetyLang, SafetyFooterCopy> = {
  en: {
    aria: "Important safety information",
    clinical_note:
      "Note: this content is for education and self-reflection, not a clinical diagnosis. If you are experiencing distress, please consult a licensed mental health professional.",
    disclaimer:
      "This is a map of tendencies and potentials, not a destiny verdict. We do not provide medical diagnosis or fatalistic predictions.",
    crisis_intro:
      "In crisis? You are not alone — free, confidential support is available:",
  },
  zh: {
    aria: "重要安全信息",
    clinical_note:
      "注意：本内容用于教育与自我反思，这不是临床诊断。如有心理困扰，请咨询持证心理咨询师。",
    disclaimer:
      "这是一张关于倾向和潜力的地图，而不是命运的判决书。我们不提供医学诊断或宿命论预测。",
    crisis_intro: "正处于危机中？你并不孤单——可获得免费、保密的帮助：",
  },
};

export const resolveSafetyLang = (lang?: string): SafetyLang =>
  lang === "zh" ? "zh" : "en";

export const crisisLineName = (line: CrisisLine, lang: SafetyLang): string =>
  lang === "zh" ? line.name_zh : line.name_en;

// Self-contained escapeHtml (mirrors scripts/lib/md-to-html.mjs) so this module
// stays import-free and loadTsModule can evaluate it without resolving .mjs deps.
const escapeHtml = (value: string): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderLineHtml = (line: CrisisLine, lang: SafetyLang): string => {
  const name = escapeHtml(crisisLineName(line, lang));
  const url = escapeHtml(line.url);
  const link = `<a href="${url}" rel="noopener nofollow" target="_blank">${name}</a>`;
  if (!line.phone) return `<li>${link}</li>`;
  const tel = escapeHtml(line.phone.replace(/\s+/g, ""));
  const phone = escapeHtml(line.phone);
  return `<li>${link} · <a href="tel:${tel}">${phone}</a></li>`;
};

/**
 * Builds the mandatory psych-adjacent safety footer as an HTML string for the
 * static SEO stub. Falls back to English for any unrecognised language. The SPA
 * renders the equivalent JSX from the same copy (components/SafetyFooter.tsx).
 */
export const buildSafetyFooterHtml = (lang?: string): string => {
  const l = resolveSafetyLang(lang);
  const copy = SAFETY_FOOTER_COPY[l];
  const lines = SAFETY_CRISIS_LINES.map((line) => renderLineHtml(line, l)).join(
    "",
  );
  return [
    `<aside class="safety-footer" role="note" aria-label="${escapeHtml(copy.aria)}">`,
    `<p class="safety-footer__clinical">${escapeHtml(copy.clinical_note)}</p>`,
    `<p class="safety-footer__disclaimer">${escapeHtml(copy.disclaimer)}</p>`,
    `<p class="safety-footer__crisis-intro">${escapeHtml(copy.crisis_intro)}</p>`,
    `<ul class="safety-footer__lines">${lines}</ul>`,
    `</aside>`,
  ].join("");
};
