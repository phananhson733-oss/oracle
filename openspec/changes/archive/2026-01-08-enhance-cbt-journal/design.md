# Design: enhance-cbt-journal

## Overview
本文档描述 CBT 日记增强的架构设计，包括写日记界面重构、日记解读优化、统计功能增强及 Prompt 优化策略。

---

## 1. 写日记界面重构

### 1.1 布局架构

**当前布局**：
```
┌─────────────────────────────────────┐
│ Header (步骤标题 + 进度条)           │
├─────────────────────────────────────┤
│ 灵感引导 / 星空指引 / 执行指引 / 示例 │
│ (分散显示)                          │
├─────────────────────────────────────┤
│ 输入区域 (居中)                      │
└─────────────────────────────────────┘
```

**目标布局**：
```
┌─────────────────────────────────────┐
│ Header (步骤标题 + 进度条)           │
├──────────────┬──────────────────────┤
│              │                      │
│  内容输入    │  星空指引            │
│  (左侧整栏)  │  ──────────────────  │
│              │  执行指引 + 示例     │
│              │  (上下依次显示)      │
│              │                      │
└──────────────┴──────────────────────┘
```

### 1.2 感受输入组件重构

**当前**：横向卡片选择 + 滑块
**目标**：表格式垂直输入

```tsx
// 新组件结构
<MoodInputSection>
  <InputArea>  {/* 顶部输入区 */}
    <MoodNameInput />
    <IntensitySlider />
    <AddButton />
  </InputArea>
  <Separator />
  <MoodList>  {/* 底部列表区 - 从底部插入 */}
    {addedMoods.map(mood => <MoodChip />)}
  </MoodList>
</MoodInputSection>
```

### 1.3 身体感受组件重构

**Icon 差异化设计**：
| 部位 | 图标 |
|------|------|
| 头部/颈部 | `Brain` 或自定义 SVG |
| 胸部/肺部 | `Heart` |
| 消化系统 | `Activity` |
| 肌肉/骨骼 | `Bone` (自定义) |
| 全身/睡眠 | `Moon` |

**布局**：
```
┌─────────────────────────────────────┐
│ 症状选择区 (上方)                    │
├─────────────────────────────────────┤
│ 已选症状列表 (中部)                  │
├─────────────────────────────────────┤
│ 感知状态栏 (左侧底部)                │
└─────────────────────────────────────┘
```

---

## 2. 日记解读界面优化

### 2.1 模块顺序调整

**当前顺序**：
1. 核心情绪波动
2. 认知评估
3. 宇宙背景
4. 荣格洞察
5. 执行建议

**目标顺序**：
1. 核心情绪波动
2. **平衡性见地** (新增位置)
3. 认知评估
4. **占星解读** (原"宇宙背景")
5. 荣格洞察
6. 执行建议

### 2.2 样式规范

| 元素 | 当前 | 目标 |
|------|------|------|
| 星座信息字体 | 放大 | 与正文一致 |
| 星座信息排版 | 段落 | 逐条罗列 (bullet list) |
| 详细解读字数 | 1x | 1.5x |
| 详细解读样式 | 斜体 | 正常字重 |
| 平衡性见地框高 | 1x | 0.8x |

### 2.3 组件修改

```tsx
// ReportDashboard.tsx 渲染顺序
<>
  <EmotionWaveSection />
  <BalancedPerspectiveSection style={{ padding: '0.8em' }} />  {/* 调整高度 */}
  <CognitiveAssessmentSection />
  <AstroInterpretationSection title={t.journal.astro_reading} />  {/* 改名 */}
  <JungianInsightSection />
  <ActionableStepsSection />
</>
```

---

## 3. 统计功能增强

### 3.1 月度数据过滤

```typescript
// AnalysisViews.tsx
const filterCurrentMonth = (records: CBTRecord[], currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  return records.filter(r => {
    const recordDate = new Date(r.createdAt);
    return recordDate.getFullYear() === year && recordDate.getMonth() === month;
  });
};
```

### 3.2 情绪分类映射优化

**当前问题**：大量情绪归类为"其他未分类"

**解决方案**：扩展映射表
```typescript
const MOOD_CATEGORY_MAP: Record<string, string> = {
  // 积极情绪
  'happy': 'positive',
  'joyful': 'positive',
  'excited': 'positive',
  'grateful': 'positive',
  'content': 'positive',
  // 消极情绪
  'sad': 'negative',
  'angry': 'negative',
  'frustrated': 'negative',
  'anxious': 'anxiety',
  'worried': 'anxiety',
  'nervous': 'anxiety',
  // 中性情绪
  'calm': 'neutral',
  'tired': 'neutral',
  // 兜底
  'default': 'other'
};
```

