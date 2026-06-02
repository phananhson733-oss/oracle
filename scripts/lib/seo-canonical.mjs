// INPUT: 每页可选的 seo override（{ canonicalPath?, robots?, sitemap? }）+ 页面 lang / 自指 URL / siteUrl。
// OUTPUT: resolveCanonicalUrl（解析 canonical URL，支持 lang-relative 与绝对路径）+ includeInSitemap（是否进 sitemap）。
// POS: SEO canonical 收口的纯函数，供 generate-seo-pages.mjs 与运行时镜像逻辑共用。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

// canonicalPath 约定：lang-relative（如 "/wiki/5th-house"，由消费端前缀 "/<lang>"）；
// 也允许传完整绝对 URL（http(s)://...），此时原样返回（用于跨语言 canonical 等场景）。
export const resolveCanonicalUrl = ({ seo, lang, selfUrl, siteUrl }) => {
  const canonicalPath = seo && seo.canonicalPath;
  if (!canonicalPath) return selfUrl;
  if (/^https?:\/\//i.test(canonicalPath)) return canonicalPath;
  const path = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  return `${siteUrl}/${lang}${path}`;
};

// sitemap 收录：仅当显式 seo.sitemap === false 时排除（loser 页 canonical 到 winner 后不再进 sitemap）。
// 缺省（undefined / 无 seo / sitemap !== false）一律收录，保证既有页面行为不变。
export const includeInSitemap = (seo) => !(seo && seo.sitemap === false);
