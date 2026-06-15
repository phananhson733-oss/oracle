// INPUT: AuthorPersona、Language；react-router Link；useLangPath 的 langPath。
// OUTPUT: AuthorByline 组件（detail/card 两 variant）+ AuthorMonogram 头像。
// POS: 文章详情页/列表卡作者署名的唯一渲染点，避免 byline 重复。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { Link } from "react-router-dom";
import type { AuthorPersona, Language } from "../../types";
import { getAuthorBio } from "../../data/authors";

// byline 就近披露文案（D1 披露式人设）：标明 editorial persona，不声称真人身份。
// 单一来源，作者页 header 复用同一文案，避免两处漂移。EN 默认 + ZH。
export const DISCLOSURE: Record<Language, string> = {
  en: "Editorial persona",
  zh: "编辑人设",
};

// name → 首字母（取前两个词首字母）。
const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

type MonogramSize = "lg" | "md" | "sm";

const SIZE_MAP: Record<
  MonogramSize,
  { box: string; radius: string; font: string }
> = {
  lg: { box: "w-24 h-24", radius: "rounded-3xl", font: "text-3xl" },
  md: { box: "w-11 h-11", radius: "rounded-xl", font: "text-base" },
  sm: { box: "w-6 h-6", radius: "rounded-md", font: "text-[10px]" },
};

// CSS monogram 头像：首字母 + avatarColors 渐变底。非图片资产，永远渲染成功。
export const AuthorMonogram: React.FC<{
  persona: AuthorPersona;
  size: MonogramSize;
}> = ({ persona, size }) => {
  const s = SIZE_MAP[size];
  const [c1, c2] = persona.avatarColors;
  return (
    <span
      aria-hidden="true"
      className={`flex-none inline-flex items-center justify-center ${s.box} ${s.radius} font-serif font-bold text-white/90 ring-1 ring-white/20`}
      style={{
        background: `radial-gradient(120% 120% at 30% 20%, ${c1} 0%, transparent 55%), radial-gradient(120% 120% at 80% 90%, ${c2} 0%, transparent 60%), rgba(120,120,140,0.25)`,
      }}
    >
      <span className={s.font}>{initialsOf(persona.name)}</span>
    </span>
  );
};

interface AuthorBylineProps {
  persona: AuthorPersona;
  variant: "detail" | "card";
  lang: Language;
  isDark: boolean;
  // detail variant 用：显示日期 + 链到作者页
  date?: string;
  langPath?: (path: string) => string;
  formatDate?: (d: string) => string;
}

// 文章署名组件。detail = 头像+名(链接)+职位+日期+就近披露；card = 小头像+名(muted，不链接)。
export const AuthorByline: React.FC<AuthorBylineProps> = ({
  persona,
  variant,
  lang,
  isDark,
  date,
  langPath,
  formatDate,
}) => {
  const mutedText = isDark ? "text-star-400" : "text-paper-600";
  const linkText = isDark ? "text-gold-400" : "text-gold-600";
  const nameText = isDark ? "text-star-50" : "text-paper-900";

  if (variant === "card") {
    return (
      <span className={`flex items-center gap-2 ${mutedText}`}>
        <AuthorMonogram persona={persona} size="sm" />
        <span>{persona.name}</span>
      </span>
    );
  }

  // detail variant — 作者页为 EN-only（canonical/stub/sitemap 皆 /en/）。
  // EN 文章 byline 链接到 /en 作者页；ZH 文章渲染纯文本（不链接），既不把用户从
  // zh 强制切到英文界面（AW-5），也不生成指向非 canonical /zh 作者页的内部链接（SEO 契约一致）。
  // langPath 仍作"是否可链接"的总开关，仅 EN 文章才真正生成链接。
  const authorHref =
    langPath && lang === "en" ? `/en/wiki/author/${persona.id}` : undefined;
  return (
    <span className="flex items-center gap-3">
      <AuthorMonogram persona={persona} size="md" />
      <span className="flex flex-col">
        <span className="text-sm">
          {authorHref ? (
            <Link
              to={authorHref}
              className={`font-semibold ${linkText} hover:underline`}
            >
              {persona.name}
            </Link>
          ) : (
            <span className={`font-semibold ${nameText}`}>{persona.name}</span>
          )}
          <span className={mutedText}> · {persona.title}</span>
        </span>
        <span className={`text-xs ${mutedText} flex items-center gap-2`}>
          {date && <span>{formatDate ? formatDate(date) : date}</span>}
          {date && <span aria-hidden="true">·</span>}
          <span>{DISCLOSURE[lang] ?? DISCLOSURE.en}</span>
        </span>
      </span>
    </span>
  );
};

export { getAuthorBio };
