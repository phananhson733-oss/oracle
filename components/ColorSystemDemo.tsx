// INPUT: 色彩系统演示组件
// OUTPUT: 展示新色彩系统的实际应用示例
// POS: 开发参考组件，展示设计 token 的正确使用方式

import React from 'react';
import {
  SEMANTIC_COLORS,
  FEATURE_COLORS,
  INTERACTIVE_STATES,
  DATA_VIZ_COLORS,
  COLOR_HIERARCHY
} from './design-tokens';

/**
 * 色彩系统演示组件
 *
 * 此组件展示了新色彩系统的各种应用场景：
 * 1. 语义色彩 - 状态反馈
 * 2. 功能域色彩 - 占星/心理学/洞察
 * 3. 交互状态 - 按钮/链接/卡片
 * 4. 数据可视化 - 情绪/行星/图表
 */
export const ColorSystemDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-space-950 text-star-50 p-8 space-y-12">
      {/* 标题 */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-serif font-semibold mb-2 text-star-50">
          色彩系统演示
        </h1>
        <p className="text-star-200">
          展示新色彩系统在实际组件中的应用方式
        </p>
      </div>

      {/* 1. 语义色彩 - 状态反馈 */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-serif font-semibold mb-6 text-star-50">
          1. 语义色彩 - 状态反馈
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 成功状态 */}
          <div className={`p-6 rounded-xl border ${SEMANTIC_COLORS.success.bgLight} ${SEMANTIC_COLORS.success.borderLight} ${SEMANTIC_COLORS.success.hover} transition-all`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${SEMANTIC_COLORS.success.bgMedium} ${SEMANTIC_COLORS.success.border} mb-3`}>
              <span className={`w-2 h-2 rounded-full ${SEMANTIC_COLORS.success.bg}`}></span>
              <span className={`text-sm font-medium ${SEMANTIC_COLORS.success.text}`}>成功</span>
            </div>
            <p className="text-sm text-star-200">
              报告生成成功！您的本命盘分析已准备就绪。
            </p>
          </div>

          {/* 警告状态 */}
          <div className={`p-6 rounded-xl border ${SEMANTIC_COLORS.warning.bgLight} ${SEMANTIC_COLORS.warning.borderLight} ${SEMANTIC_COLORS.warning.hover} transition-all`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${SEMANTIC_COLORS.warning.bgMedium} ${SEMANTIC_COLORS.warning.border} mb-3`}>
              <span className={`w-2 h-2 rounded-full ${SEMANTIC_COLORS.warning.bg}`}></span>
              <span className={`text-sm font-medium ${SEMANTIC_COLORS.warning.text}`}>警告</span>
            </div>
            <p className="text-sm text-star-200">
              您的积分余额不足，请充值后继续使用。
            </p>
          </div>

          {/* 错误状态 */}
          <div className={`p-6 rounded-xl border ${SEMANTIC_COLORS.danger.bgLight} ${SEMANTIC_COLORS.danger.borderLight} ${SEMANTIC_COLORS.danger.hover} transition-all`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${SEMANTIC_COLORS.danger.bgMedium} ${SEMANTIC_COLORS.danger.border} mb-3`}>
              <span className={`w-2 h-2 rounded-full ${SEMANTIC_COLORS.danger.bg}`}></span>
              <span className={`text-sm font-medium ${SEMANTIC_COLORS.danger.text}`}>错误</span>
            </div>
            <p className="text-sm text-star-200">
              无法连接到服务器，请检查网络连接。
            </p>
          </div>

          {/* 信息状态 */}
          <div className={`p-6 rounded-xl border ${SEMANTIC_COLORS.info.bgLight} ${SEMANTIC_COLORS.info.borderLight} ${SEMANTIC_COLORS.info.hover} transition-all`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${SEMANTIC_COLORS.info.bgMedium} ${SEMANTIC_COLORS.info.border} mb-3`}>
              <span className={`w-2 h-2 rounded-full ${SEMANTIC_COLORS.info.bg}`}></span>
              <span className={`text-sm font-medium ${SEMANTIC_COLORS.info.text}`}>提示</span>
            </div>
            <p className="text-sm text-star-200">
              新功能上线：现在支持合盘深度分析！
            </p>
          </div>
        </div>
      </section>

      {/* 2. 功能域色彩 */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-serif font-semibold mb-6 text-star-50">
          2. 功能域色彩 - 建立视觉识别
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 占星功能 - 紫色 */}
          <div className={`p-6 rounded-xl border ${FEATURE_COLORS.astrology.light} ${FEATURE_COLORS.astrology.border} ${FEATURE_COLORS.astrology.hover} transition-all`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${FEATURE_COLORS.astrology.primaryBg} flex items-center justify-center`}>
                <span className="text-white text-xl">✨</span>
              </div>
              <h3 className={`text-lg font-semibold ${FEATURE_COLORS.astrology.primary}`}>
                占星功能
              </h3>
            </div>
            <p className="text-sm text-star-200 mb-4">
              本命盘、合盘、流年运势等占星核心功能使用神秘紫色，营造神秘感。
            </p>
            <button className={`w-full py-2 px-4 rounded-lg ${FEATURE_COLORS.astrology.primaryBg} text-white font-medium transition-all ${INTERACTIVE_STATES.button.astrology.hover} ${INTERACTIVE_STATES.button.astrology.active}`}>
              查看星盘
            </button>
          </div>

          {/* 心理学功能 - 蓝色 */}
          <div className={`p-6 rounded-xl border ${FEATURE_COLORS.psychology.light} ${FEATURE_COLORS.psychology.border} ${FEATURE_COLORS.psychology.hover} transition-all`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${FEATURE_COLORS.psychology.primaryBg} flex items-center justify-center`}>
                <span className="text-white text-xl">🧠</span>
              </div>
              <h3 className={`text-lg font-semibold ${FEATURE_COLORS.psychology.primary}`}>
                心理学功能
              </h3>
            </div>
            <p className="text-sm text-star-200 mb-4">
              CBT日记、情绪追踪等心理学功能使用专业蓝色，建立信任感。
            </p>
            <button className={`w-full py-2 px-4 rounded-lg ${FEATURE_COLORS.psychology.primaryBg} text-white font-medium transition-all ${INTERACTIVE_STATES.button.psychology.hover} ${INTERACTIVE_STATES.button.psychology.active}`}>
              记录情绪
            </button>
          </div>

          {/* 洞察功能 - 金色 */}
          <div className={`p-6 rounded-xl border ${FEATURE_COLORS.insights.light} ${FEATURE_COLORS.insights.border} ${FEATURE_COLORS.insights.hover} transition-all`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${FEATURE_COLORS.insights.primaryBg} flex items-center justify-center`}>
                <span className="text-space-950 text-xl">💎</span>
              </div>
              <h3 className={`text-lg font-semibold ${FEATURE_COLORS.insights.primary}`}>
                深度洞察
              </h3>
            </div>
            <p className="text-sm text-star-200 mb-4">
              报告生成、深度分析等高价值功能保持使用品牌金色。
            </p>
            <button className={`w-full py-2 px-4 rounded-lg ${FEATURE_COLORS.insights.gradient} text-space-950 font-medium transition-all ${INTERACTIVE_STATES.button.primary.hover} ${INTERACTIVE_STATES.button.primary.active} ${FEATURE_COLORS.insights.glow}`}>
              生成报告
            </button>
          </div>
        </div>
      </section>

      {/* 3. 交互状态示例 */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-serif font-semibold mb-6 text-star-50">
          3. 交互状态 - 清晰的反馈
        </h2>

        {/* 按钮状态 */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-star-200">按钮状态</h3>
          <div className="flex flex-wrap gap-4">
            <button className={`py-2 px-6 rounded-lg ${INTERACTIVE_STATES.button.primary.default} ${INTERACTIVE_STATES.button.primary.hover} ${INTERACTIVE_STATES.button.primary.active} transition-all`}>
              主要按钮
            </button>
            <button className={`py-2 px-6 rounded-lg ${INTERACTIVE_STATES.button.astrology.default} ${INTERACTIVE_STATES.button.astrology.hover} ${INTERACTIVE_STATES.button.astrology.active} transition-all`}>
              占星按钮
            </button>
            <button className={`py-2 px-6 rounded-lg ${INTERACTIVE_STATES.button.psychology.default} ${INTERACTIVE_STATES.button.psychology.hover} ${INTERACTIVE_STATES.button.psychology.active} transition-all`}>
              心理学按钮
            </button>
            <button className={`py-2 px-6 rounded-lg ${INTERACTIVE_STATES.button.primary.default} ${INTERACTIVE_STATES.button.primary.disabled} transition-all`} disabled>
              禁用状态
            </button>
          </div>
        </div>

        {/* 卡片状态 */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-star-200">卡片状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-6 rounded-xl bg-space-900/60 border ${INTERACTIVE_STATES.card.default} transition-all cursor-default`}>
              <h4 className="font-medium mb-2">默认状态</h4>
              <p className="text-sm text-star-400">普通卡片样式</p>
            </div>
            <div className={`p-6 rounded-xl bg-space-900/60 border ${INTERACTIVE_STATES.card.default} ${INTERACTIVE_STATES.card.hover} transition-all cursor-pointer`}>
              <h4 className="font-medium mb-2">悬停状态</h4>
              <p className="text-sm text-star-400">鼠标悬停时的样式</p>
            </div>
            <div className={`p-6 rounded-xl bg-space-900/80 border ${INTERACTIVE_STATES.card.active} transition-all cursor-pointer`}>
              <h4 className="font-medium mb-2">激活状态</h4>
              <p className="text-sm text-star-400">选中或激活时的样式</p>
            </div>
          </div>
        </div>

        {/* 链接状态 */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-star-200">链接状态</h3>
          <div className="space-y-2">
            <p>
              这是一个 <a href="#" className={`${INTERACTIVE_STATES.link.default} ${INTERACTIVE_STATES.link.hover} transition-colors`}>普通链接</a> 的示例。
            </p>
            <p>
              这是一个 <a href="#" className={`${INTERACTIVE_STATES.link.default} ${INTERACTIVE_STATES.link.hover} ${INTERACTIVE_STATES.link.visited} transition-colors`}>已访问链接</a> 的示例。
            </p>
          </div>
        </div>
      </section>

      {/* 4. 数据可视化色彩 */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-serif font-semibold mb-6 text-star-50">
          4. 数据可视化 - 直观的信息传达
        </h2>

        {/* 情绪色谱 */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-star-200">情绪色谱（CBT功能）</h3>
          <div className="flex gap-2">
            {Object.entries(DATA_VIZ_COLORS.mood).map(([key, className]) => (
              <div key={key} className="flex-1">
                <div className={`h-20 rounded-lg ${className} flex items-center justify-center font-medium transition-transform hover:scale-105`}>
                  {key === 'veryPositive' && '😊'}
                  {key === 'positive' && '🙂'}
                  {key === 'neutral' && '😐'}
                  {key === 'negative' && '😟'}
                  {key === 'veryNegative' && '😢'}
                </div>
                <p className="text-xs text-center mt-2 text-star-400">
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
        <div>
          <h3 className="text-lg font-medium mb-4 text-star-200">行星色彩（占星功能）</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(DATA_VIZ_COLORS.planets).map(([planet, className]) => (
              <div key={planet} className="flex items-center gap-3 p-3 rounded-lg bg-space-900/40 border border-space-700/50">
                <div className={`w-8 h-8 rounded-full bg-space-800 flex items-center justify-center ${className} font-bold text-lg`}>
                  {planet[0].toUpperCase()}
                </div>
                <span className="text-sm capitalize">{planet}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用指南 */}
      <section className="max-w-6xl mx-auto">
        <div className="p-8 rounded-xl bg-space-900/40 border border-accent/20">
          <h2 className="text-2xl font-serif font-semibold mb-4 text-star-50">
            使用指南
          </h2>
          <div className="space-y-4 text-star-200">
            <div>
              <h3 className="font-semibold text-star-50 mb-2">1. 色彩层次（60/30/10 规则）</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>主导色（60%）：背景和大面积使用 - space-950, paper-100</li>
                <li>次要色（30%）：卡片、容器 - space-900, paper-50</li>
                <li>强调色（10%）：按钮、链接 - accent, mystic, psycho</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-star-50 mb-2">2. 功能域色彩</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>占星功能：使用 mystic（紫色）- 神秘、灵性</li>
                <li>心理学功能：使用 psycho（蓝色）- 专业、信任</li>
                <li>洞察/报告：使用 accent（金色）- 高价值、品牌</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-star-50 mb-2">3. 对比度要求</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>文本对比度：至少 4.5:1（WCAG AA 标准）</li>
                <li>UI 组件对比度：至少 3:1</li>
                <li>在 light 和 dark 模式下都要测试</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
