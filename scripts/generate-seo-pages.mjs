import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import ts from 'typescript';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const publicDir = path.join(rootDir, 'public');
const siteUrl = (process.env.SITE_URL || 'https://www.astrologywiki.com').replace(/\/$/, '');
const ogImageUrl = `${siteUrl}/og-image.png`;
const today = new Date().toISOString().split('T')[0];

const LANG_CONFIG = {
  zh: {
    label: 'zh',
    name: 'AstrologyWiki',
    homeTitle: 'AstrologyWiki 心理占星百科',
    homeDescription: '心理占星知识库与自我探索指南。',
    wikiTitle: '心理占星百科',
    wikiDescription: '占星原型、符号与内在动力的知识库。',
    classicsTitle: '占星经典书架',
    classicsDescription: '现代心理占星的重要著作与深度解读。',
    homeCta: '进入互动体验',
    wikiCta: '进入百科互动阅读',
    classicsCta: '进入经典书架阅读',
    breadcrumbHome: '首页',
    breadcrumbWiki: '百科',
    breadcrumbClassics: '经典',
  },
  en: {
    label: 'en',
    name: 'AstrologyWiki',
    homeTitle: 'AstrologyWiki: Psychological Astrology Wiki',
    homeDescription: 'A modern astrology knowledge base for self-discovery.',
    wikiTitle: 'Astrology Wiki',
    wikiDescription: 'Archetypes, symbols, and inner dynamics in astrology.',
    classicsTitle: 'Astrology Classics',
    classicsDescription: 'Essential works and deep readings in psychological astrology.',
    homeCta: 'Open the interactive experience',
    wikiCta: 'Open the interactive wiki',
    classicsCta: 'Open the classics library',
    breadcrumbHome: 'Home',
    breadcrumbWiki: 'Wiki',
    breadcrumbClassics: 'Classics',
  },
};

const tsCache = new Map();

