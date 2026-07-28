# 付费与订阅系统 - 任务清单

## Phase 0: 基础设施准备

### 0.1 数据库设置
- [x] 选择数据库方案（PostgreSQL / Supabase / PlanetScale）
- [x] 创建数据库实例
- [x] 执行建表脚本（users, subscriptions, purchases, free_usage, purchase_records, synastry_records, subscription_usage）
- [x] 配置数据库连接环境变量
- [x] 验证：数据库连接成功，表结构正确

### 0.2 后端架构调整
- [x] 添加数据库 ORM（Prisma / Drizzle / 原生 pg）
- [x] 创建数据库模型定义
- [x] 添加 JWT 认证中间件
- [x] 创建统一的 API 响应格式
- [x] 验证：后端可正常启动，中间件生效

### 0.3 Stripe 账户设置
- [ ] 注册 Stripe 账户并完成验证（暂时跳过）
- [ ] 创建 Products：月订阅（$6.99/月）（暂时跳过）
- [ ] 创建积分充值套餐价格（暂时跳过）
- [ ] 配置 Webhook Endpoint（暂时跳过）
- [ ] 获取 API Keys 并配置环境变量（暂时跳过）
- [ ] 验证：Stripe Dashboard 显示产品，测试模式可用（暂时跳过）

---

## Phase 1: 用户账户体系（可并行：1.1-1.3）

### 1.1 Google 登录
- [ ] 创建 Google Cloud 项目，配置 OAuth 凭据（需用户配置）
- [x] 后端实现 `/api/auth/google` 端点
- [x] 前端集成 Google Sign-In SDK
- [x] 创建 AuthContext 管理登录状态
- [x] 验证：Google 登录流程完整（需配置 CLIENT_ID）

### 1.2 Apple 登录
- [ ] 配置 Apple Developer Sign In with Apple（需用户配置）
- [x] 后端实现 `/api/auth/apple` 端点
- [x] 前端集成 Apple Sign-In JS SDK
- [x] 验证：Apple 登录流程完整（需配置 CLIENT_ID）

### 1.3 Email 注册/登录
- [x] 后端实现 `/api/auth/register`（含邮箱验证）
- [x] 后端实现 `/api/auth/login`
- [x] 后端实现 `/api/auth/logout`
- [x] 后端实现 `/api/auth/me`
- [ ] 配置邮件发送服务（SendGrid / Resend）（可选）
- [x] 验证：Email 注册、验证、登录流程完整

### 1.4 首次注册 7 天试用
- [x] 注册时设置 `trial_ends_at = NOW() + 7 days`
- [x] 权益服务检查试用期有效性
- [ ] 前端显示试用到期提示（待实现）
- [x] 验证：新用户享有 7 天完整订阅权益

### 1.5 前端登录 UI
- [x] 创建 `/auth` 页面组件
- [x] 实现登录/注册表单
- [x] 实现 OAuth 按钮（Google、Apple）
- [x] 添加 Toast 提示（成功/错误）
- [x] 验证：UI 美观，响应式，暗色主题适配

### 1.6 用户数据迁移
- [x] 后端实现 `/api/auth/migrate` 端点
- [x] 前端实现迁移提示 Modal
- [x] 登录后检测 localStorage 数据并提示迁移
- [x] 迁移成功后清除 localStorage
- [x] 验证：旧数据完整迁移到云端

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

### 2.3 积分充值流程
- [ ] 定义积分套餐与价格配置
- [ ] 后端实现 `/api/payment/credits/create-checkout` 端点
- [ ] 实现积分充值 Webhook 处理（支付成功发放积分）
- [ ] 前端集成 Stripe Checkout（积分充值）
- [ ] 前端集成 PayPal 充值入口
- [ ] 支付方式选择（Stripe/PayPal/信用卡）
- [ ] 实现充值成功后权益更新
- [ ] 验证：积分充值流程完整

### 2.4 积分记录与余额
- [ ] 后端实现 `/api/payment/credits/records` 与余额查询
- [x] 前端展示积分余额与充值/消费记录
- [ ] 验证：积分余额与记录正确显示

---

## Phase 3: 权益系统

