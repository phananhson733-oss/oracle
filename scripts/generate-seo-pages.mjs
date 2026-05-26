import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import ts from 'typescript';
import { safeJsonLd } from './lib/safe-jsonld.mjs';

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

// Landing v2 copy — sourced verbatim from design doc Hero spec
// (~/.gstack/projects/xdawayer-oracle/wzb-main-design-20260518-161110.md §"Hero Visual Anchor")
// English version is primary per product positioning; Chinese is auxiliary.
const LANDING_V2_CONFIG = {
  en: {
    title: 'Free Birth Chart, Today’s Sky & Synastry Calculator | AstrologyWiki',
    description:
      'Free birth chart calculator, today’s planetary transits, synastry, and Saturn return — psychological astrology grounded in real astronomy. No mysticism, no sign-up.',
    h1Lead: 'Astrology meets',
    h1Accent: 'modern psychology.',
    subA: 'Birth charts, CBT journal, AI guidance.',
    subB: 'Science-grounded. No mysticism.',
    primaryCta: 'Try Free Birth Chart',
    secondaryCta: 'Watch the 90-second tour',
    trustLine: 'Used by readers in 50+ countries',
    sections: [
      { name: 'Free Birth Chart Calculator', desc: 'Enter your birth date, time, and city. Get an instant Swiss Ephemeris natal chart — no account needed.' },
      { name: "Today's Sky", desc: 'Where the planets sit right now, updated daily. A universal snapshot of current transits.' },
      { name: 'Core Tools', desc: 'Saturn Return Calculator, Synastry compatibility, and the AI Oracle — every tile opens a real tool.' },
      { name: 'CBT Journal', desc: 'Track moods, reframe cognitions, and read them through the astrological lens that fits your chart.' },
      { name: 'Wiki Hub', desc: 'A 119-article library of planets, signs, houses, aspects, and classic astrology books — free to browse.' },
      { name: 'Weekly Newsletter', desc: 'Cosmic insights in your inbox once a week. No spam, no resold data, unsubscribe anytime.' },
    ],
  },
  zh: {
    title: '免费出生星盘、今日星象与合盘计算器 | AstrologyWiki',
    description:
      '免费出生星盘计算器、今日行星过运、合盘相性与土星回归——基于真实天文与现代心理学，无玄学、无需注册。',
    h1Lead: '占星，遇见',
    h1Accent: '现代心理学。',
    subA: '本命星盘、CBT 日记、AI 指引。',
    subB: '科学语境。拒绝玄学。',
    primaryCta: '免费生成本命星盘',
    secondaryCta: '观看 90 秒导览',
    trustLine: '已被 50+ 国家的读者使用',
    sections: [
      { name: '免费本命星盘计算器', desc: '输入出生日期、时间、城市，立刻生成 Swiss Ephemeris 精度的星盘，无需注册。' },
      { name: '今日星空', desc: '此刻行星位置的通用快照，按日更新。' },
      { name: '核心工具', desc: 'Saturn Return 计算器、合盘、AI Oracle——每个卡片都是一个真实可用的工具入口。' },
      { name: 'CBT 日记', desc: '记录情绪、重构认知，并用你星盘的语境去理解它们。' },
      { name: 'Wiki 知识库', desc: '119 篇关于行星、星座、宫位、相位与经典占星著作的深度文章，免费浏览。' },
      { name: 'Weekly Newsletter', desc: '每周一封星空洞察邮件。零垃圾邮件、不转售数据、可随时退订。' },
    ],
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
      // Try, in order: .js→.ts rewrite, extensionless .ts, raw path, dir/index.ts.
      const candidates = [
        resolved.replace(/\.js$/, '.ts'),
        `${resolved}.ts`,
        resolved,
        path.join(resolved, 'index.ts'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return loadTsModule(candidate);
        }
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
    headParts.push(`<script type="application/ld+json">${safeJsonLd(schema)}</script>`);
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

const buildLandingV2WebSiteSchema = (lang, url) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AstrologyWiki',
  url,
  inLanguage: lang,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/${lang}/wiki?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

const buildLandingV2SoftwareAppSchema = (lang, description) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AstrologyWiki',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  description,
  url: siteUrl,
  inLanguage: lang,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: lang === 'zh'
    ? [
        '免费出生星盘计算器',
        '今日星象与行星过运',
        '合盘相性分析',
        '土星回归计算器',
        'Ask Oracle 占星问答',
      ]
    : [
        'Free birth chart calculator',
        "Today's sky and planetary transits",
        'Synastry compatibility analysis',
        'Saturn return calculator',
        'Ask Oracle astrology Q&A',
      ],
});

// Organization schema — establishes the brand entity for Knowledge Graph.
const buildLandingV2OrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AstrologyWiki',
  url: `${siteUrl}/`,
  logo: `${siteUrl}/icon-192.png`,
});

