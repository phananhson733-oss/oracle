// INPUT: Breadcrumb navigation component with structured data.
// OUTPUT: Exports breadcrumb component with semantic markup + self-deduped BreadcrumbList JSON-LD.
// POS: UI component. JSON-LD is injected into <head> only when no BreadcrumbList already
//      exists (mirrors App.tsx GlobalSchema dedupe) so it never duplicates the stub/SEO
//      BreadcrumbList and trips GSC "duplicate field". Update components/FOLDER.md on change.

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "./UIComponents";

interface BreadcrumbItem {
  name: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  homePath?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = "",
  homePath = "/",
}) => {
  const { t } = useLanguage();

  // Inject BreadcrumbList JSON-LD into <head>, but only if none exists yet.
  // The prerendered stub and the page's <SEO> schema may already provide one;
  // a duplicate BreadcrumbList trips GSC's "duplicate field" error. Self-dedupe
  // mirrors App.tsx GlobalSchema. Crawlers do fresh loads (stub present), so
  // they always observe exactly one BreadcrumbList.
  const itemsKey = JSON.stringify(items ?? []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!items || items.length === 0) return;
    const hasBreadcrumb = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]'),
    ).some((s) => {
      try {
        const json = JSON.parse(s.textContent ?? "");
        return (Array.isArray(json) ? json : [json]).some(
          (e) => e && e["@type"] === "BreadcrumbList",
        );
      } catch {
        return false;
      }
    });
    if (hasBreadcrumb) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.path ? `${window.location.origin}${item.path}` : undefined,
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-astro-breadcrumb", "true");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  if (!items || items.length === 0) return null;

  return (
    <>
      <nav className={`breadcrumb ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link
              to={homePath}
              className="text-gold-500 hover:text-gold-400 transition-colors"
            >
              {t.wiki?.tab_home || "Home"}
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={item.path || index} className="flex items-center gap-2">
              <span className="text-star-400 dark:text-star-400 text-paper-400">
                /
              </span>
              {item.path && index < items.length - 1 ? (
                <Link
                  to={item.path}
                  className="text-gold-500 hover:text-gold-400 transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  className="text-star-200 dark:text-star-200 text-paper-900"
                  aria-current="page"
                >
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb;
