# Change: 优化首页布局与个性化推荐系统

## Why

当前首页布局较为简单，推荐内容为静态硬编码，无法根据用户状态提供个性化体验。新用户缺乏引导，老用户缺乏持续使用动力。需要重构首页以提升用户留存和功能发现率。

## What Changes

### 1. 首页布局重构
- 保留并优化「今日运势」卡片（TODAY'S FORTUNE）
- 新增「快速体验」三入口区域（双人合盘、CBT日记、AI问答）
- 新增「我的星盘」模块（本命盘解读、人生k线图入口）
- 重构「为你推荐」模块为动态个性化推荐

### 2. 个性化推荐系统
- 新增后端 API：用户状态查询接口
- 新增后端 API：重要星象事件接口（含本地缓存策略）
- 实现前端推荐优先级算法
- 支持 8 种推荐类型：新用户引导、功能引导、星象提醒、行为推荐、CBT提醒、社交推荐、热门内容、教育内容

### 3. 新用户引导
- 注册 3 天内用户展示专属引导卡片
- 引导生成本命盘、了解双人合盘、占星入门指南

## Impact

- **Affected specs**:
  - `home-page`（新增）
  - `provide-daily-forecast`（关联）
  - `backend-data-services`（需扩展）
- **Affected code**:
  - `miniprogram/pages/home/home.js`
  - `miniprogram/pages/home/home.wxml`
  - `miniprogram/pages/home/home.wxss`
  - `backend/` 新增 API 端点
- **Breaking changes**: 无，向后兼容
