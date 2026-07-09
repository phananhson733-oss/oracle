import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import ts from 'typescript';
import { safeJsonLd } from './lib/safe-jsonld.mjs';
import { mdToHtml, stripInlineMarkdown } from './lib/md-to-html.mjs';
import { contentHash, parseSitemapLastmods, resolveLastmods } from './seo-lastmod.mjs';
import { resolveCanonicalUrl, includeInSitemap } from './lib/seo-canonical.mjs';
import { buildFaqSchemaFromMarkdown } from './lib/faq-jsonld.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const publicDir = path.join(rootDir, 'public');
const siteUrl = (process.env.SITE_URL || 'https://www.astrologywiki.com').replace(/\/$/, '');
// L2 cutover (2026-05-19): canonical home is root '/' (EN-only); /en/ /zh/ are NOT routes —
// they 301 server-side (vercel.json). Structured-data 'Home' must point at the live 200 home,
// language-matched: en -> '/', zh -> '/landing-v2/zh/' (the indexable zh landing).
const langHomeUrl = (lang) => (lang === 'zh' ? `${siteUrl}/landing-v2/zh/` : `${siteUrl}/`);
const ogImageUrl = `${siteUrl}/og-image.png`;
const today = new Date().toISOString().split('T')[0];
// T1: sitemap lastmod 只在内容真实变更时改 today，否则保留旧值。manifest 记录每个 URL 的内容签名与 lastmod，随仓库提交。
const lastmodManifestPath = path.join(scriptDir, 'seo-lastmod-manifest.json');

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

// AdSense <head> loader：仅当 VITE_ADSENSE_HEAD_LOADER_ENABLED=true 且
// VITE_ADSENSE_CLIENT_ID 为合法 ca-pub-XXXX 时注入原始 HTML 的 <head>，
// 供 Google 首次审核验证代码 + Privacy&messaging CMP 全站加载。默认关闭，避免 SEO stub 首字节必拉广告脚本。
// 格式校验防 HTML 注入。
// 与前端 services/adsense.ts::loadAdsense 共用 id="astro-adsense" 避免重复注入。
// 注意：此 loader 受 HEAD_LOADER_ENABLED + CLIENT_ID 控制（供验证/CMP），广告是否真正投放另由 VITE_ADSENSE_ENABLED
// 经 AdSlot 门控（审核期只需 CLIENT_ID，不出广告）。
const ADSENSE_HEAD_TAG = (() => {
  if (process.env.VITE_ADSENSE_HEAD_LOADER_ENABLED !== 'true') return '';
  const client = (process.env.VITE_ADSENSE_CLIENT_ID || '').trim();
  if (!/^ca-pub-\d{10,25}$/.test(client)) return '';
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous" id="astro-adsense"></script>`;
})();

const buildHead = ({
  lang,
  title,
  description,
  metaDescription,
  url,
  canonical,
  robots,
  ogType,
  alternates,
  schema,
  ogImage,
}) => {
  // 清洗未渲染的 markdown 标记（如 summary 里的 *书名*），再截断，避免脏摘要进 SERP。
  const desc = truncate(stripInlineMarkdown(metaDescription || description || ''));
  // T3：per-page OG 图（文章传 per-article PNG），缺省回退全站通用图。爬虫不跑 JS，
  // 必须把图写进静态 stub head，否则社媒分享卡片只会拿到通用图。
  const pageOgImage = ogImage || ogImageUrl;
  const headParts = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    `<meta name="robots" content="${escapeHtml(robots || 'index,follow')}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical || url)}" />`,
    ...alternates.map((alt) => `<link rel="alternate" hreflang="${alt.hrefLang}" href="${escapeHtml(alt.href)}" />`),
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:image" content="${escapeHtml(pageOgImage)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="AstrologyWiki" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(pageOgImage)}" />`,
    `<meta name="theme-color" content="#F4EFE4" />`,
  ];

  if (ADSENSE_HEAD_TAG) headParts.push(ADSENSE_HEAD_TAG);

  if (schema) {
    headParts.push(`<script type="application/ld+json">${safeJsonLd(schema)}</script>`);
  }

  headParts.push(`
<style>
  :root { color-scheme: light; }
  body { font-family: ui-serif, Georgia, 'Times New Roman', serif; margin: 0; padding: 48px 20px; background: #F4EFE4; color: #16130F; }
  main { max-width: 780px; margin: 0 auto; }
  h1 { font-size: 2.25rem; margin: 0 0 1rem; }
  p { line-height: 1.6; font-size: 1rem; }
  article.content { margin-top: 1.5rem; }
  article.content h2 { font-size: 1.5rem; margin: 2rem 0 0.75rem; }
  article.content h3 { font-size: 1.2rem; margin: 1.9rem 0 0.5rem; padding-left: 0.85rem; border-left: 2px solid rgba(154, 123, 63, 0.5); color: #7F6534; }
  article.content blockquote { margin: 1rem 0; padding-left: 1rem; border-left: 2px solid rgba(22, 19, 15, 0.3); color: #3A342B; }
  article.content li { line-height: 1.6; }
  .meta { margin-top: 1.5rem; font-size: 0.95rem; color: #6B6053; }
  a { color: #7F6534; text-decoration: none; border-bottom: 1px solid rgba(154, 123, 63, 0.35); }
  a:hover { color: #64502A; }
  .cta { display: inline-block; margin-top: 1.5rem; font-weight: 600; }
  .safety-footer { margin-top: 2.5rem; padding: 1rem 1.25rem; border: 1px solid rgba(22, 19, 15, 0.16); border-radius: 2px; background: #FBF8F1; font-size: 0.9rem; color: #3A342B; }
  .safety-footer p { margin: 0 0 0.5rem; line-height: 1.55; }
  .safety-footer ul { margin: 0.25rem 0 0; padding-left: 1.1rem; }
  .safety-footer li { line-height: 1.6; }
</style>
`);

  return headParts.join('\n');
};

const buildBody = ({ lang, title, heading, description, ctaText, spaPath, contentHtml, bootstrap, heroImage, heroAlt }) => {
  const safeTitle = escapeHtml(heading || title);
  const safeDescription = escapeHtml(description);
  const safeCta = escapeHtml(ctaText);
  const safeSpaPath = escapeHtml(spaPath);
  // 文章 hero 图（article.image）渲染进静态 stub，让爬虫/图片索引看到配图 + alt。
  // 仅文章页传入；水合后 React 用 SPA 版覆盖（不会重复）。
  const hero = heroImage
    ? `\n  <figure class="hero"><img src="${escapeHtml(heroImage)}" alt="${escapeHtml(heroAlt || title)}" loading="lazy"></figure>`
    : '';
  // contentHtml 已由 mdToHtml 转义，直接注入。它让爬虫读到完整正文（修复 soft 404）；
  // 真实浏览器水合后 React 会用 SPA 覆盖这段静态内容（见 inject-spa-into-stubs.mjs）。
  const article = contentHtml ? `\n  <article class="content">${contentHtml}</article>` : '';
  // bootstrap：把 API 同构的初始数据写进 #__WIKI_INITIAL__（置于 <main> 前 → inject-spa 把
  // <main> 包进 #root，本 script 留在 #root 外不被 React 清除）。详情页首屏直接读它渲染，
  // 跳过 loading/error 壳，彻底消除「SPA 用慢 API 内容替换静态正文」造成的 soft 404。
  // safeJsonLd 转义 </script>/U+2028/U+2029，防构建期存储型 XSS。
  const bootstrapScript = bootstrap
    ? `<script id="__WIKI_INITIAL__" type="application/json">${safeJsonLd(bootstrap)}</script>\n`
    : '';
  return `
${bootstrapScript}<main>
  <h1>${safeTitle}</h1>
  <p>${safeDescription}</p>${hero}${article}
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

const writeHtmlPage = async ({ outputPath, lang, title, heading, description, metaDescription, url, canonical, robots, ogType, schema, alternates, ctaText, spaPath, contentHtml, ogImage, bootstrap, heroImage, heroAlt }) => {
  const html = `<!DOCTYPE html>
<html lang="${lang}">
  <head>
${buildHead({ lang, title, description, metaDescription, url, canonical, robots, ogType, alternates, schema, ogImage })}
  </head>
  <body data-astro-lang="${lang}">
${buildBody({ lang, title, heading, description, ctaText, spaPath, contentHtml, bootstrap, heroImage, heroAlt })}
  </body>
</html>
`;
  await ensureDir(path.dirname(outputPath));
  await fsPromises.writeFile(outputPath, html, 'utf8');
};

// Wiki 条目正文分段标题，与前端 constants.ts TRANSLATIONS 的 wiki.detail_* 文案保持一致。
const WIKI_SECTION_TITLES = {
  zh: {
    astronomy_myth: '天文学与神话',
    psychology: '心理占星',
    shadow: '阴影模式',
    integration: '整合路径',
    deep_dive: '深入解读',
  },
  en: {
    astronomy_myth: 'Astronomy & Myth',
    psychology: 'Psychological Lens',
    shadow: 'Shadow Pattern',
    integration: 'Integration Path',
    deep_dive: 'Deep Dive',
  },
};

// 把 wiki 条目的 5 个正文字段拼成带 ## 小标题的 Markdown，供 mdToHtml 注入静态页正文。
const buildWikiItemMarkdown = (item, lang) => {
  const titles = WIKI_SECTION_TITLES[lang] || WIKI_SECTION_TITLES.en;
  const parts = [];
  const addSection = (title, body) => {
    if (body && String(body).trim()) parts.push(`## ${title}\n\n${String(body).trim()}`);
  };
  addSection(titles.astronomy_myth, item.astronomy_myth);
  addSection(titles.psychology, item.psychology);
  addSection(titles.shadow, item.shadow);
  addSection(titles.integration, item.integration);
  if (Array.isArray(item.deep_dive) && item.deep_dive.length) {
    const steps = item.deep_dive
      .map((step) => {
        if (!step) return '';
        const heading = step.title ? `### ${String(step.title).trim()}\n\n` : '';
        const desc = step.description ? String(step.description).trim() : '';
        return desc ? `${heading}${desc}` : '';
      })
      .filter(Boolean)
      .join('\n\n');
    if (steps) parts.push(`## ${titles.deep_dive}\n\n${steps}`);
  }
  return parts.join('\n\n');
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

const buildItemListSchema = (lang, pathSuffix, items) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: items.map((item, index) => {
    // P1-1：canonicaled-away 的 loser 条目（house-5/elements/transit-chart）在 hub 列表里指向 winner，
    // 避免结构化数据替自我否定权威的 loser 背书、削弱 canonical 收口信号。
    const selfUrl = `${siteUrl}/${lang}${pathSuffix}/${item.id}`;
    const url = resolveCanonicalUrl({ seo: item.seo, lang, selfUrl, siteUrl });
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
  description: truncate(stripInlineMarkdown(item.summary || '')),
  url,
  inLanguage: lang,
  keywords: item.keywords || undefined,
  image: item.cover_url || undefined,
});

// T3：文章静态 stub 的 OG 图 = 构建期生成的 per-article PNG（scripts/generate-og-images.mjs，
// 落在 public/og/articles/<slug>[.zh].png）。图缺失时回退全站通用图，保证 head 始终有有效 og:image。
const articleOgImage = (slug, lang) => {
  const file = `${slug}${lang === 'zh' ? '.zh' : ''}.png`;
  const fsPath = path.join(publicDir, 'og', 'articles', file);
  return fs.existsSync(fsPath) ? `${siteUrl}/og/articles/${file}` : ogImageUrl;
};

// T2：文章 author 用编辑部 Organization（E-E-A-T 责任主体），不放大 persona 拟真人感。
// author 由调用点传入已构造好的 schema 对象（buildEditorialOrganizationSchema），保持与
// 前端 WikiArticleDetailPage 渲染的 JSON-LD 一致。image 传 per-article OG 图。
const buildArticleSchema = (lang, article, url, author, image) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: truncate(stripInlineMarkdown(article.description || '')),
  author: author || undefined,
  datePublished: article.date || undefined,
  url,
  mainEntityOfPage: url,
  inLanguage: lang,
  image: image || ogImageUrl,
  keywords: article.keywords && article.keywords.length ? article.keywords : undefined,
});

