<!-- INPUT: 架构决策与约束说明（含城市校验、搜索、保留与数据源）。 -->
<!-- OUTPUT: OpenSpec 设计文档。 -->
<!-- POS: 设计说明；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## Context
当前 UI 依赖本地 mock 数据与离线 AI 生成，后端仅有骨架实现。
本次变更需要落地真实星历、后端 AI 生成、Prompt 覆盖与缓存策略，
并补齐周期与 CBT 的后端能力；应用主要面向欧美用户。

## Goals / Non-Goals
- Goals:
  - 前端完全改为后端数据与 AI 输出，不再依赖本地 mock。
  - 星历计算基于 Swiss Ephemeris，Placidus 宫位系统，返回完整点位。
  - DeepSeek 统一生成双语内容，Oracle 使用 reasoning。
  - Prompt 覆盖全部页面/场景并支持版本化。
  - 缓存 AI 输出与星历数据以控制成本。
  - 补齐周期与 CBT 后端能力（含记录存储）。
  - CBT 记录保留 3 个月并可被前端检索，过期记录删除。
  - 出生城市输入提供 3-5 个模糊匹配候选（含城市/国家）。
- Non-Goals:
  - 商业化与支付系统。
  - 账号体系与权限控制。
  - 复杂的运营后台或 A/B 测试。

## Decisions
- AI Provider:
  - 默认使用 `deepseek-chat`。
  - Oracle/Ask 使用 `deepseek-reasoner`（reasoning）。
- Ephemeris:
  - Swiss Ephemeris 作为星历计算核心。
  - 宫位系统使用 Placidus。
  - 返回点位集覆盖 UI 现有范围（行星、交点、角度、小行星等）。
- Prompt Management:
  - Prompt 放在后端代码中，集中于 `backend/src/prompts/` 下的单一目录，
    以 catalog 文件管理所有 promptId 与版本。
- Location Normalization:
  - 后端校验出生城市可解析为经纬度/时区。
  - 缺失或解析失败时默认上海（Asia/Shanghai，UTC+08）。
- City Suggestions:
  - 使用 Open-Meteo Geocoding API（免费）提供城市搜索结果。
  - 前端提供 3-5 个模糊匹配候选（城市+国家），优先服务欧美用户输入习惯。
  - 后端缓存城市搜索结果以降低第三方调用频率。
- CBT Retention:
  - 记录保留 3 个月并删除过期记录。
- Caching:
  - 使用 Redis（不可用则内存 fallback）。
  - 缓存 key 包含 promptId + 版本 + 输入 hash。

## Data Flow (High Level)
1. 前端提交用户资料/日期/问题到后端 API。
2. 后端使用 Swiss Ephemeris 计算真实星盘/行运/周期。
3. 后端按场景选择 Prompt 与模型，调用 DeepSeek 生成双语内容。
4. 后端将 AI 与 Real Data 结果写入缓存并返回给前端。

## API Coverage (Planned)
- Natal: chart, overview, core themes, dimension report, technical breakdown.
- Daily: public forecast, detail forecast.
- Cycle: list, card naming.
- Synastry: overview, dynamic/perspective sections.
- Oracle: ask answer (reasoning).
- CBT: analysis, record create/list.

## Risks / Trade-offs
- DeepSeek reasoning 成本更高：限制在 Oracle 场景。
- Swiss Ephemeris 依赖本地库与许可校验，需要部署环境支持。
- Prompt 全量覆盖会带来维护成本，需版本化避免破坏性变更。

## Migration Plan
1. 先补齐后端 AI + Swiss Ephemeris 能力与缓存。
2. 接入新 API 并在前端替换 mock 调用。
3. 验证每个页面数据来自后端并返回双语内容。
4. 删除或停用前端本地 mock 内容。

## Open Questions
- None.
