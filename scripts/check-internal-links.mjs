// INPUT: public/sitemap.xml（canonical URL 全集）、data/articles/index.ts（getArticles → 文章 content/authorId/slug）、data/authors/index.ts（作者注册表）；复用 seo-lastmod.mjs 的 parseSitemapLastmods。
// OUTPUT: 纯函数 normalizeLink / extractInternalLinks / buildLinkGraph / findOrphans + main() 内链报告（总页数 / 有入链页数 / orphan 分组清单）；STRICT/--strict 下有 orphan 则 exit 1。
// POS: SEO T6 内链检测 + orphan 页检测工具。纯函数被 tests/unit/internal-links.test.ts 守护；顶层无副作用，仅直接执行时跑 main()。若更新此文件，务必更新本头注释。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { parseSitemapLastmods } from "./seo-lastmod.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 站点 host（含历史写法：www 与裸域、http/https 都视为同站）。
const SITE_HOSTS = new Set([
  "www.astrologywiki.com",
  "astrologywiki.com",
]);

// 把一条链接归一成站内 path 节点：去 host（仅站内）、去 query/hash、去 trailing slash。
// 返回 null 表示「非站内内部链接」（外链 / 纯锚点 / mailto / 相对锚点等）。
export const normalizeLink = (href, siteHosts = SITE_HOSTS) => {
  if (!href || typeof href !== "string") return null;
  const raw = href.trim();
  if (!raw) return null;
  // 纯锚点 / 查询 / mailto / tel / 协议相对外链一律忽略。
  if (raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
    return null;
  }

  let pathPart;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      return null;
    }
    if (!siteHosts.has(url.hostname)) return null; // 外链
    pathPart = url.pathname;
  } else if (raw.startsWith("/")) {
    // 相对绝对路径：截掉 query/hash。
    pathPart = raw.split(/[?#]/)[0];
  } else {
    // 相对路径 / 协议相对 //host/... 等：本项目内链均为站内绝对路径，忽略其余。
    return null;
  }

  // trailing slash 归一（保留根 "/"）。
  if (pathPart.length > 1 && pathPart.endsWith("/")) {
    pathPart = pathPart.replace(/\/+$/, "");
  }
  return pathPart || "/";
};

// 从一段 content 抽出所有站内内部链接（归一后的 path 集合）。
// 覆盖两种真实写法：markdown [text](url) 与裸 <a href="url">；其余忽略。
export const extractInternalLinks = (content, siteHosts = SITE_HOSTS) => {
  const out = new Set();
  if (!content || typeof content !== "string") return out;
  const patterns = [
    /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, // markdown link target
    /href\s*=\s*"([^"]+)"/g, // html href
    /href\s*=\s*'([^']+)'/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const norm = normalizeLink(m[1], siteHosts);
      if (norm) out.add(norm);
    }
  }
  return out;
};

// 构建链接图：节点 = sitemap canonical path 全集；边 = 各 source 页抽到的、且落在节点集合内的链接。
// pagesWithLinks: Array<{ from, links: Iterable<string> }>，from/links 均为已归一 path。
// 返回 { nodes:Set, inbound:Map<node, Set<from>> }；只统计指向「sitemap 内节点」的入链。
export const buildLinkGraph = (sitemapPaths, pagesWithLinks) => {
  const nodes = new Set(sitemapPaths);
  const inbound = new Map();
  for (const node of nodes) inbound.set(node, new Set());
  for (const page of pagesWithLinks) {
    for (const target of page.links) {
      if (!nodes.has(target)) continue; // 指向非 sitemap 页 / 外链，跳过
      if (target === page.from) continue; // 自链不计入站权重
      inbound.get(target).add(page.from);
    }
  }
  return { nodes, inbound };
};

// orphan = sitemap 内、入链数为 0 的节点。返回排序后的 path 数组。
export const findOrphans = (graph) => {
  const orphans = [];
  for (const [node, sources] of graph.inbound) {
    if (sources.size === 0) orphans.push(node);
  }
  return orphans.sort();
};

