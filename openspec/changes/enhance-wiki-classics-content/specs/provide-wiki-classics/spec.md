# Capability: Provide Wiki Classics

## ADDED Requirements

### Requirement: Markdown detail rendering
系统 SHALL 在经典详情页渲染 Markdown 结构化内容，保留标题、列表与段落层级。

#### Scenario: Headings and lists render
- **WHEN** 用户打开包含 Markdown 内容的经典详情页
- **THEN** 标题、列表与段落以可读层级展示

### Requirement: Category-grouped classics shelf
系统 SHALL 在经典书架按 Foundation/Deepening/Techniques/Classical & Hellenistic/Expert & Specialized/Philosophy 分组展示。

#### Scenario: Shelf shows grouped categories
- **WHEN** 用户进入经典页签
- **THEN** 书籍按分类分组展示且分类标题可见

### Requirement: Internal classics links
系统 SHALL 将内容中的站内书籍引用渲染为带下划线的链接，并跳转到对应 `/wiki/classics/:id`。

#### Scenario: Linked book navigates
- **WHEN** 用户点击内容中的经典书籍链接
- **THEN** 路由跳转到对应经典详情页

### Requirement: On-demand detail fetch only
系统 SHALL 仅在用户进入某本经典详情页时请求其详情，并写入本地缓存。

#### Scenario: No detail prefetch on list
- **WHEN** 用户停留在经典列表页
- **THEN** 不触发任何 `/api/wiki/classics/:id` 请求
