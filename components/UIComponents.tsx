// INPUT: React、类型与常量依赖（含卡片基础样式、迁移后云端资料回填与详情解读分区卡片）。
// OUTPUT: 导出 UI 原语与上下文（含可调宽度的 Modal 与结构化详情解读分区）。
// POS: 主应用基础组件库。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, { ReactNode, useState, createContext, useContext, useEffect } from 'react';
import { Language, UserProfile, SectionDetailContent } from '../types';
import { TRANSLATIONS, ASTRO_DICTIONARY } from '../constants';
import { OracleLoading } from './OracleLoading';
import { useAuth } from '../contexts/AuthContext';

// --- Theme Context ---
export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('astro_theme') as Theme) || 'dark');
  useEffect(() => { 
    document.body.className = `${theme} ${theme === 'dark' ? 'bg-space-950 text-star-50' : 'bg-paper-100 text-paper-900'}`; 
    localStorage.setItem('astro_theme', theme); 
  }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

// --- Language Context ---

export const translateAstroTerm = (text: string, lang: Language): string => {
  if (lang === 'en' || !text) return text;

  // 首先尝试直接匹配（精确查找，适用于单个术语如 "Sun"、"Aries"）
  const exactMatch = ASTRO_DICTIONARY[text];
  if (exactMatch) {
    return exactMatch.zh;
  }

  // 如果没有精确匹配，进行正则替换（适用于句子中包含多个术语）
  let translated = text;
  const keys = Object.keys(ASTRO_DICTIONARY).sort((a, b) => b.length - a.length);
  keys.forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
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
  t: typeof TRANSLATIONS['en'];
  tl: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({ 
  language: 'zh', 
  toggleLanguage: () => {}, 
  t: TRANSLATIONS['zh'], 
  tl: (s) => s 
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('astro_lang') as Language) || 'zh');
  const toggleLanguage = () => { 
    const newLang = language === 'zh' ? 'en' : 'zh'; 
    setLanguage(newLang); 
    localStorage.setItem('astro_lang', newLang); 
  };
  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t: TRANSLATIONS[language], tl: (s) => translateAstroTerm(s, language) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export const useUserProfile = () => {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(() => {
        const saved = localStorage.getItem('astro_user');
        return saved ? JSON.parse(saved) : null;
    });
    useEffect(() => {
      if (user || !authUser?.birthProfile) return;
      if (localStorage.getItem('astro_profile_migrated') !== '1') return;
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
        accuracyLevel: birth.accuracyLevel || 'exact',
        focusTags: authUser.preferences?.focusTags || [],
      };
      setUser(profile);
    }, [user, authUser]);
    const saveUser = (u: UserProfile | null) => { 
      setUser(u); 
      if (u) localStorage.setItem('astro_user', JSON.stringify(u)); 
      else localStorage.removeItem('astro_user'); 
    };
    return { user, saveUser };
};

// --- Design Tokens & styles (Linear Black x Gold) ---

const getStyles = (theme: Theme) => ({
    // Page Background
    container: theme === 'dark'
        ? "bg-space-950 text-star-50"
        : "bg-paper-100 text-paper-900",

    // Cards (Frosted Surfaces)
    card: theme === 'dark'
        ? "bg-space-900/60 border border-space-700/70 shadow-card backdrop-blur-lg"
        : "bg-paper-100/85 border border-paper-300/80 shadow-sm backdrop-blur",
    cardLeft: theme === 'dark'
        ? "!border-l-space-700/70"
        : "!border-l-paper-300/80",
    cardAccent: theme === 'dark'
        ? "before:bg-accent/60"
        : "before:bg-gold-500/50",
    // Interactive Elements Hover
    hover: theme === 'dark'
        ? "hover:border-accent/50 hover:bg-space-900/70"
        : "hover:border-accent/40 hover:bg-paper-100/70",

    // Typography
    heading: theme === 'dark' ? "text-star-50" : "text-paper-900",
    body: theme === 'dark' ? "text-star-200" : "text-paper-400",
    muted: theme === 'dark' ? "text-star-400" : "text-paper-400",

    // Borders - 使用温暖的金色调分割线
    divider: theme === 'dark' ? "border-gold-500/15" : "border-paper-300",

    // Inputs
    input: theme === 'dark'
        ? "bg-space-900/70 border-gold-500/20 text-star-50 focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder-star-400/60"
        : "bg-white/90 border-paper-300 text-paper-900 focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder-paper-400"
});

// --- Layout & wrappers ---

export const Container: React.FC<{ children: ReactNode, className?: string }> = ({ children, className = "" }) => {
    const { theme } = useTheme();
    const s = getStyles(theme);

    return (
      <div className={`min-h-screen w-full transition-colors duration-200 ${s.container}`}>
        {/* Simplified: Single subtle glow for depth */}
        {theme === 'dark' && (
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/3 blur-[120px] rounded-full pointer-events-none" />
        )}

        <div className={`relative w-full max-w-7xl mx-auto min-h-screen px-4 md:px-8 py-8 md:py-16 pt-12 md:pt-12 ${className}`}>
          {children}
        </div>
      </div>
    );
};

export const Section: React.FC<{ title?: string, children: ReactNode, className?: string, action?: ReactNode }> = ({ title, children, className = "", action }) => {
    const { theme } = useTheme();
    const s = getStyles(theme);
    
    return (
      <section className={`mb-12 ${className}`}>
        {title && (
            <div className={`flex justify-between items-end mb-6 pb-2 border-b ${s.divider}`}>
                <h2 className={`text-xl font-semibold tracking-tight ${s.heading}`}>{title}</h2>
                {action}
            </div>
        )}
        {children}
      </section>
    );
};

// --- Core Components ---

export const Card: React.FC<{ children: ReactNode, onClick?: () => void, className?: string, noPadding?: boolean }> = ({ children, onClick, className = "", noPadding = false }) => {
    const { theme } = useTheme();
    const s = getStyles(theme);

    return (
      <div
        onClick={onClick}
        className={`
            rounded-xl transition-colors duration-150
            ${s.card}
            ${onClick ? `cursor-pointer ${s.hover}` : ''}
            ${noPadding ? '' : 'p-5'}
            ${className}
        `}
      >
        {children}
      </div>
    );
};

export const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
    const { theme } = useTheme();
    const s = getStyles(theme);
    return (
      <div className="relative group">
        <input 
          {...props}
          className={`w-full h-10 px-3 py-2 rounded-lg outline-none transition-all duration-150 font-sans text-sm ${s.input} ${props.className}`}
        />
      </div>
    );
};

