<!-- INPUT: 将 astromind 迁移为微信小程序的任务清单。 -->
<!-- OUTPUT: 可验证的序列任务列表，包含校验步骤和依赖关系（已更新 2.3.11-2.3.15 状态）。 -->
<!-- POS: 任务清单文档；若更新此文件，务必更新本头注释。 -->

# 任务清单：Astromind 迁移为微信小程序

**变更 ID**: `migrate-astromind-to-miniprogram`
**任务总数**: 68
**预估复杂度**: 高

---

## 阶段 1: 后端迁移和配置（18 个任务）

### 1.1 项目结构创建

- [x] **Task 1.1.1**: 在 `astromind/` 下创建 `backend/` 目录
  - **验证**: 目录存在且包含 `src/`, `migrations/`, `data/` 子目录
  - **依赖**: 无

- [x] **Task 1.1.2**: 复制 Oracle_CN 后端代码到 `astromind/backend/`
  - **验证**: 所有文件复制成功，目录结构一致
  - **依赖**: Task 1.1.1
  - **命令**: `cp -r /Users/wzb/Documents/oracle_CN/backend/* /Users/wzb/Documents/oracle_CN/astromind/backend/`

- [x] **Task 1.1.3**: 复制 `package.json` 和 `tsconfig.json`
  - **验证**: 文件存在且内容正确
  - **依赖**: Task 1.1.2

- [x] **Task 1.1.4**: 安装后端依赖
  - **验证**: `node_modules/` 目录存在，无错误
  - **依赖**: Task 1.1.3
  - **命令**: `cd astromind/backend && npm install`

### 1.2 数据库配置

- [ ] **Task 1.2.1**: 创建独立的 Supabase 项目
  - **验证**: 获得 Supabase URL 和 Service Role Key
  - **依赖**: 无
  - **操作**: 在 Supabase 控制台创建新项目 "astromind-miniprogram"

- [ ] **Task 1.2.2**: 运行数据库迁移脚本 `000_initial_schema.sql`
  - **验证**: 7 张表创建成功（users, subscriptions, purchases, free_usage, synastry_records, subscription_usage, cbt_records）
  - **依赖**: Task 1.2.1
  - **命令**: 在 Supabase SQL Editor 中执行

- [ ] **Task 1.2.3**: 运行迁移脚本 `001_payment_subscription.sql`
  - **验证**: 表结构更新成功
  - **依赖**: Task 1.2.2

- [ ] **Task 1.2.4**: 运行迁移脚本 `002_update_free_usage_synthetica.sql`
  - **验证**: 表结构更新成功
  - **依赖**: Task 1.2.3

- [ ] **Task 1.2.5**: 在 `users` 表添加微信字段
  - **验证**: 字段 `wechat_openid`, `wechat_unionid`, `wechat_session_key` 存在
  - **依赖**: Task 1.2.2
  - **SQL**:
    ```sql
    ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(255) UNIQUE;
    ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(255);
    ALTER TABLE users ADD COLUMN wechat_session_key VARCHAR(255);
    CREATE INDEX idx_users_wechat_openid ON users(wechat_openid);
    ```

### 1.3 环境变量配置

- [ ] **Task 1.3.1**: 创建 `astromind/backend/.env` 文件
  - **验证**: 文件存在
  - **依赖**: Task 1.1.2

- [ ] **Task 1.3.2**: 配置 DeepSeek API Key
  - **验证**: `DEEPSEEK_API_KEY` 存在且有效
  - **依赖**: Task 1.3.1

