<!-- INPUT: 探索自我页面布局、相位矩阵与图标/宫主星调整需求。 -->
<!-- OUTPUT: OpenSpec 本命盘洞察增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements
### Requirement: Hero natal chart placement
系统 SHALL 在仪表盘主流程中将本命盘图置于“方法论”与“核心画像分析”之间，并在桌面视图以当前呈现尺寸的 1.3 倍展示。

#### Scenario: Chart appears in primary flow
- **WHEN** 用户进入仪表盘且资料有效
- **THEN** 本命盘图在方法论下方渲染并可见于核心画像之前，且尺寸放大

### Requirement: Aspect matrix layout
系统 SHALL 在专业附录的相位区域使用 10 大行星（Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto）构建下三角矩阵，并在格子内显示相位符号与 orb。

#### Scenario: Aspect matrix renders in appendix
- **WHEN** 用户打开专业附录的相位区域
- **THEN** 页面显示 10 大行星下三角矩阵，且每个相位格包含相位符号与 orb 数值

### Requirement: Vector iconography for bodies
系统 SHALL 在行星与小行星信息中使用 SVG 矢量图标呈现天体标识，避免 emoji/glyph，并保证图标可通过资源替换统一更新。

#### Scenario: Planetary tables show crisp icons
- **WHEN** 用户查看行星或小行星信息表
- **THEN** 每一行展示清晰的 SVG 图标，且不使用 emoji 或字体符号替代

### Requirement: House ruler clarity
系统 SHALL 在宫主星信息中展示 12 宫的现代守护星，并标注守护星所在宫位（飞入宫位）。

#### Scenario: House rulers show modern mapping
- **WHEN** 用户查看宫主星信息
- **THEN** 每宫显示守护星与其飞入宫位，且使用现代守护星规则

## MODIFIED Requirements
### Requirement: Natal chart facts and overview
系统 SHALL 通过后端获取真实星盘数据与概览解读，并返回双语内容用于核心画像分析，其中 Big 3 需拆分为 `sun`/`moon`/`rising` 三个模块，剩余四个模块在桌面端以 2×2 网格展示。

#### Scenario: Overview loads from backend
- **WHEN** 用户进入仪表盘且资料有效
- **THEN** 前端展示 `sun`/`moon`/`rising` 三模块与四个次级模块的 2×2 布局，并按语言切换渲染内容

### Requirement: Dimension analysis
系统 SHALL 通过后端获取维度分析 AI 内容，并以统一结构展示“引导语 + 关键拆解 + 练习”，其中 `prompt_question` 作为顶部引导语，且 `what_helps` 标签以“缓解方式/Relief”呈现并使用易理解表述。

#### Scenario: Dimension content loads per section
- **WHEN** 维度区块被渲染或展开
- **THEN** 前端在模块顶部显示 `prompt_question`，并使用统一排版与“缓解方式/Relief”标签展示拆解字段

### Requirement: Core themes insights
系统 SHALL 通过后端获取核心主题（Drive/Fear/Growth 等）内容，并在页面中以连贯叙事结构呈现，减少碎片化卡片与重复分隔。

#### Scenario: Core themes load on dashboard
- **WHEN** 用户进入仪表盘并请求核心主题
- **THEN** Drive/Fear/Growth 各自以单一主叙事区块呈现，并附紧凑的行动提示与关键要点

### Requirement: Technical breakdown
系统 SHALL 将专业附录以瀑布式单列展示，顺序为元素矩阵、相位列表、行星信息、小行星信息、宫主星信息，默认全展开且不使用 Tab 或折叠切换。

#### Scenario: Technical section is available
- **WHEN** 用户打开专业附录
- **THEN** 所有模块按顺序依次显示在同一滚动视图中并默认展开
