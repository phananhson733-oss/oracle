# UTM 追踪表格模板

本文档提供 UTM 活动追踪表格的模板与使用说明。

## 表格结构

| 字段 | 必填 | 说明 |
|------|------|------|
| Campaign Name | 是 | 活动名称，使用 kebab-case |
| utm_source | 是 | 流量来源平台 |
| utm_medium | 是 | 流量渠道类型 |
| utm_campaign | 是 | 活动名称（与 Campaign Name 一致） |
| utm_term | 否 | 搜索关键词（付费搜索用） |
| utm_content | 否 | 广告内容变体 |
| Start Date | 是 | 活动开始日期 |
| End Date | 是 | 活动结束日期 |
| Status | 是 | 状态：Planned/Active/Completed/Paused |
| URL | 是 | 带 UTM 参数的完整 URL |
| Notes | 否 | 备注说明 |
| Owner | 是 | 负责人 |

## 示例数据

| Campaign Name | utm_source | utm_medium | utm_campaign | Start Date | End Date | Status | URL |
|---------------|------------|------------|--------------|------------|----------|--------|-----|
| new-user-signup-2026q1 | facebook | social | new-user-signup-2026q1 | 2026-01-01 | 2026-03-31 | Active | [链接] |
| spring-subscription-sale | google | cpc | spring-subscription-sale | 2026-03-01 | 2026-03-31 | Planned | [链接] |
| weekly-update-2026-01 | newsletter | email | weekly-update-2026-01 | 2026-01-06 | 2026-01-13 | Completed | [链接] |
| wiki-content-promo | wechat | social | wiki-content-promo | 2026-01-15 | 2026-01-22 | Active | [链接] |

## 使用方法

1. **创建新活动时**：在表格中添加新行
2. **生成 URL**：使用 `public/utm-builder.html` 工具生成带 UTM 的链接
3. **更新状态**：活动开始/结束/暂停时及时更新 Status
4. **定期审查**：每周检查活动效果

## CSV 导出

表格也可以 CSV 格式导出，便于在 Google Sheets 或 Excel 中编辑：

```csv
Campaign Name,utm_source,utm_medium,utm_campaign,Start Date,End Date,Status,URL
new-user-signup-2026q1,facebook,social,new-user-signup-2026q1,2026-01-01,2026-03-31,Active,https://astrologywiki.com?utm_source=facebook&utm_medium=social&utm_campaign=new-user-signup-2026q1
```

## 相关文档

- [UTM 参数规范](./UTM_SPEC.md)
- [GA4 转化配置](./GA4_CONVERSIONS.md)
