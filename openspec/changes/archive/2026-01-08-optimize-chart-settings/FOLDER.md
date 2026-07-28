<!-- INPUT: 星盘配置优化变更目录。 -->
<!-- OUTPUT: 变更目录说明。 -->
<!-- POS: 变更目录元信息；若更新目录结构，务必更新本文件。 -->
# optimize-chart-settings

优化星盘配置系统，区分单人盘（本命盘/组合盘）与多人盘（对比盘/行运盘）的独立配置。

## 文件结构
- `proposal.md` - 变更提案
- `design.md` - 设计决策
- `tasks.md` - 实施任务清单
- `specs/` - 增量规范
  - `configure-chart-display/` - 星盘配置能力（新增）
  - `generate-natal-insights/` - 本命盘洞察能力变更
  - `generate-synastry-report/` - 合盘报告能力变更
  - `provide-daily-forecast/` - 日运预报能力变更
