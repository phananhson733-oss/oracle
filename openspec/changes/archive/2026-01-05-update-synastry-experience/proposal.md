<!-- INPUT: 双人合盘选人流程、关系类型 Top5 建议与技术附录优化需求。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 优化双人合盘选人体验与技术附录

## Why
- 当前双人合盘入口为单一表单，缺乏档案化选择与编辑，操作成本高。
- 关系类型缺少“概率建议”与固定底部行动区，用户路径不清晰。
- 合盘报告存在 mock 回退与技术附录缺失，影响可信度与可读性。
- 需要与“探索自我”保持一致的 UI 质感与信息结构。

## What Changes
- 引入“选人列表 + 两列选择槽”入口：默认选中当前用户并标注“我的”，列表展示姓名 / Big3 / 操作按钮（选中、编辑、删除）。
- 底部固定“关系类型选择 + 计算羁绊”行动区，页面整体不滚动，列表区域内部滚动。
- 新增档案新增/编辑弹窗：姓名、出生日期/时间、出生地、当前所在地。
- 关系类型使用现有 `RELATIONSHIP_TYPES`，展示概率 Top5 类型并支持展开全量；选择结果影响合盘 prompt。
- 合盘报告强制 AI 生成（不使用 mock）；AI 不可用时显示失败状态。
- 在本命盘 / 对比盘 A/B / 组合盘各 tab 增加技术附录：
  - 本命盘/组合盘：元素/相位/行星/小行星/宫主星信息（结构对齐探索自我）。
  - 对比盘：双人盘/相位/行星/小行星/宫主星信息。

## Impact
- Affected specs:
  - `specs/generate-synastry-report/spec.md`
  - `specs/backend-data-services/spec.md`
  - `specs/manage-synastry-profiles/spec.md` (新增)
- Affected code (实施阶段)：
  - `App.tsx`, `constants.ts`, `types.ts`, `components/*`
  - `services/apiClient.ts`, `services/astroService.ts`
  - `backend/src/api/synastry.ts`, `backend/src/services/ephemeris.ts`, `backend/src/services/ai.ts`, `backend/src/prompts/manager.ts`, `backend/src/types/api.ts`
- Notes:
  - Synastry 技术附录依赖 Swiss Ephemeris 计算；当前能力缺口需在设计中明确补齐路径。
