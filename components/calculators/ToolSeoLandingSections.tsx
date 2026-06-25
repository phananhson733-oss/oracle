// INPUT: useTheme/useLanguage, embed context, toolSeoContent map.
// OUTPUT: Human-visible landing content for individual calculator pages: summary, use cases, non-duplicative explainer sections, FAQ in a flatter editorial layout.
// POS: Rendered by ToolPageShell below each interactive tool. Keeps hydrated SPA pages aligned with static SEO stubs.

import React from "react";
import { useLanguage, useTheme } from "../UIComponents";
import { useIsEmbed } from "./embed";
import { getToolSeoContent } from "./toolSeoContent";
import type { ToolCategoryId } from "../tools/toolsCatalog";
import { TOOLS } from "../tools/toolsCatalog";
import type { ToolSeoContent } from "./toolSeoContent";

interface ToolSeoLandingSectionsProps {
  slug?: string;
}

const COPY = {
  en: {
    whenPrefix: "When to use",
    guideSuffix: "guide",
    guideHeadingPrefix: "About",
    faqSuffix: "FAQ",
    faqIntro:
      "Quick answers for the questions people usually have before using this calculator.",
  },
  zh: {
    whenPrefix: "什么时候适合使用",
    guideSuffix: "工具说明",
    guideHeadingPrefix: "关于",
    faqSuffix: "常见问题",
    faqIntro: "使用这个计算器前，用户最常见的问题集中在这里。",
  },
} as const;

const ZH_CATEGORY_GUIDES: Record<
  ToolCategoryId,
  {
    summary: (title: string) => string;
    useCases: string[];
    sections: (title: string) => { heading: string; body: string }[];
    faqs: (title: string) => { heading: string; body: string }[];
  }
