<!-- INPUT: 星盘配置优化的实施步骤与验证清单。 -->
<!-- OUTPUT: OpenSpec 任务清单。 -->
<!-- POS: 变更执行清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## 1. 类型定义与配置常量
- [x] 1.1 定义 ChartConfig、SynastryConfig、TransitConfig 接口（types.ts）。
- [x] 1.2 新增四套默认配置常量：NATAL_CONFIG、COMPOSITE_CONFIG、SYNASTRY_CONFIG、TRANSIT_CONFIG（constants.ts）。
- [x] 1.3 定义相位线视觉分层配置（前景/中景/背景阈值与样式）。

## 2. 前端星盘组件改造
- [x] 2.1 修改 AstroChart.tsx 接收 ChartConfig 参数。
- [x] 2.2 实现天体显示过滤逻辑（根据配置过滤显示的行星/四轴/小天体）。
- [x] 2.3 实现相位过滤逻辑（根据配置过滤启用的相位类型与 orb）。
- [x] 2.4 实现相位线分层渲染（前景/中景/背景不同 strokeWidth 与 opacity）。
- [x] 2.5 实现图层渲染优先级（按 z-index 顺序渲染底图→相位线→行星→四轴）。

## 3. 后端配置同步
- [x] 3.1 后端 sources.ts 的 ASPECT_TYPES orb 值与前端配置对齐。
- [x] 3.2 ephemeris.ts 相位计算支持按配置过滤。
- [x] 3.3 API 返回数据包含原始相位列表，由前端根据配置过滤（可选：后端预过滤）。

## 4. 各页面接入配置
- [x] 4.1 探索自我页面（本命盘）使用 NATAL_CONFIG。
- [x] 4.2 日运页面（行运盘）使用 TRANSIT_CONFIG。
- [x] 4.3 合盘报告页面使用 SYNASTRY_CONFIG（对比盘）与 COMPOSITE_CONFIG（组合盘）。
- [x] 4.4 确保各页面配置隔离，互不影响。

## 5. 验证
- [ ] 5.1 手动冒烟：本命盘显示 10 行星 + 四轴，隐藏小天体。
- [ ] 5.2 手动冒烟：相位线分层渲染，紧密相位（orb≤2°）高亮。
- [ ] 5.3 手动冒烟：对比盘/行运盘内外盘配置独立生效。
- [ ] 5.4 手动冒烟：修改本命盘配置不影响其他盘。
- [x] 5.5 运行 `openspec validate optimize-chart-settings --strict`。
