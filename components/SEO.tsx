import React, { useEffect, useMemo, useRef } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book' | 'profile';
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
  description = 'Astromind - Your guide to modern astrology, psychology, and self-discovery.',
  image = '/og-image.png',
  url,
  type = 'website',
  schema,
  keywords = [],
  author = 'Astromind',
  robots,
  alternateLanguages = [],
  publishedTime,
  modifiedTime,
  authorName,
  section,
  tags = [],
}) => {
  const siteTitle = 'Astromind';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const fallbackUrl = typeof window !== 'undefined' ? window.location.href : 'https://www.astromind.ai';
  const currentUrl = url || fallbackUrl;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.astromind.ai';
  const resolveAbsoluteUrl = (value: string) => {
    if (!value) return value;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('//')) return `https:${value}`;
    return `${baseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
  };
  const resolvedImage = resolveAbsoluteUrl(image);
  const allKeywords = useMemo(() => [
    'astrology',
    'psychological astrology',
    'natal chart',
    'horoscope',
    'psychology',
    'self-discovery',
    ...keywords,
  ].join(', '), [keywords]);
  const ownerRef = useRef(`astro-seo-${Math.random().toString(36).slice(2)}`);
  const cleanupRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const head = document.head;
    if (!head) return;

    cleanupRef.current.forEach((fn) => fn());
    cleanupRef.current = [];

    const ownerId = ownerRef.current;
    const ownerAttr = 'data-astro-seo-owner';
    const cleanupFns: Array<() => void> = [];

    const restoreAttr = (el: Element, attr: string, prevValue: string | null) => {
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

    const upsertMeta = (attrName: 'name' | 'property', attrValue: string, contentValue: string | null | undefined) => {
      if (contentValue === null || contentValue === undefined) return;
      const selector = `meta[${attrName}="${attrValue}"]`;
      const existing = head.querySelector(selector);
      if (existing) {
        const prevContent = existing.getAttribute('content');
        const prevOwner = existing.getAttribute(ownerAttr);
        existing.setAttribute('content', contentValue);
        existing.setAttribute(ownerAttr, ownerId);
        cleanupFns.push(() => {
          if (existing.getAttribute(ownerAttr) !== ownerId) return;
          restoreAttr(existing, 'content', prevContent);
          restoreOwner(existing, prevOwner);
        });
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        meta.setAttribute('content', contentValue);
        meta.setAttribute(ownerAttr, ownerId);
        head.appendChild(meta);
        cleanupFns.push(() => {
          if (meta.getAttribute(ownerAttr) !== ownerId) return;
          meta.remove();
        });
      }
    };

    const upsertLink = (relValue: string, hrefValue: string | null | undefined, extraAttrs: Record<string, string> = {}) => {
      if (!hrefValue) return;
      const extraSelector = Object.entries(extraAttrs)
        .map(([key, value]) => `[${key}="${value}"]`)
        .join('');
      const selector = `link[rel="${relValue}"]${extraSelector}`;
      const existing = head.querySelector(selector);
      if (existing) {
        const prevHref = existing.getAttribute('href');
        const prevRel = existing.getAttribute('rel');
        const prevOwner = existing.getAttribute(ownerAttr);
        const prevExtraAttrs = Object.keys(extraAttrs).reduce<Record<string, string | null>>((acc, key) => {
          acc[key] = existing.getAttribute(key);
          return acc;
        }, {});
        existing.setAttribute('rel', relValue);
        existing.setAttribute('href', hrefValue);
        Object.entries(extraAttrs).forEach(([key, value]) => existing.setAttribute(key, value));
        existing.setAttribute(ownerAttr, ownerId);
        cleanupFns.push(() => {
          if (existing.getAttribute(ownerAttr) !== ownerId) return;
          restoreAttr(existing, 'href', prevHref);
          restoreAttr(existing, 'rel', prevRel);
          Object.entries(prevExtraAttrs).forEach(([key, prevValue]) => {
            restoreAttr(existing, key, prevValue);
          });
          restoreOwner(existing, prevOwner);
        });
      } else {
        const link = document.createElement('link');
        link.setAttribute('rel', relValue);
        link.setAttribute('href', hrefValue);
        Object.entries(extraAttrs).forEach(([key, value]) => link.setAttribute(key, value));
        link.setAttribute(ownerAttr, ownerId);
        head.appendChild(link);
        cleanupFns.push(() => {
          if (link.getAttribute(ownerAttr) !== ownerId) return;
          link.remove();
        });
      }
    };

    const setTitle = (value: string) => {
      const existing = head.querySelector('title');
      if (existing) {
        const prevText = existing.textContent;
        const prevOwner = existing.getAttribute(ownerAttr);
        existing.textContent = value;
        existing.setAttribute(ownerAttr, ownerId);
        cleanupFns.push(() => {
          if (existing.getAttribute(ownerAttr) !== ownerId) return;
          existing.textContent = prevText ?? '';
          restoreOwner(existing, prevOwner);
        });
      } else {
        const titleEl = document.createElement('title');
        titleEl.textContent = value;
        titleEl.setAttribute(ownerAttr, ownerId);
        head.appendChild(titleEl);
        cleanupFns.push(() => {
          if (titleEl.getAttribute(ownerAttr) !== ownerId) return;
          titleEl.remove();
        });
      }
    };

    const setJsonLd = (value: Record<string, any> | Array<Record<string, any>>) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(value);
      script.setAttribute(ownerAttr, ownerId);
      head.appendChild(script);
      cleanupFns.push(() => {
        if (script.getAttribute(ownerAttr) !== ownerId) return;
        script.remove();
      });
    };

    setTitle(fullTitle);
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', allKeywords);
    upsertMeta('name', 'author', author);
    if (robots) upsertMeta('name', 'robots', robots);
    upsertLink('canonical', currentUrl);
    alternateLanguages.forEach((alt) => {
      upsertLink('alternate', alt.href, { hreflang: alt.hrefLang });
    });

    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', resolvedImage);
    upsertMeta('property', 'og:url', currentUrl);
    upsertMeta('property', 'og:site_name', siteTitle);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', resolvedImage);

    // Article specific meta tags
    if (type === 'article') {
      if (publishedTime) upsertMeta('property', 'article:published_time', publishedTime);
      if (modifiedTime) upsertMeta('property', 'article:modified_time', modifiedTime);
      if (authorName) upsertMeta('property', 'article:author', authorName);
      if (section) upsertMeta('property', 'article:section', section);
      tags.forEach((tag) => upsertMeta('property', 'article:tag', tag));
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
    resolvedImage,
    type,
    siteTitle,
    alternateLanguages,
    schema,
  ]);

  return null;
};