### 3.1 权益服务
- [x] 创建 EntitlementService 类
- [x] 实现订阅权益计算逻辑（含试用期）
- [x] 实现积分解锁权益计算逻辑
- [x] 实现免费额度计算逻辑
- [x] 实现权益合并显示逻辑（免费+订阅）
- [x] 实现订阅赠送积分发放逻辑（每次成功支付 500 积分）
- [x] 验证：权益计算逻辑正确

### 3.2 权益 API
- [x] 实现 `/api/entitlements` GET 端点
- [x] 实现 `/api/entitlements/consume` POST 端点
- [x] 实现 `/api/entitlements/check` POST 端点
- [x] 验证：API 返回正确权益状态

### 3.3 前端权益上下文
- [x] 创建 EntitlementContext
- [x] 实现权益状态获取与缓存（5 分钟 TTL）
- [x] 暴露积分余额与本地缓存
- [x] 展示订阅赠送积分在权益列表
- [x] 创建 `useEntitlement` Hook
- [x] 创建 `useFeatureAccess` Hook
- [x] 验证：前端正确获取并使用权益状态

### 3.4 付费墙组件
- [x] 创建 LockedContent 组件（遮罩+锁图标）
- [x] 创建 PaywallModal 组件（积分解锁/充值/订阅）
- [x] 实现不同功能的付费墙文案
- [x] 显示积分消耗价格与余额
- [x] 提供积分充值入口
- [x] 推荐订阅选项（高亮）
- [x] 验证：付费墙 UI 美观，交互流畅

### 3.5 升级按钮与弹窗
- [ ] 创建全局 UpgradeButton 组件
- [ ] 创建 UpgradeModal 升级弹窗
- [ ] 创建 SubscriptionModal 订阅管理弹窗
- [ ] 创建 RetentionModal 取消挽留弹窗
- [ ] 验证：弹窗流程完整，UI 符合设计

---

## Phase 4: 页面付费点集成

### 4.1 探索自我 (MePage)
- [ ] 心理维度前 2 个（Emotions, Attachment）保持免费
- [ ] 心理维度后 4 个添加锁标识 + 付费墙（10 积分/个，永久）
- [ ] 核心主题内容添加付费墙（10 积分/个，永久）
- [ ] 订阅用户自动解锁所有内容
- [ ] 验证：付费点正确触发，购买后永久解锁

### 4.2 今日运势 (TodayPage)
- [ ] 公开内容（4 维等）保持免费
- [ ] 展开详情页（今日剧本）添加付费墙（10 积分，每日重置）
- [ ] 星象详情（查看详情）添加付费墙（10 积分/次，每日重置）
- [ ] 订阅用户无限查看
- [ ] 验证：每日重置逻辑正确

### 4.3 双人合盘 (UsPage)
- [ ] 实现合盘唯一性哈希生成
- [ ] 创建合盘记录 API（/api/synastry/check-hash, /api/synastry/record）
- [ ] 永久免费 3 次合盘（记录使用次数）
- [ ] 超出后积分解锁 30/次
- [ ] 合盘内查看详情 10/次（按合盘哈希绑定）
- [ ] 订阅用户每周 +2 次（显示 5/5）
- [ ] 显示剩余次数
- [ ] 验证：唯一性校验正确，防刷机制有效

### 4.4 Ask 问答 (AskOraclePage)
- [ ] 每周免费 3 次（周一 00:00 UTC 重置）
- [ ] 超出后积分解锁 20/次
- [ ] 订阅用户每周 +2 次（显示 5/5）
- [ ] 显示本周剩余次数
- [ ] 优先消耗免费额度
- [ ] 验证：每周重置逻辑正确

### 4.5 CBT 日记统计 (CalendarStats)
- [ ] 日记记录保持免费
- [ ] 4 个统计卡片中的 3 个解读内容添加锁标识
- [ ] 积分解锁 20/月（按自然月）
- [ ] 订阅用户进入后自动解锁当月
- [ ] 验证：自然月计费逻辑正确

### 4.6 百科工具 (Synthetica)
- [x] 每日免费 3 次使用额度
- [x] 订阅用户每日 +7 次（合计 10 次）
- [x] 超出后 10 积分/次
- [x] “揭示洞察”按钮旁展示剩余次数
- [x] 蓝图文本行距与相位计数字号调整
- [x] 验证：每日重置、订阅额度与 UI 显示正确

---