const buildLandingV2WebSiteSchema = (lang, url) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AstrologyWiki',
  url,
  inLanguage: lang,
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
  logo: `${siteUrl}/brand/logo-schema-512.png`,
  sameAs: [
    'https://twitter.com/astrologywiki',
    'https://www.instagram.com/astrologywiki',
    'https://www.youtube.com/@astrologywiki',
  ],
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
    `<meta name="theme-color" content="#F4EFE4" />`,
    `<script type="application/ld+json">${safeJsonLd(schema)}</script>`,
    `
<style>
  :root { color-scheme: light; }
  body { font-family: 'Cormorant Garamond', 'EB Garamond', Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background: #F4EFE4; color: #16130F; }
  main { max-width: 980px; margin: 0 auto; padding: 64px 24px; }
  .hero { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; }
  .hero h1 { font-size: clamp(2.5rem, 6vw, 5rem); line-height: 1.05; margin: 0 0 1.25rem; font-weight: 500; letter-spacing: -0.015em; }
  .hero .accent { color: #9A7B3F; font-style: italic; }
  .hero p { font-size: 1.15rem; line-height: 1.6; margin: 0 0 0.5rem; color: #3A342B; }
  .hero .cta-row { margin-top: 2rem; display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; }
  .cta-primary { display: inline-block; background: #16130F; color: #F4EFE4; padding: 14px 28px; border-radius: 2px; font-weight: 500; font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; font-size: 0.85rem; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; border: none; }
  .cta-secondary { color: #16130F; text-decoration: underline; text-underline-offset: 4px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.95rem; }
  .trust { margin-top: 2rem; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: #6B6053; font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; }
  .sections { margin-top: 4rem; display: grid; gap: 1.5rem; }
  .section-card { padding: 1.5rem 0; border-top: 1px solid rgba(22,19,15,0.16); }
  .section-card h2 { font-size: 1.5rem; margin: 0 0 0.5rem; }
  .section-card p { font-size: 1rem; line-height: 1.6; margin: 0; color: #3A342B; }
  .footer-note { margin-top: 3rem; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.8rem; color: #6B6053; }
</style>
`,
  ];

  if (ADSENSE_HEAD_TAG) headParts.push(ADSENSE_HEAD_TAG);

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
      <p class="footer-note">AstrologyWiki · ${lang.toUpperCase()} · <a href="/">Open the interactive app</a></p>
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

// Featured article slugs — generate static HTML (full body) + sitemap entry.
const ARTICLE_SLUGS = [
  'cancer-season-2026-astrology',
  'rhaenyra-targaryen-zodiac-sign',
  'bruno-fernandes-zodiac-sign',
  'luka-modric-zodiac-sign',
  'bukayo-saka-zodiac-sign',
  'solar-return-chart',
  'vozinha-birth-chart',
  'germany-world-cup-players-birth-chart-2026',
  'germany-world-cup-2026-astrology-team',
  'vinicius-jr-birth-chart-astrology',
  'scotland-world-cup-2026-astrology-saturn-return',
  'moon-rising-sign',
  'gemini-rising',
  'virgo-rising',
  'cancer-rising',
  'ascendant-meaning',
  'mars-return-astrology',
  'uranus-opposition',
  'saturn-in-aries-2026',
  'dhanishta-nakshatra',
  'ardra-nakshatra',
  'magha-nakshatra',
  'punarvasu-nakshatra',
  'revati-nakshatra',
  'purva-bhadrapada-nakshatra',
  'uttara-phalguni-nakshatra',
  'uttara-bhadrapada-nakshatra',
  'rahu-and-ketu-astrology',
  'north-node-in-leo',
  'blue-node-astrology',
  'emotion-journal',
  'world-cup-2026-june-astrology',
  'best-soccer-players-zodiac-sign',
  'zodiac-signs-as-world-cup-2026-teams',
  'argentina-world-cup-2026-astrology',
  'vinicius-jr-zodiac-sign',
  'lamine-yamal-birth-chart',
  'cristiano-ronaldo-zodiac-sign',
  'lionel-messi-zodiac-sign',
  'mbappe-birth-chart',
  'world-cup-2026-astrology-prediction',
  // 6/18 WC player + Cancer-cluster (PG-WC-016~020), staggered ~20-25min apart
  'spain-world-cup-2026-astrology',
  'scotland-brazil-world-cup-astrology',
  'toy-story-5-zodiac-signs',
  'chiron-in-taurus-2026-astrology',
  'matheus-cunha-birth-chart',
  'england-world-cup-2026-astrology',
  'yoane-wissa-birth-chart',
  'christian-pulisic-birth-chart',
  'luis-diaz-birth-chart',
  'james-rodriguez-birth-chart',
  'cancer-zodiac-world-cup-2026',
  'harry-kane-birth-chart',
  'messi-world-cup-record-astrology',
  'erling-haaland-birth-chart',
  'jude-bellingham-birth-chart',
  'famous-highly-sensitive-person',
  'how-to-read-birth-chart',
  '10th-house-astrology',
  '7th-house-astrology',
  '6th-house-astrology',
  '5th-house',
  '3rd-house-astrology',
  'solar-plexus-chakra-affirmations',
  'vedic-birth-chart-calculator',
  '4th-house-meaning',
  'sacral-chakra-meaning',
  'how-to-find-north-node',
  'chakra-test',
  '2nd-house-astrology',
  'vedic-vs-western-astrology',
  'crown-chakra-meaning',
  'aura-reading',
  '1st-house-meaning',
  'root-chakra-meaning',
  'north-node-in-taurus',
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
  // 5/29 batch — both clusters now in sitemap (staggered: chakra shipped batch 1,
  // astrology-terms cluster added in batch 2 ~45min later).
  'heart-chakra-meaning',
  'throat-chakra-meaning',
  'ajna-chakra',
  'crystals-for-each-chakra',
  'astrology-terms',
  'sextile-astrology',
  'trine-in-astrology',
  'square-astrology',
  'descendant-astrology',
  'ic-astrology',
  // 5/30 batch — staggered prod rollout (3 sub-batches, ~45min apart).
  // Batch 1: healing_placements cluster (pillar + 2 spokes, tightly cross-linked).
  'healing-your-inner-wound',
  'chiron-in-12th-house',
  'mars-in-12th-house',
  // Batch 2: saturn-in-pisces (T1 transit pillar, evergreen).
  'saturn-in-pisces',
  // Batch 3: persephone-goddess (T2 myth archetype, highest vol of batch — 12k/mo).
  'persephone-goddess',
  // 6/1 batch — transit cluster (staggered 45-60min apart):
  // transits pillar (batch 1) -> natal-chart-transits spoke (batch 2)
  // -> june-2026 (batch 3) -> july-2026 (batch 4).
  'transits',
  'natal-chart-transits',
  'june-2026-planetary-transits',
  'july-2026-planetary-transits',
  // 6/2 EMPATH/HSP cluster (sequential staggered, pillar first):
  // pillar -> signs -> vs-autism -> famous.
  'highly-sensitive-person',
  'signs-of-a-highly-sensitive-person',
  'highly-sensitive-person-vs-autism',
  // 6/2 MAHADASHA cluster (sequential staggered, pillar first):
  // mahadasha -> rahu -> ketu -> saturn(shani) -> venus.
  'mahadasha',
  'rahu-mahadasha',
  'ketu-mahadasha',
  'saturn-mahadasha',
  'venus-mahadasha',
];

