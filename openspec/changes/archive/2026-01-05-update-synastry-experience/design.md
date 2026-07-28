<!-- INPUT: 双人合盘选人流程、关系类型 Top5 建议与技术附录扩展设计。 -->
<!-- OUTPUT: 变更设计说明。 -->
<!-- POS: 设计决策记录；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## Context
- 现有合盘入口为单一表单，用户无法复用过往档案，缺少“选人”体验。
- 合盘报告允许 mock 回退，且缺少技术附录，可信度与深度不足。
- 需要与探索自我一致的附录结构与视觉秩序。

## Goals / Non-Goals
- Goals:
  - 提供“档案化选人 + 两列选择槽 + 固定底部行动区”的合盘入口。
  - 关系类型用现有 `RELATIONSHIP_TYPES`，提供 Top5 概率建议并影响 prompt。
  - 合盘报告仅使用 AI 结果，失败则展示错误而非 mock。
  - 在各 tab 增加技术附录，结构与探索自我对齐。
- Non-Goals:
  - 不引入新的关系类型分类体系。
  - 不重做其他页面的导航或布局系统。
  - 移动端仅保证不崩坏，不做专门重构。

## Decisions
- 档案存储
  - 新增本地存储 `astro_synastry_profiles`，每条记录包含：
    - name, birthDate, birthTime, birthCity, timezone, lat, lon, accuracyLevel, currentLocation。
  - 默认将当前用户资料作为只读“我的”档案加入列表，展示“我的”标签。
- 选人界面布局
  - 页面顶部显示“两列选择槽”（A/B），当前用户占左侧一个槽位，不独占整列。
  - 下方为档案列表（内部滚动），每项展示姓名、Big3、操作按钮（选中/编辑/删除）。
  - 底部固定行动区：关系类型选择（上拉列表）+“计算羁绊”按钮。
- 关系类型建议
  - 使用现有 `RELATIONSHIP_TYPES`。
  - 在后端基于 synastry aspects 做轻量评分（例如 Venus/Mars 加权浪漫，Moon/IC 加权家庭，Mercury/Saturn 加权合作），输出 Top 5 作为“概率较高”。
  - 顶部显示 Top 5；展开后可选择全部类型。
- AI 严格模式
  - 对 synastry prompt 启用“禁用 mock 回退”策略：若 AI 不可用，返回错误并让前端展示失败态。
- 技术附录数据
  - 在 synastry 接口增加技术附录数据块或独立 `synastry/technical` 端点。
  - 本命盘/组合盘：复用单人盘技术结构（elements/aspects/planets/asteroids/houseRulers）。
  - 对比盘：输出双人盘相位、行星/小行星与宫主星（可含房屋叠置）。
- 组合盘计算
  - Swiss 暂无组合盘直接输出时，使用两人行星/角点经度中点生成 composite 盘，宫位以中点 Asc/MC 近似；在 UI 中保持与探索自我结构一致。

## Risks / Trade-offs
- 组合盘近似算法可能与权威软件存在差异，需要在说明中标注“基于中点计算”。
- 关系类型“概率建议”为启发式评分，精度有限但路径清晰。
- 禁用 mock 会在 AI 不可用时直接阻断报告，需要更明确的失败提示与重试入口。

## Migration Plan
1. 新增 synastry profile 存储结构与前端选人流程。
2. 后端补齐 synastry 技术附录数据与关系类型建议。
3. 禁用 synastry mock 回退，前端接入错误显示。
4. 前端报告页接入新附录结构与文案。

## Open Questions
- 已确认组合盘采用中点近似方案。暂无悬而未决问题。
