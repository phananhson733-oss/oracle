// INPUT: React、services/llmText（normalizeLlmText/LlmBlock）。
// OUTPUT: LLM 解读内容的统一文档式排版原语：LlmDoc/LlmSection/LlmProse/LlmList/LlmQuote/LlmCallout/LlmKV。
// POS: 全站 LLM 内容排版唯一来源（artifact 文档式：单列文档流 + mono 眉标节头 + 发丝线分节 + 最多一层容器）；
//      消费方禁止再手搓节卡片/彩虹眉标/圆点假列表。若更新此文件，务必更新本头注释与 components/llm/FOLDER.md。

import React from "react";
import {
  normalizeLlmText,
  type LlmBlock,
  type LlmInlineSegment,
} from "../../services/llmText";

/* ------------------------------------------------------------------ *
 * 版式常量（规格：scratchpad llm-doc-spec → COLOR_SYSTEM_GUIDE §LLM 排版）
 * 全部走 dark: 变体自反转，不接 useTheme，便于任何上下文直接使用。
 * ------------------------------------------------------------------ */

// mono 眉标：全站单色，不随节轮换颜色。
const EYEBROW_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400";

// 正文：15px / 1.7 行距 / 68ch 度量行长。
const BODY_CLASS =
  "max-w-[68ch] text-[0.9375rem] leading-[1.7] text-paper-800 dark:text-star-100";

const MUTED_CLASS = "text-paper-600 dark:text-star-300";

const HAIRLINE_CLASS = "border-paper-900/10 dark:border-star-50/10";

const renderSegments = (segments: LlmInlineSegment[]): React.ReactNode =>
  segments.map((s, i) =>
    s.emphasis ? (
      <strong
        key={i}
        className="font-semibold text-paper-900 dark:text-star-50"
      >
        {s.text}
      </strong>
    ) : (
      <React.Fragment key={i}>{s.text}</React.Fragment>
    ),
  );

/* ------------------------------------------------------------------ */

/** 文档根：给整个 LLM 内容区提供基础字色与节间距。 */
export const LlmDoc: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => (
  <div className={`llm-doc ${className}`}>{children}</div>
);

/** 文档节：发丝线分节 + mono 眉标 + 衬线标题 + intro；绝不是卡片。 */
export const LlmSection: React.FC<{
  eyebrow?: string;
  title?: string;
  intro?: string;
  /** 首节不画顶部发丝线。 */
  first?: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ eyebrow, title, intro, first = false, className = "", children }) => (
  <section
    className={`${first ? "" : `border-t ${HAIRLINE_CLASS} pt-6`} pb-2 ${className}`}
  >
    {eyebrow && <p className={`${EYEBROW_CLASS} mb-1.5`}>{eyebrow}</p>}
    {title && (
      <h3 className="mb-2 text-lg font-medium tracking-[-0.01em] text-paper-900 dark:text-star-50">
        {title}
      </h3>
    )}
    {intro && <p className={`${BODY_CLASS} ${MUTED_CLASS} mb-4`}>{intro}</p>}
    {children}
  </section>
);

/** 字段：节内子单元（单色 mono 标签 + 正文/内容），无自身分隔线。
 *  用于一个 LlmSection 标题下的多个带标签段落，替代「每个标签一张色卡」。 */
export const LlmField: React.FC<{
  label: string;
  text?: string | null;
  children?: React.ReactNode;
  className?: string;
}> = ({ label, text, children, className = "" }) => {
  if (!text && !children) return null;
  return (
    <div className={className}>
      <p className={`${EYEBROW_CLASS} mb-1.5`}>{label}</p>
      {text ? (
        <LlmProse text={text} />
      ) : (
        <div className={BODY_CLASS}>{children}</div>
      )}
    </div>
  );
};

