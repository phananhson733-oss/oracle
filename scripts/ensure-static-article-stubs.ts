import { promises as fs } from 'fs';
import path from 'path';
import { getAllArticleSlugs, getArticleBySlug } from '../data/articles/index.ts';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const publicDir = path.join(rootDir, 'public');
const siteUrl = (process.env.SITE_URL || 'https://www.astrologywiki.com').replace(/\/$/, '');
const langs = ['en', 'zh'] as const;

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]!));

const ensureStub = async (slug: string, lang: (typeof langs)[number]) => {
  const article = getArticleBySlug(slug, lang);
  if (!article?.content) return false;
  const outputPath = path.join(publicDir, lang, 'wiki', slug, 'index.html');
  try {
    await fs.access(outputPath);
    return false;
  } catch {
    // missing stub; continue
  }
  const description = (article.description || '').replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(article.title)}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${siteUrl}/${lang}/wiki/${slug}" />
  </head>
  <body>
    <main>
      <h1>${escapeHtml(article.title)}</h1>
      <article><pre>${escapeHtml(article.content)}</pre></article>
    </main>
  </body>
</html>
`;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, 'utf8');
  return true;
};

let written = 0;
for (const slug of getAllArticleSlugs()) {
  for (const lang of langs) {
    if (await ensureStub(slug, lang)) written += 1;
  }
}
console.log(`[ensure-static-article-stubs] wrote ${written} missing stub(s)`);
