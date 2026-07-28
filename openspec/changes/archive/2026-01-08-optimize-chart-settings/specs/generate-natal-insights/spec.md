<!-- INPUT: 本命盘视觉配置优化需求。 -->
<!-- OUTPUT: 本命盘洞察能力增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements

### Requirement: Natal chart facts and overview
系统 SHALL 展示本命盘星盘可视化，使用 NATAL_CONFIG 配置控制天体显示、相位类型与视觉分层；默认显示 10 大行星与四轴，隐藏小天体，仅绘制五大主相位。

#### Scenario: Natal chart uses dedicated config
- **GIVEN** 用户进入探索自我页面
- **WHEN** 本命盘渲染
- **THEN** 使用 NATAL_CONFIG 配置，不受其他盘配置影响

#### Scenario: Aspect line layering in natal chart
- **GIVEN** 本命盘包含多个相位
- **WHEN** 星盘渲染
- **THEN** 相位线按 orb 精度分层显示（前景/中景/背景）