export const ActionButton: React.FC<{ children: ReactNode, onClick?: () => void, variant?: 'primary' | 'secondary' | 'outline' | 'ghost', disabled?: boolean, className?: string, size?: 'sm' | 'md' | 'lg', ariaLabel?: string }> = ({ children, onClick, variant = 'primary', disabled, className="", size = 'md', ariaLabel }) => {
  const { theme } = useTheme();

  // 8pt Grid Heights - Mobile touch target minimum 44px
  const sizes = {
      sm: "h-8 min-h-[44px] md:min-h-0 px-3 text-xs", // 32px desktop, 44px mobile
      md: "h-10 min-h-[44px] md:min-h-0 px-4 text-sm", // 40px desktop, 44px mobile
      lg: "h-12 px-6 text-base" // 48px
  };

  const variants = {
    // Primary: Warm Milky Gold Gradient with DARK TEXT for contrast.
    primary: "bg-gradient-primary text-space-950 hover:opacity-95 font-semibold shadow-glow border border-transparent",

    // Secondary: Border + Hover Gold Tint
    secondary: theme === 'dark'
        ? "bg-space-800/70 text-star-50 hover:bg-space-700/70 hover:border-accent/60 border border-gold-500/20"
        : "bg-white text-paper-900 hover:bg-paper-100 hover:border-accent/50 border border-paper-300",

    // Outline: Transparent + Border
    outline: theme === 'dark'
        ? "bg-transparent text-star-50 border border-gold-500/20 hover:border-accent/60"
        : "bg-transparent text-paper-900 border border-paper-300 hover:border-accent/50",

    // Ghost: Text Only + Hover Background
    ghost: "bg-transparent hover:bg-space-700/50 text-accent hover:text-accent-hover border-none shadow-none"
  };

  return (
    <button
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`
            rounded-lg font-medium tracking-wide transition-all duration-150
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-space-950
            ${sizes[size]}
            ${variants[variant]}
            ${className}
        `}
    >
      {children}
    </button>
  );
};