## Phase 5: 缓存优化

### 5.1 前端数据缓存
- [ ] 创建 useCachedData Hook
- [ ] 探索自我数据缓存（永久，出生信息变更时失效）
- [ ] 今日运势数据缓存（当日，日期变更时失效）
- [ ] 合盘数据缓存（永久，配对信息变更时失效）
- [ ] Ask 历史缓存（永久）
- [ ] 验证：页面切换不重复加载已缓存数据

### 5.2 权益状态缓存
- [ ] 权益状态缓存（5 分钟 TTL）
- [ ] 购买记录缓存（localStorage）
- [ ] 积分余额缓存（短 TTL）
- [ ] 支付成功后刷新缓存
- [ ] 验证：缓存策略正确，不影响实时性

### 5.3 购买记录本地缓存
- [ ] 已购买内容 ID 缓存到 localStorage
- [ ] 页面加载时先检查本地缓存
- [ ] 避免重复请求后端校验
- [ ] 验证：减少后端请求次数

---

## Phase 6: 付费报告 - P0（可选）

### 6.1 报告基础架构
- [ ] 创建报告数据模型
- [x] 报告购买改为积分消耗（订阅价/非订阅价）
- [ ] 实现 `/api/reports` CRUD 端点
- [ ] 验证：报告 API 正常工作

### 6.2 月运报告
- [ ] 设计月运报告 Prompt
- [ ] 实现月运报告生成逻辑
- [ ] 创建月运报告前端展示页面
- [ ] 订阅用户 8 折积分价格
- [ ] 验证：月运报告生成正确

### 6.3 年度运势报告
- [ ] 设计年度报告结构
- [ ] 实现年度报告生成逻辑
- [ ] 创建年度报告前端展示页面
- [ ] 订阅用户 8 折积分价格
- [ ] 验证：年度报告内容完整

---

## Phase 7: 安全与优化

### 7.1 安全加固
- [ ] 实现 API 限流
- [ ] 添加 CSRF 保护
- [ ] Webhook 签名验证加固
- [ ] 敏感操作审计日志
- [ ] 验证：安全测试通过

### 7.2 防滥用
- [ ] 设备指纹追踪（fingerprintjs）
- [ ] IP 限流
- [ ] 合盘唯一性哈希校验
- [ ] 验证：防滥用机制有效

### 7.3 性能优化
- [ ] 权益状态缓存（Redis 可选）
- [ ] 数据库查询优化
- [ ] 验证：响应时间满足要求

---

## Phase 8: 上线准备

### 8.1 测试
- [ ] 端到端支付流程测试
- [ ] 订阅生命周期测试
- [ ] 权益校验测试
- [ ] 缓存策略测试
- [ ] 跨浏览器测试

### 8.2 文档
- [ ] 更新 README
- [ ] 编写部署文档

### 8.3 部署
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
           Phase 2 ──────────────▶ Phase 5
                                       │
                                       ▼
                              Phase 6 (可选)
                                       │
                                       ▼
                              Phase 7 ──▶ Phase 8
```

- Phase 0 必须先完成（基础设施）
- Phase 1 和 Phase 2 可部分并行
- Phase 3 依赖 Phase 1 + 2
- Phase 4 依赖 Phase 3
- Phase 5 与 Phase 4 可并行
- Phase 6 可选，不影响核心功能
- Phase 7/8 最后进行

---

## 核心价格表速查（积分）

换算建议：1 积分 = $0.10

| 功能 | 积分 | 有效期 | 订阅权益 |
|-----|------|-------|---------|
| 探索自我 - 心理维度 | 10/个 | 永久 | 全部解锁 |
| 探索自我 - 核心主题 | 10/个 | 永久 | 全部解锁 |
| 今日运势 - 今日剧本 | 10 | 当日 | 免费 |
| 今日运势 - 星象详情 | 10/次 | 当日 | 免费 |
| 双人合盘 | 30/次 | 永久 | +2次/周 |
| 合盘内查看详情 | 10/次 | 永久 | 免费 |
| Ask 问答 | 20/次 | 单次 | +2次/周 |
| CBT 日记统计解读 | 20 | 自然月 | 自动解锁 |
| **订阅** | $6.99/月 | - | - |
| **报告折扣** | 8 折（积分） | - | 订阅专享 |
