<!-- INPUT: hooks/useCityAutocomplete、components/forms/DateSelectGroup、services/apiClient（fetchNatalChart/searchCities）、services/analytics、types。 -->
<!-- OUTPUT: 计算器矩阵（D）——配置驱动的出生数据计算器外壳 + 各 sign 类 slug 的配置。 -->
<!-- POS: components/calculators 子目录索引；若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->

一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components/calculators

架构概要

- SEO 计算器矩阵（D）两类：
  - **sign 类**（出生数据）：一个配置驱动外壳承载所有计算器，复用现有 `/api/natal/chart`，不新增后端。
  - **天象工具类**（无出生数据）：纯天文工具，复用 `/api/astro/*`（today/positions/moon-phase/ephemeris），无 LLM、无位置、无 PII。
- 双渲染：静态 SEO stub（`scripts/generate-seo-pages.mjs` 的 `CALCULATOR_SEO` 循环）给爬虫读关键词正文 + WebApplication/FAQPage JSON-LD + sitemap；inject-spa 水合成本目录的交互组件。SEO alias 页（如 moon-phase-today / astrocartography-map-generator）复用 canonical 工具组件，不加入工具 catalog。
- 新公开路由必须加进 `App.tsx` 的 `isPublicRoute` 白名单（否则运行时 noindex 杀收录）。
- 字形显示走 `<GlyphBadge>` 签名原语：占星 Unicode 字形作为 **TEXT**（`font-variant-emoji:text`）渲染在圆角对比底板上，且全站永不在运行时设 `document.lang=zh`（否则 macOS Chrome locale 回退成彩色 emoji，见 memory）。GlyphBadge 为装饰性（aria-hidden），语义由相邻文字标签承载——EN/ZH、明/暗均验证为文字字形非 emoji。
- 共享呈现原语（GlyphBadge / ToolPageShell / ToolSeoLandingSections / ToolResultCard / ToolFunnelCTA / ElementBalanceBar）统一所有工具的视觉语言、导流内链、可见 SEO 落地页正文与免费数据增强；新工具应复用而非自搓布局。

文件清单

