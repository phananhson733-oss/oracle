// INPUT: types.ts 的 AuthorPersona / Language；本目录 getAuthorBio。
// OUTPUT: buildPersonSchema —— 构造 schema.org Person JSON-LD 对象（含稳定 @id）。
// POS: 文章详情页/列表页/作者页的 Person 结构化数据唯一构造点，避免字段漂移。纯数据，可被 SEO 脚本 loader 解析。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { AuthorPersona, Language } from "../../types";

// 作者页规范 URL（@id 与 url 共用，跨页一致以建立稳定实体）。
// 作者页为 EN-only，故 @id 固定 /en/ 前缀。
export const authorUrl = (persona: AuthorPersona, siteUrl: string): string =>
  `${siteUrl}/en/wiki/author/${persona.id}`;

// 本地 bio 解析（缺失语言回退 EN）。自包含，避免对 ./index 的 value import，
// 以便 SEO 脚本的 TS loader 能解析本模块（eng-review #20 约束）。
const resolveBio = (persona: AuthorPersona, lang: Language): string =>
  persona.bio[lang] ?? persona.bio.en ?? "";

// 构造 Person JSON-LD。lang 影响 description；siteUrl 影响 @id/url（随环境变，不硬编码）。
export const buildPersonSchema = (
  persona: AuthorPersona,
  lang: Language,
  siteUrl: string,
): Record<string, unknown> => {
  const url = authorUrl(persona, siteUrl);
  return {
    "@type": "Person",
    "@id": url,
    name: persona.name,
    url,
    jobTitle: persona.title,
    knowsAbout: persona.topics,
    description: resolveBio(persona, lang),
  };
};
