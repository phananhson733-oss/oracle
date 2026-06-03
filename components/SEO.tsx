// INPUT: SEOProps（title/description/canonical/schema/alternates 等）；React + document.head。
// OUTPUT: 在 <head> upsert title/meta/link/JSON-LD；返回 null（纯副作用组件）。
// POS: 全站页面级 SEO 注入点。JSON-LD 采用 type-aware 去重：剥离预渲染 stub 已 bake 的同 @type
//      顶层条目（保留 Org/WebSite 给 App.tsx GlobalSchema），避免 WRS 双发触发 GSC "字段重复"。
//      若改注入/去重逻辑，同步 components/FOLDER.md 与 tests/unit/seo-jsonld-dedupe.test.tsx。

import React, { useEffect, useMemo, useRef } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  /** 显式 canonical override。设置后 <link rel=canonical> 用它而非 self/url，避免 WRS 把静态 canonical 改回自指。可传 lang-relative 或绝对 URL。 */
  canonicalUrl?: string;
  type?: "website" | "article" | "book" | "profile";
  schema?: Record<string, any> | Array<Record<string, any>>;
  keywords?: string[];
  author?: string;
  robots?: string;
  alternateLanguages?: Array<{ hrefLang: string; href: string }>;
  // Article specific
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  section?: string;
  tags?: string[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = "AstrologyWiki - Your guide to modern astrology, psychology, and self-discovery.",
  image = "/og-image.png",
  url,
  canonicalUrl,
  type = "website",
  schema,
  keywords = [],
  author = "AstrologyWiki",
  robots,
  alternateLanguages = [],
  publishedTime,
  modifiedTime,
  authorName,
  section,
  tags = [],
}) => {
  const siteTitle = "AstrologyWiki";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const fallbackUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "https://www.astrologywiki.com";
  const currentUrl = url || fallbackUrl;
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.astrologywiki.com";
  const resolveAbsoluteUrl = (value: string) => {
    if (!value) return value;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("//")) return `https:${value}`;
    return `${baseUrl}${value.startsWith("/") ? "" : "/"}${value}`;
  };
  const resolvedImage = resolveAbsoluteUrl(image);
  // canonical 优先用显式 override（来自 seo.canonicalPath），否则回退 self/url。
  // 这样静态 stub 与运行时输出同一个 canonical，WRS 执行 React 后不会改回自指。
  const resolvedCanonical = resolveAbsoluteUrl(canonicalUrl || currentUrl);
  const allKeywords = useMemo(
    () =>
      [
        "astrology",
        "psychological astrology",
        "natal chart",
        "horoscope",
        "psychology",
        "self-discovery",
        ...keywords,
      ].join(", "),
    [keywords],
  );
  const ownerRef = useRef(`astro-seo-${Math.random().toString(36).slice(2)}`);
  const cleanupRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const head = document.head;
    if (!head) return;

    cleanupRef.current.forEach((fn) => fn());
    cleanupRef.current = [];

    const ownerId = ownerRef.current;
    const ownerAttr = "data-astro-seo-owner";
    const cleanupFns: Array<() => void> = [];

    const restoreAttr = (
      el: Element,
      attr: string,
      prevValue: string | null,
    ) => {
      if (prevValue === null) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, prevValue);
      }
    };

    const restoreOwner = (el: Element, prevOwner: string | null) => {
      if (prevOwner === null) {
        el.removeAttribute(ownerAttr);
      } else {
        el.setAttribute(ownerAttr, prevOwner);
      }
    };

    const upsertMeta = (
      attrName: "name" | "property",
      attrValue: string,
      contentValue: string | null | undefined,
    ) => {
      if (contentValue === null || contentValue === undefined) return;
      const selector = `meta[${attrName}="${attrValue}"]`;
      const existing = head.querySelector(selector);
      if (existing) {
        const prevContent = existing.getAttribute("content");
        const prevOwner = existing.getAttribute(ownerAttr);
        existing.setAttribute("content", contentValue);
        existing.setAttribute(ownerAttr, ownerId);
        cleanupFns.push(() => {
          if (existing.getAttribute(ownerAttr) !== ownerId) return;
          restoreAttr(existing, "content", prevContent);
          restoreOwner(existing, prevOwner);
        });
      } else {
        const meta = document.createElement("meta");
        meta.setAttribute(attrName, attrValue);
        meta.setAttribute("content", contentValue);
        meta.setAttribute(ownerAttr, ownerId);
        head.appendChild(meta);
        cleanupFns.push(() => {
          if (meta.getAttribute(ownerAttr) !== ownerId) return;
          meta.remove();
        });
      }
    };

    const upsertLink = (
      relValue: string,
      hrefValue: string | null | undefined,
      extraAttrs: Record<string, string> = {},
    ) => {
      if (!hrefValue) return;
      const extraSelector = Object.entries(extraAttrs)
        .map(([key, value]) => `[${key}="${value}"]`)
        .join("");
      const selector = `link[rel="${relValue}"]${extraSelector}`;
      const existing = head.querySelector(selector);
      if (existing) {
        const prevHref = existing.getAttribute("href");
        const prevRel = existing.getAttribute("rel");
        const prevOwner = existing.getAttribute(ownerAttr);
        const prevExtraAttrs = Object.keys(extraAttrs).reduce<
          Record<string, string | null>
        >((acc, key) => {
          acc[key] = existing.getAttribute(key);
          return acc;
        }, {});
        existing.setAttribute("rel", relValue);
        existing.setAttribute("href", hrefValue);
        Object.entries(extraAttrs).forEach(([key, value]) =>
          existing.setAttribute(key, value),
        );
        existing.setAttribute(ownerAttr, ownerId);
        cleanupFns.push(() => {
          if (existing.getAttribute(ownerAttr) !== ownerId) return;
          restoreAttr(existing, "href", prevHref);
          restoreAttr(existing, "rel", prevRel);
          Object.entries(prevExtraAttrs).forEach(([key, prevValue]) => {
            restoreAttr(existing, key, prevValue);
          });
          restoreOwner(existing, prevOwner);
        });
      } else {
        const link = document.createElement("link");
        link.setAttribute("rel", relValue);
        link.setAttribute("href", hrefValue);
        Object.entries(extraAttrs).forEach(([key, value]) =>
          link.setAttribute(key, value),
        );
        link.setAttribute(ownerAttr, ownerId);
        head.appendChild(link);
        cleanupFns.push(() => {
          if (link.getAttribute(ownerAttr) !== ownerId) return;
          link.remove();
        });
      }
    };

    const setTitle = (value: string) => {
      const existing = head.querySelector("title");
      if (existing) {
        const prevText = existing.textContent;
        const prevOwner = existing.getAttribute(ownerAttr);
        existing.textContent = value;
        existing.setAttribute(ownerAttr, ownerId);
        cleanupFns.push(() => {
          if (existing.getAttribute(ownerAttr) !== ownerId) return;
          existing.textContent = prevText ?? "";
          restoreOwner(existing, prevOwner);
        });
      } else {
        const titleEl = document.createElement("title");
        titleEl.textContent = value;
        titleEl.setAttribute(ownerAttr, ownerId);
        head.appendChild(titleEl);
        cleanupFns.push(() => {
          if (titleEl.getAttribute(ownerAttr) !== ownerId) return;
          titleEl.remove();
        });
      }
    };

    const setJsonLd = (
      value: Record<string, any> | Array<Record<string, any>>,
    ) => {
      const emitted = Array.isArray(value) ? value : [value];
      const emittedTypes = new Set(
        emitted
          .map((entry) =>
            entry && typeof entry["@type"] === "string" ? entry["@type"] : null,
          )
          .filter((t): t is string => Boolean(t)),
      );

      // Dedupe defense (mirrors App.tsx GlobalSchema). The prerendered stub
      // bakes page-level schema (Article / FAQPage / BreadcrumbList / …) into a
      // first-byte <script>. Re-emitting it here would leave TWO copies in the
      // WRS-rendered DOM and trip GSC's "duplicate field FAQPage" error. Strip
      // only the @types we are about to emit from any un-owned, non-global stub
      // script; leave brand-level Organization/WebSite (owned by GlobalSchema)
      // and non-overlapping types (DefinedTerm, Offer) untouched.
      if (emittedTypes.size > 0) {
        head
          .querySelectorAll(
            `script[type="application/ld+json"]:not([${ownerAttr}]):not([data-astro-global-schema])`,
          )
          .forEach((stub) => {
            let parsed: unknown;
            try {
              parsed = JSON.parse(stub.textContent ?? "");
            } catch {
              return; // unparsable → leave as-is
            }
            const wasArray = Array.isArray(parsed);
            const list = (wasArray ? parsed : [parsed]) as Array<
              Record<string, any>
            >;
            const kept = list.filter(
              (entry) =>
                !(
                  entry &&
                  typeof entry["@type"] === "string" &&
                  emittedTypes.has(entry["@type"])
                ),
            );
            if (kept.length === list.length) return; // no overlap → leave as-is

            const prevText = stub.textContent;
            const parent = stub.parentNode;
            if (kept.length === 0) {
              stub.remove();
              // Re-attach on cleanup. Position is irrelevant for JSON-LD, and the
              // original nextSibling may itself be removed by an earlier cleanup
              // (e.g. our own <title>/<meta>), so append rather than insertBefore.
              cleanupFns.push(() => {
                if (parent && !stub.isConnected) parent.appendChild(stub);
              });
            } else {
              stub.textContent = JSON.stringify(wasArray ? kept : kept[0]);
              cleanupFns.push(() => {
                stub.textContent = prevText ?? "";
              });
            }
          });
      }

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(value);
      script.setAttribute(ownerAttr, ownerId);
      head.appendChild(script);
      cleanupFns.push(() => {
        if (script.getAttribute(ownerAttr) !== ownerId) return;
        script.remove();
      });
    };

    setTitle(fullTitle);
    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", allKeywords);
    upsertMeta("name", "author", author);
    if (robots) upsertMeta("name", "robots", robots);
    upsertLink("canonical", resolvedCanonical);
    alternateLanguages.forEach((alt) => {
      upsertLink("alternate", alt.href, { hreflang: alt.hrefLang });
    });

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", resolvedImage);
    upsertMeta("property", "og:url", currentUrl);
    upsertMeta("property", "og:site_name", siteTitle);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", resolvedImage);

    // Article specific meta tags
    if (type === "article") {
      if (publishedTime)
        upsertMeta("property", "article:published_time", publishedTime);
      if (modifiedTime)
        upsertMeta("property", "article:modified_time", modifiedTime);
      if (authorName) upsertMeta("property", "article:author", authorName);
      if (section) upsertMeta("property", "article:section", section);
      tags.forEach((tag) => upsertMeta("property", "article:tag", tag));
    }

    if (schema) {
      setJsonLd(schema);
    }

    cleanupRef.current = cleanupFns;
    return () => {
      cleanupFns.forEach((fn) => fn());
      cleanupRef.current = [];
    };
  }, [
    fullTitle,
    description,
    allKeywords,
    author,
    robots,
    currentUrl,
    resolvedCanonical,
    resolvedImage,
    type,
    siteTitle,
    alternateLanguages,
    schema,
  ]);

  return null;
};
