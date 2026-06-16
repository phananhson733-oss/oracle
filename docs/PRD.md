# AstrologyWiki — Product Requirements Document (PRD)

> **Version**: 2.31
> **Last Updated**: 2026-06-17
> **Status**: Living Document — synced with codebase

---

## 1. 产品概述 / Product Overview

### 1.1 产品定位与愿景

AstrologyWiki 是一款面向欧美市场的现代占星应用，将西方占星学与现代心理学（荣格分析心理学、认知行为疗法）深度融合，为用户提供个性化的自我探索与心理成长体验。

**核心理念**：Empowerment over Fatalism — 赋能而非宿命论。

### 1.2 目标用户画像

| 维度 | 描述 |
|------|------|
| **年龄** | 18–35 岁 |
| **地区** | 欧美市场 |
| **兴趣** | 占星学、心理学、自我成长、正念冥想 |
| **行为特征** | 移动优先、社交媒体活跃、愿意为个性化内容付费 |
| **语言** | 英文（主语言）、中文（辅助） |

### 1.3 核心价值主张

1. **心理学导向的占星解读** — 不同于传统占星 App 的"预测"模式，AstrologyWiki 聚焦"理解自我"
2. **AI 个性化体验** — 基于用户星盘数据，AI 生成深度个性化分析
3. **多维度自我探索** — 涵盖本命盘、每日运势、关系合盘、认知日记等完整体系
4. **专业知识库** — 30+ 经典占星书籍 + 百科词条，兼顾学习与参考

---

## 2. 功能模块 / Feature Modules

### 2.1 用户认证 (Auth)

**路由**: `/auth`

| 功能 | 说明 |
|------|------|
| **Google OAuth** | 主要社交登录方式，使用 google-auth-library |
| **Apple Sign-In** | iOS 用户首选登录方式 |
| **Email + 验证码** | 发送 6 位验证码（Resend 邮件服务），用于新用户注册 |
| **Email 密码登录** | 已注册用户通过邮箱 + 密码登录（legacy） |
| **JWT Token** | Access Token + Refresh Token 双令牌机制 |
| **7 天试用期** | 新用户注册后自动获得 7 天免费试用 |
| **账户删除 (GDPR/CCPA)** | 用户可永久删除账户及所有关联数据（邮箱用户需密码确认） |
| **数据导出 (GDPR/CCPA)** | 用户可导出所有个人数据为 JSON 文件 |

**认证流程**：
```
Landing Page → Auth Page → Google/Apple/Email 登录
→ 新用户: Onboarding → Dashboard
→ 老用户: Dashboard
```

**相关 API**:
- `POST /api/auth/google` — Google 登录
- `POST /api/auth/apple` — Apple 登录
- `POST /api/auth/send-code` — 发送邮箱验证码
- `POST /api/auth/verify-code` — 验证验证码并完成注册
- `POST /api/auth/register` — 邮箱注册（legacy）
- `POST /api/auth/login` — 邮箱密码登录
- `POST /api/auth/refresh` — 刷新 Access Token
- `POST /api/auth/logout` — 登出
- `GET /api/auth/me` — 获取当前用户信息
- `PUT /api/auth/profile` — 更新用户档案
- `POST /api/auth/migrate` — 迁移 localStorage 数据
- `GET /api/auth/verify-email/:token` — 邮箱验证链接

### 2.2 星盘分析 (Natal Chart / Self Exploration)

**路由**: `/dashboard` (MePage)

#### 2.2.1 出生信息录入 (Onboarding)

**路由**: `/onboarding`

多步骤表单收集用户出生信息：
- 出生日期与时间
- 出生地点（模糊城市搜索 via `/api/geo/search`）
- 关注标签 (Focus Tags)
- 时区信息
- 出生时间准确度

#### 2.2.2 星盘计算 (Swiss Ephemeris)

- **引擎**: Swiss Ephemeris (swisseph) — NASA JPL DE431 精度
- **支持天体**: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, Ceres, Pallas, Juno, Vesta, North Node
- **计算内容**: 行星位置、宫位、相位、元素分布

**API**: `GET /api/natal/chart` — 返回原始星盘计算数据

#### 2.2.3 六大心理维度 (6 Psychological Dimensions)

AI 生成的深度心理分析，每个维度独立解读：

**API**: `GET /api/natal/dimension?dimension={id}`

**免费策略**: 前 3 个维度免费（Emotions, Attachment, Sabotage），其余需解锁（5 credits/维度，订阅用户全部解锁）

#### 2.2.4 核心主题 (Core Themes)

基于荣格心理学的驱动力 (Drive) / 恐惧 (Fear) / 成长 (Growth) 三维分析。

**API**: `GET /api/natal/core-themes`

**解锁价格**: 5 credits/主题

#### 2.2.5 星盘总览 (Overview)

**API**: `GET /api/natal/overview` — 太阳/月亮/上升综合解读，含核心旋律、天赋、陷阱分析

### 2.3 每日运势 (Daily Forecast)

**路由**: `/forecast` (TodayPage)

| 功能 | 说明 |
|------|------|
| **行运计算** | 基于当日行星位置与本命盘的行运相位 |
| **四维评分** | Love / Career / Wealth / Health 四维度评分 |
| **能量分析** | Energy, Tension, Frictions, Pleasures 四象限 |
| **时段建议** | 上午 / 下午 / 晚间分时段实践指南 |

**API**:
- `GET /api/daily` — 每日运势概览
- `GET /api/daily/detail` — 详细行运分析

### 2.4 AI 问答 (Ask Oracle)

**路由**: `/oracle` (AskOraclePage)

| 功能 | 说明 |
|------|------|
| **6 大问题类别** | Self Discovery, Shadow Work, Relationships, Vocation, Family Roots, Time Cycles |
| **星盘上下文注入** | AI 回答基于用户完整星盘数据 |
| **心理学视角** | 结合荣格原型、认知行为疗法的回答框架 |

**回答结构** (5 段式):
1. The Essence — 核心洞察
2. The Astrological Signature — 星象依据
3. Deep Dive Analysis — Mirror/Root/Shadow/Light 四维分析
4. Soulwork — 日记提示 + 微习惯
5. The Cosmic Takeaway — 总结 + 肯定语

**API**: `POST /api/ask` — 提交问题，AI 生成个性化回答

**配额**: 免费 3 次/周，订阅额外 +7 次/周（合计 10 次/周），或消耗 10 credits/次

### 2.5 合盘分析 (Synastry / Us)

**路由**: `/us` (UsPage)

| 功能 | 说明 |
|------|------|
| **双人星盘比较** | 输入伴侣/朋友出生信息，对比两人星盘 |
| **关系类型建议** | Romantic, Friendship, Family, Business 等 |
| **多视角分析** | Person A 视角、Person B 视角、Composite 合成盘 |
| **去重哈希机制** | SHA256 哈希防止重复消耗配额 |

**16 个分析模块**:
- Overview — 关系概览与核心动力
- Core Dynamics — 详细互动模式
- Highlights — 关系亮点
- Vibe Tags — 关系氛围标签
- Growth Task — 成长课题
- Conflict Loop — 冲突模式分析
- Weather Forecast — 关系运势
- Relationship Timing — 关系时间线与阶段预测
- Action Plan — 行动计划与对话启发
- Natal A/B — 双方本命盘在关系中的表现
- Compare A→B / B→A — 交叉体验分析
- Composite — 组合盘分析
- Dynamic — 动态关系能量分析
- Practice Tools — 实用关系工具

**API**:
- `GET /api/synastry` — 完整合盘分析
- `GET /api/synastry/overview-section` — 按模块懒加载
- `GET /api/synastry/suggestions` — 关系类型建议
- `GET /api/synastry/technical` — 技术数据附录

**配额**: 免费 3 次（终身永久额度），订阅 +1 次/周，或 15 credits/次

### 2.6 CBT 日记 (Cognitive Behavioral Therapy Journal)

**路由**: `/journal` (CBTMainPage)

| 功能 | 说明 |
|------|------|
| **情绪追踪** | 记录每日情绪状态 |
| **认知行为分析** | AI 识别认知扭曲模式 + 星象触发关联 |
| **荣格原型分析** | 结合荣格原型理论的深度洞察 |
| **时间线视图** | Feed 流式查看历史记录 |
| **日历统计** | 月度情绪与行为模式统计 |
| **多维度分析报告** | 躯体信号、根源分析、情绪公式、能力评估 |
| **危机短路检测** | 5 个 AI 分析端点在调用 LLM 前进行中英关键词检测，命中时返回 `status: 'crisis_detected'` + 地区化 helpline（不调用 LLM、不写入 records、脱敏遥测），前端渲染 `<CrisisCard>` 替代分析结果 |

**API**:
- `POST /api/cbt/records` — 创建 CBT 记录
- `GET /api/cbt/records` — 获取记录列表
- `POST /api/cbt/analysis` — CBT 认知分析（含危机检测短路）
- `POST /api/cbt/aggregate-analysis` — 月度综合分析（含危机检测短路）
- `POST /api/cbt/somatic-analysis` — 躯体信号报告（含危机检测短路）
- `POST /api/cbt/root-analysis` — 根因与资源报告（含危机检测短路）
- `POST /api/cbt/mood-analysis` — 情绪公式统计（含危机检测短路）
- `POST /api/cbt/competence-analysis` — CBT 能力统计
- `GET /api/cbt/mood-points` — 情绪强度数值投影（时间轴叠加层用；仅数值无原文，详见 §4.3）【2026-06-17 落地】

### 2.7 Wiki 知识库 (Astrology Encyclopedia)

**路由**: `/wiki` (WikiHubPage), `/wiki/classics` (WikiClassicsPage), `/wiki/classics/:id` (WikiClassicDetailPage), `/wiki/author/:authorId` (AuthorPage, EN-only), `/wiki/:id` (WikiDetailPage) — **公开访问，无需登录**

| 功能 | 说明 |
|------|------|
| **首页** | `/` 重定向至 `/:lang/wiki`（Wiki Hub 即首页，内容优先策略） |
| **百科词条** | 行星、星座、宫位、相位等占星学概念 |
| **经典书籍** | 30+ 本占星经典书籍的结构化书评与导读 |
| **精选文章作者** | 编辑作者人设（Elena Vane / Julian Thorne / Marcus Orion），文章按 authorId 署名，作者页 `/wiki/author/:authorId` 展示 bio + 该作者文章列表，输出 ProfilePage/Person 结构化数据。诚实人设：CSS monogram 头像、就近披露 AI 辅助创作 |
| **Synthetica 工具** | AI 心理综合分析工具 |
| **搜索功能** | 全文搜索匹配 |