// FAQPage schema — captures highest-intent informational queries so they can
// appear as expandable answers in SERP / AI overviews. Lang-aware.
const buildLandingV2FAQSchema = (lang) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: lang,
  mainEntity: lang === 'zh'
    ? [
        {
          '@type': 'Question',
          name: 'AstrologyWiki 真的免费吗？',
          acceptedAnswer: { '@type': 'Answer', text: '是。出生星盘、今日星象、合盘与土星回归计算器全部免费，无需注册即可使用。' },
        },
        {
          '@type': 'Question',
          name: '什么是出生星盘？',
          acceptedAnswer: { '@type': 'Answer', text: '出生星盘（本命盘）是你出生那一刻太阳、月亮与各行星在天空中位置的瞬时快照，以你的出生地为视角绘制。它是现代心理占星阅读你的人格模式与潜在课题的起点。' },
        },
        {
          '@type': 'Question',
          name: '什么是合盘（Synastry）？',
          acceptedAnswer: { '@type': 'Answer', text: '合盘把两人的出生星盘叠加在一起，呈现彼此能量如何相遇、碰撞与互相辨识。不是宿命论的灵魂伴侣判定，而是关系动力学的几何描述。' },
        },
        {
          '@type': 'Question',
          name: '什么是土星回归？',
          acceptedAnswer: { '@type': 'Answer', text: '土星大约每 29.5 年回到出生时所在的位置，通常在 27-30、56-60、85-90 岁触发。这是个体重新对齐价值观与人生结构的天文周期。' },
        },
      ]
    : [
        {
          '@type': 'Question',
          name: 'Is AstrologyWiki really free?',
          acceptedAnswer: { '@type': 'Answer', text: "Yes. The birth chart, today's sky, synastry, and Saturn return calculators are all free to use with no sign-up required." },
        },
        {
          '@type': 'Question',
          name: 'What is a birth chart?',
          acceptedAnswer: { '@type': 'Answer', text: "A birth chart (natal chart) is a snapshot of where the Sun, Moon, and planets were in the sky at the exact moment and place you were born. In modern psychological astrology it's the starting point for reading personality patterns and developmental themes." },
        },
        {
          '@type': 'Question',
          name: 'What is synastry?',
          acceptedAnswer: { '@type': 'Answer', text: "Synastry overlays two birth charts and shows where the two people's energies meet, clash, and recognise each other. It's relationship astrology as geometry — not soulmate determinism." },
        },
        {
          '@type': 'Question',
          name: 'What is Saturn return?',
          acceptedAnswer: { '@type': 'Answer', text: "Saturn takes roughly 29.5 years to return to the position it occupied at your birth, typically triggering at ages 27-30, 56-60, and 85-90. It's the astronomical cycle astrologers associate with realigning your values and life structure." },
        },
      ],
});

const buildLandingV2AlternateLinks = () => ([
  { hrefLang: 'en', href: `${siteUrl}/landing-v2/en/` },
  { hrefLang: 'zh', href: `${siteUrl}/landing-v2/zh/` },
  { hrefLang: 'x-default', href: `${siteUrl}/landing-v2/en/` },
]);

