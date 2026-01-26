<!-- INPUT: 数据和代码清理的增量规范。 -->
<!-- OUTPUT: 代码清理的需求和场景定义。 -->
<!-- POS: 增量规范文档；若更新此文件，务必更新本头注释。 -->

# Capability: Data Cleanup

## Purpose
移除 astromind 项目中的所有 mock 数据、硬编码内容、Gemini 相关代码和冗余文件，确保代码库干净整洁，仅包含小程序和后端代码。

**重要说明**：本规范仅涉及 astromind 项目的清理，Oracle_CN 项目的内容暂不清理，等 astromind 完全完成后再评估和处理。

## ADDED Requirements

无

## MODIFIED Requirements

无

## REMOVED Requirements

### Requirement: Mock 数据清理
astromind 项目中的所有 mock 数据 SHALL 移除，使用真实的后端数据（DailyView, CBTView, WikiView, LifeKLineView, ReportsView, MeView, SynastryRecordsView）。Oracle_CN 项目不涉及。

#### Scenario: 移除 DailyView 的 mock 数据
- **WHEN** 执行代码清理
- **THEN** MOCK_INITIAL_DATA 常量不存在，页面从后端 API 获取真实数据

#### Scenario: 移除 WikiView 的 mock 数据
- **WHEN** 执行代码清理
- **THEN** MOCK_ITEMS 常量不存在，页面从后端 /api/wiki/items 获取真实数据

#### Scenario: 移除 MeView 的 mock 数据
- **WHEN** 执行代码清理
- **THEN** MOCK_POINTS_HISTORY 常量不存在，页面从后端 API 获取真实积分历史

### Requirement: 硬编码内容清理
astromind 项目中所有硬编码的用户档案和配置 SHALL 移除（HomeView, DailyView, SelfView）。Oracle_CN 项目不涉及。

#### Scenario: 移除 HomeView 的硬编码数据
- **WHEN** 执行代码清理
- **THEN** shareData 对象不存在，数据从后端 API 获取

#### Scenario: 移除 DailyView 的硬编码用户档案
- **WHEN** 执行代码清理
- **THEN** "太阳天蝎，月亮双鱼，上升处女，出生于上海。" 不存在，使用真实的用户出生信息

#### Scenario: 移除 SelfView 的硬编码行星数据
- **WHEN** 执行代码清理
- **THEN** PLANETS 数组不存在，数据从后端 /api/natal/chart 获取

### Requirement: Gemini 相关代码清理
astromind 项目中所有 Gemini API 相关的代码和配置 SHALL 移除（geminiService.ts, @google/genai, GEMINI_API_KEY, vite.config.ts, 图像生成）。Oracle_CN 项目不涉及。

#### Scenario: 移除 geminiService.ts
- **WHEN** 执行代码清理
- **THEN** astromind/services/geminiService.ts 文件被删除

#### Scenario: 移除 Gemini 依赖
- **WHEN** 执行代码清理
- **THEN** package.json 中无 @google/genai，package-lock.json 中无相关依赖

#### Scenario: 移除 Gemini 环境变量
- **WHEN** 执行代码清理
- **THEN** .env.local 中的 GEMINI_API_KEY 被移除

#### Scenario: 移除图像生成相关代码
- **WHEN** 执行代码清理
- **THEN** generateCosmicImage() 调用不存在，图像生成按钮不存在

### Requirement: 冗余文件清理
astromind 项目中所有未使用的组件和文件 SHALL 移除（原 React 项目文件, ImageGenView, 未使用的依赖）。Oracle_CN 项目不涉及。

#### Scenario: 移除原 React 项目文件
- **WHEN** 执行代码清理
- **THEN** astromind/views/, astromind/components/, astromind/services/, astromind/index.html, astromind/index.tsx, astromind/App.tsx, astromind/types.ts, astromind/vite.config.ts, astromind/tsconfig.json, astromind/package.json（React 相关）被移除

#### Scenario: 移除未使用的依赖
- **WHEN** 执行代码清理
- **THEN** react, react-dom, react-router-dom, recharts, lucide-react, vite, @vitejs/plugin-react 被移除

### Requirement: 代码审查和优化
清理后的 astromind 项目代码 SHALL 通过审查，确保无遗留问题（无 mock 数据, 无 Gemini 引用, 无硬编码用户档案, 无冗余文件）。Oracle_CN 项目不涉及。

#### Scenario: 验证无 mock 数据
- **WHEN** 搜索 MOCK_ 关键字
- **THEN** 无搜索结果

#### Scenario: 验证无 Gemini 引用
- **WHEN** 搜索 gemini 或 @google/genai 关键字
- **THEN** 无搜索结果

#### Scenario: 验证无冗余文件
- **WHEN** 检查项目目录
- **THEN** 仅包含 astromind/miniprogram/, astromind/backend/, astromind/README.md
