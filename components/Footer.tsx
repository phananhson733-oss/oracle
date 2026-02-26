// INPUT: Theme context and language context from UIComponents.
// OUTPUT: Exports Footer component with copyright, nav links, and contact info.
// POS: Global footer component; update components/FOLDER.md when this file changes.

import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme, useLanguage } from './UIComponents';

const FOOTER_LINKS = [
  { to: '/privacy', en: 'Privacy Policy', zh: '隐私政策' },
  { to: '/terms', en: 'Terms of Service', zh: '服务条款' },
  { to: '/cookies', en: 'Cookies', zh: 'Cookie 政策' },
  { to: '/about', en: 'About', zh: '关于我们' },
  { to: '/help', en: 'Help', zh: '帮助' },
] as const;

const CONTACT_EMAIL = 'support@astrologywiki.com';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  const contactLabel = language === 'zh' ? '联系我们' : 'Contact';

  return (
    <footer
      role="contentinfo"
      className={`
        border-t backdrop-blur-sm mt-auto
        ${isDark
          ? 'bg-space-950/80 border-gold-500/20'
          : 'bg-paper-100/80 border-paper-300'
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
                  to={link.to}
                  className={`
                    text-sm transition-colors
                    ${isDark
                      ? 'text-star-300 hover:text-gold-400'
                      : 'text-paper-500 hover:text-gold-700'
                    }
                  `}
                >
                  {language === 'zh' ? link.zh : link.en}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={`
                  text-sm transition-colors
                  ${isDark
                    ? 'text-star-300 hover:text-gold-400'
                    : 'text-paper-500 hover:text-gold-700'
                  }
                `}
              >
                {contactLabel}
              </a>
            </li>
          </ul>
        </nav>

        {/* Separator */}
        <div
          className={`
            w-16 h-px
            ${isDark ? 'bg-gold-500/30' : 'bg-gold-700/20'}
          `}
          aria-hidden="true"
        />

        {/* Copyright */}
        <p
          className={`
            text-xs tracking-wide
            ${isDark ? 'text-star-500' : 'text-paper-400'}
          `}
        >
          &copy; 2026 AstrologyWiki. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
