// INPUT: React、类型与常量依赖（含卡片基础样式、纸感映射与详情解读编号规范）。
// OUTPUT: 导出 UI 原语与上下文（含可调宽度的 Modal、Ask 报告对齐的详情解读布局与编号展示）。
// POS: 主应用基础组件库（含 light theme 纸感映射与详情解读编号化）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, {
  ReactNode,
  useState,
  createContext,
  useContext,
  useEffect,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Language, UserProfile, SectionDetailContent } from "../types";
import { TRANSLATIONS, ASTRO_DICTIONARY } from "../constants";
import { OracleLoading } from "./OracleLoading";
import { useAuth } from "../contexts/AuthContext";
import { trackEvent, setUserProperties } from "../services/analytics";
import { extractLangFromPath, stripLangPrefix } from "../hooks/useLangPath";

// --- Theme Context ---
export type Theme = "dark" | "light";

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("astro_theme") as Theme) || "dark",
  );
  useEffect(() => {
    document.body.className = `${theme} ${theme === "dark" ? "bg-space-950 text-star-50" : "bg-paper-100 text-paper-900"}`;
    localStorage.setItem("astro_theme", theme);
  }, [theme]);
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    trackEvent("theme_changed", { from_theme: theme, to_theme: next });
    setUserProperties({ theme: next });
  };
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// --- Language Context ---

export const translateAstroTerm = (text: string, lang: Language): string => {
  if (lang === "en" || !text) return text;

  // 首先尝试直接匹配（精确查找，适用于单个术语如 "Sun"、"Aries"）
  const exactMatch = ASTRO_DICTIONARY[text];
  if (exactMatch) {
    return exactMatch.zh;
  }

  // 如果没有精确匹配，进行正则替换（适用于句子中包含多个术语）
  let translated = text;
  const keys = Object.keys(ASTRO_DICTIONARY).sort(
    (a, b) => b.length - a.length,
  );
  keys.forEach((key) => {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    const dict = ASTRO_DICTIONARY[key];
    if (dict) {
      translated = translated.replace(regex, dict.zh);
    }
  });
  return translated;
};

export interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (typeof TRANSLATIONS)["en"];
  tl: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  toggleLanguage: () => {},
  t: TRANSLATIONS["en"],
  tl: (s) => s,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguage] = useState<Language>(() => {
    // URL prefix takes priority, then localStorage, then default 'en'
    const urlLang = extractLangFromPath(window.location.pathname);
    if (urlLang) {
      localStorage.setItem("astro_lang", urlLang);
      return urlLang;
    }
    return (localStorage.getItem("astro_lang") as Language) || "en";
  });

  // Sync language from URL prefix on route changes
  useEffect(() => {
    const urlLang = extractLangFromPath(location.pathname);
    if (urlLang && urlLang !== language) {
      setLanguage(urlLang);
      localStorage.setItem("astro_lang", urlLang);
    }
  }, [location.pathname, language]);

  const toggleLanguage = () => {
    const oldLang = language;
    const newLang = language === "zh" ? "en" : "zh";
    setLanguage(newLang);
    localStorage.setItem("astro_lang", newLang);
    trackEvent("language_changed", { from_lang: oldLang, to_lang: newLang });
    setUserProperties({ language: newLang });

    // If on a language-prefixed route, navigate to the equivalent URL with new lang
    const urlLang = extractLangFromPath(location.pathname);
    if (urlLang) {
      const barePath = stripLangPrefix(location.pathname);
      navigate(`/${newLang}${barePath}${location.search}${location.hash}`, {
        replace: true,
      });
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        toggleLanguage,
        t: TRANSLATIONS[language],
        tl: (s) => translateAstroTerm(s, language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export const useUserProfile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("astro_user");
    return saved ? JSON.parse(saved) : null;
  });
  useEffect(() => {
    if (user || !authUser?.birthProfile) return;
    if (localStorage.getItem("astro_profile_migrated") !== "1") return;
    const birth = authUser.birthProfile;
    if (!birth.birthDate || !birth.birthCity || !birth.timezone) return;
    const profile: UserProfile = {
      userId: authUser.id,
      name: authUser.name,
      birthDate: birth.birthDate,
      birthTime: birth.birthTime,
      birthCity: birth.birthCity,
      lat: birth.lat,
      lon: birth.lon,
      timezone: birth.timezone,
      accuracyLevel: birth.accuracyLevel || "exact",
      focusTags: authUser.preferences?.focusTags || [],
    };
    setUser(profile);
  }, [user, authUser]);
  const saveUser = (u: UserProfile | null) => {
    setUser(u);
    if (u) localStorage.setItem("astro_user", JSON.stringify(u));
    else localStorage.removeItem("astro_user");
  };
  return { user, saveUser };
};

