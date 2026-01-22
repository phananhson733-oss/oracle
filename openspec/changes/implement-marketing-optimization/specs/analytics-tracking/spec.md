# 能力规范：分析追踪体系

## ADDED Requirements

### Requirement: 集成 Google Analytics 4
系统 SHALL 集成 GA4 以追踪所有页面浏览和用户行为，包括页面浏览、用户属性和自定义事件。

#### Scenario: 用户访问首页时记录页面浏览
- **WHEN** 用户首次访问网站
- **THEN** GA4 应记录 `page_view` 事件
- **AND** 事件应包含 `page_title`, `page_location`, `page_referrer` 参数

### Requirement: 集成 Google Tag Manager
系统 SHALL 集成 GTM 以灵活管理追踪代码，通过 dataLayer 推送事件数据。

#### Scenario: GTM 容器正确加载
- **WHEN** 用户访问网站
- **THEN** GTM 容器应在 `<head>` 中加载
- **AND** `window.dataLayer` 应存在并可用

### Requirement: 追踪用户注册
系统 SHALL 追踪用户注册流程的所有关键步骤，包括开始注册、完成注册和注册失败。

#### Scenario: 用户完成注册时触发事件
- **WHEN** 用户成功完成注册
- **THEN** 应触发 `signup_completed` 事件
- **AND** 事件应包含 `method` 参数（email/google/apple）
- **AND** 应设置 `user_id` 用户属性

### Requirement: 追踪付费转化
系统 SHALL 追踪所有付费相关的转化事件，包括付费墙展示、升级点击和购买完成。

#### Scenario: 用户完成付费时触发转化事件
- **WHEN** 用户支付成功
- **THEN** 应触发 `purchase` 事件
- **AND** 事件应包含 `transaction_id`, `value`, `currency` 参数
- **AND** 应更新 `user_type` 用户属性为 'paid'

### Requirement: 追踪功能使用
系统 SHALL 追踪用户对核心功能的使用情况，包括 Oracle 问答、合盘报告、CBT 记录和 Wiki 浏览。

#### Scenario: 用户提问 Oracle 时触发事件
- **WHEN** 用户提交 Oracle 问题
- **THEN** 应触发 `oracle_question_asked` 事件
- **AND** 事件应包含 `question_length` 参数

### Requirement: 实施隐私合规
系统 SHALL 确保追踪符合 GDPR/CCPA 要求，包括 Cookie 同意管理和用户退出选项。

#### Scenario: 首次访问显示 Cookie 同意横幅
- **WHEN** 用户首次访问网站
- **THEN** 应显示 Cookie 同意横幅
- **AND** 在用户同意前不应加载追踪代码

## MODIFIED Requirements

无（这是新增能力）

## REMOVED Requirements

无（这是新增能力）
