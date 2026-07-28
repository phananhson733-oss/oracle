# UTM 参数命名规范

本文档定义营销活动中使用的 UTM 参数标准，确保 GA4 报告中数据一致性和可追溯性。

## 概述

UTM 参数用于标识流量来源，帮助分析不同营销渠道的表现。所有外部链接（社交媒体、广告、邮件等）都应添加 UTM 参数。

## 参数规范

### 1. utm_source（流量来源）

标识具体平台或发布渠道。

| 来源 | 值 | 说明 |
|------|-----|------|
| Google | `google` | Google 搜索广告 |
| Bing | `bing` | Bing 搜索广告 |
| Facebook | `facebook` | Facebook 帖子/广告 |
| Instagram | `instagram` | Instagram 帖子/广告 |
| Twitter/X | `twitter` | Twitter/X 推文/广告 |
| LinkedIn | `linkedin` | LinkedIn 内容/广告 |
| YouTube | `youtube` | YouTube 视频/广告 |
| 邮件 | `email` | 邮件营销 |
| Newsletter | `newsletter` | 订阅邮件 |
| 公众号 | `wechat` | 微信公众号 |
| 小红书 | `xiaohongshu` | 小红书笔记 |
| 合作伙伴 | `partner` | 合作伙伴推广 |
| 线下 | `offline` | 线下活动 |
| 口碑 | `referral` | 用户推荐 |

### 2. utm_medium（流量渠道）

标识流量类型或营销方式。

| 渠道 | 值 | 说明 |
|------|-----|------|
| CPC | `cpc` | 按点击付费广告 |
| CPM | `cpm` | 按展示付费广告 |
| 内容 | `content` | 内容营销 |
| Banner | `banner` | 横幅广告 |
| 原生 | `native` | 原生广告 |
| 社媒 | `social` | 社交媒体（通用） |
| 邮件 | `email` | 邮件营销 |
| 引荐 | `referral` | 引荐链接 |
| 自然搜索 | `organic` | 自然搜索（非付费） |
| 直接访问 | `direct` | 直接访问 |
| Affiliate | `affiliate` | 联盟营销 |

### 3. utm_campaign（营销活动）

标识具体活动名称。使用 kebab-case（短横线分隔）。

| 活动类型 | 命名示例 |
|----------|----------|
| 新用户注册 | `new-user-signup-2026q1` |
| 订阅促销 | `spring-subscription-sale` |
| 内容推广 | `wiki-article-promo` |
| 产品发布 | `feature-launch-v2` |
| 节日营销 | `chinese-new-year-2026` |
| 召回活动 | `user-reactivation-campaign` |
| A/B 测试 | `pricing-test-variant-a` |

### 4. utm_term（关键词）

用于识别付费搜索关键词（可选）。

- 用于 Google Ads、Bing Ads 等付费搜索广告
- 使用实际关键词（编码后）
- 示例：`utm_term=astrology+reading`

### 5. utm_content（广告内容）

用于区分同一广告的不同版本（可选）。

| 场景 | 值示例 |
|------|--------|
| CTA 按钮颜色 | `cta_button_blue` |
| 标题版本 | `headline_variant_a` |
| 图片版本 | `hero_image_v2` |
| 落地页版本 | `landing_page_alpha` |

## 命名规则

### 通用规则

1. **全部小写**：所有值使用小写字母
2. **短横线分隔**：使用 `-` 而非空格或下划线
3. **避免特殊字符**：不使用 `&`, `=`, `?`, `#` 等 URL 特殊字符
4. **日期格式**：活动名称包含日期时使用 `YYYYMMDD` 或 `YYYYqQ` 格式

### 命名示例

| 场景 | 完整 URL |
|------|----------|
| Facebook 推广 | `https://astrologywiki.com?utm_source=facebook&utm_medium=social&utm_campaign=new-user-signup-2026q1` |
| Google Ads | `https.ai?utm_source=google&utm_medium=c://astrologywikipc&utm_campaign=astrology-app-promotion&utm_term=free+astrology+reading` |
| 邮件营销 | `https://astrologywiki.com?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-update-2026-01` |
| 小红书笔记 | `https://astrologywiki.com?utm_source=xiaohongshu&utm_medium=social&utm_campaign=wiki-content-promo` |
| A/B 测试 | `https://astrologywiki.com?utm_source=twitter&utm_medium=cpc&utm_campaign=pricing-test-variant-b&utm_content=cta_green` |

## 最佳实践

### 1. 使用工具生成

手动构造 UTM 参数容易出错，建议使用 UTM 构建工具：

```bash
# 示例：使用在线工具或内部脚本生成
# 推荐工具：
# - UTM.io (在线工具)
# - GA4 Campaign URL Builder (Google 官方)
# - 自定义内部脚本
```

### 2. 一致性

- 团队统一使用本文档规范
- 在文档中记录所有活动 UTM 参数
- 避免相同活动使用不同参数

### 3. 长度限制

- GA4 对 UTM 参数总长度有限制（通常 2000 字符）
- 保持参数简洁，避免过长

### 4. 测试

发布前使用 GA4 DebugView 验证参数是否正确传递。

## 追踪表格模板

在项目文档中维护活动追踪表：

| 活动名称 | utm_source | utm_medium | utm_campaign | 开始日期 | 结束日期 | 负责人 | 状态 |
|----------|------------|------------|--------------|----------|----------|--------|------|
| Q1 注册促活 | facebook | social | new-user-signup-2026q1 | 2026-01-01 | 2026-03-31 | marketing | 活跃 |
| 春季订阅促销 | google | cpc | spring-subscription-sale | 2026-03-01 | 2026-03-31 | ads | 计划中 |

## 验证与排查

### GA4 中查看

1. **探索报告** > **用户获取** > **用户获取矩阵**
2. 按 `session source` / `session medium` 分组
3. 查看 `session campaign` 维度的详细数据

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 数据为空 | UTM 参数未添加 | 检查链接是否包含参数 |
| 数据异常 | 参数拼写错误 | 核对本文档规范 |
| 维度缺失 | utm_medium 错误 | 检查 medium 值是否在规范中 |
| 归因错误 | 多渠道混淆 | 统一使用相同 campaign 名称 |

## 相关文档

- [GA4 配置指南](./ANALYTICS_SETUP.md)
- [事件追踪计划](./EVENT_TRACKING_PLAN.md)
- [GA4 官方文档](https://support.google.com/analytics/answer/10089681)