const escapeHtml = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const normalizeText = (value) => {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const truncate = (value, max = 160) => {
  const normalized = normalizeText(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3)}...`;
};

const ensureDir = async (dir) => {
  await fsPromises.mkdir(dir, { recursive: true });
};

const cleanDir = async (dir) => {
  await fsPromises.rm(dir, { recursive: true, force: true });
  await ensureDir(dir);
};

const loadTsModule = (tsPath) => {
  if (tsCache.has(tsPath)) return tsCache.get(tsPath);
  const source = fs.readFileSync(tsPath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const module = { exports: {} };
  const dirname = path.dirname(tsPath);
  const localRequire = (specifier) => {
    if (specifier === './wiki-generated.js') {
      return loadTsModule(path.join(dirname, 'wiki-generated.ts'));
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const resolved = path.resolve(dirname, specifier);
      const tsCandidate = resolved.replace(/\.js$/, '.ts');
      if (fs.existsSync(tsCandidate)) {
        return loadTsModule(tsCandidate);
      }
      if (fs.existsSync(resolved)) {
        return loadTsModule(resolved);
      }
    }
    throw new Error(`Unsupported import in SEO generator: ${specifier}`);
  };

  const runner = new Function('require', 'module', 'exports', '__filename', '__dirname', output);
  runner(localRequire, module, module.exports, tsPath, dirname);
  tsCache.set(tsPath, module.exports);
  return module.exports;
};

const buildAlternateLinks = (pathSuffix, availability = { zh: true, en: true }) => {
  const zhUrl = `${siteUrl}/zh${pathSuffix}`;
  const enUrl = `${siteUrl}/en${pathSuffix}`;
  const links = [];
  if (availability.zh) links.push({ hrefLang: 'zh', href: zhUrl });
  if (availability.en) links.push({ hrefLang: 'en', href: enUrl });
  const defaultLang = availability.en ? 'en' : availability.zh ? 'zh' : null;
  if (defaultLang) {
    links.push({ hrefLang: 'x-default', href: defaultLang === 'en' ? enUrl : zhUrl });
  }
  return links;
};

const buildHead = ({
  lang,
  title,
  description,
  url,
  ogType,
  alternates,
  schema,
}) => {
  const desc = truncate(description || '');
  const headParts = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    `<meta name="robots" content="index,follow" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    ...alternates.map((alt) => `<link rel="alternate" hreflang="${alt.hrefLang}" href="${escapeHtml(alt.href)}" />`),
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="AstrologyWiki" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`,
  ];

  if (schema) {
    headParts.push(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
  }

  headParts.push(`
<style>
  :root { color-scheme: light; }
  body { font-family: ui-serif, Georgia, 'Times New Roman', serif; margin: 0; padding: 48px 20px; background: #f6f4f0; color: #1b1b1b; }
  main { max-width: 780px; margin: 0 auto; }
  h1 { font-size: 2.25rem; margin: 0 0 1rem; }
  p { line-height: 1.6; font-size: 1rem; }
  .meta { margin-top: 1.5rem; font-size: 0.95rem; color: #4a4540; }
  a { color: #7f5e36; text-decoration: none; border-bottom: 1px solid rgba(127, 94, 54, 0.35); }
  a:hover { color: #5f442b; }
  .cta { display: inline-block; margin-top: 1.5rem; font-weight: 600; }
</style>
`);

  return headParts.join('\n');
};

const buildBody = ({ lang, title, description, ctaText, spaPath }) => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCta = escapeHtml(ctaText);
  const safeSpaPath = escapeHtml(spaPath);
  return `
<main>
  <h1>${safeTitle}</h1>
  <p>${safeDescription}</p>
  <p class="meta">AstrologyWiki · ${lang.toUpperCase()}</p>
  <a class="cta" data-astro-link href="${safeSpaPath}">${safeCta}</a>
</main>
<script>
  (function () {
    var lang = document.body.getAttribute('data-astro-lang');
    var links = document.querySelectorAll('[data-astro-link]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        try {
          if (lang) {
            localStorage.setItem('astro_lang', lang);
          }
        } catch (e) {
          // Ignore storage errors.
        }
      });
    }
  })();
</script>
`;
};

const writeHtmlPage = async ({ outputPath, lang, title, description, url, ogType, schema, alternates, ctaText, spaPath }) => {
  const html = `<!DOCTYPE html>
<html lang="${lang}">
  <head>
${buildHead({ lang, title, description, url, ogType, alternates, schema })}
  </head>
  <body data-astro-lang="${lang}">
${buildBody({ lang, title, description, ctaText, spaPath })}
  </body>
</html>
`;
  await ensureDir(path.dirname(outputPath));
  await fsPromises.writeFile(outputPath, html, 'utf8');
};

const buildBreadcrumb = (lang, items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

const buildWebSiteSchema = (lang, config) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: config.name,
  url: `${siteUrl}/${lang}/`,
  inLanguage: lang,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/${lang}/wiki?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

const buildItemListSchema = (lang, pathSuffix, items) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: items.map((item, index) => {
    const url = `${siteUrl}/${lang}${pathSuffix}/${item.id}`;
    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: item.title,
        url,
      },
    };
  }),
});

const buildDefinedTermSchema = (lang, item, url) => ({
  '@context': 'https://schema.org',
  '@type': 'DefinedTerm',
  name: item.title,
  description: truncate(item.description || ''),
  inDefinedTermSet: {
    '@type': 'DefinedTermSet',
    name: 'AstrologyWiki',
    url: `${siteUrl}/${lang}/wiki`,
  },
  url,
  inLanguage: lang,
  alternateName: item.subtitle || undefined,
  keywords: item.keywords || undefined,
});

const buildBookSchema = (lang, item, url) => ({
  '@context': 'https://schema.org',
  '@type': 'Book',
  name: item.title,
  author: item.author
    ? { '@type': 'Person', name: item.author }
    : undefined,
  description: truncate(item.summary || ''),
  url,
  inLanguage: lang,
  keywords: item.keywords || undefined,
  image: item.cover_url || undefined,
});

// Chinese wiki pages whitelist — only these zh wiki items get static SEO pages.
// All others are served by the SPA but don't need static pre-rendering.
const ZH_WIKI_WHITELIST = new Set([
  'composite-chart',
  'elements',
  'fixed-mode',
  'house-2',
  'house-10',
  'libra',
  'lilith',
  'mutable-mode',
  'opposition',
  'sagittarius',
  'saturn',
  'transit-chart',
  'water-element',
]);

// Featured article slugs (SPA-rendered, added to sitemap only)
const ARTICLE_SLUGS = [
  'track-mood-astrology',
  'mercury-retrograde-vs-moon-anxiety',
  'mars-anger-triggers',
  'best-astrology-mental-health-apps',
];

const generate = async () => {
  const wikiModule = loadTsModule(path.join(rootDir, 'backend/src/data/wiki.ts'));
  const wikiContent = wikiModule.WIKI_CONTENT || {};
  const classicsModule = await import(pathToFileURL(path.join(rootDir, 'backend/src/data/wiki-classics-markdown.js')).href);
  const getWikiClassics = classicsModule.getWikiClassics;
  const getWikiClassicDetail = classicsModule.getWikiClassicDetail;
  const classicsByLang = {
    zh: getWikiClassics('zh') || [],
    en: getWikiClassics('en') || [],
  };
  const wikiIds = {
    zh: new Set((wikiContent.zh?.items || []).map((item) => item.id)),
    en: new Set((wikiContent.en?.items || []).map((item) => item.id)),
  };
  const classicIds = {
    zh: new Set(classicsByLang.zh.map((item) => item.id)),
    en: new Set(classicsByLang.en.map((item) => item.id)),
  };

  await cleanDir(path.join(publicDir, 'zh'));
  await cleanDir(path.join(publicDir, 'en'));

  const sitemapUrls = [];

  // Add public SPA routes with lang prefix for each language
  const publicRoutes = ['/privacy', '/terms', '/cookies', '/about', '/help'];
  for (const route of publicRoutes) {
    sitemapUrls.push(`${siteUrl}/en${route}`);
    sitemapUrls.push(`${siteUrl}/zh${route}`);
  }

  for (const lang of ['zh', 'en']) {
    const config = LANG_CONFIG[lang];
    const langRoot = path.join(publicDir, lang);
    const wikiItems = (wikiContent[lang]?.items || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      keywords: item.keywords || [],
      subtitle: item.subtitle || '',
    }));
    const classics = classicsByLang[lang] || [];

    const homePath = `/${lang}/`;
    const wikiPath = `/${lang}/wiki`;
    const classicsPath = `/${lang}/wiki/classics`;

    sitemapUrls.push(`${siteUrl}${homePath}`);
    // Only add wiki hub for all langs; classics hub only for en
    if (lang === 'en') {
      sitemapUrls.push(`${siteUrl}${wikiPath}`);
      sitemapUrls.push(`${siteUrl}${classicsPath}`);
    }

    await writeHtmlPage({
      outputPath: path.join(langRoot, 'index.html'),
      lang,
      title: config.homeTitle,
      description: config.homeDescription,
      url: `${siteUrl}${homePath}`,
      ogType: 'website',
      alternates: buildAlternateLinks('/'),
      schema: buildWebSiteSchema(lang, config),
      ctaText: config.homeCta,
      spaPath: '/',
    });

    // Only generate wiki hub and classics hub for en
    if (lang === 'en') {
      await writeHtmlPage({
        outputPath: path.join(langRoot, 'wiki', 'index.html'),
        lang,
        title: config.wikiTitle,
        description: config.wikiDescription,
        url: `${siteUrl}${wikiPath}`,
        ogType: 'website',
        alternates: buildAlternateLinks('/wiki'),
        schema: [
          buildItemListSchema(lang, '/wiki', wikiItems),
          buildBreadcrumb(lang, [
            { name: config.breadcrumbHome, url: `${siteUrl}/${lang}/` },
            { name: config.breadcrumbWiki, url: `${siteUrl}${wikiPath}` },
          ]),
        ],
        ctaText: config.wikiCta,
        spaPath: `/${lang}/wiki`,
      });

      await writeHtmlPage({
        outputPath: path.join(langRoot, 'wiki', 'classics', 'index.html'),
        lang,
        title: config.classicsTitle,
        description: config.classicsDescription,
        url: `${siteUrl}${classicsPath}`,
        ogType: 'website',
        alternates: buildAlternateLinks('/wiki/classics'),
        schema: [
          buildItemListSchema(lang, '/wiki/classics', classics),
          buildBreadcrumb(lang, [
            { name: config.breadcrumbHome, url: `${siteUrl}/${lang}/` },
            { name: config.breadcrumbClassics, url: `${siteUrl}${classicsPath}` },
          ]),
        ],
        ctaText: config.classicsCta,
        spaPath: `/${lang}/wiki/classics`,
      });
    }

    // For zh, only generate whitelisted wiki items; for en, generate all
    const filteredWikiItems = lang === 'zh'
      ? wikiItems.filter((item) => ZH_WIKI_WHITELIST.has(item.id))
      : wikiItems;

    for (const item of filteredWikiItems) {
      const itemPath = `/${lang}/wiki/${item.id}`;
      const itemUrl = `${siteUrl}${itemPath}`;
      const alternateAvailability = {
        zh: wikiIds.zh.has(item.id) && (lang === 'en' || ZH_WIKI_WHITELIST.has(item.id)),
        en: wikiIds.en.has(item.id),
      };
      sitemapUrls.push(itemUrl);
      await writeHtmlPage({
        outputPath: path.join(langRoot, 'wiki', item.id, 'index.html'),
        lang,
        title: item.title,
        description: item.description || config.wikiDescription,
        url: itemUrl,
        ogType: 'article',
        alternates: buildAlternateLinks(`/wiki/${item.id}`, alternateAvailability),
        schema: [
          buildDefinedTermSchema(lang, item, itemUrl),
          buildBreadcrumb(lang, [
            { name: config.breadcrumbHome, url: `${siteUrl}/${lang}/` },
            { name: config.breadcrumbWiki, url: `${siteUrl}${wikiPath}` },
            { name: item.title, url: itemUrl },
          ]),
        ],
        ctaText: config.wikiCta,
        spaPath: `/${lang}/wiki/${item.id}`,
      });
    }

    // Skip classics generation for zh (no zh classics pages)
    if (lang === 'zh') continue;

    for (const classic of classics) {
      const classicDetail = getWikiClassicDetail(classic.id, lang) || classic;
      const classicPath = `/${lang}/wiki/classics/${classic.id}`;
      const classicUrl = `${siteUrl}${classicPath}`;
      const alternateAvailability = {
        zh: classicIds.zh.has(classic.id),
        en: classicIds.en.has(classic.id),
      };
      sitemapUrls.push(classicUrl);
      await writeHtmlPage({
        outputPath: path.join(langRoot, 'wiki', 'classics', classic.id, 'index.html'),
        lang,
        title: classicDetail.title,
        description: classicDetail.summary || config.classicsDescription,
        url: classicUrl,
        ogType: 'book',
        alternates: buildAlternateLinks(`/wiki/classics/${classic.id}`, alternateAvailability),
        schema: [
          buildBookSchema(lang, classicDetail, classicUrl),
          buildBreadcrumb(lang, [
            { name: config.breadcrumbHome, url: `${siteUrl}/${lang}/` },
            { name: config.breadcrumbClassics, url: `${siteUrl}${classicsPath}` },
            { name: classicDetail.title, url: classicUrl },
          ]),
        ],
        ctaText: config.classicsCta,
        spaPath: `/${lang}/wiki/classics/${classic.id}`,
      });
    }
  }

  // Saturn Return Calculator: SPA-rendered (no static HTML — SPA component provides
  // full SEO meta, JSON-LD schemas, and 500+ word content via React <SEO> component.
  // Static HTML was removed because Vercel serves it with higher priority than the
  // SPA catch-all, preventing the interactive calculator from loading.)
  sitemapUrls.push(`${siteUrl}/en/saturn-return-calculator`);

  // Add featured article URLs to sitemap (SPA-rendered, no static HTML needed)
  for (const slug of ARTICLE_SLUGS) {
    sitemapUrls.push(`${siteUrl}/en/wiki/${slug}`);
    sitemapUrls.push(`${siteUrl}/zh/wiki/${slug}`);
  }

  const sitemapEntries = Array.from(new Set(sitemapUrls)).sort();
  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries.map((loc) => [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
  ].join('\n');

  await fsPromises.writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');

  console.log(`SEO pages generated: ${sitemapEntries.length} URLs`);
};

generate().catch((error) => {
  console.error('SEO generation failed:', error);
  process.exit(1);
});
