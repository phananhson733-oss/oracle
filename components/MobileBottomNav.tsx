// INPUT: react-router-dom Link/useLocation, lucide-react icons, useTheme/useLanguage from UIComponents, useLangPath hook.
// OUTPUT: Exports MobileBottomNav — a fixed bottom tab bar (icon + label + active highlight) shown only below md.
// POS: Mobile primary navigation; mirrors the 7 top-nav entries + t.nav.* + isActive logic. Update components/FOLDER.md when this file changes.

import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  Telescope,
  Activity,
  Users,
  MessageCircle,
  NotebookPen,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme, useLanguage } from "./UIComponents";
import { useLangPath } from "../hooks/useLangPath";

// Mirrors the 7 entries rendered by the desktop top nav in App.tsx.
// Labels reuse the existing t.nav.* keys (with English fallbacks). Icons are
// semantically matched: Activity (neutral pulse) for the Energy Timeline keeps
// the "loud vs quiet, not good vs bad" framing (no up=good TrendingUp valence).
const NAV_ITEMS: ReadonlyArray<{
  path: string;
  labelKey:
    | "dashboard"
    | "forecast"
    | "timeline"
    | "us"
    | "oracle"
    | "journal"
    | "wiki";
  fallback: string;
  icon: LucideIcon;
}> = [
  {
    path: "/dashboard",
    labelKey: "dashboard",
    fallback: "Birth",
    icon: Sparkles,
  },
  {
    path: "/forecast",
    labelKey: "forecast",
    fallback: "Transit",
    icon: Telescope,
  },
  {
    path: "/timeline",
    labelKey: "timeline",
    fallback: "Timeline",
    icon: Activity,
  },
  { path: "/us", labelKey: "us", fallback: "Synastry", icon: Users },
  { path: "/oracle", labelKey: "oracle", fallback: "Ask", icon: MessageCircle },
  {
    path: "/journal",
    labelKey: "journal",
    fallback: "Journal",
    icon: NotebookPen,
  },
  { path: "/wiki", labelKey: "wiki", fallback: "Wiki", icon: BookOpen },
];

export const MobileBottomNav: React.FC = () => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { langPath } = useLangPath();
  const location = useLocation();
  const isDark = theme === "dark";

  // Wiki lives under a language-prefixed path (/en/wiki, /zh/wiki/...), so its
  // active match is "starts with the lang-prefixed /wiki"; every other entry is
  // an exact pathname match — identical semantics to the desktop nav in App.tsx.
  const wikiHref = langPath("/wiki");
  const isWikiPath =
    location.pathname === wikiHref ||
    location.pathname.startsWith(`${wikiHref}/`) ||
    location.pathname === "/wiki" ||
    location.pathname.startsWith("/wiki/");

  const barClasses = isDark
    ? "bg-space-950/95 border-gold-500/15 text-star-200"
    : "bg-paper-100/95 border-paper-300 text-paper-600";

  return (
    <nav
      aria-label={language === "zh" ? "底部导航" : "Primary"}
      // z-[150] sits below the consent banner (z-[200]) so the banner — when
      // present — overlays and is never hidden by the tab bar. The banner's own
      // bottom padding + this bar's safe-area padding keep both usable.
      className={`md:hidden fixed bottom-0 left-0 right-0 z-[150] border-t backdrop-blur-md ${barClasses}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const to = item.path === "/wiki" ? wikiHref : item.path;
          const isActive =
            item.path === "/wiki"
              ? isWikiPath
              : location.pathname === item.path;
          const Icon = item.icon;
          const label = t.nav?.[item.labelKey] || item.fallback;
          return (
            <li key={item.path} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-inset ${
                  isActive
                    ? "text-gold-500"
                    : "opacity-70 hover:opacity-100 hover:text-gold-500"
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={isActive ? 2.4 : 1.8}
                  aria-hidden="true"
                />
                <span className="truncate max-w-full">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
