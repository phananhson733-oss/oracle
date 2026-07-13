<!-- INPUT: React Hooks 目录索引（含分析追踪、额度查询、A/B 测试与 UI 状态钩子）。 -->
<!-- OUTPUT: hooks 目录架构摘要与文件索引（含 Pro 试用文案实验记录）。 -->
<!-- POS: hooks 目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

# 文件夹：hooks

架构概要
- 收口前端复用逻辑与状态管理。
- 提供分析追踪、权益查询与组件状态钩子。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 hooks 目录结构与更新记录。
- useAnalytics.ts｜地位：分析追踪钩子｜功能：提供滚动深度与外链点击追踪钩子。
- useEntitlements.ts｜地位：权益查询钩子｜功能：封装权益检查与额度查询逻辑。
- useABTest.tsx｜地位：A/B 测试钩子｜功能：注册实验配置并返回稳定变体，包含 Pro 试用激活文案实验。
- useScrollToBirthChart.ts｜地位：landing CTA 收敛 hook｜功能：useScrollToBirthChart() 让所有高意图 CTA 统一滚动到 BirthChart anchor，处理 lazy chunk 未挂载的 race（1.5s polling），超时才 fallback 到 /onboarding；useBirthChartHashScroll() 供跨页 CTA（如 wiki 文章底部）带 #birth-chart-tool hash 到达 landing 时在挂载后滚动到工具（backlog #6）。
- useCityAutocomplete.ts｜地位：通用城市自动补全 hook｜功能：debounced 搜索 + 键盘导航 (Arrow/Enter/Esc/Home/End) + WAI-ARIA combobox/listbox/option a11y props，泛型支持 City 与 GeoResult，5 个调用点共用。
- useCityAutocomplete.test.ts｜地位：纯函数单测｜功能：覆盖 nextActiveIndex 键盘 reducer 的所有路径（边界 / wrap / 空列表 / Home / End）。
- useTodaySky.ts｜地位：landing today-sky 数据钩子｜功能：封装 fetchTodaySky 调用，模块级 promise 缓存去重 Hero 与 CosmicWeather 的并发首次挂载，返回 { data, loading, hasError, reload }；FINDING-H01 Hero 右半区数据来源。

近期更新
- useABTest 的试用文案实验改为“手动激活 Pro 试用 + 付款信息绑定 + 可取消”叙事，避免继续暗示注册自动赠送试用。
- 新增 useTodaySky 钩子，模块级 promise 缓存让 Hero 右半区编辑卡 (HeroTodayCard) 与 CosmicWeatherSection 共享 /api/astro/today 请求，FINDING-H01 修复。
- 新增 useAnalytics 钩子，补齐滚动深度与外链点击追踪能力。
- 新增 useScrollToBirthChart 钩子，收敛 landing-v2 五个 section CTA（Hero/CosmicWeather/Tools/Synastry/AskOracle）的导航，消除 ProtectedRedirect bait-and-switch 与 lazy-mount race。
- 新增 useCityAutocomplete 钩子（PR #23），统一 OnboardingPage / landing BirthChartSection / SynastryPage (×2) / SaturnReturnCalculator 五处城市搜索的 debounce + 键盘导航 + WAI-ARIA combobox 实现，修 #85 keyboard a11y 阻塞。
- useScrollToBirthChart 增 useBirthChartHashScroll()（backlog #6），让 wiki 文章底部 CTA 跨页导到 /landing-v2/{lang}/#birth-chart-tool 后在 landing 挂载时滚动到免费盘，收口 wiki→tool 漏斗断点（此前弹去 /auth 登录墙）。
