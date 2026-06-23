// INPUT: React、BrowserRouter、组件与后端数据服务依赖（含 SEO head 输出、短链跳转、付费墙回调与分析追踪）。
// OUTPUT: 导出主应用组件（含 /go 短链跳转、合盘积分购买后自动触发生成、save_chart 登录后自动续接迁移、Analytics 路由追踪、同意横幅与核心功能事件）。
// POS: 主应用路由与页面编排中心（BrowserRouter SPA 路由、短链跳转、付费墙后续流程与分析事件接入、支付成功页放行与 PayPal 回跳处理、旧 hash URL 兼容重定向）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  lazy,
  Suspense,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  Link,
  Navigate,
} from "react-router-dom";
import {
  Container,
  ActionButton,
  useTheme,
  ThemeProvider,
  LanguageProvider,
  useLanguage,
} from "./components/UIComponents";
import { useLangPath, extractLangFromPath } from "./hooks/useLangPath";
import { X } from "lucide-react";
import * as T from "./types";
import {
  moonSignConfig,
  risingSignConfig,
  bigThreeConfig,
  birthChartConfig,
} from "./components/calculators/signConfigs";
// 仅在 /embed/* 早返回分支用到；懒加载使其不进主包（与其它计算器模块一致）。
const EmbedWidgetShell = lazy(() =>
  import("./components/calculators/embed").then((m) => ({
    default: m.EmbedWidgetShell,
  })),
);
import { FREE_MODE, LOGIN_GATE_MODE } from "./constants";
import { OracleLoading } from "./components/OracleLoading";
import {
  gmAddTokens,
  gmCancelSubscription,
  gmClearTokens,
  gmCreateDevSession,
  gmUnlockSubscription,
} from "./services/paymentClient";
import {
  trackPageView,
  startPageEngagement,
  endPageEngagement,
  trackEvent,
} from "./services/analytics";
// Aliased: AuthContext also exposes a no-arg migrateLocalData() (localStorage
// path). This direct client call migrates the in-memory save-chart prefill to
// the cloud after login WITHOUT ever touching localStorage (2026-05-20 invariant).
import { migrateLocalData as migrateBirthProfileToAccount } from "./services/authClient";
import { FUNNEL_EVENTS } from "./services/funnelEvents";
import { getLandingUtm } from "./services/landingUtm";
import {
  buildBirthProfileFromPrefill,
  type SavePrefill,
} from "./services/saveChartResume";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// deleteAccount, exportData moved to pages/SettingsPage.tsx
import {
  EntitlementProvider,
  useEntitlement,
} from "./contexts/EntitlementContext";
import { SEO } from "./components/SEO";
import {
  LoginModal,
  UpgradeModal,
  UserMenu,
  PaymentSuccessPage,
  CreditsSuccessPage,
} from "./components/auth";
import { CreditsModal } from "./components/payment";
import { ConsentBanner } from "./components/ConsentBanner";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Footer } from "./components/Footer";
import { useAnalyticsTracking } from "./hooks/useAnalytics";
import { goRedirects } from "./data/goRedirects";
import { resolveGoRedirect } from "./src/utils/goRedirects";

// Global SEO schemas (Organization + WebSite). Single script tag that owns
// the brand-level structured data for the entire SPA. Page-level <SEO>
// instances must NOT also emit Organization or WebSite — they delegate to
// this component and emit only page-specific schemas (SoftwareApplication,
// FAQPage, Article, etc.). Dedupe defense: if a prerendered route already
// has these schemas in the first-byte HTML (e.g. /landing-v2/{en,zh}/),
// skip the inject so hydration doesn't duplicate.
const GlobalSchema: React.FC = () => {
  const { language } = useLanguage();
  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  const lang = language === "zh" ? "zh" : "en";

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    // Dedupe: if the prerender baked an Organization OR WebSite schema into
    // the first-byte HTML, leave it alone. Hydrating a duplicate confuses
    // structured-data crawlers and bloats the head.
    const existingTypes = new Set<string>();
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => {
        try {
          const json = JSON.parse(s.textContent ?? "");
          const arr = Array.isArray(json) ? json : [json];
          arr.forEach((entry) => {
            if (entry && typeof entry["@type"] === "string") {
              existingTypes.add(entry["@type"]);
            }
          });
        } catch {
          /* ignore unparsable */
        }
      });
    if (existingTypes.has("Organization") && existingTypes.has("WebSite")) {
      return;
    }

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AstrologyWiki",
      url: `${siteUrl}/`,
      logo: `${siteUrl}/logo.png`,
      sameAs: [
        "https://twitter.com/astrologywiki",
        "https://www.instagram.com/astrologywiki",
        "https://www.youtube.com/@astrologywiki",
      ],
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AstrologyWiki",
      url: `${siteUrl}/`,
      inLanguage: lang,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/${lang}/wiki?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify([organizationSchema, websiteSchema]);
    script.setAttribute("data-astro-global-schema", "true");
    document.head.appendChild(script);

    return () => {
      document
        .querySelectorAll("[data-astro-global-schema]")
        .forEach((el) => el.remove());
    };
  }, [siteUrl, lang]);

  return null;
};

