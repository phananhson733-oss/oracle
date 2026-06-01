// INPUT: data/articles/index.ts（经内联 TS loader 读 getArticleSummaries en/zh）、data/authors/index.ts（作者名/头衔）、scripts/assets/fonts/*.ttf（Inter + Noto Sans SC 静态字重）、satori/@resvg/resvg-js/sharp。
// OUTPUT: 为每篇文章按语言生成 1200×630 品牌 OG 图，写入 public/og/articles/<slug>.png|.webp（zh 用 <slug>.zh.png|.webp），并返回写入清单；幂等（标题+作者+分类 hash 未变则跳过）。
// POS: build 链第一步（package.json build 中先于 generate-seo-pages.mjs / vite build），产出社交分享与页内封面所需图片资产。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md（scripts/ 无 FOLDER.md，维护 public/og/FOLDER.md）。

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import ts from 'typescript';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const fontsDir = path.join(scriptDir, 'assets', 'fonts');
const outDir = path.join(rootDir, 'public', 'og', 'articles');
// Idempotency hashes live in the build cache, never under public/ (would otherwise ship as servable .hash files).
const cacheDir = path.join(rootDir, 'node_modules', '.cache', 'og-images');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const WEBP_MAX_BYTES = 200 * 1024;

// Brand palette sourced from tailwind.config.cjs / index.html CSS vars.
const COLORS = {
  bg: '#050506', // --space-950 main background (rgb 5 5 6)
  panel: '#0C0C10', // slightly lifted surface for the glow gradient
  title: '#F4E8CF', // accent.light — warm near-white for headline
  accent: '#C6A062', // accent.DEFAULT gold
  muted: '#8A8682', // star muted text
  rule: 'rgba(198, 160, 98, 0.35)', // accent rule
};

// --- TypeScript module loader (mirrors generate-seo-pages.mjs, no React/Vite imports) ---
const tsCache = new Map();
const loadTsModule = (tsPath) => {
  if (tsCache.has(tsPath)) return tsCache.get(tsPath);
  const source = fs.readFileSync(tsPath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const dirname = path.dirname(tsPath);
  const localRequire = (specifier) => {
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const resolved = path.resolve(dirname, specifier);
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
    throw new Error(`Unsupported import in OG generator: ${specifier}`);
  };

  tsCache.set(tsPath, moduleObj.exports);
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', output)(localRequire, moduleObj, moduleObj.exports);
  tsCache.set(tsPath, moduleObj.exports);
  return moduleObj.exports;
};

const loadFonts = () => {
  const read = (name) => fs.readFileSync(path.join(fontsDir, name));
  return [
    { name: 'Inter', data: read('Inter-SemiBold.ttf'), weight: 600, style: 'normal' },
    { name: 'Inter', data: read('Inter-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Noto Sans SC', data: read('NotoSansSC-SemiBold.ttf'), weight: 600, style: 'normal' },
    { name: 'Noto Sans SC', data: read('NotoSansSC-Regular.ttf'), weight: 400, style: 'normal' },
  ];
};

// Pick a headline font size that keeps long titles inside the frame.
// CJK glyphs are roughly square (≈1 em wide); Latin averages ≈0.55 em.
const pickFontSize = (title, isCjk) => {
  const len = title.length;
  if (isCjk) {
    if (len <= 14) return 72;
    if (len <= 22) return 60;
    if (len <= 30) return 52;
    return 44;
  }
  if (len <= 28) return 72;
  if (len <= 44) return 60;
  if (len <= 64) return 52;
  return 44;
};

const isCjkText = (value) => /[　-鿿＀-￯]/.test(value);

// Derive a short category label from author title + first keyword.
const buildCategory = (authorTitle, keywords) => {
  const keyword = Array.isArray(keywords) && keywords.length > 0 ? keywords[0] : '';
  if (authorTitle && keyword) return `${authorTitle} · ${keyword}`;
  return authorTitle || keyword || 'Psychological Astrology';
};

const buildTemplate = ({ title, byline, category, isCjk, fontSize }) => {
  const fontFamily = isCjk ? '"Noto Sans SC", "Inter"' : '"Inter", "Noto Sans SC"';
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '630px',
        backgroundColor: COLORS.bg,
        backgroundImage: `radial-gradient(1100px 520px at 18% -8%, ${COLORS.panel} 0%, ${COLORS.bg} 62%)`,
        padding: '72px 80px',
        fontFamily,
        justifyContent: 'space-between',
      },
      children: [
        // Brand row
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '16px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.accent,
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: COLORS.title,
                  },
                  children: 'AstrologyWiki',
                },
              },
            ],
          },
        },
        // Headline + meta block
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize,
                    fontWeight: 600,
                    lineHeight: 1.22,
                    color: COLORS.title,
                    // Clamp to 3 lines so it never overruns the frame.
                    maxHeight: `${Math.round(fontSize * 1.22 * 3)}px`,
                    overflow: 'hidden',
                  },
                  children: title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '88px',
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: COLORS.accent,
                    marginTop: '32px',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    fontSize: 26,
                    fontWeight: 400,
                    color: COLORS.accent,
                    marginTop: '24px',
                  },
                  children: byline ? `${byline} · ${category}` : category,
                },
              },
            ],
          },
        },
      ],
    },
  };
};

