// INPUT: public/sitemap.xml（由 generate-seo-pages.mjs 生成）+ 环境变量 INDEXNOW_KEY / SITE_URL；复用 scripts/seo-lastmod.mjs 的 parseSitemapLastmods。
// OUTPUT: 向 https://api.indexnow.org/indexnow POST 当天变更 URL，通知 Bing / Yandex（非 Google——Google 不支持 IndexNow）；构建期可据 INDEXNOW_KEY 动态生成 public/<key>.txt 验证文件。
// POS: SEO T4。已接入 package.json build 链：generate-seo-pages 之后、vite build 之前运行（writeKeyFile 写 public/<key>.txt，需在 vite 拷贝 public→dist 之前）。INDEXNOW_KEY 仅配 Production 环境时此步在 production 构建才真正提交；无 key / 无当天变更 / 网络失败一律优雅 no-op 并 exit 0，绝不阻断部署。若更新此文件，务必更新本头注释（scripts/ 目录暂无 FOLDER.md，不要新建）。

// Key 文件机制（防泄密）：
//   IndexNow 协议要求站点根可公开访问一个 <key>.txt，内容就是 key 本身，用于验证所有权。
//   真实 key 绝不进 git——它通过 Vercel 环境变量 INDEXNOW_KEY 注入。
//   - 仓库内只提交 public/indexnow-key.txt.example（说明格式，非真实 key）。
//   - build 期若检测到 INDEXNOW_KEY，本脚本的 writeKeyFile() 动态在 public/<INDEXNOW_KEY>.txt
//     写出验证文件（该文件名含真实 key，被 .gitignore 之外的部署流程产物消费，不应 commit）。
//   - 无 INDEXNOW_KEY 时不写文件、不 ping，静默 exit 0。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSitemapLastmods } from "./seo-lastmod.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const SITEMAP_PATH = path.join(PUBLIC_DIR, "sitemap.xml");
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_SITE_URL = "https://www.astrologywiki.com";

const todayUtc = () => new Date().toISOString().slice(0, 10);

// 从 sitemap 第一个 <loc> 或 SITE_URL 推断 host（裸域名，不含协议/路径）。
const resolveHost = (lastmodByUrl, siteUrlEnv) => {
  const firstLoc = lastmodByUrl.keys().next().value;
  const source = siteUrlEnv || firstLoc || DEFAULT_SITE_URL;
  try {
    return new URL(source).host;
  } catch {
    return new URL(DEFAULT_SITE_URL).host;
  }
};

// 仅保留 lastmod === today 的 URL（真正变更页面），避免每次重复提交全站。
const collectChangedUrls = (lastmodByUrl, today) => {
  const urls = [];
  for (const [loc, lastmod] of lastmodByUrl) {
    if (lastmod === today) urls.push(loc);
  }
  return urls;
};

// 构建期据 INDEXNOW_KEY 动态写出验证文件 public/<key>.txt（内容=key）。仅当 key 存在时调用。
const writeKeyFile = (key) => {
  const keyFile = path.join(PUBLIC_DIR, `${key}.txt`);
  fs.writeFileSync(keyFile, key, "utf8");
  console.log(`[indexnow] wrote verification key file: public/${key}.txt`);
};

const submit = async ({ host, key, urlList }) => {
  const payload = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList,
  };
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  console.log(`[indexnow] submitted ${urlList.length} URL(s) -> HTTP ${res.status}`);
};

// IndexNow key 协议要求 8-128 位十六进制/字母数字（连字符）。校验后才当文件名用，
// 防 INDEXNOW_KEY 含 `/` 或 `..` 时 writeKeyFile 把文件写出 public/ 之外（path traversal）。
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

const main = async () => {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.log("[indexnow] INDEXNOW_KEY not set — skipping (no-op). Notifies Bing/Yandex only, never Google.");
    return;
  }
  if (!KEY_PATTERN.test(key)) {
    console.log("[indexnow] INDEXNOW_KEY has invalid format (expect 8-128 alphanumeric/hyphen) — skipping to avoid unsafe key-file path.");
    return;
  }

  if (!fs.existsSync(SITEMAP_PATH)) {
    console.log(`[indexnow] sitemap not found at ${SITEMAP_PATH} — skipping.`);
    return;
  }

  const xml = fs.readFileSync(SITEMAP_PATH, "utf8");
  const lastmodByUrl = parseSitemapLastmods(xml);
  const today = todayUtc();
  const changed = collectChangedUrls(lastmodByUrl, today);

  // 即便没有当天变更，也确保验证文件存在（部署需可被 IndexNow 拉取校验）。
  writeKeyFile(key);

  if (changed.length === 0) {
    console.log(`[indexnow] no URLs with lastmod=${today} — nothing to submit (no-op).`);
    return;
  }

  const host = resolveHost(lastmodByUrl, process.env.SITE_URL);
  console.log(`[indexnow] host=${host}, ${changed.length} changed URL(s) for ${today}`);

  try {
    await submit({ host, key, urlList: changed });
  } catch (err) {
    // IndexNow 失败不应阻断部署 —— 打印后正常退出。
    console.log(`[indexnow] submission failed (non-fatal): ${err?.message ?? err}`);
  }
};

main()
  .catch((err) => {
    console.log(`[indexnow] unexpected error (non-fatal): ${err?.message ?? err}`);
  })
  .finally(() => {
    process.exit(0);
  });
