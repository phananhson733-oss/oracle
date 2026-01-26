<!-- INPUT: 微信小程序前端开发的增量规范。 -->
<!-- OUTPUT: 小程序前端的需求和场景定义。 -->
<!-- POS: 增量规范文档；若更新此文件，务必更新本头注释。 -->

# Capability: Miniprogram Frontend

## Purpose
将 Astromind 的 React 前端重写为微信原生小程序，保持原有 UI 风格和交互逻辑，实现 5 个 tabBar 主页面、9 个功能子页面、2 个详情页面和完整的用户体验。Astromind 的前端表现就是最终产品的样子。

**页面结构**：
- **TabBar 主页面**（5 个）：首页、探索、运势、发现、我的
- **"发现"的二级入口**（9 个）：AI 顾问、CBT 日记、合盘、实验室、百科、星盘、K 线、配对
- **"我的"的功能入口**（2 个）：报告收藏、合盘记录（入口在"我的"，独立页面展示）

## ADDED Requirements

### Requirement: 小程序项目结构
小程序 SHALL 使用微信原生框架，包含标准的项目结构（app.js, app.json, app.wxss, pages/, utils/）和配置文件（project.config.json）。

#### Scenario: 创建小程序项目
- **WHEN** 使用微信开发者工具创建项目
- **THEN** 项目包含 app.js, app.json, app.wxss, project.config.json, pages/, utils/ 目录

#### Scenario: 配置 tabBar
- **WHEN** 编辑 app.json 文件
- **THEN** tabBar 包含 5 个底部导航项（首页、探索、运势、发现、我的）

### Requirement: 主页面重写
小程序 SHALL 重写 5 个 tabBar 主页面（HomeView, SelfView, DailyView, DiscoveryView, MeView），保持原有 UI 风格。其中"我的"页面包含报告收藏和合盘记录的入口。

#### Scenario: 重写首页
- **WHEN** 重写 HomeView 为 pages/home/home
- **THEN** 页面包含每日运势卡片、快速访问、推荐内容

#### Scenario: 重写探索页
- **WHEN** 重写 SelfView 为 pages/self/self
- **THEN** 页面包含本命盘可视化、行星列表、相位列表

#### Scenario: 重写运势页
- **WHEN** 重写 DailyView 为 pages/daily/daily
- **THEN** 页面包含每日运势概览、详细内容、行星动态、分享功能

#### Scenario: 重写我的页
- **WHEN** 重写 MeView 为 pages/me/me
- **THEN** 页面包含用户信息卡片、订阅状态、VIP 权益、**报告收藏入口**、**合盘记录入口**、积分历史、设置入口

### Requirement: 子页面实现
小程序 SHALL 实现 9 个功能子页面（从"发现"进入）和 2 个详情页面（从"我的"进入），保持原有功能。

#### Scenario: 实现 AI 星象顾问
- **WHEN** 重写 AskAIView 为 pages/ask/ask
- **THEN** 页面包含问题输入框、类别选择、AI 回答显示、历史问题列表

#### Scenario: 实现 CBT 日记
- **WHEN** 重写 CBTView 为 pages/cbt/cbt
- **THEN** 页面包含心情选择器、日记输入框、AI 分析结果、历史记录、统计图表

#### Scenario: 实现双人合盘
- **WHEN** 重写 SynastryView 为 pages/synastry/synastry
- **THEN** 页面包含两人出生信息输入、关系类型选择、合盘报告显示、标签页切换、**收藏按钮**（收藏后可在"我的"页面查看）

#### Scenario: 实现报告收藏详情页
- **WHEN** 重写 ReportsView 为 pages/reports/reports
- **THEN** 页面显示所有已收藏的报告（本命盘、每日运势、合盘、AI 问答等所有类型），入口在"我的"页面，也可从合盘结果页面进入

#### Scenario: 实现合盘记录详情页
- **WHEN** 重写 SynastryRecordsView 为 pages/records/records
- **THEN** 页面显示历史合盘记录，入口在"我的"页面，也可从合盘结果页面进入

### Requirement: 工具类封装
小程序 SHALL 封装常用工具类（request.js, auth.js, storage.js, api.js），简化开发和维护。

#### Scenario: 封装网络请求
- **WHEN** 创建 utils/request.js
- **THEN** 工具类包含 request() 函数，支持自动携带 token、统一错误处理、请求超时、重试机制

#### Scenario: 封装认证管理
- **WHEN** 创建 utils/auth.js
- **THEN** 工具类包含 login(), getToken(), refreshToken(), logout(), isLoggedIn() 函数

### Requirement: 样式适配
小程序样式 SHALL 适配微信环境，保持原有 UI 风格（渐变色、卡片设计、响应式布局）。

#### Scenario: 全局样式配置
- **WHEN** 编辑 app.wxss 文件
- **THEN** 文件包含全局 CSS 变量、通用样式类、渐变色定义

#### Scenario: 页面样式适配
- **WHEN** 创建页面的 .wxss 文件
- **THEN** 文件包含页面特有样式、响应式布局、动画和过渡效果

### Requirement: 数据流管理
小程序 SHALL 实现清晰的数据流，确保数据一致性（页面数据加载、用户交互处理、全局状态管理）。

#### Scenario: 页面数据加载
- **WHEN** 页面 onLoad 生命周期触发
- **THEN** 显示加载状态、调用 API 获取数据、更新页面数据、隐藏加载状态

#### Scenario: 全局状态管理
- **WHEN** 使用 app.globalData
- **THEN** 全局数据包含 userInfo, token, preferences

### Requirement: 性能优化
小程序 SHALL 优化性能，确保流畅的用户体验（分包加载、图片优化、列表优化）。

#### Scenario: 分包加载
- **WHEN** 配置分包加载
- **THEN** 主包包含 5 个 tabBar 页面，分包 1 包含 AI 顾问等 4 个页面，分包 2 包含百科等 6 个页面

#### Scenario: 列表优化
- **WHEN** 实现列表优化
- **THEN** 使用分页加载（每页 20 条）、虚拟列表、下拉刷新和上拉加载

## MODIFIED Requirements

无

## REMOVED Requirements

无
