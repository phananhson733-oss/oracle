# Capability: Provide Wiki Classics

## ADDED Requirements

### Requirement: Classics tab entry
系统 SHALL 在 /wiki 页面新增“经典/Classics”页签，与“首页/百科”并列。

#### Scenario: Tab is visible and selectable
- **WHEN** 用户进入 /wiki
- **THEN** 页签列表包含“经典”且可被选中

### Requirement: Classics shelf list
系统 SHALL 在经典页签中以书架式列表展示经典条目，并按后端返回顺序呈现。

#### Scenario: Shelf renders curated order
- **WHEN** 经典列表数据加载完成
- **THEN** 书籍封面按返回顺序显示在书架列表中

### Requirement: Cover fallback rendering
系统 SHALL 在缺少封面资源时以排版封面展示书名与作者。

#### Scenario: Text cover fallback
- **WHEN** 经典条目未提供 cover_url
- **THEN** 封面区域显示书名与作者文本排版

### Requirement: Classics detail route with opening animation
系统 SHALL 提供 /wiki/classics/:id 详情页，并在打开时播放展开动画。

#### Scenario: Open book to detail
- **WHEN** 用户点击经典条目
- **THEN** 路由切换到 /wiki/classics/:id 且触发展开动画

### Requirement: Long-form content rendering
系统 SHALL 在详情页呈现书名、作者与长文解读内容，并支持长文滚动阅读。

#### Scenario: Detail content is readable
- **WHEN** 详情内容加载完成
- **THEN** 用户可阅读完整内容并正常滚动

### Requirement: Bilingual content switch
系统 SHALL 支持中英文内容切换，并同步更新经典页签的 UI 文案。

#### Scenario: Language toggle updates classics
- **WHEN** 用户切换语言
- **THEN** 经典列表与详情内容切换到对应语言

### Requirement: Local cache for classics data
系统 SHALL 将经典列表与详情数据进行本地永久缓存，并使用版本号控制更新。

#### Scenario: Cache hit avoids refetch
- **WHEN** 用户再次访问相同语言的经典内容且版本未变
- **THEN** 优先从本地缓存读取数据

### Requirement: Classics search navigation
系统 SHALL 支持从 Wiki 搜索结果跳转到经典详情页。

#### Scenario: Search result opens classics detail
- **WHEN** 用户在 Wiki 搜索结果中点击经典条目
- **THEN** 跳转到 /wiki/classics/:id
