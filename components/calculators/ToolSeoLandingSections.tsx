// INPUT: useTheme/useLanguage, embed context, toolSeoContent map.
// OUTPUT: Human-visible landing content for individual calculator pages: summary, use cases, explainer sections, FAQ in a flatter editorial layout.
// POS: Rendered by ToolPageShell below each interactive tool. Keeps hydrated SPA pages aligned with static SEO stubs.

import React from "react";
import { useLanguage, useTheme } from "../UIComponents";
import { useIsEmbed } from "./embed";
import { getToolSeoContent } from "./toolSeoContent";

interface ToolSeoLandingSectionsProps {
  slug?: string;
}

const COPY = {
  en: {
    whenPrefix: "When to use",
    guideSuffix: "guide",
    guideHeadingPrefix: "How to use",
    faqSuffix: "FAQ",
    faqIntro:
      "Quick answers for the questions people usually have before using this calculator.",
  },
  zh: {
    whenPrefix: "什么时候适合使用",
    guideSuffix: "工具说明",
    guideHeadingPrefix: "如何使用",
    faqSuffix: "常见问题",
    faqIntro: "使用这个计算器前，用户最常见的问题集中在这里。",
  },
} as const;

export const ToolSeoLandingSections: React.FC<ToolSeoLandingSectionsProps> = ({
  slug,
}) => {
  const content = getToolSeoContent(slug);
  const isEmbed = useIsEmbed();
  const { language } = useLanguage();
  const { theme } = useTheme();

  if (!content || isEmbed) return null;

  const isDark = theme === "dark";
  const copy = language === "zh" ? COPY.zh : COPY.en;
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-700";
  const mutedText = isDark ? "text-star-300" : "text-paper-600";
  const ruleTone = isDark ? "border-gold-500/10" : "border-paper-300/80";
  const panelTone = isDark
    ? "border-gold-500/15 bg-space-900/45"
    : "border-paper-300/80 bg-paper-100/70";
  const overviewBadge = `${content.title} ${copy.guideSuffix}`;
  const guideHeading = `${copy.guideHeadingPrefix} ${content.title}`;
  const faqHeading = `${content.title} ${copy.faqSuffix}`;

  return (
    <div className="mt-16 space-y-12 border-t border-paper-300/80 pt-10 dark:border-gold-500/10">
      <section
        aria-label={`${content.title} overview`}
        className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"
      >
        <p className="font-mono text-xs font-semibold text-accent">
          {overviewBadge}
        </p>
        <p
          className={`text-base leading-relaxed md:text-lg ${textSecondary}`}
        >
          {content.summary}
        </p>
      </section>

      <section
        aria-labelledby={`${slug}-when-to-use`}
        className={`rounded-2xl border p-6 transition-all duration-300 ease-in-out sm:p-8 ${panelTone}`}
      >
        <h2
          id={`${slug}-when-to-use`}
          className={`font-serif text-2xl leading-tight ${textPrimary}`}
        >
          {copy.whenPrefix} {content.title}?
        </h2>
        <ul
          className={`mt-5 grid gap-4 text-sm leading-relaxed md:grid-cols-3 ${textSecondary}`}
        >
          {content.useCases.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="font-mono text-xs font-semibold text-accent">
                0{index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${slug}-guide`}>
        <h2
          id={`${slug}-guide`}
          className={`font-serif text-2xl leading-tight ${textPrimary}`}
        >
          {guideHeading}
        </h2>
        <div className="mt-5 grid gap-x-8 gap-y-7 lg:grid-cols-2">
          {content.sections.map((section) => (
            <article
              key={section.heading}
              className={`border-t pt-5 ${ruleTone}`}
            >
              <h3 className={`font-serif text-xl leading-tight ${textPrimary}`}>
                {section.heading}
              </h3>
              <p className={`mt-3 text-sm leading-relaxed ${textSecondary}`}>
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby={`${slug}-faq`}
        className={`rounded-2xl border p-6 transition-all duration-300 ease-in-out sm:p-8 ${panelTone}`}
      >
        <div className="max-w-3xl">
          <h2
            id={`${slug}-faq`}
            className={`font-serif text-2xl leading-tight ${textPrimary}`}
          >
            {faqHeading}
          </h2>
          <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
            {copy.faqIntro}
          </p>
        </div>
        <div className="mt-5 divide-y divide-paper-300/70 dark:divide-gold-500/10">
          {content.faqs.map((faq) => (
            <details
              key={faq.heading}
              className="group py-4 first:pt-0 last:pb-0"
            >
              <summary
                className={`cursor-pointer list-none font-serif text-lg leading-snug ${textPrimary}`}
              >
                <span className="flex items-start justify-between gap-4">
                  <span>{faq.heading}</span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 text-xl leading-none text-accent transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className={`mt-3 text-sm leading-relaxed ${textSecondary}`}>
                {faq.body}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ToolSeoLandingSections;