**API**:
- `GET /api/wiki/items` — 词条列表
- `GET /api/wiki/items/:id` — 词条详情
- `GET /api/wiki/classics` — 经典书籍列表
- `GET /api/wiki/classics/:id` — 书籍详情
- `GET /api/wiki/search` — 搜索
- `POST /api/synthetica/generate` — Synthetica 分析

**Synthetica 配额**: 免费 3 次/天，订阅 10 次/天，或 5 credits/次

### 2.8 生命周期 (Cycles)

**路由**: `/cycles` (CyclesPage)

展示用户相关的占星周期：月球周期、个人年周期、重要行运周期等。

**API**:
- `GET /api/cycle/list` — 周期列表
- `GET /api/cycle/naming` — AI 生成周期命名

### 2.9 报告系统 (Reports)

**路由**: `/reports` (ReportsPage), `/reports/:reportId` (ReportViewPage)

| 功能 | 说明 |
|------|------|
| **报告类型** | 月度报告、年度报告、事业报告、财富报告、爱情报告、土星回归报告等 |
| **报告购买** | 使用 Credits 购买（订阅用户享 20% 折扣） |
| **报告查看** | 左侧色带设计，可展开的章节式阅读 |

**API**:
- `GET /api/reports/available` — 可用报告类型
- `GET /api/reports` — 用户已购报告
- `GET /api/reports/:reportId` — 报告详情
- `GET /api/reports/access/:reportType` — 检查报告类型访问权
- `POST /api/reports/generate` — 生成报告
- `POST /api/reports/purchase` — 购买报告
- `DELETE /api/reports/:reportId` — 删除报告

### 2.10 用户设置与积分 (Settings & Credits)

#### 2.10.1 用户设置 (Settings)

**路由**: `/settings` (SettingsPage)

用户个人设置与档案管理页面，包含主题切换、语言切换、出生信息编辑等。

#### 2.10.2 积分用量 (Credits Usage)

**路由**: `/usage` (CreditsUsagePage)

展示用户的积分余额与消耗明细，包含各功能的使用量追踪。

#### 2.10.3 已保存解读 (Saved Readings — #24)

**路由**: `/saved` (SavedReadingsPage，列表) · `/saved/:id` (SavedReadingDetailPage，只读详情) — 均为登录态保护路由（`PROTECTED_PATHS`），不可索引、无 SEO 静态页。

登录用户可保存生成的解读（natal/cycle/synastry）以便回看，重开不再消耗 credits。结果页（MePage/CyclesPage）提供 Save 按钮（匿名点击打开登录弹窗）；Settings 提供入口。后端 `saved_readings` 表持久化（见 §4.4），最高 PII：出生输入按 `user_id` RLS 隔离、service-role 写入；账号删除级联清理。v1 前端保存覆盖 natal/cycle；synastry 因 output 散文可能含真名暂缓（红线#4），后端 schema 已支持。

#### 2.10.4 支付结果页

- **路由**: `/payment/success` (PaymentSuccessPage) — 订阅支付成功后的确认页
- **路由**: `/payment/credits-success` (CreditsSuccessPage) — 积分包购买成功后的确认页

#### 2.10.5 开发工具

- **路由**: `/color-demo` (ColorSystemDemo) — 设计系统颜色演示页（开发/调试用途）

#### 2.10.6 SEO 静态路由

构建脚本 (`scripts/generate-seo-pages.mjs`) 自动生成多语言 SEO 静态页面：
- `/en/**` — 英文 SEO 页面族（Wiki Hub 首页、Wiki 词条、经典书籍等）
- `/zh/**` — 中文 SEO 页面族
- 输出至 `public/en/`、`public/zh/` 目录，由 Vercel 直接托管

**Canonical 收口（cannibalization 防治）**：百科短词条（`WikiItem`）与长文（`WikiArticle`）共享 `/{lang}/wiki/{slug}` URL 空间时会争抢同一搜索意图。数据层用 `WikiItem.seo` / `WikiArticle.seo`（类型 `WikiSeoOverride { canonicalPath?, robots?, sitemap?, alternates? }`，定义于 `types.ts` 与 `backend/src/types/api.ts`）声明索引策略：loser 页 `canonicalPath` 指向 winner 长文、`sitemap: false` 排除收录、抑制 hreflang。当前收口对：`house-5 → 5th-house`、`elements → four-element-framework`（仅 en；zh 无对应长文故自指，并以 `alternates: false` 抑制指向 en loser 的非互惠 hreflang）、`transit-chart → transits`。`natal-chart-transits` 不合并（是 transits pillar 的 spoke）。解析逻辑集中在 `scripts/lib/seo-canonical.mjs`（`resolveCanonicalUrl` / `includeInSitemap`），静态脚本（`generate-seo-pages.mjs`）与运行时（`components/SEO.tsx` / `WikiDetailPage`）共用同一策略，保证双渲染路径一致。

### 2.11 法律合规页面 (Legal Pages)

公开法律合规页面，GDPR/CCPA 合规必需：

| 路由 | 页面 | 说明 |
|------|------|------|
| `/privacy` | Privacy Policy | 隐私政策（GDPR + CCPA 合规） |
| `/terms` | Terms of Service | 服务条款 |
| `/cookies` | Cookie Policy | Cookie 政策 |
| `/about` | About / Contact | 关于我们与联系方式 |
| `/help` | Help / FAQ | 常见问题（含 FAQPage JSON-LD Schema） |
| `*` (404) | Not Found | 自定义 404 页面（星座主题文案） |

**全局 Footer**: 所有已登录/Wiki 页面底部显示，包含法律页面链接、关于、帮助、联系方式。显示逻辑与顶部导航栏一致。

**无障碍 (Accessibility)**:
- Skip-to-content 链接（键盘可见）
- `<main>` landmark + `aria-label` 导航标签
- 全局 `focus-visible` 焦点环（gold-500）
- Modal 组件已内置 `role="dialog"` + `aria-modal="true"` + 焦点捕获

### 2.12 Saturn Return Calculator (Free Tool)

公开免费计算器工具页面，用于 SEO 获客和反向链接获取：

| 路由 | 页面 | 说明 |
|------|------|------|
| `/:lang/saturn-return-calculator` | SaturnReturnCalculator | 免费 Saturn Return 计算器（公开可索引） |
| `/:lang/energy-timeline` | EnergyTimelineDemoPage | Energy Timeline 公开 SEO demo 页（固定示例盘 + 注册 CTA，免登录，公开可索引；设计 §13） |
| `/:lang/moon-sign-calculator` | BirthDataCalculator(moonSign) | 免费月亮星座计算器（公开可索引，复用 /api/natal/chart） |
| `/:lang/rising-sign-calculator` | BirthDataCalculator(rising) | 免费上升星座计算器（需出生时间，公开可索引） |
| `/:lang/big-three-calculator` | BirthDataCalculator(bigThree) | 免费日月升计算器（Sun/Moon/Rising，公开可索引） |
| `/:lang/birth-chart-calculator` | BirthDataCalculator(birthChart) | 免费出生星盘计算器（全位置概览，公开可索引） |
| `/embed/saturn-return` | SaturnReturnCalculator (variant="embed") | 可嵌入 widget：宿主站点 `<iframe>` 引用，无站点 chrome，带可见 dofollow 品牌回链；`noindex,nofollow` |

**嵌入 widget（T7）**：`variant="embed"` 渲染无 chrome 的计算器（跳过 `<SEO>` 头注入与 SEO 长文），底部「Powered by AstrologyWiki」回链指向 canonical 计算器页。App.tsx 在 `/embed/*` 早返回最小树绕开全站 nav/footer/paywall/analytics。用于反向链接获取（合规外链形态：回链可见 + 品牌化 + 自然锚文本）。

**功能说明**：
- 用户输入出生日期（必填）、出生时间（可选）、出生城市（可选）
- 后端使用 Swiss Ephemeris 计算本命土星位置及回归日期
- 显示每次 Saturn Return 的开始/精确/结束日期及模板解读文本
- 未提供出生时间时显示近似结果
- CTA 引导用户注册查看完整星盘
- 城市自动补全复用 `/api/geo/search` 端点

**API 端点**：
- `GET /api/saturn-return?date=YYYY-MM-DD&time=HH:mm&timezone=...&lat=...&lon=...`

**SEO 策略**：
- `generate-seo-pages.mjs` 生成静态 HTML（含 WebApplication + FAQPage Schema）
- 添加至 `sitemap.xml`
- `isPublicRoute` 中注册，不输出 `noindex,nofollow`

### 2.13 Marketing Landing Page v2 (Staging)

**路由**: `/landing-v2` (前端 SPA) · 静态 SEO 镜像 `/landing-v2/en/`、`/landing-v2/zh/`

模块化营销 landing page。2026-05-19 L2 cutover 后，正式首页 `/` 已**直接渲染 `LandingPageV2`**（root canonical、`index,follow`、静态首屏 fallback + SPA 水合；见 `App.tsx` 与 `index.html` 的 `#root` 静态正文）；`/landing-v2/{en,zh}/` 保留为 staging SEO 镜像。

**设计依据**：`~/.gstack/projects/xdawayer-oracle/wzb-main-design-20260518-161110.md`（design + eng review 已 APPROVED）

**信息架构（10 模块自上而下）**：

