<!-- INPUT: Ask 报告优化实施拆分与验证需求（含口语化标题与关爱语气）。 -->
<!-- OUTPUT: ask-report-optimization 任务清单。 -->
<!-- POS: 变更实施任务清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Ask 星盘问答报告优化 - Tasks

## 1. Prompt 与问题库
- [x] 1.1 整理 Base System Prompt 与 6 类 Module（关爱语气，见 design.md）
- [x] 1.2 补齐 60 个问题的 EN/ZH 文案与稳定 ID（含口语化标题，见规范附录）
- [x] 1.3 统一 5 段结构化输出格式与字段命名
- [x] 1.4 明确专业术语 + 通俗解释 + 关爱式语气的输出规则

## 2. 后端与数据流
- [x] 2.1 实现 Prompt 组装顺序（Base + Module + User Data + Output Format）
- [x] 2.2 Ask 请求支持 `lang` 参数并返回单语言内容
- [x] 2.3 按语言生成与缓存 Ask 报告（语言切换触发重新生成）

## 3. 前端渲染与文案
- [x] 3.1 Ask 报告按 5 段 Markdown 标题拆分渲染
- [x] 3.2 预设问题与分类支持 EN/ZH 文案切换
- [x] 3.3 补齐 Ask 页面错误/空状态文案（双语）

## 4. 验证
- [ ] 4.1 6 类各抽样生成并核对输出结构
- [ ] 4.2 语言切换触发重新生成并验证缓存命中
- [x] 4.3 `openspec validate ask-report-optimization --strict`
