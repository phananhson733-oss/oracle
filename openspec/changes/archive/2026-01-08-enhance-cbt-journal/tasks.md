# Tasks: enhance-cbt-journal

## Phase 1: Bug 修复与基础 UI

- [x] **T1.1** 修复月份按钮报错
  - 文件：`components/cbt/CalendarStats.tsx`
  - 定位月份切换逻辑，修复日期边界处理
  - **验证**：点击"2026年1月"按钮无报错

- [x] **T1.2** 日历表情放大 1.2 倍
  - 文件：`components/cbt/CalendarStats.tsx`, `components/cbt/MoodIcon.tsx`
  - 将 MoodIcon size 参数乘以 1.2
  - **验证**：日历中表情视觉变大，比例正确

- [x] **T1.3** 移除写日记自动关闭逻辑
  - 文件：`components/cbt/CBTWizard.tsx`
  - 删除无操作超时关闭的 setTimeout/useEffect
  - **验证**：打开写日记界面，静置 5 分钟不会自动关闭

- [x] **T1.4** dark/light 模式图标兼容
  - 文件：多个 CBT 组件
  - 为删除按钮、进度条添加主题感知颜色
  - **验证**：切换主题，所有图标清晰可见

## Phase 2: 写日记界面重构

- [x] **T2.1** 重构整体布局为左右分栏
  - 文件：`components/cbt/CBTWizard.tsx`
  - 左侧：内容输入区（整栏）
  - 右侧：星空指引 + 执行指引/示例（上下依次）
  - **验证**：布局符合设计稿

- [x] **T2.2** 合并指引信息
  - 文件：`components/cbt/CBTWizard.tsx`, `constants.ts`
  - 合并"灵感引导"和"星空指引"为"星空指引"
  - 合并"执行指引"和"示例"为上下文显示
  - **验证**：指引区域只有两个部分

- [x] **T2.3** "我的感受"表格式输入重构
  - 文件：`components/cbt/CBTWizard.tsx`
  - Step2 改为：顶部输入区（感受名称 + 强度滑块 + 添加按钮）
  - 底部列表区：显示已添加感受，带进度条显示强度
  - **验证**：添加感受流程符合设计

- [x] **T2.4** 身体感受布局和 icon 优化
  - 文件：`components/cbt/CBTWizard.tsx`
  - 感知状态栏移至左侧底部
  - 为不同部位使用差异化 icon（Brain, Heart, Activity, Dumbbell, Moon）
  - **验证**：各部位 icon 可区分

- [x] **T2.5** "脑内想法"上下架构重构
  - 文件：`components/cbt/CBTWizard.tsx`
  - Step4 改为垂直布局，输入区在上（标签 + 输入框 + 添加按钮），已添加列表在下
  - **验证**：布局清晰，添加流程直观

- [x] **T2.6** "支持证据"/"反驳证据"上下架构重构
  - 文件：`components/cbt/CBTWizard.tsx`
  - Step6/7 改为垂直布局
  - **验证**：布局与"脑内想法"一致

- [x] **T2.7** "平衡思维"上下架构重构
  - 文件：`components/cbt/CBTWizard.tsx`
  - Step8 改为垂直布局（文本框 + 相信程度滑块 + 添加按钮）
  - **验证**：布局与其他输入步骤一致

## Phase 3: 日记解读界面优化

- [x] **T3.1** 调整模块顺序
  - 文件：`components/cbt/ReportDashboard.tsx`
  - "平衡性见地"移至第二模块（认知评估下方）
  - "宇宙背景"改名为"占星解读"
  - **验证**：模块顺序符合设计

- [x] **T3.2** 优化星座信息样式
  - 文件：`components/cbt/ReportDashboard.tsx`
  - 星座信息不放大字体，与正文一致
  - 改为逐条罗列（bullet list）
  - **验证**：星座信息排版清晰

- [x] **T3.3** 详细解读内容扩展
  - 文件：`backend/src/prompts/manager.ts`
  - 调整 Prompt 要求详细解读内容 1.5 倍
  - 移除斜体样式要求
  - **验证**：AI 输出内容更详尽

- [x] **T3.4** 平衡性见地框体高度调整
  - 文件：`components/cbt/ReportDashboard.tsx`
  - padding/margin 缩小至 0.8 倍
  - **验证**：框体高度合适，文字不溢出

## Phase 4: AI 内容质量提升