| # | 模块 | 用途 |
|---|------|------|
| 1 | Nav | 复用 `components/Header.tsx`，logo + Wiki/Pricing/Sign In + Get Started pill |
| 2 | Hero | Editorial serif poster：H1 "Astrology meets **modern psychology.**" + subtitle + 双 CTA（Try Free Birth Chart / Watch 90-second tour） |
| 3 | Inline Birth Chart Tool | 公开免费星盘计算器；调用 `GET /api/natal/chart`（无 LLM、无登录），结果区下方 CTA "Sign up for AI reading" |
| 4 | Today's Sky | 通用版当日行星位置（universal transits），后端日级缓存，无 LLM；CTA "See your personal forecast" |
| 5 | Core Tools Grid | 3 卡（Saturn Return Calculator / Synastry / Ask Oracle）；Synthetica 推迟到 v1.1 |
| 6 | CBT Journal Showcase | 左截图右 3 行 bullets + CTA "Start your first entry — Free trial" |
| 7 | Wiki Hub | 6-8 篇 featured 文章 + 4 个分类胶囊（Planets / Signs / Houses / Aspects）+ `<head>` 内 ItemList JSON-LD 指向全部 119 wiki URL |
| 8 | Social Proof (metric) | "**119** articles · **N** charts cast · **N** journal entries this month"；不使用假证言 |
| 9 | Newsletter Signup | 邮箱单字段 + honeypot 反垃圾，调用 `POST /api/newsletter` |
| 10 | Footer | 复用 `components/Footer.tsx` |

**SEO 策略**：
- `scripts/generate-seo-pages.mjs` 输出 `/landing-v2/en/index.html` 与 `/landing-v2/zh/index.html`，含完整 hero 文案明文 HTML、`<title>`、`<meta description>`、Open Graph + Twitter Card meta、canonical、hreflang（en/zh/x-default）、JSON-LD（`WebSite` + `SoftwareApplication`）
- 静态 HTML 提供 noscript-friendly 内容，确保爬虫即使在 React 水合前也能抓到核心文本与结构化数据
- `public/sitemap.xml` 中以 `priority=0.9` `changefreq=weekly` 注册两条 URL
- 静态文件路径与 Vercel 静态优先匹配，避免被 SPA fallback 吞掉

**i18n**：
- 文案双语，英文为主、中文为辅；新增翻译键命名空间 `t.landing.*`
- Hero 英文版（design doc 锁定，不得改写）：
  - H1: "Astrology meets modern psychology."（"psychology" 渲染为 accent 色）
  - Sub: "Birth charts, CBT journal, AI guidance. Science-grounded. No mysticism."
  - Primary CTA: "Try Free Birth Chart →"
  - Secondary CTA: "Watch the 90-second tour"

**已登录用户行为**：访问 `/` 时 `<Navigate to="/dashboard"/>`（不看营销页）；`/landing-v2` 始终可访问以便老用户预览新首页。

**相关 API**：
- `GET /api/natal/chart` — InlineBirthChartTool 调用
- `POST /api/newsletter` — 模块 9 邮件订阅

**v1 已 deferred 至 v1.1+ 的模块**：Synthetica 公开 preview、Today's 个性化版本、真实用户证言。

### 2.14 定价页 (Pricing Page)

**路由**: `/:lang/pricing`（公开可索引，无需登录）

公开定价页，面向 SEO 与转化：用户无需注册即可查看订阅方案、积分包与免费/Pro 权益对比。

**功能说明**：
- 三档方案：Free（$0）、Pro 月付（$6.99/mo · ¥49/月）、Pro 年付（$41.99/yr · ¥294/年，省 50% + 首单 5 折）
- 积分包四档（100 / 300 / 500 / 1000，价格对应 §3.2）
- Free vs Pro 权益对比表（Ask / Synastry / Synthetica / Detail / 心理维度 / CBT 月度统计 / 奖励积分，对应 §3.3）
- 注册赠 7 天试用提示
- 匿名 CTA → 登录弹窗（`openLoginModal`）；已登录 → 升级弹窗（`openUpgradeModal`）；页面无 LLM、无后端依赖
- 价格来源：`data/pricing.ts`（前端展示常量，镜像 `backend/src/config/airwallex.ts`；`tests/unit/pricing-consistency.test.ts` 守护两者漂移）

**i18n**：双语，新增命名空间 `t.pricing.*`（en 主、zh 辅）

**SEO 策略**：
- `scripts/generate-seo-pages.mjs` 的 `PUBLIC_ROUTE_COPY` 输出 `/en/pricing`、`/zh/pricing` 静态 HTML，正文含可见价格文案（防 soft-404）+ WebPage Schema + breadcrumb + hreflang（en/zh/x-default）
- 添加至 `sitemap.xml`
- `isPublicRoute` 中注册（`isPricingPath`），不输出 `noindex,nofollow`；PricingPage 从 `data/pricing.ts` 首帧同步渲染价格，水合 DOM 与静态 stub 一致

### 2.15 人生 K 线 / 月度 K 线 (Life K-Line / Energy Timeline)

**路由**: `/timeline`（受保护路由，需登录 + 出生档案；已落地）｜ `/:lang/energy-timeline`（公开可索引 SEO demo 页：固定示例盘的真实时间轴 + 注册 CTA，免登录；设计 §13）

**落地状态 (2026-06-16)**: P0 月度 K 线 MVP 已实现并通过验证 —
后端 `backend/src/services/transit/`（纯函数评分引擎，TDD）+ `backend/src/api/timeline.ts`（端点）+ ephemeris 瘦经度接口；前端 `pages/TimelinePage.tsx` + `components/timeline/`（蜡烛主视图 / 当日抽屉 / 安全 onboarding，vite build 通过）+ 公开 SEO demo 页 `/:lang/energy-timeline`。

**人生 K 线（年级，#17/#18）后端引擎已落地 (2026-06-17)**：`backend/src/services/transit/lifeArc.ts` —— 复用月度强度模型，慢速外行星（Jupiter/Saturn/Uranus/Neptune/Pluto/北交点）季度采样 + 周期播种 Return 标记（Saturn/Jupiter/Nodal 返照 + Uranus 中年对冲，按已知轨道周期非暴力扫描）+ 固定参考跨度（1-90 岁）归一化（range-independent）。端点 `granularity:'year'` 已接入（`MAX_LIFE_CANDLES=100`，复用同 payload/limiter）。后端 464 测试绿。**前端年级视图已落地 (2026-06-17)**：`/timeline` 页新增 Month/Life 切换，Life 模式拉年级时间轴（`fetchTransitTimeline` granularity:'year'），TimelineChart 泛化为按 date-或-age 键选择/匹配标记，年级蜡烛点选显示区间摘要 + topAspects（年级无逐日 AI 解读）。CBT 叠加层（#23）仍为 P1。

将占星 transit 强度可视化为**蜡烛时间轴主视图**，用户看到自身"能量节奏"起伏，点击任意时间点获得 AI 解读。**外部命名** `Energy Timeline / Transit Candles`，"人生K线/月度K线"仅作内部代号 + 中文副标题。完整工程设计 + 落地 blocker 见 `docs/plans/2026-06-16-life-kline-design.md`（已过 5-voice autoplan 评审：3 Claude + Gemini + Codex/GPT-5 + 代码核验）。

**双粒度**:

| 形态 | 粒度 | 数据源 | 状态 |
|------|------|--------|------|
| 月度 K 线 | 日（当月/任意月） | 快速 transit 相位强度（复用 ephemeris + synthetica 权重）| P0 MVP |
| 人生 K 线 | 年（数十年） | 外行星过本命 + progression + 个人年（后台预计算）| P2 |

| 功能 | 说明 |
|------|------|
| **蜡烛主视图（区间摘要语义）** | 蜡烛 = `start/peak/dip/end` 区间摘要（**非金融 OHLC 涨跌**）；纵轴中性"能量强度 intensity"（**非命运分/吉凶**），仅与自身比较。每根附 `dominantPhase`（applying/exact/separating/mixed）与 `dataQuality` |
| **和谐/张力分解** | 复用 synthetica FLOW/FUSION/FRICTION 权重；着色 harmony=psycho-500蓝 / tension=mystic-500紫（**禁 success/danger/warning token、禁红绿涨跌**）|
| **相位 episode 化** | 连续 orb kernel（非阶跃）+ episode 聚合，消除 orb 边界尖刺；topAspects 按 episode 去重 |
| **节点标注** | 重大 Return（Saturn/Jupiter/Chiron/Nodal Return）气泡 |
| **点击解读** | 点某天/段 → 抽屉复用 daily/detail（月度）或 cycle（人生）|
| **Time Travel** | 旋钮切换时段，免费限近期、付费区间旋钮上视觉预示锁 |
| **CBT 情绪叠加层** | 登录用户把 CBT 情绪**数值**叠到时间轴做自我觉察（**竞品独家**，默认关 + 显式 consent + 反因果 banner）|

**API**:
- `GET / POST /api/transit/timeline` — 蜡烛时间序列（**无 LLM、纯计算 + 缓存**；`granularity:'day'`=月度日级 ≤92 天，`granularity:'year'`=人生年级 ≤100 岁；单日缓存键 `hashInput(birth):date:tz` 含 viewer 时区锚；核心天体 mock fallback → `EPHEMERIS_UNAVAILABLE` 不缓存；专属更严 limiter + 4KB cap）
- `GET /api/cbt/mood-points` — CBT 情绪叠加层**服务端数据最小化投影**：按 viewer 本地日聚合为 `{date, intensity, moodCount}`（intensity = 当日各记录 `finalIntensity ?? initialIntensity` 的均值），绝不返回 `situation/automaticThoughts/hotThought` 等原文（隐私红线 #1/#3）；需鉴权、userId 取自 session（防 IDOR）、遵 90d 保留期、tz 用于本地日分桶。**前端叠加层 UI + GDPR Art9 显式 consent 流仍待落地（consent 措辞须过法务）。**

**配额**: **P0 决策（已定）— 月度蜡烛图全免费**（任意月份）：端点零 LLM 成本、已缓存、限流，符合 §1 病毒增长/SEO/习惯钩子定位（lifekline 的传播力正来自免费可分享）。当日 AI 解读复用现有 `/api/daily/detail`（当前免费、仅限流）。**付费 enforcement 延后**为专门计费 pass：未来 lookahead / premium 逐日 AI 档 / topAspect 明细 / CBT 叠加（P1 #23）的 gated feature key 需后端 `entitlementServiceV2` + `data/pricing.ts` + `pricing-consistency.test` 同步注册（Eng F-E8），不在 K 线 MVP 内 retrofit 共享 detail 端点（避免改既有 TodayPage 行为）。免费/付费边界按设计 risk #4 需 A/B（接 page-cro）。