### 3.3 情绪配方圆环配色

```typescript
const MOOD_COLORS: Record<EmojiMood, string> = {
  very_happy: '#FFD93D',  // 黄色
  happy: '#4ADE80',       // 绿色
  okay: '#60A5FA',        // 蓝色
  annoyed: '#FB923C',     // 橙色
  terrible: '#F87171',    // 红色
};

// Recharts PieChart 配置
<Pie dataKey="value">
  {data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.mood]} />
  ))}
</Pie>
<Tooltip formatter={(value, name) => [value, t.journal[`mood_${name}`]]} />
```

---

## 4. Prompt 优化策略

### 4.1 执行建议 Prompt 改进

**当前问题**：内容过于专业，如：
- "土星（结构）与海王星（灵感）在第六宫合相的能量"
- "智者原型笔触"

**优化方向**：
1. 移除括号内的专业术语解释
2. 用具体行动替代抽象概念
3. 提供分步指引

**Prompt 修改**：
```
输出要求：
- 占星整合冥想：提供具体的冥想步骤（3-5步），用日常语言描述，避免使用"宫位"、"合相"等术语
- 阴影对话：给出具体的自我对话示例，用"你可以对自己说..."的格式
- 所有建议需面向没有占星学基础的用户
```

### 4.2 统计分析 Prompt 增强

**新增要求**：
```
分析时结合以下信息：
1. 用户本命盘配置（太阳、月亮、上升星座）
2. 当前行运行星位置
3. 月相信息

输出时：
- 身体调节处方：具体说明为什么推荐该练习（2-3句）
- 星象觉察提醒：用日常语言解释当前星象如何影响情绪
```

---

## 5. 主题兼容性

### 5.1 图标颜色方案

```typescript
const getIconColor = (theme: Theme) => ({
  delete: theme === 'dark' ? '#F87171' : '#DC2626',
  progress: theme === 'dark' ? '#60A5FA' : '#2563EB',
  muted: theme === 'dark' ? '#94A3B8' : '#64748B',
});
```

### 5.2 进度条样式

```css
/* Dark mode */
.progress-bar-dark {
  background: rgba(96, 165, 250, 0.2);
}
.progress-bar-dark .fill {
  background: #60A5FA;
}

/* Light mode */
.progress-bar-light {
  background: rgba(37, 99, 235, 0.1);
}
.progress-bar-light .fill {
  background: #2563EB;
}
```

---

## 6. i18n 标题优化

### 6.1 写日记步骤标题

| 步骤 | 当前 (zh) | 优化后 (zh) |
|------|-----------|-------------|
| 1 | 情境描述 | 发生了什么？ |
| 2 | 我的感受 | 你现在的感受 |
| 3 | 身体反应 | 身体有什么反应？ |
| 4 | 脑内想法 | 脑子里在想什么？ |
| 5 | 最痛苦的念头 | 最困扰你的想法 |
| 6 | 支持证据 | 支持这个想法的证据 |
| 7 | 反驳证据 | 反驳这个想法的证据 |
| 8 | 平衡性见地 | 换个角度看 |
| 9 | 情绪变化 | 现在感觉如何？ |
| 10 | 保存记录 | 保存今天的记录 |

---

## 7. 数据流

```
用户填写 CBT 向导
        │
        ▼
前端组件更新 (CBTWizard.tsx)
        │
        ▼
提交分析请求
        │
        ▼
后端 API (api/cbt.ts)
        │
        ├──► 获取本命盘数据 (ephemerisService)
        │
        ├──► 获取当日行运 (ephemerisService)
        │
        └──► 调用 AI (prompts/manager.ts - cbt-analysis)
                │
                ▼
        返回结构化分析结果
                │
                ▼
前端展示 (ReportDashboard.tsx)
        │
        ▼
统计视图 (AnalysisViews.tsx)
        │
        ├──► 过滤当月数据
        │
        ├──► 情绪分类映射
        │
        └──► 图表渲染 (Recharts)
```

---

## 8. 测试要点

1. **月份按钮**：点击各种月份（包括边界月份）无报错
2. **写日记流程**：10 步完整走通，布局符合设计
3. **日记解读**：模块顺序正确，样式符合规范
4. **统计功能**：仅显示当月数据，圆环彩色正确
5. **主题切换**：dark/light 模式下所有图标清晰可见
6. **AI 内容**：执行建议面向小白用户，无专业术语
