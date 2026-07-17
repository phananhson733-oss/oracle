// INPUT: Theme context and language context from UIComponents.
// OUTPUT: Exports Footer component with copyright, nav links, contact info, and external brand links.
// POS: Global footer component; update components/FOLDER.md when this file changes.

import React from "react";
import { Link } from "react-router-dom";
import { useTheme, useLanguage } from "./UIComponents";
import { useLangPath } from "../hooks/useLangPath";
import { openConsentPreferences } from "../services/adConsentBus";

const FOOTER_LINKS = [
  { to: "/tools", en: "Tools", zh: "工具" },
  { to: "/privacy", en: "Privacy Policy", zh: "隐私政策" },
  { to: "/terms", en: "Terms of Service", zh: "服务条款" },
  { to: "/cookies", en: "Cookies", zh: "Cookie 政策" },
  { to: "/about", en: "About", zh: "关于我们" },
  { to: "/help", en: "Help", zh: "帮助" },
] as const;

// 外部品牌链接。rel 含 nofollow：这些页面回链本站时均为 nofollow/ugc（cal.com 与 magic.ly
// 实测 rel="nofollow ugc" / rel="nofollow"），故本站亦不传递权重，仅作访客入口。
const EXTERNAL_LINKS = [
  {
    href: "https://cal.com/yuitea-ciy4f2",
    en: "Book a Consultation",
    zh: "预约咨询",
  },
  {
    href: "https://share.evernote.com/note/1047b9da-bdde-425c-b40d-bdc775f6cf54",
    en: "Yuitea",
    zh: "Yuitea",
  },
  {
    href: "https://magic.ly/Yuitea",
    en: "Links",
    zh: "链接",
  },
] as const;

const CONTACT_EMAIL = "support@astrologywiki.com";

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { langPath } = useLangPath();
  const isDark = theme === "dark";

  const contactLabel = language === "zh" ? "联系我们" : "Contact";
  // CCPA/CPRA 要求可见、清晰标注的 opt-out 入口（评审 B3）。点后打开同意偏好弹窗。
  const privacyChoicesLabel =
    language === "zh"
      ? "隐私选择 (Your Privacy Choices)"
      : "Your Privacy Choices";

  return (
    <footer
      role="contentinfo"
      className={`
        border-t backdrop-blur-sm mt-auto
        ${
          isDark
            ? "bg-space-950/80 border-gold-500/20"
            : "bg-paper-100/80 border-paper-300"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center gap-6">
        {/* Navigation links */}
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={langPath(link.to)}
                  className={`
                    text-sm transition-colors
                    ${
                      isDark
                        ? "text-star-300 hover:text-gold-400"
                        : "text-paper-500 hover:text-gold-700"
                    }
                  `}
                >
                  {language === "zh" ? link.zh : link.en}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={`
                  text-sm transition-colors
                  ${
                    isDark
                      ? "text-star-300 hover:text-gold-400"
                      : "text-paper-500 hover:text-gold-700"
                  }
                `}
              >
                {contactLabel}
              </a>
            </li>
            {EXTERNAL_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="nofollow noopener"
                  className={`
                    text-sm transition-colors
                    ${
                      isDark
                        ? "text-star-300 hover:text-gold-400"
                        : "text-paper-500 hover:text-gold-700"
                    }
                  `}
                >
                  {language === "zh" ? link.zh : link.en}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={openConsentPreferences}
                className={`
                  text-sm transition-colors bg-transparent border-none cursor-pointer p-0
                  ${
                    isDark
                      ? "text-star-300 hover:text-gold-400"
                      : "text-paper-500 hover:text-gold-700"
                  }
                `}
              >
                {privacyChoicesLabel}
              </button>
            </li>
          </ul>
        </nav>

        {/* Separator */}
        <div
          className={`
            w-16 h-px
            ${isDark ? "bg-gold-500/30" : "bg-gold-700/20"}
          `}
          aria-hidden="true"
        />

        {/* Copyright */}
        <p
          className={`
            text-xs tracking-wide
            ${isDark ? "text-star-500" : "text-paper-400"}
          `}
        >
          &copy; 2026 AstrologyWiki. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