export const Chip: React.FC<{ label: string, selected?: boolean, onClick?: () => void, id?: string }> = ({ label, selected, onClick, id }) => {
  const { theme } = useTheme();

  const base = "px-3 py-1.5 min-h-[44px] md:min-h-0 rounded-lg text-xs font-medium transition-all border cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-space-950";

  const selectedStyle = "bg-accent/10 text-accent border-accent/70 font-semibold";
  const unselectedStyle = theme === 'dark'
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
}> = ({ title, subtitle, children, defaultOpen = false, open, onToggle, id }) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const [hasOpened, setHasOpened] = useState(defaultOpen || !!open);
  const { theme } = useTheme();
  const s = getStyles(theme);

  // Generate stable IDs for ARIA
  const accordionId = id || `accordion-${title.replace(/\s+/g, '-').toLowerCase()}`;
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
    <div className={`rounded-lg overflow-hidden mb-3 border transition-colors ${isOpen ? 'border-accent/40' : s.divider} ${theme === 'dark' ? 'bg-space-900/40' : 'bg-white/60'}`}>
      <button
        id={buttonId}
        onClick={handleToggle}
        className="w-full flex justify-between items-center px-4 py-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <div>
          <h3 className={`text-sm font-medium ${s.heading} group-hover:text-accent transition-colors`}>{title}</h3>
          {subtitle && <p className={`text-xs mt-0.5 ${s.muted}`}>{subtitle}</p>}
        </div>
        <span className={`text-accent/60 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">▼</span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-all duration-200 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
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
  title: string, 
  tags: string[], 
  intensity: 'low' | 'med' | 'high', 
  dates: {start: string, peak: string, end: string}, 
  onClick?: () => void 
}> = ({ title, tags, intensity, dates, onClick }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);
  
  const intensityColor = {
    low: "bg-success", // Green
    med: "bg-accent",  // Gold
    high: "bg-danger"  // Red
  };

  return (
    <div
        onClick={onClick}
        className={`group relative pl-6 border-l-2 ${theme === 'dark' ? 'border-gold-500/20 hover:border-accent' : 'border-paper-300 hover:border-accent'} transition-colors cursor-pointer py-3`}
    >
      <div className={`absolute left-[-5px] top-5 w-2 h-2 rounded-full ${intensityColor[intensity]}`} />
      
      <div className="flex justify-between items-baseline mb-1 gap-2">
        <h3 className={`text-base font-semibold ${s.heading} group-hover:text-accent transition-colors truncate min-w-0 flex-1`}>{title}</h3>
        <span className={`text-xs font-mono ${s.muted} whitespace-nowrap flex-shrink-0`}>{dates.start} — {dates.end}</span>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
         {tags.map((t: string) => (
             <span key={t} className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded border truncate max-w-[120px] ${theme === 'dark' ? 'border-gold-500/20 text-star-400' : 'border-paper-300 text-paper-400'}`}>
                 {t}
             </span>
         ))}
      </div>
    </div>
  );
};

// --- Visualization ---

