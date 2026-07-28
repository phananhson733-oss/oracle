<!-- INPUT: 合盘报告视觉配置优化需求（对比盘与组合盘）。 -->
<!-- OUTPUT: 合盘报告能力增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements

### Requirement: Tabbed perspectives
系统 SHALL 在对比盘与组合盘 tab 下使用各自独立的配置：对比盘使用 SYNASTRY_CONFIG（含内盘/外盘独立配置与跨盘相位设置），组合盘使用 COMPOSITE_CONFIG。

#### Scenario: Synastry chart uses synastry config
- **GIVEN** 用户切换到对比盘 tab
- **WHEN** 对比盘渲染
- **THEN** 使用 SYNASTRY_CONFIG 配置，内盘与外盘配置独立

#### Scenario: Composite chart uses composite config
- **GIVEN** 用户切换到组合盘 tab
- **WHEN** 组合盘渲染
- **THEN** 使用 COMPOSITE_CONFIG 配置，不受对比盘配置影响

#### Scenario: Cross-chart aspect rendering
- **GIVEN** 对比盘中 Person A 太阳与 Person B 月亮形成合相
- **WHEN** 对比盘渲染
- **THEN** 根据 SYNASTRY_CONFIG.crossAspects 配置绘制跨盘相位线
