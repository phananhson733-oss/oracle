<!-- INPUT: Astromind 迁移为微信小程序的架构设计文档。 -->
<!-- OUTPUT: 详细的架构决策、技术选型和系统设计。 -->
<!-- POS: 设计文档；若更新此文件，务必更新本头注释。 -->

# 设计文档：Astromind 迁移为微信小程序

**变更 ID**: `migrate-astromind-to-miniprogram`
**设计日期**: 2026-01-22

---

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      微信小程序前端                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  首页    │  │  探索    │  │  运势    │  │  发现    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  我的    │  │  AI顾问  │  │  CBT日记 │  │  合盘    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  工具层: request.js, auth.js, storage.js           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Astromind 后端服务                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API 路由层 (17 个端点)                             │   │
│  │  - /api/natal/*  - /api/daily/*  - /api/ask        │   │
│  │  - /api/synastry/*  - /api/cbt/*  - /api/wiki/*    │   │
│  │  - /api/auth/wechat  - /api/entitlements/*         │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  服务层                                              │   │
│  │  - ai.ts (DeepSeek API)                             │   │
│  │  - ephemeris.ts (Swiss Ephemeris)                   │   │
│  │  - userService.ts (用户管理)                        │   │
│  │  - entitlementService.ts (权限管理)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  数据层                                              │   │
│  │  - Supabase (PostgreSQL)                            │   │
│  │  - Redis (缓存)                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  DeepSeek    │  │  Supabase    │  │  微信开放    │
│  API         │  │  PostgreSQL  │  │  平台        │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 1.2 技术栈对比

| 层级 | 原 Astromind | 新 Astromind (小程序) |
|------|-------------|---------------------|
| **前端框架** | React 19 + Vite | 微信小程序原生 (WXML/WXSS/JS) |
| **状态管理** | React useState | 小程序 data + setData |
| **路由** | React Router (HashRouter) | 小程序页面栈 (wx.navigateTo) |
| **样式** | Tailwind CSS (CDN) | WXSS + 内联样式 |
| **图表** | Recharts | 小程序图表库 (如 wx-charts) |
| **图标** | Lucide React | 小程序图标库 (如 WeUI) |
| **AI 服务** | Google Gemini API | DeepSeek API (通过后端) |
| **数据存储** | localStorage | wx.storage + Supabase |
| **认证** | 无 | 微信授权登录 + JWT |
| **后端** | 无 | Node.js + Express + TypeScript |
| **数据库** | 无 | PostgreSQL (Supabase) |
| **缓存** | 无 | Redis (带内存降级) |
| **部署** | AI Studio 静态托管 | 微信小程序平台 + 云服务器 |

---

## 2. 前端架构设计

### 2.1 页面结构

**说明**：
- **TabBar 主页面**（5 个）：首页、探索、运势、发现、我的
- **"发现"的二级入口**（9 个）：从"发现"页面进入的功能页面
- **"我的"的功能入口**（2 个）：报告收藏、合盘记录（入口在"我的"，独立页面展示）

```
pages/
├── home/              # 首页 (tabBar)
│   ├── home.wxml
│   ├── home.wxss
│   ├── home.js
│   └── home.json
├── self/              # 探索 (tabBar)
├── daily/             # 运势 (tabBar)
├── discovery/         # 发现 (tabBar) - 包含 9 个二级入口
├── me/                # 我的 (tabBar) - 包含报告收藏和合盘记录入口
├── ask/               # AI 星象顾问（从"发现"进入）
├── cbt/               # CBT 日记（从"发现"进入）
├── synastry/          # 双人合盘（从"发现"进入）
├── synthetica/        # 占星实验室（从"发现"进入）
├── wiki/              # 占星百科（从"发现"进入）
├── chart/             # 专业星盘（从"发现"进入）
├── kline/             # 人生K线（从"发现"进入）
├── pairing/           # 星座配对（从"发现"进入）
├── reports/           # 报告收藏详情页（从"我的"进入，也可从合盘结果页进入）
└── records/           # 合盘记录详情页（从"我的"进入，也可从合盘结果页进入）
```

### 2.2 工具类设计

#### `utils/request.js`

```javascript
// 封装 wx.request，支持 token 自动携带、错误处理、重试机制
const request = (url, options = {}) => {
  const token = getToken();
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 401) {
          // Token 过期，刷新 token
          refreshToken().then(() => request(url, options));
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
};
```

#### `utils/auth.js`

```javascript
// 登录、token 管理
const login = async () => {
  const { code } = await wx.login();
  const { access_token, refresh_token } = await request('/api/auth/wechat', {
    method: 'POST',
    data: { code }
  });
  wx.setStorageSync('access_token', access_token);
  wx.setStorageSync('refresh_token', refresh_token);
};

const getToken = () => wx.getStorageSync('access_token');

const refreshToken = async () => {
  const refresh_token = wx.getStorageSync('refresh_token');
  const { access_token } = await request('/api/auth/refresh', {
    method: 'POST',
    data: { refresh_token }
  });
  wx.setStorageSync('access_token', access_token);
};

const logout = () => {
  wx.removeStorageSync('access_token');
  wx.removeStorageSync('refresh_token');
};
```

### 2.3 数据流设计

```
用户交互 (点击、输入)
  ↓
页面事件处理函数 (onTap, onInput)
  ↓
调用 request() 发送 API 请求
  ↓
后端处理并返回数据
  ↓
页面 setData() 更新视图
  ↓
WXML 重新渲染
```

### 2.4 状态管理

- **页面级状态**: 使用 `this.data` 和 `this.setData()`
- **全局状态**: 使用 `app.globalData`（如用户信息、token）
- **持久化状态**: 使用 `wx.storage`（如用户偏好、缓存数据）

---

## 3. 后端架构设计

### 3.1 目录结构

```
astromind/backend/
├── src/
│   ├── api/                    # 17 个 API 路由模块
│   │   ├── natal.ts
│   │   ├── daily.ts
│   │   ├── ask.ts
│   │   ├── synastry.ts
│   │   ├── cycle.ts
│   │   ├── cbt.ts
│   │   ├── wiki.ts
│   │   ├── detail.ts
│   │   ├── geo.ts
│   │   ├── auth.ts            # 新增微信授权端点
│   │   ├── payment.ts
│   │   ├── entitlements.ts
│   │   └── ...
│   ├── services/              # 业务逻辑层
│   │   ├── ai.ts              # DeepSeek API 集成
│   │   ├── ephemeris.ts       # Swiss Ephemeris 计算
│   │   ├── userService.ts     # 用户管理
│   │   ├── wechatService.ts   # 新增：微信 API 调用
│   │   └── ...
│   ├── db/
│   │   └── supabase.ts        # Supabase 客户端
│   ├── cache/
│   │   ├── redis.ts           # Redis 实现
│   │   └── strategy.ts        # 缓存策略
│   ├── config/
│   │   ├── auth.ts            # JWT、OAuth、微信配置
│   │   └── stripe.ts          # Stripe 配置
│   ├── prompts/
│   │   ├── manager.ts         # Prompt 管理
│   │   └── common.ts
│   ├── types/
│   │   ├── api.ts
│   │   └── wechat.d.ts        # 新增：微信类型定义
│   └── index.ts               # Express 服务器入口
├── migrations/                # 数据库迁移脚本
│   ├── 000_initial_schema.sql
│   ├── 001_payment_subscription.sql
│   ├── 002_update_free_usage_synthetica.sql
│   └── 003_add_wechat_fields.sql  # 新增：微信字段
├── package.json
├── tsconfig.json
└── .env                       # 环境变量
```

### 3.2 微信授权流程

```
┌──────────────┐
│  小程序      │
└──────┬───────┘
       │ 1. wx.login()
       ▼
┌──────────────┐
│  微信服务器  │
└──────┬───────┘
       │ 2. 返回 code
       ▼
┌──────────────┐
│  小程序      │
└──────┬───────┘
       │ 3. POST /api/auth/wechat { code }
       ▼
┌──────────────┐
│  后端服务    │
└──────┬───────┘
       │ 4. code2Session API
       ▼
┌──────────────┐
│  微信服务器  │
└──────┬───────┘
       │ 5. 返回 openid, session_key
       ▼
┌──────────────┐
│  后端服务    │
└──────┬───────┘
       │ 6. 查询或创建用户
       │ 7. 生成 JWT token
       ▼
┌──────────────┐
│  Supabase    │
└──────┬───────┘
       │ 8. 返回 access_token, refresh_token
       ▼
┌──────────────┐
│  小程序      │
└──────────────┘
```

### 3.3 微信授权 API 实现

**端点**: `POST /api/auth/wechat`

**请求体**:
```json
{
  "code": "081xYz0w3XXXXX"
}
```

**响应体**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "微信用户",
    "avatar": "https://...",
    "wechat_openid": "oXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

**实现逻辑**:
```typescript
// src/api/auth.ts
router.post('/wechat', async (req, res) => {
  const { code } = req.body;
  
  // 1. 调用微信 code2Session API
  const { openid, session_key, unionid } = await wechatService.code2Session(code);
  
  // 2. 查询用户
  let user = await userService.findByWechatOpenid(openid);
  
  // 3. 如果用户不存在，创建新用户
  if (!user) {
    user = await userService.createWechatUser({
      wechat_openid: openid,
      wechat_unionid: unionid,
      wechat_session_key: session_key,
      provider: 'wechat'
    });
  } else {
    // 更新 session_key
    await userService.updateWechatSessionKey(user.id, session_key);
  }
  
  // 4. 生成 JWT token
  const access_token = generateAccessToken(user);
  const refresh_token = generateRefreshToken(user);
  
  // 5. 返回响应
  res.json({
    access_token,
    refresh_token,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      wechat_openid: user.wechat_openid
    }
  });
});
```

### 3.4 数据库 Schema 更新

**新增字段**（在 `users` 表）:
```sql
ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(255);
ALTER TABLE users ADD COLUMN wechat_session_key VARCHAR(255);
CREATE INDEX idx_users_wechat_openid ON users(wechat_openid);
```

**完整 `users` 表结构**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  avatar TEXT,
  provider VARCHAR(50),  -- 'google' | 'apple' | 'email' | 'wechat'
  provider_id VARCHAR(255),
  password_hash VARCHAR(255),
  wechat_openid VARCHAR(255) UNIQUE,      -- 新增
  wechat_unionid VARCHAR(255),            -- 新增
  wechat_session_key VARCHAR(255),        -- 新增
  birth_profile JSONB,
  preferences JSONB,
  email_verified BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. AI 服务架构

### 4.1 DeepSeek API 集成

**配置**:
```typescript
// src/services/ai.ts
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const AI_TIMEOUT_MS = process.env.AI_TIMEOUT_MS || 0;
```

**温度分层策略**:
```typescript
const TEMPERATURE_TIERS = {
  T1: 0.1,  // 事实数据（无需 AI）
  T2: 0.3,  // 百科/详解
  T3: 0.5,  // 分析内容（本命盘、合盘、CBT）
  T4: 0.6,  // 时效性/建议内容（每日运势、实践工具）
  T5: 0.7   // 创意/深度洞察（问答、智慧）
};
```

**缓存策略**:
```typescript
// 缓存键格式: ai:{promptId}:v{version}:{inputHash}
// TTL: 7 天
const cacheKey = `ai:${promptId}:v${version}:${hash(input)}`;
await cache.set(cacheKey, result, 7 * 24 * 60 * 60);
```

### 4.2 Prompt 管理系统

**Prompt 注册**:
```typescript
// src/prompts/manager.ts
registerPrompt({
  id: 'natal-overview',
  version: '5.1',
  temperature: TEMPERATURE_TIERS.T3,
  template: (input) => `...`
});
```

**Prompt 调用**:
```typescript
const prompt = getPrompt('natal-overview');
const result = await ai.generateContent(prompt.id, input);
```

### 4.3 移除 Gemini 的影响

| 功能 | 原实现 (Gemini) | 新实现 (DeepSeek) |
|------|----------------|------------------|
| 文本生成 | `generateAstrologyInsight()` | 通过后端 API 调用 DeepSeek |
| 图像生成 | `generateCosmicImage()` | **移除**（DeepSeek 不支持） |
| 每日运势 | `generateDailyFortune()` | 通过后端 `/api/daily` |
| 合盘报告 | `generateSynastryReport()` | 通过后端 `/api/synastry` |
| CBT 分析 | `analyzeCBTRecord()` | 通过后端 `/api/cbt/analysis` |

---

## 5. 数据库架构

### 5.1 表结构

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `users` | 用户信息 | id, email, wechat_openid, birth_profile |
| `subscriptions` | 订阅记录 | user_id, plan, status, current_period_end |
| `purchases` | 一次性购买 | user_id, feature_type, scope |
| `free_usage` | 免费额度 | device_fingerprint, ask_used, synastry_used |
| `synastry_records` | 合盘记录 | user_id, person_a_hash, person_b_hash |
| `subscription_usage` | 订阅使用量 | user_id, feature_type, week_start, used_count |
| `cbt_records` | CBT 日记 | user_id, mood, content, analysis |

### 5.2 数据隔离策略

- **独立 Supabase 项目**: Astromind 和 Oracle_CN 使用不同的数据库
- **无数据共享**: 用户需要在两个平台分别注册
- **独立备份**: 各自的备份和恢复策略

---

## 6. 缓存架构

### 6.1 缓存层级

```
┌─────────────────────────────────────────┐
│  小程序本地缓存 (wx.storage)             │
│  - 用户信息、token、偏好设置             │
│  - TTL: 永久（手动清理）                 │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  后端 Redis 缓存                         │
│  - AI 生成内容 (7 天)                    │
│  - 星历计算 (永久/24 小时)               │
│  - API 响应 (自定义 TTL)                 │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Supabase PostgreSQL                    │
│  - 用户数据、订阅、购买记录              │
│  - 永久存储                              │
└─────────────────────────────────────────┘
```

### 6.2 缓存策略

| 数据类型 | 缓存位置 | TTL | 缓存键格式 |
|---------|---------|-----|-----------|
| 用户信息 | wx.storage | 永久 | `user_info` |
| Token | wx.storage | 永久 | `access_token`, `refresh_token` |
| 本命盘数据 | Redis | 永久 | `natal:chart:{hash}` |
| 每日运势 | Redis | 24 小时 | `transit:{hash}:{date}` |
| AI 生成内容 | Redis | 7 天 | `ai:{promptId}:v{version}:{hash}` |
| 合盘分析 | Redis | 永久 | `synastry:{hash}` |

---

## 7. 性能优化策略

### 7.1 前端优化

1. **分包加载**: 将非核心页面放入分包，减少主包大小
2. **图片优化**: 使用 WebP 格式，压缩图片大小
3. **懒加载**: 列表数据分页加载，避免一次性加载过多数据
4. **缓存策略**: 使用 wx.storage 缓存常用数据
5. **请求合并**: 合并多个 API 请求，减少网络开销

### 7.2 后端优化

1. **Redis 缓存**: 缓存 AI 生成内容和星历计算结果
2. **数据库索引**: 在常用查询字段上创建索引
3. **连接池**: 使用数据库连接池，减少连接开销
4. **CDN 加速**: 静态资源使用 CDN 分发
5. **负载均衡**: 使用负载均衡器分发请求

### 7.3 AI 服务优化

1. **缓存策略**: 7 天 TTL，减少重复调用
2. **温度分层**: 根据内容类型选择合适的温度
3. **超时控制**: 设置请求超时时间，避免长时间等待
4. **错误重试**: 实现自动重试机制

---

## 8. 安全设计

### 8.1 认证安全

- **JWT Token**: 使用 HS256 算法签名，15 分钟过期
- **Refresh Token**: 7 天过期，用于刷新 access_token
- **Session Key**: 微信 session_key 加密存储

### 8.2 数据安全

- **HTTPS**: 所有 API 请求使用 HTTPS
- **SQL 注入防护**: 使用参数化查询
- **XSS 防护**: 对用户输入进行转义
- **CSRF 防护**: 使用 CSRF token

### 8.3 隐私保护

- **数据最小化**: 仅收集必要的用户数据
- **数据加密**: 敏感数据加密存储
- **数据隔离**: 用户数据隔离，无法跨用户访问

---

## 9. 监控和日志

### 9.1 监控指标

- **API 响应时间**: 监控各端点的响应时间
- **错误率**: 监控 API 错误率
- **用户活跃度**: 监控 DAU、MAU
- **AI 调用量**: 监控 DeepSeek API 调用量和成本

### 9.2 日志策略

- **访问日志**: 记录所有 API 请求
- **错误日志**: 记录所有错误和异常
- **AI 日志**: 记录 AI 调用的输入和输出
- **用户行为日志**: 记录用户关键操作

---

## 10. 部署架构

### 10.1 小程序部署

```
开发环境 → 微信开发者工具 → 上传代码 → 微信小程序后台 → 提交审核 → 发布
```

### 10.2 后端部署

```
本地开发 → Git 推送 → CI/CD (GitHub Actions) → 构建 Docker 镜像 → 部署到云服务器 → Nginx 反向代理
```

### 10.3 数据库部署

```
Supabase 控制台 → 创建项目 → 运行迁移脚本 → 配置备份策略
```

---

## 11. 风险缓解措施

### 11.1 技术风险缓解

| 风险 | 缓解措施 |
|------|---------|
| 小程序包大小超限 | 使用分包加载，压缩图片和代码 |
| API 并发限制 | 使用请求队列，控制并发数 |
| DeepSeek API 不稳定 | 实现重试机制，使用 Redis 缓存 |
| 数据库性能瓶颈 | 创建索引，使用连接池，优化查询 |

### 11.2 业务风险缓解

| 风险 | 缓解措施 |
|------|---------|
| 用户不接受小程序 | 保持原有 UI 风格，渐进式优化 |
| 失去图像生成功能 | 评估使用频率，考虑替代方案 |
| 代码同步成本高 | 建立同步流程，或考虑后续合并后端 |

---

## 12. 后续优化方向

1. **微信支付集成**: 替换 Stripe，使用微信支付
2. **图像生成替代**: 集成第三方图像生成 API（如 Stable Diffusion）
3. **性能优化**: 使用 CDN、图片压缩、请求合并
4. **数据同步**: 实现 Oracle_CN 和 Astromind 的用户数据同步
5. **多端适配**: 支持支付宝小程序、抖音小程序
6. **后端合并**: 将 Astromind 后端合并到 Oracle_CN，统一维护
7. **AI 模型优化**: 探索更高效的 AI 模型和 Prompt 策略
8. **用户体验优化**: 根据用户反馈持续优化 UI 和交互

---

## 13. 参考资料

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信登录接口文档](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Oracle_CN 后端架构文档](../../../backend/FOLDER.md)

---

**设计审批**:
- 设计人: Claude Opus 4.5
- 审批人: [待填写]
- 审批日期: [待填写]
