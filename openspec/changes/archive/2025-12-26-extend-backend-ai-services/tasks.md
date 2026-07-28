<!-- INPUT: 实施步骤与验证要求（含保留策略与城市搜索数据源）。 -->
<!-- OUTPUT: OpenSpec 任务清单。 -->
<!-- POS: 变更执行清单；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## 1. Backend foundations
- [ ] 1.1 集成 Swiss Ephemeris：真实行星/点位计算、Placidus 宫位输出与完整点位集
- [ ] 1.2 增加出生地解析与城市校验（Open-Meteo Geocoding API，失败回退上海）
- [ ] 1.3 实现 DeepSeek AI 服务（chat + reasoning）并统一双语 JSON 输出解析
- [ ] 1.4 将 AI 输出接入缓存策略（promptId + 版本 + 输入 hash）

## 2. Prompt catalog
- [ ] 2.1 在 `backend/src/prompts/` 维护统一 Prompt 目录与版本
- [ ] 2.2 覆盖所有场景：natal overview/core themes/dimension/technical、daily public/detail、cycle naming、synastry overview/dynamic、ask answer、cbt analysis
- [ ] 2.3 场景到模型映射：默认 chat，Ask 使用 reasoning

## 3. Backend APIs
- [ ] 3.1 补齐 natal 相关端点（overview/core themes/dimension/technical）
- [ ] 3.2 新增 daily detail 端点
- [ ] 3.3 新增 cycle list + naming 端点
- [ ] 3.4 新增 CBT analysis + record create/list 端点
- [ ] 3.5 确保所有响应包含 zh/en 双语字段
- [ ] 3.6 实施 CBT 记录保留策略（3 个月后删除）
- [ ] 3.7 新增城市模糊搜索端点（返回 3-5 个城市/国家候选）

## 4. Frontend migration
- [ ] 4.1 用后端 API 替换 `services/astroService.ts` 的本地计算
- [ ] 4.2 用后端 API 替换 `services/geminiService.ts` 的本地 mock 生成
- [ ] 4.3 移除或停用前端 mock 响应常量，保证 UI 仅消费后端数据
- [ ] 4.4 增补错误态与加载态，避免无后端时静默回退
- [ ] 4.5 在引导页增加城市模糊搜索候选（3-5 个城市/国家）

## 5. Docs & config
- [ ] 5.1 更新 `.env` 与 README（DeepSeek key、API base、Swiss 依赖）
- [ ] 5.2 更新 `openspec/project.md` 与相关 FOLDER.md（如需）

## 6. Validation
- [ ] 6.1 手动验证页面：本命盘/日运/周期/合盘/Oracle/CBT
- [ ] 6.2 运行 `openspec validate extend-backend-ai-services --strict`
- [ ] 6.3 用 `rg` 确认前端不再引用 mock 数据
