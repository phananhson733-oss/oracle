# Design: 系统性验证与优化所有 AI Prompts

## 架构概览

### 当前架构

```
backend/src/
├── prompts/
│   ├── FOLDER.md
│   └── manager.ts          # 核心 prompt 管理器（40+ prompt）
│                           # - 注册、版本管理、缓存 key 生成
│                           # - natal, daily, ask, synastry, wiki 场景
│
├── data/
│   ├── wiki-prompts.ts                    # Wiki 深度解读 prompt（9 类）
│   ├── wiki-classic-prompts.ts            # 经典拆书标准版
│   ├── wiki-classic-prompts-enhanced.ts   # 经典拆书增强版
│   ├── comprehensive-generate.ts          # 数据生成（可能含 prompt）
│   ├── fast-generate.ts                   # 数据生成（可能含 prompt）
│   ├── generate-enhanced-reports.ts       # 数据生成（可能含 prompt）
│   └── wiki-generated.ts                  # 预生成内容
│
└── api/
    ├── natal.ts, daily.ts, ask.ts         # 调用 prompts/manager.ts
    ├── synastry.ts, wiki.ts, synthetica.ts
    └── detail.ts, cbt.ts, cycle.ts
```

### 问题分析

1. **分散管理**
   - Prompt 分散在 `prompts/` 和 `data/` 两个目录
   - `data/` 目录主要用于数据生成，但包含 prompt 定义
   - 缺乏统一的版本管理策略

2. **版本管理不一致**
   - `manager.ts` 使用 `PromptMeta` 结构，有明确的版本号
   - `wiki-prompts.ts` 等文件没有版本号管理
   - 难以追踪 prompt 变更历史

3. **重复定义风险**
   - 部分 prompt 逻辑可能在多处重复
   - 缺乏统一的 prompt 构建模式

## 设计决策

### 决策 1：是否规整 Prompt 文件结构？

#### 选项 A：完全规整（推荐）
**描述**: 将所有 prompt 迁移到 `backend/src/prompts/` 目录下，按功能分类

```
backend/src/prompts/
├── FOLDER.md
├── manager.ts              # 核心 prompt 注册和管理
├── natal.ts                # 本命盘相关 prompt
├── daily.ts                # 日运相关 prompt
├── ask.ts                  # Ask 和 CBT 相关 prompt
├── synastry.ts             # 合盘相关 prompt
├── detail.ts               # 详情解读相关 prompt
├── wiki/
│   ├── FOLDER.md
│   ├── deep-dive.ts        # 深度解读 prompt（原 wiki-prompts.ts）
│   ├── classics.ts         # 经典拆书标准版
│   ├── classics-enhanced.ts # 经典拆书增强版
│   └── synthetica.ts       # Synthetica 工具 prompt
└── types.ts                # Prompt 相关类型定义
```

**优点**:
- 统一管理，便于维护
- 清晰的目录结构
- 便于版本控制和追踪

**缺点**:
- 需要迁移文件和更新引用
- 短期内增加工作量

**实施步骤**:
1. 创建新的目录结构
2. 拆分 `manager.ts` 为多个文件（按场景）
3. 迁移 `data/wiki-*.ts` 到 `prompts/wiki/`
4. 更新所有 import 引用
5. 运行测试确保无回归

#### 选项 B：保持现有结构
**描述**: 不改变文件位置，仅优化 prompt 内容

**优点**:
- 无需迁移文件
- 风险最小
- 快速开始优化

**缺点**:
- 长期维护成本高
- 结构不够清晰

#### 选项 C：部分规整
**描述**: 仅迁移 `data/wiki-*.ts` 到 `prompts/wiki/`，保持 `manager.ts` 不变

**优点**:
- 平衡了规整和风险
- 改动范围可控

**缺点**:
- 仍然存在部分分散

**推荐**: 选项 A（完全规整），理由：
- 长期收益大于短期成本
- 便于后续维护和扩展
- 符合单一职责原则

### 决策 2：Prompt 版本管理策略

#### 当前状态
- `manager.ts` 中的 prompt 有明确的版本号（如 v5.0, v1.2）
- `wiki-prompts.ts` 等文件没有版本号

#### 设计方案
1. **统一版本管理接口**
   ```typescript
   export interface PromptMeta {
     id: string;
     version: string;
     scenario: 'natal' | 'daily' | 'ask' | 'synastry' | 'wiki';
     lastUpdated?: string;  // 新增：最后更新时间
     changelog?: string;    // 新增：变更说明
   }
   ```

2. **版本号规则**
   - 格式：`major.minor`（如 5.0, 5.1）
   - 小改动（文案优化）：+0.1
   - 中等改动（结构调整）：+1.0
   - 大改动（重构）：+主版本

3. **Wiki Prompt 版本化**
   - 为 `wiki-prompts.ts` 中的每个 prompt 函数添加版本标记
   - 在文件头注释中记录版本历史

