// INPUT: types.ts 的 AuthorPersona / Language；本目录 getAuthorBio。
// OUTPUT: buildPersonSchema（披露式 editorial persona，作者页用）+ buildEditorialOrganizationSchema（文章 author 责任主体）。
// POS: 作者结构化数据唯一构造点。D1：文章 author=Organization 编辑部；persona 仅作 editorial voice，不声称 jobTitle/knowsAbout 等真实专家资质，降 E-E-A-T/spam 风险。纯数据，可被 SEO 脚本 loader 解析。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { AuthorPersona, Language } from "../../types";

// 编辑部实体名（文章 author 的统一责任主体）。
export const EDITORIAL_ORG_NAME = "AstrologyWiki Editorial Team";

// 作者页规范 URL（@id 与 url 共用，跨页一致以建立稳定实体）。
// 作者页为 EN-only，故 @id 固定 /en/ 前缀。
export const authorUrl = (persona: AuthorPersona, siteUrl: string): string =>
  `${siteUrl}/en/wiki/author/${persona.id}`;

// 本地 bio 解析（缺失语言回退 EN）。自包含，避免对 ./index 的 value import，
// 以便 SEO 脚本的 TS loader 能解析本模块（eng-review #20 约束）。
const resolveBio = (persona: AuthorPersona, lang: Language): string =>
  persona.bio[lang] ?? persona.bio.en ?? "";

// 构造作者人设的 Person JSON-LD（仅作者页 ProfilePage.mainEntity 用）。
// D1 缓解：persona 是披露式 editorial voice，不输出 jobTitle / knowsAbout 等
// 真实专家资质声明；disambiguatingDescription 显式披露其非真实个人。
// 文章 author 一律用 buildEditorialOrganizationSchema，不用 persona。
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
    description: resolveBio(persona, lang),
    disambiguatingDescription:
      "Editorial persona of AstrologyWiki, not a real individual.",
  };
};

// 构造编辑部 Organization JSON-LD —— 文章结构化数据的 author 责任主体。
// D1.3：article author 用 Organization/编辑部，不扩成具备真实身份的 Person，
// 避免放大 persona 的"拟真人"感知。@id 稳定，跨页建立单一编辑部实体。
export const buildEditorialOrganizationSchema = (
  siteUrl: string,
): Record<string, unknown> => ({
  "@type": "Organization",
  "@id": `${siteUrl}/#editorial-team`,
  name: EDITORIAL_ORG_NAME,
  url: `${siteUrl}/en/about`,
});
