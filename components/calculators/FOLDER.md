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
- BirthDataCalculator.tsx｜地位：sign 类配置驱动外壳｜功能：出生日期(+可选时间/城市)表单（复用 useCityAutocomplete + DateSelectGroup）→ `config.compute(birth)` → 结果卡（headline/items/body）；匿名计算走 `fetchNatalChart(skipCache)` 不缓存明文（隐私 #2）；loading/error/result 全状态。
- signConfigs.ts｜地位：sign 类计算器配置｜功能：moonSignConfig / risingSignConfig / bigThreeConfig / birthChartConfig —— 各实现 compute（fetch natal → 抽取 Sun/Moon/Ascendant 等 sign → 中性文案）；含 sign 中英映射；上升类 needsTime=true 缺时间报错。
- useCalculatorTheme.ts｜地位：共享主题 hook｜功能：返回明暗 class token（cardBg/textPrimary 等，对齐 BirthDataCalculator，来源 COLOR_SYSTEM_GUIDE）。
- astroDisplay.ts｜地位：天象显示工具（纯）｜功能：星座/行星中英名映射、座内度数「度·分」格式化、星座缩写——刻意文字名避 emoji 字形陷阱。
- CurrentPlanetsTool.tsx｜地位：当前天象盘（#9）｜功能：某 UTC 日 10 大行星 sign/度/逆行（默认今天，可选日期），消费 `fetchPositions`；路由 /:lang/current-planets。
- MoonPhaseTool.tsx｜地位：月相工具（#12）｜功能：某 UTC 日 8 相名 + 受照% + 盈亏 + 月/日星座，消费 `fetchMoonPhase`；路由 /:lang/moon-phase-calculator。
- EphemerisTool.tsx｜地位：星历表生成器（#10）｜功能：日期范围×行星的 sign/度/逆行表格（步长可选，后端裁剪+truncated 标记），消费 `fetchEphemeris`；路由 /:lang/ephemeris-calculator。

近期更新
- 2026-06-17 新建：计算器矩阵 D 第一批 sign 类（Moon Sign / Rising / Big Three / Birth Chart）。路由 `/:lang/<slug>`（+ 裸 LangRedirect + isPublicRoute 白名单 + showNav）；静态 stub 走 generate-seo-pages.mjs 的 CALCULATOR_SEO 循环（≥4 H2 关键词正文 + JSON-LD + sitemap）。
- 2026-06-18 新建：D 第二批「天象工具集」（Current Planets / Moon Phase / Ephemeris）。后端扩 `api/astro.ts`（/positions、/moon-phase、/ephemeris，TDD）+ 纯算法 `backend/src/services/astro/skyTools.ts`。3 个新 slug 已进 CALCULATOR_SEO + isPublicRoute。后续仍待：Synastry/Composite（双表单）+ Solar Return（需求解返照时刻）+ Electional（研究级，AI 安全门，分期）。