- [ ] **Task 1.3.3**: 配置 Supabase 连接
  - **验证**: `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 正确
  - **依赖**: Task 1.2.1, Task 1.3.1

- [ ] **Task 1.3.4**: 配置 JWT Secret
  - **验证**: `JWT_SECRET` 存在且长度 >= 32
  - **依赖**: Task 1.3.1
  - **命令**: `openssl rand -base64 32`

- [ ] **Task 1.3.5**: 配置微信小程序凭证
  - **验证**: `WECHAT_APPID` 和 `WECHAT_APPSECRET` 存在
  - **依赖**: Task 1.3.1
  - **操作**: 在微信公众平台获取

- [ ] **Task 1.3.6**: 配置 Redis URL（可选）
  - **验证**: `REDIS_URL` 存在或使用内存降级
  - **依赖**: Task 1.3.1

### 1.4 微信授权登录实现

- [x] **Task 1.4.1**: 创建 `/api/auth/wechat` 端点
  - **验证**: 端点存在于 `src/api/auth.ts`
  - **依赖**: Task 1.1.4

- [x] **Task 1.4.2**: 实现 `code2Session` 调用
  - **验证**: 可以通过 code 获取 openid 和 session_key
  - **依赖**: Task 1.4.1
  - **API**: `https://api.weixin.qq.com/sns/jscode2session`

- [x] **Task 1.4.3**: 实现用户查询或创建逻辑
  - **验证**: 根据 openid 查询或创建用户记录
  - **依赖**: Task 1.4.2, Task 1.2.5

- [x] **Task 1.4.4**: 实现 JWT token 生成
  - **验证**: 返回 access_token 和 refresh_token
  - **依赖**: Task 1.4.3, Task 1.3.4

---

## 阶段 2: 小程序前端开发（25 个任务）

### 2.1 项目初始化

- [x] **Task 2.1.1**: 创建微信小程序项目
  - **验证**: 项目结构存在（pages/, utils/, app.js, app.json, app.wxss）
  - **依赖**: 无
  - **工具**: 微信开发者工具

- [x] **Task 2.1.2**: 配置 `app.json`（页面路由、导航栏、tabBar）
  - **验证**: 配置正确，包含 5 个 tabBar 页面
  - **依赖**: Task 2.1.1

- [ ] **Task 2.1.3**: 配置 `project.config.json`（AppID、项目设置）
  - **验证**: AppID 正确，ES6 转 ES5 开启
  - **依赖**: Task 2.1.1, Task 1.3.5

- [x] **Task 2.1.4**: 创建全局样式 `app.wxss`
  - **验证**: 样式文件存在，包含全局变量
  - **依赖**: Task 2.1.1

### 2.2 工具类和服务层

- [x] **Task 2.2.1**: 创建 `utils/request.js`（封装 wx.request）
  - **验证**: 支持 token 自动携带、错误处理、重试机制
  - **依赖**: Task 2.1.1

- [x] **Task 2.2.2**: 创建 `utils/auth.js`（登录、token 管理）
  - **验证**: 实现 `login()`, `getToken()`, `refreshToken()`, `logout()`
  - **依赖**: Task 2.2.1

- [x] **Task 2.2.3**: 创建 `utils/storage.js`（本地存储封装）
  - **验证**: 封装 `wx.setStorageSync`, `wx.getStorageSync`, `wx.removeStorageSync`
  - **依赖**: Task 2.1.1

- [x] **Task 2.2.4**: 创建 `services/api.js`（API 端点定义）
  - **验证**: 定义 17 个 API 端点常量
  - **依赖**: Task 2.2.1

### 2.3 页面重写（16 个页面）

#### 主页面（5 个 tabBar 页面）

- [x] **Task 2.3.1**: 重写 `HomeView` → `pages/home/home`
  - **验证**: 页面渲染正常，包含每日运势卡片、快速访问、推荐内容
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/HomeView.tsx` (213 行)

- [x] **Task 2.3.2**: 重写 `SelfView` → `pages/self/self`
  - **验证**: 页面渲染正常，显示本命盘解读
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/SelfView.tsx` (246 行)

