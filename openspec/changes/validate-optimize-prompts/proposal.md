# Proposal: 系统性验证与优化所有 AI Prompts

## 概述

对整个项目的 AI prompt 进行系统性验证和优化，确保输出质量、专业性、温情度和现代心理占星理念的统一，同时保持各模块现有的合理输出结构。

## 背景

当前项目包含大量 AI prompt，**分散在多个文件中**：

### 主要 Prompt 文件
1. **`backend/src/prompts/manager.ts`**（主要 prompt 管理器，约 2400 行）
   - 探索自我（natal）：本命盘总览、核心主题、维度解读、详情解读
   - 今日运势（daily）：日运预测、详情解读
   - Ask 回答（oracle）：问答、CBT 日记分析、CBT 统计分析
   - 合盘（synastry）：总览、亮点、核心动力、实践工具、关系时间线、氛围标签、成长任务、冲突循环、天气预报、行动计划、本命盘 A/B、对比盘 AB/BA、组合盘、动态解读
   - 百科（wiki）：首页、经典拆书、Synthetica 工具
   - 详情解读（detail）：元素、相位、行星、小行星、守护星（跨 natal/daily/synastry/composite）

2. **`backend/src/data/wiki-prompts.ts`**（约 800 行）
   - Wiki 深度解读 prompt 模板（行星、星座、宫位、相位、元素、模式、角度、小行星、盘型）
   - 包含中英文双语 prompt

3. **`backend/src/data/wiki-classic-prompts.ts`**（约 500 行）
   - Wiki 经典书籍拆解 prompt 模板
   - 用于 DeepSeek Reason 模型生成专业级书籍导读

4. **`backend/src/data/wiki-classic-prompts-enhanced.ts`**（约 1000 行）
   - Wiki 经典书籍深度拆解增强版 prompt
   - 扩展到 10000 字深度报告，分为 7 个主要部分

5. **其他数据生成文件**（约 13000 行）
   - `backend/src/data/comprehensive-generate.ts`
   - `backend/src/data/fast-generate.ts`
   - `backend/src/data/generate-enhanced-reports.ts`
   - `backend/src/data/wiki-generated.ts`
   - 这些文件包含预生成的内容和部分 prompt 逻辑

### 问题
- **分散管理**：prompt 分散在多个文件中，难以统一维护
- **版本不一致**：不同文件的 prompt 版本管理方式不同
- **重复定义**：部分 prompt 逻辑在多处重复

### 优化目标
1. **专业性**：基于现代心理占星理念，避免宿命论
2. **温情度**：心理疗愈导向，温暖而不失专业
3. **结构一致性**：各模块保持现有合理的输出结构（不强制统一）
4. **版本管理**：按模块改动程度分别升级版本号
5. **集中管理**：考虑将分散的 prompt 规整到统一位置

## 目标

1. **全面覆盖**：验证并优化所有 prompt（约 40+ 个）
2. **效率优先**：快速完成基础优化，确保覆盖全面
3. **质量保证**：在效率基础上确保专业性和心理疗愈效果
4. **结构保持**：尊重现有各模块的输出结构设计，仅优化内容质量
5. **版本控制**：根据改动程度按模块分别升级版本号

## 范围

### A. 核心 Prompt（`backend/src/prompts/manager.ts`）

#### 1. 探索自我（Natal）模块
- `natal-overview` (v5.0)：本命盘总览
- `natal-core-themes` (v5.0)：核心主题
- `natal-dimension` (v5.0)：维度解读
- `detail-elements-natal` (v1.2)：元素详情
- `detail-aspects-natal` (v1.2)：相位详情
- `detail-planets-natal` (v1.2)：行星详情
- `detail-asteroids-natal` (v1.2)：小行星详情
- `detail-rulers-natal` (v1.2)：守护星详情

### 2. 今日运势（Daily）模块
- `daily-forecast` (v5.0)：日运预测
- `daily-detail` (v5.0)：日运详情
- `detail-aspects-transit` (v1.2)：行运相位详情
- `detail-planets-transit` (v1.2)：行运行星详情
- `detail-asteroids-transit` (v1.2)：行运小行星详情
- `detail-rulers-transit` (v1.2)：行运守护星详情

### 3. Ask 回答（Oracle）模块
- `ask-answer` (v5.2)：问答解读
- `cbt-analysis` (v5.0)：CBT 日记分析
- `cbt-aggregate-analysis` (v2.0)：CBT 统计分析

