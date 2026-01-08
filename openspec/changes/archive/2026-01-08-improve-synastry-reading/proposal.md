<!-- INPUT: 合盘阅读体验与性能优化需求（内容完整性审计、英文独立 Prompt 与前端缓存）。 -->
<!-- OUTPUT: OpenSpec 变更提案文档（含前端本地缓存与英文规则）。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。

# Change: 合盘阅读体验与性能优化（内容完整性、排版与首屏性能）

## Why
- 点击生成到 overview 出现时间偏长，影响首屏体验。
- 合盘内容结构混乱、阅读路径不清晰，影响理解与观感。
- 各 tab 是否完整渲染 prompt 输出缺乏确认，存在内容遗漏与英文不完整风险。
- 欧美用户阅读习惯与版式需求未被充分考虑，需要结构与表达优化。
- 综述内容缺少明确的 Growth Task 与兼容维度雷达解释，影响信息完整性。

## What Changes
- **内容完整性审计**：盘点合盘各 tab 与详情弹窗的 prompt 输出字段，建立“prompt → UI”对照表，补齐缺失字段或渲染入口。
- **综述结构补强**：在 overview 中明确输出 Growth Task（1 条）与 Compatibility Radar（6 维度 + 每项一句解释）。
- **英文输出优化**：同版式下优化英文内容结构与信息层级，保证字段完整且更符合欧美用户阅读顺序。
- **英文 Prompt 独立化**：为合盘英文内容维护独立 prompt 与输出规则，避免依赖翻译生成。
- **排版与阅读节奏优化**：参考 Discovery Me 首屏风格统一层级、间距与卡片结构，优化本命盘/对比盘/组合盘布局。
- **首屏性能优化**：
  - overview 请求不再携带技术附录，overview 出现后后台预取技术附录，与 tab 内容加载逻辑一致；
  - 关系类型建议仍在生成前计算，但不在 overview 再次计算；
  - 缓存本命盘与合盘计算结果（前端本地持久，默认不设过期），复用跨 tab 的确定性数据；
  - 压缩 prompt 上下文体积并基于样本校准 max_tokens；
  - 不使用“简版先出、完整版补全”的策略。

## Impact
- Affected specs:
  - `specs/generate-synastry-report/spec.md`
  - `specs/backend-data-services/spec.md`
- Affected code (实施阶段)：
  - `App.tsx`（合盘排版、tab 内容结构、英文布局）
  - `components/*`（合盘卡片、技术附录展示结构）
  - `constants.ts`（文案与标签）
  - `services/apiClient.ts`（API 请求参数与懒加载策略）
  - `backend/src/api/synastry.ts`（技术附录拆分与生成路径调整）
  - `backend/src/services/ai.ts`、`backend/src/prompts/manager.ts`（prompt 调整与 token 配置）
- Dependencies:
  - 与既有合盘变更保持独立；旧合盘相关变更归档由本提案先行处理。
