# 付费与订阅系统 - 任务清单

## Phase 0: 基础设施准备

### 0.1 数据库设置
- [ ] 选择数据库方案（PostgreSQL / Supabase / PlanetScale）
- [ ] 创建数据库实例
- [ ] 执行建表脚本（users, subscriptions, purchases, reports, free_usage）
- [ ] 配置数据库连接环境变量
- [ ] 验证：数据库连接成功，表结构正确

### 0.2 后端架构调整
- [ ] 添加数据库 ORM（Prisma / Drizzle / 原生 pg）
- [ ] 创建数据库模型定义
- [ ] 添加 JWT 认证中间件
- [ ] 创建统一的 API 响应格式
- [ ] 验证：后端可正常启动，中间件生效

### 0.3 Stripe 账户设置
- [ ] 注册 Stripe 账户并完成验证
- [ ] 创建 Products：月订阅、年订阅
- [ ] 创建 Prices：$6.99/月、$49.99/年
- [ ] 配置 Webhook Endpoint
- [ ] 获取 API Keys 并配置环境变量
- [ ] 验证：Stripe Dashboard 显示产品，测试模式可用

---

## Phase 1: 用户账户体系（可并行：1.1-1.3）

### 1.1 Google 登录
- [ ] 创建 Google Cloud 项目，配置 OAuth 凭据
- [ ] 后端实现 `/api/auth/google` 端点
- [ ] 前端集成 Google Sign-In SDK
- [ ] 创建 AuthContext 管理登录状态
- [ ] 验证：Google 登录流程完整，用户写入数据库

### 1.2 Apple 登录
- [ ] 配置 Apple Developer Sign In with Apple
- [ ] 后端实现 `/api/auth/apple` 端点
- [ ] 前端集成 Apple Sign-In JS SDK
- [ ] 验证：Apple 登录流程完整

### 1.3 Email 注册/登录
- [ ] 后端实现 `/api/auth/register`（含邮箱验证）
- [ ] 后端实现 `/api/auth/login`
- [ ] 后端实现 `/api/auth/logout`
- [ ] 后端实现 `/api/auth/me`
- [ ] 配置邮件发送服务（SendGrid / Resend）
- [ ] 验证：Email 注册、验证、登录流程完整

### 1.4 前端登录 UI
- [ ] 创建 `/auth` 页面组件
- [ ] 实现登录/注册表单
- [ ] 实现 OAuth 按钮（Google、Apple）
- [ ] 添加 Toast 提示（成功/错误）
- [ ] 验证：UI 美观，响应式，暗色主题适配

### 1.5 用户数据迁移
- [ ] 后端实现 `/api/auth/migrate` 端点
- [ ] 前端实现迁移提示 Modal
- [ ] 登录后检测 localStorage 数据并提示迁移
- [ ] 迁移成功后清除 localStorage
- [ ] 验证：旧数据完整迁移到云端

### 1.6 用户资料管理
- [ ] 后端实现 `/api/auth/profile` PUT 端点
- [ ] 前端在设置页添加账户信息编辑
- [ ] 支持修改出生信息、偏好设置
- [ ] 验证：资料修改持久化到数据库

---

## Phase 2: 支付集成

### 2.1 Stripe 后端集成
- [ ] 安装 `stripe` npm 包
- [ ] 创建 `/api/payment/create-checkout` 端点
- [ ] 创建 `/api/payment/create-portal` 端点
- [ ] 实现 `/api/payment/webhook` 处理
  - [ ] checkout.session.completed
  - [ ] customer.subscription.created
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] invoice.payment_succeeded
  - [ ] invoice.payment_failed
- [ ] 验证：Webhook 签名验证通过，事件正确处理

### 2.2 订阅流程
- [ ] 后端实现订阅状态查询 `/api/payment/subscription`
- [ ] 前端创建订阅页面 `/subscription`
- [ ] 实现订阅按钮跳转 Stripe Checkout
- [ ] 实现订阅成功回调页面
- [ ] 实现 Customer Portal 跳转（管理/取消订阅）
- [ ] 验证：完整订阅流程，状态正确更新

### 2.3 单次购买流程
- [ ] 后端实现 `/api/payment/purchase` 端点
- [ ] 实现 Payment Intent 创建
- [ ] 前端集成 Stripe Elements（可选，或用 Checkout）
- [ ] 实现购买成功后权益更新
- [ ] 验证：单次购买流程完整

### 2.4 购买记录
- [ ] 后端实现 `/api/payment/purchases` 查询
- [ ] 前端创建购买记录页面 `/purchases`
- [ ] 显示购买历史、剩余额度
- [ ] 验证：购买记录正确显示

---

## Phase 3: 权益系统

### 3.1 权益服务
- [ ] 创建 EntitlementService 类
- [ ] 实现订阅权益计算逻辑
- [ ] 实现单次购买权益计算逻辑
- [ ] 实现免费额度计算逻辑
- [ ] 验证：权益计算逻辑正确

### 3.2 权益 API
- [ ] 实现 `/api/entitlements` GET 端点
- [ ] 实现 `/api/entitlements/consume` POST 端点
- [ ] 实现 `/api/entitlements/check/:feature` GET 端点
- [ ] 验证：API 返回正确权益状态

### 3.3 前端权益上下文
- [ ] 创建 EntitlementContext
- [ ] 实现权益状态获取与缓存
- [ ] 创建 `useEntitlement` Hook
- [ ] 验证：前端正确获取并使用权益状态

### 3.4 付费墙组件
- [ ] 创建 Paywall 组件
- [ ] 实现不同功能的付费墙文案
- [ ] 显示单次购买 vs 订阅对比
- [ ] 实现购买/订阅按钮
- [ ] 验证：付费墙 UI 美观，交互流畅

