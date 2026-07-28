<!-- INPUT: 探索自我页面的信息层级、技术附录结构与相位/图标/宫主星优化需求。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 优化探索自我界面层级与技术附录结构

## Why
- 探索自我页面信息密度高、卡片化过多，重点不够突出。
- 视觉上蓝紫色占比过高，AI 观感过强，需要低饱和黑金/疗愈柔和风格。
- 星盘图与技术附录结构位置不够直观，阅读路径割裂。
- Big3 需要拆解为更明确的三模块结构。

## What Changes
- 星盘图在“方法论”下方置顶展示，尺寸在现有基础上放大 1.3 倍。
- “核心画像分析”调整层级：Big3 拆成 Sun/Moon/Rising 三模块，其他 4 模块改为 2×2。
- 心理维度模块：`prompt_question` 上移为顶部引导语，标签替换为更易懂表达（`what_helps` 以“缓解方式”呈现），统一排版结构。
- 人生课题与行动（Drive/Fear/Growth）收敛为连贯叙事结构，减少碎片化卡片。
- 专业附录取消 Tab/折叠，改为瀑布式单列顺序：元素矩阵→相位列表→行星信息→小行星信息→宫主星信息。
- 相位列表改为下三角矩阵（10 大行星，格子内显示相位符号 + orb）。
- 行星/小行星信息使用 SVG 图标资源，避免 emoji/glyph。
- 宫主星信息使用现代守护星，并展示“飞入宫位”。
- 全页色彩与排版调整为低饱和黑金/疗愈柔和（桌面优先，移动仅保证不崩）。

## Impact
- Affected specs:
  - `specs/generate-natal-insights/spec.md`
- Affected code (实施阶段)：
  - `App.tsx`, `components/AstroChart.tsx`, `components/TechSpecsComponents.tsx`, `constants.ts`, `types.ts`
  - `services/astroService.ts`
  - `backend/src/prompts/manager.ts`, `backend/src/services/ai.ts`, `backend/src/types/api.ts`
  - （新增）图标资源目录（例如 `assets/icons/`）
- References:
  - `/Users/wzb/Pictures/123.png`
  - `/Users/wzb/Pictures/微信图片_20251226142307_17_120.png`（及同批次 17:00 参考图）
  - Big3 结构参考图（`codex-clipboard-XAFs9B.png`）
