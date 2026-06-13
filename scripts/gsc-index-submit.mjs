// INPUT: public/sitemap.xml（generate-seo-pages.mjs 生成）+ 环境变量
//   GOOGLE_INDEXING_SA（service account JSON 文件路径）或 GOOGLE_INDEXING_SA_JSON（内联 JSON），
//   可选 SITE_URL、GSC_INDEX_MAX（单次上限，默认 200=API 日配额）、GSC_INDEX_TYPE（URL_UPDATED|URL_DELETED）。
//   复用 scripts/seo-lastmod.mjs 的 parseSitemapLastmods，只提交 lastmod===today 的页面。
// OUTPUT: 用 service account 走 JWT→OAuth token，向 https://indexing.googleapis.com/v3/urlNotifications:publish
//   逐条 POST {url, type:URL_UPDATED}，请求 Google 抓取/更新新发布页面（IndexNow 不通知 Google，本脚本补上 Google 通道）。
// POS: SEO 收录 T4（Google 侧，和 ping-indexnow.mjs 的 Bing/Yandex 通道并列）。
//   ★ 时机：与 ping-indexnow（build 期）不同，本脚本应在 prod 部署、URL 真正 live 之后运行
//   （否则 Google 抓到 404）。不接进 build 链；由 post-deploy 步骤 / autopilot merge 后 / 手动调用。
//   无 SA 凭据 / 无当天变更 / 网络失败一律优雅 no-op 并 exit 0，绝不阻断。
//   service account 需在 Search Console 把它的 client_email 加为站点 Owner，且项目开启 Indexing API。
//   真实 SA JSON 绝不进 git——通过环境变量注入。若更新此文件，务必更新本头注释。

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseSitemapLastmods } from "./seo-lastmod.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = path.resolve(__dirname, "..", "public", "sitemap.xml");
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const PUBLISH_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const SCOPE = "https://www.googleapis.com/auth/indexing";
const DEFAULT_MAX = 200; // Indexing API 默认日配额

const todayUtc = () => new Date().toISOString().slice(0, 10);

// 读 service account：优先 GOOGLE_INDEXING_SA（文件路径），回退 GOOGLE_INDEXING_SA_JSON（内联）。
const loadServiceAccount = () => {
  const inline = process.env.GOOGLE_INDEXING_SA_JSON;
  const filePath = process.env.GOOGLE_INDEXING_SA;
  let raw = "";
  if (inline && inline.trim()) raw = inline;
  else if (filePath && fs.existsSync(filePath)) raw = fs.readFileSync(filePath, "utf8");
  else return null;
  try {
    const sa = JSON.parse(raw);
    if (!sa.client_email || !sa.private_key) return null;
    return sa;
  } catch {
    return null;
  }
};

const base64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// 用 SA 私钥签 JWT（RS256），换 Indexing scope 的 access_token。
const getAccessToken = async (sa) => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = base64url(signer.sign(sa.private_key));
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`token exchange failed: HTTP ${res.status} ${body.error || ""}`);
  }
  return body.access_token;
};

const collectChangedUrls = (lastmodByUrl, today) => {
  const urls = [];
  for (const [loc, lastmod] of lastmodByUrl) if (lastmod === today) urls.push(loc);
  return urls;
};

const publishOne = async (token, url, type) => {
  const res = await fetch(PUBLISH_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, type }),
  });
  return res.status;
};

const main = async () => {
  const sa = loadServiceAccount();
  if (!sa) {
    console.log(
      "[gsc-index] no service account (set GOOGLE_INDEXING_SA file path or GOOGLE_INDEXING_SA_JSON) — skipping (no-op).",
    );
    return;
  }
  // Explicit --url <u> (repeatable) bypasses the sitemap — used by the autopilot
  // post-merge hook to submit exactly the article it just published (avoids the
  // build-artifact-staleness of public/sitemap.xml when run outside build).
  const urlArgs = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === "--url" && process.argv[i + 1]) urlArgs.push(process.argv[++i]);
  }

  let changed;
  if (urlArgs.length > 0) {
    changed = urlArgs;
  } else {
    if (!fs.existsSync(SITEMAP_PATH)) {
      console.log(`[gsc-index] sitemap not found at ${SITEMAP_PATH} — skipping.`);
      return;
    }
    const xml = fs.readFileSync(SITEMAP_PATH, "utf8");
    const lastmodByUrl = parseSitemapLastmods(xml);
    const today = todayUtc();
    changed = collectChangedUrls(lastmodByUrl, today);
    if (changed.length === 0) {
      console.log(`[gsc-index] no URLs with lastmod=${today} — nothing to submit (no-op).`);
      return;
    }
  }

  const max = parseInt(process.env.GSC_INDEX_MAX || "", 10) || DEFAULT_MAX;
  const type = process.env.GSC_INDEX_TYPE === "URL_DELETED" ? "URL_DELETED" : "URL_UPDATED";
  if (changed.length > max) {
    console.log(`[gsc-index] ${changed.length} changed URLs > cap ${max}; submitting first ${max}, deferring ${changed.length - max} (raise GSC_INDEX_MAX or run again tomorrow).`);
    changed = changed.slice(0, max);
  }

  let token;
  try {
    token = await getAccessToken(sa);
  } catch (err) {
    console.log(`[gsc-index] auth failed (non-fatal): ${err?.message ?? err}`);
    return;
  }

  console.log(`[gsc-index] submitting ${changed.length} URL(s) type=${type} as ${sa.client_email}`);
  let ok = 0;
  for (const url of changed) {
    try {
      const status = await publishOne(token, url, type);
      if (status >= 200 && status < 300) ok++;
      else console.log(`[gsc-index] ${url} -> HTTP ${status}`);
    } catch (err) {
      console.log(`[gsc-index] ${url} failed (non-fatal): ${err?.message ?? err}`);
    }
  }
  console.log(`[gsc-index] done: ${ok}/${changed.length} accepted by Google Indexing API.`);
};

main()
  .catch((err) => {
    console.log(`[gsc-index] unexpected error (non-fatal): ${err?.message ?? err}`);
  })
  .finally(() => process.exit(0));
