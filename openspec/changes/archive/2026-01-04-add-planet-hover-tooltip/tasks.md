# Tasks: add-planet-hover-tooltip

## Phase 1: 数据层扩展

- [x] **T1.1** 扩展 `constants.ts` 中 `TECH_DATA.PLANETS` 添加 keywords 字段
  - 为每颗行星添加中英文关键词
  - 包含：Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
  - 包含：Chiron, North Node, South Node, Lilith, Ascendant, Midheaven 等
  - **验证**：TypeScript 编译通过，无类型错误 ✓

- [x] **T1.2** 添加悬停面板相关翻译到 `TRANSLATIONS`
  - 添加 `chart.hover_sign`（星座 / Sign）
  - 添加 `chart.hover_house`（宫位 / House）
  - 添加 `chart.hover_aspects`（相位 / Aspects）
  - 添加 `chart.hover_retrograde`（逆行 / Retrograde）
  - 添加 `chart.hover_direct`（顺行 / Direct）
  - 添加 `chart.hover_applying`（入相 / Applying）
  - 添加 `chart.hover_separating`（出相 / Separating）
  - 添加 `chart.hover_outer`（外环 / Outer）
  - 添加 `chart.hover_rules`（守护 / Rules）
  - 添加 `chart.hover_in`（落在 / in）
  - 添加 `chart.hover_in_house`（位于 / in House）
  - 添加 `chart.hover_with`（和 / with）
  - 添加 `chart.hover_at`（成 / at）
  - **验证**：中英文翻译均存在且格式正确 ✓

## Phase 2: 组件实现

- [x] **T2.1** 创建 `PlanetTooltip` 组件
  - 路径：`components/PlanetTooltip.tsx`
  - Props：planet 数据、位置坐标、相位列表、图表类型、主题
  - 使用 React Portal 渲染到 body
  - **验证**：组件可独立渲染，接收正确 props ✓

- [x] **T2.2** 实现面板布局和样式
  - 根据语言设置宽度：中文 280px / 英文 340px
  - 宽度设计确保相位信息最长情况可单行显示（如「with Outer Neptune ♆ at 120° △ [Separating]2°41'」）
  - 分区：行星标识区、星座区、宫位区、相位列表区
  - 相位区使用 `white-space: nowrap` 防止换行
  - 支持 dark/light 主题
  - **验证**：中英文下相位信息均不换行，两种主题视觉正确 ✓

- [x] **T2.3** 实现行星标识区
  - 显示行星 SVG 符号（使用 TECH_DATA.PLANETS[name].glyph）
  - 行星名称（带颜色）
  - [顺行/逆行] 标签
  - 关键词（使用新增的 keywords 字段）
  - **验证**：逆行行星正确显示逆行标签 ✓

- [x] **T2.4** 实现星座和宫位区
  - 「落在」+ 星座名（带颜色）+ 符号 + 度数°分′
  - 「位于」+ 宫位数字 + 「宫」
  - 若行星为某宫宫主星，显示「守护」+ 宫位数字 + 「宫」
  - 宫主星信息从 houseRulers 数据中查找
  - **验证**：度数格式正确（如 2°13′），宫主星正确显示 ✓

- [x] **T2.5** 实现相位列表区
  - 遍历与该行星相关的所有相位
  - 格式：「和」+ 行星名 + 符号 + 「成」+ 角度° + 相位符号 + [入相/出相] + orb
  - 相位符号和角度使用对应颜色
  - **验证**：相位按 orb 排序，颜色正确 ✓

## Phase 3: 交互集成

- [x] **T3.1** 在 `AstroChart.tsx` 中添加悬停状态管理
  - 添加 `hoveredPlanet` state
  - 添加 `tooltipPosition` state
  - **验证**：state 正确初始化 ✓

- [x] **T3.2** 为行星元素添加鼠标事件
  - `onMouseEnter`：设置 hoveredPlanet 和位置
  - `onMouseMove`：更新 tooltip 位置
  - `onMouseLeave`：清除 hoveredPlanet
  - **验证**：事件正确触发 ✓

- [x] **T3.3** 实现位置计算逻辑
  - tooltip 跟随鼠标位置
  - 边界检测：避免超出视口
  - 偏移量：tooltip 不遮挡行星符号
  - **验证**：tooltip 在各边缘位置正确显示 ✓

- [x] **T3.4** 渲染 PlanetTooltip 组件
  - 条件渲染：仅当 hoveredPlanet 存在时渲染
  - 传递正确的 planet 数据和相位列表
  - **验证**：悬停显示/离开消失正常工作 ✓

## Phase 4: 对比盘适配

- [x] **T4.1** 适配 transit 行运盘
  - 外环行星名称添加「外环」前缀
  - 相位中正确标识内外环来源
  - **验证**：行运盘中外环行星正确标注 ✓

- [x] **T4.2** 适配 synastry 合盘
  - 外环行星名称添加「外环」前缀
  - 区分 A/B 双方行星
  - **验证**：合盘中外环行星正确标注 ✓

## Phase 5: 国际化和主题

- [x] **T5.1** 集成 useLanguage hook
  - 所有文案使用翻译
  - 行星关键词根据语言切换
  - **验证**：切换语言后 tooltip 内容正确更新 ✓

- [x] **T5.2** 完善主题适配
  - 明暗主题下背景色、文字色、边框色
  - 阴影效果适配
  - **验证**：切换主题后 tooltip 样式正确 ✓

## Phase 6: 动画和体验

- [x] **T6.1** 添加淡入淡出动画
  - 入场动画：opacity 0→1，duration 200ms
  - 离场动画：opacity 1→0，duration 150ms
  - **验证**：动画平滑无闪烁 ✓

- [x] **T6.2** 优化性能
  - 使用 `useMemo` 缓存相位过滤结果
  - 避免不必要的重渲染
  - **验证**：快速移动鼠标时无卡顿 ✓

## Phase 7: 验收测试

- [x] **T7.1** 本命盘测试
  - 所有行星悬停正常显示
  - 内容完整准确
  - **验证**：`npm run dev` 手动测试 ✓

- [x] **T7.2** 行运盘测试
  - 内外环行星均可悬停
  - 外环正确标注
  - **验证**：`npm run dev` 手动测试 ✓

- [x] **T7.3** 合盘测试
  - 内外环行星均可悬停
  - 外环正确标注
  - **验证**：`npm run dev` 手动测试 ✓

- [x] **T7.4** 国际化测试
  - 中文环境完整测试
  - 英文环境完整测试
  - **验证**：切换语言测试 ✓

- [x] **T7.5** 构建验证
  - `npm run build` 无错误
  - **验证**：构建产物正常 ✓