> = {
  "core-signs": {
    summary: (title) =>
      `${title} 适合用来建立个人星盘的基础坐标：从出生信息中提取关键星位，再把结果放回完整星盘语境里阅读。`,
    useCases: [
      "你想先确认太阳、月亮、上升或本命盘基础位置。",
      "你需要一个进入完整星盘解读前的可靠计算结果。",
      "你希望把星座描述当作自我观察线索，而不是标签或结论。",
    ],
    sections: (title) => [
      {
        heading: `${title} 的作用`,
        body: "这类工具把出生日期、时间与地点转换为星盘中的具体位置。它提供的是可核验的计算起点，帮助你理解身份感、情绪需求、外在表达或完整本命盘结构。",
      },
      {
        heading: "使用前准备",
        body: "出生日期是基础；涉及上升、宫位或角度时，需要尽量准确的出生时间与城市。若时间不确定，可以先阅读不依赖精确时间的结果，再谨慎看待宫位和上升相关内容。",
      },
      {
        heading: "如何阅读结果",
        body: "结果描述的是倾向、心理功能与经验模式，不是固定命运。建议先看核心星位，再结合行星、星座、宫位与相位，避免只用单一星座定义自己。",
      },
      {
        heading: "继续深入",
        body: "计算完成后，可以回到工具中心查看行运、关系合盘、太阳回归或百科文章，把单个结果放进更完整的学习路径中。",
      },
    ],
    faqs: (title) => [
      {
        heading: `${title} 免费吗？`,
        body: "可以免费使用。工具会给出基础计算结果，适合作为进一步阅读星盘与百科内容的入口。",
      },
      {
        heading: "我一定需要出生时间吗？",
        body: "不一定。太阳、月亮等部分结果通常只需要日期；上升、宫位、天顶和角度相关内容需要更准确的出生时间与地点。",
      },
      {
        heading: "这些结果是在预测未来吗？",
        body: "不是。这里把占星当作自我观察和象征理解的语言，重点是倾向、模式与主题，而不是事件预测。",
      },
    ],
  },
  "charts-astronomy": {
    summary: (title) =>
      `${title} 用于查看天空数据本身：行星位置、月相、星历表或出生时间可信度，适合作为解读前的事实层。`,
    useCases: [
      "你想先查看可核验的天文位置，再进入解释。",
      "你正在研究行运、月相、逆行或星历变化。",
      "你需要判断出生时间数据是否足以支撑上升、宫位或角度解读。",
    ],
    sections: (title) => [
      {
        heading: `${title} 提供什么`,
        body: "这类工具聚焦天文与数据层：行星在哪个星座、处于多少度、是否逆行，或某个日期的月相与星历变化。它让你先看到天空本身，再决定如何解释。",
      },
      {
        heading: "如何使用数据",
        body: "先确认日期、时间范围或出生时间来源，再查看表格、列表或评级结果。若你要做个人化解读，可以把这些数据与本命盘或行运工具结合使用。",
      },
      {
        heading: "阅读边界",
        body: "行星位置和月相是事实数据，但意义需要结合语境。不要把单个天象当成结论，它更适合作为观察当下节奏和学习占星语言的材料。",
      },
      {
        heading: "计算来源",
        body: "工具使用 Swiss Ephemeris 相关天文计算。结果用于学习与参考，不替代专业建议，也不构成医学、法律或财务判断。",
      },
    ],
    faqs: (title) => [
      {
        heading: `${title} 使用真实天文数据吗？`,
        body: "是。工具基于 Swiss Ephemeris 相关计算展示位置或表格数据。",
      },
      {
        heading: "这些天象会因地点不同而改变吗？",
        body: "行星星座和度数通常不因城市改变；上升、宫位、天顶等角度相关内容才高度依赖地点和时间。",
      },
      {
        heading: "看到逆行或紧张相位需要担心吗？",
        body: "不需要。这里的标记用于描述天空状态，不做吉凶判断，也不把天象等同于事件结果。",
      },
    ],
  },
  "timing-forecast": {
    summary: (title) =>
      `${title} 适合用来观察行运、返照或周期节奏，把时间看作主题语言，而不是对结果的断言。`,
    useCases: [
      "你想观察一段时间内哪些主题更活跃。",
      "你正在比较返照、土星回归、择时或能量时间轴。",
      "你希望用中性的方式理解时机，不把工具当作吉凶判断。",
    ],
    sections: (title) => [
      {
        heading: `${title} 的时间视角`,
        body: "这类工具关注天空如何随时间移动：行运的活跃度、太阳或土星回到关键位置、某段日期的月相和相位平衡。它帮助你观察节奏，而不是给出固定答案。",
      },
      {
        heading: "如何使用",
        body: "选择日期、年份或时间范围，查看工具生成的周期、表格或图形。把结果当作背景信息，和你的真实计划、状态与选择一起考虑。",
      },
      {
        heading: "如何阅读结果",
        body: "高峰、回归或动态相位并不代表好坏。它们更像提醒你哪些主题值得留意：责任、调整、行动、休息、关系或长期成长。",
      },
      {
        heading: "避免宿命化",
        body: "工具不预测事件，也不保证结果。它提供可解释的时间结构，帮助你更有意识地安排观察、复盘和行动。",
      },
    ],
    faqs: (title) => [
      {
        heading: `${title} 是预测工具吗？`,
        body: "不是。它呈现时间与天象模式，用于自我观察和计划参考，不预测具体事件。",
      },
      {
        heading: "结果中的强弱或高峰代表好坏吗？",
        body: "不代表。强弱通常表示活跃度或主题集中度，不等于好坏、幸运或危险。",
      },
      {
        heading: "我应该完全按工具结果安排生活吗？",
        body: "不应该。工具结果只是背景信息，最终仍要结合现实条件、个人判断和专业建议。",
      },
    ],
  },
  relationships: {
    summary: (title) =>
      `${title} 适合比较两张星盘，观察关系中的吸引、摩擦、支持与共同模式，而不是给关系打分。`,
    useCases: [
      "你想理解两个人之间的互动结构，而不是寻找绝对答案。",
      "你需要比较合盘、组合盘或双方关键星位。",
      "你希望用尊重边界的方式阅读关系主题。",
    ],
    sections: (title) => [
      {
        heading: `${title} 如何看关系`,
        body: "关系类工具把两份出生资料放在一起，观察行星之间的相位、组合盘中点或共同主题。它描述互动模式，不评价关系价值，也不替任何人做决定。",
      },
      {
        heading: "使用前准备",
        body: "至少需要双方出生日期；若有出生时间和城市，月亮、上升、宫位和角度相关内容会更可靠。姓名仅用于页面展示时，应避免把隐私资料写入 URL。",
      },
      {
        heading: "如何阅读关系结果",
        body: "和谐相位可能表示顺畅，紧张相位可能表示需要沟通和成长。两者都不是好坏标签，而是帮助你看见关系里反复出现的互动方式。",
      },
      {
        heading: "负责任地使用",
        body: "合盘不能替代真实沟通，也不应用来判断关系是否值得继续。把结果当作讨论入口，而不是裁决。",
      },
    ],
    faqs: (title) => [
      {
        heading: `${title} 会给关系打分吗？`,
        body: "不会。工具展示模式、相位或组合盘结构，不把关系简化成分数。",
      },
      {
        heading: "没有出生时间可以使用吗？",
        body: "可以使用日期进行基础比较；缺少时间时，月亮精度、上升、宫位和角度需要谨慎解读。",
      },
      {
        heading: "合盘能决定一段关系的结果吗？",
        body: "不能。关系结果来自真实互动、选择和环境，星盘只能提供观察语言。",
      },
    ],
  },
  "places-discovery": {
    summary: (title) =>
      `${title} 用于把星盘放进更大的参照系：地点、地图或公开人物数据，帮助你从另一个角度理解象征。`,
    useCases: [
      "你想把出生星盘放到地图、地点或人物参照中观察。",
      "你需要一个轻量入口，再决定是否绘制完整星盘。",
      "你想用探索式方式学习占星，而不是立即进入长篇解读。",
    ],
    sections: (title) => [
      {
        heading: `${title} 的探索方式`,
        body: "这类工具把星盘信息与外部参照结合：可能是地理线、城市、公开人物或同元素分组。它提供新的观察角度，不代表某个地点或人物对你有固定意义。",
      },
      {
        heading: "如何使用",
        body: "按工具要求输入出生日期、时间或地点，查看地图、列表或匹配结果。涉及地点线时，准确出生时间会显著影响结果。",
      },
      {
        heading: "如何理解结果",
        body: "地图线、名人参照和分组更适合作为学习材料。它们帮助你理解象征语言如何被放大、比较或定位，不应被当作人生建议。",
      },
      {
        heading: "继续阅读",
        body: "如果某个结果引起兴趣，可以回到出生星盘、行星、宫位或相位百科中继续拆解，而不是只停留在单个匹配项上。",
      },
    ],
    faqs: (title) => [
      {
        heading: `${title} 需要准确出生时间吗？`,
        body: "部分地点类工具需要，尤其是涉及角度线或宫位时。仅按日期匹配的探索工具则不一定需要。",
      },
      {
        heading: "地点线或匹配结果代表固定结论吗？",
        body: "不代表。它们是象征参照和学习线索，不应替代现实判断。",
      },
      {
        heading: "这些结果可以和完整星盘一起读吗？",
        body: "可以。完整星盘能提供更稳定的基础，帮助你理解单个地点或匹配结果在整体结构中的位置。",
      },
    ],
  },
};

