<!-- INPUT: hooks/useCityAutocomplete、components/forms/DateSelectGroup、services/apiClient（fetchNatalChart/searchCities）、services/analytics、types。 -->
<!-- OUTPUT: 计算器矩阵（D）——配置驱动的出生数据计算器外壳 + 各 sign 类 slug 的配置。 -->
<!-- POS: components/calculators 子目录索引；若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components/calculators

架构概要
- SEO 计算器矩阵（D）两类：
  - **sign 类**（出生数据）：一个配置驱动外壳承载所有计算器，复用现有 `/api/natal/chart`，不新增后端。
  - **天象工具类**（无出生数据）：纯天文工具，复用 `/api/astro/*`（today/positions/moon-phase/ephemeris），无 LLM、无位置、无 PII。
- 双渲染：静态 SEO stub（`scripts/generate-seo-pages.mjs` 的 `CALCULATOR_SEO` 循环）给爬虫读关键词正文 + WebApplication/FAQPage JSON-LD + sitemap；inject-spa 水合成本目录的交互组件。
- 新公开路由必须加进 `App.tsx` 的 `isPublicRoute` 白名单（否则运行时 noindex 杀收录）。
- 显示刻意用行星/星座**文字名**而非占星 Unicode 符号——运行时 zh locale 会把 ☉♀☿ 字形回退成彩色 emoji（见 memory）。

文件清单
- FOLDER.md｜地位：目录索引文档。
- embed.tsx｜地位：计算器 embed widget 基建（#14）｜功能：`EmbedContext`/`useIsEmbed`、`EmbedWidgetShell`（`/embed/<slug>` 无 chrome 容器 + dofollow 品牌回链 + 提供 embed 上下文）、`EmbedCodeBox`（计算器全页底部「复制 iframe 代码」框，embed 上下文内自隐藏）。App.tsx 的 `/embed/<slug>` 路由用 EmbedWidgetShell 包裹各计算器；各计算器全页底部渲染 `<EmbedCodeBox slug>`。
- BirthDataCalculator.tsx｜地位：sign 类配置驱动外壳｜功能：出生日期(+可选时间/城市)表单（复用 useCityAutocomplete + DateSelectGroup）→ `config.compute(birth)` → 结果卡（headline/items/body）；匿名计算走 `fetchNatalChart(skipCache)` 不缓存明文（隐私 #2）；loading/error/result 全状态；底部渲染 `EmbedCodeBox`（slug 取自 config）。
- signConfigs.ts｜地位：sign 类计算器配置｜功能：moonSignConfig / risingSignConfig / bigThreeConfig / birthChartConfig —— 各实现 compute（fetch natal → 抽取 Sun/Moon/Ascendant 等 sign → 中性文案）；含 sign 中英映射；上升类 needsTime=true 缺时间报错。
- useCalculatorTheme.ts｜地位：共享主题 hook｜功能：返回明暗 class token（cardBg/textPrimary 等，对齐 BirthDataCalculator，来源 COLOR_SYSTEM_GUIDE）。
- astroDisplay.ts｜地位：天象显示工具（纯）｜功能：星座/行星中英名映射、座内度数「度·分」格式化、星座缩写——刻意文字名避 emoji 字形陷阱。
- CurrentPlanetsTool.tsx｜地位：当前天象盘（#9）｜功能：某 UTC 日 10 大行星 sign/度/逆行（默认今天，可选日期），消费 `fetchPositions`；路由 /:lang/current-planets。
- MoonPhaseTool.tsx｜地位：月相工具（#12）｜功能：某 UTC 日 8 相名 + 受照% + 盈亏 + 月/日星座，消费 `fetchMoonPhase`；路由 /:lang/moon-phase-calculator。
- EphemerisTool.tsx｜地位：星历表生成器（#10）｜功能：日期范围×行星的 sign/度/逆行表格（步长可选，后端裁剪+truncated 标记），消费 `fetchEphemeris`；路由 /:lang/ephemeris-calculator。
- electional.ts｜地位：择吉/天象时机纯算法｜功能：classifyDayTone（和谐 vs 紧张相位 → flowing/mixed/dynamic 中性基调，绝不下吉凶断言）/ moonPhaseLabel（日月黄经差 → 8 相标签）/ normElong；无 IO、无出生数据。
- ElectionalTool.tsx｜地位：择吉天象时机计算器（#11）｜功能：起始日 + 天数 → 复用 `fetchEphemeris` 取范围星历 → 逐日 selfAspects 自相位 + 月相 + 月座 + 中性基调；严格中性叙事（天象参考非预测/保证）；路由 /:lang/electional-astrology。
- rodden.ts｜地位：Rodden 出生时间可信度分级纯数据+函数｜功能：BIRTH_TIME_SOURCES（来源选项+双语标签）/ classifyRodden（来源 → Rodden 码 + 信心档 + angles/houses/moonExact 可信标志）；无 IO、无 PII。
- RoddenRatingTool.tsx｜地位：Rodden 可信度计算器（#21，教育）｜功能：选择出生时间来源 → Rodden 码 + 信心档 + 上升天顶/宫位/月亮到度可信度 + 建议；纯客户端、无后端、无出生数据存储；路由 /:lang/rodden-rating。
- crossAspects.ts｜地位：合盘交叉相位纯引擎｜功能：absoluteLongitude / separation / classifyAspect（主相位 + 性质）/ crossAspects（两盘交叉相位表，按 orb 升序）/ selfAspects（单盘内两两相位，供天象「当日天空」用）/ summarizeAspects；conjunction 标 neutral 不武断好坏。
- compositeChart.ts｜地位：合成盘中点纯引擎｜功能：midpointLongitude（圆上近中点/短弧）/ compositeChart（两盘逐行星中点→合成盘落座，仅两盘都有的请求行星，保持顺序）；复用 crossAspects.absoluteLongitude。
- PersonBirthFields.tsx｜地位：关系类计算器共享「单人出生表单」｜功能：姓名(仅本地)/日期/可选时间/城市自动完成 → onChange 上抛 PersonState 快照；导出 PersonState/FieldsTheme/emptyPerson/personToBirth/MONTH_FALLBACK_EN；各实例独立持 useCityAutocomplete。Synastry/Composite 共用。
- SynastryCalculator.tsx｜地位：合盘计算器（双表单）｜功能：两个 PersonBirthFields → 两次匿名 `fetchNatalChart` → 客户端 crossAspects → 中性兼容性视图（和谐/成长/融合计数 + 最紧相位）；**客户端算相位避开付费门 /api/synastry**；姓名仅本地绝不出端（隐私 #4）；路由 /:lang/synastry-calculator。
- CompositeCalculator.tsx｜地位：合成盘计算器（双表单）｜功能：两个 PersonBirthFields → 两次匿名 `fetchNatalChart` → 客户端 compositeChart（10 大行星中点）→ 合成盘落座一览；客户端算中点不碰付费端点；姓名仅本地（隐私 #4）；路由 /:lang/composite-calculator（与 wiki 文章 composite-chart-calculator 区分，文案交叉引导）。
- SolarReturnCalculator.tsx｜地位：返照盘计算器（单人 + 年份）｜功能：一个 PersonBirthFields + 年份选择 → `POST /api/solar-return`（后端求解返照时刻）→ 返照日期/时刻 + 10 大行星落座；出生数据 POST(PII 不进 URL)，无 LLM；路由 /:lang/solar-return-calculator（区别于 saturn-return-calculator）。

