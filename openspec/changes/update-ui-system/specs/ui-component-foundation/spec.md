# UI 原语与布局基础

## ADDED Requirements

### Requirement: 原语使用设计 tokens
系统 SHALL 使用 `components/design-tokens.ts` 中的颜色、间距、圆角与交互 token 构建基础 UI 原语（Card/Button/Input/Modal/Tooltip 等），避免在原语内部硬编码颜色与尺寸。

#### Scenario: Card 原语统一
- Given 开发者使用 Card 组件
- When Card 渲染
- Then Card 使用 token 定义的圆角、背景、边框与过渡

### Requirement: 间距与节奏符合规范
系统 SHALL 采用 COLOR_SYSTEM_GUIDE 推荐的间距策略：卡片内边距至少 `p-6`，元素间隙使用 `gap-4` 或 `gap-6`，区块间距使用 `space-y-8` 或 `mb-12`。

#### Scenario: 区块间距保持节奏
- Given 页面包含多个内容区块
- When 页面渲染
- Then 区块之间使用 `mb-12` 或 `space-y-8`

### Requirement: 统一交互过渡
系统 SHALL 为可交互组件应用统一过渡 `transition-all duration-300 ease-in-out`，并遵循 `INTERACTIVE_STATES` 交互状态。

#### Scenario: 按钮悬停一致
- Given 用户悬停在按钮上
- When hover 状态触发
- Then 过渡时长与 easing 与标准一致

### Requirement: 扁平化卡片层级
系统 SHALL 避免多层卡片嵌套，仅使用单层卡片与间距区分层级。

#### Scenario: 列表卡片渲染
- Given 页面展示列表内容
- When 渲染各项卡片
- Then 不出现多层边框嵌套
