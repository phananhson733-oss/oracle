<!-- INPUT: 实现任务清单。 -->
<!-- OUTPUT: 任务分解与执行顺序。 -->
<!-- POS: OpenSpec 任务清单文档。 -->

# 任务清单

## CBT 日记模块

### 阶段 1：移除 Mock 数据与空状态设计

- [x] 移除 `components/cbt/utils/mockData.ts` 文件
- [x] 更新 `CBTMainPage.tsx`，移除 `generateMockHistory()` 调用
- [x] 设计并实现空状态 UI（引导用户创建第一条记录）
- [x] 空状态使用 gold/star/space 设计 Token

### 阶段 2：后端 API 同步

- [x] 在 `CBTMainPage.tsx` 引入 `fetchCBTRecords` 和 `saveCBTRecord`
- [x] 实现初始化加载逻辑：先尝试后端 API，失败时回退 localStorage
- [x] 实现保存逻辑：保存至后端 API，同时更新 localStorage 缓存
- [x] 添加加载状态指示器
- [x] 处理 API 错误，显示用户友好提示

### 阶段 3：设计系统迁移

- [x] 更新 `CBTMainPage.tsx` 背景与文字颜色（bg-space-950, text-star-50）
- [x] 更新 `EmptyState.tsx` 配色（gold-500 强调色）
- [x] 更新 `FlowStep.tsx` 进度指示器配色
- [x] 更新 `RecordCard.tsx` 卡片样式
- [x] 更新 `MoodSelector.tsx` 选择器配色
- [x] 更新 `HistoryList.tsx` 历史列表配色
- [x] 更新模态框与按钮样式
- [x] 验证所有组件在 dark/light 主题下显示正确

### 阶段 3.1：CBT 日历与报告体验优化

- [x] 调整 CalendarStats 日历格子与间距，单屏呈现完整月份
- [x] 校准顶部线框与底部现况区域 2px 间距
- [x] 更新写日记流程标题为更直白的文案（中英文）
- [x] 调整报告布局为单列纵向，移除并排模块
- [x] 修复报告顶部情绪提示文本不可见问题

## Oracle 问答模块

### 阶段 4：Rituals 计数器重定位

- [x] 移除右上角 Rituals 计数器
- [x] 在发送按钮左侧添加 Rituals 显示（"3/3" 样式）
- [x] 确保移动端布局正确

### 阶段 5：无滚动布局重构

- [x] 分析当前页面高度分配
- [x] 调整类别标签区域高度（使用 flex-shrink）
- [x] 调整问题矩阵区域高度（使用 max-height + overflow-hidden）
- [x] 移除 `mb-32` 等导致滚动的 margin
- [x] 调整输入区域定位（从 fixed 改为 flex 布局）
- [x] 验证不同屏幕尺寸下的布局（桌面/平板/手机）

### 阶段 6：后端验证

- [x] 检查 `backend/src/services/ai.ts` 确认使用 DeepSeek API
- [x] 验证 `.env` 配置正确读取 `DEEPSEEK_API_KEY`
- [x] 运行测试请求确认 AI 响应正常

### 阶段 7：ORACLE 布局压缩与加载体验

- [x] 调整 Oracle 头部/底部留白（顶部约 24px，底部 4–6px）
- [x] 压缩类别/问题/输入栏高度与间距（约 80% 高度/内边距）
- [x] 将标题改为 ORACLE/神谕，并替换在线指示点为绿色呼吸灯
- [x] 增加问题卡片选中高亮状态
- [x] 发送后切换为全屏 loading，并显示双层旋转星盘 SVG
- [x] 新增 10–20 条占星短语并实现轮播（中英文）
- [x] 合并 Rituals 与发送按钮为单一按钮区块

## 验收测试

- [x] CBT：新用户首次打开显示空状态引导
- [x] CBT：创建记录后数据同步至后端
- [x] CBT：刷新页面后数据仍存在
- [x] CBT：界面配色与主应用一致
- [x] Oracle：页面无垂直滚动条
- [x] Oracle：Rituals 显示在发送按钮区域
- [x] Oracle：问答功能正常工作
- [x] Oracle：顶部/底部留白符合要求，布局无滚动
- [x] Oracle：问题卡片/输入栏压缩后仍可读且选中高亮明显
- [x] Oracle：加载时切换全屏动画与动态短语轮播
- [x] Oracle：标题与在线指示符合 ORACLE 规范
- [x] CBT：日历单屏展示 31 天游览无滚动
- [x] CBT：写日记标题文案更直白易懂
- [x] CBT：报告单列布局且情绪提示可见