// --- Design Tokens & styles (Linear Black x Gold) ---

const getStyles = (theme: Theme) => ({
  // Page Background
  container:
    theme === "dark"
      ? "bg-space-950 text-star-50"
      : "bg-paper-100 text-paper-900",

  // Cards (Frosted Surfaces)
  card:
    theme === "dark"
      ? "bg-space-900/60 border border-space-700/80 shadow-card backdrop-blur-lg"
      : "bg-paper-100/85 border border-paper-300/80 shadow-sm backdrop-blur",
  cardLeft:
    theme === "dark" ? "!border-l-space-700/40" : "!border-l-paper-300/40",
  cardAccent:
    theme === "dark" ? "before:bg-accent/60" : "before:bg-gold-500/50",
  // Interactive Elements Hover
  hover:
    theme === "dark"
      ? "hover:border-accent/50 hover:bg-space-900/70"
      : "hover:border-accent/40 hover:bg-paper-100/70",

  // Typography
  heading: theme === "dark" ? "text-star-50" : "text-paper-900",
  body: theme === "dark" ? "text-star-200" : "text-paper-600",
  muted: theme === "dark" ? "text-star-400" : "text-paper-400",

  // Borders - 使用温暖的金色调分割线
  divider: theme === "dark" ? "border-gold-500/15" : "border-paper-300",

  // Inputs
  input:
    theme === "dark"
      ? "bg-space-900/70 border border-gold-500/40 text-star-50 focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder-star-400/60"
      : "bg-paper-100/85 border border-paper-400 text-paper-900 focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder-paper-400",
});

// --- Layout & wrappers ---

