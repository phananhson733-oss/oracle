// INPUT: React、BrowserRouter、组件与后端数据服务依赖（含 SEO head 输出、付费墙回调与分析追踪）。
// OUTPUT: 导出主应用组件（含合盘积分购买后自动触发生成、Analytics 路由追踪、同意横幅与核心功能事件）。
// POS: 主应用路由与页面编排中心（BrowserRouter SPA 路由、付费墙后续流程与分析事件接入、支付成功页放行与 PayPal 回跳处理、旧 hash URL 兼容重定向）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
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
} from "./services/analytics";
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
import { Footer } from "./components/Footer";
import { useAnalyticsTracking } from "./hooks/useAnalytics";

// Global SEO schemas (Organization, WebSite)
const GlobalSchema: React.FC = () => {
  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AstrologyWiki",
    url: siteUrl,
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
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/wiki?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    // Organization schema
    const orgScript = document.createElement("script");
    orgScript.type = "application/ld+json";
    orgScript.textContent = JSON.stringify(organizationSchema);
    orgScript.setAttribute("data-astro-global-schema", "organization");
    document.head.appendChild(orgScript);

    // Website schema
    const webScript = document.createElement("script");
    webScript.type = "application/ld+json";
    webScript.textContent = JSON.stringify(websiteSchema);
    webScript.setAttribute("data-astro-global-schema", "website");
    document.head.appendChild(webScript);

    return () => {
      document
        .querySelectorAll("[data-astro-global-schema]")
        .forEach((el) => el.remove());
    };
  }, []);

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

const UsPage = lazy(() => import("./pages/SynastryPage"));

const AskOraclePage = lazy(() => import("./pages/OraclePage"));

const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const CreditsUsagePage = lazy(() => import("./pages/CreditsUsagePage"));

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
    refreshUser,
    user: authUser,
  } = useAuth();
  const { entitlements } = useEntitlement();

  // Enable analytics tracking (scroll depth, external links)
  useAnalyticsTracking();

  const { langPath } = useLangPath();
  const pathWithoutLang = extractLangFromPath(location.pathname)
    ? location.pathname.replace(/^\/[a-z]{2}/, "")
    : location.pathname;
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
  // /landing-v2/{en,zh}/ is a first-class public, SEO-indexed landing route
  // (static prerender at public/landing-v2/{en,zh}/index.html emits
  // robots=index,follow). It must NOT receive the global noindex flag, and
  // it must NOT be misread by pathWithoutLang as /:lang/* with lang="landing-v2".
  const isLandingV2LangPath = /^\/landing-v2\/(en|zh)\/?$/.test(
    location.pathname,
  );
  const isPublicRoute =
    location.pathname === "/" ||
    isWikiPath ||
    isLegalPath ||
    isSaturnReturnPath ||
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

  const hasCloudProfile =
    !!authUser?.birthProfile &&
    localStorage.getItem("astro_profile_migrated") === "1";
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

  const showNav =
    (activeProfile || isWikiPath || isLegalPath || isSaturnReturnPath) &&
    !["/", "/onboarding", "/auth"].includes(pathWithoutLang);

  return (
    <>
      {shouldNoIndex && <SEO robots="noindex,nofollow" />}
      {showNav && (
        <nav
          aria-label="Main navigation"
          className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors ${theme === "dark" ? "bg-space-950/90 border-gold-500/15" : "bg-paper-100/90 border-paper-300"}`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-2 font-serif font-medium text-xl cursor-pointer shrink-0"
              onClick={() => navigate("/dashboard")}
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

            {/* Navigation Links - Permanently Top Right */}
            <div className="flex items-center gap-6 ml-auto overflow-x-auto no-scrollbar">
              {[
                { path: "/dashboard", label: t.nav.dashboard },
                { path: "/forecast", label: t.nav.forecast },
                { path: "/us", label: t.nav.us },
                { path: "/oracle", label: t.nav.oracle },
                { path: "/journal", label: t.nav.journal },
                { path: langPath("/wiki"), label: t.nav.wiki },
              ].map((link) => {
                const isActive = isWikiPath
                  ? link.path === langPath("/wiki")
                  : location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-xs font-bold uppercase tracking-widest hover:text-gold-500 transition-colors whitespace-nowrap ${isActive ? "text-gold-500" : "opacity-70"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Settings / Theme Toggles */}
              <div className="h-8 w-px bg-current opacity-20 shrink-0 hidden md:block"></div>
              <button
                onClick={toggleTheme}
                className="hidden md:flex w-8 h-8 items-center justify-center text-2xl leading-none font-bold uppercase opacity-70 hover:opacity-100 shrink-0"
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <button
                onClick={toggleLanguage}
                className="hidden md:flex w-8 h-8 items-center justify-center text-xs leading-none font-bold uppercase opacity-70 hover:opacity-100 shrink-0"
              >
                {language === "zh" ? "EN" : "中"}
              </button>

              {/* User Menu */}
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
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg ${theme === "dark" ? "bg-space-900/80 border-gold-500/15" : "bg-paper-100/80 border-paper-300"}`}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            onClick={toggleLanguage}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg text-xs font-bold ${theme === "dark" ? "bg-space-900/80 border-gold-500/15" : "bg-paper-100/80 border-paper-300"}`}
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
            ? location.pathname === "/journal"
              ? "pt-16 pb-12"
              : "pt-24 pb-12"
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
            <Route
              path="/onboarding"
              element={
                <OnboardingPage
                  onComplete={(u) => {
                    saveUser(u);
                    navigate("/dashboard");
                  }}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                activeProfile ? (
                  <MePage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/forecast"
              element={
                activeProfile ? (
                  <TodayPage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/cycles"
              element={
                activeProfile ? (
                  <CyclesPage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/us"
              element={
                activeProfile ? (
                  <UsPage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/oracle"
              element={
                activeProfile ? (
                  <AskOraclePage profile={activeProfile} />
                ) : (
                  <ProtectedRedirect />
                )
              }
            />
            <Route
              path="/journal"
              element={
                activeProfile ? (
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
            {/* Bare public routes redirect to language-prefixed versions */}
            <Route
              path="/saturn-return-calculator"
              element={<LangRedirect />}
            />
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
                activeProfile ? (
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
                activeProfile ? <CreditsUsagePage /> : <ProtectedRedirect />
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
