// INPUT: Language context from UIComponents.
// OUTPUT: Hook and utility for generating language-prefixed paths.
// POS: URL generation utility; update hooks/FOLDER.md when this file changes.

import { useLanguage } from '../components/UIComponents';
import type { Language } from '../types';

/** Public route prefixes that require a language prefix in the URL. */
const PUBLIC_PREFIXED_PATHS = [
  '/wiki',
  '/privacy',
  '/terms',
  '/cookies',
  '/about',
  '/help',
  '/pricing',
] as const;

/** Supported language codes for URL prefix validation. */
const SUPPORTED_LANGS = new Set<string>(['en', 'zh']);

/**
 * Build a language-prefixed path for public routes.
 * Private routes (e.g. /dashboard) are returned unchanged.
 */
export const buildLangPath = (path: string, lang: Language): string => {
  // Already prefixed — return as-is
  if (path.startsWith('/en/') || path.startsWith('/zh/') || path === '/en' || path === '/zh') {
    return path;
  }
  const needsPrefix = PUBLIC_PREFIXED_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`),
  );
  return needsPrefix ? `/${lang}${path}` : path;
};

/**
 * Extract language from a URL pathname prefix.
 * Returns the language if found, otherwise null.
 */
export const extractLangFromPath = (pathname: string): Language | null => {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (match && SUPPORTED_LANGS.has(match[1])) {
    return match[1] as Language;
  }
  return null;
};

/**
 * Strip the language prefix from a pathname.
 * E.g. "/en/wiki/sun" → "/wiki/sun"
 */
export const stripLangPrefix = (pathname: string): string => {
  const match = pathname.match(/^\/([a-z]{2})(\/.*|$)/);
  if (match && SUPPORTED_LANGS.has(match[1])) {
    return match[2] || '/';
  }
  return pathname;
};

/**
 * React hook that returns a `langPath` helper bound to the current language.
 */
export const useLangPath = () => {
  const { language } = useLanguage();
  const langPath = (path: string) => buildLangPath(path, language);
  return { langPath, language };
};
