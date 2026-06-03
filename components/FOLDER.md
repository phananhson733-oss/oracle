<!-- INPUT: 主应用 UI 组件与设计原语（含 SEO 元信息、本地 head 输出、OG 绝对 URL、付费墙购买回调、支付成功同步与积分充值弹窗）。 -->
<!-- OUTPUT: components 架构摘要与文件索引（含付费墙回调、支付成功同步/返回、积分充值弹窗与纸感映射记录）。 -->
<!-- POS: 主应用组件目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components

架构概要
- 提供主应用复用 UI 组件与页面子块。
- UIComponents 定义设计系统与上下文。
- 其他文件承载星盘、技术表格与 CBT 相关 UI。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录组件目录架构与文件清单。
- AstroChart.tsx｜地位：可视化组件｜功能：绘制星盘 SVG（后端数据驱动）。
- TechSpecsComponents.tsx｜地位：功能组件｜功能：技术参数表格与列表 UI。
- UIComponents.tsx｜地位：基础组件库｜功能：主题/语言上下文与通用组件。
- payment.tsx｜地位：功能弹窗｜功能：积分充值占位弹窗与订阅引导。
- ConsentBanner.tsx｜地位：提示组件｜功能：展示分析追踪同意横幅并收集授权（analytics/marketing toggle 以 htmlFor + aria-label 暴露可访问名 + role=switch）。
- MobileBottomNav.tsx｜地位：导航组件｜功能：移动端（<md）固定底部 tab bar，icon + label + active 高亮，镜像顶部 6 个 nav 项与 t.nav.*/isActive 逻辑；safe-area 内边距，z-[150] 让位 consent banner（z-[200]）。
- Breadcrumb.tsx｜地位：导航组件｜功能：面包屑导航与结构化数据输出。
- ComparisonPage.tsx｜地位：营销页面｜功能：竞品对比页面（vs 与 alternatives 格式）。
- ChartMiniCalc.tsx｜地位：工具组件｜功能：tool-led 北交点迷你计算器（客户端纯查表，DOB 不出浏览器；instrument chart_start/result_shown/full_chart_cta_click 漏斗，只送分类字段）。分层互补定位：作为 #6 全盘（WikiChartCTA/BirthChartSection）的轻型上游钩子，结果区 CTA 经 `fullChartHref` prop 指向全盘（默认回退 /auth）。
- SafetyFooter.tsx｜地位：合规组件｜功能：psych-adjacent 文章的强制安全 footer SPA 渲染（临床免责声明 + 危机热线），文案与静态 stub 同源自 `utils/safetyFooter.ts`（单一来源、绝不漂移）。因 inject-spa 是 replace 非 hydrate，JS 用户这份必须由 SPA 渲染（CLAUDE.md AI 安全边界 #1/#4）。由 `wiki/WikiArticleDetailPage` 在 `article.psychAdjacent` 时渲染。

目录
- auth｜地位：认证组件目录｜功能：登录/升级订阅、支付成功页与用户菜单。
- cbt｜地位：CBT 组件目录｜功能：CBT 日记子模块 UI。
- wiki｜地位：Wiki 组件目录｜功能：心理占星百科页面与详情组件。

