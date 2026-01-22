# GA4 转化目标与受众群体配置指南

本文档说明如何在 Google Analytics 4 中配置转化目标和受众群体。

---

## 1. 转化目标配置

### 1.1 标记关键事件为转化

在 GA4 中，所有事件都可以被标记为"转化"。建议标记以下核心事件：

#### 核心转化事件

| 事件名称 | 描述 | 转化价值 |
|----------|------|----------|
| `signup_completed` | 用户完成注册 | 高 |
| `login` | 用户登录 | 中 |
| `purchase` | 购买积分 | 高 |
| `subscription_started` | 订阅开始 | 高 |
| `wiki_article_viewed` | 浏览 Wiki 文章 | 低 |
| `oracle_question_asked` | 提问 Oracle | 中 |
| `synastry_report_generated` | 生成合盘报告 | 高 |
| `natal_chart_generated` | 生成星盘 | 中 |

#### 配置步骤

1. 登录 [Google Analytics](https://analytics.google.com)
2. 进入 **配置** > **转化**
3. 点击 **新建转化事件**
4. 输入事件名称（如 `signup_completed`）
5. 设置转化价值（可选）
6. 保存

### 1.2 配置转化计数方式

GA4 支持两种计数方式：

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| 每次 | 每次事件都计入转化 | 注册、表单提交 |
| 每次会话一次 | 每个会话只计入一次 | 登录、页面浏览 |

**配置路径**：转化 > 事件 > 编辑 > 计数方式

### 1.3 创建自定义漏斗报告

1. 进入 **探索** > **漏斗分析**
2. 点击 **新建**
3. 添加漏斗步骤：

```
步骤 1: 首页访问 (event: page_view, 页面: /)
步骤 2: 登录/注册页访问 (event: page_view, 页面: /login)
步骤 3: 完成注册 (event: signup_completed)
步骤 4: 首次使用核心功能 (event: oracle_question_asked)
```

4. 设置转化率目标
5. 保存报告

---

## 2. 受众群体配置

### 2.1 推荐受众群体

#### 已注册用户
- 条件：事件 `signup_completed` 至少发生过 1 次

#### 已付费用户
- 条件：事件 `purchase` 或 `subscription_started` 至少发生过 1 次

#### 活跃用户（7 天内）
- 条件：任何事件在最近 7 天内发生过

#### 高价值用户
- 条件：总交易额 > 0
- 需要启用电子商务跟踪

#### 潜在流失用户（30 天无访问）
- 条件：最近 30 天无事件发生

### 2.2 创建受众群体步骤

1. 登录 GA4
2. 进入 **配置** > **受众群体**
3. 点击 **新建受众群体**
4. 选择 **自定义受众群体**
5. 添加条件：
   ```
   条件组合：
   - 用户触发事件 = signup_completed（至少 1 次）
   - 在过去 30 天内
   ```
6. 命名受众群体
7. 保存

### 2.3 受众群体定义模板

#### 模板 1：注册用户
```
受众名称：Registered Users
条件：
  - 事件: signup_completed (>= 1)
  - 时间范围: 滚动 30 天
```

#### 模板 2：付费用户
```
受众名称：Paid Users
条件：
  - 事件: purchase (>= 1) OR subscription_started (>= 1)
  - 时间范围: 滚动 30 天
```

#### 模板 3：高活跃用户
```
受众名称：Power Users
条件：
  - 事件: ANY (>= 10)
  - 时间范围: 滚动 7 天
```

#### 模板 4：内容消费者
```
受众名称：Content Consumers
条件：
  - 事件: wiki_article_viewed (>= 3)
  - 时间范围: 滚动 30 天
```

---

## 3. 探索报告模板

### 3.1 用户获取漏斗

```
报告名称：User Acquisition Funnel
维度：
  - Session source
  - Session medium
  - Session campaign

指标：
  - Total users
  - Signups
  - Conversion rate

筛选条件：
  - Signups > 0
```

### 3.2 转化路径分析

```
报告名称：Conversion Path
可视化：用户路径图
步骤：
  1. page_view (首页)
  2. page_view (功能页)
  3. 核心事件
```

### 3.3 收入分析

```
报告名称：Revenue Analysis
维度：
  - Date
  - User type (new/returning)

指标：
  - Total revenue
  - Transactions
  - Average order value
```

---

## 4. 关键指标监控

### 4.1 核心 KPI

| 指标 | 目标值 | 监控频率 |
|------|--------|----------|
| 注册转化率 | > 5% | 每日 |
| 付费转化率 | > 2% | 每日 |
| 用户 LTV | > ¥100 | 每周 |
| 获客成本 | < ¥50 | 每周 |

### 4.2 设置自定义提醒

1. 进入 **管理** > **自定义提醒**
2. 创建新提醒：

```
提醒名称：注册数异常
条件：
  - 用户数 < 预期值的 80%
  - 每天
通知：邮件 + Slack（可选）
```

---

## 5. 与 Google Ads 集成

### 5.1 创建受众群体列表

1. 进入 GA4 **受众群体**页面
2. 选择受众群体
3. 点击 **导出到 Google Ads**
4. 在 Google Ads 中创建类似受众

### 5.2 转化跟踪设置

1. 在 Google Ads 中创建转化操作
2. 选择 **网站** 转化
3. 设置代码：
   ```javascript
   gtag('event', 'conversion', {
     'send_to': 'AW-CONVERSION_ID',
     'value': 1.0,
     'currency': 'CNY'
   });
   ```

---

## 6. 验证与调试

### 6.1 使用 DebugView

1. 打开 GA4 **DebugView**
2. 在网站上触发目标事件
3. 验证事件是否正确记录

### 6.2 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 事件未显示 | 未标记为转化 | 在转化设置中启用 |
| 数据延迟 | GA4 最多 24 小时延迟 | 等待或检查实时视图 |
| 受众群体为空 | 条件过于严格 | 放宽时间范围 |
| 转化计数异常 | 计数方式设置 | 检查转化计数配置 |

---

## 7. 相关文档

- [分析追踪配置](./ANALYTICS_SETUP.md)
- [UTM 参数规范](./UTM_SPEC.md)
- [GA4 官方文档](https://support.google.com/analytics/answer/10089681)
