# UI 色彩系统合规

## ADDED Requirements

### Requirement: 基础文本与背景遵循 COLOR_SYSTEM_GUIDE（保留 paper 色系）
系统 SHALL 在深色与浅色主题下使用 COLOR_SYSTEM_GUIDE 规定的主/次/弱文本、背景与卡片背景语义，同时保留 light theme 的 `paper-*` 温暖色系并确保对比度达标。

#### Scenario: 深色主题基础色应用
- Given 用户启用深色主题
- When UI 渲染全局背景与卡片
- Then 主背景使用 `bg-space-950`
- And 卡片使用 `bg-space-900/60`
- And 主/次/弱文本分别使用 `text-star-50`/`text-star-200`/`text-star-400`

#### Scenario: 浅色主题基础色应用（paper）
- Given 用户启用浅色主题
- When UI 渲染全局背景与卡片
- Then 主背景使用 `bg-paper-100` 或等效的 `paper-*` 温暖色
- And 卡片使用 `bg-white/80` 或 `paper-*` 的等效透明度背景
- And 主/次/弱文本分别使用 `text-paper-900`/`text-paper-600`/`text-paper-400`（与 `paper` 对比度匹配）

### Requirement: 禁用纯黑与纯白直用
系统 SHALL 避免直接使用 `#000`/`#fff` 或 `bg-black`/`text-black`/`bg-white`/`text-white` 作为基础色，统一使用规范 token 或带透明度的白。

#### Scenario: 遮罩与覆盖层替换
- Given 页面出现弹窗或遮罩
- When 渲染背景遮罩
- Then 使用 `bg-space-950/40` 或等价 token
- And 不使用 `bg-black/40` 作为遮罩

#### Scenario: 颜色审计通过
- Given UI 变更完成
- When 执行颜色审计
- Then 不存在 `#000`/`#fff` 或纯黑/纯白 Tailwind 类的直用

### Requirement: 色彩层次符合 60/30/10 规则
系统 SHALL 使用主导色/次要色/强调色构建清晰层级，保证 60/30/10 比例分布。

#### Scenario: 页面层级清晰
- Given 用户进入任一核心页面
- When 页面加载完成
- Then 背景与大面积区域使用主导色
- And 容器与卡片使用次要色
- And 交互重点使用强调色或功能域色

### Requirement: 功能域与语义色规范化
系统 SHALL 在占星/心理/洞察等模块使用 FEATURE_COLORS，对状态反馈使用 SEMANTIC_COLORS。

#### Scenario: 占星模块主按钮
- Given 用户访问占星相关页面
- When 渲染主按钮或关键入口
- Then 使用 `FEATURE_COLORS.astrology` 对应的主色样式

#### Scenario: 状态反馈一致
- Given 页面展示成功/警告/错误/信息提示
- When 渲染状态组件
- Then 使用 `SEMANTIC_COLORS` 中对应状态颜色

### Requirement: Unicode 图标与底板对比度
系统 SHALL 确保 unicode 图标（例如星座/行星符号）与其底板背景在深浅主题下具备足够对比度，并与文本对比度要求一致。

#### Scenario: 深色主题 icon 对比度
- Given 用户启用深色主题
- When 渲染 unicode 图标与底板
- Then 图标颜色与底板背景对比度满足 WCAG AA

#### Scenario: 浅色主题 icon 对比度
- Given 用户启用浅色主题
- When 渲染 unicode 图标与底板
- Then 图标颜色与底板背景对比度满足 WCAG AA