**安全/隐私/精度（强制）**:
- 撞 §1.3 "Empowerment over Fatalism"：高/低=活跃/沉淀期、张力=可运用的成长；禁吉凶/涨跌/will/destined；首次进入强制 onboarding（"loud vs quiet, not good vs bad"）+ 新路由加 `FrameworkDisclaimer`；**不设 `lang=zh`**（占星符号 emoji 回退）。
- **出生时间精度降级**：`accuracy=time_unknown/approximate` 时禁用 ASC/宫位敏感项、标置信度、分享图标 "approximate birth time"（防假精确）。
- **GDPR Art 9**：CBT×占星 = 特殊类 mental-health 推断，须显式 consent（非 ToS），上线前过法务（§`docs/PRIVACY_AUDIT.md`）。

**SEO 策略**: 公开样例页静态预渲染（固定 demo 盘）**必须配关键词文本叙事**（纯 SVG 图 = soft-404，踩已知 soft-404 根因）；canonical/hreflang/sitemap；同步 `public/sitemap.xml`。

**竞品定位**: 借鉴 lifekline.ai 的蜡烛可视化外壳与传播形态，**替换其八字宿命内核**为"占星 transit × CBT 情绪的个人能量时间轴"（西方占星 + 心理学自我觉察；蜡烛做诚实区间摘要而非金融预测）。

---

## 3. 商业模式 / Business Model

### 3.1 订阅计划 (Subscription Plans)

| 计划 | 价格 | 说明 |
|------|------|------|
| **月付** | $6.99/月 | 自动续费，随时取消 |
| **年付** | $41.99/年 (Airwallex) | 相当于 $3.50/月，节省 50%。注：Stripe 遗留链路年付同步为 50% 折扣 |
| **首次折扣** | 50% off | 所有用户首次订阅享 50% 折扣 |

> **多币种**：结算货币为 USD / CNY / EUR / GBP，按访客地区（Vercel IP 国家 → Accept-Language → USD）自动选定。EUR 镜像 USD 金额、GBP 略低；完整映射与兜底策略见 §6.2。

**订阅权益**:

| 权益 | 免费用户 | 订阅用户 |
|------|----------|----------|
| Ask Q&A | 3 次/周 | 10 次/周 |
| Synastry | 3 次（永久） | +1 次/周 |
| Synthetica | 3 次/天 | 10 次/天 |
| Detail 详情 | 2 次免费 | 无限制 |
| 心理维度 | 前 3 个免费（Emotions, Attachment, Sabotage） | 全部解锁 |
| Daily Script | 受限 | 无限制 |
| CBT 月度统计 | 锁定 | 解锁 |
| 订阅奖励 | — | 每次成功支付 +100 credits |

### 3.2 积分包 (Credits Packages)

| 名称 | 积分数 | USD 价格 | CNY 价格 | 节省 |
|------|--------|----------|----------|------|
| Starter Pack | 100 | $4.99 | ¥34 | — |
| Standard Pack | 300 | $12.49 | ¥84 | 17% |
| Value Pack | 500 | $19.99 | ¥134 | 20% |
| Pro Pack | 1,000 | $34.99 | ¥234 | 30% |

### 3.3 功能定价表 (Feature Pricing)

**永久解锁 (Permanent)**:

| 功能 | Credits |
|------|---------|
| 单个心理维度解锁 | 5 |
| 单个核心主题解锁 | 5 |
| 合盘完整解读 | 15 |
| 合盘详情视图 | 5 |
| Detail 深度解读 | 5 |

**消耗品 (Consumable)**:

| 功能 | Credits |
|------|---------|
| Ask 单次提问 | 10 |
| Synthetica 单次使用 | 5 |
| CBT 月度统计解锁 | 10 |
| Daily Script | 5 |
| Daily Transit Detail | 5 |

### 3.4 配额系统 (Quota System)

#### 免费用户配额

| 功能 | 限额 | 重置周期 |
|------|------|----------|
| Ask 提问 | 3 次/周 | 每周一 00:00 UTC |
| Synastry 合盘 | 3 次（终身） | 不重置 |
| Synthetica | 3 次/天 | 每日 00:00 UTC |
| Detail 详情 | 2 次 | 不重置 |
| 心理维度 | 前 3 个（Emotions, Attachment, Sabotage） | 不重置 |

#### 订阅用户额外配额

| 功能 | 额外限额 | 重置周期 |
|------|----------|----------|
| Ask 提问 | +7 次/周 | 每周一 00:00 UTC |
| Synastry 合盘 | +1 次/周 | 每周一 00:00 UTC |
| Synthetica | +7 次/天 | 每日 00:00 UTC |

#### 重置规则

| 功能 | 频率 | 时间 | 备注 |
|------|------|------|------|
| Ask 提问 | 每周 | 周一 00:00 UTC | 按用户追踪消耗 |
| Synastry 配额 | 每周 | 周一 00:00 UTC | 免费 3 次为永久额度 |
| Synthetica | 每日 | 00:00 UTC | 常规模式按 UTC 日切；LOGIN_GATE_MODE 下按用户时区 |
| CBT 统计 | 每月 | 月初 | 按月解锁 |

#### 积分兜底 (Credits Fallback)

当配额用完时，以下功能支持自动从积分余额扣减：

| 功能 | 积分价格 | 说明 |
|------|----------|------|
| Ask 提问 | 10 credits | 免费/订阅配额用完后自动扣减 |
| Synastry 合盘 | 15 credits | 免费/订阅配额用完后自动扣减 |
| Synthetica | 5 credits | 免费/订阅配额用完后自动扣减 |

### 3.5 支付方式 (Payment Providers)

| 支付方 | 状态 | 说明 |
|--------|------|------|
| **Airwallex** | ✅ 主要 | 全球 + 国内双支持，当前激活的唯一提供商 |
| Stripe | ⚠️ 遗留 | 代码保留用于迁移，当前未启用 |
| PayPal | ⚠️ 备选 | 代码保留，当前未启用 |

**配置切换**: 通过 `PAYMENT_PROVIDER` 环境变量控制（airwallex / stripe / paypal / all）

**Airwallex API**:
- `GET /api/airwallex/pricing` — 获取定价（含订阅 + 积分包）
- `POST /api/airwallex/subscribe` — 创建订阅（自动检测续费 → 走 renewal 流程）
- `GET /api/airwallex/subscription` — 查询订阅状态
- `POST /api/airwallex/cancel-subscription` — 取消订阅
- `POST /api/airwallex/create-order` — 创建积分购买订单
- `POST /api/airwallex/confirm-order` — 确认积分购买并写入 `gm_credit` 记录
- `POST /api/airwallex/confirm-checkout` — 确认订阅并激活 + 发放 100 奖励积分
- `POST /api/airwallex/confirm-renewal` — 确认续费并延长订阅 + 发放 100 奖励积分
- `POST /api/airwallex/webhook` — Webhook 处理（含邮件通知触发）

**Webhook 邮件通知**: Webhook 处理器在以下事件中自动发送邮件（best-effort，不阻塞 webhook 响应）：
- `subscription.active` → 发送订阅支付收据邮件
- `subscription.cancelled` → 发送退订确认邮件（含到期日期与重新订阅链接）
- `subscription.unpaid` → 发送支付失败提醒邮件（Dunning，含更新支付方式链接）
- `payment_intent.succeeded` → 发送积分购买收据邮件

**邮件模板**: 所有交易邮件使用统一的 AstrologyWiki 品牌模板（深色主题 + 金色品牌色），通过 `emailService` 集中管理：
- `sendPaymentReceipt()` — 支付收据（金额、描述、交易 ID、日期）
- `sendPaymentFailedNotice()` — 支付失败通知
- `sendCancellationConfirmation()` — 退订确认（含到期日期）

**积分写入规范**: 所有支付渠道（Airwallex、PayPal、Stripe）写入 `purchase_records` 时统一使用 `feature_type: 'gm_credit'`，不使用 RPC 调用。`entitlementServiceV2` 仅统计 `feature_type === 'gm_credit'` 的记录。

---

## 4. 技术架构 / Technical Architecture

### 4.1 技术栈 (Tech Stack)

| 层级 | 技术 | 版本 |
|------|------|------|
| **Frontend** | React + TypeScript | React 19.x, TS 5.8 |
| **Build Tool** | Vite | 6.2 |
| **Styling** | Tailwind CSS | 3.4 |
| **Routing** | React Router DOM | 7.11 (HashRouter) |
| **Icons** | Lucide React | 0.562 |
| **Charts** | Recharts | 3.6 |
| **Backend** | Express.js + TypeScript | Express 4.18, TS 5.3 |
| **Runtime** | Node.js | 20.x |
| **Database** | PostgreSQL (Supabase) | 8.x |
| **Cache** | Redis (IORedis) | 5.3 |
| **Error Monitoring** | Sentry (`@sentry/node`) | 10.x（仅 `SENTRY_DSN` 配置时动态加载启用，否则不初始化） |
| **AI Model** | DeepSeek API | — |
| **Astro Engine** | Swiss Ephemeris | 0.5.17 |
| **Auth** | JWT + bcryptjs | jsonwebtoken 9.0 |
| **Email** | Resend | 6.9 |
| **Payment** | Airwallex | — |
| **Deployment** | Vercel | — |

### 4.2 项目结构 (Project Structure)

