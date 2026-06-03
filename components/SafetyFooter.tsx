// INPUT: shared safety copy from utils/safetyFooter (single source of truth) +
//        i18n/theme via UIComponents.
// OUTPUT: SafetyFooter — the SPA-side render of the mandatory psych-adjacent
//         safety footer (clinical disclaimer + crisis helplines). Mirrors the
//         static stub's buildSafetyFooterHtml so JS users (who see the React
//         re-render, not the stub) get the SAME copy.
// POS: tool-led psych-adjacent compliance (CLAUDE.md AI 安全边界 #1/#4). Rendered
//      by WikiArticleDetailPage on psychAdjacent articles. If updated, sync
//      utils/safetyFooter.ts (the copy) + components/FOLDER.md.

import React from "react";
import { useLanguage, useTheme } from "./UIComponents";
import {
  SAFETY_FOOTER_COPY,
  SAFETY_CRISIS_LINES,
  crisisLineName,
  resolveSafetyLang,
} from "../utils/safetyFooter";

export const SafetyFooter: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const lang = resolveSafetyLang(language);
  const copy = SAFETY_FOOTER_COPY[lang];

  const cardBg = isDark ? "bg-space-900/40" : "bg-paper-100/70";
  const cardBorder = isDark ? "border-space-600/60" : "border-paper-300";
  const textMuted = isDark ? "text-star-300" : "text-paper-600";
  const linkColor = isDark
    ? "text-gold-400 hover:text-gold-300"
    : "text-gold-600 hover:text-gold-700";

  return (
    <aside
      role="note"
      aria-label={copy.aria}
      className={`safety-footer mt-10 rounded-xl border ${cardBorder} ${cardBg} p-5 text-sm ${textMuted}`}
    >
      <p className="leading-6">{copy.clinical_note}</p>
      <p className="mt-3 leading-6">{copy.disclaimer}</p>
      <p className="mt-3 leading-6">{copy.crisis_intro}</p>
      <ul className="mt-2 space-y-1">
        {SAFETY_CRISIS_LINES.map((line) => (
          <li key={line.url}>
            <a
              href={line.url}
              rel="noopener nofollow"
              target="_blank"
              className={`underline underline-offset-2 ${linkColor}`}
            >
              {crisisLineName(line, lang)}
            </a>
            {line.phone && (
              <>
                {" · "}
                <a
                  href={`tel:${line.phone.replace(/\s+/g, "")}`}
                  className={`underline underline-offset-2 ${linkColor}`}
                >
                  {line.phone}
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SafetyFooter;