- [x] **Task 2.3.3**: 重写 `DailyView` → `pages/daily/daily`
  - **验证**: 页面渲染正常，显示每日运势详情
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/DailyView.tsx` (284 行)

- [x] **Task 2.3.4**: 重写 `DiscoveryView` → `pages/discovery/discovery`
  - **验证**: 页面渲染正常，显示功能菜单
  - **依赖**: Task 2.2.1
  - **原文件**: `astromind/views/DiscoveryView.tsx` (325 行)

- [x] **Task 2.3.5**: 重写 `MeView` → `pages/me/me`
  - **验证**: 页面渲染正常，显示用户中心、订阅、积分、**报告收藏入口**、**合盘记录入口**
  - **依赖**: Task 2.2.1, Task 2.2.2
  - **原文件**: `astromind/views/MeView.tsx` (234 行)
  - **注意**: "报告收藏"和"合盘记录"的入口在此页面，点击后跳转到独立页面

#### 子页面（11 个功能页面）

- [x] **Task 2.3.6**: 重写 `AskAIView` → `pages/ask/ask`
  - **验证**: 页面渲染正常，AI 星象顾问功能可用
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/subviews/AskAIView.tsx` (213 行)

- [x] **Task 2.3.7**: 重写 `CBTView` → `pages/cbt/cbt`
  - **验证**: 页面渲染正常，CBT 日记功能可用
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/subviews/CBTView.tsx` (452 行)

- [x] **Task 2.3.8**: 重写 `SynastryView` → `pages/synastry/synastry`
  - **验证**: 页面渲染正常，双人合盘分析功能可用
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/subviews/SynastryView.tsx` (505 行)

- [x] **Task 2.3.9**: 重写 `SyntheticaView` → `pages/synthetica/synthetica`
  - **验证**: 页面渲染正常，占星实验室功能可用
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/subviews/SyntheticaView.tsx` (278 行)

- [x] **Task 2.3.10**: 重写 `WikiView` → `pages/wiki/wiki`
  - **验证**: 页面渲染正常，占星百科功能可用
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/subviews/WikiView.tsx` (208 行)

- [x] **Task 2.3.11**: 重写 `ProfessionalChartView` → `pages/chart/chart`
  - **验证**: 页面渲染正常，专业星盘功能可用
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/subviews/ProfessionalChartView.tsx` (246 行)

- [x] **Task 2.3.12**: 重写 `LifeKLineView` → `pages/kline/kline`
  - **验证**: 页面渲染正常，人生K线功能可用
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/subviews/LifeKLineView.tsx` (284 行)

- [x] **Task 2.3.13**: 重写 `ZodiacPairingView` → `pages/pairing/pairing`
  - **验证**: 页面渲染正常，星座配对功能可用
  - **依赖**: Task 2.2.1, Task 2.2.4
  - **原文件**: `astromind/views/subviews/ZodiacPairingView.tsx` (325 行)

- [x] **Task 2.3.14**: 重写 `ReportsView` → `pages/reports/reports`（报告收藏详情页）
  - **验证**: 页面渲染正常，显示所有已收藏的报告（本命盘、每日运势、合盘、AI 问答等所有类型）
  - **依赖**: Task 2.2.1, Task 2.2.4, Task 2.3.5
  - **原文件**: `astromind/views/subviews/ReportsView.tsx` (234 行)
  - **注意**: 入口在"我的"页面，也可以在合盘结果页面点击"收藏"按钮后查看

- [x] **Task 2.3.15**: 重写 `SynastryRecordsView` → `pages/records/records`（合盘记录详情页）
  - **验证**: 页面渲染正常，显示历史合盘记录
  - **依赖**: Task 2.2.1, Task 2.2.4, Task 2.3.5
  - **原文件**: `astromind/views/subviews/SynastryRecordsView.tsx` (205 行)
  - **注意**: 入口在"我的"页面，也可以在合盘结果页面查看

- [x] **Task 2.3.16**: 移除 `ImageGenView`（无功能）
  - **验证**: 文件不存在
  - **依赖**: 无

### 2.4 授权登录集成