export const ScoreBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);
  
  return (
    <div className="mb-3">
      <div className={`flex justify-between text-xs mb-1.5 font-medium uppercase tracking-widest ${s.muted}`}>
        <span>{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gold-500/10' : 'bg-paper-200'}`}>
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

export const CopyButton: React.FC<{ text: string, label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
        onClick={handleCopy} 
        className={`flex items-center gap-2 text-xs font-medium transition-colors hover:text-accent ${copied ? 'text-success' : (theme === 'dark' ? 'text-star-400' : 'text-paper-400')}`}
    >
      <span className="text-sm">{copied ? '✓' : 'Copy'}</span>
      {label && !copied && <span>{label}</span>}
    </button>
  );
};

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title?: string, children: ReactNode, className?: string, bodyClassName?: string, ariaLabel?: string }> = ({ isOpen, onClose, title, children, className = '', bodyClassName = '', ariaLabel }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  // Handle body scroll lock and focus management
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Focus the modal container
      setTimeout(() => modalRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = 'unset';
      // Restore focus to previous element
      previousActiveElement.current?.focus();
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl z-10 animate-slide-up border ${s.divider} ${theme === 'dark' ? 'bg-space-900' : 'bg-white'} ${className} focus:outline-none`}
      >
        <div className={`sticky top-0 z-20 flex justify-between items-center px-6 py-4 border-b ${s.divider} backdrop-blur-md ${theme === 'dark' ? 'bg-space-900/80' : 'bg-white/80'}`}>
          {title && <h2 id="modal-title" className={`text-lg font-semibold ${s.heading}`}>{title}</h2>}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={`w-8 h-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center rounded-lg transition-colors ${s.muted} hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className={`p-6 ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Detail Modal (全屏详情解读页面，CBT风格) ---

// 清理 Markdown 格式符号
const cleanMarkdownText = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\*\*\*/g, '')  // 移除 ***
    .replace(/\*\*/g, '')    // 移除 **
    .replace(/__/g, '')      // 移除 __
    .replace(/\*([^*]+)\*/g, '$1')  // 移除 *text*
    .replace(/_([^_]+)_/g, '$1')    // 移除 _text_
    .replace(/`([^`]+)`/g, '$1')    // 移除 `code`
    .replace(/^#+\s*/gm, '')        // 移除 # 标题符号
    .replace(/^[-*+]\s+/gm, '• ')   // 转换列表符号
    .trim();
};

type MarkdownSection = { type: 'heading' | 'paragraph' | 'list'; content: string; items?: string[] };

// 将 Markdown 文本转换为结构化段落
const parseMarkdownSections = (text: string): MarkdownSection[] => {
  if (!text) return [];
  const sections: MarkdownSection[] = [];
  const lines = text.split('\n');
  let currentParagraph = '';
  let currentList: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      sections.push({ type: 'paragraph', content: cleanMarkdownText(currentParagraph.trim()) });
      currentParagraph = '';
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({ type: 'list', content: '', items: currentList.map(cleanMarkdownText) });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 标题
    if (/^#{1,3}\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      sections.push({ type: 'heading', content: cleanMarkdownText(trimmed.replace(/^#+\s*/, '')) });
    }
    // 列表项
    else if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed) || /^•\s+/.test(trimmed)) {
      flushParagraph();
      currentList.push(
        trimmed
          .replace(/^[-*+]\s+/, '')
          .replace(/^\d+\.\s+/, '')
          .replace(/^•\s+/, '')
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
      currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
    }
  }

  flushParagraph();
  flushList();

  return sections;
};

const groupMarkdownByHeading = (sections: MarkdownSection[], fallbackHeading: string) => {
  const blocks: Array<{ heading: string; nodes: MarkdownSection[] }> = [];
  let currentHeading = '';
  let currentNodes: MarkdownSection[] = [];

  const flushBlock = () => {
    if (!currentNodes.length) return;
    blocks.push({
      heading: currentHeading || fallbackHeading,
      nodes: currentNodes,
    });
    currentHeading = '';
    currentNodes = [];
  };

  sections.forEach((section) => {
    if (section.type === 'heading') {
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
  onRetry
}) => {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const isLight = theme === 'light';

  // 样式定义 (CBT风格)
  const containerTone = isLight ? 'bg-paper-100' : 'bg-space-950';
  const panelTone = isLight
    ? 'bg-paper-100/90 shadow-[0_16px_26px_rgba(122,104,78,0.14)]'
    : 'bg-space-900/60 shadow-[0_18px_30px_rgba(0,0,0,0.35)]';
  const panelFrame = isLight
    ? 'border border-paper-300/80 border-l-2 border-l-gold-600/40'
    : 'border border-space-700/70 border-l-2 border-l-gold-500/40';
  const heroTone = isLight
    ? 'bg-gradient-to-br from-paper-100 via-paper-50 to-paper-100'
    : 'bg-gradient-to-br from-space-900 via-space-900 to-space-800';
  const heroFrame = isLight
    ? 'border border-paper-300/80 border-l-2 border-l-gold-600/50'
    : 'border border-space-700/70 border-l-2 border-l-gold-500/40';
  const mutedTextTone = isLight ? 'text-paper-500' : 'text-star-400';
  const bodyTextTone = isLight ? 'text-paper-700' : 'text-star-200';
  const goldIconTone = isLight ? 'bg-gold-500/15 text-gold-700' : 'bg-gold-500/10 text-gold-400';
  const dividerTone = isLight ? 'bg-paper-200/80' : 'bg-space-700/70';
  const headingTone = isLight ? 'text-paper-900' : 'text-star-50';

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  if (!open) return null;

  // Loading State - 直接使用 OracleLoading 全屏显示，与 Ask Oracle 体验一致
  if (loading) {
    return (
      <div className="fixed inset-0 z-[200]">
        <OracleLoading
          phrases={[
            t.detail.generating || '正在生成专业解读...',
            language === 'zh' ? '深度分析星盘数据...' : 'Analyzing chart data...',
            language === 'zh' ? '解读星象奥秘...' : 'Decoding celestial patterns...',
          ]}
          thinkingLabel={t.common.analyzing || '分析中'}
        />
        {/* 返回按钮浮层 */}
        <button
          onClick={onClose}
          className={`fixed top-6 left-6 z-[210] flex items-center gap-3 transition-all font-bold group text-star-400 hover:text-gold-400`}
        >
          <div className="p-2 rounded-xl transition-all bg-white/5 group-hover:bg-gold-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
            </svg>
          </div>
          <span className="text-sm uppercase tracking-widest">{t.common.back || '返回'}</span>
        </button>
      </div>
    );
  }

  const interpretationSections = content?.interpretation ? parseMarkdownSections(content.interpretation) : [];
  const interpretationBlocks = groupMarkdownByHeading(
    interpretationSections,
    t.detail.interpretation || 'Interpretation'
  );
  const labelTokens = language === 'zh'
    ? new Set(['观点', '机制', '建议'])
    : new Set(['key', 'mechanism', 'action']);
  const blockSurface = isLight
    ? 'bg-white/70 border border-paper-300/80 shadow-[0_12px_20px_rgba(122,104,78,0.08)]'
    : 'bg-space-950/40 border border-space-700/70 shadow-[0_14px_26px_rgba(0,0,0,0.35)]';
  const tones = {
    core: {
      accent: isLight ? 'border-l-gold-600' : 'border-l-gold-400',
      badge: isLight ? 'border-gold-600/30 bg-gold-500/10 text-gold-700' : 'border-gold-500/30 bg-gold-500/10 text-gold-300',
      label: isLight ? 'text-gold-700' : 'text-gold-300',
      dot: isLight ? 'bg-gold-600' : 'bg-gold-400',
      surface: blockSurface,
    },
    mechanism: {
      accent: isLight ? 'border-l-purple-500' : 'border-l-purple-400',
      badge: isLight ? 'border-purple-500/30 bg-purple-500/10 text-purple-700' : 'border-purple-400/30 bg-purple-400/10 text-purple-300',
      label: isLight ? 'text-purple-700' : 'text-purple-300',
      dot: isLight ? 'bg-purple-500' : 'bg-purple-400',
      surface: blockSurface,
    },
    action: {
      accent: isLight ? 'border-l-emerald-500' : 'border-l-emerald-400',
      badge: isLight ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
      label: isLight ? 'text-emerald-700' : 'text-emerald-300',
      dot: isLight ? 'bg-emerald-500' : 'bg-emerald-400',
      surface: blockSurface,
    },
    fallback: {
      accent: isLight ? 'border-l-gold-500/40' : 'border-l-gold-500/30',
      badge: isLight ? 'border-gold-500/20 bg-gold-500/5 text-gold-700' : 'border-gold-500/20 bg-gold-500/5 text-gold-400',
      label: isLight ? 'text-gold-700' : 'text-gold-400',
      dot: isLight ? 'bg-gold-600/60' : 'bg-gold-400/60',
      surface: blockSurface,
    }
  };
  const resolveToneKey = (heading: string) => {
    const normalized = heading.trim().toLowerCase();
    if (language === 'zh') {
      if (heading.includes('观点')) return 'core';
      if (heading.includes('机制')) return 'mechanism';
      if (heading.includes('建议') || heading.includes('行动')) return 'action';
    }
    if (normalized.includes('takeaway') || normalized.includes('key')) return 'core';
    if (normalized.includes('mechanism') || normalized.includes('breakdown')) return 'mechanism';
    if (normalized.includes('action') || normalized.includes('steps')) return 'action';
    return 'fallback';
  };
  const parseDetailLabel = (text: string) => {
    const match = text.match(/^([^：:]{1,12})[：:]\s*(.+)$/);
    if (!match) return null;
    const label = match[1].trim();
    const normalizedLabel = language === 'zh' ? label : label.toLowerCase();
    if (!labelTokens.has(normalizedLabel)) return null;
    return {
      label,
      content: match[2].trim(),
      separator: text.includes('：') ? '：' : ':',
    };
  };
  const renderDetailLine = (line: string, tone: typeof tones.core) => {
    const parsed = parseDetailLabel(line);
    if (!parsed) return <span>{line}</span>;
    return (
      <span className="flex flex-wrap gap-1">
        <span className={`${tone.label} font-semibold`}>{parsed.label}{parsed.separator}</span>
        <span>{parsed.content}</span>
      </span>
    );
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col overflow-hidden animate-fade-in ${containerTone}`}>
      {/* 浮动返回按钮 */}
      <button
        onClick={onClose}
        className={`fixed top-6 left-6 z-[210] flex items-center gap-3 transition-all font-bold group ${mutedTextTone} hover:text-gold-400`}
      >
        <div className={`p-2 rounded-xl transition-all ${isLight ? 'bg-white/90 border border-paper-300 group-hover:bg-paper-200 shadow-lg' : 'bg-white/5 group-hover:bg-gold-500/20'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
          </svg>
        </div>
        <span className="text-sm uppercase tracking-widest">{t.common.back || '返回'}</span>
      </button>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 pb-12 pt-20">
        <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">

          {/* 标题区域 */}
          <div className="text-center space-y-2 py-6">
            <h1 className={`text-3xl md:text-4xl font-serif tracking-tight ${headingTone}`}>{title}</h1>
          </div>

          {/* Error State */}
          {!loading && error && (
            <div className={`rounded-3xl p-10 md:p-12 flex flex-col items-center justify-center ${panelTone} ${panelFrame}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isLight ? 'bg-danger/10' : 'bg-danger/20'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
                  <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
                </svg>
              </div>
              <p className={`text-lg font-medium mb-2 ${headingTone}`}>{t.common.error || '加载失败'}</p>
              <p className={`text-sm mb-6 ${mutedTextTone}`}>{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${isLight ? 'bg-gold-500/20 text-gold-700 hover:bg-gold-500/30' : 'bg-gold-500/10 text-gold-400 hover:bg-gold-500/20'}`}
                >
                  {t.common.retry}
                </button>
              )}
            </div>
          )}

          {/* Content State */}
          {!loading && !error && content && (
            <div className="space-y-6">
              {/* Hero Card: Title & Summary */}
              <div className={`rounded-3xl p-7 md:p-8 relative overflow-hidden shadow-2xl ${heroTone} ${heroFrame}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                <div className="relative z-10">
                  {content.title && (
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-2xl ${goldIconTone}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </div>
                      <h2 className={`text-xl md:text-2xl font-serif ${headingTone}`}>{cleanMarkdownText(content.title)}</h2>
                    </div>
                  )}
                  {content.summary && (
                    <p className={`text-base md:text-lg leading-relaxed ${bodyTextTone}`}>
                      {cleanMarkdownText(content.summary)}
                    </p>
                  )}
                </div>
              </div>

              {/* Key Points Card - 移除内框，直接显示内容 */}
              {content.highlights && content.highlights.length > 0 && (
                <div className={`rounded-3xl p-6 md:p-7 ${panelTone} ${panelFrame}`}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`p-3 rounded-2xl ${goldIconTone}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                    </div>
                    <h3 className={`text-lg md:text-xl font-serif ${headingTone}`}>{keyPointsLabel || t.detail.key_points}</h3>
                  </div>
                  <div className={`h-px w-full mb-5 ${dividerTone}`} />
                  <div className="space-y-3">
                    {content.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isLight ? 'bg-gold-600' : 'bg-gold-400'}`}></span>
                        <p className={`text-sm md:text-base leading-relaxed ${bodyTextTone}`}>
                          {cleanMarkdownText(item)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interpretation Card - 移除内层卡片，使用序号编号 */}
              {content.interpretation && interpretationBlocks.length > 0 && (
                <div className={`rounded-3xl p-6 md:p-7 ${panelTone} ${panelFrame}`}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`p-3 rounded-2xl ${goldIconTone}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                    </div>
                    <h3 className={`text-lg md:text-xl font-serif ${headingTone}`}>{t.detail.interpretation || '深度解读'}</h3>
                  </div>
                  <div className={`h-px w-full mb-5 ${dividerTone}`} />
                  <div className="space-y-6">
                    {interpretationBlocks.map((block, idx) => {
                      const toneKey = resolveToneKey(block.heading) as keyof typeof tones;
                      const tone = tones[toneKey] || tones.fallback;
                      return (
                        <div key={`${block.heading}-${idx}`} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${tone.badge}`}>
                              {idx + 1}
                            </span>
                            <span className={`text-base font-semibold ${tone.label}`}>{block.heading}</span>
                          </div>
                          <div className="pl-10 space-y-3">
                            {block.nodes.map((node, nodeIdx) => {
                              if (node.type === 'list' && node.items) {
                                return (
                                  <div key={nodeIdx} className="space-y-2">
                                    {node.items.map((item, itemIdx) => (
                                      <div key={itemIdx} className="flex items-start gap-3">
                                        <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${tone.dot}`}></span>
                                        <span className={`text-sm md:text-base leading-relaxed ${bodyTextTone}`}>
                                          {renderDetailLine(item, tone)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return (
                                <p key={nodeIdx} className={`text-sm md:text-base leading-relaxed ${bodyTextTone}`}>
                                  {renderDetailLine(node.content, tone)}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 返回按钮 */}
              <div className="flex justify-center pt-8">
                <button
                  onClick={onClose}
                  className="group relative overflow-hidden px-16 py-4 rounded-[2rem] transition-all hover:scale-105 active:scale-95 shadow-2xl"
                >
                  <div className={`absolute inset-0 group-hover:via-gold-800/50 transition-all duration-700 ${isLight ? 'bg-gradient-to-r from-paper-200 via-gold-500/30 to-paper-200' : 'bg-gradient-to-r from-space-800 via-gold-900/50 to-space-800'}`}></div>
                  <div className="relative flex items-center gap-4">
                    <span className={`font-black text-xs uppercase tracking-[0.5em] ${headingTone}`}>{t.journal?.return_to_stars || '返回'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-pulse ${isLight ? 'text-gold-700' : 'text-gold-300'}`}>
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                    </svg>
                  </div>
                </button>
              </div>
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
  className = ''
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gold-500' : 'text-accent'}`}>
        {title}
      </h3>
      {showDetailButton && onDetailClick && (
        <button
          onClick={onDetailClick}
          className={`text-xs px-3 py-1.5 rounded-md border transition-all duration-200 ${
            theme === 'dark'
              ? 'border-accent/40 text-accent hover:bg-accent/10 hover:border-accent/70'
              : 'border-accent/40 text-accent hover:bg-accent/5 hover:border-accent/60'
          }`}
        >
          {t.detail.view_detail}
        </button>
      )}
    </div>
  );
};