### 4. 合盘（Synastry）模块
- `synastry-overview` (v10.0)：合盘总览
- `synastry-highlights` (v1.0)：合盘亮点
- `synastry-core-dynamics` (v1.1)：核心互动动力
- `synastry-practice-tools` (v1.0)：实践工具
- `synastry-relationship-timing` (v1.0)：关系时间线
- `synastry-vibe-tags` (v1.0)：氛围标签
- `synastry-growth-task` (v2.0)：成长任务
- `synastry-conflict-loop` (v1.0)：冲突循环
- `synastry-weather-forecast` (v1.0)：天气预报
- `synastry-action-plan` (v1.0)：行动计划
- `synastry-natal-a/b` (v4.0)：本命盘 A/B
- `synastry-compare-ab/ba` (v4.0)：对比盘 AB/BA
- `synastry-composite` (v4.0)：组合盘
- `synastry-dynamic` (v4.0)：动态解读
- `detail-*-synastry` (v1.2/v2.2)：合盘详情解读（元素/相位/行星/小行星/守护星）
- `detail-*-composite` (v1.2)：组合盘详情解读

### 5. 百科（Wiki）模块
- `wiki-home` (v1.0)：百科首页（每日星象/灵感）
- `wiki-classics-master` (v1.0)：经典拆书
- `synthetica-analysis` (v2.0)：Synthetica 工具

#### 7. 其他
- `cycle-naming` (v3.0)：周期命名

### B. Wiki 相关 Prompt（仅优化首页和工具）

**优化范围**：
- ✅ `wiki-home` (v1.0)：百科首页（每日星象/灵感）
- ✅ `synthetica-analysis` (v2.0)：Synthetica 工具解读

**排除范围**：
- ❌ Wiki 深度解读 Prompt（`backend/src/data/wiki-prompts.ts`）：行星/星座/宫位/相位等，保持不变
- ❌ Wiki 经典书籍拆解 Prompt（`backend/src/data/wiki-classic-prompts*.ts`）：静态内容，保持不变
- ❌ `wiki-classics-master` (v1.0)：经典拆书 master prompt，保持不变

### D. 数据生成文件中的 Prompt
- `backend/src/data/comprehensive-generate.ts`
- `backend/src/data/fast-generate.ts`
- `backend/src/data/generate-enhanced-reports.ts`
- `backend/src/data/wiki-generated.ts`
- 这些文件包含预生成内容的 prompt 逻辑，需要检查是否有独立的 prompt 定义

## 优化原则

### 1. 内容质量
- **专业性**：基于现代心理占星理念（荣格原型、发展心理学）
- **温情度**：心理疗愈导向，温暖、支持性的语言
- **准确性**：避免过度解读，尊重出生时间准确度
- **可操作性**：提供具体、可执行的建议

### 2. 结构保持
- **尊重现有设计**：各模块保持现有的输出结构（JSON 格式、字段定义）
- **不强制统一**：本命盘、日运、合盘等模块的用户关注点不同，保持差异化
- **仅优化内容**：在现有结构框架内优化文案质量和专业性

### 3. 版本管理
- **按模块升级**：根据改动程度，不同模块使用不同版本号
- **小改动**：+0.1（如 v5.0 → v5.1）
- **中等改动**：+1.0（如 v5.0 → v6.0）
- **大改动**：+主版本（如 v5.0 → v6.0 或更高）

### 4. 温度设置
- **保持现有设置**：不调整 temperature 参数
- **通过 prompt 优化**：通过改进 prompt 内容来控制输出风格

## 实施策略

### 阶段 0：Prompt 规整（方案 A - 完全规整）

**用户选择：方案 A（完全规整）**

1. **拆分 `manager.ts`**：按场景拆分为多个文件
   - `natal.ts`：本命盘相关 prompt
   - `daily.ts`：日运相关 prompt
   - `ask.ts`：Ask 和 CBT 相关 prompt
   - `synastry.ts`：合盘相关 prompt
   - `detail.ts`：详情解读相关 prompt
   - `wiki.ts`：Wiki 相关 prompt（仅 wiki-home 和 synthetica-analysis）