export const Container: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-200 ${s.container}`}
    >
      {/* Simplified: Single subtle glow for depth */}
      {theme === "dark" && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/3 blur-[120px] rounded-full pointer-events-none" />
      )}

      <div
        className={`relative w-full max-w-7xl mx-auto min-h-screen px-4 md:px-8 py-8 md:py-16 pt-12 md:pt-12 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export const Section: React.FC<{
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}> = ({ title, children, className = "", action }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);

  return (
    <section className={`mb-12 ${className}`}>
      {title && (
        <div
          className={`flex justify-between items-end mb-6 pb-2 border-b ${s.divider}`}
        >
          <h2 className={`text-xl font-semibold tracking-tight ${s.heading}`}>
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
};

// --- Core Components ---

export const Card: React.FC<{
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  noPadding?: boolean;
}> = ({ children, onClick, className = "", noPadding = false }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);

  return (
    <div
      onClick={onClick}
      className={`
            rounded-2xl transition-all duration-300 ease-in-out
            ${s.card}
            ${onClick ? `cursor-pointer ${s.hover}` : ""}
            ${noPadding ? "" : "p-6"}
            ${className}
        `}
    >
      {children}
    </div>
  );
};

export const GlassInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
> = (props) => {
  const { theme } = useTheme();
  const s = getStyles(theme);
  const { error, className, ...restProps } = props;

  const inputClasses = `w-full min-h-[44px] px-5 py-4 rounded-xl outline-none transition-all duration-300 ease-in-out font-sans text-sm ${
    error
      ? theme === "dark"
        ? "bg-red-900/20 border-red-500/50 focus:border-red-500"
        : "bg-red-50 border-red-300 focus:border-red-500"
      : s.input
  } ${className || ""}`;

  const needsColorScheme =
    theme === "dark" &&
    (restProps.type === "date" || restProps.type === "time");

  return (
    <div className="relative group">
      <input
        {...restProps}
        className={inputClasses}
        {...(needsColorScheme
          ? {
              style: {
                ...((restProps.style as React.CSSProperties) || {}),
                colorScheme: "dark",
              },
            }
          : {})}
      />
      {error && (
        <p
          className={`mt-1 text-xs ${
            theme === "dark" ? "text-red-400" : "text-red-600"
          }`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export const ActionButton: React.FC<{
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}> = ({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  size = "md",
  ariaLabel,
}) => {
  const { theme } = useTheme();
  const focusRingOffset =
    theme === "dark"
      ? "focus-visible:ring-offset-space-950"
      : "focus-visible:ring-offset-paper-100";

  // 8pt Grid Heights - Mobile touch target minimum 44px
  const sizes = {
    sm: "h-8 min-h-[44px] md:min-h-0 px-3 text-xs", // 32px desktop, 44px mobile
    md: "h-10 min-h-[44px] md:min-h-0 px-4 text-sm", // 40px desktop, 44px mobile
    lg: "h-12 px-6 text-base", // 48px
  };

  const variants = {
    // Primary: Warm Milky Gold Gradient with DARK TEXT for contrast.
    primary:
      "bg-gradient-primary text-space-950 hover:opacity-95 font-semibold shadow-glow border border-transparent",

    // Secondary: Border + Hover Gold Tint
    secondary:
      theme === "dark"
        ? "bg-space-800/70 text-star-50 hover:bg-space-700/70 hover:border-accent/60 border border-gold-500/20"
        : "bg-paper-100/85 text-paper-900 hover:bg-paper-100 hover:border-accent/50 border border-paper-300",

    // Outline: Transparent + Border
    outline:
      theme === "dark"
        ? "bg-transparent text-star-50 border border-gold-500/20 hover:border-accent/60"
        : "bg-transparent text-paper-900 border border-paper-300 hover:border-accent/50",

    // Ghost: Text Only + Hover Background
    ghost:
      theme === "dark"
        ? "bg-transparent hover:bg-space-700/50 text-accent hover:text-accent-hover border-none shadow-none"
        : "bg-transparent hover:bg-paper-200/60 text-accent hover:text-accent-hover border-none shadow-none",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
            rounded-xl font-medium tracking-wide transition-all duration-300 ease-in-out
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${focusRingOffset}
            ${sizes[size]}
            ${variants[variant]}
            ${className}
        `}
    >
      {children}
    </button>
  );
};

export const Chip: React.FC<{
  label: string;
  selected?: boolean;
  onClick?: () => void;
  id?: string;
}> = ({ label, selected, onClick, id }) => {
  const { theme } = useTheme();

  const base =
    "px-3 py-1.5 min-h-[44px] md:min-h-0 rounded-lg text-xs font-medium transition-all border cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-space-950";

  const selectedStyle =
    "bg-accent/10 text-accent border-accent/70 font-semibold";
  const unselectedStyle =
    theme === "dark"
      ? "bg-transparent text-star-400 border-gold-500/20 hover:border-accent/50 hover:text-star-200"
      : "bg-transparent text-paper-400 border-paper-300 hover:border-accent/50 hover:text-paper-900";

  return (
    <button
      id={id}
      onClick={onClick}
      className={`${base} ${selected ? selectedStyle : unselectedStyle}`}
      aria-pressed={selected}
      role="switch"
    >
      {label}
    </button>
  );
};

export const Accordion: React.FC<{
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  id?: string;
}> = ({
  title,
  subtitle,
  children,
  defaultOpen = false,
  open,
  onToggle,
  id,
}) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const [hasOpened, setHasOpened] = useState(defaultOpen || !!open);
  const { theme } = useTheme();
  const s = getStyles(theme);

  // Generate stable IDs for ARIA
  const accordionId =
    id || `accordion-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const panelId = `${accordionId}-panel`;
  const buttonId = `${accordionId}-button`;

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  const handleToggle = () => {
    const nextOpen = !isOpen;
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    if (onToggle) onToggle(nextOpen);
  };

  return (
    <div
      className={`rounded-xl overflow-hidden mb-3 border transition-all duration-300 ease-in-out ${isOpen ? "border-accent/40" : s.divider} ${theme === "dark" ? "bg-space-900/40" : "bg-paper-100/70"}`}
    >
      <button
        id={buttonId}
        onClick={handleToggle}
        className="w-full flex justify-between items-center px-4 py-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <div>
          <h3
            className={`text-sm font-medium ${s.heading} group-hover:text-accent transition-colors`}
          >
            {title}
          </h3>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${s.muted}`}>{subtitle}</p>
          )}
        </div>
        <span
          className={`text-accent/60 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        hidden={!isOpen}
      >
        <div className="overflow-hidden">
          <div className={`px-4 pb-4 border-t ${s.divider}`}>
            <div className="pt-3">{hasOpened && children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TimelineCard: React.FC<{
  title: string;
  tags: string[];
  intensity: "low" | "med" | "high";
  dates: { start: string; peak: string; end: string };
  onClick?: () => void;
}> = ({ title, tags, intensity, dates, onClick }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);

  const intensityColor = {
    low: "bg-success", // Green
    med: "bg-accent", // Gold
    high: "bg-danger", // Red
  };

  return (
    <div
      onClick={onClick}
      className={`group relative pl-6 border-l ${theme === "dark" ? "border-gold-500/20 hover:border-accent" : "border-paper-300 hover:border-accent"} transition-colors cursor-pointer py-3`}
    >
      <div
        className={`absolute left-[-5px] top-5 w-2 h-2 rounded-full ${intensityColor[intensity]}`}
      />

      <div className="flex justify-between items-baseline mb-1 gap-2">
        <h3
          className={`text-base font-semibold ${s.heading} group-hover:text-accent transition-colors truncate min-w-0 flex-1`}
        >
          {title}
        </h3>
        <span
          className={`text-xs font-mono ${s.muted} whitespace-nowrap flex-shrink-0`}
        >
          {dates.start} — {dates.end}
        </span>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        {tags.map((t: string) => (
          <span
            key={t}
            className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded border truncate max-w-[120px] ${theme === "dark" ? "border-gold-500/20 text-star-400" : "border-paper-300 text-paper-400"}`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

// --- Visualization ---

export const ScoreBar: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);

  return (
    <div className="mb-3">
      <div
        className={`flex justify-between text-xs mb-1.5 font-medium uppercase tracking-widest ${s.muted}`}
      >
        <span>{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <div
        className={`h-1.5 w-full rounded-full overflow-hidden ${theme === "dark" ? "bg-gold-500/10" : "bg-paper-200"}`}
      >
        <div
          className={`h-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export const CopyButton: React.FC<{
  text: string;
  label?: string;
  contentType?: string;
}> = ({ text, label, contentType }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    trackEvent("share_button_clicked", {
      content_type: contentType || "text",
      method: "copy",
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 text-xs font-medium transition-colors hover:text-accent ${copied ? "text-success" : theme === "dark" ? "text-star-400" : "text-paper-400"}`}
    >
      <span className="text-sm">{copied ? "✓" : "Copy"}</span>
      {label && !copied && <span>{label}</span>}
    </button>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  ariaLabel?: string;
}> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  bodyClassName = "",
  ariaLabel,
}) => {
  const { theme } = useTheme();
  const s = getStyles(theme);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  // Handle body scroll lock and focus management
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      // Focus the modal container
      setTimeout(() => modalRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "unset";
      // Restore focus to previous element
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
    >
      <div
        className="absolute inset-0 bg-space-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] rounded-2xl shadow-2xl z-10 animate-slide-up border ${s.divider} ${theme === "dark" ? "bg-space-900" : "bg-paper-100/85"} ${className} focus:outline-none`}
      >
        <div
          className={`sticky top-0 z-20 grid grid-cols-[40px_1fr_40px] items-center px-6 py-4 border-b ${s.divider} backdrop-blur-md ${theme === "dark" ? "bg-space-900/80" : "bg-paper-100/80"}`}
        >
          <div></div>
          {title && (
            <h2
              id="modal-title"
              className={`text-2xl font-semibold text-center ${s.heading}`}
            >
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={`w-8 h-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center justify-self-end rounded-lg transition-all duration-300 ease-in-out ${s.muted} ${theme === "dark" ? "hover:bg-space-800/60" : "hover:bg-paper-200/60"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className={`p-6 ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
};

// --- Detail Modal (全屏详情解读页面，CBT风格) ---

// 清理 Markdown 格式符号
const cleanMarkdownText = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\*\*\*/g, "") // 移除 ***
    .replace(/\*\*/g, "") // 移除 **
    .replace(/__/g, "") // 移除 __
    .replace(/\*([^*]+)\*/g, "$1") // 移除 *text*
    .replace(/_([^_]+)_/g, "$1") // 移除 _text_
    .replace(/`([^`]+)`/g, "$1") // 移除 `code`
    .replace(/^#+\s*/gm, "") // 移除 # 标题符号
    .replace(/^[-*+]\s+/gm, "• ") // 转换列表符号
    .trim();
};

type MarkdownSection = {
  type: "heading" | "paragraph" | "list";
  content: string;
  items?: string[];
};

// 将 Markdown 文本转换为结构化段落
const parseMarkdownSections = (text: string): MarkdownSection[] => {
  if (!text) return [];
  const sections: MarkdownSection[] = [];
  const lines = text.split("\n");
  let currentParagraph = "";
  let currentList: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      sections.push({
        type: "paragraph",
        content: cleanMarkdownText(currentParagraph.trim()),
      });
      currentParagraph = "";
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({
        type: "list",
        content: "",
        items: currentList.map(cleanMarkdownText),
      });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 标题
    if (/^#{1,3}\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      sections.push({
        type: "heading",
        content: cleanMarkdownText(trimmed.replace(/^#+\s*/, "")),
      });
    }
    // 列表项
    else if (
      /^[-*+]\s+/.test(trimmed) ||
      /^\d+\.\s+/.test(trimmed) ||
      /^•\s+/.test(trimmed)
    ) {
      flushParagraph();
      currentList.push(
        trimmed
          .replace(/^[-*+]\s+/, "")
          .replace(/^\d+\.\s+/, "")
          .replace(/^•\s+/, ""),
      );
    }
    // 空行
    else if (!trimmed) {
      flushParagraph();
      flushList();
    }
    // 普通段落
    else {
      if (currentList.length > 0) {
        flushList();
      }
      currentParagraph += (currentParagraph ? " " : "") + trimmed;
    }
  }

  flushParagraph();
  flushList();

  return sections;
};

const groupMarkdownByHeading = (
  sections: MarkdownSection[],
  fallbackHeading: string,
) => {
  const blocks: Array<{ heading: string; nodes: MarkdownSection[] }> = [];
  let currentHeading = "";
  let currentNodes: MarkdownSection[] = [];

  const flushBlock = () => {
    if (!currentNodes.length) return;
    blocks.push({
      heading: currentHeading || fallbackHeading,
      nodes: currentNodes,
    });
    currentHeading = "";
    currentNodes = [];
  };

  sections.forEach((section) => {
    if (section.type === "heading") {
      flushBlock();
      currentHeading = section.content;
      return;
    }
    currentNodes.push(section);
  });

  flushBlock();
  return blocks;
};

export interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  error?: string | null;
  content?: SectionDetailContent | null;
  keyPointsLabel?: string;
  onRetry?: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  open,
  onClose,
  title,
  loading,
  error,
  content,
  keyPointsLabel,
  onRetry,
}) => {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const isLight = theme === "light";

  // --- Styles & Icons (Aligned with Ask Oracle) ---
  const containerTone = isLight ? "bg-paper-100" : "bg-space-950";
  const headingTone = isLight ? "text-paper-900" : "text-star-50";
  const mutedTextTone = isLight ? "text-paper-500" : "text-star-400";

  const cardStyles = [
    {
      accent: "border-l-gold-500/40",
      title: theme === "dark" ? "text-gold-200" : "text-gold-700",
      badge:
        theme === "dark"
          ? "border-gold-500/30 bg-gold-500/10 text-gold-400"
          : "border-gold-600/40 bg-gold-500/15 text-gold-700",
      highlight: theme === "dark" ? "text-gold-300" : "text-gold-700",
      dot: theme === "dark" ? "bg-gold-500/50" : "bg-gold-600/60",
      divider: theme === "dark" ? "border-gold-500/20" : "border-gold-600/25",
      iconTone:
        theme === "dark"
          ? "border-gold-500/30 bg-space-950 text-gold-500"
          : "border-gold-600/40 bg-paper-100/85 text-gold-700",
      icon: "star",
    },
    {
      accent: "border-l-accent/40",
      title: "text-accent",
      badge:
        theme === "dark"
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-accent/30 bg-accent/10 text-accent",
      highlight: "text-accent",
      dot: theme === "dark" ? "bg-accent/50" : "bg-accent/60",
      divider: theme === "dark" ? "border-accent/20" : "border-accent/30",
      iconTone:
        theme === "dark"
          ? "border-accent/30 bg-space-950 text-accent"
          : "border-accent/30 bg-paper-100/85 text-accent",
      icon: "eye",
    },
    {
      accent: "border-l-star-200/40",
      title: theme === "dark" ? "text-star-200" : "text-gold-700",
      badge:
        theme === "dark"
          ? "border-star-200/30 bg-star-200/10 text-star-200"
          : "border-gold-600/30 bg-gold-500/10 text-gold-700",
      highlight: theme === "dark" ? "text-star-200" : "text-gold-700",
      dot: theme === "dark" ? "bg-star-200/50" : "bg-gold-600/50",
      divider: theme === "dark" ? "border-star-200/20" : "border-gold-600/20",
      iconTone:
        theme === "dark"
          ? "border-star-200/30 bg-space-950 text-star-200"
          : "border-gold-600/30 bg-paper-100/85 text-gold-700",
      icon: "compass",
    },
    {
      accent: "border-l-success/40",
      title: "text-success",
      badge:
        theme === "dark"
          ? "border-success/30 bg-success/10 text-success"
          : "border-success/30 bg-success/10 text-success",
      highlight: "text-success",
      dot: theme === "dark" ? "bg-success/50" : "bg-success/60",
      divider: theme === "dark" ? "border-success/20" : "border-success/30",
      iconTone:
        theme === "dark"
          ? "border-success/30 bg-space-950 text-success"
          : "border-success/30 bg-paper-100/85 text-success",
      icon: "moon",
    },
    {
      accent: "border-l-gold-400/40",
      title: theme === "dark" ? "text-gold-200" : "text-gold-700",
      badge:
        theme === "dark"
          ? "border-gold-400/30 bg-gold-400/10 text-gold-300"
          : "border-gold-600/30 bg-gold-500/10 text-gold-700",
      highlight: theme === "dark" ? "text-gold-300" : "text-gold-700",
      dot: theme === "dark" ? "bg-gold-400/50" : "bg-gold-600/50",
      divider: theme === "dark" ? "border-gold-400/20" : "border-gold-600/20",
      iconTone:
        theme === "dark"
          ? "border-gold-400/30 bg-space-950 text-gold-400"
          : "border-gold-600/30 bg-paper-100/85 text-gold-700",
      icon: "star",
    },
  ];

  const IconStar = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconEye = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconCompass = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconMoon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <path
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "eye":
        return <IconEye />;
      case "compass":
        return <IconCompass />;
      case "moon":
        return <IconMoon />;
      default:
        return <IconStar />;
    }
  };

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  // Loading State - Fullscreen with OracleLoading
  if (loading) {
    return (
      <div className={`fixed inset-0 z-[200] flex flex-col ${containerTone}`}>
        <OracleLoading
          phrases={[
            t.detail.generating || "Generating insights...",
            language === "zh"
              ? "深度分析星盘数据..."
              : "Analyzing chart data...",
            language === "zh"
              ? "解读星象奥秘..."
              : "Decoding celestial patterns...",
          ]}
          thinkingLabel={t.common.analyzing || "Analyzing"}
          className="flex-1"
        />
        {/* Back Button Overlay */}
        <button
          onClick={onClose}
          className={`fixed top-6 left-6 z-[210] flex items-center gap-3 transition-all font-bold group ${mutedTextTone} hover:text-gold-400`}
        >
          <div
            className={`p-2 rounded-xl transition-all ${isLight ? "bg-paper-100/85 border border-paper-300 group-hover:bg-paper-200" : "bg-space-900/60 group-hover:bg-gold-500/20"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </div>
          <span className="text-sm uppercase tracking-widest">
            {t.common.back || "BACK"}
          </span>
        </button>
      </div>
    );
  }

  const interpretationSections = content?.interpretation
    ? parseMarkdownSections(content.interpretation)
    : [];
  const interpretationBlocks = groupMarkdownByHeading(
    interpretationSections,
    t.detail.interpretation || "Interpretation",
  );

  // --- Render Logic ---

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col overflow-hidden animate-fade-in ${containerTone}`}
    >
      {/* Sticky Header */}
      <div
        className={`sticky top-0 z-20 px-6 py-4 flex items-center gap-4 border-b ${isLight ? "bg-paper-100/95 border-paper-300/50 backdrop-blur" : "bg-space-950/95 border-gold-500/10 backdrop-blur"}`}
      >
        <button
          onClick={onClose}
          className={`flex items-center gap-3 transition-all font-bold group ${mutedTextTone} hover:text-gold-400`}
        >
          <div
            className={`p-2 rounded-xl transition-all ${isLight ? "bg-paper-200 border border-paper-300 group-hover:bg-paper-300" : "bg-space-900/60 group-hover:bg-gold-500/20"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </div>
          <span className="text-sm uppercase tracking-widest">
            {t.common.back || "BACK"}
          </span>
        </button>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border max-w-[60vw] ${isLight ? "border-gold-500/30 bg-gold-500/10 text-gold-700" : "border-gold-500/30 bg-gold-500/10 text-gold-400"}`}
        >
          <span className="text-xs font-semibold tracking-wide truncate">
            {title}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 relative">
          {/* Background Silhouette */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.015]"
              viewBox="0 0 800 800"
              preserveAspectRatio="xMidYMid slice"
            >
              <circle
                cx="400"
                cy="400"
                r="350"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.5"
              />
              <circle
                cx="400"
                cy="400"
                r="280"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.3"
              />
              <circle
                cx="400"
                cy="400"
                r="200"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.2"
              />
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="400"
                  y1="50"
                  x2="400"
                  y2="120"
                  stroke="#D4AF37"
                  strokeWidth="0.3"
                  transform={`rotate(${i * 30} 400 400)`}
                />
              ))}
            </svg>
          </div>

          {/* Error State */}
          {!loading && error && (
            <div className="relative z-10 flex flex-col items-center justify-center py-20 text-center">
              <div className="text-danger mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
              </div>
              <p className={`text-lg font-medium mb-2 ${headingTone}`}>
                {t.common.error || "Error"}
              </p>
              <p className={`text-sm mb-6 ${mutedTextTone}`}>{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`px-6 py-2 rounded-full border ${isLight ? "border-gold-500/30 text-gold-700 hover:bg-gold-500/10" : "border-gold-500/30 text-gold-400 hover:bg-gold-500/10"}`}
                >
                  {t.common.retry}
                </button>
              )}
            </div>
          )}

          {/* Content Display */}
          {!loading && !error && content && (
            <div className="relative z-10 space-y-5">
              {/* 1. Summary Card (Gold Style) */}
              {(content.title || content.summary) && (
                <Card
                  className={`relative overflow-hidden transition-all duration-300 border border-l ${cardStyles[0].accent} ${theme === "dark" ? "hover:shadow-lg hover:shadow-gold-500/5" : "hover:shadow-sm"}`}
                >
                  <div
                    className={`flex items-center gap-4 mb-4 pb-3 border-b ${cardStyles[0].divider}`}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${cardStyles[0].iconTone}`}
                    >
                      {renderIcon("star")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] rounded-full border ${cardStyles[0].badge}`}
                        >
                          {language === "zh" ? "核心" : "ESSENCE"}
                        </span>
                        {content.title && (
                          <h4
                            className={`text-base md:text-lg font-serif font-semibold ${cardStyles[0].title}`}
                          >
                            {cleanMarkdownText(content.title)}
                          </h4>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pl-14">
                    <p
                      className={`text-sm leading-relaxed ${isLight ? "text-paper-700" : "text-star-200"}`}
                    >
                      {cleanMarkdownText(content.summary || "")}
                    </p>
                  </div>
                </Card>
              )}

              {/* 2. Highlights Card (Accent/Eye Style) */}
              {content.highlights && content.highlights.length > 0 && (
                <Card
                  className={`relative overflow-hidden transition-all duration-300 border border-l ${cardStyles[1].accent} ${theme === "dark" ? "hover:shadow-lg hover:shadow-accent/5" : "hover:shadow-sm"}`}
                >
                  <div
                    className={`flex items-center gap-4 mb-4 pb-3 border-b ${cardStyles[1].divider}`}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${cardStyles[1].iconTone}`}
                    >
                      {renderIcon("eye")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] rounded-full border ${cardStyles[1].badge}`}
                        >
                          {keyPointsLabel ||
                            (language === "zh" ? "重点" : "KEY POINTS")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pl-14 space-y-3">
                    {content.highlights.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div
                          className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${cardStyles[1].dot}`}
                        />
                        <p
                          className={`text-sm leading-relaxed ${isLight ? "text-paper-700" : "text-star-200"}`}
                        >
                          {cleanMarkdownText(item)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 3. Interpretation Blocks (Varied Styles) */}
              {interpretationBlocks.map((block, idx) => {
                // Use varied styles starting from index 2 (Compass) to cycle through
                const styleIdx = (idx % 3) + 2; // Styles 2, 3, 4
                const style =
                  cardStyles[styleIdx < cardStyles.length ? styleIdx : 2];
                const iconName =
                  styleIdx === 2 ? "compass" : styleIdx === 3 ? "moon" : "star";

                return (
                  <div
                    key={idx}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <Card
                      className={`relative overflow-hidden transition-all duration-300 border border-l ${style.accent} ${theme === "dark" ? "hover:shadow-lg" : "hover:shadow-sm"}`}
                    >
                      <div
                        className={`flex items-center gap-4 mb-4 pb-3 border-b ${style.divider}`}
                      >
                        <div
                          className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${style.iconTone}`}
                        >
                          {renderIcon(iconName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] rounded-full border ${style.badge}`}
                            >
                              {language === "zh"
                                ? `层级 ${idx + 1}`
                                : `LAYER ${idx + 1}`}
                            </span>
                            <h4
                              className={`text-base md:text-lg font-serif font-semibold ${style.title}`}
                            >
                              {block.heading}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="pl-14 space-y-4">
                        {block.nodes.map((node, nodeIdx) => {
                          if (node.type === "list" && node.items) {
                            return (
                              <div key={nodeIdx} className="space-y-3">
                                {node.items.map((item, itemIdx) => (
                                  <div
                                    key={itemIdx}
                                    className="flex gap-3 items-start"
                                  >
                                    <div
                                      className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${style.dot}`}
                                    />
                                    <p
                                      className={`text-sm leading-relaxed ${isLight ? "text-paper-700" : "text-star-200"}`}
                                    >
                                      {item}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <p
                              key={nodeIdx}
                              className={`text-sm leading-relaxed ${isLight ? "text-paper-700" : "text-star-200"}`}
                            >
                              {node.content}
                            </p>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                );
              })}

              {/* Footer / Conclusion */}
              {content && (
                <div
                  className={`mt-8 pt-6 border-t ${isLight ? "border-gold-600/10" : "border-gold-500/10"}`}
                >
                  <Card
                    className={`text-center py-8 ${isLight ? "bg-gradient-to-b from-paper-100 to-paper-100/80 border-gold-600/20" : "bg-gradient-to-b from-space-900 to-space-950 border-gold-500/20"}`}
                  >
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div
                        className={`w-12 h-px ${isLight ? "bg-gold-600/30" : "bg-gold-500/30"}`}
                      />
                      {renderIcon("star")}
                      <div
                        className={`w-12 h-px ${isLight ? "bg-gold-600/30" : "bg-gold-500/30"}`}
                      />
                    </div>
                    <div
                      className={`text-xs uppercase tracking-[0.3em] mb-3 ${isLight ? "text-gold-600/50" : "text-gold-500/50"}`}
                    >
                      {t.ask.oracle_complete || "COMPLETED"}
                    </div>
                    <button
                      onClick={onClose}
                      className={`px-8 py-2 rounded-full border transition-all ${isLight ? "border-gold-500/30 text-gold-700 hover:bg-gold-500/10" : "border-gold-500/30 text-gold-400 hover:bg-gold-500/10"}`}
                    >
                      {t.journal?.return_to_stars ||
                        (language === "zh" ? "返回" : "Return")}
                    </button>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Section Header with Detail Button ---

export interface SectionHeaderProps {
  title: string;
  onDetailClick?: () => void;
  showDetailButton?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onDetailClick,
  showDetailButton = true,
  className = "",
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h3
        className={`text-sm font-bold uppercase tracking-widest ${theme === "dark" ? "text-gold-500" : "text-accent"}`}
      >
        {title}
      </h3>
      {showDetailButton && onDetailClick && (
        <button
          onClick={onDetailClick}
          className={`text-xs px-3 py-1.5 rounded-md border transition-all duration-200 ${
            theme === "dark"
              ? "border-accent/40 text-accent hover:bg-accent/10 hover:border-accent/70"
              : "border-accent/40 text-accent hover:bg-accent/5 hover:border-accent/60"
          }`}
        >
          {t.detail.view_detail}
        </button>
      )}
    </div>
  );
};
