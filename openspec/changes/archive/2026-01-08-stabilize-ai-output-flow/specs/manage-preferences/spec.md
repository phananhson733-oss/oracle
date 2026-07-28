<!-- INPUT: 语言偏好影响 AI 输出的变更。 -->
<!-- OUTPUT: OpenSpec 偏好设置增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Language toggle
系统 SHALL 支持 zh 与 en 界面文案，并将选择保存到 localStorage 的 `astro_lang`，同时影响后续 AI 内容请求的语言。

#### Scenario: Language toggle updates UI
- **WHEN** 用户切换语言
- **THEN** UI 文案切换为对应语言且设置在刷新后保持，并用于后续 AI 请求
