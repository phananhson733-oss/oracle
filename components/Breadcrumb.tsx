// INPUT: Breadcrumb navigation component with structured data.
// OUTPUT: Exports breadcrumb component with semantic markup and JSON-LD.
// POS: UI component; update components/FOLDER.md when this file changes.

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from './UIComponents';

interface BreadcrumbItem {
  name: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const { t, language } = useLanguage();
  const location = useLocation();

  if (!items || items.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path ? `${window.location.origin}${item.path}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        data-astro-breadcrumb
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav className={`breadcrumb ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link
              to="/"
              className="text-gold-500 hover:text-gold-400 transition-colors"
            >
              {t.wiki?.tab_home || 'Home'}
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={item.path || index} className="flex items-center gap-2">
              <span className="text-star-400 dark:text-star-400 text-paper-400">/</span>
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
