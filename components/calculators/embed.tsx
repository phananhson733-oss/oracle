// INPUT: React、useLanguage/useTheme（components/UIComponents）。
// OUTPUT: 计算器 embed widget 基建——EmbedContext/useIsEmbed、EmbedWidgetShell（/embed/<slug> 无 chrome 容器 +
//         dofollow 品牌回链）、EmbedCodeBox（计算器全页底部「复制 iframe 代码」框，embed 上下文内自隐藏）。
// POS: 计算器矩阵（#14）embed 分发层。新计算器加 embed 时：App.tsx 加 /embed/<slug> 路由（包 EmbedWidgetShell）+
//      组件底部渲染 <EmbedCodeBox slug>。若更新此文件，务必更新 calculators/FOLDER.md。

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLanguage, useTheme } from "../UIComponents";

export const SITE_URL = "https://www.astrologywiki.com";

// embed 上下文：在 /embed/<slug> 页内为 true，使 EmbedCodeBox 自隐藏（嵌入页不再嵌套「复制代码」框）。
export const EmbedContext = createContext<boolean>(false);
export const useIsEmbed = (): boolean => useContext(EmbedContext);

// 宿主站点用 <iframe src="https://www.astrologywiki.com/embed/<slug>"> 嵌入；默认高度给足表单+结果，
// 宿主可自行调整。max-width 防止在宽容器里拉伸过宽。
const buildIframeSnippet = (slug: string): string =>
  `<iframe src="${SITE_URL}/embed/${slug}" width="100%" height="720" style="border:0;max-width:560px" loading="lazy" title="AstrologyWiki ${slug}"></iframe>`;

/**
 * 无 chrome 的可嵌入外壳：包裹某计算器组件，提供 embed 上下文，并在底部加一条可见的 dofollow
 * 品牌回链（回站点 canonical 计算器页）。由 App.tsx 的 /embed/<slug> 路由挂载。
 */
export const EmbedWidgetShell: React.FC<{
  slug: string;
  children: React.ReactNode;
}> = ({ slug, children }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const textSecondary = isDark ? "text-star-200" : "text-paper-600";
  const lang = language === "zh" ? "zh" : "en";

  return (
    <EmbedContext.Provider value={true}>
      <div className="min-h-screen">
        {children}
        <div className={`mt-2 mb-6 text-center text-sm ${textSecondary}`}>
          <a
            href={`${SITE_URL}/${lang}/${slug}`}
            target="_blank"
            rel="noopener"
            className="font-semibold text-gold-500 hover:underline"
          >
            Powered by AstrologyWiki
          </a>
        </div>
      </div>
    </EmbedContext.Provider>
  );
};

/**
 * 计算器全页底部的「在你的网站嵌入此计算器」框：展示可复制的 iframe 代码片段。
 * 在 embed 上下文内（即 /embed/<slug> 页）自隐藏，避免嵌入页里又出现复制框。
 */
export const EmbedCodeBox: React.FC<{ slug: string }> = ({ slug }) => {
  const isEmbed = useIsEmbed();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 卸载时清掉「已复制」复位计时器，避免在已卸载组件上 setState。
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  // 嵌入页内不再渲染复制框。
  if (isEmbed) return null;

  const isDark = theme === "dark";
  const zh = language === "zh";
  const cardBg = isDark ? "bg-space-900/60" : "bg-paper-50";
  const cardBorder = isDark ? "border-gold-500/20" : "border-paper-300";
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-600";
  const codeBg = isDark ? "bg-space-800" : "bg-white";

  const snippet = buildIframeSnippet(slug);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(snippet);
        setCopied(true);
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // 复制失败静默降级：用户仍可手动选中文本框内容复制。
    }
  };

  // 渲染为计算器全页底部的最后一个子元素，继承父容器的居中宽度。
  return (
    <div className="pt-2 pb-8">
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-5`}>
        {/* 工具型小标题：用 <p> 而非 <h2>，避免污染计算器页的标题层级 outline。 */}
        <p className={`text-base font-semibold mb-1 ${textPrimary}`}>
          {zh ? "在你的网站嵌入此计算器" : "Embed this calculator on your site"}
        </p>
        <p className={`text-sm mb-3 ${textSecondary}`}>
          {zh
            ? "复制下面的代码，粘贴到你的网页即可嵌入这个免费计算器。"
            : "Copy the snippet below and paste it into your page to embed this free calculator."}
        </p>
        <textarea
          readOnly
          value={snippet}
          rows={3}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={zh ? "嵌入代码" : "Embed code"}
          className={`w-full ${codeBg} border ${cardBorder} rounded-lg p-3 font-mono text-xs ${textPrimary} focus:outline-none focus:ring-2 focus:ring-gold-500/50 resize-none`}
        />
        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 rounded-lg bg-star-50 px-4 py-2 text-sm font-semibold text-space-950 hover:opacity-90 min-h-[44px]"
        >
          {copied
            ? zh
              ? "已复制！"
              : "Copied!"
            : zh
              ? "复制代码"
              : "Copy code"}
        </button>
      </div>
    </div>
  );
};
