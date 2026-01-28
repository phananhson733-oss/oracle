<!-- INPUT: 项目中的 OpenSpec 助手指引、语言规则（含英文思考/中文输出）与 UI 规范入口。 -->
<!-- OUTPUT: 根目录助手说明（含英文思考/中文输出规则与 UI 规范入口）。 -->
<!-- POS: 助手入口文档（含语言规则与 UI 规范入口）；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
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

## 最高规则

- 总是使用 English 思考，总是中文回复。
- 使用英文思考，使用中文输出。
- **环境兼容性**：本项目为微信小程序项目（而非 Web 项目），必须严格遵循小程序开发规范。需考虑 Unicode 字符的移动端显示差异、图片资源（PNG/SVG）的小程序实现路径及组件框架限制。

## UI 规范入口

- 唯一 UI 规范来源：[COLOR_SYSTEM_GUIDE.md](./COLOR_SYSTEM_GUIDE.md)。
- UI 变更必须对照该规范，并在 PR 中填写「UI 规范符合说明」（模板：`PULL_REQUEST_TEMPLATE.md`）。