const renderOgImage = async (fonts, params) => {
  const svg = await satori(buildTemplate(params), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
  let webp = await sharp(png).webp({ quality: 82 }).toBuffer();
  // Step quality down until under the WebP budget; OG PNG stays untouched.
  let quality = 82;
  while (webp.length > WEBP_MAX_BYTES && quality > 40) {
    quality -= 12;
    webp = await sharp(png).webp({ quality }).toBuffer();
  }
  return { png, webp };
};

const contentHash = (params) =>
  crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex').slice(0, 16);

const buildJobs = (summaries, authorsModule, lang) =>
  summaries.map((summary) => {
    const author = authorsModule.getAuthorById(summary.authorId);
    const title = String(summary.title || '').replace(/\s+/g, ' ').trim();
    const isCjk = lang === 'zh' || isCjkText(title);
    const params = {
      title,
      byline: author ? author.name : '',
      category: buildCategory(author ? author.title : '', summary.keywords),
      isCjk,
      fontSize: pickFontSize(title, isCjk),
    };
    const suffix = lang === 'zh' ? '.zh' : '';
    return {
      slug: summary.slug,
      lang,
      params,
      pngPath: path.join(outDir, `${summary.slug}${suffix}.png`),
      webpPath: path.join(outDir, `${summary.slug}${suffix}.webp`),
      hashPath: path.join(cacheDir, `${summary.slug}${suffix}.hash`),
      hash: contentHash(params),
    };
  });

// Idempotency: skip a job if its cached hash matches and both outputs exist.
const isUnchanged = async (job) => {
  try {
    const [stored] = await Promise.all([
      fsPromises.readFile(job.hashPath, 'utf8'),
      fsPromises.access(job.pngPath),
      fsPromises.access(job.webpPath),
    ]);
    return stored.trim() === job.hash;
  } catch {
    return false;
  }
};

const writeJob = async (fonts, job) => {
  const { png, webp } = await renderOgImage(fonts, job.params);
  await Promise.all([
    fsPromises.writeFile(job.pngPath, png),
    fsPromises.writeFile(job.webpPath, webp),
    fsPromises.writeFile(job.hashPath, job.hash),
  ]);
  return { png: png.length, webp: webp.length };
};

export const generateOgImages = async () => {
  await Promise.all([
    fsPromises.mkdir(outDir, { recursive: true }),
    fsPromises.mkdir(cacheDir, { recursive: true }),
  ]);
  const fonts = loadFonts();
  const articlesModule = loadTsModule(path.join(rootDir, 'data/articles/index.ts'));
  const authorsModule = loadTsModule(path.join(rootDir, 'data/authors/index.ts'));

  const jobs = [
    ...buildJobs(articlesModule.getArticleSummaries('en'), authorsModule, 'en'),
    ...buildJobs(articlesModule.getArticleSummaries('zh'), authorsModule, 'zh'),
  ];

  let written = 0;
  let skipped = 0;
  let maxPng = 0;
  let maxWebp = 0;
  for (const job of jobs) {
    if (await isUnchanged(job)) {
      skipped += 1;
      continue;
    }
    const sizes = await writeJob(fonts, job);
    maxPng = Math.max(maxPng, sizes.png);
    maxWebp = Math.max(maxWebp, sizes.webp);
    written += 1;
  }

  console.log(
    `[og-images] ${jobs.length} job(s): ${written} written, ${skipped} unchanged | ` +
      `max PNG ${(maxPng / 1024).toFixed(0)}KB, max WebP ${(maxWebp / 1024).toFixed(0)}KB`,
  );
  return { total: jobs.length, written, skipped };
};

// Run directly when invoked as a script (not when imported by the SEO generator).
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  generateOgImages().catch((error) => {
    console.error('[og-images] generation failed:', error);
    process.exit(1);
  });
}