2. **创建目录结构**：
   ```
   backend/src/prompts/
   ├── manager.ts          # 核心注册和管理
   ├── natal.ts
   ├── daily.ts
   ├── ask.ts
   ├── synastry.ts
   ├── detail.ts
   ├── wiki.ts
   └── types.ts
   ```

3. **更新所有引用**：更新 API 文件中的 import 路径

### 阶段 1：快速验证（效率优先）
1. **核心 Prompt**（`manager.ts`）：逐个检查 42 个 prompt 的基本质量
   - 探索自我（8 个）
   - 今日运势（6 个）
   - Ask 回答（1 个）
   - **CBT 日记（5 个）**：
     - CBT 日记报告（1 个）
     - CBT 统计报告（4 个，需要从现有 prompt 拆分）
   - 合盘（19 个）
   - Wiki（2 个：wiki-home, synthetica-analysis）
   - 其他（1 个：cycle-naming）

2. **排除范围**：
   - ❌ Wiki 深度解读 Prompt（`wiki-prompts.ts`）
   - ❌ Wiki 经典拆书 Prompt（`wiki-classic-prompts*.ts`）
   - ❌ `wiki-classics-master` prompt

3. 识别明显问题（如过于宿命论、缺乏温情、结构不合理、AI 味道）
4. 进行快速修复，确保全面覆盖

### 阶段 2：深度优化（质量保证）
1. 对关键 prompt 进行深度优化（优先高频使用的 20-30 个）
2. 确保专业性和心理疗愈效果
3. 统一语言风格和术语使用
4. 优化中英文双语 prompt 的一致性
5. **应用 humanizer-zh 处理**：去除 AI 生成痕迹
   - 识别并修复 AI 写作模式（宿命论、夸张象征、填充短语等）
   - 使输出更自然、更有人味
   - 保持专业性的同时增加温情度

### 阶段 3：验证测试
1. 运行 `openspec validate` 确保规范符合
2. 手动测试关键场景的输出质量
3. 根据反馈进行微调
4. 更新相关文档（FOLDER.md 等）

### 阶段 4：前端优化（如需要）
1. **评估输出结构变化**：检查 prompt 优化后的输出结构变化
2. **使用 frontend-design skill**：优化前端展示
   - 调整 UI 组件以适配新的输出结构
   - 确保用户体验一致性
   - 优化视觉呈现
3. **验证前端功能**：确保所有功能正常工作

## 成功标准

1. **覆盖率**：所有需要优化的 prompt 都经过验证和优化
   - 核心 Prompt（manager.ts）：42 个 ✓
     - 探索自我：8 个
     - 今日运势：6 个
     - Ask 回答：1 个
     - **CBT 日记：5 个**（1 个日记报告 + 4 个统计报告）
     - 合盘：19 个
     - Wiki：2 个（wiki-home, synthetica-analysis）
     - 其他：1 个
   - **排除**：
     - Wiki 深度解读 Prompt（wiki-prompts.ts）❌
     - Wiki 经典拆书 Prompt（wiki-classic-prompts*.ts）❌
     - wiki-classics-master prompt ❌

2. **质量**：输出内容专业、温情、符合现代心理占星理念
3. **一致性**：同类 prompt 的语言风格和术语使用保持一致
4. **结构保持**：各模块的输出结构保持现有设计
5. **版本管理**：版本号合理升级，便于追踪变更
6. **规整性**（如果执行阶段 0）：prompt 集中管理，便于维护

## 风险与缓解

### 风险 1：改动过大影响现有功能
- **缓解**：保持现有输出结构，仅优化内容质量
- **缓解**：分模块升级版本号，便于回滚

### 风险 2：优化时间过长
- **缓解**：采用两阶段策略，先快速覆盖，再深度优化
- **缓解**：优先处理高频使用的 prompt

### 风险 3：不同 prompt 风格不一致
- **缓解**：建立统一的语言风格指南
- **缓解**：使用一致的术语和表达方式

## 时间线

- **阶段 1**：快速验证所有 prompt（预计覆盖所有 40+ prompt）
- **阶段 2**：深度优化关键 prompt（重点优化高频使用的 15-20 个）
- **阶段 3**：验证测试和微调

## 依赖

- 现有 `backend/src/prompts/manager.ts` 文件
- OpenSpec 验证工具
- 前端展示效果作为参考标准

## 后续工作

- 建立 prompt 质量监控机制
- 定期收集用户反馈并优化
- 建立 prompt 版本管理最佳实践文档
