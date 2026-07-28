<!-- INPUT: /api/transit/timeline granularity:'year' 的 TimelineCandle/TimelineMarker、buildOhlcSeries、useLanguage、trackEvent。 -->
<!-- OUTPUT: 人生 K 线 v7 整块呈现（LifeKlineSection 及其子组件 + 纯函数派生层 + 双语文案字典 + scoped CSS）。 -->
<!-- POS: components/timeline 的 life 模式专属子目录；TimelinePage life 分支唯一入口是 LifeKlineSection。若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components/timeline/lifekline

架构概要
- 设计 artifact `astrologywiki_embedded_life_kline_v7_rich_hover_cn.html` 的 1:1 复刻（版式/配色/交互），数据换真实 transit 引擎、文案 EN 主 ZH 辅、干支/大运/吉凶不移植。
- 纯函数（lifeKlineDerived）返回文案 key，字典（lifeKlineCopy）存双语串——阈值与文案分离，均可独立测试。
- CSS 独立 scoped（`.lk-` 前缀 + `.lk-scope` 根），不依赖站内纸墨 token；dark/light 主题下呈现一致的浅色区块（用户拍板）。
- 诚实契约：6 领域卡只出定性 In focus/Background 徽章（topAspects natalBody 亲和证据），禁数字分数；paywall 为 fake-door（Register interest 埋点，无支付）；marker 文案带 approximate 语义。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 lifekline 组件结构。
- lifeKlineDerived.ts｜地位：纯函数派生层（TDD）｜功能：buildLifePoints（复用 buildOhlcSeries 的连续 OHLC + MA10 trailing-10 + 影线绘制压缩 wickHigh/wickLow）、pickBubbles（currentAge/土星回归/天王星对分，优先级+交替避让）、11 个阈值 key 函数（阈值对照 artifact；headlineKey 纯数据驱动——current 短路与 currentAge 参数已删）、moduleTierKey（模块卡三档，自 Modules 收编）、cycleCueKey（真实 marker ±1 优先）、moduleState/modulesInFocus（natalBody 亲和表）、clampTooltip、xForAge/yForValue、CHART/MAX_AGE 常量。
- lifeKlineCopy.ts｜地位：双语文案字典｜功能：getLifeKlineCopy(language) 返回 LifeKlineCopy（header/stages/status/解读文案库/modules/paywall/modal/toast/footer 等，含 nodePanel.youAreHere/footer.emptyNote/moduleDetail.unlockShort；headline.current 与历史死键已删）+ fmt 模板替换；EN 倾向语言（may/tends）、禁宿命词、禁 K-Line 字样（SEO 守卫）、禁干支吉凶。
- lifeKline.css｜地位：scoped 样式（artifact 移植 + AA 评审偏离）｜功能：全部类 `.lk-` 前缀 + 元素选择器 `.lk-scope` 限定；变量 `--lk-*`；muted/图表灰字/图例 chip 前景按 AA ≥4.5:1 加深 + 正文字号 +1px（有意偏离 artifact 原值）；svg 选择器收窄到 `.lk-chart-wrap svg` 并带 touch-action:pan-x pan-y；tooltip z-60/toast 80/modal 90；1100px/700px 媒体查询（移动端 svg min-width 1120 横滚）；portal 元素需自带 `.lk-scope` wrapper。
- LifeKlineSection.tsx｜地位：编排容器（TimelinePage life 分支唯一入口）｜功能：state（selectedAge/pinnedAge[真 pin：锁定后 hover 只驱动 tooltip、面板锁定，Escape 解锁、重点击重 pin]/activeModule/hover[与浏览选中同帧 rAF 合流]/modal/toast[pinnedFmt]）、派生 points/bubbles、空数据可见空态、全部 trackEvent 埋点（lifekline_view/candle_pin/unlock_click/modal_open/included_toggle/register_interest，零 PII、StrictMode 防双发）、header+图例、组装全部子组件（子组件 React.memo + 稳定回调）。
- LifeKlineChart.tsx｜地位：SVG 主图｜功能：网格/阶段线（phaseKey 真实边界 12/20/30/43/58/70/88，标签居各区间中心——有意偏离 artifact 装饰值）/MA10 趋势线/100 根蜡烛/选中态/气泡/命中层（R-S 线已按用户反馈移除）；Pointer Events（8px 位移 tap 判定 + touch 后 300ms 抑制合成 mouse）+ 键盘导航（tabIndex/方向键/Enter）；纯受控、React.memo。
- LifeKlineTooltip.tsx｜地位：富 hover tooltip（portal）｜功能：fixed 定位 + clampTooltip 视口避让 + useLayoutEffect 量尺寸；内容 memo（OHLC 四格/能量条/解读/事件·建议·留意/领域 chips）；point/anchor null 即隐藏。
- LifeKlinePanels.tsx｜地位：below 双栏面板｜功能：选中年份节点面板（meta[当前年龄追加 youAreHere 数据化标注]/headline[纯数据驱动]/能量 pill/组合文案/mini-grid 三格）+ cream 简要解读面板（3 条 pattern）。
- LifeKlineModules.tsx｜地位：6 领域卡 + 模块详情｜功能：LifeKlineModulesGrid（6 卡、In focus/Background 徽章、三档正文、锁行）+ LifeKlineModuleDetail（预览 + 2 个 blur 锁定块 + 解锁按钮）；无数字分数。
- LifeKlinePaywall.tsx｜地位：fake-door 三件套（纯展示）｜功能：LifeKlinePaywallPanel（深色渐变面板 + 4 pay-item + Register interest/See what's planned）+ LifeKlineModal（coming-soon modal，Escape/backdrop/focus trap/焦点还原，demo 加 Create your own → onUpsell）+ LifeKlineToast（受控显隐）。

