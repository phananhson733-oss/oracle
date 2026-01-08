<!-- INPUT: OpenSpec 工作流与规范约定。 -->
<!-- OUTPUT: OpenSpec 助手指引文档。 -->
<!-- POS: OpenSpec 流程权威说明；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# OpenSpec 指令

用于 OpenSpec 规范驱动开发的 AI 助手说明。

## TL;DR 快速检查清单

- 搜索已有工作：`openspec spec list --long`、`openspec list`（全文搜索用 `rg`）
- 判断范围：新增能力 vs 修改已有能力
- 选唯一 `change-id`：kebab-case，动词开头（`add-`/`update-`/`remove-`/`refactor-`）
- 脚手架：`proposal.md`、`tasks.md`、（需要时）`design.md`、以及受影响能力的增量规范
- 写增量：使用 `## ADDED|MODIFIED|REMOVED|RENAMED Requirements`；每条需求至少一个 `#### Scenario:`
- 校验：`openspec validate [change-id] --strict`
- 请求审批：未审批前不可开始实现

## 三阶段工作流

### 阶段 1：创建变更
满足以下情况需创建提案：
- 新增功能/能力
- 破坏性变更（API、schema）
- 架构或模式调整
- 性能优化（改变行为）
- 安全模式更新

触发示例：
- “帮我创建变更提案”
- “帮我计划一个变更”
- “我想创建一个规范提案”

宽松匹配：
- 包含 `proposal`/`change`/`spec`
- 搭配 `create`/`plan`/`make`/`start`/`help`

以下情况可跳过提案：
- 修复 bug（恢复既有行为）
- 文字/格式/注释修正
- 非破坏性依赖更新
- 配置变更
- 为既有行为补测试

**流程**
1. 阅读 `openspec/project.md`、`openspec list`、`openspec list --specs` 了解上下文。
2. 选择动词开头且唯一的 `change-id`，在 `openspec/changes/<id>/` 创建 `proposal.md`、`tasks.md`、（需要时）`design.md` 与能力增量。
3. 在增量规范中使用 `## ADDED|MODIFIED|REMOVED Requirements`，每条需求至少一个 `#### Scenario:`。
4. 运行 `openspec validate <id> --strict` 并修复问题后再提交提案。

### 阶段 2：实现变更
按以下步骤作为 TODO 逐项完成：
1. **阅读 proposal.md** - 明确要做什么
2. **阅读 design.md**（如存在）- 了解技术决策
3. **阅读 tasks.md** - 获取实现清单
4. **按顺序实现任务**
5. **确认完成** - 确保 tasks.md 全部完成
6. **更新清单** - 全部改为 `- [x]`
7. **审批门槛** - 未审批不得开始实现

### 阶段 3：归档变更
上线后另起 PR 完成：
- `changes/[name]/` → `changes/archive/YYYY-MM-DD-[name]/`
- 如能力有变化，更新 `specs/`
- 仅工具变更可使用 `openspec archive <change-id> --skip-specs --yes`
- 运行 `openspec validate --strict` 确认无误

## 每次任务前

**上下文检查清单：**
- [ ] 阅读相关 `specs/[capability]/spec.md`
- [ ] 检查 `changes/` 是否有冲突
- [ ] 阅读 `openspec/project.md`
- [ ] 运行 `openspec list` 查看进行中的变更
- [ ] 运行 `openspec list --specs` 查看已有能力

**创建规范前：**
- 先确认能力是否已存在
- 优先修改现有规范，避免重复
- 使用 `openspec show [spec]` 查看现状
- 如果需求模糊，先问 1–2 个澄清问题

### 搜索指引
- 列出规范：`openspec spec list --long`（或 `--json`）
- 列出变更：`openspec list`（或 `openspec change list --json`）
- 查看详情：
  - 规范：`openspec show <spec-id> --type spec`
  - 变更：`openspec show <change-id> --json --deltas-only`
- 全文搜索：`rg -n "Requirement:|Scenario:" openspec/specs`

## 快速开始

### CLI 命令

```bash
# 必备命令
openspec list                  # 列出进行中变更
openspec list --specs          # 列出现有规范
openspec show [item]           # 展示变更或规范
openspec validate [item]       # 校验变更或规范
openspec archive <change-id> [--yes|-y]   # 归档变更（可加 --yes）

# 项目管理
openspec init [path]           # 初始化 OpenSpec
openspec update [path]         # 更新指引文件

# 交互模式
openspec show                  # 交互选择
openspec validate              # 批量校验

# 调试
openspec show [change] --json --deltas-only
openspec validate [change] --strict
```

### 命令参数

