<!-- INPUT: 双人合盘档案管理与选人界面需求。 -->
<!-- OUTPUT: OpenSpec 合盘档案管理增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements
### Requirement: Synastry profile storage
系统 SHALL 允许用户创建、编辑与删除合盘档案，并将档案存储在本地（含姓名、出生日期/时间、出生地、当前所在地、时区与经纬度）。

#### Scenario: Profile persists after save
- **WHEN** 用户保存新档案或编辑档案
- **THEN** 档案被持久化并在下次进入合盘入口时可见

### Requirement: Selection list with actions
系统 SHALL 在合盘入口展示档案列表与两列选择槽（A/B），列表项显示姓名与 Big3，并提供选中/编辑/删除按钮；当前用户档案默认选中并标注“我的”。

#### Scenario: Default selection shows my label
- **WHEN** 用户进入合盘入口
- **THEN** 当前用户档案显示“我的”标签且占用左侧选择槽

### Requirement: Fixed action bar and internal scroll
系统 SHALL 在合盘入口使用固定底部行动区（关系类型选择 + 计算羁绊），当档案过多时仅列表区域内部滚动，页面整体不滚动。

#### Scenario: List scrolls independently
- **WHEN** 档案数量超过可视高度
- **THEN** 列表区域可滚动且底部行动区保持可见