近期更新
- 2026-07-17 图表去噪（用户反馈第二批）：删除支撑/压力线（RsLayer/supportResistance/图例 chip/CSS，金融装饰、占星语义弱）；MA10 图例改白话「十年趋势 / Decade trend」（保留橙色趋势线本体）。图例从 4 chip 减到 3。
- 2026-07-17 上线后视觉修复（用户反馈）：① 影线绘制刻度压缩到 artifact 短须（LifePoint 增 wickHigh/wickLow 绘制端点：真实 peak/dip 超出 body 的部分单调映射进 [1.5,4.2] 能量单位——真实数据年内季度极值与年均值常差 10-30+ 单位，直接画远超 artifact 的 1.4-4.1 装饰值；tooltip 的 high/low 仍显示真实极值不造假）；② 删除头部 K 徽标（lk-kmark JSX+CSS，用户指定去除）。
- 2026-07-17 /ship 对抗评审修复批（Claude+Codex 双模型）：① Chart pointer 处理增主键守卫（右键/中键不再触发 pin 与埋点）；② pinned 状态下键盘 ←/→ 改为静默移动 pin 本身（面板跟随、无 toast/埋点——键盘没有 hover/tooltip 链，原先零反馈），onSelect meta 增 viaKeyboard；③ Panels 当前 K 线解读改三态（delta=0 含首根 doji 显 candleFlat，不再复用上涨文案）；④ copy 逐年语义诚实化（candleRising/Falling/highEasing 的"年初/开盘到收盘"改"比上一年"——open 本就是上一年 close）+ 新增 candleFlat 键 + basisBody 去掉引擎未计算的 progressions/推运。
- 2026-07-17 评审修复批 + 用户拍板 5 项决策落地：① 真 pin 语义（pinnedAge state：锁定后 hover 只驱动 tooltip、面板锁定；Escape 解锁、重点击/Enter 重 pin）；② hover/浏览选中/离开 rAF 同帧合流 + pinnedFmt toast + 子组件 React.memo 化；③ moduleTierKey 自 Modules 收编进 derived、supportResistance 增 r<=s 倒挂护栏；④ copy 键增删（nodePanel.youAreHere/footer.emptyNote/moduleDetail.unlockShort 增；headline.current 与死键删——headlineKey 改纯数据驱动、去 currentAge 参数，"你在这里"改面板 meta 行标注）；⑤ CSS AA 对比度（muted/图表灰字/图例 chip ≥4.5:1）+ 正文字号 +1px（有意偏离 artifact）、svg 选择器收窄 + touch-action；⑥ 阶段竖线/标签对齐 phaseKey 真实边界（去装饰值）；⑦ TimelinePage 增 initialMode prop（demo 页回 month 默认，登录 /timeline 默认 life）+ 页副标题 mode 感知；⑧ 关联后端：lifeArc 年级结果缓存（buildLifeResultCacheKey + TTL）落地，配合前端 30s 客户端超时。
- 2026-07-16 新建：v7 artifact 1:1 复刻整块落地（Phase A 纯函数/文案/CSS + Phase B 五组件 + Phase C Section 编排与 TimelinePage 集成）。经 Codex 方案评审加固（模块徽章双态、Register interest 措辞、Pointer Events、键盘可达、CSS 元素选择器限定、marker approximate）。
