# 合盘体验全面优化 - Tasks

## 1. 现状盘点与翻译补全
- [x] 盘点合盘中所有未翻译的英文文案（相位图例、标签、提示等）。
- [x] 在 `constants.ts` 补充相位翻译：CONJUNCTION/OPPOSITION/SQUARE/TRINE/SEXTILE。
- [x] 在 `AstroChart.tsx` 或相位图例组件中使用 i18n 翻译（通过 `legendLabels` prop 传入）。
- [x] 验证：切换到中文后，合盘 UI 无英文泄露。

## 2. 术语通俗化
- [x] 梳理 `constants.ts` 中合盘相关的晦涩术语清单。
- [x] 替换中文翻译：
  - `perspective_sensitivity` → "情感敏感区"
  - `perspective_repair_window` → "最佳沟通时机"
  - `repair_script` → "沟通话术"
  - `cycle_diagram` → "互动模式"
  - `nourish_points` → "相处加分项"
  - `trigger_points` → "容易踩雷的地方"
- [x] 英文翻译保持原有专业术语不变。
- [x] 验证：中文场景下用户可直观理解所有标签。

## 3. AI 内容姓名替换
- [x] 修改 `backend/src/api/synastry.ts`，在 AI context 中传入 `nameA` 和 `nameB`。
- [x] 修改 `backend/src/prompts/manager.ts` 中所有 synastry prompts：
  - 在 system prompt 中明确要求使用姓名而非 A/B。
  - 在 user prompt 中提供 `nameA` 和 `nameB` 变量。
- [x] 前端 `services/apiClient.ts` 和 `App.tsx` 添加姓名传递逻辑。
- [x] 验证：生成报告中所有 A/B 均已替换为用户姓名。

## 4. 排版格式统一
### 4.1 字号与颜色
- [x] 对比"探索自我"模块，整理字号层级规范（标题/正文/辅助）。
- [x] 统一合盘各 Section 的标题样式。
- [x] 统一标签颜色（如 `text-gold-500`、`text-accent`）。

### 4.2 间距调整
- [x] 检查合盘模块中是否有隐藏元素阻挡间距。
- [x] 星盘与内容间距调整为与"探索自我"一致（如 `mb-8`）。
- [x] Section 之间统一使用 `space-y-8` 或 `mt-8`。
- [x] 卡片内部 padding 统一。

### 4.3 对比盘布局优化
- [x] "敏感面板"由 `grid-cols-5` 改为 `md:grid-cols-2 lg:grid-cols-3` 垂直卡片布局。
- [x] 每个敏感维度（月亮/金星/火星/水星/深层）包含：模式、恐惧、需求 三个字段。
- [x] 新增 `SensCard` 组件，增加呼吸感和视觉层次。
- [x] 添加 `perspective_deep_fear` 翻译（"深层恐惧" / "Deep Fear"）。

### 4.4 组合盘布局优化
- [x] 长期课题部分增加 nodes 和 chiron 字段的展示卡片。
- [x] 添加 `comp_nodes` 翻译（"南北交点（命运方向）" / "Nodes (Destiny)"）。
- [x] 添加 `comp_chiron` 翻译（"凯龙（疗愈功课）" / "Chiron (Healing)"）。
- [x] 验证：排版与"探索自我"风格一致。

## 5. 内容深度增强（Prompt 优化）
### 5.1 对比盘 Prompt
- [x] 修改 `synastry-compare-ab` 和 `synastry-compare-ba` prompts（v1.0 → v2.0）：
  - sensitivity_panel 每项要求 2-3 句解读。
  - main_items 每条要求更详细的 subjective/reaction/need 描述。
- [x] 验证：生成内容更具深度，非一句话概括。

### 5.2 组合盘 Prompt
- [x] 修改 `synastry-composite` prompt（v1.0 → v2.0）：
  - core.summary 要求 outer/inner/growth 各 2-3 句。
  - karmic 增加 nodes 和 chiron 字段，各 2-3 句。
  - daily.maintenance_list 增加到 5-8 条。
- [x] 验证：组合盘解读更完整、更有层次。

### 5.3 其他 Synastry Prompts
- [x] 更新 `synastry-overview` (v4.0 → v5.0)：增强内容深度要求。
- [x] 更新 `synastry-natal-a` 和 `synastry-natal-b` (v1.0 → v2.0)：添加姓名和通俗化要求。

## 6. 验证与回归
- [x] 构建验证：`npm run build` 通过。
- [x] 冒烟：生成完整合盘报告，检查翻译、术语、姓名替换。
- [x] 冒烟：中英文切换，确认各自语境正确。
- [x] 冒烟：对比盘和组合盘排版与"探索自我"风格一致。
- [x] 冒烟：AI 内容深度符合预期。
