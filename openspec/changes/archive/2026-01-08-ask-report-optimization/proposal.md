<!-- INPUT: Ask 星盘问答报告优化需求与用户提供的 Prompt/问题库约束（含口语化标题与关爱语气）。 -->
<!-- OUTPUT: ask-report-optimization 变更提案。 -->
<!-- POS: Ask 报告优化提案文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: Ask 星盘问答报告优化（心理占星版）

## 变更 ID
`ask-report-optimization`

## Why
当前 Ask 报告对心理深度、类别差异化与结构化输出支持不足，难以满足 Gen Z / Millennials 用户对“自我认知与疗愈”的需求，也缺乏稳定的 prompt 架构与可渲染的输出规范。

## What Changes
- 固化 6 大心理占星类别的口语化展示名与 60 个预设问题库（中英文双语文案，非即时翻译）。
- 采用模块化 Prompt 组装：Base System + Category Module + User Data + Output Format。
- 统一输出为 5 段结构化报告格式（The Essence / Signature / Deep Dive / Soulwork / Cosmic Takeaway）。
- 语言策略调整为“单次调用单语言”，按需生成并缓存中英文两份结果。
- 规定专业术语使用与解释方式，并以心理疗愈与关爱语气呈现，避免宿命论与占卜化表达。

## Impact
- Affected specs: `openspec/specs/answer-oracle-questions/spec.md`
- Affected changes: `align-ai-data-pipeline`, `stabilize-ai-output-flow`（需对齐输出语言与字段协议）
- Affected systems: Ask Prompt/AI 服务、问题库与前端渲染

## Notes / Risks
- 输出结构从 JSON 转为结构化 Markdown，前端需确认渲染与解析方案。
- 变更与其它 `answer-oracle-questions` 增量规范存在交叉，需要合并统一。
