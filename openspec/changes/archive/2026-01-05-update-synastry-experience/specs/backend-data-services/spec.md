<!-- INPUT: 合盘技术附录数据与 AI 严格模式需求（含 Top5 建议）。 -->
<!-- OUTPUT: OpenSpec 后端数据服务增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Real data computation service
系统 SHALL 使用 Swiss Ephemeris 计算合盘相关技术数据，除单人点位外，需支持：
- 本命盘 A/B 的技术附录数据。
- 组合盘（composite）技术附录数据。
- 对比盘 A→B/B→A 的双人相位与宫位覆盖（house overlays）。

#### Scenario: Synastry technical data returned
- **WHEN** 前端请求合盘技术附录数据
- **THEN** 后端返回包含本命盘、组合盘与对比盘的结构化技术数据

## ADDED Requirements
### Requirement: Synastry AI strict mode
系统 SHALL 在合盘 AI 场景中禁用 mock 回退；当 AI 不可用时返回错误并包含失败原因。

#### Scenario: AI unavailable
- **WHEN** 合盘请求缺少 AI Key 或 AI 调用失败
- **THEN** 后端返回错误响应且不提供 mock 内容

### Requirement: Relationship type suggestion data
系统 SHALL 基于合盘事实生成关系类型 Top5 建议（来自 `RELATIONSHIP_TYPES`），供前端展示。

#### Scenario: Suggestions returned
- **WHEN** 前端请求关系类型建议
- **THEN** 后端返回按概率排序的关系类型列表