- [x] **T4.1** 优化执行建议 Prompt
  - 文件：`backend/src/prompts/manager.ts`
  - "占星整合冥想"：提供具体步骤，用日常语言
  - "阴影对话"：给出自我对话示例
  - 避免使用专业术语（宫位、合相等）
  - **验证**：AI 输出面向小白用户

- [x] **T4.2** 确认 Prompt 统一管理
  - 文件：`backend/src/prompts/manager.ts`
  - 确认 cbt-analysis Prompt 已在统一位置
  - **验证**：无散落在其他文件的 CBT Prompt

## Phase 5: 统计功能增强

- [x] **T5.1** 实现月度数据过滤
  - 文件：`components/cbt/AnalysisViews.tsx`
  - 添加 `filterCurrentMonth` 函数
  - 所有统计视图仅显示当月数据
  - **验证**：切换月份，统计数据对应变化

- [x] **T5.2** 英文字体统一
  - 文件：`components/cbt/AnalysisViews.tsx`
  - 英文使用系统 sans-serif，移除宋体
  - **验证**：英文字体风格统一

- [x] **T5.3** 优化情绪分类映射
  - 文件：`components/cbt/AnalysisViews.tsx` 或 `types.ts`
  - 扩展 `MOOD_CATEGORY_MAP`
  - 减少"其他未分类"比例
  - **验证**：情绪分类更精准

- [x] **T5.4** 情绪配方圆环彩色
  - 文件：`components/cbt/AnalysisViews.tsx`
  - Recharts PieChart 使用 MOOD_COLORS
  - 悬停 Tooltip 显示中文名称
  - **验证**：圆环彩色，悬停显示正确

- [x] **T5.5** 练习建议逐条展示
  - 文件：`components/cbt/AnalysisViews.tsx`
  - 改为列表样式，每条建议独立一行
  - **验证**：建议易读

- [x] **T5.6** 身体调节和星象觉察解读优化
  - 文件：`backend/src/prompts/manager.ts`
  - 调整 Prompt 要求更详细解读
  - 移除斜体要求
  - **验证**：解读内容详尽

- [x] **T5.7** 结合本命盘和行运盘分析
  - 文件：`backend/src/api/cbt.ts`, `backend/src/prompts/manager.ts`
  - API 增加行运数据传递（cbt-analysis prompt v4.0）
  - Prompt 引导结合本命盘和行运分析（4 点详细解读框架）
  - **验证**：分析内容涉及星盘配置

## Phase 6: i18n 优化

- [x] **T6.1** 更新写日记步骤标题
  - 文件：`constants.ts`
  - 按设计文档更新 `step1_title` ~ `step10_title`
  - 使用 CBT 专业术语 + 括号内大白话解释
  - 中英文同步更新
  - **验证**：标题清晰直白

- [x] **T6.2** 专业术语与大白话区分
  - 文件：`constants.ts`, `backend/src/prompts/manager.ts`
  - 星座解读保持专业术语
  - 建议部分使用大白话
  - **验证**：表述符合场景

- [x] **T6.3** 添加垂直布局输入标签 i18n
  - 文件：`constants.ts`
  - 添加 `your_thought`, `evidence_for_label`, `evidence_against_label`
  - 中英文同步更新
  - **验证**：所有输入标签正确显示

## Phase 7: 验收测试

- [x] **T7.1** 完整流程测试
  - 完成 10 步写日记
  - 查看日记解读
  - 查看统计视图
  - **验证**：全流程无报错

- [x] **T7.2** 主题兼容性测试
  - dark/light 模式切换
  - 所有页面视觉正确
  - **验证**：图标、颜色清晰

- [x] **T7.3** 构建验证
  - 运行 `npm run build`
  - **验证**：构建无错误（2373 modules, 1.56s）

---

## 依赖关系

```
Phase 1 (Bug修复) ──┬──> Phase 2 (写日记重构)
                   │
                   └──> Phase 3 (解读优化)

Phase 4 (AI质量) ────> Phase 5 (统计增强) ────> Phase 6 (i18n)

Phase 6 ────> Phase 7 (验收)
```

## 可并行任务

- T1.1 ~ T1.4 可并行
- T2.1 ~ T2.6 需顺序执行（布局先于细节）
- T3.1 ~ T3.4 可并行
- T5.1 ~ T5.7 部分可并行
- T6.1 ~ T6.2 可并行