- `--json` - 机器可读输出
- `--type change|spec` - 指定类型
- `--strict` - 严格校验
- `--no-interactive` - 关闭交互
- `--skip-specs` - 归档时不更新规范
- `--yes`/`-y` - 跳过确认

## 目录结构

```
openspec/
├── project.md              # 项目约定
├── specs/                  # 已实现能力（事实）
│   └── [capability]/       # 单一能力目录
│       ├── spec.md         # 需求与场景
│       └── design.md       # 技术模式
├── changes/                # 变更提案（计划）
│   ├── [change-name]/
│   │   ├── proposal.md     # 为什么与做什么
│   │   ├── tasks.md        # 实施清单
│   │   ├── design.md       # 技术决策（可选）
│   │   └── specs/          # 增量规范
│   │       └── [capability]/
│   │           └── spec.md # ADDED/MODIFIED/REMOVED
│   └── archive/            # 已归档变更
```

## 创建变更提案

### 决策树

```
新请求？
├─ 修复 bug 恢复既有行为？ → 直接修复
├─ 拼写/格式/注释？ → 直接修复
├─ 新功能/能力？ → 创建提案
├─ 破坏性变更？ → 创建提案
├─ 架构变更？ → 创建提案
└─ 不明确？ → 创建提案（更安全）
```

### 提案结构

1. **创建目录：** `changes/[change-id]/`（kebab-case，动词开头，唯一）

2. **编写 proposal.md：**
```markdown
# Change: [简要描述]

## Why
[1-2 句问题/机会说明]

## What Changes
- [变更列表]
- [破坏性变更标注 **BREAKING**]

## Impact
- Affected specs: [能力列表]
- Affected code: [关键文件/系统]
```

3. **创建增量规范：** `specs/[capability]/spec.md`
```markdown
## ADDED Requirements
### Requirement: New Feature
The system SHALL provide...

#### Scenario: Success case
- **WHEN** user performs action
- **THEN** expected result

## MODIFIED Requirements
### Requirement: Existing Feature
[完整替换后的需求]

## REMOVED Requirements
### Requirement: Old Feature
**Reason**: [Why removing]
**Migration**: [How to handle]
```
若影响多个能力，则在 `changes/[id]/specs/<capability>/spec.md` 下为每个能力创建增量文件。

4. **创建 tasks.md：**
```markdown
## 1. Implementation
- [ ] 1.1 Create database schema
- [ ] 1.2 Implement API endpoint
- [ ] 1.3 Add frontend component
- [ ] 1.4 Write tests
```

5. **需要时创建 design.md：**
以下情况创建 `design.md`，否则省略：
- 跨模块或新架构模式
- 新外部依赖或重要数据模型变更
- 安全/性能/迁移复杂度
- 需要先决策再写规范

最小 `design.md` 模板：
```markdown
## Context
[背景、约束、相关方]

## Goals / Non-Goals
- Goals: [...]
- Non-Goals: [...]

## Decisions
- Decision: [做什么及原因]
- Alternatives considered: [备选与取舍]

## Risks / Trade-offs
- [风险] → 缓解

## Migration Plan
[步骤、回滚]

## Open Questions
- [...]
```

## 规范格式

### 关键：Scenario 格式

**正确**（使用 `####`）：
```markdown
#### Scenario: User login success
- **WHEN** valid credentials provided
- **THEN** return JWT token
```

**错误**（不要用列表或粗体）：
```markdown
- **Scenario: User login**  ❌
**Scenario**: User login     ❌
### Scenario: User login      ❌
```

每条需求必须至少包含一个 Scenario。

### Requirement 用语
- 规范性要求使用 SHALL/MUST（避免 should/may）

### 增量类型

- `## ADDED Requirements` - 新能力
- `## MODIFIED Requirements` - 行为变更
- `## REMOVED Requirements` - 移除功能
- `## RENAMED Requirements` - 名称变更

#### 何时用 ADDED vs MODIFIED
- ADDED：新增独立能力/子能力。若为正交能力，优先 ADDED。
- MODIFIED：改变现有需求行为或验收标准。务必粘贴完整需求块（标题 + 场景）。
- RENAMED：仅更名。若同时改行为，需 RENAMED + MODIFIED。

常见误区：用 MODIFIED 仅新增内容而不包含旧文本，会导致归档时丢失旧细节。

正确修改流程：
1) 在 `openspec/specs/<capability>/spec.md` 定位需求。
2) 复制完整需求块（从 `### Requirement:` 到最后一个 Scenario）。
3) 粘贴到 `## MODIFIED Requirements` 并修改。
4) 确保标题一致，且至少一个 `#### Scenario:`。

