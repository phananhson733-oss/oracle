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
import {
  THEME_META_COLORS,
  readStoredTheme,
  writeStoredTheme,
} from "../services/themeStorage";
import { extractLangFromPath, stripLangPrefix } from "../hooks/useLangPath";
import {
  groupLlmBlocks,
  normalizeLlmText,
  toPlainText,
} from "../services/llmText";
import { LlmDoc, LlmList, LlmProse, LlmSection } from "./llm/LlmDoc";

// --- Theme Context ---
export type Theme = "dark" | "light";

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext);

// 主题类名成对镜像 index.html 的 pre-paint 脚本与静态 body class；改动需三处同步。
const THEME_BODY_CLASSES: Record<Theme, readonly string[]> = {
  light: ["light", "bg-paper-100", "text-paper-900"],
  dark: ["dark", "bg-space-950", "text-star-50"],
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 读写统一走 services/themeStorage（严格归一化 + storage 禁用防护）；
  // light 是品牌默认（与 index.html pre-paint 脚本一致）。
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  useEffect(() => {
    // classList 手术式增删而非整串覆写：保住 body 上的 loading-fonts/fonts-loaded
    // 首帧可见性闸门与 selection:* 类（整串覆写会在字体就绪前拆掉闸门）。
    const c = document.body.classList;
    c.remove(...THEME_BODY_CLASSES.light, ...THEME_BODY_CLASSES.dark);
    c.add(...THEME_BODY_CLASSES[theme]);
    // 浏览器 chrome 颜色跟随主题（paper / night-sky），与 index.html 静态值保持同步。
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", THEME_META_COLORS[theme]);
    }
  }, [theme]);
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    // 只在显式切换时持久化：挂载 effect 里无条件 setItem 会让首访就写入
    // "light"，摧毁 v2 键「显式选择」的语义（那正是弃用旧键的原因）。
    writeStoredTheme(next);
    // theme_key/default_theme 标记 v2 键迁移与品牌默认翻转，供分析侧区分
    // 「新默认」与「用户显式选择」两个时代的数据（默认翻转日 2026-07）。
    trackEvent("theme_changed", {
      from_theme: theme,
      to_theme: next,
      theme_key: "v2",
      default_theme: "light",
    });
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
  /**
   * Explicitly set the active language. Used by route components that derive
   * language from a URL segment outside the standard `/[en|zh]/*` prefix
   * (e.g. the static-prerendered `/landing-v2/{en,zh}/` routes), so SPA
   * hydration matches the prerendered HTML's lang/canonical/robots.
   */
  setLanguage: (lang: Language) => void;
  t: (typeof TRANSLATIONS)["en"];
  tl: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  toggleLanguage: () => {},
  setLanguage: () => {},
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

  const setLanguageExplicit = (newLang: Language) => {
    if (newLang !== language) {
      setLanguage(newLang);
      localStorage.setItem("astro_lang", newLang);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        toggleLanguage,
        setLanguage: setLanguageExplicit,
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
    // Hydrate from the account on ANY device. The account birthProfile is the
    // source of truth once signed in; the old `astro_profile_migrated` gate was
    // device-local localStorage, so a second device (e.g. mobile after web)
    // never had it set and refused to show the cloud profile that exists.
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

// --- Design Tokens & styles (Editorial Paper x Ink，见 COLOR_SYSTEM_GUIDE.md) ---
// 发丝线（ink/warm-white 低透明度 border）是主力分隔件；默认无阴影、无毛玻璃。

const getStyles = (theme: Theme) => ({
  // Page Background
  container:
    theme === "dark"
      ? "bg-space-950 text-star-50"
      : "bg-paper-100 text-paper-900",

  // Cards (print-flat surfaces, hairline border)
  card:
    theme === "dark"
      ? "bg-space-900/70 border border-star-50/10"
      : "bg-paper-50/80 border border-paper-900/10",
  // Interactive Elements Hover
  hover:
    theme === "dark"
      ? "hover:border-accent/40 hover:bg-space-900"
      : "hover:border-accent/40 hover:bg-paper-50",

  // Typography
  heading: theme === "dark" ? "text-star-50" : "text-paper-900",
  body: theme === "dark" ? "text-star-200" : "text-paper-600",
  muted: theme === "dark" ? "text-star-400" : "text-paper-400",

  // Borders - 发丝分隔线（墨 / 暖白低透明度）
  divider: theme === "dark" ? "border-star-50/15" : "border-paper-900/15",

  // Inputs
  input:
    theme === "dark"
      ? "bg-space-900/70 border border-star-50/20 text-star-50 focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder-star-400/60"
      : "bg-paper-50/70 border border-paper-900/20 text-paper-900 focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder-paper-400",
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
    // Primary: 实心墨按钮（编辑部签名件）。bg-star-50/text-space-950 走 CSS 变量，
    // light = 墨底纸字，dark = 暖白底夜空字，双模式自动反转；mono 大写字距是排字指纹。
    primary:
      "bg-star-50 text-space-950 hover:opacity-90 font-mono font-medium uppercase tracking-[0.12em] border border-transparent",

    // Secondary: 发丝线描边 + hover 底面微升
    secondary:
      theme === "dark"
        ? "bg-transparent text-star-50 hover:bg-space-900 hover:border-star-50/40 border border-star-50/20"
        : "bg-transparent text-paper-900 hover:bg-paper-50 hover:border-paper-900/40 border border-paper-900/20",

    // Outline: Transparent + Border
    outline:
      theme === "dark"
        ? "bg-transparent text-star-50 border border-star-50/20 hover:border-accent/60"
        : "bg-transparent text-paper-900 border border-paper-900/20 hover:border-accent/60",

    // Ghost: Text Only + Hover Background
    ghost:
      theme === "dark"
        ? "bg-transparent hover:bg-space-900/70 text-accent hover:text-accent-hover border-none shadow-none"
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
      ? "bg-transparent text-star-400 border-star-50/15 hover:border-accent/50 hover:text-star-200"
      : "bg-transparent text-paper-500 border-paper-900/15 hover:border-accent/50 hover:text-paper-900";

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

// --- Detail Modal (全屏详情解读，artifact 文档式排版) ---
// 解析统一走 services/llmText（normalizeLlmText/groupLlmBlocks/toPlainText），
// 排版统一走 components/llm/LlmDoc 原语：单列文档流 + mono 眉标节头 + 发丝线分节，
// 不再有节卡片/彩虹徽章/图标砖（旧 cardStyles/parseMarkdownSections 已删除）。

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
  const { language, t } = useLanguage();

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
      <div className="fixed inset-0 z-[200] flex flex-col bg-paper-100 dark:bg-space-950">
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
        <button
          onClick={onClose}
          className="fixed top-6 left-6 z-[210] flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-500 transition-colors hover:text-accent dark:text-star-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
          {t.common.back || "Back"}
        </button>
      </div>
    );
  }

  const interpretationGroups = groupLlmBlocks(
    normalizeLlmText(content?.interpretation),
    t.detail.interpretation || "Interpretation",
  );
  const hasHighlights = !!content?.highlights?.length;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden animate-fade-in bg-paper-100 dark:bg-space-950">
      {/* Sticky Header — 面包屑式，不再是金色药丸 */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-paper-900/10 bg-paper-100/95 px-6 py-4 dark:border-star-50/10 dark:bg-space-950/95">
        <button
          onClick={onClose}
          className="flex shrink-0 items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-500 transition-colors hover:text-accent dark:text-star-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
          {t.common.back || "Back"}
        </button>
        <span
          aria-hidden="true"
          className="text-paper-900/20 dark:text-star-50/20"
        >
          /
        </span>
        <span className="min-w-0 truncate font-mono text-xs uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
          {title}
        </span>
      </div>

      {/* Content Area — 单列文档流 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
          {/* Error State */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-danger">
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
              <p className="mb-2 text-lg font-medium text-paper-900 dark:text-star-50">
                {t.common.error || "Error"}
              </p>
              <p className="mb-6 text-sm text-paper-500 dark:text-star-400">
                {error}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="rounded-2xl bg-star-50 px-6 py-2 font-mono text-xs font-medium uppercase tracking-[0.12em] text-space-950 transition-opacity hover:opacity-90"
                >
                  {t.common.retry}
                </button>
              )}
            </div>
          )}

          {/* Content Display — 文档头 + 发丝线分节 */}
          {!loading && !error && content && (
            <LlmDoc>
              <header className="mb-8">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                  {title}
                </p>
                {content.title && (
                  <h1 className="mt-2 text-2xl font-medium tracking-[-0.015em] text-paper-900 md:text-3xl dark:text-star-50">
                    {toPlainText(content.title)}
                  </h1>
                )}
                {content.summary && (
                  <p className="mt-3 max-w-[62ch] text-[1.0625rem] leading-[1.65] text-paper-600 dark:text-star-300">
                    {toPlainText(content.summary)}
                  </p>
                )}
              </header>

              {hasHighlights && (
                <LlmSection
                  first
                  eyebrow={
                    keyPointsLabel || (language === "zh" ? "重点" : "Key Points")
                  }
                >
                  <LlmList
                    items={(content.highlights ?? []).map(toPlainText)}
                  />
                </LlmSection>
              )}

              {interpretationGroups.map((group, idx) => (
                <LlmSection
                  key={idx}
                  first={!hasHighlights && idx === 0}
                  eyebrow={group.heading}
                  className={idx === 0 && hasHighlights ? "mt-6" : ""}
                >
                  <LlmProse blocks={group.blocks} />
                </LlmSection>
              ))}

              {/* 收尾 — 发丝线 + mono 标记，不再是渐变卡 */}
              <footer className="mt-10 border-t border-paper-900/10 pt-6 text-center dark:border-star-50/10">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper-400 dark:text-star-400">
                  {t.ask.oracle_complete || "Completed"}
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent underline-offset-4 transition-colors hover:underline"
                >
                  {t.journal?.return_to_stars ||
                    (language === "zh" ? "返回" : "Return")}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              </footer>
            </LlmDoc>
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