// 懒加载大型组件
const CBTMainPage = lazy(() => import("./components/cbt/CBTMainPage"));
const WikiHubPage = lazy(() => import("./components/wiki/WikiHubPage"));
const WikiDetailPage = lazy(() => import("./components/wiki/WikiDetailPage"));
const WikiClassicDetailPage = lazy(() =>
  import("./components/wiki/WikiClassicDetailPage").then((m) => ({
    default: m.WikiClassicDetailPage,
  })),
);
const WikiClassicsPage = lazy(
  () => import("./components/wiki/WikiClassicsPage"),
);
const AuthorPage = lazy(() => import("./components/wiki/AuthorPage"));
const ReportsPage = lazy(() =>
  import("./components/reports").then((m) => ({ default: m.ReportsPage })),
);
const ReportViewPage = lazy(() =>
  import("./components/reports").then((m) => ({ default: m.ReportViewPage })),
);
const ColorSystemDemo = lazy(() =>
  import("./components/ColorSystemDemo").then((m) => ({
    default: m.ColorSystemDemo,
  })),
);
const PrivacyPolicy = lazy(() => import("./components/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/legal/TermsOfService"));
const CookiePolicy = lazy(() => import("./components/legal/CookiePolicy"));
const AboutPage = lazy(() => import("./components/legal/AboutPage"));
const HelpPage = lazy(() => import("./components/legal/HelpPage"));
const SaturnReturnCalculator = lazy(
  () => import("./components/SaturnReturnCalculator"),
);
const LandingPageV2 = lazy(() => import("./pages/landing/LandingPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));

// Redirect bare public routes (e.g. /wiki/sun) to language-prefixed version (e.g. /en/wiki/sun)
const LangRedirect: React.FC = () => {
  const { language } = useLanguage();
  const location = useLocation();
  return (
    <Navigate
      to={`/${language}${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
};

// Validate :lang param — only allow 'en' and 'zh', otherwise redirect to /en/...
const LangGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  if (lang !== "en" && lang !== "zh") {
    const rest = location.pathname.replace(/^\/[^/]+/, "");
    return (
      <Navigate to={`/en${rest}${location.search}${location.hash}`} replace />
    );
  }
  return <>{children}</>;
};

const GoRedirectPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const destination = resolveGoRedirect({
    code,
    inlineDestination: new URLSearchParams(location.search).get("to"),
    registry: goRedirects,
  });

  useEffect(() => {
    if (!destination || typeof window === "undefined") return;
    window.location.replace(destination);
  }, [destination]);

  if (!destination) {
    return <NotFoundPage />;
  }

  return <OracleLoading />;
};

const NotFoundPage: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  return (
    <Container>
      <SEO title="Page Not Found" robots="noindex" />
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-8xl font-serif font-bold mb-4 bg-gradient-to-r from-gold-500 to-gold-300 bg-clip-text text-transparent">
          404
        </div>
        <h1
          className={`text-2xl font-serif mb-3 ${theme === "dark" ? "text-star-50" : "text-paper-900"}`}
        >
          {language === "zh" ? "星辰迷失了方向" : "The Stars Lost Their Way"}
        </h1>
        <p
          className={`text-sm mb-8 max-w-md ${theme === "dark" ? "text-star-400" : "text-paper-500"}`}
        >
          {language === "zh"
            ? "这个页面不存在。也许宇宙有其他安排。"
            : "This page doesn't exist. Perhaps the universe has other plans."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-space-950 font-bold text-sm hover:from-gold-500 hover:to-gold-400 transition-all shadow-lg shadow-gold-500/20"
        >
          {language === "zh" ? "返回首页" : "Return Home"}
        </Link>
      </div>
    </Container>
  );
};

// Redirect unauthenticated users to Wiki while showing login modal.
// Authenticated users without a profile are sent to onboarding instead.
// Waits for auth to resolve before deciding, preventing flash-redirect on page load.
const ProtectedRedirect: React.FC = () => {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading, openLoginModal } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      openLoginModal("protected_route");
      navigate(`/${language}/wiki`, { replace: true });
    }
  }, [isLoading, isAuthenticated, openLoginModal, navigate, language]);
  if (isLoading) return <OracleLoading />;
  if (isAuthenticated) return <Navigate to="/onboarding" replace />;
  return null;
};

// Catch-all for /:lang/* SPA routes: strip lang prefix and redirect to bare route
// e.g. /en/settings → /settings, /zh/dashboard → /dashboard
// Protected routes redirect directly to ProtectedRedirect to avoid double redirect.
const PROTECTED_PATHS = new Set([
  "dashboard",
  "forecast",
  "cycles",
  "us",
  "oracle",
  "journal",
  "settings",
  "usage",
  "saved",
]);

const LangStripRedirect: React.FC = () => {
  const { lang, "*": rest } = useParams<{ lang: string; "*": string }>();
  const location = useLocation();
  if (lang !== "en" && lang !== "zh") {
    return <NotFoundPage />;
  }
  const firstSegment = (rest || "").split("/")[0];
  if (PROTECTED_PATHS.has(firstSegment)) {
    return <ProtectedRedirect />;
  }
  return (
    <Navigate to={`/${rest || ""}${location.search}${location.hash}`} replace />
  );
};

// SPA/static parity guard for /landing-v2/{en,zh}/.
// The SEO prerender (scripts/generate-seo-pages.mjs) writes
// public/landing-v2/{en,zh}/index.html with canonical=/landing-v2/{lang}/ +
// robots=index,follow. Vercel's filesystem-first routing serves that HTML
// directly. On hydration, React must mount LandingPageV2 with the matching
// language so the rendered <head> stays index,follow + same canonical;
// otherwise Googlebot sees a cloaking signal (static "index this" vs
// hydrated 404 + noindex). This component validates the segment is en|zh,
// syncs LanguageContext to that value, and mounts LandingPageV2.
const LandingV2LangRoute: React.FC = () => {
  const { landingLang } = useParams<{ landingLang: string }>();
  const { setLanguage } = useLanguage();
  const validLang =
    landingLang === "en" || landingLang === "zh" ? landingLang : null;
  useEffect(() => {
    if (validLang) {
      setLanguage(validLang);
    }
  }, [validLang, setLanguage]);
  if (!validLang) {
    return <NotFoundPage />;
  }
  return <LandingPageV2 />;
};

// --- CONTEXTS ---

import { useUserProfile } from "./hooks/useUserProfile";

// --- PAGES ---

// LandingPage removed — homepage now redirects to /:lang/wiki
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const MePage = lazy(() => import("./pages/MePage"));

const TodayPage = lazy(() => import("./pages/TodayPage"));

const CyclesPage = lazy(() => import("./pages/CyclesPage"));

const TimelinePage = lazy(() => import("./pages/TimelinePage"));
const EnergyTimelineDemoPage = lazy(
  () => import("./pages/EnergyTimelineDemoPage"),
);
// 计算器矩阵（D，sign 类）：单一配置驱动外壳 BirthDataCalculator + 各 slug 的 config。
const BirthDataCalculator = lazy(
  () => import("./components/calculators/BirthDataCalculator"),
);
// 计算器矩阵（D，天象工具类）：无出生数据的纯天文工具，复用 /api/astro/*。
const CurrentPlanetsTool = lazy(
  () => import("./components/calculators/CurrentPlanetsTool"),
);
const MoonPhaseTool = lazy(
  () => import("./components/calculators/MoonPhaseTool"),
);
const EphemerisTool = lazy(
  () => import("./components/calculators/EphemerisTool"),
);
// 计算器矩阵（D，择吉）：起始日 + 天数 → 逐日天空基调（月相/月座/相位平衡），无出生数据，复用 /api/astro/ephemeris。
const ElectionalTool = lazy(
  () => import("./components/calculators/ElectionalTool"),
);
// 计算器矩阵（D，教育）：出生时间来源 → Rodden 数据可信度分级（纯客户端，无出生数据存储）。
const RoddenRatingTool = lazy(
  () => import("./components/calculators/RoddenRatingTool"),
);
// 计算器矩阵（D，趣味/教育）：出生月日 → 太阳星座 → 同星座/同元素名人（纯客户端，仅公开出生日期，无 PII）。
const CelebrityTwinsTool = lazy(
  () => import("./components/calculators/CelebrityTwinsTool"),
);
// 计算器矩阵（D，地图）：出生数据（需时间）→ POST /api/astrocartography → 世界地图叠加各行星 MC/IC/AC/DC 角线。
const AstrocartographyTool = lazy(
  () => import("./components/calculators/AstrocartographyTool"),
);
// 计算器矩阵（D，合盘）：双表单 + 客户端交叉相位，复用 /api/natal/chart（不碰付费 /api/synastry）。
const SynastryCalculator = lazy(
  () => import("./components/calculators/SynastryCalculator"),
);
// 计算器矩阵（D，合成盘）：双表单 + 客户端中点合成盘，复用 /api/natal/chart。
const CompositeCalculator = lazy(
  () => import("./components/calculators/CompositeCalculator"),
);
// 计算器矩阵（D，返照盘）：出生数据 + 目标年 → /api/solar-return（求解返照时刻）。
const SolarReturnCalculator = lazy(
  () => import("./components/calculators/SolarReturnCalculator"),
);
// Tools hub（/:lang/tools）：计算器矩阵统一发现入口（hub-and-spoke 内链中枢），纯客户端渲染。
const ToolsHubPage = lazy(() => import("./components/tools/ToolsHubPage"));

const UsPage = lazy(() => import("./pages/SynastryPage"));

const AskOraclePage = lazy(() => import("./pages/OraclePage"));

const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const CreditsUsagePage = lazy(() => import("./pages/CreditsUsagePage"));
const SavedReadingsPage = lazy(() => import("./pages/SavedReadingsPage"));
const SavedReadingDetailPage = lazy(
  () => import("./pages/SavedReadingDetailPage"),
);

const AuthPage = lazy(() => import("./pages/AuthPage"));

// Credits Modal Wrapper - 连接 AuthContext 和 CreditsModal
const CreditsModalWrapper: React.FC = () => {
  const { showCreditsModal, setShowCreditsModal, refreshEntitlements } =
    useAuth();
  return (
    <CreditsModal
      isOpen={showCreditsModal}
      onClose={() => setShowCreditsModal(false)}
      onSuccess={() => refreshEntitlements()}
    />
  );
};

const AppContent: React.FC = () => {
  const { user, saveUser } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleTheme, theme } = useTheme();
  const {
    isAuthenticated,
    migrateLocalData,
    openLoginModal,
    refreshUser,
    user: authUser,
    showLoginModal,
    setShowLoginModal,
    pendingSaveResume,
    clearPendingSaveResume,
  } = useAuth();
  const { entitlements } = useEntitlement();

  // Enable analytics tracking (scroll depth, external links)
  useAnalyticsTracking();

  const { langPath } = useLangPath();
  // 去 lang 前缀后再归一化尾斜杠：isLegalPath / isSaturnReturnPath 用精确匹配，
  // 若 URL 带尾斜杠（如 /en/saturn-return-calculator/）会匹配失败 → 误判为非公开页 → 运行时 noindex
  // 覆盖静态 stub 的 index,follow。只对多字符路径去尾斜杠，保留 "/" 与空串（/en → ""）的既有行为。
  const rawPathWithoutLang = extractLangFromPath(location.pathname)
    ? location.pathname.replace(/^\/[a-z]{2}/, "")
    : location.pathname;
  const pathWithoutLang =
    rawPathWithoutLang.length > 1
      ? rawPathWithoutLang.replace(/\/$/, "")
      : rawPathWithoutLang;
  const isWikiPath =
    pathWithoutLang === "/wiki" || pathWithoutLang.startsWith("/wiki/");
  const isLegalPath = [
    "/privacy",
    "/terms",
    "/cookies",
    "/about",
    "/help",
  ].includes(pathWithoutLang);
  const isSaturnReturnPath = pathWithoutLang === "/saturn-return-calculator";
  // /:lang/energy-timeline 是公开可索引 SEO demo 页（静态 stub 输出 index,follow 且在 sitemap）。
  // 运行时必须列入 isPublicRoute，否则 WRS 注入 noindex 会误伤 sitemap 里的 demo 页（设计 §13）。
  const isEnergyTimelinePath = pathWithoutLang === "/energy-timeline";
  // 计算器矩阵（D，sign 类）公开可索引页：静态 stub 输出 index,follow 且在 sitemap，运行时必须
  // 列入 isPublicRoute，否则 WRS 注入 noindex 会误伤收录。新增计算器 slug 须同步此表。
  const isCalculatorPath = [
    "/moon-sign-calculator",
    "/rising-sign-calculator",
    "/big-three-calculator",
    "/birth-chart-calculator",
    "/current-planets",
    "/moon-phase-calculator",
    "/ephemeris-calculator",
    "/electional-astrology",
    "/rodden-rating",
    "/celebrity-twins",
    "/astrocartography",
    "/synastry-calculator",
    "/composite-calculator",
    "/solar-return-calculator",
  ].includes(pathWithoutLang);
  // /:lang/tools 是公开可索引的工具中心 hub：静态 stub 输出 index,follow 且在 sitemap，
  // 运行时必须列入 isPublicRoute，否则 WRS 注入 noindex 会误伤收录。
  const isToolsHubPath = pathWithoutLang === "/tools";
  // /:lang/pricing 是公开可索引营销页：静态 stub（public/{lang}/pricing/index.html）输出
  // index,follow 且在 sitemap，运行时必须一致，否则 WRS 注入 noindex 会误伤 sitemap 里的定价页。
  const isPricingPath = pathWithoutLang === "/pricing";
  // T7 嵌入路由 /embed/*：渲染无 chrome 的可 iframe widget（见下方早返回）。
  const isEmbedRoute = location.pathname.startsWith("/embed/");
  // /landing-v2/{en,zh}/ is a first-class public, SEO-indexed landing route
  // (static prerender at public/landing-v2/{en,zh}/index.html emits
  // robots=index,follow). It must NOT receive the global noindex flag, and
  // it must NOT be misread by pathWithoutLang as /:lang/* with lang="landing-v2".
  const isLandingV2LangPath = /^\/landing-v2\/(en|zh)\/?$/.test(
    location.pathname,
  );
  // lang-home（/en /en/ /zh /zh/，去 lang 前缀后为 "" 或 "/"）也是公开可索引页：静态 stub 输出
  // index,follow 且在 sitemap，运行时必须一致，否则 WRS 注入 noindex 会误伤 sitemap 里的本地化首页。
  const isLangHome = pathWithoutLang === "" || pathWithoutLang === "/";
  const isPublicRoute =
    location.pathname === "/" ||
    isLangHome ||
    isWikiPath ||
    isLegalPath ||
    isSaturnReturnPath ||
    isEnergyTimelinePath ||
    isCalculatorPath ||
    isToolsHubPath ||
    isPricingPath ||
    isLandingV2LangPath;
  const shouldNoIndex = !isPublicRoute;
  const authT = t.auth;
  const lastTrackedPathRef = useRef<string | null>(null);
  const [showMigration, setShowMigration] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  // Redirect old hash-based URLs to clean URLs
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.startsWith("#/")) {
      const cleanPath = window.location.hash.slice(1); // Remove '#'
      window.history.replaceState(null, "", cleanPath + window.location.search);
    }
  }, []);

  // PayPal sometimes strips hash; redirect query params into hash routes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.search) return;
    const params = new URLSearchParams(window.location.search);
    const hasSubscription =
      params.has("subscription_id") || params.has("ba_token");
    const hasOrder = params.has("token");
    if (!hasSubscription && !hasOrder) return;
    const targetPath = hasSubscription
      ? "/payment/success"
      : "/payment/credits-success";
    // Skip redirect if already on the correct payment path
    if (location.pathname === targetPath) return;
    const targetUrl = `${window.location.origin}${targetPath}${window.location.search}`;
    window.location.replace(targetUrl);
  }, []);

  // Cloud profile shows on ANY signed-in device. We no longer gate on the
  // device-local `astro_profile_migrated` flag — that flag only ever got set on
  // the device that ran the local→cloud migration, so a second device (mobile
  // after web) saw an empty chart even though birthProfile exists in the account.
  const hasCloudProfile = !!authUser?.birthProfile;
  const cloudProfile = useMemo(() => {
    if (!hasCloudProfile || !authUser?.birthProfile) return null;
    const birth = authUser.birthProfile;
    if (!birth.birthDate || !birth.birthCity || !birth.timezone) return null;
    return {
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
    } as T.UserProfile;
  }, [authUser, hasCloudProfile]);
  const activeProfile = user || cloudProfile;

  // Guard removed — ProtectedRedirect handles unauthenticated access to protected routes

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resolvedPath = location.pathname || "/";
    if (lastTrackedPathRef.current === resolvedPath) return;
    // End engagement for previous page
    if (lastTrackedPathRef.current) {
      endPageEngagement(lastTrackedPathRef.current);
    }
    lastTrackedPathRef.current = resolvedPath;
    startPageEngagement();
    const frame = window.requestAnimationFrame(() => {
      trackPageView(resolvedPath || "/");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search, location.hash]);

  // Track page engagement on tab hide / page unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && lastTrackedPathRef.current) {
        endPageEngagement(lastTrackedPathRef.current);
      } else if (document.visibilityState === "visible") {
        startPageEngagement();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowMigration(false);
      return;
    }
    const hasLocalProfile = !!localStorage.getItem("astro_user");
    const dismissed = sessionStorage.getItem("astro_migrate_prompted") === "1";
    if (hasLocalProfile && !dismissed) {
      setMigrationStatus("idle");
      setMigrationMessage(null);
      setShowMigration(true);
    }
  }, [isAuthenticated]);

  const handleMigrate = async () => {
    setMigrationStatus("loading");
    setMigrationMessage(null);
    try {
      await migrateLocalData();
      localStorage.setItem("astro_profile_migrated", "1");
      sessionStorage.setItem("astro_migrate_prompted", "1");
      saveUser(null);
      await refreshUser();
      setMigrationStatus("success");
      setMigrationMessage(t.auth.migrate_success);
      window.setTimeout(() => setShowMigration(false), 800);
    } catch (err) {
      setMigrationStatus("error");
      setMigrationMessage(t.auth.migrate_error);
    }
  };

  const handleSkipMigration = () => {
    sessionStorage.setItem("astro_migrate_prompted", "1");
    setShowMigration(false);
  };

  // Save-chart resume (backlog #7): after a "save_chart" login/register
  // succeeds, AuthContext arms pendingSaveResume. We pick up the chart the
  // landing Save CTA forwarded in router state (memory only — it was NEVER
  // written to localStorage while anonymous, per the 2026-05-20 invariant) and
  // push it straight to the cloud, then land /dashboard so the user never has
  // to click "Save" a second time. The ref guards against the effect re-firing
  // while the async migration is in flight.
  const saveResumeInFlightRef = useRef(false);
  useEffect(() => {
    if (!pendingSaveResume || saveResumeInFlightRef.current) return;
    saveResumeInFlightRef.current = true;
    const prefill = (location.state as { prefill?: SavePrefill } | null)
      ?.prefill;
    (async () => {
      try {
        if (prefill?.birthDate && prefill?.birthCity && prefill?.timezone) {
          // 登录后把内存里的盘直接推云端（零 localStorage）——不变量安全。
          await migrateBirthProfileToAccount(
            buildBirthProfileFromPrefill(prefill),
            {
              theme:
                (localStorage.getItem("astro_theme") as "dark" | "light") ||
                "dark",
              language,
            },
          );
          localStorage.setItem("astro_profile_migrated", "1");
          await refreshUser();
          // Funnel spine — step 5 (#12 deferred this to #7). NON-PII only.
          trackEvent(FUNNEL_EVENTS.chartMigrated, {
            ...getLandingUtm(),
            source: "save_chart_resume",
            language,
          });
          navigate(langPath("/dashboard"));
        } else {
          // 无 prefill（手动登录 / 刷新丢了 state）：已登录，落 dashboard。
          navigate(langPath("/dashboard"));
        }
      } catch {
        // 迁移失败：保持已登录，用户可经既有 migrate 提示重试。不抛。
      } finally {
        clearPendingSaveResume();
        saveResumeInFlightRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSaveResume]);

  // Landing routes (root + /landing-v2 + /landing-v2/{en,zh}/) reuse the standard
  // app nav (Dashboard/Forecast/Us/Oracle/Journal/Wiki) so visitors see ONE
  // information architecture across the whole site. Previously landing had a
  // separate Co-Star-style anchor batch (Birth/Transit/Tools/Synastry/Ask/Wiki)
  // which duplicated routes and confused users — removed per user direction.
  const isLandingRoute =
    location.pathname === "/" ||
    location.pathname === "/landing-v2" ||
    isLandingV2LangPath;
  const showNav =
    isLandingRoute ||
    ((activeProfile ||
      isWikiPath ||
      isLegalPath ||
      isSaturnReturnPath ||
      isEnergyTimelinePath ||
      isCalculatorPath ||
      isToolsHubPath) &&
      !["/onboarding", "/auth"].includes(pathWithoutLang));

  // Landing routes are 100% public — never show a leftover login modal there.
  // The modal is global state in AuthContext; it persists across navigation,
  // so if a CTA on /en/wiki (or anywhere else) opened it and the user then
  // clicked the logo to escape, the modal would still be visible on /. Close
  // it on *navigation events* into a landing route — but only when the path
  // actually changed, so clicking Sign In *while already on* landing doesn't
  // instantly re-close the modal the user just opened.
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current;
    const next = location.pathname;
    prevPathRef.current = next;
    if (prev !== next && isLandingRoute && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [location.pathname, isLandingRoute, showLoginModal, setShowLoginModal]);

  // T7：嵌入路由在所有 hooks 之后早返回一个无 chrome 的最小树（仍在 Theme/Language/Auth
  // Provider 内，故 useLanguage/useTheme 正常）。绕开全站 nav/footer/login modal/paywall/analytics，
  // 让宿主站点用 <iframe src="/embed/saturn-return"> 干净嵌入。/embed/* 默认可被 iframe
  // （vercel.json 未设 X-Frame-Options / frame-ancestors）。
  if (isEmbedRoute) {
    return (
      <>
        {/* 嵌入页是工具型 iframe，非独立内容页 → noindex，避免被当薄/重复内容索引。 */}
        <SEO robots="noindex,nofollow" />
        <Suspense fallback={<OracleLoading />}>
          <Routes>
            <Route
              path="/embed/saturn-return"
              element={<SaturnReturnCalculator variant="embed" />}
            />
            {/* 计算器矩阵 embed widget：每个 slug 一个无 chrome iframe 页（EmbedWidgetShell 提供 */}
            {/* embed 上下文 + dofollow 品牌回链）。新增计算器须同步此处 + 全页 EmbedCodeBox。 */}
            <Route
              path="/embed/moon-sign-calculator"
              element={
                <EmbedWidgetShell slug="moon-sign-calculator">
                  <BirthDataCalculator config={moonSignConfig} />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/rising-sign-calculator"
              element={
                <EmbedWidgetShell slug="rising-sign-calculator">
                  <BirthDataCalculator config={risingSignConfig} />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/big-three-calculator"
              element={
                <EmbedWidgetShell slug="big-three-calculator">
                  <BirthDataCalculator config={bigThreeConfig} />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/birth-chart-calculator"
              element={
                <EmbedWidgetShell slug="birth-chart-calculator">
                  <BirthDataCalculator config={birthChartConfig} />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/current-planets"
              element={
                <EmbedWidgetShell slug="current-planets">
                  <CurrentPlanetsTool />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/moon-phase-calculator"
              element={
                <EmbedWidgetShell slug="moon-phase-calculator">
                  <MoonPhaseTool />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/ephemeris-calculator"
              element={
                <EmbedWidgetShell slug="ephemeris-calculator">
                  <EphemerisTool />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/electional-astrology"
              element={
                <EmbedWidgetShell slug="electional-astrology">
                  <ElectionalTool />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/rodden-rating"
              element={
                <EmbedWidgetShell slug="rodden-rating">
                  <RoddenRatingTool />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/celebrity-twins"
              element={
                <EmbedWidgetShell slug="celebrity-twins">
                  <CelebrityTwinsTool />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/astrocartography"
              element={
                <EmbedWidgetShell slug="astrocartography">
                  <AstrocartographyTool />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/synastry-calculator"
              element={
                <EmbedWidgetShell slug="synastry-calculator">
                  <SynastryCalculator />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/composite-calculator"
              element={
                <EmbedWidgetShell slug="composite-calculator">
                  <CompositeCalculator />
                </EmbedWidgetShell>
              }
            />
            <Route
              path="/embed/solar-return-calculator"
              element={
                <EmbedWidgetShell slug="solar-return-calculator">
                  <SolarReturnCalculator />
                </EmbedWidgetShell>
              }
            />
            <Route path="/embed/*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </>
    );
  }

  return (
    <>
      {shouldNoIndex && <SEO robots="noindex,nofollow" />}
      {showNav && (
        <nav
          aria-label="Main navigation"
          className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors ${theme === "dark" ? "bg-space-950/90 border-gold-500/15" : "bg-paper-100/90 border-paper-300"}`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            {/* Logo — on landing routes scrolls back to top; elsewhere routes
                to "/" (landing page). Conventional brand-logo behaviour: clicking
                the wordmark returns the user home, not into the authenticated
                Dashboard. */}
            <div
              className="flex items-center gap-2 font-serif font-medium text-xl cursor-pointer shrink-0"
              role="link"
              tabIndex={0}
              aria-label={t.app.name}
              onClick={() => {
                setShowLoginModal(false);
                if (isLandingRoute) {
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                } else {
                  navigate("/");
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                if (isLandingRoute) {
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                } else {
                  navigate("/");
                }
              }}
            >
              <img
                src="/logo.png"
                alt={t.app.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              {t.app.name}
            </div>

            {/* Navigation Links - Permanently Top Right.
                Single unified IA — landing reuses the same 7 entries as the
                rest of the app. Active state highlights the current route. */}
            <div className="flex items-center gap-6 ml-auto overflow-x-auto no-scrollbar">
              {[
                { path: "/dashboard", label: t.nav.dashboard },
                { path: "/forecast", label: t.nav.forecast },
                {
                  path: "/timeline",
                  label: t.nav.timeline || "Energy Timeline",
                },
                { path: "/us", label: t.nav.us },
                { path: "/oracle", label: t.nav.oracle },
                { path: "/journal", label: t.nav.journal },
                { path: langPath("/wiki"), label: t.nav.wiki },
                { path: langPath("/tools"), label: t.nav.tools || "Tools" },
              ].map((link) => {
                const isActive = isWikiPath
                  ? link.path === langPath("/wiki")
                  : location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-xs font-bold uppercase tracking-widest hover:text-gold-500 transition-colors whitespace-nowrap py-3.5 -my-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:rounded ${isActive ? "text-gold-500" : "opacity-70"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Settings / Theme Toggles */}
              <div className="h-8 w-px bg-current opacity-20 shrink-0 hidden md:block"></div>
              <button
                onClick={toggleTheme}
                className="hidden md:flex relative w-8 h-8 items-center justify-center text-2xl leading-none font-bold uppercase opacity-70 hover:opacity-100 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:rounded-full before:content-[''] before:absolute before:inset-[-6px]"
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <button
                onClick={toggleLanguage}
                className="hidden md:flex relative w-8 h-8 items-center justify-center text-xs leading-none font-bold uppercase opacity-70 hover:opacity-100 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:rounded-full before:content-[''] before:absolute before:inset-[-6px]"
              >
                {language === "zh" ? "EN" : "中"}
              </button>

              {/* User Menu — on landing routes for unauthenticated users we surface
                  a Sign in CTA via UserMenu; authenticated users see their avatar. */}
              <div className="h-8 w-px bg-current opacity-20 shrink-0 hidden md:block"></div>
              <UserMenu />
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Utility Toggle (Since main nav is now text links at top, we keep util buttons accessible) */}
      {showNav && (
        <div className="md:hidden fixed top-20 right-4 z-40 flex flex-col gap-3">
          <button
            onClick={toggleTheme}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 before:content-[''] before:absolute before:inset-[-6px] ${theme === "dark" ? "bg-space-900/80 border-gold-500/15" : "bg-paper-100/80 border-paper-300"}`}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            onClick={toggleLanguage}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 before:content-[''] before:absolute before:inset-[-6px] ${theme === "dark" ? "bg-space-900/80 border-gold-500/15" : "bg-paper-100/80 border-paper-300"}`}
          >
            {language === "zh" ? "EN" : "中"}
          </button>
        </div>
      )}

      <main
        id="main-content"
        role="main"
        className={
          showNav
            ? // max-md:pb-24 clears the fixed mobile bottom tab bar so the last
              // row of content is never hidden behind it (desktop keeps pb-12).
              isLandingRoute
              ? "max-md:pb-24" /* Hero section provides its own pt-16 to clear the fixed nav. */
              : location.pathname === "/journal"
                ? "pt-16 pb-12 max-md:pb-24"
                : "pt-24 pb-12 max-md:pb-24"
            : ""
        }
      >
        <Suspense fallback={<OracleLoading />}>
          <Routes>
            {/* L2 cutover (2026-05-19): root now renders the v2 landing page
                directly instead of redirecting to /:lang/wiki. The Wiki hub
                remains reachable at /:lang/wiki for direct entry + internal
                links; only the default unauthenticated landing experience
                changed. Logged-in users still see the marketing landing —
                AuthContext gating is handled inside LandingPageV2 sections
                where it matters (e.g., BirthChart CTA). */}
            <Route path="/" element={<LandingPageV2 />} />
            <Route path="/go/:code" element={<GoRedirectPage />} />
            <Route path="/landing-v2" element={<LandingPageV2 />} />
            {/* SPA/static parity route for /landing-v2/{en,zh}/.
                MUST be registered before the /:lang/* catch-all so React
                Router matches landingLang here instead of treating
                "landing-v2" as the :lang param (which would route to
                LangStripRedirect → NotFoundPage). See LandingV2LangRoute. */}
            <Route
              path="/landing-v2/:landingLang"
              element={<LandingV2LangRoute />}
            />
            {/* /onboarding completes via saveUser → localStorage → /dashboard.
                When the visitor is NOT authenticated, suppress the save and
                surface the login modal instead. Without this gate the landing
                BirthChart → "Save my chart" → auto-complete flow silently
                writes a guest chart into localStorage that the next sign-in
                inherits as the user's chart — surprising the user (reported
                2026-05-20). Wizard stays mounted so post-login click of
                "Save" resumes naturally with the prefilled fields. */}
            <Route
              path="/onboarding"
              element={
                <OnboardingPage
                  onComplete={(u) => {
                    if (!isAuthenticated) {
                      // Funnel spine — step 3 (#12 deferred this to #7).
                      // NON-PII only: source + UTM + language. The chart itself
                      // stays in router state until login (no localStorage).
                      trackEvent(FUNNEL_EVENTS.authPrompted, {
                        ...getLandingUtm(),
                        source: "save_chart",
                        language,
                      });
                      openLoginModal("save_chart");
                      return;
                    }
                    saveUser(u);
                    navigate("/dashboard");
                  }}
                />
              }
            />
            {/* Protected routes gate on isAuthenticated AND activeProfile.
                Previously only `activeProfile` was checked, so unauthenticated
                visitors whose localStorage held a chart (from the landing
                inline form → onboarding auto-complete path introduced in
                PR #25) saw populated /dashboard, /forecast, etc. — surprising
                "I haven't signed in, why is my data here?" behavior reported
                by the user on 2026-05-20. ProtectedRedirect handles both
                branches: unauth opens login modal + returns to /wiki;
                authenticated-but-no-profile sends to /onboarding. */}
            <Route
              path="/dashboard"
              element={
                isAuthenticated && activeProfile ? (
                  <MePage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/forecast"
              element={
                isAuthenticated && activeProfile ? (
                  <TodayPage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/cycles"
              element={
                isAuthenticated && activeProfile ? (
                  <CyclesPage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/timeline"
              element={
                isAuthenticated && activeProfile ? (
                  <TimelinePage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/us"
              element={
                isAuthenticated && activeProfile ? (
                  <UsPage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/oracle"
              element={
                isAuthenticated && activeProfile ? (
                  <AskOraclePage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/journal"
              element={
                isAuthenticated && activeProfile ? (
                  <CBTMainPage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            {/* Language-prefixed public routes */}
            <Route
              path="/:lang/wiki"
              element={
                <LangGuard>
                  <WikiHubPage />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/wiki/classics"
              element={
                <LangGuard>
                  <WikiClassicsPage />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/wiki/classics/:id"
              element={
                <LangGuard>
                  <WikiClassicDetailPage />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/wiki/author/:authorId"
              element={
                <LangGuard>
                  <AuthorPage />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/wiki/:id"
              element={
                <LangGuard>
                  <WikiDetailPage />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/privacy"
              element={
                <LangGuard>
                  <PrivacyPolicy />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/terms"
              element={
                <LangGuard>
                  <TermsOfService />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/cookies"
              element={
                <LangGuard>
                  <CookiePolicy />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/about"
              element={
                <LangGuard>
                  <AboutPage />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/help"
              element={
                <LangGuard>
                  <HelpPage />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/saturn-return-calculator"
              element={
                <LangGuard>
                  <SaturnReturnCalculator />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/energy-timeline"
              element={
                <LangGuard>
                  <EnergyTimelineDemoPage />
                </LangGuard>
              }
            />
            {/* Calculator matrix (D, sign-based) — one config-driven shell per slug. */}
            <Route
              path="/:lang/moon-sign-calculator"
              element={
                <LangGuard>
                  <BirthDataCalculator config={moonSignConfig} />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/rising-sign-calculator"
              element={
                <LangGuard>
                  <BirthDataCalculator config={risingSignConfig} />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/big-three-calculator"
              element={
                <LangGuard>
                  <BirthDataCalculator config={bigThreeConfig} />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/birth-chart-calculator"
              element={
                <LangGuard>
                  <BirthDataCalculator config={birthChartConfig} />
                </LangGuard>
              }
            />
            {/* Calculator matrix (D, astronomy tools) — no birth data, reuse /api/astro/*. */}
            <Route
              path="/:lang/current-planets"
              element={
                <LangGuard>
                  <CurrentPlanetsTool />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/moon-phase-calculator"
              element={
                <LangGuard>
                  <MoonPhaseTool />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/ephemeris-calculator"
              element={
                <LangGuard>
                  <EphemerisTool />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/electional-astrology"
              element={
                <LangGuard>
                  <ElectionalTool />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/rodden-rating"
              element={
                <LangGuard>
                  <RoddenRatingTool />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/celebrity-twins"
              element={
                <LangGuard>
                  <CelebrityTwinsTool />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/astrocartography"
              element={
                <LangGuard>
                  <AstrocartographyTool />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/synastry-calculator"
              element={
                <LangGuard>
                  <SynastryCalculator />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/composite-calculator"
              element={
                <LangGuard>
                  <CompositeCalculator />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/solar-return-calculator"
              element={
                <LangGuard>
                  <SolarReturnCalculator />
                </LangGuard>
              }
            />
            {/* Tools hub — 计算器矩阵统一发现入口（hub-and-spoke 内链中枢）。 */}
            <Route
              path="/:lang/tools"
              element={
                <LangGuard>
                  <ToolsHubPage />
                </LangGuard>
              }
            />
            <Route
              path="/:lang/pricing"
              element={
                <LangGuard>
                  <PricingPage />
                </LangGuard>
              }
            />
            {/* Bare public routes redirect to language-prefixed versions */}
            <Route
              path="/saturn-return-calculator"
              element={<LangRedirect />}
            />
            <Route path="/energy-timeline" element={<LangRedirect />} />
            <Route path="/moon-sign-calculator" element={<LangRedirect />} />
            <Route path="/rising-sign-calculator" element={<LangRedirect />} />
            <Route path="/big-three-calculator" element={<LangRedirect />} />
            <Route path="/birth-chart-calculator" element={<LangRedirect />} />
            <Route path="/current-planets" element={<LangRedirect />} />
            <Route path="/moon-phase-calculator" element={<LangRedirect />} />
            <Route path="/ephemeris-calculator" element={<LangRedirect />} />
            <Route path="/electional-astrology" element={<LangRedirect />} />
            <Route path="/rodden-rating" element={<LangRedirect />} />
            <Route path="/celebrity-twins" element={<LangRedirect />} />
            <Route path="/astrocartography" element={<LangRedirect />} />
            <Route path="/synastry-calculator" element={<LangRedirect />} />
            <Route path="/composite-calculator" element={<LangRedirect />} />
            <Route path="/solar-return-calculator" element={<LangRedirect />} />
            <Route path="/tools" element={<LangRedirect />} />
            <Route path="/pricing" element={<LangRedirect />} />
            <Route path="/wiki/*" element={<LangRedirect />} />
            <Route path="/wiki" element={<LangRedirect />} />
            <Route path="/privacy" element={<LangRedirect />} />
            <Route path="/terms" element={<LangRedirect />} />
            <Route path="/cookies" element={<LangRedirect />} />
            <Route path="/about" element={<LangRedirect />} />
            <Route path="/help" element={<LangRedirect />} />
            <Route
              path="/settings"
              element={
                isAuthenticated && activeProfile ? (
                  <SettingsPage
                    profile={activeProfile}
                    onReset={() => {
                      localStorage.removeItem("astro_profile_migrated");
                      saveUser(null);
                    }}
                  />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/usage"
              element={
                isAuthenticated && activeProfile ? (
                  <CreditsUsagePage />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/saved"
              element={
                isAuthenticated && activeProfile ? (
                  <SavedReadingsPage />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/saved/:id"
              element={
                isAuthenticated && activeProfile ? (
                  <SavedReadingDetailPage />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/:lang/auth"
              element={
                <LangGuard>
                  <AuthPage />
                </LangGuard>
              }
            />
            <Route path="/auth" element={<LangRedirect />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:reportId" element={<ReportViewPage />} />
            <Route
              path="/payment/success"
              element={
                LOGIN_GATE_MODE ? <Navigate to="/" /> : <PaymentSuccessPage />
              }
            />
            <Route
              path="/payment/credits-success"
              element={
                LOGIN_GATE_MODE ? <Navigate to="/" /> : <CreditsSuccessPage />
              }
            />
            <Route path="/color-demo" element={<ColorSystemDemo />} />
            {/* Catch-all: /:lang/* SPA routes strip prefix and redirect */}
            <Route path="/:lang/*" element={<LangStripRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {showMigration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-space-950/50 backdrop-blur-sm"
            onClick={handleSkipMigration}
          />
          <div
            className={`relative max-w-md w-full rounded-2xl border p-6 shadow-2xl ${theme === "dark" ? "border-gold-500/15 bg-space-950" : "border-paper-300 bg-paper-100/90"}`}
          >
            <button
              onClick={handleSkipMigration}
              className={`absolute top-4 right-4 transition-colors ${theme === "dark" ? "text-star-400 hover:text-star-50" : "text-paper-500 hover:text-paper-900"}`}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4 text-center">
              <h2
                className={`text-xl font-bold ${theme === "dark" ? "text-star-50" : "text-paper-900"}`}
              >
                {authT.migrate_title}
              </h2>
              <p
                className={`text-sm mt-2 ${theme === "dark" ? "text-star-400" : "text-paper-600"}`}
              >
                {authT.migrate_desc}
              </p>
            </div>
            {migrationMessage && (
              <div
                className={`mb-4 rounded-lg border px-3 py-2 text-center text-sm ${
                  migrationStatus === "error"
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {migrationMessage}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <ActionButton
                variant="outline"
                onClick={handleSkipMigration}
                disabled={migrationStatus === "loading"}
                className="flex-1"
              >
                {authT.migrate_later}
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleMigrate}
                disabled={migrationStatus === "loading"}
                className="flex-1"
              >
                {migrationStatus === "loading" ? "..." : authT.migrate_confirm}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {showNav && <Footer />}
      {showNav && <MobileBottomNav />}
      <ConsentBanner />
      {/* Auth Modals */}
      <LoginModal />
      {!FREE_MODE && !LOGIN_GATE_MODE && <UpgradeModal />}
      {!FREE_MODE && !LOGIN_GATE_MODE && <CreditsModalWrapper />}
    </>
  );
};

const App: React.FC = () => {
  // 在开发环境中暴露 GM 命令到 window 对象
  useEffect(() => {
    if (import.meta.env.DEV) {
      // @ts-ignore
      window.gmUnlockSubscription = async () => {
        try {
          const result = await gmUnlockSubscription();
          console.log("✅ 订阅已解锁 | Subscription unlocked:", result);
          window.location.reload();
        } catch (error) {
          console.error(
            "❌ 解锁订阅失败 | Failed to unlock subscription:",
            error,
          );
        }
      };

      // @ts-ignore
      window.gmCancelSubscription = async () => {
        try {
          const result = await gmCancelSubscription();
          console.log("✅ 订阅已取消 | Subscription cancelled:", result);
          window.location.reload();
        } catch (error) {
          console.error(
            "❌ 取消订阅失败 | Failed to cancel subscription:",
            error,
          );
        }
      };

      // @ts-ignore
      window.gmAddTokens = async (amount = 9999) => {
        try {
          const result = await gmAddTokens(amount);
          console.log(
            `✅ 已添加 ${amount} 积分 | Added ${amount} credits:`,
            result,
          );
          window.location.reload();
        } catch (error) {
          console.error("❌ 添加积分失败 | Failed to add credits:", error);
        }
      };

      // @ts-ignore
      window.gmClearTokens = async () => {
        try {
          const result = await gmClearTokens();
          console.log("✅ 积分已清零 | Credits cleared:", result);
          window.location.reload();
        } catch (error) {
          console.error("❌ 清零积分失败 | Failed to clear credits:", error);
        }
      };

      // @ts-ignore
      window.gmCreateDevSession = async () => {
        try {
          const result = await gmCreateDevSession();
          console.log("✅ GM 开发会话已创建 | GM dev session created:", result);
          window.location.reload();
        } catch (error) {
          console.error(
            "❌ 创建 GM 会话失败 | Failed to create GM session:",
            error,
          );
        }
      };

      // @ts-ignore
      window.gmHelp = () => {
        console.log(`
🎮 GM 命令帮助 | GM Commands Help
================================

可用命令 | Available Commands:
---------------------------------
1. gmUnlockSubscription()
   解锁订阅功能（模拟 Pro 会员）
   Unlock subscription (simulate Pro membership)

2. gmCancelSubscription()
   取消订阅
   Cancel subscription

3. gmAddTokens(amount?)
   添加积分（默认 9999）
   Add credits (default 9999)
   示例 | Example: gmAddTokens(5000)

4. gmClearTokens()
   清零所有积分
   Clear all credits

5. gmCreateDevSession()
   创建开发测试会话（自动登录测试账号）
   Create dev session (auto login test account)

6. gmHelp()
   显示此帮助信息
   Show this help message

使用说明 | Usage:
---------------------------------
1. 打开浏览器控制台（F12）
   Open browser console (F12)

2. 输入命令并回车
   Type command and press Enter

3. 命令执行后会自动刷新页面
   Page will reload after command execution

注意 | Note:
---------------------------------
• 这些命令仅在开发环境可用
  These commands are only available in development

• 需要先登录才能使用（除了 gmCreateDevSession）
  Login required (except gmCreateDevSession)
        `);
      };

      console.log(
        "🎮 GM 命令已加载 | GM commands loaded. 输入 gmHelp() 查看帮助 | Type gmHelp() for help",
      );
    }
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <EntitlementProvider>
              <GlobalSchema />
              <AppContent />
            </EntitlementProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