```
/oracle
├── App.tsx                     # 主应用 + 路由定义（含内联页面组件）
├── constants.ts                # 全局常量 + 翻译词典
├── types.ts                    # 全局类型定义
├── index.tsx                   # React 入口
├── index.css                   # 全局样式
├── pages/                      # 顶层路由页面组件
│   ├── PricingPage.tsx         # 公开定价页（/:lang/pricing，static-first 价格渲染）
│   └── landing/                # Landing v2 营销页子模块（NewLandingPage 容器）
├── data/                       # 内容 / 展示数据模块（articles / wiki / competitors / pricing）
│   └── pricing.ts              # 公开定价页展示常量（镜像 backend/src/config/airwallex.ts）
├── components/                 # React UI 组件
│   ├── UIComponents.tsx        # 基础 UI + LanguageContext
│   ├── cbt/                    # CBT 日记模块
│   ├── wiki/                   # Wiki 知识库模块
│   ├── reports/                # 报告系统模块
│   ├── auth/                   # 认证 + 支付相关组件
│   ├── landing/                # Landing v2 模块化区块（Hero / InlineBirthChartTool / CoreToolsGrid / WikiHub / NewsletterSignup 等）
│   ├── design-tokens.ts        # 设计令牌
│   └── ColorSystemDemo.tsx     # 颜色系统演示
├── services/                   # 前端服务层
│   ├── apiClient.ts            # 主 API 客户端
│   ├── authClient.ts           # 认证客户端
│   ├── paymentClient.ts        # 支付客户端
│   ├── entitlementClientV2.ts  # V2 权益客户端
│   ├── reportClient.ts         # 报告客户端
│   ├── analytics.ts            # 数据分析客户端
│   └── cbt/                    # CBT 服务子模块
├── contexts/                   # React Context 提供器
├── hooks/                      # 自定义 React Hooks
├── utils/                      # 工具函数
├── types/                      # TypeScript 类型声明
├── backend/
│   ├── src/
│   │   ├── index.ts            # Express 入口 + 路由注册
│   │   ├── api/                # API 路由处理器
│   │   │   ├── natal.ts        # 星盘 API
│   │   │   ├── daily.ts        # 每日运势 API
│   │   │   ├── ask.ts          # 问答 API
│   │   │   ├── synastry.ts     # 合盘 API
│   │   │   ├── cbt.ts          # CBT API
│   │   │   ├── wiki.ts         # Wiki API
│   │   │   ├── cycle.ts        # 周期 API
│   │   │   ├── reports.ts      # 报告 API
│   │   │   ├── auth.ts         # 认证 API
│   │   │   ├── airwallex.ts    # Airwallex 支付
│   │   │   ├── paypal.ts       # PayPal 支付
│   │   │   ├── payment.ts      # Stripe 支付（遗留）
│   │   │   ├── paymentV2.ts    # Credits 支付系统
│   │   │   ├── entitlements.ts # 权益系统 V1（遗留）
│   │   │   ├── entitlementsV2.ts # 权益系统 V2
│   │   │   └── gm.ts          # GM 调试命令
│   │   ├── config/             # 配置文件
│   │   │   ├── auth.ts         # 认证与定价配置
│   │   │   ├── airwallex.ts    # Airwallex 配置
│   │   │   ├── stripe.ts       # Stripe 配置（遗留）
│   │   │   └── paypal.ts       # PayPal 配置（遗留）
│   │   ├── services/           # 后端服务层
│   │   │   ├── ai.ts           # AI 调用服务
│   │   │   └── entitlementServiceV2.ts  # 权益服务
│   │   ├── cache/              # 缓存层
│   │   │   ├── redis.ts        # Redis 连接与缓存操作
│   │   │   └── strategy.ts     # 缓存策略
│   │   ├── prompts/            # Prompt 系统
│   │   │   ├── common.ts       # 类型 + 工具函数
│   │   │   └── manager.ts      # 注册表 + 所有模板
│   │   └── db/                 # 数据库 Schema
│   └── migrations/             # 数据库迁移文件
├── public/                     # 静态资源
├── scripts/                    # SEO 构建脚本（generate-seo-pages / inject-spa-into-stubs）
│   └── lib/                    # 共享纯函数（seo-canonical.mjs：canonical 解析 / sitemap 收录判定）
├── docs/                       # 文档
└── vercel.json                 # Vercel 部署配置
```

### 4.3 API 端点清单 (API Endpoints)

#### 核心占星 API

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| POST / GET | `/api/natal/chart` | 星盘原始计算数据（POST 为新主路径，body 携带出生数据；GET 保留向后兼容，将逐步弃用） | — |
| POST / GET | `/api/natal/overview` | 星盘总览 (AI) — POST/GET 等价 | — |
| POST / GET | `/api/natal/core-themes` | 核心主题分析 — POST/GET 等价 | — |
| POST / GET | `/api/natal/dimension` | 心理维度分析 — POST/GET 等价 | — |
| GET | `/api/daily` | 每日运势 | — |
| GET | `/api/daily/detail` | 每日详细行运 | — |
| POST | `/api/ask` | AI 问答 | Optional |
| GET | `/api/synastry` | 合盘分析 | Required |
| GET | `/api/synastry/overview-section` | 合盘懒加载模块 (P1 TODO: 改 POST 以脱离 URL-PII) | Required |
| GET | `/api/synastry/suggestions` | 关系类型建议 | — |
| GET | `/api/synastry/technical` | 技术数据附录 | — |
| GET | `/api/cycle/list` | 周期列表 | — |
| GET | `/api/cycle/naming` | AI 周期命名 | — |
| GET | `/api/saturn-return` | Saturn Return 日期计算 | — |
| GET / POST | `/api/transit/timeline` | 人生K线/月度K线能量强度时间序列（无 LLM，纯计算 + 缓存；单日键含 tz；mock fallback 不缓存；专属 limiter） | — |
| GET | `/api/cbt/mood-points` | K线 CBT 叠加层数值投影（只返回 date+intensity，不含原文；显式 consent） | Required |

**配额错误码** (适用于消耗 credits 的 AI 端点 `/api/ask`、`/api/synastry`、`/api/synastry/overview-section`)：

| HTTP | Code | 触发场景 | 响应体 |
|------|------|----------|--------|
| 402 | `OUT_OF_CREDITS` | `reserveFeature` 原子预留失败（额度不足或竞态扣减失败） | `{ error: string, code: "OUT_OF_CREDITS" }` |
| 502 | — | 预留成功后 LLM 调用失败（已自动 `refundReservation`，配额已恢复） | `{ error: "AI unavailable", reason: string }` |

`reserveFeature` 采用 CAS-retry（Compare-and-Swap，3 次重试窗）原子扣减；预留 metadata 存 Redis 键 `reserve:entitlement:<uuid>` TTL 300s。LLM 成功 → `commitReservation` 落盘；LLM 失败 → `refundReservation` 回滚（用户无感知）。

**Report 生成错误码** (`POST /api/reports/generate`)：

| HTTP | Code | 触发场景 | 响应体 |
|------|------|----------|--------|
| 502 | `REPORT_UNAVAILABLE` | LLM 失败且 `entitlementServiceV2.refundFeature` 已自动退款（删除 purchase_records 行 + 发回 gm_credit consumable） | `{ error: string, code: "REPORT_UNAVAILABLE", reason: string }` |

报告路径默认禁 mock：`reportService.generateReport` 内部 `allowMock=false`，任何 section 的 LLM 失败即整体失败 + 退款，绝不返回 placeholder。

**Astro Today 错误码** (`GET /api/astro/today`)：

| HTTP | Code | 触发场景 | 响应体 |
|------|------|----------|--------|
| 503 | `EPHEMERIS_DEGRADED` | swisseph 加载失败或星历计算降级到 mockPlanetPosition（任意 1 颗主行星走 mock fallback） | `{ error: string, code: "EPHEMERIS_DEGRADED" }` |
| 500 | `EPHEMERIS_UNAVAILABLE` | 星历服务抛错 | `{ error: string, code: "EPHEMERIS_UNAVAILABLE" }` |

`getPlanetPositions` 返回 `{ positions, houseCusps, usedMockFallback, mockedPlanets }`；`usedMockFallback=true` 的响应**绝不入缓存**，且读路径会 `isValidPayload`（精确 10 大行星 + 有效星座 + 度数 ∈ [0, 30)）拒绝 stale 缓存并重算。

**地理解析错误码** (适用于所有接受 `city` 参数的端点 `/api/natal/*`、`/api/daily*`、`/api/cycle/list`、`/api/cbt/*`、`/api/geo/search`)：

| HTTP | Code | 触发场景 | 响应体 |
|------|------|----------|--------|
| 400 | `LOCATION_UNRESOLVED` | 空 city / 未匹配城市（用户输入问题） | `{ error: string, code: "LOCATION_UNRESOLVED" }` |
| 503 | `GEOCODING_SERVICE_UNAVAILABLE` | 上游 Open-Meteo 网络故障 / 超时 / 非 2xx / JSON 解析失败 | `{ error: string, code: "GEOCODING_SERVICE_UNAVAILABLE" }` |

历史上 v2.4 及之前，任何地理解析失败（包括上游服务异常）都会静默回退到上海（北纬 31.23，东经 121.47）默认坐标，导致用户拿到错误的星盘。v2.5 起拆分为两类显式错误：
- **400 `LOCATION_UNRESOLVED`**：用户输入问题，前端必须提示用户输入更具体的城市名（如 `Springfield, IL, USA`），不应自动重试
- **503 `GEOCODING_SERVICE_UNAVAILABLE`**：上游服务异常，前端可提示"稍后再试"并可选指数退避重试

v2.11 起，`LOCATION_UNRESOLVED` 响应体**移除 `city` 字段**：原始用户输入不再回显到错误响应，避免经 `services/analytics.ts::trackApiError` 进入 GA 事件参数（隐私红线 #1）。前端按 `code` 本地化文案，不需要 echo back 原值。

**Natal 输入校验错误码** (`POST /api/natal/chart`、`POST /api/natal/overview`、`POST /api/natal/core-themes`、`POST /api/natal/dimension`，GET 兼容路径同此契约)：

| HTTP | Code | 触发场景 |
|------|------|----------|
| 400 | `DATE_REQUIRED` | 缺失 birth date |
| 400 | `INVALID_DATE` | 格式不是 YYYY-MM-DD 或日期不可达（如 2024-02-31） |
| 400 | `INVALID_TIME` | 格式不是 HH:MM(:SS) |
| 400 | `CITY_REQUIRED` | 既无 city 又无完整 lat+lon |
| 400 | `CITY_TOO_LONG` | city 长度 > 200 |
| 400 | `INVALID_LAT` | lat 不在 [-90, 90] |
| 400 | `INVALID_LON` | lon 不在 [-180, 180] |
| 400 | `INVALID_TIMEZONE` | timezone 不匹配 IANA 模式或长度 > 100 |
| 400 | `INVALID_ACCURACY` | accuracy 不在 `exact`/`time_unknown`/`approximate` |
| 500 | `INTERNAL` | 兜底响应；message 不回显 error.message 避免 PII 泄漏 |

**Natal 端点限流与请求体限制** (v2.11 起)：

