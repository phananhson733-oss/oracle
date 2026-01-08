<!-- INPUT: 星盘配置系统的能力需求，区分盘类型、数据来源与视觉分层。 -->
<!-- OUTPUT: 星盘配置能力规范。 -->
<!-- POS: 能力增量规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements

### Requirement: Chart type specific configuration
系统 SHALL 为每种星盘类型（本命盘、组合盘、对比盘、行运盘）提供独立的配置，包括天体显示、相位类型、容许度（orb）与视觉样式；各盘配置相互隔离，修改一种盘的配置不影响其他盘。

#### Scenario: Independent configuration per chart type
- **GIVEN** 用户正在查看本命盘
- **WHEN** 系统渲染星盘
- **THEN** 应用 NATAL_CONFIG 配置，不受对比盘或行运盘配置影响

#### Scenario: Configuration isolation
- **GIVEN** 系统配置了本命盘显示凯龙
- **WHEN** 用户切换到行运盘
- **THEN** 行运盘根据 TRANSIT_CONFIG 决定是否显示凯龙，不继承本命盘配置

### Requirement: Celestial body display control
系统 SHALL 支持按配置控制天体显示：默认显示 10 大行星（☉☽☿♀♂♃♄♅♆♇）与四轴（AC/DC/MC/IC）；月交点、凯龙、莉莉丝、小行星等默认隐藏。

#### Scenario: Default planet display
- **GIVEN** 用户查看本命盘（默认配置）
- **WHEN** 星盘渲染完成
- **THEN** 显示 10 大行星与 AC/DC/MC/IC，不显示凯龙、月交点、莉莉丝

#### Scenario: Hidden bodies not rendered
- **GIVEN** 配置中 chiron: false
- **WHEN** 星盘渲染
- **THEN** 凯龙（⚷）不在盘面显示

### Requirement: Aspect type and orb configuration
系统 SHALL 支持按盘类型配置启用的相位类型与容许度（orb）；默认启用五大主相位（合 0°/冲 180°/刑 90°/拱 120°/六合 60°），关闭次要相位（梅花 150°/半刑 45°/倍半刑 135°）。

#### Scenario: Major aspects enabled by default
- **GIVEN** 用户查看本命盘（默认配置）
- **WHEN** 相位计算完成
- **THEN** 仅显示合、冲、刑、拱、六合相位

#### Scenario: Minor aspects disabled by default
- **GIVEN** 默认配置中 quincunx.enabled: false
- **WHEN** 存在梅花相位（150°）
- **THEN** 该相位不在盘面绘制

#### Scenario: Custom orb per aspect type
- **GIVEN** 配置中 conjunction.orb: 8, sextile.orb: 4
- **WHEN** 计算太阳合月亮（orb 7°）与太阳六合火星（orb 5°）
- **THEN** 合相显示（7° < 8°），六合不显示（5° > 4°）

### Requirement: Visual layer rendering
系统 SHALL 实现相位线分层渲染：前景层（紧密相位 orb ≤ 2°）使用较粗线条与高透明度；中景层（2° < orb ≤ 4°）使用中等粗细；背景层（orb > 4°）使用细线与低透明度。

#### Scenario: Tight aspect highlighted
- **GIVEN** 太阳冲月亮 orb 1.5°
- **WHEN** 相位线渲染
- **THEN** 该相位线使用前景样式（strokeWidth ≥ 1.0, opacity ≥ 0.8）

#### Scenario: Loose aspect in background
- **GIVEN** 金星拱木星 orb 5°
- **WHEN** 相位线渲染
- **THEN** 该相位线使用背景样式（strokeWidth ≤ 0.6, opacity ≤ 0.4）

#### Scenario: Layer rendering order
- **GIVEN** 星盘包含前景、中景、背景相位
- **WHEN** 星盘渲染
- **THEN** 背景相位先绘制，前景相位最后绘制（前景在视觉最上层）

### Requirement: Data source distinction
系统 SHALL 明确区分各盘类型的数据来源：
- 本命盘：个人出生数据
- 组合盘：两人中点数据（单盘形式）
- 对比盘：内盘为 Person A 本命，外盘为 Person B 本命
- 行运盘：内盘为个人本命，外盘为当前行运

#### Scenario: Transit chart data sources
- **GIVEN** 用户查看行运盘
- **WHEN** 系统加载数据
- **THEN** 内圈使用用户本命数据，外圈使用当前日期的行星位置

#### Scenario: Synastry chart data sources
- **GIVEN** 用户查看对比盘（Person A vs Person B）
- **WHEN** 系统加载数据
- **THEN** 内圈使用 Person A 本命数据，外圈使用 Person B 本命数据

#### Scenario: Composite chart data source
- **GIVEN** 用户查看组合盘（Person A + Person B）
- **WHEN** 系统计算盘面数据
- **THEN** 各行星位置为两人对应行星经度的中点

### Requirement: Dual-ring chart configuration
系统 SHALL 为多人盘（对比盘/行运盘）提供内盘与外盘的独立配置，包括各自的天体显示与相位计算规则。

#### Scenario: Inner and outer ring configuration
- **GIVEN** 行运盘配置中 inner.angles: true, outer.angles: false
- **WHEN** 行运盘渲染
- **THEN** 内盘显示四轴，外盘不显示四轴

#### Scenario: Cross-chart aspects
- **GIVEN** 对比盘配置中 crossAspects.conjunction.orb: 6
- **WHEN** Person A 太阳与 Person B 月亮相距 5°
- **THEN** 绘制跨盘合相线

### Requirement: Psychological astrology display priority
系统 SHALL 默认突出显示心理占星核心元素：☉（太阳）、☽（月亮）、ASC（上升点）及其紧张相位（冲/刑/合）；外行星（♅♆♇）之间的相位默认弱化处理。

#### Scenario: Luminaries prioritized
- **GIVEN** 盘面包含太阳冲月亮（orb 3°）与天王星冲海王星（orb 2°）
- **WHEN** 星盘渲染
- **THEN** 太阳冲月亮的相位线比天王星冲海王星更突出（即使 orb 更大）

#### Scenario: Outer planet aspects subdued
- **GIVEN** 天王星刑冥王星（orb 1°）
- **WHEN** 星盘渲染
- **THEN** 该相位线使用弱化样式（除非配置明确要求突出外行星相位）