- [x] **Task 2.4.1**: 在 `app.js` 的 `onLaunch` 中实现自动登录
  - **验证**: 小程序启动时自动调用 `wx.login()`
  - **依赖**: Task 2.2.2, Task 1.4.4

- [x] **Task 2.4.2**: 实现授权按钮和用户信息获取
  - **验证**: 用户点击授权后可以获取头像和昵称
  - **依赖**: Task 2.4.1

- [x] **Task 2.4.3**: 实现 token 过期自动刷新
  - **验证**: token 过期时自动调用 `/api/auth/refresh`
  - **依赖**: Task 2.2.2, Task 1.4.4

---

## 阶段 3: AI 服务替换（10 个任务）

### 3.1 移除 Gemini 代码

- [x] **Task 3.1.1**: 删除 `astromind/services/geminiService.ts`
  - **验证**: 文件不存在
  - **依赖**: 无

- [x] **Task 3.1.2**: 删除 `@google/genai` 依赖
  - **验证**: `package.json` 中无 `@google/genai`
  - **依赖**: Task 3.1.1

- [x] **Task 3.1.3**: 删除 `.env.local` 中的 `GEMINI_API_KEY`
  - **验证**: 环境变量不存在
  - **依赖**: Task 3.1.1

- [x] **Task 3.1.4**: 删除 `vite.config.ts` 中的 `API_KEY` 注入
  - **验证**: 配置文件中无 Gemini 相关配置
  - **依赖**: Task 3.1.1

### 3.2 集成 DeepSeek 服务

- [x] **Task 3.2.1**: 确认 `astromind/backend/src/services/ai.ts` 存在
  - **验证**: 文件存在且包含 DeepSeek API 集成
  - **依赖**: Task 1.1.2

- [x] **Task 3.2.2**: 确认 Prompt 管理系统已迁移
  - **验证**: `astromind/backend/src/prompts/manager.ts` 存在
  - **依赖**: Task 1.1.2

- [x] **Task 3.2.3**: 测试 DeepSeek API 调用
  - **验证**: 可以成功生成 AI 内容
  - **依赖**: Task 3.2.1, Task 1.3.2
  - **命令**: `curl -X POST http://localhost:3001/api/natal/overview`

- [x] **Task 3.2.4**: 验证温度分层策略
  - **验证**: T1-T5 温度配置正确（0.1-0.7）
  - **依赖**: Task 3.2.1

- [x] **Task 3.2.5**: 验证缓存机制
  - **验证**: AI 响应被正确缓存（7 天 TTL）
  - **依赖**: Task 3.2.1, Task 1.3.6

- [x] **Task 3.2.6**: 更新小程序前端的 AI 调用逻辑
  - **验证**: 所有 AI 功能通过后端 API 调用
  - **依赖**: Task 3.2.3, Task 2.3.1-2.3.15

---

## 阶段 4: 数据和代码清理（8 个任务）

**注意**：本阶段仅清理 astromind 项目的内容，Oracle_CN 项目的内容暂不清理，等 astromind 完全完成后再处理。

### 4.1 移除 Mock 数据（仅 astromind 项目）

- [x] **Task 4.1.1**: 删除 `DailyView` 中的 `MOCK_INITIAL_DATA`
  - **验证**: 代码中无 mock 数据
  - **依赖**: Task 2.3.3

- [x] **Task 4.1.2**: 删除 `CBTView` 中的 `MOCK_HISTORY`
  - **验证**: 代码中无 mock 数据
  - **依赖**: Task 2.3.7

- [x] **Task 4.1.3**: 删除 `WikiView` 中的 `MOCK_ITEMS`
  - **验证**: 代码中无 mock 数据，数据从后端获取
  - **依赖**: Task 2.3.10

- [x] **Task 4.1.4**: 删除 `LifeKLineView` 中的 `MOCK_DATA_GENERATOR`
  - **验证**: 代码中无 mock 数据
  - **依赖**: Task 2.3.12

