<!-- INPUT: hooks/useCityAutocomplete、components/forms/DateSelectGroup、services/apiClient（fetchNatalChart/searchCities）、services/analytics、types。 -->
<!-- OUTPUT: 计算器矩阵（D）——配置驱动的出生数据计算器外壳 + 各 sign 类 slug 的配置。 -->
<!-- POS: components/calculators 子目录索引；若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components/calculators

架构概要
- SEO 计算器矩阵（D）：一个配置驱动外壳承载所有 sign 类计算器，复用现有 `/api/natal/chart`，不新增后端。
- 双渲染：静态 SEO stub（`scripts/generate-seo-pages.mjs` 的 `CALCULATOR_SEO` 循环）给爬虫读关键词正文 + WebApplication/FAQPage JSON-LD + sitemap；inject-spa 水合成本目录的交互组件。
- 新公开路由必须加进 `App.tsx` 的 `isPublicRoute` 白名单（否则运行时 noindex 杀收录）。

文件清单
- FOLDER.md｜地位：目录索引文档。
- BirthDataCalculator.tsx｜地位：配置驱动外壳｜功能：出生日期(+可选时间/城市)表单（复用 useCityAutocomplete + DateSelectGroup）→ `config.compute(birth)` → 结果卡（headline/items/body）；匿名计算走 `fetchNatalChart(skipCache)` 不缓存明文（隐私 #2）；loading/error/result 全状态。
- signConfigs.ts｜地位：sign 类计算器配置｜功能：moonSignConfig / risingSignConfig / bigThreeConfig / birthChartConfig —— 各实现 compute（fetch natal → 抽取 Sun/Moon/Ascendant 等 sign → 中性文案）；含 sign 中英映射；上升类 needsTime=true 缺时间报错。

近期更新
- 2026-06-17 新建：计算器矩阵 D 第一批 sign 类（Moon Sign / Rising / Big Three / Birth Chart）。路由 `/:lang/<slug>`（+ 裸 LangRedirect + isPublicRoute 白名单 + showNav）；静态 stub 走 generate-seo-pages.mjs 的 CALCULATOR_SEO 循环（4 个 ≥4 H2 关键词正文 + JSON-LD + sitemap）。后续：Synastry/Composite（双表单）+ 星历工具类 #9-14（用户拍板两套都做）。
