# 能力规范：转化优化

## ADDED Requirements

### Requirement: 优化注册表单
系统 SHALL 简化注册表单以提升完成率，仅保留必需字段并提供实时验证。

#### Scenario: 注册表单仅包含必需字段
- **WHEN** 用户打开注册模态框
- **THEN** 应仅显示 Email 和 Password 字段
- **AND** Name 字段应为可选
- **AND** 应提供实时验证反馈

### Requirement: 完善社交登录
系统 SHALL 配置并优化社交登录体验，支持 Google 和 Apple 登录。

#### Scenario: Google 登录正常工作
- **WHEN** 用户点击"使用 Google 登录"并完成 OAuth 流程
- **THEN** 用户应成功登录
- **AND** 应追踪 `signup_completed` 事件（method: 'google'）

### Requirement: 优化付费墙文案
系统 SHALL 重写付费墙文案，从功能导向转为利益导向，突出用户能获得的价值。

#### Scenario: 付费墙标题突出利益
- **WHEN** 用户看到付费墙
- **THEN** 标题应说明用户能获得什么（而非"升级到 Pro"）
- **AND** 标题应具体且吸引人

### Requirement: 优化付费墙触发时机
系统 SHALL 在用户体验价值后触发付费墙，避免在关键流程中阻断用户。

#### Scenario: 新用户在首次核心操作后看到软提示
- **WHEN** 新用户完成首次核心操作（如生成星盘）
- **THEN** 应显示软提示（非阻断式）
- **AND** 提示应强调已体验的价值

### Requirement: 优化首页价值主张
系统 SHALL 重写首页核心文案以提升清晰度，确保用户在 5 秒内理解产品价值。

#### Scenario: 5 秒清晰度测试
- **WHEN** 新用户访问首页并查看 5 秒
- **THEN** 用户应理解产品是什么
- **AND** 用户应理解产品能提供什么价值
- **AND** 用户应知道下一步该做什么

### Requirement: 实施 A/B 测试框架
系统 SHALL 建立 A/B 测试基础设施以验证优化效果，支持实验定义、变体分配和转化追踪。

#### Scenario: 用户被分配到测试变体
- **WHEN** 用户访问网站并触发实验
- **THEN** 用户应被随机分配到一个变体
- **AND** 分配应在整个会话中保持一致
- **AND** 应追踪 `ab_test_assigned` 事件

## MODIFIED Requirements

### Requirement: 更新 Paywall 组件
系统 SHALL 重构 `components/auth/Paywall.tsx` 以支持新的文案和触发逻辑。

#### Scenario: Paywall 组件接受自定义文案
- **WHEN** 开发者使用 Paywall 组件并传入 `content` prop
- **THEN** 组件应使用自定义文案
- **AND** 应支持 A/B 测试变体

## REMOVED Requirements

无
