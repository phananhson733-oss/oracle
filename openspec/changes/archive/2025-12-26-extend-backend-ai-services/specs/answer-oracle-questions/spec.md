<!-- INPUT: Oracle 问答能力变更需求。 -->
<!-- OUTPUT: OpenSpec Oracle 问答增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Oracle response generation
系统 SHALL 通过后端使用 reasoning 模型生成结构化回答，并返回双语字段供前端切换展示。

#### Scenario: Reasoning answer is returned
- **WHEN** 问题被提交
- **THEN** 前端从后端获取摘要、行动建议与关键洞察并展示
