const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.astrologywiki.com';
const LANG = 'en';
const TODAY = new Date().toISOString().split('T')[0];

// Public pages that should be indexed (English only)
const STATIC_PATHS = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/wiki', priority: '0.9', changefreq: 'daily' },
  { path: '/wiki/classics', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.4', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.2', changefreq: 'monthly' },
  { path: '/terms', priority: '0.2', changefreq: 'monthly' },
  { path: '/cookies', priority: '0.2', changefreq: 'monthly' },
  { path: '/help', priority: '0.4', changefreq: 'monthly' },
];

// Extract IDs from a TypeScript data file using regex
function extractIds(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /id:\s*['"]([^'"]+)['"]/g;
  const ids = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.add(match[1]);
  }
  return Array.from(ids);
}

// Extract article slugs from the articles index
function extractArticleSlugs(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /slug:\s*['"]([^'"]+)['"]/g;
  const slugs = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    slugs.add(match[1]);
  }
  return Array.from(slugs);
}

function generateUrl(pagePath, priority, changefreq) {
  return `  <url>
    <loc>${BASE_URL}/${LANG}${pagePath}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSitemap() {
  const wikiFile = path.join(__dirname, '../backend/src/data/wiki.ts');
  const classicsFile = path.join(__dirname, '../backend/src/data/wiki-classics.ts');
  const classicsJsFile = path.join(__dirname, '../backend/src/data/wiki-classics.js');
  const articlesDir = path.join(__dirname, '../data/articles');

  const wikiIds = extractIds(wikiFile);

  let classicsIds = extractIds(classicsFile);
  if (classicsIds.length === 0) {
    classicsIds = extractIds(classicsJsFile);
  }

  // Collect article slugs from all article files
  const articleSlugs = new Set();
  if (fs.existsSync(articlesDir)) {
    const articleFiles = fs.readdirSync(articlesDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
    for (const file of articleFiles) {
      const slugs = extractArticleSlugs(path.join(articlesDir, file));
      slugs.forEach(s => articleSlugs.add(s));
    }
  }

  const urls = [];

  // Static pages
  for (const page of STATIC_PATHS) {
    urls.push(generateUrl(page.path, page.priority, page.changefreq));
  }

  // Wiki entries
  for (const id of wikiIds) {
    urls.push(generateUrl(`/wiki/${id}`, '0.7', 'weekly'));
  }

  // Wiki classics
  for (const id of classicsIds) {
    urls.push(generateUrl(`/wiki/classics/${id}`, '0.6', 'monthly'));
  }

  // Wiki articles
  for (const slug of articleSlugs) {
    urls.push(generateUrl(`/wiki/${slug}`, '0.7', 'weekly'));
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);

  const total = STATIC_PATHS.length + wikiIds.length + classicsIds.length + articleSlugs.size;
  console.log(`Sitemap generated: ${total} URLs (${STATIC_PATHS.length} static, ${wikiIds.length} wiki, ${classicsIds.length} classics, ${articleSlugs.size} articles)`);
  console.log(`Domain: ${BASE_URL}/${LANG}/`);
  console.log(`Saved to: ${outputPath}`);
}

generateSitemap();
