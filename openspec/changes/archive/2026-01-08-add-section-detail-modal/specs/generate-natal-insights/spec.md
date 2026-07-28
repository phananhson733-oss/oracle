## ADDED Requirements

### Requirement: On-demand technical section detail interpretation
系统 SHALL 在技术规格表格（元素矩阵、相位表、行星信息、小行星信息、宫主星信息）的标题栏提供"查看详情"按钮，用户点击后通过后端 API 按需获取该模块的 AI 占星解读，并以弹窗形式展示。

#### Scenario: User requests element matrix interpretation
- **WHEN** 用户在探索自我页面点击元素矩阵旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=elements`、`context=natal` 与星盘数据
- **AND** 弹窗展示 AI 生成的元素矩阵解读内容

#### Scenario: User requests aspect matrix interpretation
- **WHEN** 用户点击相位表旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=aspects`、`context=natal` 与相位数据
- **AND** 弹窗展示 AI 生成的相位解读内容

#### Scenario: User requests planet positions interpretation
- **WHEN** 用户点击行星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=planets`、`context=natal` 与行星位置数据
- **AND** 弹窗展示 AI 生成的行星解读内容

#### Scenario: User requests asteroid positions interpretation
- **WHEN** 用户点击小行星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=asteroids`、`context=natal` 与小行星位置数据
- **AND** 弹窗展示 AI 生成的小行星解读内容

#### Scenario: User requests house ruler interpretation
- **WHEN** 用户点击宫主星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=rulers`、`context=natal` 与宫主星数据
- **AND** 弹窗展示 AI 生成的宫主星解读内容

#### Scenario: Detail content is lazy-loaded
- **WHEN** 页面首次加载
- **THEN** 系统不自动请求任何详情解读内容
- **AND** 仅当用户点击"查看详情"按钮时才发起 API 请求

#### Scenario: Detail modal shows loading state
- **WHEN** 用户点击"查看详情"按钮且 API 请求进行中
- **THEN** 弹窗显示加载状态指示器

#### Scenario: Detail modal handles error gracefully
- **WHEN** API 请求失败
- **THEN** 弹窗显示错误提示并提供重试按钮

### Requirement: Transit context detail interpretation
系统 SHALL 为今日运势页面的专业附录（行运相位矩阵、行运行星/小行星、宫主星）提供"查看详情"按钮，用户点击后获取行运上下文的 AI 占星解读。

#### Scenario: User requests transit aspect interpretation
- **WHEN** 用户在今日运势页面点击相位矩阵旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=aspects`、`context=transit`、行运日期与相位数据
- **AND** 弹窗展示当日行运相位的 AI 解读

#### Scenario: User requests transit planet interpretation
- **WHEN** 用户点击行运行星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=planets`、`context=transit`、行运日期与行星位置
- **AND** 弹窗展示当日行运行星的 AI 解读

#### Scenario: User requests transit asteroid interpretation
- **WHEN** 用户点击行运小行星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=asteroids`、`context=transit`
- **AND** 弹窗展示当日行运小行星的 AI 解读

#### Scenario: User requests house ruler interpretation in transit context
- **WHEN** 用户点击宫主星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=rulers`、`context=transit`
- **AND** 弹窗展示宫主星在行运上下文中的 AI 解读

### Requirement: Synastry context detail interpretation
系统 SHALL 为合盘页面的本命盘 Tab、对比盘 Tab 和组合盘 Tab 的技术规格表格提供"查看详情"按钮，用户点击后获取合盘上下文的 AI 占星解读。

#### Scenario: User requests natal-A detail in synastry
- **WHEN** 用户在合盘 natal_a Tab 点击任意表格的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `context=natal` 与 A 方星盘数据
- **AND** 弹窗展示 A 方本命盘的 AI 解读

#### Scenario: User requests natal-B detail in synastry
- **WHEN** 用户在合盘 natal_b Tab 点击任意表格的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `context=natal` 与 B 方星盘数据
- **AND** 弹窗展示 B 方本命盘的 AI 解读

#### Scenario: User requests synastry aspect interpretation (A to B)
- **WHEN** 用户在 syn_ab Tab 点击相位表的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=aspects`、`context=synastry`、A/B 双方数据
- **AND** 弹窗展示 A 对 B 的合盘相位 AI 解读

#### Scenario: User requests synastry aspect interpretation (B to A)
- **WHEN** 用户在 syn_ba Tab 点击相位表的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=aspects`、`context=synastry`、B/A 双方数据
- **AND** 弹窗展示 B 对 A 的合盘相位 AI 解读

#### Scenario: User requests composite chart detail
- **WHEN** 用户在 composite Tab 点击任意表格的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `context=composite` 与组合盘数据
- **AND** 弹窗展示组合盘的 AI 解读