// EN-only featured articles (v8 aura batch 2026-05-22). Excluded from
// ARTICLE_SLUGS because there is no ZH variant — adding /zh/wiki/<slug>
// to the sitemap would produce 404s for Google. Listed separately and
// emitted into the sitemap with /en/wiki/ only (see loop below).
const ARTICLE_SLUGS_EN_ONLY = [
  'zendaya-birth-chart',
  'ayo-edebiri-birth-chart',
  'justin-verlander-birth-chart',
  'jack-antonoff-birth-chart',
  'coco-gauff-zodiac-sign',
  'mo-salah-zodiac-sign',
  'novak-djokovic-zodiac-sign',
  'kylian-mbappe-birth-chart',
  'lamine-yamal-zodiac-sign',
  'kai-cenat-zodiac-sign',
  'egypt-world-cup-2026-astrology',
  'alexander-zverev-birth-chart',
  'arthur-fery-birth-chart',
  'anne-hathaway-birth-chart',
  'kevin-de-bruyne-birth-chart',
  'rayan-cherki-birth-chart',
  'kylian-mbapp-birth-chart',
  'achraf-hakimi-birth-chart',
  'england-vs-norway-astrology',
  'jessica-pegula-birth-chart',
  'cole-palmer-birth-chart',
  'erling-haaland-girlfriend-birth-chart',
  'malia-obama-birth-chart',
  'diogo-jota-birth-chart',
  'travis-kelce-birth-chart',
  'pen-lope-cruz-birth-chart',
  'tobey-maguire-birth-chart',
  'jaylen-brown-birth-chart',
  'coco-gauff-birth-chart',
  'angela-nikolau-birth-chart',
  'john-denver-birth-chart',
  'vera-wang-birth-chart',
  'bella-hadid-birth-chart',
  'elliot-page-birth-chart',
  'thylane-blondeau-birth-chart',
  'lebron-james-birth-chart',
  'maya-joint-birth-chart',
  'total-solar-eclipse-2026',
  'pride-month-astrology',
  'cardi-b-birth-chart',
  'usa-pluto-return-astrology',
  'carlos-alcaraz-birth-chart',
  'morocco-world-cup-2026-astrology',
  'ben-shelton-zodiac-sign',
  'teyana-taylor-birth-chart',
  'jannik-sinner-zodiac-sign',
  'serena-williams-birth-chart',
  'harry-styles-and-zo-kravitz',
  'taylor-swift-and-travis-kelce',
  'colombia-vs-portugal',
  'jordan-vs-argentina',
  'ricky-gervais-zodiac-sign',
  'reese-witherspoon-oliver-haarmann-compatibility-astrology',
  'jwoww-zack-carpinello-wedding-synastry',
  'darwin-nunez-zodiac-sign',
  'folarin-balogun-birth-chart',
  'emma-watson-zodiac-sign',
  'mariah-carey-zodiac-sign',
  'marcus-rashford-zodiac-sign',
  'thomas-partey-zodiac-sign',
  'kylie-jenner-zodiac-sign',
  'greta-lee-zodiac-sign',
  'sharon-osbourne-zodiac-sign',
  'father-s-day-astrology-2026',
  'jeremy-doku-birth-chart',
  'mo-salah-birth-chart',
  'prince-william-birth-chart',
  'niko-birth-chart',
  '2026-astrology-calendar',
  'ashwini-nakshatra',
  'hasta-nakshatra',
  'krittika-nakshatra',
  'neptune-in-pisces',
  'swati-nakshatra',
  'mrigashira-nakshatra',
  'synastry-chart-compatibility',
  'composite-chart-calculator',
  'black-moon-lilith',
  'shadow-work-journal-prompts',
  'full-moon-july-2026',
  'journal-prompts',
  'new-moon-journal-prompts',
  'full-moon-journal-prompts',
  'moon-journal',
  'full-moon-june-2026',
  'scorpio-rising-houses',
  'leo-rising-houses',
  'libra-rising-houses',
  'sattva-rajas-tamas',
  'ai-astrology-app',
  'nakshatra',
  'pushya-nakshatra',
  '3-gunas',
  'solar-return',
  'how-to-balance-vata-dosha',
  'juno-astrology',
  'cancer-north-node',
  'north-node-in-sagittarius',
  'north-node-in-gemini',
  'south-node',
  'rohini-nakshatra',
  'ashlesha-nakshatra',
  'chiron-in-taurus',
  'bharani-nakshatra',
  'anuradha-nakshatra',
  'what-to-do-on-a-full-moon-spiritually',
  'full-moon-energy',
  'what-is-a-full-moon-ritual',
  'aura-colors-guide',
  'blue-aura-meaning',
  'yellow-aura-meaning',
  'purple-aura-meaning',
  'white-aura-meaning',
  'red-aura-meaning',
  'chakra-system-overview',
  'four-element-framework',
  // tool-led prove-chain 桥页：写静态 stub（noindex,follow，给直达/内链访客兜底），
  // 但 article.seo.sitemap===false 使其不进 sitemap（转化实验，不求收录）。
  'aura-moon-venus-rising-bridge',
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
  // T2：文章 author 责任主体（Organization 编辑部），跨页一致建立单一编辑部实体。
  const buildEditorialOrganizationSchema = authorSchemaModule.buildEditorialOrganizationSchema;
  const editorialOrgSchema = buildEditorialOrganizationSchema(siteUrl);

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
  // T9：psych-adjacent 文章强制安全 footer。文案与 SPA <SafetyFooter> 同源自 utils/safetyFooter.ts
  // （单一来源、绝不漂移），生成器经 loadTsModule 取其 HTML builder 注入静态 stub。
  const safetyFooterModule = loadTsModule(path.join(rootDir, 'utils/safetyFooter.ts'));
  const buildSafetyFooterHtml = safetyFooterModule.buildSafetyFooterHtml;
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

  // T1: 收集 sitemap URL 及其内容签名片段（url → parts[]）。lastmod 在写出时按签名变化解析，
  // 不再每个 URL 写 today。Map 自带去重，最后取 keys 排序。
  const urlSignatures = new Map();
  const addUrl = (url, parts) => { urlSignatures.set(url, parts); };

  // Landing v2 URLs (manually included; sitemap entries get priority 0.9 below).
  const LANDING_V2_URLS = [
    `${siteUrl}/landing-v2/en/`,
    `${siteUrl}/landing-v2/zh/`,
  ];
  // 签名取渲染 HTML 的 hash：landing 文案变了才更新 lastmod。
  const landingHtmlByLang = { en: buildLandingV2Html('en'), zh: buildLandingV2Html('zh') };
  addUrl(`${siteUrl}/landing-v2/en/`, ['landing-v2', 'en', contentHash([landingHtmlByLang.en])]);
  addUrl(`${siteUrl}/landing-v2/zh/`, ['landing-v2', 'zh', contentHash([landingHtmlByLang.zh])]);

  // P0-3：法务/信息页静态化。此前这些路由只进 sitemap、不写静态 HTML → 爬虫拿到空壳 SPA（soft 404）。
  // 现为每条路由写带 <main> 的静态 stub（简明真实摘要 + CTA 进 SPA 完整页），inject-spa 再注入水合。
  // 摘要为自洽的真实内容、不复制法律全文（避免与 SPA 正文漂移/合规风险），完整条款仍由 SPA 渲染。
  const PUBLIC_ROUTE_COPY = {
    en: {
      '/privacy': { title: 'Privacy Policy', description: 'How AstrologyWiki collects, uses, and protects your data — birth details, journal entries, and account information.', body: 'AstrologyWiki treats birth data, CBT journal text, and the questions you ask as sensitive personal information. We do not sell your data, and astrology inputs are hashed before caching. This page summarizes our practices; open the full policy for the complete terms on data collection, retention, and your deletion rights.' },
      '/terms': { title: 'Terms of Service', description: 'The terms that govern your use of AstrologyWiki, including acceptable use and the educational nature of our content.', body: 'AstrologyWiki provides psychological astrology content and tools for self-reflection and education. It is not a substitute for professional medical, psychological, or financial advice. By using the site you agree to the full Terms of Service, which cover acceptable use, account responsibilities, and limitations of liability.' },
      '/cookies': { title: 'Cookie Policy', description: 'Which cookies AstrologyWiki uses, why, and how you can control them.', body: 'AstrologyWiki uses a small number of essential cookies to remember your language and theme preferences, plus privacy-respecting analytics. We do not use cookies to resell your browsing data. The full Cookie Policy explains each category and how to opt out.' },
      '/about': { title: 'About AstrologyWiki', description: 'AstrologyWiki is a modern, psychology-grounded astrology knowledge base built on real astronomy — no mysticism, no fortune-telling.', body: 'AstrologyWiki pairs Swiss Ephemeris astronomy with modern psychology to make astrology a tool for self-knowledge rather than prediction. Our wiki, calculators, and CBT journal are free to use. Learn more about our editorial approach, data sources, and the people behind the project.' },
      '/help': { title: 'Help & FAQ', description: 'Answers to common questions about birth charts, calculators, accounts, and using AstrologyWiki.', body: 'Find answers about generating a birth chart, reading your Saturn return, using the synastry and transit tools, and managing your data. Browse the full help center for step-by-step guides and frequently asked questions.' },
      // 定价页：body 含可见价格文案，爬虫无需执行 JS 即可读到价格（防 soft 404）。
      // 金额须与 backend/src/config/airwallex.ts 及 data/pricing.ts 保持一致（见 docs/PRD.md §3）。
      '/pricing': {
        title: 'Pricing',
        description: 'AstrologyWiki pricing: start free, or go Pro from $6.99/month ($41.99/year, save 50%). One-time credit packs from $4.99, plus a 7-day free trial.',
        body: `## Plans

AstrologyWiki is free to start — create a birth chart, explore the wiki, and use the CBT journal without an account.

Go Pro for full access:

- **Monthly** — $6.99/month, cancel anytime
- **Yearly** — $41.99/year (about $3.50/month), save 50%
- **First subscription** — 50% off your first plan
- **Free trial** — 7 days unlocked when you sign up

Pro unlocks deep-dive readings, up to 10 Ask questions a week, extra synastry, monthly CBT insights, 10 daily wiki and tool lookups, and 100 bonus credits with every payment.

## Credit packs

Prefer to pay as you go? One-time credits:

- **Starter** — 100 credits for $4.99
- **Standard** — 300 credits for $12.49 (save 17%)
- **Value** — 500 credits for $19.99 (save 20%)
- **Pro** — 1,000 credits for $34.99 (save 30%)

Credits cover Ask, synastry, and Synthetica when your free quota runs out.

## Free vs Pro

Free members get 3 Ask questions a week, 3 synastry readings (lifetime), 3 Synthetica runs a day, and the first three psychological dimensions. Pro members unlock unlimited details, higher weekly limits, every dimension, and monthly CBT insights.

Prices shown in USD; EUR, GBP, and CNY are supported at checkout. Payments are processed securely by Airwallex.`,
      },
    },
    zh: {
      '/privacy': { title: '隐私政策', description: 'AstrologyWiki 如何收集、使用与保护你的数据——出生信息、日记内容与账户信息。', body: 'AstrologyWiki 将出生数据、CBT 日记文本与你提出的问题视为敏感个人信息。我们不出售你的数据，占星输入在缓存前会先经哈希处理。本页为做法摘要；完整政策详述数据收集、保留期限与你的删除权利。' },
      '/terms': { title: '服务条款', description: '规范你使用 AstrologyWiki 的条款，包括可接受使用与内容的教育性质。', body: 'AstrologyWiki 提供心理占星内容与自我反思、教育用途的工具，不能替代专业的医疗、心理或财务建议。使用本站即表示你同意完整服务条款，其涵盖可接受使用、账户责任与责任限制。' },
      '/cookies': { title: 'Cookie 政策', description: 'AstrologyWiki 使用哪些 Cookie、为何使用，以及你如何控制它们。', body: 'AstrologyWiki 仅使用少量必要 Cookie 来记住你的语言与主题偏好，并采用尊重隐私的分析。我们不会用 Cookie 转售你的浏览数据。完整 Cookie 政策说明各类别及退出方式。' },
      '/about': { title: '关于 AstrologyWiki', description: 'AstrologyWiki 是基于真实天文与现代心理学的占星知识库——无玄学、不算命。', body: 'AstrologyWiki 将 Swiss Ephemeris 天文计算与现代心理学结合，让占星成为自我认识的工具而非预测。我们的百科、计算器与 CBT 日记均免费。了解更多关于我们的编辑理念、数据来源与团队。' },
      '/help': { title: '帮助与常见问题', description: '关于出生星盘、计算器、账户与使用 AstrologyWiki 的常见问题解答。', body: '在这里找到生成出生星盘、解读土星回归、使用合盘与过运工具，以及管理你的数据的解答。浏览完整帮助中心获取分步指南与常见问题。' },
      '/pricing': {
        title: '定价方案',
        description: 'AstrologyWiki 定价：免费起步，Pro 每月 ¥49（年付 ¥294，立省 50%）。一次性积分包 ¥34 起，注册赠 7 天试用。',
        body: `## 方案

AstrologyWiki 免费起步——无需账户即可生成出生星盘、浏览百科、使用 CBT 日记。

升级 Pro 解锁全部功能：

- **月付** — 每月 ¥49，随时取消
- **年付** — 每年 ¥294（约每月 ¥24.5），立省 50%
- **首次订阅** — 首个方案享 5 折
- **免费试用** — 注册即赠 7 天

Pro 解锁深度解读、每周最多 10 次 Ask 问答、额外合盘、月度 CBT 统计、每日 10 次百科与工具查询，以及每次支付赠送 100 积分。

## 积分包

更喜欢按需付费？一次性积分：

- **入门包** — 100 积分 ¥34
- **标准包** — 300 积分 ¥84（省 17%）
- **超值包** — 500 积分 ¥134（省 20%）
- **专业包** — 1,000 积分 ¥234（省 30%）

免费额度用完时，积分可用于 Ask、合盘与 Synthetica。

## 免费 vs Pro

免费用户每周 3 次 Ask、3 次合盘（终身）、每天 3 次 Synthetica，以及前 3 个心理维度。Pro 用户解锁无限详情、更高每周额度、全部维度与月度 CBT 统计。

价格以人民币显示；结账支持美元、欧元与英镑。支付由 Airwallex 安全处理。`,
      },
    },
  };
  const publicRoutes = ['/privacy', '/terms', '/cookies', '/about', '/help', '/pricing'];
  for (const lang of ['en', 'zh']) {
    for (const route of publicRoutes) {
      const copy = PUBLIC_ROUTE_COPY[lang][route];
      const url = `${siteUrl}/${lang}${route}`;
      // 签名取真实内容 hash → 文案变更才更新 lastmod（取代旧的冻结 'v1'）。
      addUrl(url, ['static-route', lang, route, contentHash([copy.title, copy.description, copy.body])]);
      await writeHtmlPage({
        outputPath: path.join(publicDir, lang, route.slice(1), 'index.html'),
        lang,
        title: copy.title,
        description: copy.description,
        url,
        ogType: 'website',
        alternates: buildAlternateLinks(route),
        schema: [
          // 页面级 WebPage 实体，给爬虫语义框定（法务/信息页本身的类型），不只有 breadcrumb。
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: copy.title,
            description: copy.description,
            url,
            inLanguage: lang,
            isPartOf: { '@type': 'WebSite', name: 'AstrologyWiki', url: langHomeUrl(lang) },
          },
          buildBreadcrumb(lang, [
            { name: LANG_CONFIG[lang].breadcrumbHome, url: langHomeUrl(lang) },
            { name: copy.title, url },
          ]),
        ],
        ctaText: LANG_CONFIG[lang].homeCta,
        spaPath: `/${lang}${route}`,
        contentHtml: mdToHtml(copy.body),
      });
    }
  }

  for (const lang of ['zh', 'en']) {
    const config = LANG_CONFIG[lang];
    const langRoot = path.join(publicDir, lang);
    const rawWikiItems = wikiContent[lang]?.items || [];
    // 完整 raw item（与后端 /wiki/items/:id 返回的 item 同构），供 #__WIKI_INITIAL__ bootstrap。
    // 必须用完整体——首屏渲染需要 type/symbol/prototype/analogy/color_token/related_ids，
    // 下面 wikiItems 的瘦身版缺这些字段（codex 评审纠正点）。
    const rawWikiById = new Map(rawWikiItems.map((item) => [item.id, item]));
    const wikiItems = rawWikiItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      keywords: item.keywords || [],
      subtitle: item.subtitle || '',
      // 正文字段，供 SEO 静态页注入完整内容（修复 soft 404）。
      astronomy_myth: item.astronomy_myth || '',
      psychology: item.psychology || '',
      shadow: item.shadow || '',
      integration: item.integration || '',
      deep_dive: item.deep_dive || [],
      // SEO 收口策略（canonicalPath/robots/sitemap），P1-1 由 wiki.ts 的 WIKI_SEO_OVERRIDES 注入。
      seo: item.seo,
    }));
    const classics = classicsByLang[lang] || [];

    const wikiPath = `/${lang}/wiki`;
    const classicsPath = `/${lang}/wiki/classics`;

    // Only add wiki hub for all langs; classics hub only for en
    if (lang === 'en') {
      // hub 的 lastmod 在 hub 文案变或条目集合变（新增/删除条目）时更新。
      addUrl(`${siteUrl}${wikiPath}`, ['wiki-hub', lang, config.wikiTitle, config.wikiDescription, ...wikiItems.map((i) => i.id)]);
      addUrl(`${siteUrl}${classicsPath}`, ['classics-hub', lang, config.classicsTitle, config.classicsDescription, ...classics.map((c) => c.id)]);
    }

    // Only generate wiki hub and classics hub for en
    if (lang === 'en') {
      await writeHtmlPage({
        outputPath: path.join(langRoot, 'wiki', 'index.html'),
        lang,
        title: config.wikiTitle,
        description: config.wikiDescription,
        url: `${siteUrl}${wikiPath}`,
        ogType: 'website',
        // P1-2：zh wiki hub 当前不预渲染、也不进 sitemap，故 en hub 不宣告 zh alternate（保持 hreflang 互惠诚实）。
        alternates: buildAlternateLinks('/wiki', { zh: false, en: true }),
        schema: [
          buildItemListSchema(lang, '/wiki', wikiItems),
          buildBreadcrumb(lang, [
            { name: config.breadcrumbHome, url: langHomeUrl(lang) },
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
        // P1-2：classics hub 同理 en-only（无 zh classics 页），不宣告 zh alternate。
        alternates: buildAlternateLinks('/wiki/classics', { zh: false, en: true }),
        schema: [
          buildItemListSchema(lang, '/wiki/classics', classics),
          buildBreadcrumb(lang, [
            { name: config.breadcrumbHome, url: langHomeUrl(lang) },
            { name: config.breadcrumbClassics, url: `${siteUrl}${classicsPath}` },
          ]),
        ],
        ctaText: config.classicsCta,
        spaPath: `/${lang}/wiki/classics`,
        // 首屏 bootstrap：经典书摘要列表（与 fetchWikiClassics 的 { lang, items } 同构）。
        // 只取摘要字段、剔除 content（每本 ~30KB，全列会把 hub stub 撑到近 1MB）；
        // 让书架列表 + ItemList 在冷 API 下也能首屏渲染（修复 hub soft 404）。
        bootstrap: {
          kind: 'wiki-classics-list',
          lang,
          items: classics.map((c) => ({
            id: c.id,
            title: c.title,
            author: c.author,
            summary: c.summary || '',
            cover_url: c.cover_url ?? null,
            keywords: c.keywords || [],
            category: c.category,
          })),
        },
      });

      // Author profile pages (EN-only) — static stubs with ProfilePage/Person
      // JSON-LD so crawlers read the author entity without executing JS.
      for (const persona of ALL_AUTHORS) {
        const authorPath = `/${lang}/wiki/author/${persona.id}`;
        const authorPageUrl = `${siteUrl}${authorPath}`;
        addUrl(authorPageUrl, ['author', persona.id, persona.name, persona.title, persona.bio.en || '', ...persona.topics]);
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
              { name: config.breadcrumbHome, url: langHomeUrl(lang) },
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
      // P1-1：canonical 收口（loser 条目 canonical 指向 winner 长文）+ sitemap 收录由 item.seo 控制。
      const canonicalUrl = resolveCanonicalUrl({ seo: item.seo, lang, selfUrl: itemUrl, siteUrl });
      const alternateAvailability = {
        zh: wikiIds.zh.has(item.id) && (lang === 'en' || ZH_WIKI_WHITELIST.has(item.id)),
        en: wikiIds.en.has(item.id),
      };
      const itemMarkdown = buildWikiItemMarkdown(item, lang);
      // 正文签名纳入 lastmod：正文变化才更新，否则保持稳定（与 T1 防 churn 协同）。
      // loser 页（seo.sitemap === false）canonical 已指向 winner，不再进 sitemap（避免发混合信号）。
      if (includeInSitemap(item.seo)) {
        addUrl(itemUrl, ['wiki', lang, item.id, item.title, item.description || '', item.subtitle || '', ...(item.keywords || []), contentHash([itemMarkdown])]);
      }
      await writeHtmlPage({
        outputPath: path.join(langRoot, 'wiki', item.id, 'index.html'),
        lang,
        title: item.title,
        description: item.description || config.wikiDescription,
        url: itemUrl,
        canonical: canonicalUrl,
        robots: item.seo?.robots,
        ogType: 'article',
        // loser 页（canonical 指向 winner）不发 hreflang：canonicaled-away 页若仍声明指向自己的
        // hreflang，会与 canonical 互相矛盾（且可能指向未生成的 zh loser 页）。winner 自带 hreflang 簇。
        alternates: item.seo?.canonicalPath || item.seo?.alternates === false ? [] : buildAlternateLinks(`/wiki/${item.id}`, alternateAvailability),
        schema: [
          buildDefinedTermSchema(lang, item, itemUrl),
          buildBreadcrumb(lang, [
            { name: config.breadcrumbHome, url: langHomeUrl(lang) },
            { name: config.breadcrumbWiki, url: `${siteUrl}${wikiPath}` },
            { name: item.title, url: itemUrl },
          ]),
        ],
        ctaText: config.wikiCta,
        spaPath: `/${lang}/wiki/${item.id}`,
        contentHtml: mdToHtml(itemMarkdown),
        // 首屏 bootstrap：完整 raw item，shape 与 WikiItemResponse({ lang, item }) 同构。
        bootstrap: rawWikiById.get(item.id)
          ? { kind: 'wiki-item', lang, id: item.id, item: rawWikiById.get(item.id) }
          : undefined,
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
      const classicMarkdown = classicDetail.content || '';
      // 正文签名纳入 lastmod：正文变化才更新，否则保持稳定（与 T1 防 churn 协同）。
      addUrl(classicUrl, ['classic', lang, classic.id, classicDetail.title, classicDetail.summary || '', contentHash([classicMarkdown])]);
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
            { name: config.breadcrumbHome, url: langHomeUrl(lang) },
            { name: config.breadcrumbClassics, url: `${siteUrl}${classicsPath}` },
            { name: classicDetail.title, url: classicUrl },
          ]),
        ],
        ctaText: config.classicsCta,
        spaPath: `/${lang}/wiki/classics/${classic.id}`,
        contentHtml: mdToHtml(classicMarkdown),
        // 首屏 bootstrap：完整 classicDetail（含 content/title/summary/author/keywords），
        // shape 与 WikiClassicResponse({ lang, item }) 同构。无正文则不注入（避免空壳首屏）。
        bootstrap: classicMarkdown
          ? { kind: 'wiki-classic', lang, id: classic.id, item: { ...classicDetail, id: classic.id, lang } }
          : undefined,
      });
    }
  }

  // P0-2：Saturn Return Calculator 静态化（V=14k KD=20 高价值工具词，URL 已存在但此前是空壳）。
  // 旧顾虑「静态 HTML 会被 Vercel 高优先 serve、盖住 SPA 导致计算器加载不出来」早于 inject-spa-into-stubs：
  // 该 injector 会把 stub 的 <main> 包进 #root 并注入 SPA bundle → 爬虫拿到静态正文+JSON-LD，浏览器水合后
  // 计算器照常交互。故此处恢复写静态 stub（EN-only：无 zh 工具页，alternates 不宣告 zh）。不带 bootstrap
  // （计算器为纯客户端、无需 API 首屏数据，也无对应 SPA bootstrap reader）。
  {
    const saturnUrl = `${siteUrl}/en/saturn-return-calculator`;
    const saturnTitle = 'Saturn Return Calculator - Free Saturn Return Dates';
    const saturnDescription =
      'Calculate when your Saturn Return happens. Enter your birth date to discover your Saturn Return dates, meaning, and how this major life transit affects you.';
    const saturnBody = [
      '## Saturn Return cycle basics',
      'A Saturn Return is the moment the planet Saturn comes back to the exact position it held in the sky when you were born. Because Saturn takes about 29.5 years to orbit the Sun, this homecoming happens at roughly ages 27-30, 56-60, and 85-90. Astrologers treat it as a threshold between life chapters — the end of one structure and the building of the next.',
      '## Personal return window',
      'Your first Saturn Return usually begins between ages 27 and 30. Enter your birth date in the calculator above to get your personal Saturn Return dates, including when Saturn first enters its return and when it finishes. The exact timing depends on the year you were born, because Saturn does not move at a perfectly even pace.',
      '## Return duration and retrogrades',
      'A Saturn Return is not a single day — it is a transit that unfolds over roughly two to three years as Saturn moves across its birth position, often retrograding back and forth. Most people feel it most strongly in the year Saturn is exactly conjunct its natal point.',
      '## Saturn Return themes',
      'In modern psychological astrology, the Saturn Return is associated with maturity, responsibility, and realigning your life with your real values. It is not a prediction of fate. It tends to surface questions about career, relationships, and identity — a developmental checkpoint where you decide what to keep building and what to let go. Treat it as a tendency and an invitation, not a guarantee.',
      '## Calculator results and next steps',
      'This free calculator uses your birth date to estimate your Saturn Return window. No account or birth time is required. For a deeper reading, pair your Saturn Return dates with your full birth chart and the psychological astrology articles in the AstrologyWiki wiki.',
    ].join('\n\n');
    const saturnFaqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'en',
      mainEntity: [
        { '@type': 'Question', name: 'Can I calculate my Saturn Return without a birth time?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Saturn moves slowly enough that a date-based window is still useful. An exact birth time mainly helps place Saturn in houses for a fuller chart reading.' } },
        { '@type': 'Question', name: 'How many Saturn Returns are included?', acceptedAnswer: { '@type': 'Answer', text: 'The calculator focuses on the first, second, and third Saturn Returns, which usually fall around ages 27-30, 56-60, and 85-90.' } },
        { '@type': 'Question', name: 'Why does a Saturn Return cover a date range?', acceptedAnswer: { '@type': 'Answer', text: 'Saturn can pass the same area more than once because of retrograde motion, so the return is better shown as a window rather than one isolated day.' } },
        { '@type': 'Question', name: 'How should I use Saturn Return dates?', acceptedAnswer: { '@type': 'Answer', text: 'Use the dates as timing context for reflection and planning, then pair them with your full birth chart for more detail. They are not fixed predictions.' } },
      ],
    };
    addUrl(saturnUrl, ['saturn-return-calculator', 'v2', contentHash([saturnBody])]);
    await writeHtmlPage({
      outputPath: path.join(publicDir, 'en', 'saturn-return-calculator', 'index.html'),
      lang: 'en',
      title: saturnTitle,
      description: saturnDescription,
      url: saturnUrl,
      ogType: 'website',
      alternates: buildAlternateLinks('/saturn-return-calculator', { zh: false, en: true }),
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Saturn Return Calculator',
          description: saturnDescription,
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Web',
          url: saturnUrl,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        saturnFaqSchema,
      ],
      ctaText: LANG_CONFIG.en.homeCta,
      spaPath: '/en/saturn-return-calculator',
      contentHtml: mdToHtml(saturnBody),
    });
  }

  // Energy Timeline 公开 SEO demo 页（设计 §13）。与 Saturn Return 同模式：静态 stub 给爬虫读
  // 关键词正文 + WebApplication/FAQPage JSON-LD，inject-spa 水合成 /en/energy-timeline 的真实示例时间轴。
  // EN-only（无 zh 工具页，alternates 不宣告 zh）。正文必须是明文叙事（非纯 SVG 图）以避免 soft 404；
  // 文案严守安全叙事（中性能量强度、loud vs quiet 非好坏、非预测、非医疗），与应用内 onboarding/disclaimer 同框架。
  {
    const timelineUrl = `${siteUrl}/en/energy-timeline`;
    const timelineTitle = 'Energy Timeline - Free Astrology Transit Energy Chart';
    const timelineDescription =
      'See your astrological transit energy day by day as a candlestick timeline. A free, neutral map of your energy rhythm - loud vs quiet, not good vs bad. Not a prediction.';
    const timelineBody = [
      '## Transit energy timeline basics',
      'The Energy Timeline is a free astrology tool that turns your transits - how the moving planets relate to your birth chart - into a day-by-day candlestick chart of energy intensity. Instead of a single horoscope, you see a rhythm: stretches where a lot is moving in your sky, and quieter stretches where things settle. The height of each candle reflects how active the energy is, measured only against your own range, never compared to anyone else.',
      '## Daily candle structure',
      'Each candle summarises one day. The thin line (wick) shows the full range the energy moved across that day; the bar shows where it started and where it ended. We label these start, peak, low, and end - they are an interval summary, not a stock chart open/high/low/close, and they carry no buy/sell or up-is-good meaning. A green bar simply means the energy was higher at the end of the day than the start; red means it eased; grey means it stayed roughly steady.',
      '## Loud versus quiet rhythm',
      'Read height as loud vs quiet, not good vs bad. A tall candle is a day with a lot of astrological movement - it can feel intense whether the theme is flowing or challenging. A flat candle is a calmer, more consolidating stretch. Tap any day to see what is active: how much of the energy leans flowing (ease) versus friction (challenge you can grow with), and which transit is driving it. Most days are a mix of both.',
      '## Not a prediction',
      'No. The Energy Timeline maps tendencies in your transits for self-reflection and timing awareness - it does not predict events, outcomes, or fate, and it is not medical, psychological, or financial advice. Astrology here is a mirror for noticing your own rhythm, in line with a psychology-grounded, empowerment-over-fatalism approach. Use it to plan when you might want to push or rest, not as a forecast of what will happen.',
      '## Timeline demo and next steps',
      'Open the timeline above to explore a sample chart, then create your own from your birth date, time, and city to see your personal energy rhythm for any month. No payment is needed for the monthly view. For a deeper day-by-day reading, pair your timeline with the AstrologyWiki birth chart and transit tools.',
    ].join('\n\n');
    const timelineFaqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'en',
      mainEntity: [
        { '@type': 'Question', name: 'What is an astrology energy timeline?', acceptedAnswer: { '@type': 'Answer', text: 'It is a day-by-day candlestick chart of your transit energy intensity - how active the moving planets are relative to your birth chart. Heights are measured only against your own range, showing a rhythm of busier and quieter stretches rather than a single horoscope.' } },
        { '@type': 'Question', name: 'Are the energy candles like a stock chart?', acceptedAnswer: { '@type': 'Answer', text: 'No. The start, peak, low, and end of each candle are an interval summary of one day energy, not a market open/high/low/close. They carry no buy/sell or up-is-good meaning - the candlestick shape is only a familiar way to show a daily range.' } },
        { '@type': 'Question', name: 'Does a high bar mean a good day?', acceptedAnswer: { '@type': 'Answer', text: 'No. Height means loud vs quiet, not good vs bad. A tall candle is a day with a lot of astrological movement, which can feel intense whether the theme is flowing or challenging. A flat candle is a calmer, consolidating stretch.' } },
        { '@type': 'Question', name: 'Is the Energy Timeline fortune-telling?', acceptedAnswer: { '@type': 'Answer', text: 'No. It maps tendencies in your transits for self-reflection and timing, and does not predict events, outcomes, or fate. It is not medical, psychological, or financial advice.' } },
      ],
    };
    addUrl(timelineUrl, ['energy-timeline', 'v1', contentHash([timelineBody])]);
    await writeHtmlPage({
      outputPath: path.join(publicDir, 'en', 'energy-timeline', 'index.html'),
      lang: 'en',
      title: timelineTitle,
      description: timelineDescription,
      url: timelineUrl,
      ogType: 'website',
      alternates: buildAlternateLinks('/energy-timeline', { zh: false, en: true }),
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Energy Timeline',
          description: timelineDescription,
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Web',
          url: timelineUrl,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        timelineFaqSchema,
      ],
      ctaText: LANG_CONFIG.en.homeCta,
      spaPath: '/en/energy-timeline',
      contentHtml: mdToHtml(timelineBody),
    });
  }

  // 计算器矩阵（D，sign 类）：静态 SEO stub，与 saturn-return / energy-timeline 同模式 —
  // 每个 = 关键词正文（≥4 个 H2，防纯 widget 的 soft-404）+ WebApplication/FAQPage JSON-LD + sitemap。
  // EN-only（无 zh 工具页，alternates 不宣告 zh）；inject-spa 水合成 BirthDataCalculator。文案中性、非命运断言。
  const CALCULATOR_SEO = [
    {
      slug: 'moon-sign-calculator',
      title: 'Moon Sign Calculator - Free & Accurate',
      description: 'Find your Moon sign free. Enter your birth date to discover the sign your Moon was in — the seat of your emotional instincts and inner world.',
      sections: [
        ['Moon placement basics', 'Your Moon sign is the zodiac sign the Moon occupied at the moment you were born. Where the Sun sign reflects your core identity, the Moon sign reflects your emotional instincts, what makes you feel safe, and how you process feelings. In modern psychological astrology it is one of the most personal points in your chart.'],
        ['Finding the Moon placement', 'Enter your birth date in the calculator above. The Moon moves quickly — it changes sign roughly every two and a half days — so a birth time helps when the Moon changed signs on your birthday, but a date alone is enough for most people. No account is required.'],
        ['Emotional meaning in the chart', 'Your Moon sign describes your inner emotional landscape and how you instinctively seek comfort. It points to tendencies and needs, not fixed outcomes — treat it as a mirror for self-reflection rather than a prediction. Pair it with your Sun and rising for a fuller picture.'],
        ['Calculator accuracy and next steps', 'This free tool uses Swiss Ephemeris astronomy for accurate placements. For a deeper reading, explore your full birth chart and the psychological astrology articles in the AstrologyWiki wiki.'],
      ],
      faqs: [
        ['Can I calculate my Moon sign without a birth time?', 'Yes, for most birthdays a date is enough. Add a birth time if the Moon changed signs on your birthday or if you want the most precise result.'],
        ['What if the Moon changed signs on my birthday?', 'Use your birth time and birthplace when possible. If those are missing, treat the result as approximate and compare both possible Moon signs.'],
        ['Is the Moon sign more important than the Sun sign?', 'Neither is more important. The Sun reflects core identity and the Moon reflects emotional life; both are part of your chart.'],
      ],
    },
    {
      slug: 'rising-sign-calculator',
      title: 'Rising Sign (Ascendant) Calculator - Free',
      description: 'Find your rising sign (ascendant) free. Enter your birth date, exact time, and city to discover the sign rising on your eastern horizon at birth.',
      sections: [
        ['Ascendant placement basics', 'Your rising sign, or ascendant, is the zodiac sign that was climbing over the eastern horizon at the exact moment and place you were born. It is often described as the "mask" you meet the world with — your outward style and first impressions — and it sets the layout of the houses in your chart.'],
        ['Birth time sensitivity', 'The ascendant changes roughly every two hours, so an accurate birth time and birth city are essential to calculate it correctly. Without a known time the rising sign cannot be determined reliably, and angle-sensitive placements become approximate.'],
        ['Rising sign meaning in context', 'Your rising sign colours how others first experience you and how you instinctively approach new situations. It describes a tendency and a style, not a destiny. Read it alongside your Sun and Moon for the full "Big Three".'],
        ['Calculator inputs and next steps', 'Enter your birth date, exact time, and city above. This free tool uses Swiss Ephemeris astronomy. Explore the wiki for what each rising sign expresses.'],
      ],
      faqs: [
        ['Can my rising sign change within the same day?', 'Yes. The ascendant changes about every two hours, so people born on the same date can have different rising signs.'],
        ['Why do I need my exact birth time?', 'The ascendant changes about every two hours, so an exact birth time and city are required to calculate it accurately.'],
        ['What if I do not know my birth time?', 'Without a birth time the rising sign cannot be reliably determined. You can still calculate your Sun and Moon signs.'],
      ],
    },
    {
      slug: 'big-three-calculator',
      title: 'Big Three Calculator - Sun, Moon & Rising Signs',
      description: 'Find your Big Three free — your Sun, Moon, and rising signs in one place. Enter your birth date, time, and city for your core astrological trio.',
      sections: [
        ['Core trio at a glance', 'Your "Big Three" are your Sun, Moon, and rising (ascendant) signs — the three placements astrologers reach for first. Together they sketch your identity, your emotional life, and the style others first meet you with.'],
        ['Sun, Moon, and rising roles', 'The Sun is your core identity and will; the Moon is your emotional instincts and needs; the rising is your outward manner and first impressions. Most people are a blend — the three rarely sit in the same sign, which is why a one-line horoscope never quite fits.'],
        ['Required birth details', 'Enter your birth date, exact time, and city above. The Sun and Moon need only the date for most people, but the rising sign requires an accurate birth time and place.'],
        ['Calculator accuracy and next steps', 'This free tool uses Swiss Ephemeris astronomy. These placements describe tendencies, not predictions. Explore the wiki to read what each sign expresses.'],
      ],
      faqs: [
        ['What are the Big Three in astrology?', 'Your Big Three are your Sun, Moon, and rising signs — core identity, emotional life, and outward style.'],
        ['Do I need my birth time for the Big Three?', 'The Sun and Moon usually need only your date, but the rising sign requires an exact birth time and city.'],
        ['Why are my three signs different?', 'The Sun, Moon, and rising move at different speeds, so they usually fall in different signs — that mix is what makes a chart personal.'],
      ],
    },
    {
      slug: 'birth-chart-calculator',
      title: 'Free Birth Chart Calculator - Natal Chart',
      description: 'Free birth chart calculator. Enter your birth date, time, and city to see your natal planetary placements — Swiss Ephemeris accuracy, no sign-up.',
      sections: [
        ['Natal chart foundation', 'A birth chart (or natal chart) is a snapshot of where the Sun, Moon, and planets sat in the sky at the exact moment and place you were born. In modern psychological astrology it is the starting point for reading your personality patterns and developmental themes.'],
        ['Planet and angle inventory', 'Your chart places each planet in a zodiac sign — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, and the outer planets — plus your ascendant and midheaven when a birth time is known. Each placement adds a layer to the picture.'],
        ['First reading path', 'Start with your Sun, Moon, and rising, then look at the personal planets. The chart describes tendencies and potentials to work with, not a fixed fate. It is a tool for self-knowledge, not prediction.'],
        ['Calculator inputs and next steps', 'Enter your birth date above; add an exact time and city for ascendant, midheaven, and houses. This free tool uses Swiss Ephemeris astronomy. Explore the wiki for deeper readings.'],
      ],
      faqs: [
        ['What information does the birth chart calculator show?', 'It shows the major planets by zodiac sign and degree, plus angles and house-sensitive points when a birth time and city are available.'],
        ['Is the birth chart calculator free?', 'Yes. You can calculate your natal placements for free, with no account required.'],
        ['Do I need my birth time?', 'A date gives you most planetary signs. An exact birth time and city are needed for your ascendant, midheaven, and house placements.'],
      ],
    },
    {
      slug: 'current-planets',
      title: 'Current Planets - Where the Planets Are Right Now',
      description: 'See where the planets are right now by sign and degree. A free, live snapshot of the current sky on real Swiss Ephemeris astronomy, no sign-up.',
      sections: [
        ['Live sky position snapshot', 'The current planets are where the Sun, Moon, and planets sit in the zodiac at this moment. This free tool shows each planet by sign and degree, updated for the current day, so you can see the sky as astrologers read it right now.'],
        ['Planet rows and retrograde marks', 'Each row shows a planet, the sign it occupies, and the degree within that sign. Planets marked Rx are retrograde, meaning they appear to move backward from Earth. Sign positions are geocentric, so they are the same wherever you live.'],
        ['Current sky in context', 'The slow outer planets set the broad mood while the faster Moon, Mercury, Venus, and Mars shift the day to day texture. These positions describe the present sky as a tendency to reflect on, not a fixed prediction of events.'],
        ['Date controls and chart pairing', 'Pick any date to see the sky for that day, or leave it on today. This free tool uses Swiss Ephemeris astronomy. To see how the current sky meets your own chart, build your birth chart in the AstrologyWiki calculators.'],
      ],
      faqs: [
        ['Where are the planets right now?', 'This tool shows the current position of each planet by zodiac sign and degree, computed for today on real Swiss Ephemeris astronomy.'],
        ['What does Rx mean?', 'Rx marks a planet that is retrograde, appearing to move backward from Earth. It is an optical effect of orbital motion, not a planet actually reversing.'],
        ['Do current planet positions depend on my location?', 'No. Planetary sign positions are geocentric, so they are the same everywhere. Only the ascendant and houses depend on your location and time.'],
      ],
    },
    {
      slug: 'moon-phase-calculator',
      title: 'Moon Phase Calculator - Phase for Any Date',
      description: 'Find the Moon phase for any date, from new and full to quarter, crescent, and gibbous, with illumination percent and the Moon sign. Free, accurate astronomy.',
      sections: [
        ['Lunar phase basics', 'A moon phase is the shape of the lit part of the Moon as seen from Earth, set by the angle between the Sun and Moon. The cycle runs from new Moon through waxing crescent, first quarter, waxing gibbous, full Moon, and back through the waning phases over about 29.5 days.'],
        ['Phase calculation method', 'This calculator measures the angular distance between the Sun and Moon for the date you choose, then maps it to one of the eight phases and an illumination percentage. The numbers come from Swiss Ephemeris astronomy, so they match what you see in the sky.'],
        ['Phase and Moon sign together', 'Alongside the phase, the tool shows the zodiac sign and degree the Moon occupies that day. The phase describes the light; the sign describes the Moon position in the zodiac. Together they give a fuller picture of the lunar day.'],
        ['Date lookup and next steps', 'Pick any date to see its phase, illumination, and Moon sign, past, present, or future. The phase is a description of the sky, not a forecast. For your personal Moon, try the Moon sign calculator.'],
      ],
      faqs: [
        ['What moon phase is it today?', 'Leave the date on today and the calculator shows the current phase, illumination percent, and the Moon sign on real astronomy.'],
        ['What are the eight moon phases?', 'New Moon, waxing crescent, first quarter, waxing gibbous, full Moon, waning gibbous, last quarter, and waning crescent. The cycle repeats about every 29.5 days.'],
        ['What does illumination percent mean?', 'It is the share of the visible Moon disc that is lit by the Sun, from zero at new Moon to fifty percent at the quarters and one hundred at full Moon.'],
      ],
    },
    {
      slug: 'moon-phase-today',
      title: 'Moon Phase Today – What Moon Phase Is It Right Now? | AstrologyWiki',
      heading: 'What Moon Phase Is It Today?',
      description: "See today's exact moon phase and illumination percentage, updated daily. Plus a quick guide to all 8 moon phases.",
      includeFaqInBody: true,
      breadcrumbs: [
        { name: 'Home', url: `${siteUrl}/en/` },
        { name: 'Tools', url: `${siteUrl}/en/tools` },
        { name: 'Moon Phase', url: `${siteUrl}/en/moon-phase-calculator` },
        { name: 'Today', url: `${siteUrl}/en/moon-phase-today` },
      ],
      sections: [
        ["Why the Moon's Phase Changes Every Day", "The Moon's phase changes because the Sun-Moon angle changes as the Moon orbits Earth. Each day the lit shape shifts a little, moving through a 29.5-day lunar cycle. The live tool computes today's phase and illumination from that angle rather than using fixed calendar text."],
        ['The 8 Moon Phases at a Glance', 'The cycle moves through New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Last Quarter, and Waning Crescent. The page highlights where today sits in that sequence, while the illumination percentage shows how much of the visible Moon is sunlit.'],
        ['Need a Different Date Instead of Today?', 'This page is focused on right now. To look up a birthday, a past date, or a future date, use the [moon phase calculator](/en/moon-phase-calculator) to [check a different date](/en/moon-phase-calculator). If you want the personal Moon you were born under, start with [your birth chart](/en/birth-chart-calculator) and compare the phase with your [natal moon sign](/en/birth-chart-calculator).'],
      ],
      faqs: [
        ['What moon phase is it today?', "Today's live moon phase, illumination percentage, and the approximate timing of the next full Moon and new Moon are shown in the result area above. The value is calculated dynamically, not written as a fixed answer."],
        ["How often does the moon's phase change?", "The Moon's phase changes continuously as the Sun-Moon angle shifts. The named phases are milestones in a full lunar cycle of about 29.5 days."],
        ["What's the difference between this page and the Moon Phase Calculator?", 'This page defaults to today and keeps the focus on the current sky. The Moon Phase Calculator lets you choose a different date in the past or future.'],
        ['Where can I check the moon phase for a different date?', 'Use the [moon phase calculator](/en/moon-phase-calculator) when you need a specific date instead of today.'],
      ],
    },
    {
      slug: 'ephemeris-calculator',
      title: 'Ephemeris Calculator - Daily Planet Positions',
      description: 'Generate a free ephemeris table of planet positions across any date range, with sign, degree, and retrograde for each day. Swiss Ephemeris accuracy, no sign-up.',
      sections: [
        ['Ephemeris table basics', 'An ephemeris is a table that lists where each planet sits in the zodiac on a series of dates. Astronomers and astrologers have used ephemerides for centuries to track when planets change sign, turn retrograde, or form aspects. This free tool builds one for any range you choose.'],
        ['Range and interval controls', 'Choose a start date, an end date, and an interval of daily, weekly, or monthly. The table then shows every major planet by sign and degree for each step, with a small R marking retrograde motion. Positions are computed for 00:00 UTC of each date.'],
        ['Sign changes and retrogrades', 'Scanning down a column shows when a planet moves from one sign to the next or slows to a retrograde station. These shifts are the backbone of transit work. The table reports astronomy as fact and does not predict outcomes.'],
        ['Ephemeris accuracy and limits', 'Positions use Swiss Ephemeris, the same engine professional software relies on. Very large ranges are capped to keep the table readable, so narrow the dates or widen the interval to cover a longer span. For your own chart, use the birth chart calculator.'],
      ],
      faqs: [
        ['What is an ephemeris used for?', 'An ephemeris tracks planet positions over time, so you can see when planets change sign, turn retrograde, or form aspects, which is the basis of transit astrology.'],
        ['Can I generate an ephemeris for any year?', 'Yes, within a broad range. Pick a start and end date; very long spans are capped for readability, so use a weekly or monthly interval to cover more time.'],
        ['Are the positions accurate?', 'Yes. The table uses Swiss Ephemeris astronomy, the same high-precision engine used by professional astrology software.'],
      ],
    },
    {
      slug: 'electional-astrology',
      title: 'Electional Astrology - Sky Timing for the Days Ahead',
      description: 'See a free day-by-day view of the sky ahead: Moon phase, Moon sign, and the balance of supportive versus challenging aspects, as a timing reference for your own planning. Not a prediction.',
      sections: [
        ['Timing context, not certainty', 'Electional astrology looks at the conditions of the sky over a span of days as context for planning. This free tool reads the Moon phase, the Moon sign, and the balance of supportive and challenging aspects for each upcoming day. It describes astronomy, not destiny, and never points to a single right day.'],
        ['Daily timing view', 'Pick a start date and how many days to view. For each day the tool computes the Moon phase from the Sun and Moon, the sign the Moon occupies, and the count of harmonious and challenging aspects among the classical planets. A neutral tone label of Flowing, Mixed, or Dynamic summarises that balance.'],
        ['Day tone labels', 'Flowing means the sky holds more supportive aspects that day, Dynamic means more tension, and Mixed means the two are roughly even. The label only describes the aspect balance. It is not a verdict on whether a day will go well or badly, and what happens depends on you rather than on the sky.'],
        ['Planning with sky rhythm', 'There is no rule that any sky tone suits any task; this tool simply gives you background context alongside your own plans and priorities, never an instruction. Treat it as rhythm to notice, not direction to follow. To see how these movements touch your own chart, build your birth chart.'],
      ],
      faqs: [
        ['Does electional astrology predict the future?', 'No. This tool describes the astronomical conditions of upcoming days as a reflection for planning. It does not predict outcomes or guarantee results.'],
        ['What does the day tone mean?', 'The tone summarises how many supportive versus challenging aspects the sky holds that day: Flowing for more supportive, Dynamic for more tension, and Mixed for a rough balance. It is not a good or bad rating.'],
        ['How many days can I view?', 'You can view seven, fourteen, or thirty days from your chosen start date, using Swiss Ephemeris astronomy for each day.'],
      ],
    },
    {
      slug: 'rodden-rating',
      title: 'Rodden Rating - Birth Time Accuracy Calculator',
      description: 'Find out how reliable your birth time is with the Rodden Rating system. See whether your Ascendant, houses, and Moon can be trusted, free and with no sign-up.',
      sections: [
        ['Rodden Rating scale', 'The Rodden Rating is a system created by data astrologer Lois Rodden to record how trustworthy the source of a birth time is. AA means an official birth record, A means the person or family supplied it, B means a biography, C means there is no source so caution is needed, DD means sources conflict, and X means the time is unknown. It rates the data source, not whether a chart is good or bad.'],
        ['Fast-moving angles and houses', 'The Ascendant and the house cusps move quickly, about one degree every four minutes, so a rounded or missing time leaves them approximate. Planet signs and usually the Moon sign do not depend on an exact minute, so they stay reliable even when the time is rough. Knowing your rating tells you which parts of the chart to lean on.'],
        ['Source selection workflow', 'Choose how you know your birth time, from a hospital record down to unknown. The tool shows the matching Rodden code, a confidence level, and a simple breakdown of whether your Ascendant, houses, and Moon to the degree can be trusted, with a short note on what to do at that level.'],
        ['Low-rating next steps', 'A low or unknown rating does not make a chart useless. Planet signs still describe a great deal. For full house detail you can search for an original record, or ask an astrologer to attempt birth time rectification. A noon or solar chart is a common stand-in when the time is unknown.'],
      ],
      faqs: [
        ['Does a low Rodden Rating mean my chart is wrong?', 'No. It only means the birth time source is less certain, so the Ascendant and houses are approximate. Planet signs and usually the Moon sign remain reliable.'],
        ['What is the best Rodden Rating?', 'AA is the most reliable, meaning the time comes from an official birth record. A from the person or family is also strong.'],
        ['Can I use astrology without a birth time?', 'Yes. A noon or solar chart still gives reliable planet signs and many aspects; only the Ascendant, houses, and exact Moon need caution.'],
      ],
    },
    {
      slug: 'synastry-calculator',
      title: 'Synastry Calculator - Free Relationship Compatibility',
      description: 'Free synastry calculator. Compare two birth charts to see the aspects between them, from Sun and Moon to Venus and Mars. Real astronomy, no sign-up.',
      sections: [
        ['Chart comparison lens', 'Synastry is the branch of astrology that compares two birth charts to study the connections between them. By measuring the aspects, the angles, between the planets of one chart and the planets of the other, it maps where two people meet with ease and where they meet friction.'],
        ['Two-chart calculation flow', 'Enter the birth date and city for two people, and a birth time if you have it to sharpen the Moon and the chart angles. The tool builds both charts on Swiss Ephemeris astronomy, then finds the major aspects between the two sets of planets, sorted by how exact each one is.'],
        ['Cross-chart aspect patterns', 'Trines and sextiles tend to describe flow and ease; squares and oppositions describe tension that can drive growth; conjunctions blend two energies together. The mix is a portrait of a connection, not a score and not a verdict on whether a relationship will last.'],
        ['Synastry and privacy', 'This is a free tool with no account required. The names you enter stay in your browser and are never sent anywhere, only the birth dates and cities are used to compute the charts. For a deeper written reading, explore the synastry articles in the AstrologyWiki wiki.'],
      ],
      faqs: [
        ['What is a synastry chart?', 'A synastry chart compares two birth charts to show the aspects between them, the angular connections between one set of planets and the other.'],
        ['Do I need birth times for synastry?', 'A date and city are enough for the planetary aspects. A birth time sharpens the Moon and the chart angles, making the comparison more precise.'],
        ['Is the synastry calculator free?', 'Yes. You can compare two charts for free with no account, and the names you enter never leave your device.'],
      ],
    },
    {
      slug: 'composite-calculator',
      title: 'Composite Chart Calculator - Free Relationship Chart',
      description: 'Free composite chart calculator. Merge two birth charts into one midpoint chart that represents the relationship itself. Real astronomy, no sign-up.',
      sections: [
        ['Midpoint relationship chart', 'A composite chart is a single chart built from the midpoints between the planets of two birth charts. Where synastry compares two separate charts, a composite merges them into one symbolic chart that represents the relationship itself, treated as a third entity.'],
        ['Composite calculation flow', 'Enter the birth date and city for two people, and a birth time if you have it. The tool builds both charts on Swiss Ephemeris astronomy, then places each composite planet at the midpoint of the two original positions and shows the sign and degree for each.'],
        ['Partnership chart reading', 'Read the composite Sun, Moon, and planets the way you would read a birth chart, but as a portrait of the partnership rather than a person. It describes the character and themes of a connection, not a forecast of whether it will last.'],
        ['Composite and synastry roles', 'Synastry studies the aspects between two charts; the composite condenses both into one relationship chart. Many astrologers use them together. For the aspect view, try the synastry calculator, and see the AstrologyWiki wiki for a deeper written guide.'],
      ],
      faqs: [
        ['What does this calculator output?', 'It outputs a midpoint chart for the relationship, listing composite planet positions by sign and degree when both source charts have the needed placements.'],
        ['How is a composite chart different from synastry?', 'Synastry compares the aspects between two separate charts; a composite merges them into one chart that symbolises the partnership.'],
        ['Do I need birth times for a composite chart?', 'A date and city give you the planetary midpoints. A birth time sharpens the Moon and is needed for the composite angles.'],
      ],
    },
    {
      slug: 'solar-return-calculator',
      title: 'Solar Return Calculator - Free Birthday Chart',
      description: 'Free solar return calculator. Find the exact moment the Sun returns to its birth position each year and see your birthday chart. Real astronomy, no sign-up.',
      sections: [
        ['Annual solar return moment', 'A solar return is the moment each year when the transiting Sun returns to the exact zodiac position it held at your birth. It usually falls on or within a day of your birthday. The chart cast for that moment is your solar return chart, traditionally read as the themes of the year ahead.'],
        ['Return calculation flow', 'Enter your birth date, time, and city, then choose a year. The tool finds your natal Sun position on Swiss Ephemeris astronomy, solves for the exact instant the Sun returns to it that year, and shows the planetary placements at that moment.'],
        ['Birth time precision', 'The Sun moves about one degree per day, so a precise birth time pins the natal Sun more exactly and sharpens the return moment. Without a time the return is computed from a midday estimate and is approximate.'],
        ['Annual chart reading context', 'Read the solar return placements as a portrait of the year, the way you would read a birth chart for a person. It describes themes and emphases to reflect on, not fixed events. Pair it with your natal chart for context.'],
      ],
      faqs: [
        ['What is a solar return chart?', 'It is the chart cast for the exact moment the Sun returns to its natal position each year, traditionally read as the themes of the coming year.'],
        ['Is the solar return on my birthday?', 'It falls on or within about a day of your birthday, because the calendar and the solar year do not match exactly.'],
        ['Do I need my birth time for a solar return?', 'A birth time makes the return moment more precise. Without it the chart is computed from a midday estimate and is approximate.'],
      ],
    },
    {
      slug: 'celebrity-twins',
      title: 'Celebrity Astro Twins - Which Famous People Share Your Sun Sign',
      description: 'Find out which famous figures share your Sun sign. Enter your birth month and day to see your celebrity astro twins, grouped by zodiac sign and element. Free, no sign-up.',
      sections: [
        ['Shared Sun-sign reference', 'Celebrity astro twins are well known people who share your Sun sign, the zodiac sign the Sun was passing through on the day you were born. Because the Sun sign depends only on the date, you can find your matches from a birthday alone. This free tool lines you up with famous figures across the arts, science, sport and history who were born under the same sign.'],
        ['Celebrity matching method', 'Choose your birth month and day. The tool reads the tropical Sun sign for that date and lists famous people who share it, drawn from a curated set of public birth dates. It also groups figures who share your element, so you can see the wider family of signs that carry a similar temperament. No birth time and no account are needed.'],
        ['Sun signs, elements and modalities', 'Every Sun sign belongs to one of four elements, fire, earth, air or water, and to one of three modalities, cardinal, fixed or mutable. These groupings describe a broad style rather than fixed traits. Sharing a sign or an element with someone is a point of common flavour, not a rule about character or destiny.'],
        ['Cusp boundaries and birth time', 'The date when the Sun moves from one sign to the next drifts by about a day from year to year. If your birthday sits right on a boundary, your Sun could be in the neighbouring sign, and only a full birth chart with your birth time can settle it. For most dates the Sun sign read from the date is reliable. To check, build your full chart with the birth chart calculator.'],
      ],
      faqs: [
        ['Can I find my celebrity twins without a birth time?', 'Yes. Your Sun sign depends only on your birth date, so the month and day are enough to match you with famous people who share it. A birth time is only needed near a sign boundary or for the rest of the chart.'],
        ['How are the celebrity birth dates chosen?', 'The figures are drawn from widely documented public birth dates, and each one is placed at a date that sits clearly within a single sign, so the match does not depend on a birth time.'],
        ['Does sharing a Sun sign mean we are alike?', 'Not on its own. A shared Sun sign is one point in common out of a whole chart. It is a fun starting point, not a verdict on personality or compatibility.'],
      ],
    },
    {
      slug: 'astrocartography',
      title: 'Astrocartography Map - Free Relocation Astrology Lines',
      description: 'Free astrocartography map. See where each planet was rising, setting, culminating or at the lower meridian when you were born, drawn across a world map. Real Swiss Ephemeris astronomy, no sign-up.',
      sections: [
        ['Relocation map lens', 'Astrocartography, also called relocation astrology, projects the sky at the moment of your birth onto a map of the world. For each planet it draws the places where that planet was angular at your birth: on the meridian overhead or below, and on the eastern or western horizon. It is a way to explore yourself through place rather than a forecast of any location.'],
        ['Map calculation flow', 'Enter your birth date, exact birth time, and city. The tool builds your chart on Swiss Ephemeris astronomy, converts each planet to its sky coordinates, and computes four lines per planet across the globe. A birth time is essential here, because the lines shift by about fifteen degrees of longitude for every hour of birth time.'],
        ['Planetary angle lines', 'Each planet draws four lines. The MC line is the meridian where the planet was culminating, highest in the sky; the IC line is its opposite, the lower meridian. The AC line is the curve where the planet was rising on the eastern horizon, and the DC line is where it was setting in the west. Show or hide each planet to keep the map readable.'],
        ['Map interpretation boundaries', 'A line passing near a place simply marks where one planetary theme from your own chart is emphasised. It is a prompt for reflection and curiosity, not a prediction that anything will happen there and not a guarantee of any outcome. Treat it as one lens among many, and pair it with your full birth chart for context.'],
      ],
      faqs: [
        ['Does astrocartography predict what will happen if I move?', 'No. The lines describe where each planet was angular at your birth. They are a reflective tool for exploring places, not a forecast of events and not a guarantee of any outcome.'],
        ['Why do I need an exact birth time?', 'The angle lines depend on the precise moment of birth and shift about fifteen degrees of longitude per hour. Without an accurate time the map cannot be placed correctly.'],
        ['What do the MC, IC, AC and DC lines mean?', 'MC is where a planet was culminating overhead, IC is the lower meridian opposite it, AC is where it was rising in the east, and DC is where it was setting in the west.'],
      ],
    },
    {
      slug: 'astrocartography-map-generator',
      title: 'Astrocartography Map Generator – Free Relocation Astrology Tool | AstrologyWiki',
      heading: 'Astrocartography Map Generator',
      description: 'Generate your personal astrocartography map free. Enter your birth date, time, and location to see which planetary lines run through any place on Earth.',
      includeFaqInBody: true,
      breadcrumbs: [
        { name: 'Home', url: `${siteUrl}/en/` },
        { name: 'Tools', url: `${siteUrl}/en/tools` },
        { name: 'Astrocartography', url: `${siteUrl}/en/astrocartography` },
        { name: 'Map Generator', url: `${siteUrl}/en/astrocartography-map-generator` },
      ],
      sections: [
        ['What Your Astrocartography Map Shows', 'Your generated map projects your birth chart onto the world. It marks the places where each planet was rising, setting, culminating, or sitting at the lower meridian at your birth. If you want the background before using the map, start with the [full astrocartography guide](/en/astrocartography).'],
        ['The Four Line Types, Briefly', 'AC lines show where a planet was rising, DC lines show where it was setting, MC lines show where it was highest in the sky, and IC lines show the opposite lower meridian. These line types are the foundation for [how to interpret your astrocartography lines](/en/astrocartography).'],
        ['What Each Planet Represents on Your Map', 'Each planet points to a different chart theme: the Sun to identity and visibility, the Moon to belonging and emotional rhythm, Venus to ease and attraction, Mars to drive, Jupiter to growth, Saturn to structure, and the outer planets to slower collective themes. For context, generate an [accurate birth chart](/en/birth-chart-calculator) before treating any single line as the whole story.'],
        ['Astrocartography Map Generator vs. the Full Astrocartography Guide', 'The generator gives you the interactive map and lets you inspect which lines run near a place. The [full astrocartography guide](/en/astrocartography) explains how astrocartography works in more depth and helps you compare planets and line types. If you are looking at a particular year rather than relocation themes, pair the map with your [solar return calculator](/en/solar-return-calculator) for your solar return year.'],
      ],
      faqs: [
        ['Is this astrocartography map generator free?', 'Yes. You can generate the map for free using your birth date, exact birth time, and birthplace.'],
        ['Do I need my exact birth time to generate an accurate map?', 'Yes. Astrocartography lines are angle-based and shift quickly with birth time. An inaccurate or missing time can move lines far enough to change the map meaning.'],
        ["What's the difference between this tool and the main Astrocartography page?", 'This page is a focused map-generation entry point. The main astrocartography page includes the broader guide to how astrocartography works and how to read the map in context.'],
        ['Can I download or share my generated map?', 'A built-in download or share action is not currently available. The map is generated for the current browser session, so use a personal screenshot if you need a quick reference.'],
      ],
    },
  ];
  for (const calc of CALCULATOR_SEO) {
    const calcUrl = `${siteUrl}/en/${calc.slug}`;
    const sectionBody = calc.sections.map((s) => `## ${s[0]}\n\n${s[1]}`).join('\n\n');
    const faqBody = calc.includeFaqInBody
      ? `## Frequently Asked Questions\n\n${calc.faqs.map((f) => `### ${f[0]}\n\n${f[1]}`).join('\n\n')}`
      : '';
    const calcBody = [sectionBody, faqBody].filter(Boolean).join('\n\n');
    addUrl(calcUrl, ['calculator', calc.slug, 'v1', contentHash([calcBody])]);
    await writeHtmlPage({
      outputPath: path.join(publicDir, 'en', calc.slug, 'index.html'),
      lang: 'en',
      title: calc.title,
      heading: calc.heading,
      description: calc.description,
      url: calcUrl,
      ogType: 'website',
      alternates: buildAlternateLinks(`/${calc.slug}`, { zh: false, en: true }),
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: calc.title,
          description: calc.description,
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Web',
          url: calcUrl,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: 'en',
          mainEntity: calc.faqs.map((f) => ({
            '@type': 'Question',
            name: f[0],
            acceptedAnswer: { '@type': 'Answer', text: f[1] },
          })),
        },
        ...(calc.breadcrumbs ? [buildBreadcrumb('en', calc.breadcrumbs)] : []),
      ],
      ctaText: LANG_CONFIG.en.homeCta,
      spaPath: `/en/${calc.slug}`,
      contentHtml: mdToHtml(calcBody),
    });
  }

  // Tools hub (/en/tools) — 计算器矩阵统一发现入口（hub-and-spoke 内链中枢）。静态正文按主题分组，
  // 列出到每个工具的可索引内链，把链接权重分发给 15 个 spoke 页。工具标题/描述复用 CALCULATOR_SEO，
  // 仅分类、引导文案与 energy-timeline 条目在此内联。EN-only（与计算器 stub 一致）。
  {
    const calcBySlug = new Map(CALCULATOR_SEO.map((c) => [c.slug, c]));
    const HUB_EXTRA = {
      'energy-timeline': {
        title: 'Energy Timeline',
        description: 'View a month-by-month curve of how active your transits are, with the themes behind each peak.',
      },
      'saturn-return-calculator': {
        title: 'Saturn Return Calculator',
        description: 'Find when Saturn returns to its birth position — the timing of a major life-cycle chapter.',
      },
    };
    const hubMeta = (slug) => {
      const m = calcBySlug.get(slug) || HUB_EXTRA[slug];
      if (!m) throw new Error(`tools hub: no metadata for slug ${slug} (add to CALCULATOR_SEO or HUB_EXTRA)`);
      return m;
    };
    const hubLabel = (slug) => {
      const m = hubMeta(slug);
      return m ? String(m.title).split(' - ')[0].split(' (')[0] : slug;
    };
    const HUB_CATEGORIES = [
      {
        heading: 'Core chart placements',
        intro: 'The placements most readings start from: Sun, Moon, rising sign, and the full natal chart context around them.',
        slugs: ['birth-chart-calculator', 'big-three-calculator', 'moon-sign-calculator', 'rising-sign-calculator'],
      },
      {
        heading: 'Charts and sky data',
        intro: 'Planetary positions, moon phases, ephemeris tables, and source-quality checks powered by Swiss Ephemeris.',
        slugs: ['current-planets', 'ephemeris-calculator', 'moon-phase-calculator', 'rodden-rating'],
      },
      {
        heading: 'Timing and cycles',
        intro: 'Explore transits, returns, and day-by-day sky patterns as timing language rather than fixed outcomes.',
        slugs: ['energy-timeline', 'electional-astrology', 'solar-return-calculator', 'saturn-return-calculator'],
      },
      {
        heading: 'Relationship charts',
        intro: 'Compare two charts and examine attraction, friction, support, and the shared pattern between them.',
        slugs: ['synastry-calculator', 'composite-calculator'],
      },
      {
        heading: 'Place and discovery',
        intro: 'Use maps and reference datasets to place chart symbolism in a wider world context.',
        slugs: ['astrocartography', 'celebrity-twins'],
      },
    ];
    const toolsHubIntro = 'A focused set of free astrology calculators and chart tools for birth charts, current planets, timing cycles, relationship charts, and place-based exploration. Powered by Swiss Ephemeris astronomy.';
    const toolsHubBody = [
      toolsHubIntro,
      ...HUB_CATEGORIES.map((cat) => {
        const items = cat.slugs
          .map((slug) => {
            const m = hubMeta(slug);
            const desc = m ? stripInlineMarkdown(m.description) : '';
            return `- [${hubLabel(slug)}](/en/${slug})${desc ? ` — ${desc}` : ''}`;
          })
          .join('\n');
        return `## ${cat.heading}\n\n${cat.intro}\n\n${items}`;
      }),
    ].join('\n\n');
    const toolsHubFaqs = [
      ['Are these astrology tools free?', 'Yes. Every calculator and chart tool here is free to use, and no account is required.'],
      ['Do I need my exact birth time?', 'Some tools such as the rising sign, birth chart, astrocartography and solar return need an accurate birth time and city. Others such as the Moon sign, current planets and moon phase work from a date alone.'],
      ['How accurate are the calculations?', 'All placements are computed with Swiss Ephemeris astronomy, the same data professional astrology software relies on.'],
    ];
    const toolsHubTitle = 'Free Astrology Tools & Calculators';
    const toolsHubDescription = 'A focused set of free astrology calculators — birth chart, Moon and rising signs, synastry, astrocartography, solar return and more. Powered by Swiss Ephemeris.';
    const toolsHubUrl = `${siteUrl}/en/tools`;
    const hubAllSlugs = HUB_CATEGORIES.flatMap((c) => c.slugs);
    addUrl(toolsHubUrl, ['tools-hub', 'v1', contentHash([toolsHubBody])]);
    await writeHtmlPage({
      outputPath: path.join(publicDir, 'en', 'tools', 'index.html'),
      lang: 'en',
      title: toolsHubTitle,
      description: toolsHubDescription,
      url: toolsHubUrl,
      ogType: 'website',
      alternates: buildAlternateLinks('/tools', { zh: false, en: true }),
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: toolsHubTitle,
          description: toolsHubDescription,
          url: toolsHubUrl,
          inLanguage: 'en',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: hubAllSlugs.map((slug, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${siteUrl}/en/${slug}`,
              name: hubLabel(slug),
            })),
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: 'en',
          mainEntity: toolsHubFaqs.map((f) => ({
            '@type': 'Question',
            name: f[0],
            acceptedAnswer: { '@type': 'Answer', text: f[1] },
          })),
        },
      ],
      ctaText: LANG_CONFIG.en.homeCta,
      spaPath: '/en/tools',
      contentHtml: mdToHtml(toolsHubBody),
    });
  }

  // 文章摘要按 lang/slug 索引，供 sitemap 签名（date/title/desc/image/keywords 变 → lastmod 更新）。
  const articleSummaries = {
    en: new Map(articlesModule.getArticleSummaries('en').map((s) => [s.slug, s])),
    zh: new Map(articlesModule.getArticleSummaries('zh').map((s) => [s.slug, s])),
  };
  const articleSig = (lang, slug) => {
    const s = articleSummaries[lang].get(slug);
    return s
      ? [
          'article',
          lang,
          slug,
          s.date || '',
          s.title || '',
          s.seoTitle || '',
          s.description || '',
          s.seoDescription || '',
          s.image || '',
          ...(s.keywords || []),
        ]
      : ['article', lang, slug];
  };

  // FAQPage schema for article stubs — mirrors WikiArticleDetailPage.faqSchema so the
  // crawled static stub gets FAQ structured data (the SPA emits its own after hydration;
  // identical @id/content keeps them mergeable). Returns null when <2 Q&A are present.
  const buildArticleFaqSchema = (article, url) => {
    if (!article?.content) return null;
    const faqs = [];
    let inFaq = false;
    let cur = null;
    const flush = () => {
      if (cur && cur.a.trim()) faqs.push({ q: cur.q, a: cur.a.trim() });
      cur = null;
    };
    for (const raw of article.content.split('\n')) {
      const line = raw.trim();
      const h2 = line.match(/^##\s+(.+)/);
      if (h2) {
        flush();
        inFaq = /\bfaqs?\b|\bquestions?\b|\bq\s*&\s*a\b|问题|问答|常问|疑问|問題|問答|常問|疑問/i.test(h2[1]);
        continue;
      }
      if (!inFaq) continue;
      const q = line.match(/^\*\*(.+?)\*\*$/);
      if (q && /[?？]/.test(q[1])) {
        flush();
        cur = { q: q[1].trim(), a: '' };
        continue;
      }
      if (cur && line) cur.a += (cur.a ? ' ' : '') + line;
    }
    flush();
    if (faqs.length < 2) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
  };

  // Featured articles: generate static HTML with full body so crawlers read the
  // article (data/articles/<slug>.ts, rendered via WikiArticleDetailPage in the
  // SPA) instead of the generic /index.html shell. Without this the sitemap URLs
  // resolve to the SPA shell → soft 404. Body comes from article.content (Markdown).
  const writeArticle = async (slug, lang) => {
    const url = `${siteUrl}/${lang}/wiki/${slug}`;
    const article = articlesModule.getArticleBySlug(slug, lang);
    const contentMd = article?.content || '';
    // T7：article.seo.sitemap === false（如 noindex 桥页/转化实验页）时排除出 sitemap。
    // 缺省（无 seo / 无内容兜底）一律收录，保持既有行为。正文签名纳入 lastmod。
    if (includeInSitemap(article?.seo)) {
      addUrl(url, [...articleSig(lang, slug), contentHash([contentMd])]);
    }
    if (!article || !contentMd) return; // 无该语言内容则只留 sitemap URL（保持既有行为），不写空壳静态页。
    const config = LANG_CONFIG[lang];
    const wikiPath = `/${lang}/wiki`;
    const ogImage = articleOgImage(slug, lang);
    // T6：解析正文 FAQ 段注入 FAQPage JSON-LD（爬虫读静态 stub head）。解析逻辑与
    // WikiArticleDetailPage 的 SPA 内联解析镜像，stub 与水合后页面发出同一份 FAQPage。
    const faqSchema = buildFaqSchemaFromMarkdown(contentMd);
    await writeHtmlPage({
      outputPath: path.join(publicDir, lang, 'wiki', slug, 'index.html'),
      lang,
      title: article.seoTitle || article.title,
      heading: article.title,
      description: article.description || config.wikiDescription,
      metaDescription: article.seoDescription || article.description || config.wikiDescription,
      url,
      // canonical 收口：article.seo.canonicalPath 指向 winner 长文时，静态 stub 的 <link canonical>
      // 也发出该 URL（与 sitemap 排除 + 运行时 WikiArticleDetailPage 保持一致，消除 stub 自指 vs
      // 运行时收口的混合信号）；无 override 时 resolveCanonicalUrl 回退自指 url，其余文章零变化。
      canonical: resolveCanonicalUrl({ seo: article.seo, lang, selfUrl: url, siteUrl }),
      ogType: 'article',
      ogImage,
      // T7：noindex,follow 等 robots override 透传到 stub head（buildHead 缺省 index,follow）。
      robots: article.seo?.robots,
      // T7：seo.alternates === false 显式抑制 hreflang（无有效跨语对应页的自指/实验页）。
      alternates: article.seo?.alternates === false
        ? []
        : buildAlternateLinks(`/wiki/${slug}`, {
            en: !!articlesModule.getArticleBySlug(slug, 'en'),
            zh: !!articlesModule.getArticleBySlug(slug, 'zh'),
          }),
      schema: [
        buildArticleSchema(lang, article, url, editorialOrgSchema, ogImage),
        buildBreadcrumb(lang, [
          { name: config.breadcrumbHome, url: langHomeUrl(lang) },
          { name: config.breadcrumbWiki, url: `${siteUrl}${wikiPath}` },
          { name: article.title, url },
        ]),
        // FAQPage：用 main 的 faq-jsonld 解析（buildFaqSchemaFromMarkdown）；不再叠加
        // 内容线的 buildArticleFaqSchema，避免同页双 FAQPage（GSC 重复字段根因）。
        ...(faqSchema ? [faqSchema] : []),
      ],
      ctaText: config.wikiCta,
      // article.image → 静态 stub 的 hero 图（爬虫/图片索引可见，带 alt）。
      heroImage: article.image,
      heroAlt: article.image_alt,
      // footer CTA 指向 wiki hub，而非文章自身 → 消除静态 stub 里的自链接（SEO）。
      spaPath: `/${lang}/wiki`,
      // 去掉正文首个 H1（buildBody 已用 <h1>{title}</h1> 渲染）避免双 H1；
      // T9：psych-adjacent 文章正文末尾追加强制安全 footer（与 SPA <SafetyFooter> 同源）。
      contentHtml:
        mdToHtml(contentMd.replace(/^#\s+[^\n]*\r?\n+/, '')) +
        (article.psychAdjacent ? buildSafetyFooterHtml(lang) : ''),
    });
  };

  for (const slug of ARTICLE_SLUGS) {
    await writeArticle(slug, 'en');
    await writeArticle(slug, 'zh');
  }
  // EN-only featured articles (no ZH variant — emit /en/wiki/ only)
  for (const slug of ARTICLE_SLUGS_EN_ONLY) {
    await writeArticle(slug, 'en');
  }

  // L2 cutover (2026-05-19): root is now the canonical home (renders
  // LandingPageV2). Include "/" with priority 1.0 so Google treats it as
  // the primary home URL ahead of /en/, /zh/, and /landing-v2/{en,zh}/.
  const ROOT_URL = `${siteUrl}/`;
  // root 渲染 LandingPageV2（EN home）；签名跟随 landing EN 文案。
  addUrl(ROOT_URL, ['root', contentHash([landingHtmlByLang.en])]);

  const sitemapEntries = Array.from(urlSignatures.keys()).sort();
  const landingV2Set = new Set(LANDING_V2_URLS);

  // T1: 解析每个 URL 的 lastmod。签名(hash)未变则保留旧 lastmod；首跑用旧 sitemap 日期作种子，
  // 文章则用其 date 字段（比污染过的旧 sitemap 更真实）。只有内容真正变更才写 today。
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const priorSitemapXml = fs.existsSync(sitemapPath)
    ? await fsPromises.readFile(sitemapPath, 'utf8')
    : '';
  const priorLastmods = parseSitemapLastmods(priorSitemapXml);
  for (const lang of ['en', 'zh']) {
    for (const [slug, summary] of articleSummaries[lang]) {
      if (summary.date) priorLastmods.set(`${siteUrl}/${lang}/wiki/${slug}`, summary.date);
    }
  }
  const prevManifest = fs.existsSync(lastmodManifestPath)
    ? JSON.parse(await fsPromises.readFile(lastmodManifestPath, 'utf8'))
    : {};
  const signatures = new Map(
    sitemapEntries.map((url) => [url, contentHash(urlSignatures.get(url) || [url])]),
  );
  const { lastmodByUrl, manifest } = resolveLastmods(signatures, prevManifest, priorLastmods, today);

  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries.map((loc) => {
      const isRoot = loc === ROOT_URL;
      const isLandingV2 = landingV2Set.has(loc);
      const lines = [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmodByUrl.get(loc) || today}</lastmod>`,
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

  await fsPromises.writeFile(sitemapPath, sitemapXml, 'utf8');

  // manifest 按 URL 排序写出，diff 干净；随仓库提交以跨 build 保留 lastmod 真相。
  const sortedManifest = Object.fromEntries(
    Object.keys(manifest).sort().map((url) => [url, manifest[url]]),
  );
  await fsPromises.writeFile(lastmodManifestPath, `${JSON.stringify(sortedManifest, null, 2)}\n`, 'utf8');

  console.log(`SEO pages generated: ${sitemapEntries.length} URLs`);
};

generate().catch((error) => {
  console.error('SEO generation failed:', error);
  process.exit(1);
});
