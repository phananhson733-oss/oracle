<!-- INPUT: 技术设计决策。 -->
<!-- OUTPUT: 架构与实现方案。 -->
<!-- POS: OpenSpec 设计文档。 -->

# 设计决策

## 1. 数据同步策略

### 问题
CBT 记录需要同时支持后端持久化和 localStorage 缓存，以提供离线可用性和快速加载。

### 方案
采用 **"后端优先，本地缓存"** 策略：

```
初始化加载:
1. 显示加载状态
2. 尝试 fetchCBTRecords(userId)
3. 成功 → 更新 state + 写入 localStorage
4. 失败 → 回退读取 localStorage
5. 都无数据 → 显示空状态引导

保存记录:
1. 更新本地 state
2. 写入 localStorage（即时反馈）
3. 异步调用 saveCBTRecord(userId, record)
4. 失败 → 显示提示，数据仍保留在本地
```

### 用户 ID 来源
使用 `profile.name + profile.birthDate` 生成简单 hash 作为 userId，或使用 localStorage 中存储的 `astro_user` 信息。

## 2. 设计 Token 迁移

### 当前 CBT 配色
```css
/* 主背景 */
bg-[#050505]
/* 强调色 */
from-indigo-500 to-fuchsia-600
/* 文字 */
text-slate-200
```

### 目标配色（与主应用一致）
```css
/* 主背景 */
bg-space-950 (dark) / bg-[#F7F8FA] (light)
/* 强调色 */
text-gold-500, bg-gold-500/10, border-gold-500/30
/* 文字 */
text-star-50 (dark) / text-[#0B0F17] (light)
/* 成功/危险 */
text-success / text-danger
```

### 迁移策略
1. 引入 `useTheme()` hook 获取当前主题
2. 使用条件类名支持 dark/light 模式
3. 保留渐变效果，但改用 gold/accent 色系

## 3. Oracle 无滚动布局

### 当前问题
- 问题矩阵使用 `mb-32` 创建底部间距
- 输入区域使用 `fixed bottom-8` 定位
- 类别标签和问题矩阵内容过多导致滚动

### 解决方案
采用 **Flexbox 垂直布局 + 约束高度**：

```
Container (h-screen flex flex-col)
├── Header (flex-shrink-0)
├── Categories (flex-shrink-0, max-h-[120px])
├── Questions (flex-1, overflow-hidden, grid layout)
└── Input Area (flex-shrink-0, relative positioning)
```

关键调整：
1. 移除 `fixed` 定位，改用 flex 布局
2. 问题区域使用 `flex-1 overflow-hidden`
3. 减少问题显示数量或使用更紧凑布局
4. 类别使用单行横向滚动（`overflow-x-auto`）

### 响应式考虑
- 桌面：2 列问题矩阵
- 平板：2 列问题矩阵，类别换行
- 手机：1 列问题矩阵，类别横向滚动

## 4. Rituals 计数器位置

### 当前位置
```tsx
<div className="absolute top-4 right-4 ...">
  RITUALS: 3/3
</div>
```

### 目标位置
与发送按钮合并，放在输入区域右侧：

```tsx
<div className="flex items-center gap-4 pr-4 pl-4 border-l ...">
  <span className="text-[10px] font-mono text-gold-500 opacity-80">3/3</span>
  <button onClick={handleAsk} ...>
    {/* send icon */}
  </button>
</div>
```

或作为发送按钮的 badge：
```tsx
<button className="relative ...">
  <span className="absolute -top-1 -right-1 text-[8px] bg-gold-500 text-space-950 px-1 rounded">3</span>
  {/* send icon */}
</button>
```

## 5. Oracle 密度与留白策略

### 目标
- 顶部预留约 24px，底部预留约 4–6px
- 问题卡片与输入栏高度/内边距缩小至约 80%
- 类别与问题区域间距缩小，同时拉大标题区与问题区的距离

### 方案
采用固定顶部/底部留白 + flex 布局压缩：

```
Container (h-screen flex flex-col pt-6 pb-1)
├── Header (shrink-0, margin-bottom 拉大)
├── Categories (shrink-0, gap 更紧凑)
├── Questions (flex-1, grid row-gap 缩小)
└── Input Action (shrink-0, 高度缩短)
```

### 高亮策略
- 点击问题卡片后，卡片使用边框/背景发光高亮
- 通过状态 class 控制选中样式

## 6. Oracle Loading 全屏体验

### 目标
- 发送后切换为全屏 loading
- 使用双层 SVG（底层低透明星盘慢旋转，上层行星/高亮环快旋转）
- 动态短语轮播（10–20 条）

### 方案
1. `loading` 状态时切换渲染树，隐藏问答列表
2. 新增 SVG 组件，包含两层旋转：
   - `orbit-base`：低透明度、慢速旋转
   - `orbit-highlight`：高亮节点、快速反向旋转
3. 短语数组放在 `constants.ts`，使用定时器每 3–4 秒切换
4. 文案随语言切换，长度约 8–12 字/词

## 7. Oracle 标题与在线指示

### 目标
- 标题改为 ORACLE/神谕
- 在线提示点改为绿色呼吸灯

### 方案
在标题区域插入绿色圆点 + `breathing` 动画：

```
@keyframes breathe {
  0% { opacity: .4; box-shadow: 0 0 0 0 rgba(16,185,129,.5); }
  50% { opacity: 1; box-shadow: 0 0 0 6px rgba(16,185,129,.15); }
  100% { opacity: .4; box-shadow: 0 0 0 0 rgba(16,185,129,.5); }
}
```

## 8. CBT 日历单屏展示

### 目标
- 单屏显示完整 31 天
- 无滚动
- 顶部线框与底部现况留 2px 间距

### 方案
1. 缩小 `aspect-square` 单元尺寸与网格 gap
2. 适度缩小 padding（从 8 → 4）
3. 通过固定容器高度 + 2px 上下缓冲保证对齐

## 9. CBT 文案与报告结构调整

### 目标
- 写日记流程标题更直白
- 报告模块单列纵向展示
- 顶部情绪提示文字可见
- 风格对齐“探索自我”页面

### 方案
1. 在 `constants.ts` 中替换 step 标题与引导语
2. 报告布局从 `md:grid-cols-2` 改为单列
3. 调整报告头部 padding，避免情绪标题被裁切
4. 统一字体层级与间距（参考探索自我）