- `/api/natal/*` 走专用 limiter：30 请求/分钟/IP（独立于 `/api` 100/min 全局桶）。挂载于全局 limiter 之前。
- `/api/natal/*` POST 请求体硬上限 **4 KB**（典型 birth payload < 500B，多余视作恶意）。
- 前端 `services/apiClient.fetchNatalChart` 默认 POST JSON body，复用 `fetchWithTimeout(15000ms)`，确保慢上游不会让 BirthChartSection 的 `submitting` 永久死锁。
- 缓存键：`backend/src/services/geocoding.ts` 的 `geo:resolve:*` / `geo:search:*` 已改用 `hashInput(normalizeLocationValue(city))` 摘要，原始城市名永不入 Redis 键（隐私红线 #2）。
- Analytics 端：`services/analytics.ts::trackApiError` 对 `/natal/*`、`/synastry/*`、`/cycle/*`、`/daily/*`、`/cbt/*`、`/ask/*`、`/wiki/*`、`/geo/*`、`/detail/*`、`/reports/*` 上报时将 `error_message` 替换为 `[redacted]`，仅保留 `endpoint + status_code`（隐私红线 #1）。

#### CBT & Wiki API

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| POST | `/api/cbt/records` | 创建 CBT 记录 | Required |
| GET | `/api/cbt/records` | 获取记录列表 | Required |
| POST | `/api/cbt/analysis` | 认知分析（含危机短路） | — |
| POST | `/api/cbt/aggregate-analysis` | 月度综合分析（含危机短路） | — |
| POST | `/api/cbt/somatic-analysis` | 躯体信号报告（含危机短路） | — |
| POST | `/api/cbt/root-analysis` | 根因分析（含危机短路） | — |
| POST | `/api/cbt/mood-analysis` | 情绪公式（含危机短路） | — |
| POST | `/api/cbt/competence-analysis` | 能力评估 | — |

**CBT 危机检测响应** (适用于上述 5 个含 `crisis_detected` 短路的分析端点):

```jsonc
// HTTP 200 — 注意不是错误响应，前端按正常分支处理
{
  "status": "crisis_detected",
  "helpline": {
    "region": "US",         // 由 x-region header → lang → international fallback 解析
    "name": "988 Suicide & Crisis Lifeline",
    "phone": "988",
    "url": "https://988lifeline.org"
  },
  "message_zh": "请记得，你并不孤单。强烈建议立刻联系下方的专业危机援助资源。",
  "message_en": "You are not alone. Please reach out to the crisis support resource below right now."
}
```

- 命中时 **不调用 LLM**、**不写入 `cbt:records`**、不会扣减用户配额
- 遥测仅记录 `{ event, region, lang, endpoint }`（不含用户原文，遵守 PRD §隐私规范）
- **Detector fail-CLOSED**：`detectCrisis` 异常返回 `{ hit: true, failSafe: true, reason: 'detector-error' }`，调用方按命中处理，绝不把用户文本转给 LLM
- **Override gate（threefold AND，default-secure，生产强制关闭）**：
  1. `process.env.NODE_ENV !== 'production'`（生产环境永远 false）
  2. `process.env.ENABLE_CBT_CRISIS_OVERRIDE === 'true'`（默认未设置，需显式开启）
  3. 请求头 `x-crisis-override-token` 等于 `process.env.QA_CRISIS_OVERRIDE_TOKEN`（共享密钥）
- Token 走 header 而非 query/body，避免泄漏到 access log
- 历史 `?override_crisis_check=true` query 已在 PR #4 删除（生产从未启用，前端无 caller）
| — | `/` 重定向至 `/:lang/wiki` | 首页即 Wiki Hub | — |
| GET | `/api/wiki/items` | 词条列表 | — |
| GET | `/api/wiki/items/:id` | 词条详情 | — |
| GET | `/api/wiki/classics` | 经典书籍列表 | — |
| GET | `/api/wiki/classics/:id` | 书籍详情 | — |
| GET | `/api/wiki/search` | 搜索 | — |
| POST | `/api/synthetica/generate` | Synthetica 分析 | Optional |

#### 认证 API

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| POST | `/api/auth/google` | Google 登录 | — |
| POST | `/api/auth/apple` | Apple 登录 | — |
| POST | `/api/auth/send-code` | 发送验证码 | — |
| POST | `/api/auth/verify-code` | 验证并注册 | — |
| POST | `/api/auth/register` | 邮箱注册（legacy） | — |
| POST | `/api/auth/login` | 邮箱密码登录 | — |
| POST | `/api/auth/refresh` | 刷新 Token | — |
| POST | `/api/auth/logout` | 登出 | Optional |
| GET | `/api/auth/me` | 当前用户信息 | Required |
| PUT | `/api/auth/profile` | 更新档案 | Required |
| POST | `/api/auth/migrate` | 迁移 localStorage 数据 | Required |
| GET | `/api/auth/verify-email/:token` | 邮箱验证链接 | — |
| DELETE | `/api/auth/account` | 删除账户 (GDPR/CCPA) | Required |
| GET | `/api/auth/export-data` | 导出用户数据 (GDPR/CCPA) | Required |

#### 支付 API (Airwallex — 当前激活)

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| GET | `/api/airwallex/pricing` | 获取定价 | — |
| POST | `/api/airwallex/subscribe` | 创建订阅 | Required |
| GET | `/api/airwallex/subscription` | 查询订阅状态 | Required |
| POST | `/api/airwallex/cancel-subscription` | 取消订阅 | Required |
| POST | `/api/airwallex/create-order` | 创建积分订单 | Required |
| POST | `/api/airwallex/webhook` | Webhook 回调 | Signature |

#### 支付 API (Stripe — 遗留，未启用)

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| GET | `/api/payment/subscription` | 查询订阅状态 | Required |
| POST | `/api/payment/create-checkout` | 创建订阅结账 | Required |
| POST | `/api/payment/purchase` | 创建一次性购买 | Required |
| POST | `/api/payment/create-portal` | 创建客户门户 | Required |
| GET | `/api/payment/purchases` | 购买历史 | Required |
| GET | `/api/payment/pricing` | 获取定价 | — |
| GET | `/api/payment/first-discount-eligibility` | 检查首次折扣资格 | Required |
| POST | `/api/payment/webhook` | Stripe Webhook | Signature |

#### 支付 API V2 (Credits 系统)

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| GET | `/api/payment/v2/pricing` | V2 定价（含 credits） | — |
| POST | `/api/payment/v2/subscribe` | 创建订阅 (V2) | Required |
| POST | `/api/payment/v2/purchase` | 直接购买（已禁用，返回 410） | Required |
| POST | `/api/payment/v2/purchase-with-credits` | 使用 credits 购买 | Required |
| POST | `/api/payment/v2/webhook` | Stripe Webhook (V2) | Signature |

#### 支付 API (PayPal — 备选，未启用)

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| GET | `/api/paypal/pricing` | PayPal 定价 | — |
| POST | `/api/paypal/subscribe` | 创建 PayPal 订阅 | Required |
| GET | `/api/paypal/subscription` | 查询订阅状态 | Required |
| POST | `/api/paypal/confirm-subscription` | 确认订阅（回退） | Required |
| POST | `/api/paypal/cancel-subscription` | 取消订阅 | Required |
| POST | `/api/paypal/create-order` | 创建积分订单 | Required |
| POST | `/api/paypal/capture-order` | 捕获支付 | Required |
| POST | `/api/paypal/webhook` | PayPal Webhook | Signature |

#### 权益 API (V1 — 遗留)

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| GET | `/api/entitlements` | 获取当前权益 | Required |
| GET | `/api/entitlements/check/:feature` | 检查功能访问权 | Required |
| POST | `/api/entitlements/consume` | 消耗功能 | Required |
| GET | `/api/entitlements/free-usage` | 获取设备免费使用量 | — |

#### 权益 API (V2)

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| GET | `/api/entitlements/v2` | 获取用户权益 | Optional |
| POST | `/api/entitlements/v2/check` | 检查功能访问权 | Optional |
| POST | `/api/entitlements/v2/consume` | 消耗功能配额 | Optional |
| POST | `/api/entitlements/v2/synastry/check-hash` | 合盘哈希检查 | Required |
| POST | `/api/entitlements/v2/synastry/record` | 记录合盘使用 | Required |
| GET | `/api/entitlements/v2/purchases` | 购买记录 | Required |
| POST | `/api/entitlements/v2/generate-hash` | 生成合盘哈希（不记录） | — |

#### 报告 API

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| GET | `/api/reports/available` | 可用报告类型 | — |
| GET | `/api/reports` | 用户报告列表 | Required |
| GET | `/api/reports/:reportId` | 报告详情 | Required |
| GET | `/api/reports/access/:reportType` | 检查报告类型访问权 | Required |
| POST | `/api/reports/generate` | 生成报告 | Required |
| POST | `/api/reports/purchase` | 购买报告 | Required |
| DELETE | `/api/reports/:reportId` | 删除报告 | Required |

#### 已保存解读 API (Saved Readings — #24)

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| POST | `/api/saved-readings` | 保存一份解读（natal/cycle/synastry） | Required |
| GET | `/api/saved-readings` | 列出当前用户的已保存解读（仅元数据） | Required |
| GET | `/api/saved-readings/:id` | 读取自己的某份解读（完整 payload） | Required |
| DELETE | `/api/saved-readings/:id` | 删除自己的某份解读 | Required |

> 隔离：每个查询都按会话 `user_id`（取自 JWT，非 body/params）过滤；他人 id 一律 404。最高 PII：`input_json` 存出生数据，service-role 写入 + RLS 用户行隔离读取；synastry `nameA/nameB` 防御性剥除（红线#4）。v1 前端保存仅 natal/cycle（synastry 因 output 散文可能含真名而延后）。

#### 工具 API

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| POST | `/api/geo/search` | 城市模糊搜索（canonical；body `{ q, limit?, lang? }`，避免城市名进 URL/access log）| — |
| GET | `/api/geo/search` | 城市模糊搜索（**deprecated alias**，一周期后下线；后端首次命中会 `console.warn`）| — |
| POST | `/api/detail` | 技术细节解读 | — |
| GET | `/api/astro/events` | 天象事件 | — |
| GET | `/api/astro/today` | 今日普世行星位置（10 大行星，按 UTC 午夜按日缓存，无 AI 调用）; no rate limit (safe due to day-scoped cache + zero LLM/IO per cached request); single-flight + integrity validation guards against cache stampede and mock-fallback poisoning | — |
| GET | `/api/user/status` | 用户状态 | Optional |
| GET | `/api/config` | 当前支付提供商配置 | — |
| POST | `/api/newsletter` | Email signup with honeypot anti-bot（Landing v2 模块 9）; 5 req/hour per IP + honeypot. 双 opt-in（`NEWSLETTER_CONFIRM_ENABLED=true` 时插 pending+token+发确认信；默认关 → 插 confirmed、不发信，dark until Resend DKIM 验证）| — |
| GET | `/api/newsletter/confirm/:token` | 双 opt-in 确认链接：翻 confirmed（幂等），渲染本地化 HTML 结果页（`?lang=en\|zh`）；无效 token 友好 404 | — |
| GET | `/api/newsletter/unsubscribe/:token` | 一键退订：翻 unsubscribed（幂等），渲染本地化 HTML；支撑 `List-Unsubscribe` 头 | — |
| GET | `/health` | 健康检查 | — |

