// INPUT: useTheme/useLanguage, embed context, toolSeoContent map.
// OUTPUT: Human-visible landing content for individual calculator pages: summary, use cases, non-duplicative explainer sections, FAQ, and related-tool links in a flatter editorial layout.
// POS: Rendered by ToolPageShell below each interactive tool. Keeps hydrated SPA pages aligned with static SEO stubs.

import React from "react";
import { useLanguage, useTheme } from "../UIComponents";
import { useIsEmbed } from "./embed";
import { getToolSeoContent } from "./toolSeoContent";
import type { ToolCategoryId } from "../tools/toolsCatalog";
import { TOOLS, toolsByCategory } from "../tools/toolsCatalog";
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
    relatedHeading: "Related tools",
    relatedIntro: "Continue with nearby calculators in the same tool family.",
  },
  zh: {
    whenPrefix: "什么时候适合使用",
    guideSuffix: "工具说明",
    guideHeadingPrefix: "关于",
    faqSuffix: "常见问题",
    faqIntro: "使用这个计算器前，用户最常见的问题集中在这里。",
    relatedHeading: "相关工具",
    relatedIntro: "继续查看同一类问题下更接近的计算器。",
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

export const ZH_TOOL_GUIDES: Record<string, ToolSeoContent> = {
  "birth-chart-calculator": {
    title: "本命星盘计算器",
    summary:
      "本命星盘计算器适合在你需要完整出生盘基础时使用：行星、星座、宫位与角度会一起呈现，方便后续阅读关系、行运或年度主题。",
    useCases: [
      "你有出生日期、时间和城市，想先得到一张完整星盘。",
      "你准备使用合盘、组合盘、行运或返照盘，需要可靠的本命盘底图。",
      "你希望直接查看行星落座和度数，而不是只读一段笼统描述。",
    ],
    sections: [
      {
        heading: "什么是本命星盘？",
        body: "本命星盘是你出生那一刻天空位置的象征地图。它把太阳、月亮、行星、上升与天顶放在同一个结构里，提供人格倾向、经验模式和成长主题的计算起点。",
      },
      {
        heading: "如何使用本命星盘计算器",
        body: "输入出生日期、时间与城市。出生时间越准确，上升、宫位和角度越可靠；如果时间不确定，仍可以先看行星星座与大部分基础落座。",
      },
      {
        heading: "如何阅读结果",
        body: "建议先看太阳、月亮和上升，再看水星、金星、火星等个人行星，最后结合宫位、相位和元素分布。不要用单一星座给自己下结论。",
      },
      {
        heading: "阅读边界",
        body: "本命盘描述倾向和象征语言，不预测固定事件。它更适合作为自我观察和学习占星概念的入口。",
      },
    ],
    faqs: [
      {
        heading: "本命星盘计算器免费吗？",
        body: "可以免费使用。你可以先得到基础星盘数据，再决定是否继续阅读百科或其他工具。",
      },
      {
        heading: "没有出生时间还能算吗？",
        body: "可以，但上升、宫位和角度需要谨慎。太阳、部分月亮和多数行星星座仍然有参考价值。",
      },
      {
        heading: "本命盘会预测我的命运吗？",
        body: "不会。这里把本命盘作为学习和自我观察工具，不把结果当作固定命运。",
      },
    ],
  },
  "big-three-calculator": {
    title: "日月升计算器",
    summary:
      "日月升计算器把太阳、月亮和上升放在一起，适合快速建立一张星盘的核心轮廓：身份感、情绪需求和面对世界的方式。",
    useCases: [
      "你想快速确认自己的太阳、月亮与上升星座。",
      "你在读完整本命盘前，需要先抓住最核心的三组信息。",
      "你想比较自我认同、内在情绪和外在呈现之间的差异。",
    ],
    sections: [
      {
        heading: "什么是日月升？",
        body: "日月升指太阳星座、月亮星座和上升星座。太阳偏向身份和意志，月亮偏向情绪和安全感，上升描述第一印象、反应方式和宫位起点。",
      },
      {
        heading: "为什么需要出生时间？",
        body: "太阳通常只靠日期即可确定，月亮在换座日可能需要时间，上升则高度依赖出生时刻和地点。没有准确时间时，上升结果不可靠。",
      },
      {
        heading: "如何解读日月升",
        body: "不要把三者看作彼此冲突的标签。它们更像三个视角：我是谁、我如何感受、我如何进入世界。组合阅读比单独看某一个更有意义。",
      },
      {
        heading: "下一步怎么读",
        body: "确认日月升后，可以进入完整本命盘，查看水星、金星、火星、宫位与相位，让核心三角放回完整结构中。",
      },
    ],
    faqs: [
      {
        heading: "日月升哪个最重要？",
        body: "没有单一最重要。它们分别描述不同层面，组合起来才构成更完整的基础画像。",
      },
      {
        heading: "不知道出生时间能查日月升吗？",
        body: "可以查太阳和多数情况下的月亮，但上升星座需要准确时间和出生地。",
      },
      {
        heading: "为什么我的三个星座不同？",
        body: "太阳、月亮和地平线移动速度不同，所以它们常落在不同星座，这正是星盘比单一太阳星座更细的原因。",
      },
    ],
  },
  "moon-sign-calculator": {
    title: "月亮星座计算器",
    summary:
      "月亮星座计算器适合查看情绪本能、舒适需求和内在节奏，是从太阳星座进入个人星盘的一个自然下一步。",
    useCases: [
      "你只知道出生日期，想快速了解情绪层面的星座。",
      "你正在比较太阳、月亮和上升，想补齐内在感受这一层。",
      "你的生日接近月亮换座，需要用时间进一步确认。",
    ],
    sections: [
      {
        heading: "什么是月亮星座？",
        body: "月亮星座是你出生时月亮所在的黄道星座。它常被用来描述情绪反应、安全感需求、亲密关系中的本能和自我安抚方式。",
      },
      {
        heading: "如何计算月亮星座",
        body: "输入出生日期即可查询。月亮大约每两天半换一个星座，所以大多数日期只需要日期；如果当天发生换座，出生时间会提高准确度。",
      },
      {
        heading: "如何阅读月亮结果",
        body: "月亮描述的是内在需求和情绪习惯，不是你必须成为的样子。把它和太阳、上升放在一起读，可以避免把某个星座解释得过窄。",
      },
      {
        heading: "适合继续查看什么",
        body: "如果月亮结果引起兴趣，可以继续查看完整本命盘中的月亮宫位、月亮相位，以及与月相相关的天象工具。",
      },
    ],
    faqs: [
      {
        heading: "月亮星座需要出生时间吗？",
        body: "多数情况下不需要；只有生日当天月亮换座时，出生时间才会影响结果。",
      },
      {
        heading: "月亮星座和太阳星座有什么区别？",
        body: "太阳偏向身份和意志，月亮偏向情绪本能和安全感，两者都只是完整星盘的一部分。",
      },
      {
        heading: "月亮星座能说明关系模式吗？",
        body: "它可以提供情绪需求的线索，但关系需要结合两个人的完整星盘和真实沟通来理解。",
      },
    ],
  },
  "rising-sign-calculator": {
    title: "上升星座计算器",
    summary:
      "上升星座计算器适合在你有准确出生时间和地点时使用，用来确认星盘的入口、第一印象和宫位结构。",
    useCases: [
      "你知道出生时间和城市，想确认自己的上升星座。",
      "你正在建立日月升，需要补齐外在呈现和宫位起点。",
      "你想理解为什么出生时间会明显改变星盘结构。",
    ],
    sections: [
      {
        heading: "什么是上升星座？",
        body: "上升星座是出生时东方地平线升起的星座。它常用于描述一个人进入环境的方式、第一印象，也决定整张星盘宫位如何展开。",
      },
      {
        heading: "为什么出生时间很重要",
        body: "上升变化很快，大约每两小时换一个星座，度数也会持续移动。缺少准确时间时，上升、宫位和天顶都只能谨慎参考。",
      },
      {
        heading: "如何阅读上升结果",
        body: "上升不是面具意义上的虚假，而是你与外界接触的入口。把它和太阳、月亮一起读，能看见内在与外在之间的协调或张力。",
      },
      {
        heading: "接下来可以看什么",
        body: "确认上升后，可以继续查看完整本命盘中的宫位、天顶、下降点，以及上升守护星的位置。",
      },
    ],
    faqs: [
      {
        heading: "上升星座一定要出生时间吗？",
        body: "是的。没有出生时间，上升星座无法可靠计算。",
      },
      {
        heading: "出生时间差几分钟会有影响吗？",
        body: "通常度数会变动；若接近换座或宫位边界，几分钟也可能影响解释。",
      },
      {
        heading: "上升星座比太阳星座更真实吗？",
        body: "不是更真实，而是描述不同层面。太阳偏内在身份，上升偏接触世界的方式。",
      },
    ],
  },
  "current-planets": {
    title: "当前行星位置",
    summary:
      "当前行星位置工具展示某一天的天空快照：每颗行星所在星座、度数与逆行状态，适合先看事实数据再进入解释。",
    useCases: [
      "你想知道今天或某一天行星分别在哪个星座。",
      "你在阅读行运文章，需要一份当前天空参考。",
      "你想先确认天文位置，再判断它是否与你的本命盘相关。",
    ],
    sections: [
      {
        heading: "当前行星位置是什么？",
        body: "它是某个时刻从地球视角看到的行星黄道位置。工具按星座和度数列出太阳、月亮与主要行星，并标记逆行状态。",
      },
      {
        heading: "如何使用这个工具",
        body: "选择日期，查看每颗行星所在星座与度数。这里的星座位置是通用天空数据，不需要个人出生信息。",
      },
      {
        heading: "如何理解逆行与度数",
        body: "逆行是从地球看见的视运动现象，不表示行星真的倒退。度数用于更细地定位行星，适合和本命盘相位一起研究。",
      },
      {
        heading: "如何和个人星盘结合",
        body: "如果你想知道当前天空如何触碰自己的星盘，需要把这些行星位置与本命盘中的行星和宫位比较。",
      },
    ],
    faqs: [
      {
        heading: "当前位置会因城市不同而变吗？",
        body: "行星星座和度数通常不因城市改变；上升和宫位才高度依赖地点。",
      },
      {
        heading: "Rx 是什么意思？",
        body: "Rx 表示逆行，从地球视角看行星似乎后退，是轨道运动造成的视觉现象。",
      },
      {
        heading: "当前行星位置是在预测今天吗？",
        body: "不是。它只是天文位置快照，解释需要结合具体语境。",
      },
    ],
  },
  "ephemeris-calculator": {
    title: "星历表计算器",
    summary:
      "星历表计算器适合生成一段日期内的行星位置表，用来追踪换座、逆行、停滞和行运研究的基础数据。",
    useCases: [
      "你需要按天、按周或按月查看行星位置。",
      "你正在查某颗行星什么时候换座或逆行。",
      "你想在写解读前先拿到可核验的数据表。",
    ],
    sections: [
      {
        heading: "什么是星历表？",
        body: "星历表是一张按日期列出天体位置的表格。占星师用它追踪行星换座、逆行、停滞和相位形成的时间。",
      },
      {
        heading: "如何生成星历表",
        body: "选择起始日期、结束日期和间隔。工具会按所选范围列出主要行星的星座、度数和逆行标记。",
      },
      {
        heading: "如何阅读表格",
        body: "纵向看某颗行星，可以发现它什么时候进入新星座或接近停滞；横向看某一天，可以得到那天的天空整体状态。",
      },
      {
        heading: "数据边界",
        body: "表格来自 Swiss Ephemeris 计算。很长的日期范围会被限制以保持可读性，可以用更大的间隔覆盖更长时间。",
      },
    ],
    faqs: [
      {
        heading: "星历表适合做什么？",
        body: "适合查行星位置、换座、逆行和行运背景，是解释前的基础数据。",
      },
      {
        heading: "可以查任意年份吗？",
        body: "可以在较宽日期范围内查询；范围过大时建议改用每周或每月间隔。",
      },
      {
        heading: "星历表会解释含义吗？",
        body: "不会主动下结论。它提供位置数据，含义需要结合本命盘或具体问题阅读。",
      },
    ],
  },
  "moon-phase-calculator": {
    title: "月相计算器",
    summary:
      "月相计算器用于查询任意一天的月相、受照比例、盈亏方向以及月亮所在星座，适合做月周期观察。",
    useCases: [
      "你想查看今天、过去或未来某天的月相。",
      "你在写日记、做复盘或安排内容，需要月周期参考。",
      "你想区分月相和月亮星座这两个不同概念。",
    ],
    sections: [
      {
        heading: "什么是月相？",
        body: "月相是从地球看到月亮受太阳照亮部分的形状，来自太阳、地球和月亮之间的角度关系。",
      },
      {
        heading: "如何计算月相",
        body: "工具计算太阳和月亮的角距，并映射到新月、上弦、满月、下弦等八个阶段，同时显示受照比例和盈亏方向。",
      },
      {
        heading: "月相和月亮星座有什么不同",
        body: "月相描述月亮的光，月亮星座描述月亮在黄道上的位置。两者可以一起看，但不能互相替代。",
      },
      {
        heading: "如何使用结果",
        body: "把月相当作时间节奏的提示，而不是事件预言。若想知道个人层面的月亮主题，可以回到本命盘看你的出生月亮。",
      },
    ],
    faqs: [
      {
        heading: "今天是什么月相？",
        body: "保留默认日期即可查看今天的月相、受照比例和月亮星座。",
      },
      {
        heading: "受照比例是什么意思？",
        body: "它表示从地球可见的月面中有多少比例被太阳照亮。",
      },
      {
        heading: "月相结果是在预测情绪吗？",
        body: "不是。月相是天文现象，解释只适合作为观察节奏的材料。",
      },
    ],
  },
  "rodden-rating": {
    title: "Rodden 评级",
    summary:
      "Rodden 评级工具用于判断出生时间来源的可靠程度，帮助你知道星盘里哪些部分可以放心使用，哪些需要保留不确定性。",
    useCases: [
      "你的出生时间来自记忆、家人、证件或传记，想判断可信度。",
      "你不确定上升、宫位或精确月亮是否应该使用。",
      "你准备读盘，需要先标注出生数据质量。",
    ],
    sections: [
      {
        heading: "什么是 Rodden 评级？",
        body: "Rodden 评级是一套出生时间来源可信度系统。它评价的是时间资料来源，不评价星盘好坏。",
      },
      {
        heading: "为什么时间来源重要",
        body: "上升和宫位移动很快，时间不准会直接影响角度与宫位。行星星座通常更稳定，但月亮和角度仍可能受影响。",
      },
      {
        heading: "如何使用这个工具",
        body: "选择你的出生时间来源，工具会给出对应等级、可信范围和哪些星盘要素需要谨慎使用。",
      },
      {
        heading: "低评级怎么办",
        body: "低评级并不代表星盘无效。可以先阅读行星星座，也可以寻找原始记录或做出生时间校正。",
      },
    ],
    faqs: [
      {
        heading: "AA 是最可靠吗？",
        body: "是。AA 通常表示来自官方出生记录，是 Rodden 体系中最可靠的等级。",
      },
      {
        heading: "没有出生时间还能学占星吗？",
        body: "可以。行星星座和不少相位仍可阅读，只是上升、宫位和角度要谨慎。",
      },
      {
        heading: "Rodden 评级会改变我的星盘吗？",
        body: "不会。它只说明数据可信度，帮助你决定哪些结果可以重点参考。",
      },
    ],
  },
  "energy-timeline": {
    title: "能量时间轴",
    summary:
      "能量时间轴把行运活跃度可视化成日度节奏，适合观察某段时间哪些日子更繁忙、哪些日子更安静。",
    useCases: [
      "你想看一段时间的行运强弱，而不是只看某一天。",
      "你希望区分活跃度和好坏判断，不把高峰当成结论。",
      "你想先看公开示例，再用自己的出生资料生成个人时间轴。",
    ],
    sections: [
      {
        heading: "什么是能量时间轴？",
        body: "能量时间轴把移动行星和本命盘之间的关系整理成日度图形，让你看到行运主题的起伏节奏。",
      },
      {
        heading: "图上的蜡烛怎么看",
        body: "蜡烛高度表示当天行运活跃度范围，方向只描述变化，不代表好坏、幸运或危险。",
      },
      {
        heading: "如何阅读高峰",
        body: "高峰表示主题更集中或更响亮，适合观察、复盘和安排精力；它不等于事件一定发生。",
      },
      {
        heading: "如何生成个人时间轴",
        body: "公开页面展示示例盘。要查看自己的节奏，需要输入出生日期、时间和城市，让行运与本命盘对应。",
      },
    ],
    faqs: [
      {
        heading: "高能量代表好日子吗？",
        body: "不代表。高低只表示行运活跃度，不表示好坏。",
      },
      {
        heading: "能量时间轴是预测工具吗？",
        body: "不是。它呈现行运节奏，用于自我观察和计划参考。",
      },
      {
        heading: "没有出生时间可以用吗？",
        body: "可以尝试，但角度和宫位相关主题会不够精确。",
      },
    ],
  },
  "electional-astrology": {
    title: "择时占星",
    summary:
      "择时占星工具展示未来数日的月相、月亮星座和相位平衡，适合作为安排计划时的中性天空参考。",
    useCases: [
      "你想比较未来 7、14 或 30 天的天空节奏。",
      "你需要一个不承诺结果的时机参考。",
      "你想看月相、月亮星座和相位平衡如何变化。",
    ],
    sections: [
      {
        heading: "什么是择时占星？",
        body: "择时占星关注行动发生时的天空状态。这里把它处理成中性参考：展示天象条件，不指定唯一正确日期。",
      },
      {
        heading: "工具如何判断基调",
        body: "工具计算每日月相、月亮星座，以及主要行星之间和谐相位与紧张相位的数量，生成 Flowing、Mixed 或 Dynamic 的描述。",
      },
      {
        heading: "如何阅读结果",
        body: "Flowing 表示和谐相位更多，Dynamic 表示张力相位更多，Mixed 表示大致均衡。它们都不是好坏评分。",
      },
      {
        heading: "负责任地使用",
        body: "现实计划、资源和判断始终优先。工具只提供背景节奏，不保证任何结果。",
      },
    ],
    faqs: [
      {
        heading: "择时工具会告诉我最幸运的一天吗？",
        body: "不会。它展示天象平衡，不做幸运或保证结果的判断。",
      },
      {
        heading: "Dynamic 是坏日子吗？",
        body: "不是。Dynamic 只表示张力相位较多，可能更适合需要行动和调整的主题。",
      },
      {
        heading: "最多能看多少天？",
        body: "当前可以查看 7、14 或 30 天的天象时机。",
      },
    ],
  },
  "solar-return-calculator": {
    title: "太阳回归盘",
    summary:
      "太阳回归盘工具用于计算某一年太阳回到你出生黄经位置的精确时刻，并展示那一刻的行星位置。",
    useCases: [
      "你想知道某一年生日盘的精确时间。",
      "你在阅读年度主题前，需要先得到太阳回归盘数据。",
      "你想把年度盘和本命盘一起比较。",
    ],
    sections: [
      {
        heading: "什么是太阳回归？",
        body: "太阳回归是每年太阳回到你出生时所在黄经度数的时刻。以这个时刻起盘，就是常说的年度生日盘。",
      },
      {
        heading: "如何计算太阳回归盘",
        body: "输入出生信息并选择年份。工具会先计算本命太阳位置，再求出该年太阳回到同一位置的时间。",
      },
      {
        heading: "出生时间有什么影响",
        body: "出生时间越准确，本命太阳位置和回归时刻越精确。缺少时间时可以估算，但年度盘角度和宫位要谨慎。",
      },
      {
        heading: "如何阅读年度主题",
        body: "把太阳回归盘当作某一岁阶段的主题地图，而不是事件清单。最好和本命盘一起比较。",
      },
    ],
    faqs: [
      {
        heading: "太阳回归一定在生日当天吗？",
        body: "通常在生日当天前后一天内，因为日历年和太阳年并不完全相同。",
      },
      {
        heading: "太阳回归盘需要出生时间吗？",
        body: "需要时间会更精确；没有时间时只能得到更粗略的结果。",
      },
      {
        heading: "太阳回归盘是在预测一年吗？",
        body: "不是固定预测。它更适合作为年度主题和复盘框架。",
      },
    ],
  },
  "saturn-return-calculator": {
    title: "土星回归计算器",
    summary:
      "土星回归计算器用于查看土星回到本命位置的时间窗口，适合把二十七到三十岁等人生阶段放进周期语境里理解。",
    useCases: [
      "你想知道第一次、第二次或第三次土星回归的大致窗口。",
      "你只有出生日期，也想先获得可用的土星周期参考。",
      "你想把土星回归日期和完整本命盘一起阅读。",
    ],
    sections: [
      {
        heading: "什么是土星回归？",
        body: "土星回归是土星回到你出生时所在位置的周期。第一次通常发生在 27 到 30 岁左右，常被用来理解责任、结构和成熟主题。",
      },
      {
        heading: "为什么是一个时间窗口",
        body: "土星移动缓慢并会逆行，因此回归不是单一天，而是一段反复接近本命位置的时间。",
      },
      {
        heading: "如何使用结果",
        body: "查看开始、精确和结束时间，把它当作阶段性复盘线索，而不是事件预测。",
      },
      {
        heading: "如何继续深入",
        body: "若想理解它落在你星盘哪个宫位、与哪些行星相连，需要结合完整本命盘和行运工具。",
      },
    ],
    faqs: [
      {
        heading: "土星回归需要出生时间吗？",
        body: "日期已能给出有用窗口；出生时间主要影响宫位和更细的个人化阅读。",
      },
      {
        heading: "土星回归一定很困难吗？",
        body: "不一定。它常被视为责任和结构主题变强的阶段，不代表必然发生坏事。",
      },
      {
        heading: "为什么会有多次土星回归？",
        body: "土星约 29.5 年绕行一周，所以人生中可能经历第一次、第二次和第三次回归。",
      },
    ],
  },
  "synastry-calculator": {
    title: "合盘计算器",
    summary:
      "合盘计算器用于比较两张本命盘之间的相位连接，帮助你观察关系里的吸引、摩擦、支持和成长主题，而不是给关系打分。",
    useCases: [
      "你想看两个人的星盘互动结构，而不是寻找一个兼容分数。",
      "你有两个人的出生日期和城市，想查看主要交叉相位。",
      "你想把合盘与组合盘一起作为关系阅读的两个视角。",
    ],
    sections: [
      {
        heading: "什么是合盘？",
        body: "合盘把两个人的本命盘放在一起，测量一个人的行星与另一个人的行星之间形成的角度关系。",
      },
      {
        heading: "如何使用合盘计算器",
        body: "分别输入两个人的出生日期和城市；如果有出生时间，月亮、上升和角度会更可靠。名字只用于页面显示。",
      },
      {
        heading: "如何阅读相位",
        body: "拱相和六分相常描述顺畅，刑相和冲相描述张力与成长，合相表示能量融合。任何一种都不是好坏判决。",
      },
      {
        heading: "隐私和边界",
        body: "工具计算的是几何关系，不替代真实沟通。姓名不会上传；出生数据只用于计算星盘。",
      },
    ],
    faqs: [
      {
        heading: "合盘会给关系打分吗？",
        body: "不会。它展示相位模式，不把关系压缩成分数。",
      },
      {
        heading: "没有出生时间能做合盘吗？",
        body: "可以看多数行星相位，但月亮、上升和宫位需要谨慎。",
      },
      {
        heading: "合盘能决定关系结果吗？",
        body: "不能。关系结果来自真实互动、选择和环境，星盘只提供观察语言。",
      },
    ],
  },
  "composite-calculator": {
    title: "组合盘计算器",
    summary:
      "组合盘计算器把两张星盘的对应位置取中点，生成一张代表关系本身的星盘，适合与合盘一起阅读。",
    useCases: [
      "你想把一段关系作为独立主题来观察。",
      "你已经看过合盘，想换一个关系视角。",
      "你想查看中点落座，但不希望上传姓名或私人备注。",
    ],
    sections: [
      {
        heading: "什么是组合盘？",
        body: "组合盘是把两个人本命盘中对应行星取中点后形成的一张关系盘。它不代表任何一方，而是象征关系本身的结构。",
      },
      {
        heading: "如何生成组合盘",
        body: "输入两个人的出生信息，工具会先计算两张本命盘，再计算各行星中点，并列出组合盘的星座和度数。",
      },
      {
        heading: "如何阅读组合盘",
        body: "可以像读本命盘一样阅读组合太阳、月亮和行星，但对象是关系主题，而不是某个人的性格。",
      },
      {
        heading: "组合盘和合盘的区别",
        body: "合盘看两张盘之间的相位互动；组合盘把两张盘合成一张关系盘。两者适合互相补充。",
      },
    ],
    faqs: [
      {
        heading: "组合盘代表谁？",
        body: "它代表关系本身的象征结构，不代表其中某一个人。",
      },
      {
        heading: "组合盘需要出生时间吗？",
        body: "日期和城市可以计算多数行星中点；时间会让月亮、上升和角度更准确。",
      },
      {
        heading: "组合盘能判断关系会不会长久吗？",
        body: "不能。它提供主题语言，不做关系结果预测。",
      },
    ],
  },
  astrocartography: {
    title: "地缘占星地图",
    summary:
      "地缘占星地图把出生时的行星角线投射到世界地图上，适合探索地点主题，而不是用来决定哪里一定适合你。",
    useCases: [
      "你有准确出生时间，想查看自己的行星角线地图。",
      "你想比较某些城市附近出现了哪些 AC、DC、MC、IC 线。",
      "你希望把地点当作反思线索，而不是迁居建议。",
    ],
    sections: [
      {
        heading: "什么是地缘占星？",
        body: "地缘占星把出生那一刻的天空投射到地球地图上，标出每颗行星在各地升起、落下、上中天或下中天的位置。",
      },
      {
        heading: "为什么必须有出生时间",
        body: "角线随地球自转快速移动，出生时间每差一小时，线的位置大约会移动十五度经度。",
      },
      {
        heading: "如何阅读地图线",
        body: "MC 表示上中天，IC 表示下中天，AC 表示升起，DC 表示落下。每条线提示某个行星主题在地点语境中被强调。",
      },
      {
        heading: "如何负责任地使用",
        body: "地图线不是搬家建议，也不保证某个地点的结果。它更适合作为旅行、迁居或地点记忆的象征参照。",
      },
    ],
    faqs: [
      {
        heading: "地缘占星能预测搬家结果吗？",
        body: "不能。它展示出生天空与地点的几何关系，不预测事件。",
      },
      {
        heading: "没有出生时间可以看地图吗？",
        body: "不建议。角线非常依赖出生时刻，没有时间会导致位置偏差很大。",
      },
      {
        heading: "AC、DC、MC、IC 分别是什么？",
        body: "AC 是升起线，DC 是落下线，MC 是上中天线，IC 是下中天线。",
      },
    ],
  },
  "celebrity-twins": {
    title: "名人同星座",
    summary:
      "名人同星座工具用出生月日匹配与你太阳星座相同的公开人物，适合作为轻量、低门槛的占星入口。",
    useCases: [
      "你只想用生日快速查看太阳星座相关例子。",
      "你想通过公开人物理解元素、三模态和星座风格。",
      "你不想输入出生时间或城市，也想先体验一个轻量工具。",
    ],
    sections: [
      {
        heading: "什么是名人同星座？",
        body: "它列出与你太阳星座相同的公开人物。因为太阳星座主要由出生日期决定，所以不需要出生时间。",
      },
      {
        heading: "如何匹配",
        body: "选择出生月和日，工具会判断你的太阳星座，并展示同星座或同元素的名人示例。",
      },
      {
        heading: "如何理解这些匹配",
        body: "同星座只是一个共同点，不代表性格相同。完整星盘还包括月亮、上升、行星、宫位和相位。",
      },
      {
        heading: "关于交界日期",
        body: "如果生日在换座边界附近，太阳星座可能因年份和时间不同而变化。完整本命盘更可靠。",
      },
    ],
    faqs: [
      {
        heading: "需要出生时间吗？",
        body: "不需要。这个工具只按太阳星座匹配，出生月日即可。",
      },
      {
        heading: "为什么同星座的人差异很大？",
        body: "因为太阳星座只是完整星盘的一部分，其它行星和宫位会带来很多差异。",
      },
      {
        heading: "交界日怎么办？",
        body: "如果生日接近换座日，建议用完整本命盘确认太阳星座。",
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
  if (slug && ZH_TOOL_GUIDES[slug]) return ZH_TOOL_GUIDES[slug];

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
  const currentTool = TOOLS.find((item) => item.slug === slug);
  const relatedTools = currentTool
    ? toolsByCategory(currentTool.category)
        .filter((tool) => tool.slug !== slug)
        .slice(0, 3)
    : [];

  return (
    <div className="mt-16 space-y-12 border-t border-paper-300/80 pt-10 dark:border-gold-500/10">
      <section
        aria-label={`${content.title} overview`}
        className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"
      >
        <p className="font-mono text-xs font-semibold text-accent">
          {overviewBadge}
        </p>
        <p className={`text-base leading-relaxed md:text-lg ${textSecondary}`}>
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

      {relatedTools.length > 0 && (
        <section aria-labelledby={`${slug}-related`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id={`${slug}-related`}
                className={`font-serif text-2xl leading-tight ${textPrimary}`}
              >
                {copy.relatedHeading}
              </h2>
              <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
                {copy.relatedIntro}
              </p>
            </div>
            <a
              href={`/${language}/tools`}
              className="text-sm font-semibold text-accent underline-offset-4 transition-colors hover:text-accent-hover hover:underline"
            >
              {language === "zh" ? "返回工具中心" : "Back to tools"}
            </a>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {relatedTools.map((tool, index) => (
              <a
                key={tool.slug}
                href={`/${language}/${tool.slug}`}
                className={`rounded-2xl border p-5 transition-all duration-300 ease-in-out hover:border-accent/35 hover:shadow-xl ${panelTone}`}
              >
                <span className="font-mono text-xs font-semibold text-accent">
                  0{index + 1}
                </span>
                <h3
                  className={`mt-3 font-serif text-xl leading-tight ${textPrimary}`}
                >
                  {language === "zh" ? tool.title.zh : tool.title.en}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed ${textSecondary}`}>
                  {language === "zh" ? tool.blurb.zh : tool.blurb.en}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ToolSeoLandingSections;
