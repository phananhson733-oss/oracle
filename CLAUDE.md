<!-- INPUT: Claude 工具的 OpenSpec 助手指引与 UI 规范入口。 -->
<!-- OUTPUT: Claude 助手入口说明（含 UI 规范入口）。 -->
<!-- POS: Claude 助手入口文档（含 UI 规范入口）；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

## 产品定位（最高优先级）

**AstroMind（星智）是一款面向中国大陆年轻人的中西方结合占星应用。**

所有设计、开发、内容决策都必须以此为最高目标：

1. **目标用户**：中国大陆 18-35 岁年轻人
2. **语言规范**：界面文案、提示语、按钮文字等一律使用简体中文
3. **文化融合**：将西方占星学与中国传统文化元素相结合，使内容更贴近本土用户
4. **内容风格**：现代、年轻化、心理学导向，避免过度玄学化表述
5. **交互体验**：符合国内用户习惯，参考主流国产 App 的交互模式

<!-- OPENSPEC:START -->
# OpenSpec 指令

这些说明用于本项目的 AI 助手。

当请求满足以下情况时，必须打开 `@/openspec/AGENTS.md`：
- 提到规划或提案（例如 proposal、spec、change、plan）
- 引入新能力、破坏性变更、架构调整或重要性能/安全工作
- 请求含糊，需要权威规范再继续

使用 `@/openspec/AGENTS.md` 以了解：
- 如何创建并应用变更提案
- 规范格式与约定
- 项目结构与指南

保持此管理块，以便 `openspec update` 可刷新指令。

<!-- OPENSPEC:END -->

## UI 规范入口

- 唯一 UI 规范来源：[COLOR_SYSTEM_GUIDE.md](./COLOR_SYSTEM_GUIDE.md)。
- UI 变更必须对照该规范，并在 PR 中填写「UI 规范符合说明」（模板：`PULL_REQUEST_TEMPLATE.md`）。