#### GM 调试 API (开发环境)

| Method | Path | 说明 | Auth |
|--------|------|------|------|
| POST | `/api/gm/unlock-subscription` | 解锁订阅 | Required |
| POST | `/api/gm/cancel-subscription` | 取消订阅 | Required |
| POST | `/api/gm/add-tokens` | 添加 Credits | Required |
| POST | `/api/gm/clear-tokens` | 清空 Credits | Required |
| POST | `/api/gm/reset-all` | 重置所有权益 | Required |
| POST | `/api/gm/dev-session` | 创建开发会话 | — |
| GET | `/api/gm/status` | GM 命令状态 | — |
| POST | `/api/gm/clear-ai-cache` | 清空 AI 缓存 | — |

### 4.4 数据库 Schema (Database Schema)

#### 核心表

**users** — 用户账户
| Column | Type | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| email | VARCHAR(255) | 唯一邮箱 |
| name | VARCHAR(255) | 显示名 |
| avatar | TEXT | 头像 URL |
| provider | VARCHAR(20) | google / apple / email |
| provider_id | VARCHAR(255) | 第三方 ID |
| password_hash | TEXT | 密码哈希（email 注册） |
| birth_profile | JSONB | 出生信息 (JSON) |
| preferences | JSONB | 偏好设置 {theme, language} |
| email_verified | BOOLEAN | 邮箱是否已验证 |
| trial_ends_at | TIMESTAMPTZ | 试用期结束时间 |
| used_first_discount | BOOLEAN | 是否已用首次折扣（via migration 003） |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**trial_claims** — 试用领取历史（via migration 006，跨账号删除持久化）
| Column | Type | 说明 |
|--------|------|------|
| email_hash | VARCHAR(64) | 主键：邮箱 SHA-256 哈希（小写+可选 salt） |
| trial_ends_at | TIMESTAMPTZ | 首次发放试用的结束时间（保留以防重发） |
| first_claimed_at | TIMESTAMPTZ | 首次领取试用的时间 |
| created_at | TIMESTAMPTZ | 记录创建时间 |

> 设计意图：用户删除账号后，该表不会被清理；同邮箱重新注册时，沿用 `trial_ends_at`（多半已过期）而非发放新试用，防止刷免费额度。仅存哈希，符合 GDPR 被遗忘权（不保留可恢复 PII）。

**saved_readings** — 已保存解读（via migration 009，#24）
| Column | Type | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 (FK → users, ON DELETE CASCADE) |
| tool_type | VARCHAR(20) | natal / cycle / synastry（CHECK 约束） |
| title | TEXT | 列表显示标题（不含 synastry 真名） |
| input_json | JSONB | 解读输入（出生数据 — 最高 PII） |
| output_json | JSONB | 解读输出快照（重开不重算、不扣 credits） |
| lang | VARCHAR(5) | 生成时语言 |
| created_at | TIMESTAMPTZ | 保存时间 |

> RLS：用户仅能 SELECT 自己的行（`auth.uid()::text = user_id::text`）+ service-role 管理全部。API 用 service-role client，按会话 `user_id` 过滤实现隔离。账号删除经 `userService.deleteUser` 显式清理 + FK CASCADE 双重保证。synastry `nameA/nameB` 入库前剥除（红线#4）。

**newsletter_subscribers** — 邮件订阅（via migration 007，双 opt-in 列 via migration 008，#23）
| Column | Type | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| email | TEXT | 订阅邮箱（`lower(email)` 唯一索引） |
| source | TEXT | 采集来源（默认 `landing_v2`） |
| status | TEXT | `pending` / `confirmed` / `unsubscribed`（CHECK；008 默认 pending，旧行回填 confirmed） |
| confirm_token | TEXT | 32 随机字节 hex（64 字符），confirm + 一键退订的 bearer 密钥（部分唯一索引） |
| confirmed_at | TIMESTAMPTZ | 确认时间 |
| unsubscribed_at | TIMESTAMPTZ | 退订时间 |
| created_at | TIMESTAMPTZ | 创建时间 |

> RLS（007 起）：service-role only，无用户直接访问。双 opt-in 由 `NEWSLETTER_CONFIRM_ENABLED` 开关 dark-launch（默认关 → 单 opt-in 行为；开 → pending+token+确认信，须先验证 Resend SPF/DKIM）。token 仅 service-role 可见、不进日志。

**subscriptions** — 订阅管理
| Column | Type | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 (1:1, UNIQUE) |
| stripe_subscription_id | VARCHAR(255) | Stripe 订阅 ID（遗留） |
| stripe_customer_id | VARCHAR(255) | Stripe 客户 ID（遗留） |
| stripe_price_id | VARCHAR(255) | Stripe 价格 ID（遗留） |
| paypal_subscription_id | VARCHAR(255) | PayPal 订阅 ID（遗留） |
| airwallex_subscription_id | TEXT | Airwallex 订阅 ID |
| airwallex_customer_id | TEXT | Airwallex 客户 ID |
| payment_provider | VARCHAR(20) | 支付提供商 (stripe / paypal / airwallex) |
| plan | VARCHAR(20) | monthly / yearly |
| status | VARCHAR(20) | active / canceled / past_due / expired / trialing |
| current_period_start | TIMESTAMPTZ | 当前周期开始 |
| current_period_end | TIMESTAMPTZ | 当前周期结束 |
| cancel_at_period_end | BOOLEAN | 是否到期取消 |
| usage | JSONB | 使用量追踪 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**purchase_records** — 购买记录
| Column | Type | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 |
| feature_type | VARCHAR(100) | 功能类型 |
| feature_id | VARCHAR(255) | 功能标识 |
| scope | VARCHAR(20) | permanent / daily / per_synastry / per_month / consumable |
| price_cents | INTEGER | 价格（分） |
| payment_provider | VARCHAR(20) | 支付提供商 |
| stripe_payment_intent_id | VARCHAR(255) | Stripe 支付 ID（遗留） |
| stripe_checkout_session_id | VARCHAR(255) | Stripe 结账 ID（遗留） |
| paypal_order_id | VARCHAR(255) | PayPal 订单 ID（遗留） |
| valid_until | TIMESTAMPTZ | 过期时间 |
| quantity | INTEGER | 总量 |
| consumed | INTEGER | 已消耗量 |
| created_at | TIMESTAMPTZ | 创建时间 |

**free_usage** — 免费配额追踪
| Column | Type | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| device_fingerprint | VARCHAR(255) | 设备指纹（UNIQUE） |
| user_id | UUID | 用户 ID（UNIQUE） |
| ip_address | INET | IP 地址 |
| ask_used | INTEGER | Ask 周使用计数 |
| ask_daily_used | INTEGER | Ask 日使用计数 |
| ask_daily_reset_at | TIMESTAMPTZ | Ask 日重置时间 |
| ask_reset_at | TIMESTAMPTZ | Ask 周重置时间 |
| detail_used | INTEGER | Detail 使用计数 |
| synastry_used | INTEGER | 合盘周使用计数 |
| synastry_total_used | INTEGER | 合盘永久总计数（3 次上限） |
| synastry_daily_used | INTEGER | 合盘日使用计数 |
| synastry_daily_reset_at | TIMESTAMPTZ | 合盘日重置时间 |
| synthetica_used | INTEGER | Synthetica 使用计数 |
| synthetica_reset_at | TIMESTAMPTZ | Synthetica 重置时间 |
| user_timezone | VARCHAR(64) | 用户时区 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**synastry_records** — 合盘记录
| Column | Type | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 |
| synastry_hash | VARCHAR(128) | SHA256 去重哈希 |
| person_a_info | JSONB | A 的出生信息 |
| person_b_info | JSONB | B 的出生信息 |
| relationship_type | VARCHAR(50) | 关系类型 |
| is_free | BOOLEAN | 是否使用免费配额 |

**reports** — 报告
| Column | Type | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 |
| report_type | VARCHAR(50) | 报告类型 |
| title | VARCHAR(255) | 标题 |
| content | JSONB | 内容 |
| birth_profile / partner_profile | JSONB | 出生信息 |

**其他表**: subscription_usage（订阅周配额）、webhook_events（Webhook 幂等性）、registration_codes（邮箱验证码）、purchases（遗留购买表，待淘汰）、email_verification_tokens（邮箱验证令牌）、refresh_tokens（刷新令牌）

#### 数据库关系

```
users (1) ──┬─→ (1) subscriptions
            ├─→ (N) purchase_records
            ├─→ (N) reports
            ├─→ (N) synastry_records
            ├─→ (1) free_usage
            └─→ (N) subscription_usage
```

所有用户关联表在用户删除时 CASCADE 级联删除。

### 4.5 AI/Prompt 架构 (Prompt System)

#### 架构概览

Prompt 系统采用集中注册式架构，所有模板在 `manager.ts` 中统一注册和管理；全部 51 个模板均经 `withSafety()` 包装注入 AI 安全护栏。

**核心文件**:
- `backend/src/prompts/common.ts` — 类型定义 + 工具函数 + 安全常量
- `backend/src/prompts/manager.ts` — 注册表 + 全部模板 + `withSafety` helper (~2600 行)

#### AI 安全护栏（覆盖全 51 个 prompt）

所有 prompt 通过 `withSafety(template, { noFate?, cbtFooter? })` 包装注入：

