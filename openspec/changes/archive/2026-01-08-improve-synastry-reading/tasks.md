<!-- INPUT: 合盘阅读体验与性能优化的实施步骤与验证清单（含成长焦点 sweet/friction 懒加载与综述分区）。 -->
<!-- OUTPUT: OpenSpec 变更任务列表（含成长焦点懒加载完成度与缓存任务）。 -->
<!-- POS: 变更实施清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。
# 合盘阅读体验与性能优化 - Tasks

## 1. 现状核对与覆盖审计
- [ ] 列出 synastry 相关 prompt 与 schema 字段（overview/natal/compare/composite/detail）。
- [ ] 建立“prompt → UI 字段映射表”，标记缺失渲染项与字段空值情况。
- [ ] 英文模式逐项核对字段完整性与段落质量，记录缺口与异常样例。

## 2. 内容结构与 prompt 规范
- [x] 更新 synastry overview schema：Growth Task（1 条）与 Compatibility Radar（6 维度 + 解释）。
- [x] 调整 synastry prompts 的字段描述与输出约束，避免遗漏与空段。
- [x] 为英文输出制定明确规则，并维护独立的英文 prompt 模板（不使用翻译）。
- [x] 更新类型定义与渲染逻辑以匹配新 schema，并将 Compatibility Radar 呈现为卡片。

## 3. 排版与阅读节奏优化（Discovery Me 对齐）
- [x] 使用 frontend-design skill 制定合盘 UI 版式与视觉层级策略。
- [x] 重构 overview/natal/compare/composite 的模块结构与卡片布局。
- [ ] 调整字体层级、间距与信息密度，保证中英文一致性。

## 4. 首屏性能优化
- [x] 拆分 technical 附录为按 tab/详情懒加载，overview 响应不携带 technical，并在 overview 渲染后后台预取。
- [x] 关系类型建议仅在 `/synastry/suggestions` 计算，overview 不重复计算。
- [x] 引入前端本地缓存（localStorage），持久化本命盘与合盘内容（overview/分区/其他 tab），复用跨 tab 的确定性数据。
- [x] 定义缓存 key（出生信息 + 关系类型 + 语言）并实现读取/写入与缓存命中逻辑。
- [x] 将 Highlights 从 overview 中拆分为按需加载分区，overview 首屏不携带 Highlights。
- [x] 收缩 overview 输入上下文（natal snapshot + 维度相位信号 + Top2 落宫 4/7/8 + sweet/friction signals）。
- [x] 后端本命盘计算缓存 7 天，避免重复计算。
- [x] 拆分综述核心互动/练习工具箱/关系时间线为独立分区端点，overview 默认不携带这些内容。
- [x] 前端接入综述分区懒加载（默认折叠，展开后请求并展示加载/重试态）。
- [x] 关系时间线补充 7 天主题并移除 K 线输出与渲染。
- [x] 将成长焦点的 sweet/friction 从 overview 移除，改由 growth_task 分区按需输出。
- [x] 更新 synastry-growth-task prompt/schema 增加 sweet_spots 与 friction_points，并同步前后端类型。
- [x] 前端仅在展开成长焦点后渲染 sweet/friction，移除 overview 兜底渲染。

## 5. Prompt 上下文与 token 校准
- [x] 设计 synastry facts 摘要结构，替换过重的 JSON 输入。
- [ ] 基于样本输出统计设置 max_tokens，避免截断并控制成本。

## 6. 验证与回归
- [ ] 冒烟：合盘生成、overview 渲染、tab 切换与详情弹窗加载。
- [ ] 冒烟：中文/英文输出完整性与排版一致性。
- [ ] 验证：首屏加载时间对比与缓存命中路径。
