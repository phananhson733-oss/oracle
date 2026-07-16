// INPUT: Shared Saturn Return landing-page content model and application theme.
// OUTPUT: English-only SEO sections with brief-aligned copy, fifteen H3s, ten FAQs, and live tool links.
// POS: SPA renderer for the Saturn Return source-of-truth content; keep static rendering in data/saturnReturnLandingContent.js aligned.

import React from "react";
import { saturnReturnLandingContent } from "../data/saturnReturnLandingContent.js";

interface SaturnReturnLandingSectionsProps {
  isDark: boolean;
}

export const SaturnReturnLandingSections: React.FC<
  SaturnReturnLandingSectionsProps
> = ({ isDark }) => {
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-600";
  const panelTone = isDark
    ? "border-gold-500/15 bg-space-900/45"
    : "border-paper-300/80 bg-paper-100/70";
  const ruleTone = isDark ? "border-gold-500/10" : "border-paper-300/80";
  const renderInlineLink = (
    text: string,
    link?: { label: string; href: string },
  ) => {
    if (!link) return text;
    const [before, after] = text.split(link.label);
    if (after === undefined) return text;
    return (
      <>
        {before}
        <a className="text-accent underline hover:text-accent-hover" href={link.href}>
          {link.label}
        </a>
        {after}
      </>
    );
  };

  const linkFor = (
    item: { links?: Array<Record<string, string | number>> },
    field: "paragraph" | "bullet",
    index: number,
  ) =>
    item.links?.find((link) => link[field] === index) as
      | { label: string; href: string }
      | undefined;

  return (
    <div className="mt-16 space-y-12 border-t border-paper-300/80 pt-10 dark:border-gold-500/10">
      {saturnReturnLandingContent.sections.map((section) => (
        <section key={section.heading} aria-labelledby={`saturn-${section.heading}`}>
          <h2
            id={`saturn-${section.heading}`}
            className={`font-serif text-2xl leading-tight ${textPrimary}`}
          >
            {section.heading}
          </h2>

          {section.intro?.map((paragraph) => (
            <p
              key={paragraph}
              className={`mt-4 max-w-4xl text-sm leading-relaxed ${textSecondary}`}
            >
              {paragraph}
            </p>
          ))}

          {section.items.length > 0 && (
            <div className="mt-5 grid gap-x-8 gap-y-7 lg:grid-cols-3">
              {section.items.map((item) => (
                <article
                  key={item.heading}
                  className={`border-t pt-5 ${ruleTone}`}
                >
                  <h3
                    className={`font-serif text-xl leading-tight ${textPrimary}`}
                  >
                    {item.heading}
                  </h3>
                  {item.paragraphs?.map((paragraph, index) => (
                    <p
                      key={paragraph}
                      className={`mt-3 text-sm leading-relaxed ${textSecondary}`}
                    >
                      {renderInlineLink(
                        paragraph,
                        linkFor(item, "paragraph", index),
                      )}
                    </p>
                  ))}
                  {item.bullets?.length ? (
                    <ul
                      className={`mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed ${textSecondary}`}
                    >
                      {item.bullets.map((bullet, index) => (
                        <li key={bullet}>
                          {renderInlineLink(
                            bullet,
                            linkFor(item, "bullet", index),
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.table && (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-paper-300/80 dark:border-gold-500/10">
                      <table className="w-full min-w-[32rem] text-left text-sm">
                        <thead className="bg-paper-200/70 text-xs uppercase tracking-wide text-paper-600 dark:bg-space-900/60 dark:text-star-200">
                          <tr>
                            {item.table.columns.map((column) => (
                              <th key={column} scope="col" className="px-4 py-3 font-mono font-semibold">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${ruleTone}`}>
                          {item.table.rows.map(([sign, domain]) => (
                            <tr key={sign}>
                              <th scope="row" className={`px-4 py-3 font-serif font-medium ${textPrimary}`}>
                                {sign}
                              </th>
                              <td className={`px-4 py-3 leading-relaxed ${textSecondary}`}>
                                {domain}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {section.heading === "Frequently Asked Questions" && (
            <div className={`mt-5 rounded-2xl border p-6 sm:p-8 ${panelTone}`}>
              <div className="divide-y divide-paper-300/70 dark:divide-gold-500/10">
                {saturnReturnLandingContent.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group py-4 first:pt-0 last:pb-0"
                  >
                    <summary
                      className={`cursor-pointer list-none font-serif text-lg leading-snug ${textPrimary}`}
                    >
                      <span className="flex items-start justify-between gap-4">
                        <span>{faq.question}</span>
                        <span
                          aria-hidden="true"
                          className="mt-0.5 text-xl leading-none text-accent transition-transform duration-300 group-open:rotate-45"
                        >
                          +
                        </span>
                      </span>
                    </summary>
                    <p className={`mt-3 text-sm leading-relaxed ${textSecondary}`}>
                      {renderInlineLink(faq.answer, faq.links?.[0])}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}

      <section aria-labelledby="saturn-related-tools">
        <h2
          id="saturn-related-tools"
          className={`font-serif text-2xl leading-tight ${textPrimary}`}
        >
          {saturnReturnLandingContent.relatedToolsHeading}
        </h2>
        <nav className="mt-5" aria-label="Other free astrology calculators">
        <div className="grid gap-4 md:grid-cols-3">
          {saturnReturnLandingContent.relatedTools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className={`saturn-related-tool rounded-2xl border p-6 transition-all duration-300 ease-in-out hover:border-accent/35 hover:shadow-xl ${panelTone}`}
            >
              <p className="font-mono text-xs font-semibold text-accent">
                Free tool
              </p>
              <p className={`mt-3 font-serif text-xl leading-tight ${textPrimary}`}>
                {tool.label}
              </p>
              <p className={`mt-3 text-sm leading-relaxed ${textSecondary}`}>
                {tool.description}
              </p>
              <span className="mt-5 inline-block text-sm font-semibold text-accent underline-offset-4 transition-colors hover:text-accent-hover hover:underline">
                {tool.cta} →
              </span>
            </a>
          ))}
        </div>
        </nav>
      </section>
    </div>
  );
};

export default SaturnReturnLandingSections;
