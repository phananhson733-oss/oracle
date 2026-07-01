// @vitest-environment jsdom
// INPUT: WikiDetailPage rendered for a slug that is NOT a known article in this
//        bundle (isArticleSlug=false) and 404s on the core-item API (fetchWikiItem
//        rejects) — the exact "stale JS bundle loaded before this article was
//        published" situation.
// OUTPUT: self-heal contract — the FIRST such 404 hard-reloads the page once (to
//        pull the fresh bundle that knows the new slug) and records a sessionStorage
//        guard; once the guard is set, a genuinely-missing slug shows the error page
//        instead of looping.
// POS: guards the fix for "Failed to fetch wiki item" seen right after publishing.
//      If you change the reload/guard logic in WikiDetailPage, sync this test.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

// Stale bundle → the freshly-published slug is unknown, so WikiDetailPage falls
// through to the core-item fetch path instead of WikiArticleDetailPage.
vi.mock("../../data/articles", () => ({
  isArticleSlug: () => false,
  getArticleSummaries: () => [],
}));

const fetchWikiItem = vi.fn();
vi.mock("../../services/apiClient", () => ({
  fetchWikiItem: (...args: unknown[]) => fetchWikiItem(...args),
  fetchWikiItems: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock("../../components/UIComponents", () => {
  const passthrough = ({ children }: { children?: unknown }) => children;
  return {
    useLanguage: () => ({
      language: "en",
      t: {
        app: { error: "Failed to fetch wiki item" },
        common: { loading: "Loading" },
        meta: { env: {} },
        wiki: {
          subtitle: "",
          detail_back: "Back to Wiki",
          detail_related: "",
          detail_tldr: "",
          detail_core: "",
          detail_psychology: "",
          detail_shadow: "",
          detail_myth: "",
          detail_archetype: "",
          detail_analogy: "",
          detail_deep_dive: "",
          detail_integration: "",
          detail_placeholder: "",
          tab_home: "",
          tab_library: "Library",
          type_labels: {},
        },
      },
    }),
    useTheme: () => ({ theme: "light" }),
    Container: passthrough,
    Card: passthrough,
    Section: passthrough,
    Accordion: passthrough,
  };
});

vi.mock("../../hooks/useLangPath", () => ({
  useLangPath: () => ({ langPath: (p: string) => `/en${p}` }),
}));

vi.mock("../../components/SEO", () => ({ SEO: () => null }));
vi.mock("../../components/wiki/RelatedArticles", () => ({
  RelatedArticles: () => null,
}));
vi.mock("../../components/Breadcrumb", () => ({ Breadcrumb: () => null }));
vi.mock("../../components/wiki/WikiArticleDetailPage", () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock("../../components/wiki/WikiChartCTA", () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock("../../services/analytics", () => ({ trackEvent: vi.fn() }));

import WikiDetailPage from "../../components/wiki/WikiDetailPage";

const SLUG = "just-published-article";
const reloadMock = vi.fn();

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={[`/en/wiki/${SLUG}`]}>
      <Routes>
        <Route path="/en/wiki/:id" element={<WikiDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  fetchWikiItem.mockReset();
  reloadMock.mockReset();
  window.sessionStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { href: `http://localhost/en/wiki/${SLUG}`, reload: reloadMock },
  });
});

describe("WikiDetailPage stale-bundle self-heal", () => {
  it("hard-reloads exactly once when a fresh article slug 404s on the core-item API", async () => {
    fetchWikiItem.mockRejectedValue(new Error("Failed to fetch wiki item"));
    renderAt();
    await waitFor(() => expect(reloadMock).toHaveBeenCalledTimes(1));
    expect(window.sessionStorage.getItem(`wiki-item-reload:${SLUG}`)).toBe("1");
  });

  it("shows the error (no reload loop) once the guard is already set", async () => {
    window.sessionStorage.setItem(`wiki-item-reload:${SLUG}`, "1");
    fetchWikiItem.mockRejectedValue(new Error("Failed to fetch wiki item"));
    renderAt();
    await screen.findByText("Failed to fetch wiki item");
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
