## ADDED Requirements
### Requirement: Visual equal house grid with Placidus data
系统 SHALL 将星盘的宫位分割线与宫位数字以等分 12 宫（每 30°）渲染，并以 Ascendant 为起点对齐；但宫位归属、行星位置、相位计算与宫头度数仍基于 Placidus + 回归黄道的真实数据，不改变计算结果。

#### Scenario: Equal visual grid, Placidus computation preserved
- **GIVEN** 系统使用 Placidus + 回归黄道计算星盘数据
- **WHEN** 星盘渲染宫位分割线与宫位数字
- **THEN** 分割线与数字呈现为等分 12 宫，并以 Ascendant 对齐
- **AND** 行星位置、相位计算与宫位归属保持 Placidus 结果

#### Scenario: Cusp labels follow Placidus degrees at equal positions
- **GIVEN** 星盘存在 12 个 Placidus 宫头度数
- **WHEN** 系统渲染宫头度数与星座标注
- **THEN** 标注内容使用 Placidus 宫头度数与星座
- **AND** 标注位置对齐等分宫位线