- FOLDER.md｜地位：目录索引文档。
- embed.tsx｜地位：计算器 embed widget 基建（#14）｜功能：`EmbedContext`/`useIsEmbed`、`EmbedWidgetShell`（`/embed/<slug>` 无 chrome 容器 + dofollow 品牌回链 + 提供 embed 上下文）、`EmbedCodeBox`（计算器全页底部「复制 iframe 代码」框，embed 上下文内自隐藏）。App.tsx 的 `/embed/<slug>` 路由用 EmbedWidgetShell 包裹各计算器；各计算器全页底部渲染 `<EmbedCodeBox slug>`。
- BirthDataCalculator.tsx｜地位：sign 类配置驱动外壳｜功能：出生日期(+可选时间/城市)表单（复用 useCityAutocomplete + DateSelectGroup）→ `config.compute(birth)` → 通用结果卡；Birth Chart 结果会切到 `BirthChartResultView` 专用数据结果页；匿名计算走 `fetchNatalChart(skipCache)` 不缓存明文（隐私 #2）；loading/error/result 全状态；底部渲染 `EmbedCodeBox`（slug 取自 config）。
- BirthChartResultView.tsx｜地位：Birth Chart 专用结果页｜功能：复用主 Birth 页已有 `AstroChart` + `TechSpecsComponents`（Planet Positions / Asteroids & Points / Elemental Matrix / Aspect Matrix / House Rulers）展示结构化数据；不渲染 AI 解读或 View Detail 详情入口。
- signConfigs.ts｜地位：sign 类计算器配置｜功能：moonSignConfig / risingSignConfig / bigThreeConfig / birthChartConfig —— 各实现 compute（fetch natal → 抽取 Sun/Moon/Ascendant 等 sign → 结构化结果）；Birth Chart 额外构造 `UserProfile` + `ExtendedNatalData`，给工具页直接呈现已有星盘轮和技术表；上升类 needsTime=true 缺时间报错。
- useCalculatorTheme.ts｜地位：共享主题 hook｜功能：返回明暗 class token（cardBg/textPrimary 等，对齐 BirthDataCalculator，来源 COLOR_SYSTEM_GUIDE）。
- GlyphBadge.tsx｜地位：**签名原语**｜功能：`<GlyphBadge planet|sign|glyph tone size>` —— 把行星/星座/角度字形（取自 shared/astro-glyphs 的 planetGlyph/getZodiacGlyph/glyphFor）渲染为带对比圆角底板的徽章；TEXT + font-variant-emoji:text + 装饰性 aria-hidden，统一全工具星象视觉语言。
- ToolPageShell.tsx｜地位：共享页壳原语｜功能：`<ToolPageShell title subtitle slug landingSlug? breadcrumbs? heroGlyph? maxWidth?>` —— 宽版默认内容区（max-w-[88rem]，可降到 2xl-6xl）+ atlas-style 页头（可选面包屑、返回 /tools、自动工具编号/免费提示、标题/副标题、输入用途提示、可选 hero 字形）+ 内容槽 + 自动单工具/alias SEO 正文（ToolSeoLandingSections）+ EmbedCodeBox(slug)；`landingSlug` 让 SEO 别名页复用 canonical 工具而不复制计算逻辑。
- ToolSeoLandingSections.tsx｜地位：单工具页可见落地页正文渲染原语｜功能：根据 slug 渲染 summary / When to use / explainer sections / FAQ / related tools；中文优先使用 `ZH_TOOL_GUIDES` 的单工具专属内容，缺失才回退分类文案；支持 alias 页隐藏 use cases、直接输出 brief 指定 H2、FAQ 固定标题与 `[anchor](/path)` 内链；embed 上下文自动隐藏，避免 iframe 长文污染宿主页。
- toolSeoContent.ts｜地位：单工具页 SEO 正文数据源｜功能：维护各公开工具与 SEO alias 的 summary、use cases、解释段落与 FAQ；SPA 水合后可见，避免只有静态 stub 对爬虫有正文、人类用户看不到。
- ToolResultCard.tsx｜地位：共享结果原语｜功能：`<ToolResultCard hero? headline sub? footer?>` 扁平结果卡（paper 背景/rounded-2xl/单层细边/衬线标题/统一过渡/hover border）+ `<PlacementList>`/`<PlacementRow>`（字形+标签+等宽值+逆行+可选 wiki 深链）；禁嵌套卡/禁左色条。
- ToolFunnelCTA.tsx｜地位：共享导流原语｜功能：`<ToolFunnelCTA tool label href? prefill? secondaryLinks? note? sign?>` —— 金渐变主 CTA 导向真实功能（/onboarding 带 prefill envelope · /us · /timeline · /birth-chart-calculator）+ 次级 wiki 文字链；点击 fire trackChartFunnel（仅 categorical sign，隐私红线 #1）。
- ElementBalanceBar.tsx｜地位：共享综合视觉原语｜功能：`<ElementBalanceBar elements modalities? lang>` —— 火土风水/基本固定变动分布条；数据来自 /api/natal/chart 的 dominance（零额外计算、无 AI）。
- astroDisplay.ts｜地位：天象显示工具（纯）｜功能：星座/行星/角点/节点中英名映射、座内度数「度·分」格式化、星座缩写——刻意文字名避 emoji 字形陷阱。
- CurrentPlanetsTool.tsx｜地位：当前天象盘（#9）｜功能：某 UTC 日 10 大行星 sign/度/逆行（默认今天，可选日期），消费 `fetchPositions`；路由 /:lang/current-planets。
- MoonPhaseTool.tsx｜地位：月相工具（#12）｜功能：某 UTC 日 8 相名 + 受照% + 盈亏 + 月/日星座，消费 `fetchMoonPhase`；路由 /:lang/moon-phase-calculator；`variant="today"` 复用同一逻辑固定今天并展示距下一次满月/新月大致天数，服务 /:lang/moon-phase-today。
- EphemerisTool.tsx｜地位：星历表生成器（#10）｜功能：日期范围×行星的 sign/度/逆行表格（步长可选，后端裁剪+truncated 标记），消费 `fetchEphemeris`；路由 /:lang/ephemeris-calculator。
- electional.ts｜地位：择吉/天象时机纯算法｜功能：classifyDayTone（和谐 vs 紧张相位 → flowing/mixed/dynamic 中性基调，绝不下吉凶断言）/ moonPhaseLabel（日月黄经差 → 8 相标签）/ normElong；无 IO、无出生数据。
- ElectionalTool.tsx｜地位：择吉天象时机计算器（#11）｜功能：起始日 + 天数 → 复用 `fetchEphemeris` 取范围星历 → 将 sky API 的 `TodayPosition.retrograde` 显式适配为 `PlanetPosition.isRetrograde` 后逐日 selfAspects 自相位 + 月相 + 月座 + 中性基调；严格中性叙事（天象参考非预测/保证）；路由 /:lang/electional-astrology。
- rodden.ts｜地位：Rodden 出生时间可信度分级纯数据+函数｜功能：BIRTH_TIME_SOURCES（来源选项+双语标签）/ classifyRodden（来源 → Rodden 码 + 信心档 + angles/houses/moonExact 可信标志）；无 IO、无 PII。
- RoddenRatingTool.tsx｜地位：Rodden 可信度计算器（#21，教育）｜功能：选择出生时间来源 → Rodden 码 + 信心档 + 上升天顶/宫位/月亮到度可信度 + 建议；纯客户端、无后端、无出生数据存储；路由 /:lang/rodden-rating。
- sunSign.ts｜地位：太阳星座纯引擎（#19）｜功能：sunSignFromDate（tropical 日期段 + cusp 标注，仅需出生日期）/ signElement / signModality / ZODIAC；无 IO、无 PII。
- celebrities.ts｜地位：名人数据集（#19）｜功能：CELEBRITIES（公众人物公开出生日期，全部取星座中段无歧义）+ 可选 `chart` dossier（如 Lei Jun：出生详情、行星落座、主要相位、图形/签名；未知出生时间则不填上升/宫位）+ celebritiesBySign + FIELD_LABELS；一致性由 tests/unit/sunSign.test.ts 守护。
- CelebrityTwinsTool.tsx｜地位：名人星座配对计算器（#19，趣味/教育）｜功能：出生月/日 → 太阳星座 → 同星座名人 + 同元素名人；名人行可点击查看 date-only 资料或结构化 chart dossier；cusp 日引导到完整星盘；纯客户端、无后端、无 PII；中性叙事；路由 /:lang/celebrity-twins。
- acgMap.ts｜地位：占星地图渲染纯工具（#20）｜功能：等距投影 projectLon/projectLat、反子午线 seam 分段 splitSeam、世界城市锚点 WORLD_CITIES、行星顺序/颜色/缩写（颜色仅识别非吉凶）；无 IO，由 tests/unit/acgMap.test.ts 守护。
- AstrocartographyTool.tsx｜地位：占星地图计算器（#20，地图）｜功能：出生数据（需时间）→ POST /api/astrocartography → 等距世界地图 SVG 叠加 10 大行星 MC/IC/AC/DC 角线 + 城市锚点 + 行星开关 + 图例；出生数据 POST 不进 URL；中性叙事（线是探索邀请非预测）；路由 /:lang/astrocartography；`variant="generator"` 复用同一表单/地图结果服务 /:lang/astrocartography-map-generator。
- crossAspects.ts｜地位：合盘交叉相位纯引擎｜功能：absoluteLongitude / separation / classifyAspect（主相位 + 性质）/ crossAspects（两盘交叉相位表，按 orb 升序）/ selfAspects（单盘内两两相位，供天象「当日天空」用）/ summarizeAspects；conjunction 标 neutral 不武断好坏。
- compositeChart.ts｜地位：合成盘中点纯引擎｜功能：midpointLongitude（圆上近中点/短弧）/ compositeChart（两盘逐行星中点→合成盘落座，仅两盘都有的请求行星，保持顺序）；复用 crossAspects.absoluteLongitude。
- PersonBirthFields.tsx｜地位：关系类计算器共享「单人出生表单」｜功能：姓名(仅本地)/日期/可选时间/城市自动完成 → onChange 上抛 PersonState 快照；导出 PersonState/FieldsTheme/emptyPerson/personToBirth/MONTH_FALLBACK_EN；各实例独立持 useCityAutocomplete。Synastry/Composite 共用。
- synastryData.ts｜地位：合盘工具纯数据层｜功能：两个 natal chart → `buildSynastryResultData`，产出双人 `UserProfile`、interaspects、TechSpecs 矩阵相位、house overlays；含 `houseForLongitude` Placidus 宫位归属与 overlay 排序；无 AI、无 IO。
- SynastryResultView.tsx｜地位：Synastry 专用结果页｜功能：复用 `AstroChart(type="synastry")` + `PlanetTable` + `SynastryAspectMatrix`，展示双轮盘、双方 Planet Positions、Interaspect Matrix、按 orb 列表、House Overlays；不渲染 AI 解读或 View Detail 详情入口。
- SynastryCalculator.tsx｜地位：合盘计算器（双表单）｜功能：两个 PersonBirthFields → 两次匿名 `fetchNatalChart` → `synastryData` 客户端组装 → 数据型结果页；**客户端算相位/overlay 避开付费门 /api/synastry**；姓名仅本地绝不出端（隐私 #4）；路由 /:lang/synastry-calculator。
- compositeData.ts｜地位：Composite 工具纯数据层｜功能：两个 natal chart → `buildCompositeResultData`，产出双人 profile、组合盘中点落座、组合宫头/宫位、self aspects、Elemental Matrix、House Rulers；不生成 AI 解读。
- CompositeResultView.tsx｜地位：Composite 专用结果页｜功能：复用 `AstroChart(type="composite")` + `PlanetTable` + `AspectMatrix` + `ElementalTable` + `HouseRulerTable`，展示组合轮盘、双方出生数据、Composite Planet Positions、Angles & Points、Aspect Matrix、Houses；不渲染 AI 解读或 View Detail。
- CompositeCalculator.tsx｜地位：合成盘计算器（双表单）｜功能：两个 PersonBirthFields → 两次匿名 `fetchNatalChart` → `compositeData` 客户端组装 → 数据型结果页；客户端算中点不碰付费端点；姓名仅本地（隐私 #4）；路由 /:lang/composite-calculator（与 wiki 文章 composite-chart-calculator 区分，文案交叉引导）。
- transitData.ts｜地位：Current Planets 个性化行运纯数据层｜功能：TodayPosition → PlanetPosition、natal chart + selected sky → Transit×Natal aspects、short/long term groups、CrossAspectMatrix 数据；不调用 AI/daily GET。
- TransitResultView.tsx｜地位：Current Planets 内的个人行运结果页｜功能：展示出生数据、Transit Planets、Natal Targets、Transit Aspect Matrix、Short term transits、Long term transits；只展示数据，不显示 AI 解读。
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
- 2026-06-18 新建：#19 名人星座配对——新增 `sunSign.ts`（太阳星座日期段引擎，cusp 标注）+ `celebrities.ts`（名人公开出生日期数据集，全取中段无歧义）+ `CelebrityTwinsTool.tsx`（出生月日→太阳星座→同星座/同元素名人，纯客户端无 PII）。route /:lang/celebrity-twins + /embed/celebrity-twins + CALCULATOR_SEO + isPublicRoute。TDD `tests/unit/sunSign.test.ts`（含数据集一致性守护：每位名人 stored sign 必须等于引擎计算且不在 cusp）。计算器矩阵 13→14 个公开计算器。
- 2026-06-18 新建：#20 占星地图 Astrocartography——新增 `acgMap.ts`（等距投影/seam 分段/城市锚点/行星色，纯）+ `AstrocartographyTool.tsx`（世界地图 SVG 叠加 10 大行星 MC/IC/AC/DC 角线 + 城市 + 行星开关）。后端新增 `services/astro/acg.ts` 天文内核 + `api/astrocartography.ts`（POST，需出生时间，拒 mock→503）+ ephemeris `getEclipticForBirth`/抽出 `birthToUtcDate`。route /:lang/astrocartography + /embed/astrocartography + CALCULATOR_SEO + isPublicRoute。TDD：acg.test(14)+acg-verify(对 Swiss Ephemeris 赤道输出)+astrocartography.test(4)+acgMap.test(5)。计算器矩阵 14→15 个公开计算器。
- 2026-06-22 新建+重构：**tools-polish 一致性/导流/美化批次**。新增 5 个共享原语（GlyphBadge / ToolPageShell / ToolResultCard+PlacementList/Row / ToolFunnelCTA / ElementBalanceBar）+ 扩 `shared/astro-glyphs.ts`（planetGlyph/glyphFor + 外行星/角度字形，TDD `astroGlyphs.test.ts`）。全部 16 个工具（含 components/SaturnReturnCalculator + pages/EnergyTimelineDemoPage）改用原语：GlyphBadge 字形徽章、扁平结果卡、ToolFunnelCTA 导流到真实功能（sign 类→/onboarding 带 prefill envelope；天象类→/birth-chart-calculator；合盘/组合盘→/us；择吉→/timeline；土星回归从 /auth 改指 /birth-chart-calculator）、用已 fetch 的免费数据增强结果（度数/逆行/宫位/元素三模态平衡/星历 ingress·station/月相 SVG 盘/城市轨迹/合盘双方日月升等，**零 AI token**）。signConfigs 富化 placements（CalculatorResult 加 placements/dominance/heroGlyph/funnel）。无新路由/端点/schema（不触 PRD）。浏览器验收 EN暗/EN亮/ZH 三态字形均为文字非 emoji。`calculator-configs.test.ts` 同步到新 placements 契约。
- 2026-06-25 更新：单工具页落地化修正。`ToolPageShell` 默认扩到 max-w-6xl，原 maxWidth="3xl" 的星历/择时/合盘/占星地图/合盘对比改为 6xl；新增 `ToolSeoLandingSections` + `toolSeoContent`，让每个工具页在交互计算器下方显示自己的 summary、使用场景、What/How/FAQ 正文（embed 自动隐藏）。Saturn Return 与 Energy Timeline 两个非 ToolPageShell 工具同步接入 max-w-6xl 宽容器/可见工具说明。
- 2026-06-25 更新：正式 /tools 与单工具页 UI 优化。ToolsHubPage 改为 atlas-style 多语言工具图谱（星盘轮 SVG、可信说明条、Synthetica featured、`n°` 编号工具卡）；`ToolPageShell` 改为带返回工具中心和输入用途提示的统一页头；`ToolSeoLandingSections` 改为更扁平的 editorial 正文区；`ToolResultCard` light 背景从纯白收敛到 paper 色系并补 hover border。
- 2026-06-25 更新：单工具页可见文案去重。`ToolSeoLandingSections` 的说明区大标题从 `How to use …` 收敛为 `About …`/`关于…`，并清理 `toolSeoContent` 中 Moon/Rising/Birth Chart/Composite/Saturn Return 的 section 与 FAQ 重复标题；随后将全部 16 个工具的 explainer section 标题从 `What/How/Why/Using…` 问答式模板改为章节式 noun phrase（如 `Saturn Return cycle basics` / `Personal return window`），问题句只保留在 FAQ 区；`tool-page-shell.test.tsx` 增加同页可见标题去重 + section 禁 FAQ 式标题守卫，防止后续工具复制 FAQ 问题。
- 2026-06-25 更新：单工具页宽度与落地内容再修正。`ToolPageShell` 默认扩到 max-w-[88rem]，页头按 `TOOLS` 自动显示 `Tool n° XX · Free to use`/`第 XX 个工具 · 免费使用`；星历/择时/合盘/组合盘/占星地图的显式 `maxWidth` 同步升到 7xl；`ToolSeoLandingSections` 新增 16 个 slug 级中文 `ZH_TOOL_GUIDES`（每个工具自己的 summary/使用场景/What/How/FAQ）与同类工具内链，避免中文页只显示分类通用文案。
- 2026-06-25 更新：Birth Chart 工具内部结果页对齐主 Birth 页数据呈现。新增 `BirthChartResultView`，`birthChartConfig.compute` 直接返回 `profile` + `technical`（planets/asteroids/elements/aspects/houseRulers）+ core/月相数据；结果区复用现有 `AstroChart`、`PlanetTable`、`ElementalTable`、`AspectMatrix`、`HouseRulerTable`，不展示 AI 解读、不显示 View Detail。
- 2026-06-25 更新：Synastry 工具内部结果页对齐生成式合盘结果页。新增 `synastryData` + `SynastryResultView`，合盘工具结果区改为双轮盘、双方 Planet Positions、Interaspect Matrix、Interaspects by orb、House Overlays；旧版 Big Three + 性质含义文案分支移除，结果区只展示结构化数据，不展示 AI 解读、不显示 View Detail。
- 2026-06-25 更新：Composite 与 Current Planets/Transits 工具内部结果页继续数据化。新增 `compositeData` + `CompositeResultView`，组合盘结果区改为组合轮盘、中点落座、相位矩阵、宫位、元素矩阵与宫主星；新增 `transitData` + `TransitResultView`，Current Planets 增加可选出生资料 overlay，前端用 selected sky × natal chart 计算 Transit Aspect Matrix、短期/长期行运列表；均不展示 AI 解读、不显示 View Detail。
- 2026-06-25 更新：Celebrity Twins 名人详情数据化。`celebrities.ts` 扩展可选 chart dossier 并新增 Lei Jun 公开星盘资料；`CelebrityTwinsTool` 的名人行改为可点击，详情面板展示出生资料、date-only 数据边界，或完整 dossier 的行星落座、Beyond points、主要相位、图形结构、元素/三模态签名；未知出生时间时明确不展示上升/宫位/宫主星。
- 2026-06-25 更新：新增两个 tools SEO alias 页。`/:lang/astrocartography-map-generator` 复用 AstrocartographyTool 的表单/地图逻辑并切换 H1、副标题、按钮、面包屑与可见落地正文；`/:lang/moon-phase-today` 复用 MoonPhaseTool 固定今天并显示动态月相、受照比例、距下一次满月/新月天数；两页的 alias 正文和 FAQ 进入 `toolSeoContent`，不加入 `TOOLS` catalog。
