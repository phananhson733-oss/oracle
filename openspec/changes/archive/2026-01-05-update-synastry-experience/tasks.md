<!-- INPUT: 双人合盘优化的实施步骤与验证清单（含关系类型 Top5 与严格模式）。 -->
<!-- OUTPUT: OpenSpec 任务清单（含完成记录）。 -->
<!-- POS: 变更执行清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## 1. Models and copy
- [x] 1.1 定义 SynastryProfile 数据结构与本地存储 key（含 currentLocation）。
- [x] 1.2 补齐双人合盘选人/关系类型/失败提示的中英文文案。

## 2. Backend data + AI strict mode
- [x] 2.1 扩展 ephemeris 计算合盘技术附录（本命/组合盘/对比盘数据块）。
- [x] 2.2 输出关系类型 Top5 建议（基于 synastry aspects 的启发式评分）。
- [x] 2.3 synastry prompt 禁用 mock 回退，AI 不可用时返回错误并携带原因。
- [x] 2.4 更新 synastry prompt 版本与 relationship_type 语境指令。

## 3. Synastry selection UI
- [x] 3.1 替换合盘入口为“选人列表 + 两列选择槽”布局。
- [x] 3.2 列表项展示姓名/Big3/操作按钮，支持选中、编辑、删除。
- [x] 3.3 新增/编辑弹窗：姓名、出生日期/时间、出生地、当前所在地。
- [x] 3.4 底部固定行动区：关系类型上拉列表 + 计算羁绊按钮。
- [x] 3.5 默认选中“我的”档案并展示标签。

## 4. Report + appendix
- [x] 4.1 报告页禁止 mock 渲染，AI 失败显示错误态并提供返回入口。
- [x] 4.2 各 tab 添加技术附录区块（结构对齐探索自我）。

## 5. Validation
- [ ] 5.1 手动冒烟：选人、编辑、删除、关系类型选择、计算按钮状态。
- [ ] 5.2 手动冒烟：AI 不可用时报错，不展示 mock。
- [x] 5.3 运行 `openspec validate update-synastry-experience --strict`。
