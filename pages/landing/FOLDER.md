<!-- INPUT: /landing-v2 页面分段组件清单（Hero 立即加载 + 8 个 React.lazy 分段）。 -->
<!-- OUTPUT: pages/landing 子目录架构摘要与文件索引。 -->
<!-- POS: pages/landing 目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

# 文件夹：pages/landing

架构概要
- `/landing-v2` 与根路由 `/` 的模块化 marketing landing 页面组件集合。
- LandingPage.tsx 仅做组合 + SEO 元；Hero 立即加载，其余 8 段 React.lazy + Suspense + 占位高度防 CLS。
- 数据共享：Hero 右半区编辑卡 (HeroTodayCard) 与 CosmicWeatherSection 经由 hooks/useTodaySky 共用一次 /api/astro/today 请求。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 pages/landing 目录结构与更新记录。
- LandingPage.tsx｜地位：landing 页面组合根｜功能：SEO + 9 段组合 + UTM 快照 + html lang 同步 + 多形态规范 URL（/、/landing-v2、/landing-v2/{en,zh}/）。
- HeroSection.tsx｜地位：首屏区块｜功能：Editorial Serif Poster 标题 + 双 CTA（统一收敛到 BirthChart anchor）+ md+ 7/5 双列网格右半区嵌入 HeroTodayCard。
- HeroTodayCard.tsx｜地位：Hero 右半区编辑卡｜功能：用真实今日天象数据（编辑日期 + Sun/Moon/Mercury 三事实 + 「See full sky →」锚点跳 #today）填充原本空白的右半区；md+ 显示、mobile 隐藏避免异步闪烁；FINDING-H01 修复。
- BirthChartSection.tsx｜地位：嵌入式本命盘工具区｜功能：anchor id="birth-chart-tool" 承接所有高意图 CTA。
- CosmicWeatherSection.tsx｜地位：今日天象区｜功能：10 大行星 sign/degree/Rx 表格，经 useTodaySky 与 HeroTodayCard 共享请求；anchor id="today"。
- ToolsGridSection.tsx｜地位：工具网格区｜功能：核心工具入口卡片。
- WikiHubSection.tsx｜地位：百科入口区｜功能：心理占星百科导航。
- FeaturedArticlesSection.tsx｜地位：精选文章区｜功能：SEO/GEO 关键词面，曝光 wiki 文章标题 + 内链。
- SynastrySection.tsx｜地位：合盘入口区｜功能：双人合盘工具介绍 + CTA。
- AskOracleSection.tsx｜地位：神谕问答入口区｜功能：Ask 工具介绍 + CTA。
- SocialProofSection.tsx｜地位：社会证明区｜功能：用户评价与信任 token。
- NewsletterSection.tsx｜地位：邮件订阅区｜功能：newsletter 注册 + 表单。
- FooterSection.tsx｜地位：页脚区｜功能：法律链接、语言切换、版权。

近期更新
- 新增 HeroTodayCard.tsx 与共享 useTodaySky 钩子；Hero 右半区不再空白，以真实今日天象（编辑日期 + Sun/Moon/Mercury）做品牌锚点，避开 SaaS 风 hero 空洞感（FINDING-H01）。
- CosmicWeatherSection 从内联 useState/useEffect 切到 useTodaySky，与 Hero 共享一次 /api/astro/today 请求。
- HeroSection 从单列改为 md+ 7/5 双列网格，左 copy + CTA，右 HeroTodayCard。