近期更新
- 2026-06-17 新建：计算器矩阵 D 第一批 sign 类（Moon Sign / Rising / Big Three / Birth Chart）。路由 `/:lang/<slug>`（+ 裸 LangRedirect + isPublicRoute 白名单 + showNav）；静态 stub 走 generate-seo-pages.mjs 的 CALCULATOR_SEO 循环（≥4 H2 关键词正文 + JSON-LD + sitemap）。
- 2026-06-18 新建：D 第二批「天象工具集」（Current Planets / Moon Phase / Ephemeris）。后端扩 `api/astro.ts`（/positions、/moon-phase、/ephemeris，TDD）+ 纯算法 `backend/src/services/astro/skyTools.ts`。3 个新 slug 已进 CALCULATOR_SEO + isPublicRoute。
- 2026-06-18 新建：D 第二批「合盘」SynastryCalculator + crossAspects 纯引擎（TDD 19 例）。客户端交叉相位（复用 /api/natal/chart，不碰付费 /api/synastry），姓名不出端。slug synastry-calculator 已进 CALCULATOR_SEO + isPublicRoute。
- 2026-06-18 新建：D 第二批「合成盘」CompositeCalculator + compositeChart 中点引擎（TDD 9 例）+ 抽出共享 PersonBirthFields（Synastry 同步改用）。slug composite-calculator（避开 wiki 文章 composite-chart-calculator slug 冲突）已进 CALCULATOR_SEO + isPublicRoute。
- 2026-06-18 新建：D 第二批「返照盘」SolarReturnCalculator（复用单人 PersonBirthFields + 年份）+ 新后端 `POST /api/solar-return` + 纯求解器 `backend/src/services/astro/solarReturn.ts`（生日窗口二分 Sun 经度过本命 Sun，TDD 5 例 + 路由 5 例）。slug solar-return-calculator 已进 CALCULATOR_SEO + isPublicRoute。**至此 D 计算器矩阵第二批收官**（除 Electional 显式分期）。
- 2026-06-18 新建：#14 embed widget——新增 `embed.tsx`（EmbedWidgetShell + EmbedCodeBox + EmbedContext）。10 个计算器全部加 `/embed/<slug>` 路由（App.tsx isEmbedRoute 块，EmbedWidgetShell 包裹）+ 全页底部 `EmbedCodeBox`（复制 iframe 代码）。CalculatorConfig 加 `slug` 字段（4 sign config 已补）。embed 页 `noindex,nofollow` 不入 sitemap。TDD `tests/unit/embed-widget.test.tsx`。
- 2026-06-18 新建：#11 Electional 择吉天象时机——新增 `electional.ts`（纯算法）+ `ElectionalTool.tsx`，复用 `fetchEphemeris` + crossAspects 新增 `selfAspects`。route /:lang/electional-astrology + /embed/electional-astrology + CALCULATOR_SEO + isPublicRoute。严格中性叙事（无吉日/幸运日，Flowing/Mixed/Dynamic 仅描述相位平衡）。TDD `tests/unit/electional.test.ts`（8 例）。
- 2026-06-18 新建：#21 Rodden Rating——新增 `rodden.ts`（分级纯算法）+ `RoddenRatingTool.tsx`（教育工具，出生时间来源→数据可信度，无后端/无 PII）。route /:lang/rodden-rating + /embed/rodden-rating + CALCULATOR_SEO + isPublicRoute。TDD `tests/unit/rodden.test.ts`。
