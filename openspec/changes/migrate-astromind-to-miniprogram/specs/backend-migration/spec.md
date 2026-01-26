<!-- INPUT: 后端服务迁移的增量规范。 -->
<!-- OUTPUT: 后端迁移的需求和场景定义。 -->
<!-- POS: 增量规范文档；若更新此文件，务必更新本头注释。 -->

# Capability: Backend Migration

## Purpose
将 Oracle_CN 后端代码完整复制到 astromind/backend/ 目录，配置独立的 Supabase 数据库，确保后端服务可以独立运行和部署。

## ADDED Requirements

### Requirement: 后端代码复制
Oracle_CN 后端代码 SHALL 完整复制到 astromind/backend/ 目录，包含所有源代码、迁移脚本和配置文件。

#### Scenario: 复制后端目录结构
- **WHEN** 执行复制命令
- **THEN** astromind/backend/ 包含 src/, migrations/, data/, package.json, tsconfig.json, .env.example

#### Scenario: 验证文件完整性
- **WHEN** 检查文件数量和大小
- **THEN** src/api/ 包含 17 个 API 路由文件，src/services/ 包含 7 个服务文件，migrations/ 包含 3 个迁移脚本

### Requirement: 依赖安装
后端依赖 SHALL 正确安装，确保项目可以运行（Node.js 20.x, npm install）。

#### Scenario: 安装 npm 依赖
- **WHEN** 执行 npm install
- **THEN** node_modules/ 目录存在，无错误或警告，关键依赖版本正确

#### Scenario: 验证 Node 版本
- **WHEN** 执行 node --version
- **THEN** Node 版本为 20.x

### Requirement: 数据库配置
独立的 Supabase 数据库 SHALL 创建并配置，包含 7 张表和微信字段。

#### Scenario: 创建 Supabase 项目
- **WHEN** 在 Supabase 控制台创建新项目
- **THEN** 获得 Supabase URL, Service Role Key, 数据库连接信息

#### Scenario: 运行数据库迁移
- **WHEN** 在 SQL Editor 中执行迁移脚本
- **THEN** 数据库包含 users, subscriptions, purchases, free_usage, synastry_records, subscription_usage, cbt_records 表

#### Scenario: 添加微信字段
- **WHEN** 执行 SQL 添加微信字段
- **THEN** users 表包含 wechat_openid, wechat_unionid, wechat_session_key 字段和索引

### Requirement: 环境变量配置
后端环境变量 SHALL 正确配置，确保服务可以启动（DeepSeek API Key, Supabase 连接, JWT Secret, 微信凭证）。

#### Scenario: 创建 .env 文件
- **WHEN** 复制并编辑 .env.example 为 .env
- **THEN** 文件包含 PORT, DEEPSEEK_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, WECHAT_APPID, WECHAT_APPSECRET, REDIS_URL

#### Scenario: 验证环境变量
- **WHEN** 启动后端服务
- **THEN** 服务正常启动，无环境变量缺失错误，可以连接到 Supabase 和 Redis

### Requirement: API 端点验证
所有 API 端点 SHALL 可用，返回正确的数据（健康检查、本命盘、每日运势、AI 问答）。

#### Scenario: 测试健康检查端点
- **WHEN** 访问 GET /health
- **THEN** 返回 200 状态码和 { "status": "ok" }

#### Scenario: 测试本命盘端点
- **WHEN** 访问 GET /api/natal/chart?birthDate=1990-01-01&birthTime=12:00&birthCity=Shanghai
- **THEN** 返回 200 状态码和星盘数据（planets, houses, aspects）

#### Scenario: 测试每日运势端点
- **WHEN** 访问 GET /api/daily?birthDate=1990-01-01&birthTime=12:00&birthCity=Shanghai
- **THEN** 返回 200 状态码和运势数据（score, summary, details）

### Requirement: 缓存配置
Redis 缓存 SHALL 配置，或使用内存降级。

#### Scenario: 连接 Redis
- **WHEN** 后端服务启动且 Redis 服务可用
- **THEN** 成功连接到 Redis，日志显示 "Redis connected"

#### Scenario: 使用内存降级
- **WHEN** 后端服务启动且 Redis 服务不可用
- **THEN** 自动降级到内存缓存，日志显示 "Using in-memory cache"

### Requirement: 部署配置
后端服务 SHALL 可以部署到生产环境（构建、启动、监听端口）。

#### Scenario: 构建生产版本
- **WHEN** 执行 npm run build
- **THEN** 构建成功，dist/ 目录存在，无 TypeScript 错误

#### Scenario: 启动生产服务
- **WHEN** 执行 npm start
- **THEN** 服务正常启动，监听端口 3001，日志显示 "Server running on port 3001"

## MODIFIED Requirements

无

## REMOVED Requirements

无
