// INPUT: Wiki 入口页签与路由状态（含独立页签、SEO 元信息与 1280 容器约束）。
// OUTPUT: 导出 Wiki 聚合页面组件（包含首页/百科/经典页签与基础 SEO 输出）。
// POS: Wiki 路由入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ActionButton, Container, useLanguage } from "../UIComponents";
import { SEO } from "../SEO";
import WikiHomePage from "./WikiHomePage";
import WikiIndexPage from "./WikiIndexPage";
import WikiClassicsPage from "./WikiClassicsPage";
import WikiSyntheticaPage from "./WikiSyntheticaPage";
import WikiArticlesPage from "./WikiArticlesPage";
import { useAuth } from "../../contexts/AuthContext";
import { LOGIN_GATE_MODE } from "../../constants";
import { useLangPath } from "../../hooks/useLangPath";

// Visible tabs shown in the tab bar
const TAB_VALUES = ["home", "library", "classics", "tools"] as const;
// Full tab type includes hidden tabs reachable via direct URL (e.g. /wiki?tab=articles)
type WikiTab = (typeof TAB_VALUES)[number] | "articles";

const resolveTab = (search: string): WikiTab => {
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  if (tab === "library") return "library";
  if (tab === "classics") return "classics";
  if (tab === "tools") return "tools";
  if (tab === "articles") return "articles";
  return "home";
};

const WikiHubPage: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { langPath } = useLangPath();

  const activeTab = useMemo(
    () => resolveTab(location.search),
    [location.search],
  );
  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  const lang = language === "en" ? "en" : "zh";
  const canonicalUrl = `${siteUrl}/${lang}/wiki`;
  const alternateLanguages = [
    { hrefLang: "zh", href: `${siteUrl}/zh/wiki` },
    { hrefLang: "en", href: `${siteUrl}/en/wiki` },
    { hrefLang: "x-default", href: `${siteUrl}/en/wiki` },
  ];

  const hubTitle = t.wiki.title || t.wiki.hero_title;
  const hubDescription = t.wiki.subtitle || t.wiki.hero_subtitle;

  const handleTabChange = (tab: WikiTab) => {
    // LOGIN_GATE_MODE: Tools tab 需要登录
    if (LOGIN_GATE_MODE && tab === "tools" && !isAuthenticated) {
      openLoginModal(
        t.login_gate?.unlock_wiki_tools || "Sign in to use astrology tools",
      );
      return;
    }
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    if (tab !== "library") params.delete("section");
    const next = params.toString();
    navigate(langPath(`/wiki${next ? `?${next}` : ""}`));
  };

  return (
    <Container>
      <SEO
        title={hubTitle}
        description={hubDescription}
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        type="website"
      />
      <div className="space-y-10">
        {/* Only show visible tabs - articles tab is hidden but route still works */}
        {activeTab !== "articles" && (
          <div className="flex items-center justify-end gap-3">
            {TAB_VALUES.map((tab) => (
              <ActionButton
                key={tab}
                size="sm"
                variant={activeTab === tab ? "primary" : "outline"}
                className="rounded-full px-5"
                onClick={() => handleTabChange(tab)}
              >
                {tab === "home"
                  ? t.wiki.tab_home
                  : tab === "library"
                    ? t.wiki.tab_library
                    : tab === "classics"
                      ? t.wiki.tab_classics
                      : t.wiki.tab_tools}
              </ActionButton>
            ))}
          </div>
        )}

        {activeTab === "home" ? (
          <WikiHomePage />
        ) : activeTab === "library" ? (
          <WikiIndexPage />
        ) : activeTab === "classics" ? (
          <WikiClassicsPage />
        ) : activeTab === "tools" ? (
          LOGIN_GATE_MODE && !isAuthenticated ? (
            <WikiHomePage />
          ) : (
            <WikiSyntheticaPage />
          )
        ) : (
          <WikiArticlesPage />
        )}
      </div>
    </Container>
  );
};

export default WikiHubPage;
