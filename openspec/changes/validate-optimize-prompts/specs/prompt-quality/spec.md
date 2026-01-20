# Capability: Prompt Quality Management

## MODIFIED Requirements

### Requirement: 所有 AI Prompt 必须符合专业性和心理疗愈标准

所有 AI prompt MUST 基于现代心理占星理念，MUST 避免宿命论表述，MUST 具备心理疗愈导向和温情度。

#### Scenario: 本命盘解读避免宿命论

**Given** 用户请求本命盘解读
**When** AI 生成解读内容
**Then** 输出不包含"注定"、"命中注定"、"无法改变"等宿命论表述
**And** 使用"潜力"、"成长机会"、"发展方向"等成长导向语言

#### Scenario: Ask 回答具备心理疗愈导向

**Given** 用户提出占星相关问题
**When** AI 生成回答
**Then** 回答具备温暖、支持性的语言
**And** 强调自我接纳和成长
**And** 避免评判性语言

#### Scenario: 合盘分析提供可操作建议

**Given** 用户请求合盘分析
**When** AI 生成分析内容
**Then** 提供具体、可执行的关系建议
**And** 避免空泛的描述
**And** 结合实际生活场景

### Requirement: Prompt 版本管理必须统一且可追踪

所有 prompt MUST 有明确的版本号，版本号变更 MUST 遵循统一规则，便于追踪和回滚。

#### Scenario: 核心 Prompt 版本号管理

**Given** 修改了 `backend/src/prompts/manager.ts` 中的 prompt
**When** 提交代码
**Then** 必须更新对应 prompt 的版本号
**And** 版本号遵循规则：小改动 +0.1，中等改动 +1.0，大改动 +主版本
**And** 在 FOLDER.md 中记录变更说明

#### Scenario: Wiki Prompt 版本标记

**Given** 修改了 `backend/src/data/wiki-prompts.ts` 中的 prompt
**When** 提交代码
**Then** 必须在文件头注释中更新版本标记
**And** 记录变更内容和日期

### Requirement: 中英文双语 Prompt 必须保持一致性

所有双语 prompt 的中英文版本 MUST 在结构、内容和风格上保持一致。

**注意：Wiki 深度解读 Prompt（`wiki-prompts.ts`）不在本次优化范围内。**

#### Scenario: 经典拆书双语一致性

**Given** 修改了经典拆书 prompt 的中文框架
**When** 提交代码
**Then** 必须同步更新英文框架
**And** 确保 7 个模块的中英文对应

## ADDED Requirements

### Requirement: Prompt 必须集中管理（如果执行阶段 0）

为便于维护，所有 prompt SHALL 集中在 `backend/src/prompts/` 目录下，按功能分类。

**注意：Wiki 深度解读 Prompt（`wiki-prompts.ts`）保持现有位置不变。**

#### Scenario: 经典拆书 Prompt 迁移

**Given** 决定执行 prompt 规整
**When** 迁移 `backend/src/data/wiki-classic-prompts*.ts`
**Then** 文件移动到 `backend/src/prompts/wiki/classics*.ts`
**And** 更新所有 import 引用
**And** 功能无回归

### Requirement: 必须建立术语表确保一致性

MUST 建立占星和心理学术语的标准翻译表，确保所有 prompt 使用一致的术语。

#### Scenario: 应用术语表到 Prompt

**Given** 完成术语表建立
**When** 优化 prompt 内容
**Then** 所有占星术语使用标准翻译
**And** 所有心理学术语使用标准表述
**And** 同类 prompt 的语言风格一致

#### Scenario: 术语表验证

**Given** 修改了任何 prompt
**When** 提交��码前
**Then** 必须检查术语使用是否符合术语表
**And** 确保中英文术语对应准确

### Requirement: Prompt 输出结构必须保持现有设计

优化 prompt 时，MUST 保持各模块现有的输出结构（JSON 格式、字段定义），仅优化内容质量。

#### Scenario: 本命盘 Prompt 结构保持

**Given** 优化 `natal-overview` prompt
**When** 修改 prompt 内容
**Then** 输出 JSON 结构保持不变
**And** 字段名称和类型保持不变
**And** 仅优化字段内容的质量

#### Scenario: 合盘 Prompt 结构保持

**Given** 优化 `synastry-overview` prompt
**When** 修改 prompt 内容
**Then** 输出结构保持现有设计
**And** 不强制与其他模块统一
**And** 尊重合盘模块的特殊需求

### Requirement: 必须验证 Prompt 优化效果

所有 prompt 优化后 MUST 经过验证测试，确保输出质量提升且无回归问题。

#### Scenario: 手动测试关键场景

**Given** 完成 prompt 优化
**When** 运行验证测试
**Then** 测试本命盘、日运、Ask、合盘、Wiki 的关键场景
**And** 确认输出质量符合专业性和温情度标准
**And** 确认无功能回归

#### Scenario: 性能验证

**Given** 完成 prompt 优化
**When** 运行性能测试
**Then** prompt 长度在合理范围内
**And** API 响应时间无明显下降
**And** 缓存机制正常工作

#### Scenario: 中英文输出质量验证

**Given** 完成双语 prompt 优化
**When** 运行验证测试
**Then** 测试中文和英文输出
**And** 确认两种语言的输出质量一致
**And** 确认术语翻译准确