### 3.5 升级按钮与弹窗（参考 ChatGPT）
- [ ] 创建全局 UpgradeButton 组件
  - [ ] 顶部导航栏右侧位置
  - [ ] 根据用户状态显示不同文案（Upgrade / Pro Plan / Renew）
- [ ] 创建 UpgradeModal 升级弹窗
  - [ ] Free vs Pro 双栏对比卡片
  - [ ] 月付/年付切换（高亮年付节省金额）
  - [ ] "Upgrade Now" CTA 按钮
  - [ ] 响应式设计（Desktop 双栏 / Mobile 单栏）
  - [ ] 来源追踪（header / paywall / feature）
- [ ] 创建 SubscriptionModal 订阅管理弹窗
  - [ ] 显示当前计划和下次扣款日期
  - [ ] 显示本月权益使用情况（进度条）
  - [ ] "Manage Billing" 跳转 Stripe Portal
  - [ ] "Switch to Year" 切换年付
  - [ ] "Cancel Subscription" 触发挽留流程
- [ ] 创建 RetentionModal 取消挽留弹窗
  - [ ] 显示将失去的权益列表
  - [ ] 挽留优惠（如 20% off 续费）
  - [ ] "Keep My Subscription" / "Cancel anyway" 双按钮
- [ ] 验证：弹窗流程完整，UI 符合设计稿

### 3.6 权益校验集成
- [ ] Ask 问答添加权益校验
- [ ] 详情解读添加权益校验
- [ ] 合盘 Tab 添加权益校验
- [ ] CBT AI 分析添加权益校验
- [ ] 日运详情添加权益校验
- [ ] 验证：各功能权益校验正确

### 3.6 免费额度追踪
- [ ] 实现设备指纹生成（fingerprintjs）
- [ ] 后端实现免费额度记录
- [ ] 未登录用户免费额度校验
- [ ] 验证：免费额度正确追踪和限制

---

## Phase 4: 付费报告 - P0

### 4.1 报告基础架构
- [ ] 创建报告数据模型
- [ ] 实现 `/api/reports` CRUD 端点
- [ ] 创建报告生成队列（可选，大报告用）
- [ ] 验证：报告 API 正常工作

### 4.2 月运报告
- [ ] 设计月运报告 Prompt
- [ ] 实现月运报告生成逻辑
- [ ] 创建月运报告前端展示页面
- [ ] 实现订阅用户每月免费领取
- [ ] 验证：月运报告生成正确，UI 美观

### 4.3 年度运势报告
- [ ] 设计年度报告结构（总览、季度、专题）
- [ ] 设计年度报告 Prompt（分段生成）
- [ ] 实现年度报告生成逻辑
- [ ] 创建年度报告前端展示页面
- [ ] 验证：年度报告内容完整，质量高

### 4.4 PDF 生成
- [ ] 选择 PDF 生成方案（puppeteer / @react-pdf/renderer）
- [ ] 设计报告 PDF 模板
- [ ] 实现 `/api/reports/:id/pdf` 端点
- [ ] 添加 PDF 下载按钮
- [ ] 验证：PDF 生成正确，排版美观

### 4.5 报告商店
- [ ] 创建报告商店页面 `/store`
- [ ] 展示可购买报告列表
- [ ] 实现报告购买流程
- [ ] 显示已购报告入口
- [ ] 验证：商店 UI 美观，购买流程顺畅

---

## Phase 5: 付费报告 - P1（可选，Phase 4 完成后）

### 5.1 合盘深度报告
- [ ] 扩展现有合盘为可下载报告
- [ ] 添加 PDF 导出
- [ ] 实现购买/订阅权益校验
- [ ] 验证：合盘报告完整可用

### 5.2 事业/职业报告
- [ ] 设计职业报告结构
- [ ] 设计职业报告 Prompt
- [ ] 实现生成逻辑
- [ ] 创建前端展示页面
- [ ] 验证：职业报告质量高

---

## Phase 6: 优化与安全

### 6.1 安全加固
- [ ] 实现 API 限流
- [ ] 添加 CSRF 保护
- [ ] Webhook 签名验证加固
- [ ] 敏感操作审计日志
- [ ] 验证：安全测试通过

### 6.2 性能优化
- [ ] 权益状态缓存（Redis 可选）
- [ ] 报告生成异步化
- [ ] 数据库查询优化
- [ ] 验证：响应时间满足要求

### 6.3 监控告警
- [ ] 配置支付失败告警
- [ ] 配置订阅取消告警
- [ ] 配置 AI 成本监控
- [ ] 验证：告警正常触发

---

## Phase 7: 上线准备

### 7.1 测试
- [ ] 端到端支付流程测试
- [ ] 订阅生命周期测试
- [ ] 权益校验测试
- [ ] 报告生成测试
- [ ] 跨浏览器测试

### 7.2 文档
- [ ] 更新 README
- [ ] 编写部署文档
- [ ] 编写运维文档

### 7.3 部署
- [ ] 配置生产环境变量
- [ ] Stripe 切换到生产模式
- [ ] 部署后端服务
- [ ] 部署前端应用
- [ ] 验证：生产环境完整可用

---

## 依赖关系

```
Phase 0 ──▶ Phase 1 ──▶ Phase 3 ──▶ Phase 4
              │                        │
              ▼                        ▼
           Phase 2 ◀────────────── Phase 5
                                       │
                                       ▼
                              Phase 6 ──▶ Phase 7
```

- Phase 0 必须先完成（基础设施）
- Phase 1 和 Phase 2 可部分并行
- Phase 3 依赖 Phase 1 + 2
- Phase 4 依赖 Phase 3
- Phase 5 可在 Phase 4 部分完成后启动
- Phase 6/7 最后进行
