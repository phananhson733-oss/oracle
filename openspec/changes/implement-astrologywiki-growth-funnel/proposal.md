# Change: 实施 AstrologyWiki 内容到工具的增长漏斗

## Why

AstrologyWiki 已有 GA4、Wiki 内容、出生星盘工具和模块化首页，但当前增长实验仍存在三类断点：

1. 首次访问者在授权 Analytics 后不会补发当前页 `page_view`，导致实验分母缺失；语言前缀路由也被错误归类为 `other`。
2. Wiki 文章缺少持续、统一且可归因的工具入口；现有底部 CTA 目标和事件口径与实验要求不一致。
3. 首页仍使用品牌 tagline 作为 H1，完整 Title 过长，可见 FAQ 与 FAQPage Schema 不同源，首字节可抓取正文不足。

2026-07-13 用户已明确批准按需求清单及评审修订意见全量执行。本变更把批准范围固化为可测试、可回滚的实施合同。

## What Changes

- 修复 GA4 首次授权后的当前页补发、语言路由分类和重复计数保护。
- 为 Wiki 精选文章实施三类 P0 CTA：全站 Nav CTA、文章滚动 Sticky CTA、文章正文前 CTA 卡。
- 将现有文章底部 CTA 纳入统一直达工具目标与 `tool_click` 事件口径。
- 使用文章显式 `celebrityName` 元数据驱动个性化文案，slug 解析仅作兜底。
- 修复工具型内容内链，并为出生星盘工具补充初始化与提交链路验收。
- 缩短首页 Title，改写含 `astrology` 与 `birth chart` 的 H1，补 Organization contactPoint。
- 新增可见 FAQ，并让 UI 与 FAQPage JSON-LD 共用同一份数据。
- 扩充根页面首字节 SEO 正文，同时保留 PageSpeed 变更已有的交互模块延迟加载。
- 保留编辑作者人设的真实性披露；文章 author 继续由 AstrologyWiki Editorial Team Organization 承担。

## Out of Scope

- 不伪造作者学历、社媒、雇佣关系或真实个人身份。
- 不在本期实施 CTA D–K；待 A/B/C 获得完整实验周期数据后再单独评估。
- 不为了移动端 CTA 重构为汉堡菜单；复用当前导航与移动端信息架构。
- 不修改出生星盘算法或后端星历计算。

## Impact

- Affected specs:
  - `measure-wiki-conversion`
  - `convert-wiki-readers`
  - `optimize-homepage-discovery`
- Affected code:
  - `services/analytics.ts`
  - `components/ConsentBanner.tsx`
  - `App.tsx`
  - `components/wiki/*`
  - `data/articles/*`
  - `pages/landing/*`
  - `index.html`
  - `constants.ts`
  - related unit/E2E tests
- Related active changes:
  - `add-ga4-gsc-tracking`：复用现有 GA4/Consent 架构，不再重复注入脚本。
  - `implement-marketing-optimization`：把宽泛营销目标收敛为本次可验收漏斗。
  - `optimize-pagespeed-core-web-vitals`：保留交互模块按视口延迟加载，仅把可抓取静态正文前置。
