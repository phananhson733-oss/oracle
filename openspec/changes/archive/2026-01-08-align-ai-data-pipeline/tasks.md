<!-- INPUT: 变更实施步骤与验证要求（含完成状态）。 -->
<!-- OUTPUT: OpenSpec 任务清单。 -->
<!-- POS: 变更执行清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## 1. Frontend data pipeline
- [x] 1.1 清理 `src/` 镜像目录，确认构建入口保持在根目录版本
- [x] 1.2 扩展 `services/apiClient.ts`：新增 core themes / dimension / technical / daily detail / cycle naming 等请求
- [x] 1.3 更新 `services/geminiService.ts`：补齐 prompt key 映射并统一返回 `content[language]`
- [x] 1.4 重构 `services/astroService.ts`：仅封装后端真实数据调用，移除本地 mock 分支
- [x] 1.5 更新 `App.tsx`：所有 AI 请求传入 profile；日运/周期使用真实数据、用户时区与 3 个月默认范围
- [x] 1.6 更新 `components/AstroChart.tsx`：异步加载真实星盘数据并读取 `Ascendant`
- [x] 1.7 同步 CBT 前端字段为 snake_case（与后端一致）

## 2. Backend schema alignment
- [x] 2.1 更新 `backend/src/types/api.ts`：补齐所有响应类型并统一 snake_case
- [x] 2.2 更新 `backend/src/prompts/manager.ts`：所有 prompt 输出 snake_case 并覆盖所有场景
- [x] 2.3 更新 `backend/src/services/ai.ts`：补齐 mock 输出并与 schema 一致

## 3. Validation
- [ ] 3.1 冒烟验证：本命盘/日运/周期/合盘/Oracle/CBT 页面无 Data unavailable
- [ ] 3.2 语言切换验证：zh/en 内容正确切换
- [ ] 3.3 星盘验证：ASC 显示正确，time_unknown 时宫位缺失或标注正确
- [x] 3.4 运行 `openspec validate align-ai-data-pipeline --strict`