近期更新
- 新增 MobileBottomNav（移动端固定底部 tab bar，复用顶部 6 项 + t.nav.* + isActive，safe-area + z-[150] 让位 consent banner）；ConsentBanner 的 analytics/marketing toggle 补可访问名（htmlFor 关联可见文字 + aria-label en/zh + role=switch），不改持久化逻辑。
- 新增 SafetyFooter（psych-adjacent 强制安全 footer 的 SPA 渲染），并由 WikiArticleDetailPage 在 article.embeddedTool/psychAdjacent 时挂载 ChartMiniCalc + SafetyFooter（embeddedTool 在场时抑制底部 WikiChartCTA，避免重复 CTA）。
- 支付成功页增加 PayPal 订阅确认兜底，同步登录/订阅状态并默认返回个人信息页，避免订阅后回到 onboarding。
- 新增积分充值弹窗组件（CreditsModal），展示积分余额并引导订阅，充值入口保持占位提示。
- 新增竞品对比页面组件（ComparisonPage），支持 vs 与 alternatives 两种格式。
- 新增面包屑导航组件（Breadcrumb），支持结构化数据输出与语义化标记。
- 新增分析追踪同意横幅（ConsentBanner），用于收集合规授权。
- 新增 Organization/WebSite 全局结构化数据。
- SEO 组件扩展支持文章元数据（publishedTime, modifiedTime, author, tags）。
- 星盘/技术附录/行星提示在 light 模式下加入 Unicode 色阶修正与描边，星座文本同步加深对比，提升 ASC/金黄色符号可读性。
- SEO 组件回切本地 head 输出，并保留 OG/Twitter 绝对地址解析。
- Wiki 组件接入 SEO 元信息与结构化数据输出。
- 付费墙积分购买新增成功回调，用于付费后触发后续操作。
- 详情解读 Modal 对齐 Ask 报告卡片节奏，深度解读条目改为编号展示并提升暗色卡片边框可见度。
- 付费墙 LockedAccordion 与探索自我 Accordion 的间距/分隔线/背景一致化。
- AstroChart 星盘底色与标签色改用主题色变量，移除硬编码黑白与 hex。
- 报告列表/详情与订阅升级弹窗统一按钮加载态与纸感边框对比度。
- UIComponents/Paywall/认证菜单同步 paper 底色与遮罩层级，提升轻主题一致性。
- 设计 tokens 与 UIComponents light theme 映射对齐 paper 温暖色系并提升正文对比度。
- 报告列表改为积分定价展示并接入订阅折扣提示。
- 付费墙改为积分解锁，显示积分余额与积分不足提示并补充积分充值占位入口。
- UIComponents 在迁移完成后支持用云端资料回填本地档案状态。
- 支付成功页、升级弹窗与用户菜单的订阅管理入口改为跳转订阅门户。
- 详情解读 Modal 参考 Ask 报告卡片化分区，强化深度解读的标签前缀、字号与配色节奏。
- 付费墙购买/订阅失败时显示错误提示并防止重复点击。
- Synthetica 蓝图文案行距与相位计数字号调整，生成按钮旁显示日额度。
- CBT 统计入口补充解读权限校验并接入付费墙流程。
- 付费墙补充详情解锁定价配置。
- 修复经典详情封面 SVG 角标路径的渲染报错。
- 经典书架与详情页升级 UI/UX Pro Max 氛围，强化书架框架与阅读质感。
- 经典详情长文加入段落/编号/重点高亮的排版样式。
- 优化 Wiki 经典书架氛围与详情阅读宽度。
- 新增 Wiki 经典书籍书架与详情组件。
- Wiki 详情/关联条目符号强制 Unicode 文本变体，避免 emoji。
- Wiki 四大支柱图标强制 Unicode 文本显示，去除 emoji。
- Wiki 全站中文文案去英文、行星/虚点/小行星/星座图标统一为 Unicode。
- Wiki 首页/百科/详情页统一容器宽度与探索自我布局对齐。
- 卡片恢复左侧窄色条，按卡片定位保留视觉强调。
- 报告/支付/Wiki 错误提示卡片恢复左侧色条，保持统一边框层次。
- 统一磨砂黑 + 暗金的组件色板与字体体系。
- 背景基调进一步压暗，弱化玻璃层与光晕。
- 星盘与技术附录统一星座/行星配色并增强层次。
- 星盘行星/星座/相位连线改为更鲜亮的高饱和配色。
- 专业附录行星图标在 light 模式下增强对比度。
- CBT 组件在 light 模式下提升边框与金色文本对比度，并收紧报告间距。
- 相位矩阵改为对角标签布局并接入星座 SVG 配色。
- 星盘图例右对齐且支持本地化文案。
- 星盘缩放改为可控并避免负间距。
- 星盘新增紧凑间距模式以抵消缩放后的底部留白。
- 相位矩阵列宽固定，保证与左侧行星列对齐。
- 相位矩阵行星图标放大并移除对角文字标签。
- 行星列表移除外框并放大图标尺寸。
- 相位矩阵 Sun 行标图标移除，宫主星图标尺寸与行星列表一致。
- 页面容器宽度调整为 1280px，并同步详情解读与星盘画布最大宽度。
- 相位矩阵 Sun 行标文字移除，核心画像区域位置微调。
- 星盘宫头度分沿外圈切线排列，避免外环溢出。
- 星盘宫头度分与星座 icon 间距加大以提升环绕清晰度。
- 双人盘仅保留跨盘相位线，并统一对齐行运盘 orb 设置。
- 行运交点加入跨盘相位矩阵行列以同步相位信息。
- 双人盘北交点相位线补全，避免缺失交点连线。
- 相位矩阵方阵改为上三角展示，三角矩阵列标题上移对齐。
- 相位矩阵方阵行列头改为行星图标样式以贴近探索自我风格。
- 今日运势相位矩阵使用探索自我的图标与 orb 样式呈现。
- 相位矩阵首格补齐 Sun 图标，保持行星矩阵起始清晰。
- 星盘宫头外圈标注恢复并校准角度映射，移除外圈分割线与固定轴标签。
- 星盘外圈移除星座图标，宫头标注放大并重新定位。
- 星盘相位线配色改为蓝/红/绿/紫，并精简图例文案。
- 专业附录相位矩阵补齐 Desc/IC 轴点并同步展示顺序。
- CBT 日历压缩为单屏展示，并将报告模块改为纵向单列。
- CBT 主界面整体上移并放大日历标题字号，底部按钮区上下居中。
- Accordion 支持 onToggle 回调用于分区懒加载触发。
- Accordion 新增受控 open 状态，便于持久化展开/收起。
- 元素矩阵放大文字与行星图标并移除环形底圈。
- 相位矩阵移除 DSC/IC/MC，并为跨盘矩阵补齐 Asc 行。
- 宫主星飞入宫位展示补充星座信息。
- 新增心理占星百科 Wiki 页面与详情组件。