RENAMED 示例：
```markdown
## RENAMED Requirements
- FROM: `### Requirement: Login`
- TO: `### Requirement: User Authentication`
```

## 故障排查

### 常见错误

**“Change must have at least one delta”**
- 确保 `changes/[name]/specs/` 有 .md 文件
- 确保包含 `## ADDED Requirements` 等前缀

**“Requirement must have at least one scenario”**
- 检查是否使用 `#### Scenario:` 格式
- 不要用列表或粗体作标题

**静默解析失败**
- 必须严格使用 `#### Scenario: Name`
- 可用 `openspec show [change] --json --deltas-only` 调试

### 校验建议

```bash
# 严格校验
openspec validate [change] --strict

# 调试增量解析
openspec show [change] --json | jq '.deltas'

# 查看具体规范
openspec show [spec] --json -r 1
```

## Happy Path 脚本

```bash
# 1) 浏览现状
openspec spec list --long
openspec list
# 可选全文搜索：
# rg -n "Requirement:|Scenario:" openspec/specs
# rg -n "^#|Requirement:" openspec/changes

# 2) 选 change-id 并脚手架
CHANGE=add-two-factor-auth
mkdir -p openspec/changes/$CHANGE/{specs/auth}
printf "## Why\n...\n\n## What Changes\n- ...\n\n## Impact\n- ...\n" > openspec/changes/$CHANGE/proposal.md
printf "## 1. Implementation\n- [ ] 1.1 ...\n" > openspec/changes/$CHANGE/tasks.md

# 3) 增量示例
cat > openspec/changes/$CHANGE/specs/auth/spec.md << 'EOF'
## ADDED Requirements
### Requirement: Two-Factor Authentication
Users MUST provide a second factor during login.

#### Scenario: OTP required
- **WHEN** valid credentials are provided
- **THEN** an OTP challenge is required
EOF

# 4) 校验
openspec validate $CHANGE --strict
```

## 多能力示例

```
openspec/changes/add-2fa-notify/
├── proposal.md
├── tasks.md
└── specs/
    ├── auth/
    │   └── spec.md   # ADDED: Two-Factor Authentication
    └── notifications/
        └── spec.md   # ADDED: OTP email notification
```

auth/spec.md
```markdown
## ADDED Requirements
### Requirement: Two-Factor Authentication
...
```

notifications/spec.md
```markdown
## ADDED Requirements
### Requirement: OTP Email Notification
...
```

## 最佳实践

### 简单优先
- 默认新增 <100 行代码
- 能单文件就不拆
- 无充分理由不引入新框架
- 使用稳定、成熟的模式

### 复杂度触发条件
仅在以下情况引入复杂度：
- 有性能数据证明当前方案不足
- 规模需求明确（>1000 用户、>100MB 数据）
- 已验证的多场景需要抽象

### 清晰引用
- 使用 `file.ts:42` 格式引用代码
- 规范引用为 `specs/auth/spec.md`
- 关联相关变更与 PR

### 能力命名
- 动词-名词：`user-auth`、`payment-capture`
- 单一目的
- 10 分钟可理解
- 如果描述含“AND”，考虑拆分

### Change ID 命名
- kebab-case，简短清晰：`add-two-factor-auth`
- 动词开头：`add-`、`update-`、`remove-`、`refactor-`
- 避免重复，必要时加 `-2`、`-3`

## 工具选择指南

| 任务 | 工具 | 原因 |
|------|------|------|
| 按模式找文件 | Glob | 快速匹配 |
| 搜索代码 | Grep | 正则高效 |
| 读取文件 | Read | 直接访问 |
| 不确定范围 | Task | 多步探索 |

## 错误恢复

### 变更冲突
1. `openspec list` 查看进行中变更
2. 检查是否冲突能力
3. 与变更负责人协调
4. 考虑合并提案

### 校验失败
1. 使用 `--strict`
2. 查看 JSON 输出
3. 校验格式
4. 确认 Scenario 格式

### 缺少上下文
1. 阅读 project.md
2. 查相关 spec
3. 查看归档
4. 提问澄清

## 快速参考

### 阶段标识
- `changes/` - 提案阶段
- `specs/` - 已实现规范
- `archive/` - 已完成归档

### 文件用途
- `proposal.md` - 为什么与做什么
- `tasks.md` - 实施步骤
- `design.md` - 技术决策
- `spec.md` - 行为与需求

### CLI 要点
```bash
openspec list              # 进行中变更
openspec show [item]       # 查看详情
openspec validate --strict # 严格校验
openspec archive <change-id> [--yes|-y]  # 归档
```

记住：规范是事实，变更是提案，保持同步。
