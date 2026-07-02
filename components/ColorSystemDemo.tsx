// INPUT: 色彩系统演示组件
// OUTPUT: 展示旧色彩系统的应用示例（部分模式已被编辑部纸墨系统取代）
// POS: 【过时】开发参考组件 —— 其中 hover:scale / shadow-glow / 渐变卡片等模式已被 COLOR_SYSTEM_GUIDE.md 禁用，参考请以该文档为准；本页仅作历史演示待重写。

import React from 'react';
import {
  SEMANTIC_COLORS,
  FEATURE_COLORS,
  INTERACTIVE_STATES,
  DATA_VIZ_COLORS,
} from './design-tokens';

// 统一过渡动画
const TRANSITION = "transition-all duration-300 ease-in-out";

// 标准按钮基础样式
const buttonBase = `
  py-3 px-8 rounded-xl
  font-medium
  ${TRANSITION}
  hover:scale-[1.02] hover:shadow-lg
  active:scale-[0.98]
`;

// 标准卡片基础样式
const cardBase = `
  p-8 rounded-2xl
  bg-space-900/40
  ${TRANSITION}
  hover:shadow-xl
`;

/**
 * 色彩系统演示组件
 *
 * 遵循项目级 UI 执行规范：
 * - 简洁 · 极简 · 现代
 * - 充足的空白空间 (p-6/p-8, gap-4/gap-6)
 * - 统一过渡动画 (transition-all duration-300 ease-in-out)
 * - 避免多层卡片嵌套
 * - 标题使用 font-bold + leading-tight
 */
