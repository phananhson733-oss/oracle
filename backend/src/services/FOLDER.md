<!-- INPUT: 后端业务服务目录结构与输出索引（含行运 ASC 相位与小行星回退）。 -->
<!-- OUTPUT: services 架构摘要与文件清单（含行运 ASC 相位与小行星回退说明）。 -->
<!-- POS: 服务目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：backend/src/services

架构概要
- 提供占星计算、AI 内容与地理搜索服务。
- AI 服务负责缓存与输出解析。
- 星历服务封装 Swiss Ephemeris 调用。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 services 目录结构与文件清单。
- ai.ts｜地位：AI 服务｜功能：DeepSeek 调用、缓存与 Markdown/JSON 解析。
- ephemeris.ts｜地位：星历服务｜功能：星盘计算与行运行星数据。
- geocoding.ts｜地位：地理服务｜功能：城市搜索与坐标解析。

近期更新
- 问答输出改为结构化报告并支持原始文本解析。
- DeepSeek 环境变量改为仅后端读取。
- AI 服务支持动态 system prompt 渲染，避免请求缺失内容字段。
- Ask 问答 mock 输出更新为星盘密码含一句解读的行格式。
 - 合盘 overview mock 扩展为 6 维兼容雷达字段。
 - 合盘 overview mock 更新为核心互动/时间线文本/亮点结构与准确度提示（移除 K 线）。
- 新增合盘综述分区 mock（核心互动/练习工具箱/关系时间线）。
- 新增合盘 Highlights mock，并为本命盘计算加入 7 天缓存。
- ephemeris 星历服务补齐 Desc/IC 点位并扩展四轴相位计算。
- 合盘成长焦点 mock 增加 sweet_spots 与 friction_points 字段。
- 行运相位计算加入 ASC 与北交点，并在星历异常时回退小行星位置。
