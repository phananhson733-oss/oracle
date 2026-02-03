# 任务清单：enhance-pairing-report

## 能力 1：全屏报告页面（前端）

### Task 1.1：重构 pairing.js 为 step 双步模式
- [x] 添加 `step` 状态（1=输入，2=报告）
- [x] 添加 `goBack()` 方法（从报告返回输入）
- [x] 保留现有输入界面逻辑不变
- **校验**：点击「立即测算」后 step 切换为 2，点击返回切换为 1

### Task 1.2：实现全屏报告 WXML 模板
- [x] 移除弹窗（overlay）结构，改为 `wx:if="{{step === 2}}"` 的全屏视图
- [x] 报告结构：顶部配对信息 + 维度分析卡片（6维度）+ 综合分析区 + 相处建议区 + 底部提问按钮
- [x] 添加 loading 骨架屏（等待 AI 返回时显示）
- **校验**：报告内容完整展示，滚动顺畅，骨架屏正常显示/隐藏

### Task 1.3：实现报告页面 WXSS 样式
- [x] 参考 synastry 的卡片化设计风格
- [x] 遵循 Ink Wash 主题（使用 `var(--paper-50)` 等变量）
- [x] 响应式适配不同屏幕宽度
- **校验**：样式与 synastry 报告页面风格一致，无溢出/错位

### Task 1.4：添加报告导航与返回逻辑
- [x] Step 2 页面顶部使用原生导航栏标题「配对报告」
- [x] 动态修改 `navigationBarTitleText`（通过 `wx.setNavigationBarTitle`）
- [x] 返回时恢复标题为「星缘速配」
- **校验**：导航栏标题随 step 切换正确变化，返回按钮行为正确

## 能力 2：后端 AI 配对分析接口

### Task 2.1：创建配对 Prompt 模板
- [x] 在 `backend/src/prompts/templates/pairing/` 下创建 Prompt 文件
- [x] 实现 `PromptTemplate` 接口
- [x] Prompt 融合西方占星元素相性 + 中国生肖三合六合 + 心理学视角
- [x] 在 `templates/` 的 index 中注册
- [x] 在主入口 `prompts/index.ts` 中导入并注册
- [x] 在 `ai.ts` 温度配置中添加 `pairing-analysis: 0.5`

### Task 2.2：创建配对 API 路由
- [x] 新增 `backend/src/api/pairing.ts`
- [x] 实现 `POST /api/pairing` 端点
- [x] 参数验证：signA, signB（星座 ID），animalA, animalB（生肖）
- [x] 调用 AI 服务获取分析内容
- [x] 返回结构化 JSON 响应

### Task 2.3：注册路由并添加缓存
- [x] 在 `backend/src/index.ts` 中注册 pairing 路由
- [x] 实现内存缓存（相同组合复用结果，TTL 24h）

### Task 2.4：前端 API 集成
- [x] 在 `miniprogram/services/api.js` 添加 `PAIRING` 端点
- [x] 在 pairing.js 中实现「快速预览 + AI 增强」双阶段策略
- [x] 保留前端计算作为快速预览和兜底
- [x] 添加错误处理

## 能力 3：配对追问功能

### Task 3.1：添加提问入口按钮
- [x] 在报告页面底部添加「有疑问？问一问」按钮
- [x] 点击跳转到 ask 页面，携带 query 参数（from, signA, signB, animalA, animalB, score, summary）

### Task 3.2：ask 页面接收配对上下文
- [x] 在 ask.js 的 `onLoad` 中解析 `from=pairing` 参数
- [x] 显示配对上下文欢迎消息
- [x] 预填引导问题（针对配对场景定制）
- [x] 自动设置对话目标为「感情婚恋关系」
- [x] 将配对信息注入请求数据中
