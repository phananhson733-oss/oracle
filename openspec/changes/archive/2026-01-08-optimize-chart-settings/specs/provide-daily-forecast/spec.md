<!-- INPUT: 行运盘视觉配置优化需求。 -->
<!-- OUTPUT: 日运预报能力增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements

### Requirement: Public daily forecast
系统 SHALL 在日运页面展示行运盘，使用 TRANSIT_CONFIG 配置控制内盘（本命）与外盘（行运）的天体显示与相位设置；行运盘外圈默认不显示四轴。

#### Scenario: Transit chart uses transit config
- **GIVEN** 用户进入日运页面
- **WHEN** 行运盘渲染
- **THEN** 使用 TRANSIT_CONFIG 配置，内盘显示四轴，外盘不显示四轴

#### Scenario: Transit to natal aspect rendering
- **GIVEN** 当前行运土星与本命太阳形成刑相
- **WHEN** 行运盘渲染
- **THEN** 根据 TRANSIT_CONFIG.transitAspects 配置绘制行运→本命相位线

#### Scenario: Transit chart data sources
- **GIVEN** 用户查看行运盘
- **WHEN** 系统加载数据
- **THEN** 内圈为用户本命数据，外圈为当前日期行星位置