const buildLandingV2Html = (lang) => {
  const copy = LANDING_V2_CONFIG[lang];
  const url = `${siteUrl}/landing-v2/${lang}/`;
  const description = truncate(copy.description, 200);
  const schema = [
    buildLandingV2WebSiteSchema(lang, url),
    buildLandingV2OrganizationSchema(),
    buildLandingV2SoftwareAppSchema(lang, description),
    buildLandingV2FAQSchema(lang),
  ];
  const alternates = buildLandingV2AlternateLinks();

  const headParts = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<title>${escapeHtml(copy.title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="index,follow" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    ...alternates.map((alt) => `<link rel="alternate" hreflang="${alt.hrefLang}" href="${escapeHtml(alt.href)}" />`),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(copy.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="AstrologyWiki" />`,
    `<meta property="og:locale" content="${lang === 'zh' ? 'zh_CN' : 'en_US'}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(copy.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`,
    `<script type="application/ld+json">${safeJsonLd(schema)}</script>`,
    `
<style>
  :root { color-scheme: light; }
  body { font-family: 'Cormorant Garamond', 'EB Garamond', Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background: #f6f4f0; color: #1b1b1b; }
  main { max-width: 980px; margin: 0 auto; padding: 64px 24px; }
  .hero { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; }
  .hero h1 { font-size: clamp(2.5rem, 6vw, 5rem); line-height: 1.05; margin: 0 0 1.25rem; font-weight: 700; letter-spacing: -0.01em; }
  .hero .accent { color: #b8893d; }
  .hero p { font-size: 1.15rem; line-height: 1.6; margin: 0 0 0.5rem; color: #4a4540; }
  .hero .cta-row { margin-top: 2rem; display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; }
  .cta-primary { display: inline-block; background: #b8893d; color: #f6f4f0; padding: 14px 28px; border-radius: 999px; font-weight: 600; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 1rem; text-decoration: none; border: none; }
  .cta-secondary { color: #1b1b1b; text-decoration: underline; text-underline-offset: 4px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.95rem; }
  .trust { margin-top: 2rem; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: #6e6862; font-family: ui-sans-serif, system-ui, sans-serif; }
  .sections { margin-top: 4rem; display: grid; gap: 1.5rem; }
  .section-card { padding: 1.5rem 0; border-top: 1px solid rgba(27,27,27,0.08); }
  .section-card h2 { font-size: 1.5rem; margin: 0 0 0.5rem; }
  .section-card p { font-size: 1rem; line-height: 1.6; margin: 0; color: #4a4540; }
  .footer-note { margin-top: 3rem; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.8rem; color: #6e6862; }
</style>
`,
  ];

  const sectionsHtml = copy.sections
    .map((section, idx) => `
    <section class="section-card">
      <h2>${idx + 1}. ${escapeHtml(section.name)}</h2>
      <p>${escapeHtml(section.desc)}</p>
    </section>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
${headParts.join('\n')}
  </head>
  <body data-astro-lang="${lang}">
    <main>
      <article class="hero">
        <h1>${escapeHtml(copy.h1Lead)} <span class="accent">${escapeHtml(copy.h1Accent)}</span></h1>
        <p>${escapeHtml(copy.subA)}</p>
        <p>${escapeHtml(copy.subB)}</p>
        <div class="cta-row">
          <a class="cta-primary" href="/${lang}/landing-v2#birth-chart">${escapeHtml(copy.primaryCta)} →</a>
          <a class="cta-secondary" href="/${lang}/landing-v2#tour">${escapeHtml(copy.secondaryCta)}</a>
        </div>
        <p class="trust">${escapeHtml(copy.trustLine)}</p>
      </article>
      <div class="sections">
${sectionsHtml}
      </div>
      <p class="footer-note">AstrologyWiki · ${lang.toUpperCase()} · <a href="/${lang}/">Open the interactive app</a></p>
    </main>
    <script>
      (function () {
        try {
          localStorage.setItem('astro_lang', '${lang}');
        } catch (e) {
          // Ignore storage errors.
        }
      })();
    </script>
  </body>
</html>
`;
};

const writeLandingV2Pages = async () => {
  for (const lang of ['en', 'zh']) {
    const outputPath = path.join(publicDir, 'landing-v2', lang, 'index.html');
    await ensureDir(path.dirname(outputPath));
    await fsPromises.writeFile(outputPath, buildLandingV2Html(lang), 'utf8');
  }
};

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
  'north-node-in-scorpio',
  'north-node-vs-south-node',
  '11th-house',
  '9th-house-astrology',
  '12th-house-astrology',
  '8th-house-meaning',
  'astrology-houses',
  'orange-aura-meaning',
  'green-aura-meaning',
  'track-mood-astrology',
  'mercury-retrograde-vs-moon-anxiety',
  'mars-anger-triggers',
  'best-astrology-mental-health-apps',
];

// EN-only featured articles (v8 aura batch 2026-05-22). Excluded from
// ARTICLE_SLUGS because there is no ZH variant — adding /zh/wiki/<slug>
// to the sitemap would produce 404s for Google. Listed separately and
// emitted into the sitemap with /en/wiki/ only (see loop below).
const ARTICLE_SLUGS_EN_ONLY = [
  'aura-colors-pillar',
  'blue-aura-meaning',
  'yellow-aura-meaning',
  'purple-aura-meaning',
  'white-aura-meaning',
  'red-aura-meaning',
  'chakra-system-overview',
  'four-element-framework',
];

const generate = async () => {
  const wikiModule = loadTsModule(path.join(rootDir, 'backend/src/data/wiki.ts'));
  const wikiContent = wikiModule.WIKI_CONTENT || {};
  const classicsModule = await import(pathToFileURL(path.join(rootDir, 'backend/src/data/wiki-classics-markdown.js')).href);
  const getWikiClassics = classicsModule.getWikiClassics;
  const getWikiClassicDetail = classicsModule.getWikiClassicDetail;

  // Editorial author personas (EN-only author pages). Pure-data module —
  // loadTsModule resolves it without React/Vite imports.
  const authorsModule = loadTsModule(path.join(rootDir, 'data/authors/index.ts'));
  const authorSchemaModule = loadTsModule(path.join(rootDir, 'data/authors/schema.ts'));
  const ALL_AUTHORS = authorsModule.getAllAuthors();
  const buildPersonSchema = authorSchemaModule.buildPersonSchema;

  // Build-time invariant: persona.id is used as a URL path segment AND a
  // filesystem path (author/<id>/index.html). Reject anything that isn't a
  // clean slug to prevent malformed URLs / path traversal, and reject
  // duplicate ids (Map registry would silently shadow them).
  const AUTHOR_ID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const seenAuthorIds = new Set();
  for (const persona of ALL_AUTHORS) {
    if (!AUTHOR_ID_SLUG.test(persona.id)) {
      throw new Error(
        `SEO build: author id "${persona.id}" is not a safe slug (expected ^[a-z0-9]+(?:-[a-z0-9]+)*$)`,
      );
    }
    if (seenAuthorIds.has(persona.id)) {
      throw new Error(`SEO build: duplicate author id "${persona.id}" in registry`);
    }
    seenAuthorIds.add(persona.id);
  }

  // Build-time integrity gate: every article's authorId MUST resolve to a
  // registered persona. Fail the build loudly if a backfill was missed.
  const articlesModule = loadTsModule(path.join(rootDir, 'data/articles/index.ts'));
  for (const lang of ['en', 'zh']) {
    for (const summary of articlesModule.getArticleSummaries(lang)) {
      if (!authorsModule.getAuthorById(summary.authorId)) {
        throw new Error(
          `SEO build: article "${summary.slug}" (${lang}) has unresolved authorId="${summary.authorId}"`,
        );
      }
    }
  }
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
  await cleanDir(path.join(publicDir, 'landing-v2'));

  // Landing v2 — staging route for the new modular marketing landing page.
  // Emits static HTML at /landing-v2/{en,zh}/index.html so SEO crawlers see
  // hero copy + JSON-LD before the SPA hydrates.
  await writeLandingV2Pages();

  const sitemapUrls = [];

  // Landing v2 URLs (manually included; sitemap entries get priority 0.9 below).
  const LANDING_V2_URLS = [
    `${siteUrl}/landing-v2/en/`,
    `${siteUrl}/landing-v2/zh/`,
  ];
  for (const url of LANDING_V2_URLS) {
    sitemapUrls.push(url);
  }

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

      // Author profile pages (EN-only) — static stubs with ProfilePage/Person
      // JSON-LD so crawlers read the author entity without executing JS.
      for (const persona of ALL_AUTHORS) {
        const authorPath = `/${lang}/wiki/author/${persona.id}`;
        const authorPageUrl = `${siteUrl}${authorPath}`;
        sitemapUrls.push(authorPageUrl);
        await writeHtmlPage({
          outputPath: path.join(langRoot, 'wiki', 'author', persona.id, 'index.html'),
          lang,
          title: `${persona.name} — ${persona.title}`,
          description: persona.bio.en || '',
          url: authorPageUrl,
          ogType: 'profile',
          alternates: buildAlternateLinks(`/wiki/author/${persona.id}`, { zh: false, en: true }),
          schema: [
            {
              '@context': 'https://schema.org',
              '@type': 'ProfilePage',
              mainEntity: buildPersonSchema(persona, lang, siteUrl),
            },
            buildBreadcrumb(lang, [
              { name: config.breadcrumbHome, url: `${siteUrl}/${lang}/` },
              { name: config.breadcrumbWiki, url: `${siteUrl}${wikiPath}` },
              { name: persona.name, url: authorPageUrl },
            ]),
          ],
          ctaText: config.wikiCta,
          spaPath: authorPath,
        });
      }
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
  // EN-only featured articles (no ZH variant — emit /en/wiki/ only)
  for (const slug of ARTICLE_SLUGS_EN_ONLY) {
    sitemapUrls.push(`${siteUrl}/en/wiki/${slug}`);
  }

  // L2 cutover (2026-05-19): root is now the canonical home (renders
  // LandingPageV2). Include "/" with priority 1.0 so Google treats it as
  // the primary home URL ahead of /en/, /zh/, and /landing-v2/{en,zh}/.
  const ROOT_URL = `${siteUrl}/`;
  sitemapUrls.push(ROOT_URL);

  const sitemapEntries = Array.from(new Set(sitemapUrls)).sort();
  const landingV2Set = new Set(LANDING_V2_URLS);
  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries.map((loc) => {
      const isRoot = loc === ROOT_URL;
      const isLandingV2 = landingV2Set.has(loc);
      const lines = [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
      ];
      if (isRoot) {
        lines.push('    <changefreq>weekly</changefreq>');
        lines.push('    <priority>1.0</priority>');
      } else if (isLandingV2) {
        lines.push('    <changefreq>weekly</changefreq>');
        lines.push('    <priority>0.9</priority>');
      }
      lines.push('  </url>');
      return lines.join('\n');
    }),
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
