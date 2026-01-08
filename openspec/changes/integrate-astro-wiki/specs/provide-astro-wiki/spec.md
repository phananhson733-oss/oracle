# Capability: Provide Astro Wiki

## ADDED Requirements

### Requirement: Wiki navigation entry
系统 SHALL 在顶部导航栏的“CBT 日记”之后新增“百科/Wiki”入口，点击后进入 /wiki 并默认展示首页页签。

#### Scenario: Nav entry opens wiki home
- **WHEN** 用户点击顶部导航的“百科”入口
- **THEN** 路由切换到 /wiki 且首页页签被选中

### Requirement: Guest navigation visibility
系统 SHALL 在未完成 onboarding 的情况下仍显示顶部导航，并包含“百科/Wiki”入口。

#### Scenario: Guest sees top nav
- **WHEN** 用户未创建个人档案访问 /wiki
- **THEN** 顶部导航可见且包含“百科/Wiki”入口

### Requirement: Guest access for wiki routes
系统 SHALL 允许未完成 onboarding 的访客访问 /wiki 与 /wiki/:id，不触发重定向。

#### Scenario: Guest can access wiki
- **WHEN** 用户未创建个人档案访问 /wiki 或 /wiki/:id
- **THEN** 页面正常渲染且不被重定向到 /

### Requirement: Wiki hub tabs
系统 SHALL 在 /wiki 页面提供“首页/百科”两个页签入口并支持切换。

#### Scenario: Switching tabs updates content
- **WHEN** 用户点击“百科”页签
- **THEN** 展示百科列表与检索入口

### Requirement: Wiki item detail view
系统 SHALL 提供 /wiki/:id 详情页，用于展示百科条目的完整内容与关联条目。

#### Scenario: Open wiki detail
- **WHEN** 用户点击某个百科条目
- **THEN** 跳转到 /wiki/:id 并展示该条目内容

### Requirement: Wiki search on encyclopedia list
系统 SHALL 在百科页提供关键词检索能力，并返回匹配条目。

#### Scenario: Search filters entries
- **WHEN** 用户在百科页输入关键词并提交
- **THEN** 列表仅展示匹配条目或提示无结果

### Requirement: Theme and i18n alignment
系统 SHALL 使百科页面遵循现有主题 token 与语言切换规则，文案随语言变化。

#### Scenario: Theme and language update wiki
- **WHEN** 用户切换主题或语言
- **THEN** 百科页面的视觉与文案同步更新
