<!-- INPUT: Oracle 问答功能增量规范（布局密度、加载体验与在线指示）。 -->
<!-- OUTPUT: MODIFIED 需求与场景定义（含全屏 loading 与选中高亮）。 -->
<!-- POS: 变更增量规范；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

# Capability: Answer Oracle Questions (Incremental)

## Purpose
优化 Oracle 问答页面布局、密度与加载体验，强化 ORACLE 身份与在线状态提示，并统一 Rituals/发送按钮交互。

## MODIFIED Requirements

### Requirement: No-scroll single page layout
系统 SHALL 重新设计页面布局，所有内容在一屏内展示，无垂直滚动，并保留上下留白。

#### Scenario: Desktop layout without scroll
- **WHEN** 用户在桌面浏览器访问 /oracle 页面
- **THEN** 页面高度等于视口高度
- **AND** 无垂直滚动条
- **AND** 类别标签、问题矩阵、输入区域均可见
 - **AND** 顶部预留约 24px 空白
 - **AND** 底部预留约 4–6px 空白

#### Scenario: Mobile layout without scroll
- **WHEN** 用户在移动设备访问 /oracle 页面
- **THEN** 页面高度等于视口高度
- **AND** 类别标签支持横向滚动
- **AND** 问题矩阵显示为单列
- **AND** 输入区域固定在底部

#### Scenario: Question area constraint
- **WHEN** 问题数量超出可视区域
- **THEN** 问题区域使用内部滚动或截断
- **AND** 页面整体不产生滚动

#### Scenario: Density compression
- **WHEN** 用户访问 /oracle 页面
- **THEN** 问题卡片与输入栏高度缩减为原尺寸约 80%
- **AND** 类别与问题区域间距减少
- **AND** THE VOID/ORACLE 标题区域与问题区域间距适度拉大

### Requirement: Rituals counter combined with send action
系统 SHALL 将 Rituals 计数与发送按钮合并为单一操作按钮区域。

#### Scenario: Counter display position
- **WHEN** 用户访问 /oracle 页面
- **THEN** Rituals 计数与发送按钮处于同一可点击区块
- **AND** 右上角不再显示 Rituals 计数器

#### Scenario: Counter styling
- **WHEN** 用户查看 Rituals 计数器
- **THEN** 显示格式为 "3/3" 或类似紧凑样式
- **AND** 使用 gold-500 或 accent 颜色
- **AND** 与发送按钮视觉协调

### Requirement: Oracle identity and online indicator
系统 SHALL 将标题改为 ORACLE/神谕，并展示绿色呼吸态在线指示。

#### Scenario: Title localization
- **WHEN** 用户切换语言
- **THEN** 英文标题显示为 "ORACLE"
- **AND** 中文标题显示为 "神谕"

#### Scenario: Online indicator
- **WHEN** 用户查看标题区域
- **THEN** "ORACLE ONLINE" 前显示绿色呼吸点
- **AND** 呼吸点为简洁脉冲动画，不干扰布局

### Requirement: Selected question highlight
系统 SHALL 在用户选中问题时对当前卡片进行高亮。

#### Scenario: Question selection highlight
- **WHEN** 用户点击某个预设问题
- **THEN** 该问题卡片显示高亮状态
- **AND** 高亮状态与未选中卡片明显区分

### Requirement: Full-screen loading experience
系统 SHALL 在提交问题后切换到全屏 loading 视图，并展示动态占星短语轮播。

#### Scenario: Loading transition
- **WHEN** 用户点击发送
- **THEN** 问答列表视图被全屏 loading 替换
- **AND** loading 视图包含双层旋转星盘 SVG（底层低透明旋转、上层高亮旋转）

#### Scenario: Phrase rotation
- **WHEN** loading 视图显示
- **THEN** 轮播 10–20 条短语（约 10 字/词）
- **AND** 文案随语言切换使用对应语言

### Requirement: DeepSeek API verification
系统 SHALL 确认后端正确使用 DeepSeek API 处理问答请求。

#### Scenario: API configuration verification
- **WHEN** 后端服务运行中
- **THEN** 确认 ask 路由使用 DeepSeek API
- **AND** 确认正确读取 DEEPSEEK_API_KEY 环境变量

#### Scenario: Q&A functionality works
- **WHEN** 用户提交问题
- **THEN** 后端调用 DeepSeek API 生成回答
- **AND** 返回结构化的 AskAnswerContent
- **AND** meta.source 标记为 "ai"