| 常量（zh / en）| 作用范围 | 注入位置 |
|---|---|---|
| `SAFETY_INSTRUCTION_ZH/EN` | 全部 51 prompt | system 前缀：禁止医学诊断、禁止治疗承诺 |
| `NO_FATE_CERTAINTY_REMINDER_ZH/EN` | daily / ask / synastry / cycle / detail(transit/synastry/composite) — 共 34 个 | system 后缀：禁绝对化命运语言（"必然/will/destined"）→ 改用"可能/may/tends toward" |
| `CBT_DISCLAIMER_FOOTER_ZH/EN` | cbt-* — 共 6 个 | user prompt 指示 LLM 在输出末尾追加"这不是临床诊断"段落 |

**与危机检测的关系**：CBT 5 个分析端点先经关键词短路（`detectCrisis()`），命中即返回 helpline 不走 prompt；未命中才走 `withSafety` 包装的 prompt 路径——两层非重叠纵深防御。

#### Prompt 模板清单（全部 51 个，2026-05-18 集体 minor version bump）

| 模块 | 模板数 | 当前版本 | 主要模板 | 安全注入 |
|------|--------|----------|----------|----------|
| **Natal** | 3 | 5.2 | natal-overview, natal-core-themes, natal-dimension | SAFETY |
| **Daily** | 2 | 5.2 | daily-forecast, daily-detail | SAFETY + NO_FATE |
| **Synastry** | 16 | bumped minor | synastry-overview, core-dynamics, highlights, vibe-tags, relationship-timing, dynamic, weather-forecast 等 | SAFETY + NO_FATE |
| **Ask** | 1 | 10.1 | ask-answer (6 类别路由) | SAFETY + NO_FATE |
| **CBT** | 6 | bumped minor | cbt-analysis, aggregate, somatic, root, mood, competence | SAFETY + CBT_FOOTER |
| **Wiki** | 3 | bumped minor | wiki-home, wiki-classics-master, synthetica-analysis | SAFETY |
| **Detail** | 19 | bumped minor | detail-{type}-{context} 组合 | SAFETY + (NO_FATE for transit/synastry/composite contexts) |
| **Cycle** | 1 | 2.3 | cycle-naming | SAFETY + NO_FATE |

**部署影响**：全量 version bump 一次性失效所有 LLM 输出缓存（`ai:{promptId}:v{version}:{inputHash}`），首日 cache 命中率 ~0%，24h 自然回填；预计每次调用 system token 增加 60–150（~3-5% 成本上浮）。

#### Temperature 策略

| 等级 | Temperature | 用途 |
|------|-------------|------|
| T2 | 0.3 | Wiki / Detail / 百科 — 高准确度 |
| T3 | 0.5 | Natal / Synastry / CBT — 平衡洞察 |
| T4 | 0.6 | Daily / 时效建议 — 新鲜实用 |
| T5 | 0.7 | Ask — 创造性深度共情 |

#### 缓存策略

- **缓存键格式**: `ai:{promptId}:v{version}:{inputHash}`
- **缓存引擎**: Redis (IORedis)
- **版本化**: 每个 Prompt 模板携带版本号，版本更新自动失效旧缓存

### 4.6 认证流程 (Auth Flow)

```
用户点击登录
  ├── Google OAuth → POST /api/auth/google → JWT Token
  ├── Apple Sign-In → POST /api/auth/apple → JWT Token
  └── Email 注册 → POST /api/auth/send-code → 输入验证码
                  → POST /api/auth/verify-code → JWT Token

JWT Token 结构:
  ├── Access Token (短期)
  └── Refresh Token (长期) → POST /api/auth/refresh → 新 Access Token

首次注册:
  → 计算 email_hash = sha256(salt + lower(email))
  → 查询 trial_claims:
      ├── 命中 → trial_ends_at 沿用历史值（防止删号刷试用）
      └── 未命中 → trial_ends_at = now + 7 days，写入 trial_claims
  → 跳转 /onboarding 收集出生信息
  → 完成后跳转 /dashboard
```

### 4.7 部署架构 (Deployment)

| 组件 | 平台 | 说明 |
|------|------|------|
| **Frontend** | Vercel (Static) | Vite 构建 → `dist/` 目录 |
| **Backend** | Vercel (Serverless) | Express → Vercel Node Functions |
| **Database** | Supabase | PostgreSQL 托管 |
| **Cache** | Redis | IORedis 连接 |
| **Domain** | astrologywiki.com | www 子域名（301 重定向） |

**环境变量** (Vercel Project → Environment Variables；以下为 PR #4 之后强相关的安全配置)：

| Key | 用途 | Scope | 默认 / 必填 |
|-----|------|-------|-------------|
| `NODE_ENV` | Express + Vite 运行模式 | All | Vercel 自动注入 `production` |
| `ENABLE_CBT_CRISIS_OVERRIDE` | CBT 危机检测 override 总开关（与 `NODE_ENV !== 'production'` AND） | Preview/Development | 未设置；生产环境忽略 |
| `QA_CRISIS_OVERRIDE_TOKEN` | CBT override 共享密钥（header `x-crisis-override-token` 必须匹配） | Preview/Development | 未设置；生产环境忽略 |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | LLM 服务凭证 | All | 必填 |
| `REDIS_URL` | IORedis 连接（缓存 + Reservation TTL） | All | 必填 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | 数据库连接 | All | 必填 |
| `CRON_SECRET` | Cron endpoint 鉴权 | All | 必填 |
| `SENTRY_DSN` | 错误监控（Sentry）；未设则不加载 SDK、不初始化（生产 no-op，非 mock） | All | 选填 |
| 其余 | OAuth secrets / 支付 secrets / 邮件 secrets | All | 详见 backend/.env.example |

**Vercel 路由配置**:
- `/api/*` → `backend/src/index.ts` (Serverless Function)
- `/landing-v2/{en,zh}/index.html` → 静态预渲染 HTML（SEO 镜像，由 `scripts/generate-seo-pages.mjs` 生成）
- `/*` → `index.html` (SPA Fallback)

**安全响应头**（`vercel.json` headers，`source: "/(.*)"`）：
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- `Content-Security-Policy-Report-Only`（**非强制，仅上报不阻断**）：按 `docs/CSP_DOMAIN_ALLOWLIST.md` 的 directive 分组放行 GA4/GTM、Google Fonts、Google GIS、Unsplash、transparenttextures、Airwallex 等域名；`script-src`/`style-src` 暂用 `'unsafe-inline'` 占位（enforce 前需改 nonce/hash）。这是 backlog #8 重新启用 enforcing CSP 前的实测收集阶段——后端 helmet 的 `contentSecurityPolicy:false` 暂保持不变。

**Landing v2 上线策略**：
- `/landing-v2` 是新版营销首页的 staging 路由，**v2.6 阶段仅作灰度验证**
- 根路径 `/` 仍执行 `<Navigate to="/${lang}/wiki" replace />`，保留当前 Wiki-as-homepage 的 SEO 收益
- 待 v2 通过 GA4 弹出率 / Birth Chart 完成率 / Newsletter 订阅等指标验证后，再切换根路径至 NewLandingPage 并将 `/landing-v2` 设为 301 重定向

---

## 5. 用户旅程 / User Journey

### 5.1 新用户注册流程

```
1. 访问 Landing Page (/)
2. 选择登录方式 → Google / Apple / Email
3. 首次注册 → 自动获得 7 天试用期
4. Onboarding 引导 (/onboarding)
   ├── 输入出生日期和时间
   ├── 选择出生地点（城市搜索）
   ├── 选择关注标签
   └── 确认时区和准确度
5. 进入 Dashboard (/dashboard) → 查看个人星盘
```

### 5.2 日常使用流程

```
1. 打开 App → Dashboard 查看星盘概览
2. 查看 Forecast → 今日运势与行运分析
3. Ask Oracle → 提出占星问题（消耗配额）
4. Journal → 记录情绪与认知日记
5. Wiki → 浏览占星知识与经典书籍
6. Cycles → 查看当前周期状态
```

### 5.3 付费转化流程

```
免费使用
  → 触及配额限制（Ask 3次/周、Synastry 3次永久、维度锁定）
  → 显示付费墙 (Paywall)
  → 选择方案
      ├── 订阅 ($6.99/月 或 $41.99/年，首次 50% off)
      │   → Airwallex 支付 → 支付成功页 → 返回使用
      └── 积分包（一次性购买特定功能）
          → 选择积分数量 → Airwallex 支付 → 积分到账
```

---

## 6. 国际化 / i18n

### 6.1 语言支持

| 语言 | 代码 | 用途 |
|------|------|------|
| **English** | `en` | 主语言（默认），面向欧美用户 |
| **中文** | `zh` | 辅助语言，语言切换选项 |

**前端实现**: LanguageContext + TRANSLATIONS 全局词典（`constants.ts`）

**后端实现**: 所有 API 支持 `lang` 参数，通过 `resolveLang()` 统一处理

### 6.2 多币种支持

支持 4 种 Airwallex 结算货币，按**真实请求信号**自动选定（`backend/src/utils/currency.ts::resolveCurrencyFromRequest`），优先级：`?currency=` 显式覆盖 → Vercel `x-vercel-ip-country`（IP 国家）→ `Accept-Language` 地区子标签 → USD 默认。

| 币种 | 用途 | 触发国家 |
|------|------|----------|
| **USD** | 主要定价货币 / 默认兜底 | 默认 + 非映射国家 |
| **CNY** | 中国用户 | CN |
| **EUR** | 欧元区 | 欧元区 20 国 |
| **GBP** | 英国 | GB |

**Price ID 兜底（红线：绝不编造金额）**：EUR/GBP 的订阅 Airwallex price ID 未配置时，回退到 USD price ID 并记 warning，不生成虚构金额；续费 / 积分为 PaymentIntent，按 `config/airwallex.ts` 的 per-currency 金额计价。EUR/GBP 订阅 price ID 经 `AIRWALLEX_PRICE_{MONTHLY,YEARLY}[_FIRST]_{EUR,GBP}` env 配置（未配则走 USD 兜底）。

### 6.3 翻译系统

- **前端**: `useLanguage()` hook → `t.module.key` 访问翻译
- **后端 Prompt**: `SINGLE_LANGUAGE_INSTRUCTION` (zh) / `SINGLE_LANGUAGE_INSTRUCTION_EN` (en) 动态切换
- **错误消息**: 统一使用英文（符合欧美产品定位）
- **后备策略**: `t.key || 'English Fallback'` 确保不会显示空值