export const ColorSystemDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-space-950 text-star-50 p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* 标题区域 */}
        <header className="space-y-4">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-star-50">
            色彩系统演示
          </h1>
          <p className="text-lg text-star-200 max-w-2xl leading-relaxed">
            展示新色彩系统在实际组件中的应用方式，遵循「简洁 · 极简 · 现代」的设计哲学。
          </p>
        </header>

        {/* 1. 语义色彩 - 状态反馈 */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold leading-tight text-star-50">
              语义色彩
            </h2>
            <p className="text-star-200">状态反馈 — 成功、警告、错误、信息</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 成功状态 */}
            <div className={`
              p-6 rounded-2xl
              ${SEMANTIC_COLORS.success.bgLight}
              ${TRANSITION}
              hover:shadow-xl hover:scale-[1.02]
            `}>
              <div className="flex items-center gap-4 mb-4">
                <span className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${SEMANTIC_COLORS.success.bg} text-star-50 text-lg
                `}>
                  ✓
                </span>
                <span className={`text-lg font-bold ${SEMANTIC_COLORS.success.text}`}>
                  成功
                </span>
              </div>
              <p className="text-sm text-star-200 leading-relaxed">
                报告生成成功！您的本命盘分析已准备就绪。
              </p>
            </div>

            {/* 警告状态 */}
            <div className={`
              p-6 rounded-2xl
              ${SEMANTIC_COLORS.warning.bgLight}
              ${TRANSITION}
              hover:shadow-xl hover:scale-[1.02]
            `}>
              <div className="flex items-center gap-4 mb-4">
                <span className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${SEMANTIC_COLORS.warning.bg} text-star-50 text-lg
                `}>
                  !
                </span>
                <span className={`text-lg font-bold ${SEMANTIC_COLORS.warning.text}`}>
                  警告
                </span>
              </div>
              <p className="text-sm text-star-200 leading-relaxed">
                您的积分余额不足，请充值后继续使用。
              </p>
            </div>

            {/* 错误状态 */}
            <div className={`
              p-6 rounded-2xl
              ${SEMANTIC_COLORS.danger.bgLight}
              ${TRANSITION}
              hover:shadow-xl hover:scale-[1.02]
            `}>
              <div className="flex items-center gap-4 mb-4">
                <span className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${SEMANTIC_COLORS.danger.bg} text-star-50 text-lg
                `}>
                  ✕
                </span>
                <span className={`text-lg font-bold ${SEMANTIC_COLORS.danger.text}`}>
                  错误
                </span>
              </div>
              <p className="text-sm text-star-200 leading-relaxed">
                无法连接到服务器，请检查网络连接。
              </p>
            </div>

            {/* 信息状态 */}
            <div className={`
              p-6 rounded-2xl
              ${SEMANTIC_COLORS.info.bgLight}
              ${TRANSITION}
              hover:shadow-xl hover:scale-[1.02]
            `}>
              <div className="flex items-center gap-4 mb-4">
                <span className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${SEMANTIC_COLORS.info.bg} text-star-50 text-lg
                `}>
                  i
                </span>
                <span className={`text-lg font-bold ${SEMANTIC_COLORS.info.text}`}>
                  提示
                </span>
              </div>
              <p className="text-sm text-star-200 leading-relaxed">
                新功能上线：现在支持合盘深度分析！
              </p>
            </div>
          </div>
        </section>

        {/* 2. 功能域色彩 */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold leading-tight text-star-50">
              功能域色彩
            </h2>
            <p className="text-star-200">建立视觉识别 — 占星、心理学、洞察</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 占星功能 - 紫色 */}
            <div className={`
              p-8 rounded-2xl
              ${FEATURE_COLORS.astrology.light}
              ${TRANSITION}
              hover:shadow-xl hover:scale-[1.01]
            `}>
              <div className="flex items-start gap-6 mb-6">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  ${FEATURE_COLORS.astrology.primaryBg}
                  text-star-50 text-2xl
                `}>
                  ✨
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className={`text-xl font-bold leading-tight ${FEATURE_COLORS.astrology.primary}`}>
                    占星功能
                  </h3>
                  <p className="text-sm text-star-400">神秘 · 灵性</p>
                </div>
              </div>
              <p className="text-star-200 leading-relaxed mb-6">
                本命盘、合盘、流年运势等占星核心功能使用神秘紫色，营造神秘感。
              </p>
              <button className={`
                w-full py-3 px-6 rounded-xl
                ${FEATURE_COLORS.astrology.primaryBg}
                text-star-50 font-medium
                ${TRANSITION}
                hover:scale-[1.02] hover:shadow-lg hover:shadow-mystic-500/20
                active:scale-[0.98]
              `}>
                查看星盘
              </button>
            </div>

            {/* 心理学功能 - 蓝色 */}
            <div className={`
              p-8 rounded-2xl
              ${FEATURE_COLORS.psychology.light}
              ${TRANSITION}
              hover:shadow-xl hover:scale-[1.01]
            `}>
              <div className="flex items-start gap-6 mb-6">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  ${FEATURE_COLORS.psychology.primaryBg}
                  text-star-50 text-2xl
                `}>
                  🧠
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className={`text-xl font-bold leading-tight ${FEATURE_COLORS.psychology.primary}`}>
                    心理学功能
                  </h3>
                  <p className="text-sm text-star-400">专业 · 信任</p>
                </div>
              </div>
              <p className="text-star-200 leading-relaxed mb-6">
                CBT日记、情绪追踪等心理学功能使用专业蓝色，建立信任感。
              </p>
              <button className={`
                w-full py-3 px-6 rounded-xl
                ${FEATURE_COLORS.psychology.primaryBg}
                text-star-50 font-medium
                ${TRANSITION}
                hover:scale-[1.02] hover:shadow-lg hover:shadow-psycho-500/20
                active:scale-[0.98]
              `}>
                记录情绪
              </button>
            </div>

            {/* 洞察功能 - 金色 */}
            <div className={`
              p-8 rounded-2xl
              ${FEATURE_COLORS.insights.light}
              ${TRANSITION}
              hover:shadow-xl hover:scale-[1.01]
            `}>
              <div className="flex items-start gap-6 mb-6">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  ${FEATURE_COLORS.insights.primaryBg}
                  text-space-950 text-2xl
                `}>
                  💎
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className={`text-xl font-bold leading-tight ${FEATURE_COLORS.insights.primary}`}>
                    深度洞察
                  </h3>
                  <p className="text-sm text-star-400">高价值 · 品牌</p>
                </div>
              </div>
              <p className="text-star-200 leading-relaxed mb-6">
                报告生成、深度分析等高价值功能保持使用品牌金色。
              </p>
              <button className={`
                w-full py-3 px-6 rounded-xl
                ${FEATURE_COLORS.insights.gradient}
                text-space-950 font-medium
                ${TRANSITION}
                hover:scale-[1.02] shadow-glow
                active:scale-[0.98]
              `}>
                生成报告
              </button>
            </div>
          </div>
        </section>

        {/* 3. 交互状态示例 */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold leading-tight text-star-50">
              交互状态
            </h2>
            <p className="text-star-200">清晰的反馈 — 悬停、激活、禁用</p>
          </div>

          {/* 按钮状态 */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold leading-tight text-star-50">按钮状态</h3>
            <div className="flex flex-wrap gap-6">
              <button className={`${buttonBase} ${INTERACTIVE_STATES.button.primary.default}`}>
                主要按钮
              </button>
              <button className={`${buttonBase} ${INTERACTIVE_STATES.button.astrology.default}`}>
                占星按钮
              </button>
              <button className={`${buttonBase} ${INTERACTIVE_STATES.button.psychology.default}`}>
                心理学按钮
              </button>
              <button
                className={`${buttonBase} ${INTERACTIVE_STATES.button.primary.default} opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none`}
                disabled
              >
                禁用状态
              </button>
            </div>
          </div>

          {/* 卡片状态 */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold leading-tight text-star-50">卡片状态</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${cardBase} cursor-default`}>
                <h4 className="text-lg font-bold mb-2">默认状态</h4>
                <p className="text-sm text-star-400 leading-relaxed">普通卡片样式，无交互效果</p>
              </div>
              <div className={`${cardBase} cursor-pointer hover:scale-[1.02] hover:bg-space-900/60`}>
                <h4 className="text-lg font-bold mb-2">悬停状态</h4>
                <p className="text-sm text-star-400 leading-relaxed">鼠标悬停时放大并加深背景</p>
              </div>
              <div className={`${cardBase} bg-space-900/60 border-l border-accent cursor-pointer`}>
                <h4 className="text-lg font-bold mb-2">激活状态</h4>
                <p className="text-sm text-star-400 leading-relaxed">选中时显示左侧强调边框</p>
              </div>
            </div>
          </div>

          {/* 链接状态 */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold leading-tight text-star-50">链接状态</h3>
            <div className="space-y-4 text-star-200">
              <p className="leading-relaxed">
                这是一个
                <a href="#" className={`mx-1 ${INTERACTIVE_STATES.link.default} ${INTERACTIVE_STATES.link.hover} ${TRANSITION}`}>
                  普通链接
                </a>
                的示例，悬停时会显示下划线。
              </p>
              <p className="leading-relaxed">
                查看更多关于
                <a href="#" className={`mx-1 text-mystic-400 hover:text-mystic-300 hover:underline ${TRANSITION}`}>
                  占星功能
                </a>
                或
                <a href="#" className={`mx-1 text-psycho-400 hover:text-psycho-300 hover:underline ${TRANSITION}`}>
                  心理学功能
                </a>
                的介绍。
              </p>
            </div>
          </div>
        </section>

        {/* 4. 数据可视化色彩 */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold leading-tight text-star-50">
              数据可视化
            </h2>
            <p className="text-star-200">直观的信息传达 — 情绪色谱、行星色彩</p>
          </div>

          {/* 情绪色谱 */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold leading-tight text-star-50">情绪色谱（CBT功能）</h3>
            <div className="flex gap-4">
              {Object.entries(DATA_VIZ_COLORS.mood).map(([key, className]) => (
                <div key={key} className="flex-1 space-y-3">
                  <div className={`
                    h-24 rounded-2xl flex items-center justify-center
                    ${className}
                    text-2xl font-medium
                    ${TRANSITION}
                    hover:scale-105 hover:shadow-lg
                  `}>
                    {key === 'veryPositive' && '😊'}
                    {key === 'positive' && '🙂'}
                    {key === 'neutral' && '😐'}
                    {key === 'negative' && '😟'}
                    {key === 'veryNegative' && '😢'}
                  </div>
                  <p className="text-sm text-center text-star-400 font-medium">
                    {key === 'veryPositive' && '非常积极'}
                    {key === 'positive' && '积极'}
                    {key === 'neutral' && '中性'}
                    {key === 'negative' && '消极'}
                    {key === 'veryNegative' && '非常消极'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 行星色彩 */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold leading-tight text-star-50">行星色彩（占星功能）</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(DATA_VIZ_COLORS.planets).map(([planet, className]) => (
                <div
                  key={planet}
                  className={`
                    flex items-center gap-4 p-4 rounded-2xl
                    bg-space-900/30
                    ${TRANSITION}
                    hover:bg-space-900/50 hover:scale-[1.02]
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl
                    bg-space-800/80 flex items-center justify-center
                    ${className} font-bold text-lg
                  `}>
                    {planet[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium capitalize">{planet}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 使用指南 */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold leading-tight text-star-50">
              使用指南
            </h2>
            <p className="text-star-200">快速参考 — 色彩层次、功能域、对比度</p>
          </div>

          <div className={`p-8 rounded-2xl bg-space-900/40 space-y-8`}>
            {/* 色彩层次 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold leading-tight text-star-50">
                1. 色彩层次（60/30/10 规则）
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-accent">60%</div>
                  <div className="text-star-50 font-medium">主导色</div>
                  <div className="text-sm text-star-400">背景和大面积使用</div>
                  <div className="text-xs text-star-400 font-mono">space-950 / paper-100</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-accent">30%</div>
                  <div className="text-star-50 font-medium">次要色</div>
                  <div className="text-sm text-star-400">卡片、容器、分组</div>
                  <div className="text-xs text-star-400 font-mono">space-900 / paper-50</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-accent">10%</div>
                  <div className="text-star-50 font-medium">强调色</div>
                  <div className="text-sm text-star-400">按钮、链接、重要元素</div>
                  <div className="text-xs text-star-400 font-mono">accent / mystic / psycho</div>
                </div>
              </div>
            </div>

            {/* 功能域色彩 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold leading-tight text-star-50">
                2. 功能域色彩
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-mystic-500 flex items-center justify-center text-star-50 text-xl">✨</div>
                  <div>
                    <div className="text-star-50 font-medium">占星功能</div>
                    <div className="text-sm text-star-400">mystic（紫色）- 神秘、灵性</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-psycho-500 flex items-center justify-center text-star-50 text-xl">🧠</div>
                  <div>
                    <div className="text-star-50 font-medium">心理学功能</div>
                    <div className="text-sm text-star-400">psycho（蓝色）- 专业、信任</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-space-950 text-xl">💎</div>
                  <div>
                    <div className="text-star-50 font-medium">洞察/报告</div>
                    <div className="text-sm text-star-400">accent（金色）- 高价值、品牌</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 对比度要求 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold leading-tight text-star-50">
                3. 对比度要求
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-star-50">4.5:1</div>
                  <div className="text-sm text-star-400">正文文本最低对比度</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-star-50">3:1</div>
                  <div className="text-sm text-star-400">大标题 (18px+) / UI 组件</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-star-50">WCAG AA</div>
                  <div className="text-sm text-star-400">可访问性标准</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 页脚 */}
        <footer className="pt-8 border-t border-space-800/50">
          <p className="text-sm text-star-400 text-center">
            查看详细文档：<code className="mx-1 px-2 py-1 rounded bg-space-900/60 text-accent">COLOR_SYSTEM_GUIDE.md</code>
          </p>
        </footer>

      </div>
    </div>
  );
};
