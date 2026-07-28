<!-- INPUT: 偏好设置入口与导航规则调整需求。 -->
<!-- OUTPUT: OpenSpec 偏好设置增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Settings access
系统 SHALL 在桌面端顶部导航提供设置入口，并保持导航标签间距一致，同时在设置页显示语言与主题切换控件。

#### Scenario: Settings entry appears in top nav
- **WHEN** 用户处于已登录状态的桌面界面
- **THEN** 顶部导航含设置入口且各标签间距一致，点击后进入设置页并可见切换控件