- [x] **Task 4.1.5**: 删除 `ReportsView` 中的 `MOCK_REPORTS`
  - **验证**: 代码中无 mock 数据
  - **依赖**: Task 2.3.14

- [x] **Task 4.1.6**: 删除 `MeView` 中的 `MOCK_POINTS_HISTORY`
  - **验证**: 代码中无 mock 数据
  - **依赖**: Task 2.3.5

### 4.2 清理冗余文件（仅 astromind 项目）

- [x] **Task 4.2.1**: 删除原 React 项目的所有文件（仅 astromind 项目）
  - **验证**: `astromind/views/`, `astromind/components/`, `astromind/services/` 不存在
  - **依赖**: Task 2.3.16, Task 3.1.1
  - **注意**: 不删除 Oracle_CN 项目的任何文件

- [x] **Task 4.2.2**: 删除 `astromind/index.html`, `astromind/index.tsx`, `astromind/App.tsx`（仅 astromind 项目）
  - **验证**: 文件不存在
  - **依赖**: Task 4.2.1
  - **注意**: 不删除 Oracle_CN 项目的任何文件

---

## 阶段 5: 测试和部署（7 个任务）

### 5.1 功能测试

- [ ] **Task 5.1.1**: 测试 16 个小程序页面的渲染和交互
  - **验证**: 所有页面无错误，交互正常
  - **依赖**: Task 2.3.1-2.3.15

- [ ] **Task 5.1.2**: 测试 17 个后端 API 端点
  - **验证**: 所有 API 返回正确数据
  - **依赖**: Task 1.4.4, Task 3.2.3

- [ ] **Task 5.1.3**: 测试微信授权登录流程
  - **验证**: 用户可以成功登录并获取 token
  - **依赖**: Task 2.4.1, Task 1.4.4

- [ ] **Task 5.1.4**: 测试数据持久化
  - **验证**: 用户数据正确保存到 Supabase
  - **依赖**: Task 1.2.5, Task 5.1.3

### 5.2 性能测试

- [ ] **Task 5.2.1**: 测试小程序首屏加载时间
  - **验证**: 加载时间 < 2 秒
  - **依赖**: Task 5.1.1

- [ ] **Task 5.2.2**: 测试 API 响应时间
  - **验证**: 非 AI 接口 < 1 秒，AI 接口 < 5 秒
  - **依赖**: Task 5.1.2

### 5.3 部署

- [ ] **Task 5.3.1**: 提交微信小程序审核
  - **验证**: 审核通过并发布
  - **依赖**: Task 5.1.1-5.1.4

---

## 任务统计

- **阶段 1（后端迁移）**: 18 个任务
- **阶段 2（小程序开发）**: 25 个任务
- **阶段 3（AI 服务替换）**: 10 个任务
- **阶段 4（代码清理）**: 8 个任务
- **阶段 5（测试和部署）**: 7 个任务
- **总计**: 68 个任务

---

## 并行任务标注

以下任务可以并行执行：

- **并行组 1**: Task 1.1.1-1.1.4（项目结构创建）
- **并行组 2**: Task 1.2.1-1.2.4（数据库配置）
- **并行组 3**: Task 1.3.1-1.3.6（环境变量配置）
- **并行组 4**: Task 2.3.1-2.3.5（主页面重写）
- **并行组 5**: Task 2.3.6-2.3.15（子页面重写）
- **并行组 6**: Task 3.1.1-3.1.4（移除 Gemini 代码）
- **并行组 7**: Task 4.1.1-4.1.6（移除 Mock 数据）

---

## 关键路径

```
Task 1.1.1 → Task 1.1.2 → Task 1.1.3 → Task 1.1.4 → Task 1.4.1 → Task 1.4.2 → Task 1.4.3 → Task 1.4.4 → Task 2.4.1 → Task 5.1.3 → Task 5.3.1
```

关键路径长度：11 个任务