### 决策 3：Prompt 优化策略

#### 内容质量标准

1. **专业性**
   - 基于现代心理占星理念（荣格原型、发展心理学）
   - 避免宿命论表述（如"注定"、"命中注定"）
   - 使用成长导向的语言（如"潜力"、"成长机会"）

2. **温情度**
   - 使用温暖、支持性的语言
   - 强调自我接纳和成长
   - 避免评判性语言

3. **可操作性**
   - 提供具体、可执行的建议
   - 避免空泛的描述
   - 结合实际生活场景

#### 优化流程

```
1. 验证阶段
   ├── 读取 prompt 内容
   ├── 识别问题（宿命论、缺乏温情、结构不合理）
   └── 记录问题清单

2. 优化阶段
   ├── 修复宿命论表述
   ├── 增强温情度
   ├── 优化结构和字段
   ├── 统一术语和风格
   └── 更新版本号

3. 验证阶段
   ├── 手动测试输出质量
   ├── 检查中英文一致性
   └── 确认无回归问题
```

### 决策 4：中英文双语一致性

#### 问题
- 部分 prompt 的中英文版本不一致
- 翻译质量参差不齐

#### 解决方案
1. **建立术语表**
   - 占星术语标准翻译
   - 心理学术语标准表述
   - 常用短语对照

2. **双语 Prompt 模板**
   ```typescript
   interface BilingualPrompt {
     zh: string;
     en: string;
     meta: PromptMeta;
   }
   ```

3. **验证机制**
   - 检查中英文结构是否对应
   - 检查关键术语翻译是否一致

## 技术实现

### Prompt 注册机制（保持不变）

```typescript
// backend/src/prompts/manager.ts
const prompts: Map<string, PromptTemplate> = new Map();

export function registerPrompt(template: PromptTemplate): void {
  prompts.set(template.meta.id, template);
}

export function getPrompt(id: string): PromptTemplate | undefined {
  return prompts.get(id);
}
```

### 缓存 Key 生成（保持不变）

```typescript
export function buildCacheKey(promptId: string, inputHash: string): string {
  const version = getPromptVersion(promptId);
  return `ai:${promptId}:v${version}:${inputHash}`;
}
```

### Wiki Prompt 版本化（新增）

```typescript
// backend/src/prompts/wiki/deep-dive.ts
export interface WikiPromptMeta {
  id: string;
  version: string;
  category: 'planets' | 'signs' | 'houses' | ...;
  lastUpdated: string;
}

export const PLANET_PROMPT_META: WikiPromptMeta = {
  id: 'wiki-planet',
  version: '1.0',
  category: 'planets',
  lastUpdated: '2026-01-20'
};

export function buildPlanetPrompt(vars: any, lang: 'zh' | 'en'): string {
  // ... prompt 内容
}
```

## 质量保证

### 验证清单

#### 内容质量
- [ ] 无宿命论表述
- [ ] 具备温情和心理疗愈导向
- [ ] 提供具体可操作的建议
- [ ] 基于现代心理占星理念

#### 结构质量
- [ ] 输出格式清晰
- [ ] 字段定义合理
- [ ] JSON 格式正确

#### 语言质量
- [ ] 术语使用一致
- [ ] 语气温暖专业
- [ ] 中英文对应准确

#### 技术质量
- [ ] 版本号合理
- [ ] 缓存 key 正确
- [ ] 无性能问题

### 测试策略

1. **单元测试**（如果适用）
   - 测试 prompt 构建函数
   - 测试版本号管理

2. **集成测试**
   - 测试 API 端点
   - 测试输出格式

3. **手动测试**
   - 测试关键场景的输出质量
   - 测试中英文一致性

## 风险管理

### 风险 1：改动过大影响现有功能
**缓解措施**:
- 保持输出结构不变，仅优化内容
- 分模块升级版本号，便于回滚
- 充分测试关键场景

### 风险 2：优化时间过长
**缓解措施**:
- 采用两阶段策略（快速验证 + 深度优化）
- 优先处理高频使用的 prompt
- 可并行处理多个模块

### 风险 3：中英文不一致
**缓解措施**:
- 建立术语表
- 使用统一的翻译标准
- 增加双语验证步骤

### 风险 4：版本管理混乱
**缓解措施**:
- 统一版本号规则
- 记录变更历史
- 使用 git 追踪变更

## 后续优化方向

1. **Prompt 质量监控**
   - 收集用户反馈
   - 分析输出质量指标
   - 定期优化

2. **A/B 测试**
   - 测试不同 prompt 版本的效果
   - 数据驱动优化

3. **自动化验证**
   - 开发 prompt 质量检查工具
   - 自动检测宿命论表述
   - 自动检查中英文一致性

4. **Prompt 模板化**
   - 提取通用 prompt 模板
   - 减少重复代码
   - 提高可维护性
