## 1. Analytics 基线

- [x] 1.1 先写失败测试：语言前缀路由正确分类为 wiki/tool/home。
- [x] 1.2 先写失败测试：首次授权后当前页只补发一次 `page_view`。
- [x] 1.3 实现补发、去重与分类修复。
- [x] 1.4 用生产构建浏览器验证直接访问 + 两次 SPA 跳转。

## 2. CTA P0

- [x] 2.1 先写失败测试：共享 `tool_click` 参数与语言感知目标。
- [x] 2.2 先写失败测试：Nav CTA 在桌面/移动上下文可访问。
- [x] 2.3 先写失败测试：Sticky CTA 在 400px 显示、100px 隐藏并尊重 reduced motion。
- [x] 2.4 先写失败测试：文章顶部 CTA 支持 celebrity/generic 文案与移动端副 CTA 隐藏。
- [x] 2.5 实现 CTA A/B/C 并更新旧底部 CTA。
- [x] 2.6 对照 `COLOR_SYSTEM_GUIDE.md` 检查 token、对比度、符号和动效。

## 3. 前置条件

- [x] 3.1 修正 Mbappé 工具型 CTA 链接。
- [x] 3.2 确认 Hakimi 内容是否存在；不存在则记录为内容输入缺失，不伪造源文件。
- [x] 3.3 审计 CTA 型文案与教程型链接，避免机械全量替换。
- [x] 3.4 为 `/en/birth-chart-calculator` 增加初始化与提交链路 E2E。

## 4. 首页残留项

- [x] 4.1 先写失败测试：最终 Title 不超过 60 字符。
- [x] 4.2 先写失败测试：H1 同时包含 astrology 与 birth chart。
- [x] 4.3 先写失败测试：Organization 包含 contactPoint，FAQ UI/Schema 同源且至少 5 条。
- [x] 4.4 先写失败测试：根页面首字节正文达到目标并包含关键 H2/内链。
- [x] 4.5 实现 Title/H1/contactPoint/FAQ/首字节内容改造。
- [x] 4.6 保留编辑人设披露和 Organization author，并补回归测试防止虚假 Person 化。

## 5. 验证

- [x] 5.1 运行相关单测并确认 RED→GREEN 证据。
- [x] 5.2 运行 TypeScript 检查和全量 Vitest。
- [x] 5.3 运行内部链接检查。
- [x] 5.4 运行生产构建。
- [x] 5.5 用 Playwright 验证桌面/移动 CTA、GA4、首页和工具链路。
- [x] 5.6 检查 `git diff`，确认未覆盖无关工作区改动。
