# 订阅管理

## ADDED Requirements

### Requirement: 订阅购买流程
系统 SHALL 支持用户通过 Stripe 订阅月度或年度计划。

#### Scenario: 购买月度订阅
- Given 登录用户访问订阅页面
- When 点击 "订阅 $6.99/月" 按钮
- Then 跳转到 Stripe Checkout 页面
- And 完成支付后返回应用
- And 订阅状态更新为 active
- And 权益立即生效

#### Scenario: 购买年度订阅
- Given 登录用户访问订阅页面
- When 点击 "订阅 $49.99/年" 按钮
- Then 跳转到 Stripe Checkout 页面
- And 完成支付后订阅状态更新为 active
- And 显示节省金额提示

#### Scenario: 支付失败
- Given 用户在 Stripe Checkout 支付
- When 支付失败或取消
- Then 返回应用并显示失败提示
- And 订阅状态保持未订阅

### Requirement: 订阅管理
系统 SHALL 允许订阅用户管理、取消或续费订阅。

#### Scenario: 查看订阅状态
- Given 订阅用户访问订阅管理页面
- When 页面加载
- Then 显示当前计划（月度/年度）
- And 显示到期日期
- And 显示续费状态

#### Scenario: 取消订阅
- Given 订阅用户点击取消订阅
- When 确认取消
- Then 跳转 Stripe Customer Portal
- And 取消后订阅在当前周期结束时失效
- And 显示挽留提示

#### Scenario: 订阅续费失败
- Given 订阅即将到期且自动续费
- When Stripe 扣款失败
- Then 订阅状态变为 past_due
- And 发送邮件通知用户
- And 给予 3 天宽限期

### Requirement: 升级入口与弹窗
系统 SHALL 提供全局升级入口和升级弹窗，参考 ChatGPT 升级体验。

#### Scenario: 免费用户点击升级按钮
- Given 免费用户在任意页面
- When 点击导航栏 "Upgrade to Pro" 按钮
- Then 打开升级弹窗（UpgradeModal）
- And 显示 Free vs Pro 对比卡片
- And 显示月付/年付价格选项

#### Scenario: 从付费墙触发升级
- Given 用户触发付费墙
- When 点击付费墙中的 "升级订阅" 按钮
- Then 打开升级弹窗
- And 高亮显示当前被限制的功能

#### Scenario: 订阅用户查看订阅状态
- Given 订阅用户在任意页面
- When 点击导航栏 "Pro Plan" 按钮
- Then 打开订阅管理弹窗（SubscriptionModal）
- And 显示当前计划和到期日期
- And 显示本月权益使用进度

#### Scenario: 取消订阅挽留
- Given 订阅用户在订阅管理弹窗
- When 点击 "Cancel Subscription"
- Then 显示取消挽留弹窗（RetentionModal）
- And 列出将失去的权益
- And 提供挽留优惠
- And 显示 "Keep" 和 "Cancel anyway" 选项

### Requirement: 单次购买
系统 SHALL 支持非订阅用户单次购买特定内容。

#### Scenario: 购买 Ask 单次
- Given 用户 Ask 免费次数用完
- When 点击付费墙中的 "购买 $0.99"
- Then 跳转 Stripe Checkout
- And 支付成功后获得 1 次 Ask 额度

#### Scenario: 购买详情解读包
- Given 用户详情解读免费次数用完
- When 点击 "购买 10 次解读包 $2.99"
- Then 支付成功后获得 10 次解读额度

#### Scenario: 购买报告
- Given 用户访问报告商店
- When 购买年度运势报告 $7.99
- Then 支付成功后可查看报告
- And 报告加入已购列表