/** 清单：无框行。bullet=陈金小点；ordered=mono 悬挂序号；rows=发丝线分隔行。 */
export const LlmList: React.FC<{
  items: Array<string | LlmInlineSegment[]>;
  ordered?: boolean;
  variant?: "bullet" | "rows";
  className?: string;
}> = ({ items, ordered = false, variant = "bullet", className = "" }) => {
  const content = (item: string | LlmInlineSegment[]) =>
    typeof item === "string" ? item : renderSegments(item);
  const Tag = ordered ? "ol" : "ul";
  if (variant === "rows") {
    return (
      <Tag
        className={`divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08] ${className}`}
      >
        {items.map((item, i) => (
          <li key={i} className={`${BODY_CLASS} flex gap-3 py-2.5`}>
            <span className="shrink-0 pt-0.5 font-mono text-xs text-paper-500 dark:text-star-400">
              {ordered ? String(i + 1).padStart(2, "0") : "·"}
            </span>
            <span className="min-w-0">{content(item)}</span>
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <Tag className={`space-y-2.5 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className={`${BODY_CLASS} flex gap-3`}>
          {ordered ? (
            <span className="shrink-0 pt-0.5 font-mono text-xs text-paper-500 dark:text-star-400">
              {i + 1}.
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="mt-[0.65em] h-1 w-1 shrink-0 rounded-full bg-accent"
            />
          )}
          <span className="min-w-0">{content(item)}</span>
        </li>
      ))}
    </Tag>
  );
};

/** 引导问/引言：左发丝线 + 衬线斜体，不居中。 */
export const LlmQuote: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <blockquote
    className={`max-w-[68ch] border-l-2 border-paper-900/15 pl-4 font-serif text-[1.0625rem] italic leading-[1.65] text-paper-600 dark:border-star-50/20 dark:text-star-300 ${className}`}
  >
    {children}
  </blockquote>
);

/** 点睛容器：全系统唯一允许的内嵌容器（一层封顶，内部禁止再出现带 border/bg 的块）。 */
export const LlmCallout: React.FC<{
  label?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = "" }) => (
  <div
    className={`max-w-[68ch] rounded-sm border-l-2 border-accent/60 bg-accent/[0.05] px-4 py-3 ${className}`}
  >
    {label && <p className={`${EYEBROW_CLASS} mb-1.5 !text-accent`}>{label}</p>}
    <div className={`${BODY_CLASS} space-y-2.5`}>{children}</div>
  </div>
);

/** 键值行：替代「每个 KV 一张小卡」。 */
export const LlmKV: React.FC<{
  rows: Array<[string, React.ReactNode]>;
  className?: string;
}> = ({ rows, className = "" }) => (
  <dl className={`grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 ${className}`}>
    {rows.map(([k, v], i) => (
      <React.Fragment key={i}>
        <dt className={`${EYEBROW_CLASS} pt-0.5`}>{k}</dt>
        <dd className={BODY_CLASS}>{v}</dd>
      </React.Fragment>
    ))}
  </dl>
);

/** 正文：吃原始 LLM 字符串（或预解析 blocks），输出段落/清单/引言的文档流。 */
export const LlmProse: React.FC<{
  text?: string | null;
  blocks?: LlmBlock[];
  /** 阅读面（长文）可传 font-reading。 */
  className?: string;
}> = ({ text, blocks, className = "" }) => {
  const resolved = blocks ?? normalizeLlmText(text);
  if (!resolved.length) return null;
  return (
    <div className={`space-y-3.5 ${className}`}>
      {resolved.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <p key={i} className={`${EYEBROW_CLASS} pt-2`}>
                {block.text}
              </p>
            );
          case "quote":
            return (
              <LlmQuote key={i}>{renderSegments(block.segments)}</LlmQuote>
            );
          case "list":
            return (
              <LlmList key={i} ordered={block.ordered} items={block.items} />
            );
          default:
            return (
              <p key={i} className={BODY_CLASS}>
                {renderSegments(block.segments)}
              </p>
            );
        }
      })}
    </div>
  );
};

export {
  EYEBROW_CLASS as LLM_EYEBROW_CLASS,
  BODY_CLASS as LLM_BODY_CLASS,
  HAIRLINE_CLASS as LLM_HAIRLINE_CLASS,
};
