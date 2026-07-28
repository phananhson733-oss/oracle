<!-- INPUT: 双人合盘选人流程、关系类型 Top5 建议与技术附录需求。 -->
<!-- OUTPUT: OpenSpec 合盘报告增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Partner input
系统 SHALL 提供双人合盘选人界面，支持从已保存档案中选择两位成员，并在关系类型选定后才允许发起合盘计算；界面为两列选择槽（A/B），默认选中当前用户并显示“我的”标签，页面整体不滚动且底部行动区固定。

#### Scenario: Synastry selection gating
- **WHEN** 用户未选择两位成员或未选择关系类型
- **THEN** “计算羁绊”按钮保持不可用

#### Scenario: Default me selected
- **WHEN** 用户进入双人合盘入口
- **THEN** 当前用户档案被默认选中且显示“我的”标签

### Requirement: Report generation
系统 SHALL 使用 AI 生成双人合盘报告内容，并将用户选择的 relationship_type 作为 prompt 上下文；当 AI 不可用时不得返回 mock 内容。

#### Scenario: AI required for report
- **WHEN** AI 生成失败或后端返回非 AI 来源
- **THEN** 前端展示失败状态且不渲染报告内容

### Requirement: Tabbed perspectives
系统 SHALL 在总览、本命盘、对比盘与组合盘 tab 下展示对应内容，并在每个 tab 下附加技术附录区块。

#### Scenario: Tab appendix differs by perspective
- **WHEN** 用户切换到不同 tab
- **THEN** 附录随 tab 切换显示对应的技术数据块

## ADDED Requirements
### Requirement: Relationship type suggestions
系统 SHALL 基于合盘事实给出 Top5 关系类型建议（来自 `RELATIONSHIP_TYPES`），在底部选择器中展示并允许展开全量列表；用户选择的关系类型会影响合盘生成。

#### Scenario: Suggestions visible after selection
- **WHEN** 用户选择了两位成员
- **THEN** 底部选择器显示 Top5 关系类型并可切换

### Requirement: Synastry technical appendix
系统 SHALL 在合盘报告中提供技术附录：
- 本命盘/组合盘：元素、相位、行星、小行星、宫主星。
- 对比盘：双人盘、相位、行星、小行星、宫主星。

#### Scenario: Technical appendix is available
- **WHEN** 合盘报告加载完成
- **THEN** 每个 tab 均展示对应的技术附录信息
