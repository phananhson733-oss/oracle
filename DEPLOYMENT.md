# 部署指南

本文档说明如何将 AstroMind AI 部署到 Vercel。

## 前置准备

### 1. 注册必要的服务

- **Vercel 账号**: https://vercel.com
- **Supabase 项目**: https://supabase.com (数据库)
- **Stripe 账号**: https://stripe.com (支付，可选)
- **Google Cloud Console**: https://console.cloud.google.com (OAuth，可选)

### 2. 配置 Supabase 数据库

1. 在 Supabase 创建新项目
2. 执行 `backend/src/db/schema.sql` 中的 SQL 脚本创建数据表
3. 获取以下信息：
   - `SUPABASE_URL`: 项目 URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (在 Settings > API)

### 3. 配置 Stripe (可选，用于付费功能)

1. 在 Stripe Dashboard 创建产品和价格
2. 获取以下信息：
   - `STRIPE_SECRET_KEY`: Secret Key
   - `STRIPE_WEBHOOK_SECRET`: Webhook Secret
   - 各个产品的 Price ID

### 4. 配置 Google OAuth (可选)

1. 在 Google Cloud Console 创建 OAuth 2.0 客户端
2. 添加授权重定向 URI: `https://your-domain.vercel.app`
3. 获取 `GOOGLE_CLIENT_ID`

## 部署步骤

### 方式一：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
# 在项目根目录执行
vercel
```

4. **配置环境变量**
```bash
# 前端环境变量
vercel env add VITE_GOOGLE_CLIENT_ID
vercel env add VITE_API_URL

# 后端环境变量
vercel env add PORT
vercel env add DEEPSEEK_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
# ... 其他 Stripe Price IDs
```

5. **重新部署**
```bash
vercel --prod
```

### 方式二：通过 Vercel Dashboard 部署

1. **连接 Git 仓库**
   - 访问 https://vercel.com/new
   - 选择你的 Git 仓库 (GitHub/GitLab/Bitbucket)
   - 点击 Import

2. **配置项目**
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **配置环境变量**
   在 Vercel Dashboard > Settings > Environment Variables 添加：

   **前端环境变量 (Production)**
   ```
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   VITE_API_URL=https://your-domain.vercel.app
   ```

   **后端环境变量 (Production)**
   ```
   PORT=3001
   DEEPSEEK_API_KEY=your_deepseek_api_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

4. **部署**
   - 点击 Deploy
   - 等待构建完成

## 配置 Stripe Webhook (如果使用付费功能)

1. 在 Stripe Dashboard > Developers > Webhooks
2. 添加 Endpoint: `https://your-domain.vercel.app/api/payment/webhook`
3. 选择事件:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. 复制 Webhook Secret 并更新环境变量

## 验证部署

1. 访问 `https://your-domain.vercel.app`
2. 检查前端是否正常加载
3. 访问 `https://your-domain.vercel.app/health` 检查后端 API
4. 测试登录功能 (如果已配置)

## 常见问题

### 1. API 请求失败
- 检查 `VITE_API_URL` 是否正确设置为 Vercel 域名
- 检查后端环境变量是否正确配置

### 2. 数据库连接失败
- 检查 Supabase URL 和 Service Role Key 是否正确
- 确认数据表已创建

### 3. 支付功能不工作
- 检查 Stripe Secret Key 是否为 Live Key (生产环境)
- 确认 Webhook 已正确配置

## 后续步骤

部署完成后，你可以：
1. 配置自定义域名 (在 Vercel Dashboard > Settings > Domains)
2. 启用 HTTPS (Vercel 自动提供)
3. 配置 Google OAuth 和 Stripe 支付
4. 添加用户登录和付费功能

## 本地开发

```bash
# 安装依赖
npm install
cd backend && npm install

# 启动前端 (端口 3000)
npm run dev

# 启动后端 (端口 3001)
cd backend && npm run dev
```

## 商业化部署建议

### 域名配置

1. **购买独立域名**
   - 推荐后缀: `.com` (首选) 或 `.ai` (突出 AI 特性)
   - 注册商: Namecheap, GoDaddy, Cloudflare
   - 价格: $10-100/年

2. **在 Vercel 配置自定义域名**
   - Dashboard > Settings > Domains
   - 添加域名并配置 DNS 记录
   - Vercel 自动提供 SSL 证书

### 性能和并发优化

1. **Vercel Pro 版 ($20/月)**
   - 1TB 带宽/月
   - 无限 Serverless 函数调用
   - 更好的性能和支持
   - 适合商业化网站

2. **数据库优化**
   - Supabase Pro 版 ($25/月): 8GB 数据库，100GB 带宽
   - 启用连接池 (Connection Pooling)
   - 添加数据库索引优化查询

3. **缓存策略**
   - 使用 Redis 缓存热点数据 (Upstash Redis)
   - CDN 缓存静态资源
   - API 响应缓存

4. **监控和分析**
   - Vercel Analytics: 性能监控
   - Sentry: 错误追踪
   - Google Analytics: 用户行为分析

### 付费功能架构

1. **Stripe 配置**
   - 使用 Live Mode (生产环境)
   - 配置 Webhook 处理订阅事件
   - 实现订阅管理和权限控制

2. **用户权限系统**
   - 基于 JWT 的认证
   - 数据库存储用户订阅状态
   - API 中间件验证权限

### 成本估算 (月度)

- **基础版** (~$45/月)
  - Vercel Pro: $20
  - Supabase Pro: $25
  - 域名: $1-8 (年付)

- **增长版** (~$100/月)
  - Vercel Pro: $20
  - Supabase Pro: $25
  - Redis (Upstash): $10
  - 监控工具: $20-30
  - 域名: $1-8

## 技术栈

- **前端**: React 19 + Vite + TypeScript
- **后端**: Express + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + Google OAuth
- **支付**: Stripe
- **部署**: Vercel
- **缓存**: Redis (可选)
- **监控**: Vercel Analytics, Sentry
