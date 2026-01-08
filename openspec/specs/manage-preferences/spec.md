<!-- INPUT: 偏好设置能力需求与场景。 -->
<!-- OUTPUT: OpenSpec 偏好设置规范。 -->
<!-- POS: 能力规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Capability: Manage Preferences

## Purpose
该能力负责语言与主题偏好设置及持久化，确保界面文案与主题在切换后即时生效并在刷新后保持一致，同时可在设置页随时调整。
## Requirements
### Requirement: Language toggle
系统 SHALL 支持 zh 与 en 界面文案，并将选择保存到 localStorage 的 `astro_lang`，同时影响后续 AI 内容请求的语言。

#### Scenario: Language toggle updates UI
- **WHEN** 用户切换语言
- **THEN** UI 文案切换为对应语言且设置在刷新后保持，并用于后续 AI 请求

### Requirement: Theme toggle
系统 SHALL 支持深色与浅色主题，并将选择保存到 localStorage 的
`astro_theme`。

#### Scenario: Theme toggle updates styling
- **WHEN** 用户切换主题
- **THEN** body class 反映所选主题且设置在刷新后保持

### Requirement: Settings access
系统 SHALL 在桌面端顶部导航提供设置入口，并保持导航标签间距一致，同时在设置页显示语言与主题切换控件。

#### Scenario: Settings entry appears in top nav
- **WHEN** 用户处于已登录状态的桌面界面
- **THEN** 顶部导航含设置入口且各标签间距一致，点击后进入设置页并可见切换控件

