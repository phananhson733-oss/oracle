<!-- INPUT: Prompt 管理目录结构与输出规范索引（含百科每日内容 Prompt 变更）。 -->
<!-- OUTPUT: prompts 架构摘要与文件清单（含百科每日与合盘成长焦点字段调整）。 -->
<!-- POS: Prompt 目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：backend/src/prompts

架构概要
- 管理后端 AI Prompt 模板与版本。
- 统一输出策略与分类逻辑。
- 提供 Prompt 获取与注册。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 prompts 目录结构与文件清单。
- manager.ts｜地位：Prompt 管理器｜功能：注册 Prompt、构建缓存 key 与分类逻辑。

近期更新
- Ask Prompt 改为结构化分段输出并更新分类模块。
- Prompt system 支持按上下文动态生成并修复 system 消息缺失问题。
- Ask Prompt 输出改为纯文本标签并去除 Markdown 强调标记。
- Ask Prompt 的星盘密码段落改为“位置 + 一句话解读”的行格式。
 - 合盘相关 Prompt 拆分中英 system 指令并强化兼容维度规则。
 - 合盘总览 Prompt 增加核心互动动力学/关系时间线/占星亮点与准确度提示约束，并移除 K 线字段。
- CBT 分析 Prompt 强化行动建议的具体性与可执行性要求。
- CBT 分析 Prompt 补充本命盘/行运/月相联动与星象觉察提示约束。
- 合盘新增 Highlights 分区 Prompt，并精简 overview 输出结构。
- 合盘路线图 Prompt 下线，核心互动需求字段禁止前缀输出。
- 合盘总览 Prompt 移除甜蜜/摩擦点输出，成长焦点 Prompt 增加 sweet/friction 字段。
- 新增百科 wiki-home Prompt，用于每日星象与每日灵感生成。