// 把 orphan path 按类型分组，便于报告阅读。
export const classifyPath = (p) => {
  if (/\/wiki\/author\//.test(p)) return "author";
  if (/\/wiki\/classics\//.test(p)) return "classics";
  if (/\/wiki\/[^/]+$/.test(p) && !/\/wiki$/.test(p)) return "article";
  if (/\/wiki$/.test(p)) return "wiki-hub";
  return "other";
};

export const groupOrphans = (orphans) => {
  const groups = {};
  for (const p of orphans) {
    const kind = classifyPath(p);
    if (!groups[kind]) groups[kind] = [];
    groups[kind].push(p);
  }
  return groups;
};

// --- 数据加载（仅 main 用，纯函数区结束）---

// 用 TypeScript transpileModule 把 .ts 数据模块加载成 CJS（与 generate-seo-pages.mjs 同策略）。
const tsCache = new Map();
const loadTsModule = (tsPath) => {
  if (tsCache.has(tsPath)) return tsCache.get(tsPath);
  const source = fs.readFileSync(tsPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const moduleObj = { exports: {} };
  const dirname = path.dirname(tsPath);
  const localRequire = (specifier) => {
    if (specifier.endsWith("/types") || specifier === "../../types") return {};
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const resolved = path.resolve(dirname, specifier);
      const candidates = [
        resolved.replace(/\.js$/, ".ts"),
        `${resolved}.ts`,
        resolved,
        path.join(resolved, "index.ts"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return loadTsModule(candidate);
        }
      }
    }
    throw new Error(`Unsupported import in link checker: ${specifier}`);
  };
  const runner = new Function(
    "require",
    "module",
    "exports",
    "__filename",
    "__dirname",
    output,
  );
  runner(localRequire, moduleObj, moduleObj.exports, tsPath, dirname);
  tsCache.set(tsPath, moduleObj.exports);
  return moduleObj.exports;
};

// 读 sitemap → 归一 path 全集（去 host/hash/trailing slash）。
const loadSitemapPaths = () => {
  const xml = fs.readFileSync(path.join(rootDir, "public/sitemap.xml"), "utf8");
  const locMap = parseSitemapLastmods(xml);
  const paths = new Set();
  // parseSitemapLastmods 只含带 lastmod 的 loc；本项目所有 url 都有 lastmod。
  for (const loc of locMap.keys()) {
    const norm = normalizeLink(loc);
    if (norm) paths.add(norm);
  }
  return paths;
};

// 收集所有 source 页的内链。覆盖三条真实来源：
//   1. 文章 content（markdown 内链）—— 主线
//   2. 作者页 → 该作者名下文章（作者 profile 列出其文章）
//   3. wiki hub（/lang/wiki）→ 全部文章（条目索引页）
const collectPages = () => {
  const articlesModule = loadTsModule(
    path.join(rootDir, "data/articles/index.ts"),
  );
  const langs = ["en", "zh"];
  const pages = [];

  for (const lang of langs) {
    const articles = articlesModule.getArticles(lang);
    const hubPath = `/${lang}/wiki`;
    const hubLinks = new Set();
    const authorLinks = new Map(); // authorId -> Set(article paths)

    for (const article of articles) {
      const fromPath = `/${lang}/wiki/${article.slug}`;
      pages.push({
        from: fromPath,
        links: extractInternalLinks(article.content),
      });
      hubLinks.add(fromPath);
      if (article.authorId) {
        if (!authorLinks.has(article.authorId)) {
          authorLinks.set(article.authorId, new Set());
        }
        authorLinks.get(article.authorId).add(fromPath);
      }
    }

    // wiki hub 页指向全部条目。
    pages.push({ from: hubPath, links: hubLinks });

    // 作者页（仅 en 有 author 路由；zh 作者页未单独索引，跳过空集）。
    for (const [authorId, links] of authorLinks) {
      pages.push({ from: `/${lang}/wiki/author/${authorId}`, links });
    }
  }

  return pages;
};

const main = () => {
  const strict =
    process.argv.includes("--strict") || process.env.STRICT === "1";

  const sitemapPaths = loadSitemapPaths();
  const pages = collectPages();
  const graph = buildLinkGraph(sitemapPaths, pages);
  const orphans = findOrphans(graph);
  const grouped = groupOrphans(orphans);

  const total = graph.nodes.size;
  const linked = total - orphans.length;

  console.log("=== Internal Link / Orphan Report ===");
  console.log(`Sitemap pages (nodes):      ${total}`);
  console.log(`Pages with >=1 inbound link: ${linked}`);
  console.log(`Orphan pages (0 inbound):    ${orphans.length}`);
  console.log("");

  if (orphans.length === 0) {
    console.log("No orphan pages. Every sitemap URL has at least one internal inbound link.");
  } else {
    console.log("Orphans by type:");
    const order = ["article", "wiki-hub", "author", "classics", "other"];
    const kinds = [
      ...order.filter((k) => grouped[k]),
      ...Object.keys(grouped).filter((k) => !order.includes(k)),
    ];
    for (const kind of kinds) {
      const list = grouped[kind];
      console.log(`\n  [${kind}] (${list.length})`);
      for (const p of list) console.log(`    ${p}`);
    }
  }

  // 入链 TOP（信息性，帮助判断 hub/pillar 是否合理分发权重）。
  const ranked = [...graph.inbound.entries()]
    .map(([node, src]) => [node, src.size])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  console.log("\nTop inbound pages:");
  for (const [node, count] of ranked) console.log(`  ${count}\t${node}`);

  if (strict && orphans.length > 0) {
    console.error(`\nSTRICT: ${orphans.length} orphan page(s) found — failing.`);
    process.exit(1);
  }
};

// 仅在直接执行时跑报告；被 import（测试）时不触发任何副作用。
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