const localizedContent = (
  baseContent: ToolSeoContent,
  slug: string | undefined,
  language: "en" | "zh",
): ToolSeoContent => {
  if (language !== "zh") return baseContent;

  const tool = TOOLS.find((item) => item.slug === slug);
  const title = tool?.title.zh ?? baseContent.title;
  const guide = tool ? ZH_CATEGORY_GUIDES[tool.category] : null;
  if (!guide) {
    return {
      ...baseContent,
      title,
      summary: `${title} 提供可阅读的计算结果，适合作为学习占星语言和理解个人模式的入口。`,
    };
  }

  return {
    title,
    summary: guide.summary(title),
    useCases: guide.useCases,
    sections: guide.sections(title),
    faqs: guide.faqs(title),
  };
};

export const ToolSeoLandingSections: React.FC<ToolSeoLandingSectionsProps> = ({
  slug,
}) => {
  const baseContent = getToolSeoContent(slug);
  const isEmbed = useIsEmbed();
  const { language } = useLanguage();
  const { theme } = useTheme();

  if (!baseContent || isEmbed) return null;

  const isDark = theme === "dark";
  const copy = language === "zh" ? COPY.zh : COPY.en;
  const content = localizedContent(baseContent, slug, language);
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-700";
  const mutedText = isDark ? "text-star-300" : "text-paper-600";
  const ruleTone = isDark ? "border-gold-500/10" : "border-paper-300/80";
  const panelTone = isDark
    ? "border-gold-500/15 bg-space-900/45"
    : "border-paper-300/80 bg-paper-100/70";
  const overviewBadge = `${content.title} ${copy.guideSuffix}`;
  const guideHeading =
    language === "zh"
      ? `${copy.guideHeadingPrefix}${content.title}`
      : `${copy.guideHeadingPrefix} ${content.title}`;
  const faqHeading = `${content.title} ${copy.faqSuffix}`;

  return (
    <div className="mt-16 space-y-12 border-t border-paper-300/80 pt-10 dark:border-gold-500/10">
      <section
        aria-label={`${content.title} overview`}
        className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"
      >
        <p className="font-mono text-xs font-semibold text-accent">
          {overviewBadge}
        </p>
        <p
          className={`text-base leading-relaxed md:text-lg ${textSecondary}`}
        >
          {content.summary}
        </p>
      </section>

      <section
        aria-labelledby={`${slug}-when-to-use`}
        className={`rounded-2xl border p-6 transition-all duration-300 ease-in-out sm:p-8 ${panelTone}`}
      >
        <h2
          id={`${slug}-when-to-use`}
          className={`font-serif text-2xl leading-tight ${textPrimary}`}
        >
          {copy.whenPrefix} {content.title}?
        </h2>
        <ul
          className={`mt-5 grid gap-4 text-sm leading-relaxed md:grid-cols-3 ${textSecondary}`}
        >
          {content.useCases.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="font-mono text-xs font-semibold text-accent">
                0{index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${slug}-guide`}>
        <h2
          id={`${slug}-guide`}
          className={`font-serif text-2xl leading-tight ${textPrimary}`}
        >
          {guideHeading}
        </h2>
        <div className="mt-5 grid gap-x-8 gap-y-7 lg:grid-cols-2">
          {content.sections.map((section) => (
            <article
              key={section.heading}
              className={`border-t pt-5 ${ruleTone}`}
            >
              <h3 className={`font-serif text-xl leading-tight ${textPrimary}`}>
                {section.heading}
              </h3>
              <p className={`mt-3 text-sm leading-relaxed ${textSecondary}`}>
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby={`${slug}-faq`}
        className={`rounded-2xl border p-6 transition-all duration-300 ease-in-out sm:p-8 ${panelTone}`}
      >
        <div className="max-w-3xl">
          <h2
            id={`${slug}-faq`}
            className={`font-serif text-2xl leading-tight ${textPrimary}`}
          >
            {faqHeading}
          </h2>
          <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
            {copy.faqIntro}
          </p>
        </div>
        <div className="mt-5 divide-y divide-paper-300/70 dark:divide-gold-500/10">
          {content.faqs.map((faq) => (
            <details
              key={faq.heading}
              className="group py-4 first:pt-0 last:pb-0"
            >
              <summary
                className={`cursor-pointer list-none font-serif text-lg leading-snug ${textPrimary}`}
              >
                <span className="flex items-start justify-between gap-4">
                  <span>{faq.heading}</span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 text-xl leading-none text-accent transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className={`mt-3 text-sm leading-relaxed ${textSecondary}`}>
                {faq.body}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ToolSeoLandingSections;
