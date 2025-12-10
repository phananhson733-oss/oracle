# 设计规范文档（Design Specification Document）

## 1. 设计概述

### 1.1 设计理念
- **核心风格**：神秘极简主义（Mystical Minimalism）
- **视觉基调**：Co-Star的极简克制 + 深空宇宙的神秘氛围
- **差异化**：通过星尘背景和暖金点缀增加神秘气质，比Co-Star更有"仪式感"

### 1.2 目标用户
- 追求深度自我探索的现代都市人群
- 对心理占星感兴趣且愿意为高质量洞察付费的用户
- 审美偏好：简约、神秘、专业

### 1.3 设计原则
1. **克制优雅**：大量留白，信息层级清晰，避免视觉噪音
2. **神秘深邃**：深空背景 + 星点粒子，营造凝视宇宙的沉浸感
3. **暖金点睛**：关键交互元素使用暖金色，形成视觉焦点
4. **轻量流畅**：微交互为主，不打断用户阅读节奏

---

## 2. 视觉设计规范

### 2.1 色彩系统

#### 主色调
| 名称 | 色值 | 用途 |
|:-----|:-----|:-----|
| Void Black | `#0A0A0B` | 主背景色 |
| Deep Space | `#121214` | 卡片/容器背景 |
| Cosmic Gray | `#1A1A1D` | 次级背景/分割 |

#### 中性色（文字/边框）
| 名称 | 色值 | 用途 |
|:-----|:-----|:-----|
| Pure White | `#FFFFFF` | 主标题/重要文字 |
| Soft White | `#E8E8E8` | 正文文字 |
| Muted Gray | `#9CA3AF` | 次要文字/说明 |
| Dim Gray | `#4B5563` | 禁用状态/占位符 |
| Border Gray | `#2D2D30` | 边框/分割线 |

#### 点缀色（暖金系）
| 名称 | 色值 | 用途 |
|:-----|:-----|:-----|
| Warm Gold | `#D4AF37` | 主要强调色/CTA按钮 |
| Light Gold | `#F4D03F` | Hover状态/高亮 |
| Soft Gold | `#D4AF37` + 20% opacity | 背景点缀/光晕 |
| Gold Glow | `0 0 20px rgba(212, 175, 55, 0.3)` | 发光效果 |

#### 功能色
| 名称 | 色值 | 用途 |
|:-----|:-----|:-----|
| Harmony Green | `#10B981` | 成功/和谐相位（拱/六合） |
| Friction Red | `#EF4444` | 错误/紧张相位（冲/刑） |
| Neutral Blue | `#3B82F6` | 信息/中性相位（合） |
| Warning Amber | `#F59E0B` | 警告/逆行标记 |

#### 星盘专用色
| 名称 | 色值 | 用途 |
|:-----|:-----|:-----|
| Natal Gold | `#D4AF37` | 本命盘行星/内圈 |
| Transit Silver | `#C0C0C0` | 行运盘行星/外圈 |
| Aspect Line | `#FFFFFF` + 40% opacity | 相位连线 |

### 2.2 字体规范

#### 字体族
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
```

#### 标题字体
| 层级 | 字号 | 字重 | 行高 | 用途 |
|:-----|:-----|:-----|:-----|:-----|
| H1 | 48px | 300 (Light) | 1.2 | Landing主标题 |
| H2 | 32px | 400 (Regular) | 1.3 | 页面标题 |
| H3 | 24px | 500 (Medium) | 1.4 | 区块标题 |
| H4 | 18px | 500 (Medium) | 1.4 | 卡片标题 |

#### 正文字体
| 类型 | 字号 | 字重 | 行高 | 用途 |
|:-----|:-----|:-----|:-----|:-----|
| Body Large | 16px | 400 | 1.6 | 主要正文 |
| Body | 14px | 400 | 1.5 | 一般正文 |
| Body Small | 12px | 400 | 1.5 | 辅助说明 |
| Caption | 10px | 500 | 1.4 | 标签/徽章 |

#### 特殊字体
| 类型 | 字号 | 字重 | 用途 |
|:-----|:-----|:-----|:-----|
| Mono Data | 14px | 400 | 日期/时间/坐标显示 |
| Mono Small | 12px | 400 | 进度指示器/技术数据 |

### 2.3 布局系统

#### 栅格系统
- **最大宽度**：1440px
- **列数**：12列
- **列间距**：24px
- **边距**：Desktop 64px / Tablet 32px

#### 间距规范（8px基准）
| Token | 值 | 用途 |
|:------|:---|:-----|
| space-1 | 4px | 紧凑间距 |
| space-2 | 8px | 元素内间距 |
| space-3 | 12px | 小组件间距 |
| space-4 | 16px | 标准间距 |
| space-5 | 24px | 区块间距 |
| space-6 | 32px | 大区块间距 |
| space-8 | 48px | 页面区块间距 |
| space-10 | 64px | 主要区块分隔 |

#### 圆角规范
| Token | 值 | 用途 |
|:------|:---|:-----|
| radius-sm | 4px | 小按钮/标签 |
| radius-md | 8px | 输入框/小卡片 |
| radius-lg | 12px | 卡片/容器 |
| radius-xl | 16px | 大卡片/模态框 |
| radius-full | 9999px | 圆形按钮/头像 |

#### 阴影系统
```css
/* 卡片阴影 */
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);

/* 悬浮阴影 */
--shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.5);

/* 金色光晕 */
--shadow-gold: 0 0 20px rgba(212, 175, 55, 0.3);

/* 内发光 */
--shadow-inner-glow: inset 0 0 60px rgba(212, 175, 55, 0.05);
```

---

## 3. 交互设计规范

### 3.1 导航系统

#### 主导航（侧边栏/底部栏）
- **位置**：桌面端左侧固定，宽度 72px（收起）/ 240px（展开）
- **图标**：24x24px，描边风格，1.5px线宽
- **选中态**：图标变为暖金色，左侧 3px 金色指示条
- **悬停态**：背景 `#1A1A1D`，图标微亮

#### 页面内导航（Tab）
- **样式**：下划线式，选中态金色下划线 2px
- **间距**：Tab间距 32px
- **动画**：下划线滑动过渡 200ms ease

#### 面包屑
- **分隔符**：`/` 或 `>`
- **当前页**：白色，历史页灰色可点击

### 3.2 交互反馈

#### 按钮状态
| 状态 | 主按钮（金色） | 次按钮（描边） | 文字按钮 |
|:-----|:--------------|:--------------|:---------|
| Default | bg: `#D4AF37`, text: `#0A0A0B` | border: `#2D2D30`, text: `#E8E8E8` | text: `#9CA3AF` |
| Hover | bg: `#F4D03F`, shadow: gold-glow | border: `#D4AF37`, text: `#D4AF37` | text: `#FFFFFF` |
| Active | bg: `#B8960F`, scale: 0.98 | bg: `#D4AF37` + 10%, scale: 0.98 | text: `#D4AF37` |
| Disabled | bg: `#4B5563`, text: `#9CA3AF` | border: `#2D2D30`, text: `#4B5563` | text: `#4B5563` |

#### 输入框状态
| 状态 | 样式 |
|:-----|:-----|
| Default | bg: `#121214`, border: `#2D2D30`, text: `#E8E8E8` |
| Focus | border: `#D4AF37`, shadow: `0 0 0 2px rgba(212,175,55,0.2)` |
| Error | border: `#EF4444`, shadow: `0 0 0 2px rgba(239,68,68,0.2)` |
| Disabled | bg: `#0A0A0B`, text: `#4B5563` |

#### 加载状态
- **全局Loading**：中央旋转星盘图标，缓慢旋转（3s/圈）
- **局部Loading**：骨架屏（Skeleton），深灰色脉冲动画
- **按钮Loading**：文字替换为旋转圆环

#### 错误提示
- **Toast**：底部居中，红色左边框，3秒自动消失
- **表单错误**：输入框下方红色文字，shake动画

### 3.3 动效规范

#### 过渡效果
```css
/* 标准过渡 */
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;

/* 页面切换 */
--transition-page: 400ms cubic-bezier(0.4, 0, 0.2, 1);
```

#### 微交互
| 交互 | 动效 |
|:-----|:-----|
| 按钮Hover | scale: 1.02, 150ms |
| 按钮Click | scale: 0.98, 100ms |
| 卡片Hover | translateY: -2px, shadow加深, 200ms |
| 链接Hover | 下划线从左滑入, 200ms |
| 图标Hover | 颜色渐变至金色, 150ms |

#### 入场动画
| 元素 | 动效 |
|:-----|:-----|
| 页面 | fadeIn + translateY(20px → 0), 400ms |
| 卡片列表 | stagger入场，每项延迟50ms |
| 模态框 | fadeIn + scale(0.95 → 1), 200ms |
| 抽屉 | slideIn from right, 300ms |

#### 特殊动效
| 场景 | 动效 |
|:-----|:-----|
| Landing轨道 | 内圈顺时针20s/圈，外圈逆时针40s/圈 |
| 星点背景 | 微弱闪烁，随机延迟，opacity 0.3-0.8 |
| 金色光晕 | 呼吸效果，opacity脉冲，4s周期 |
| Oracle Loading | 星盘缓慢旋转 + 咒语文字淡入淡出 |

---

## 4. 组件设计规范

### 4.1 基础组件

#### 按钮组件
```
Primary Button (金色填充)
├── 高度: 44px (默认) / 36px (小) / 52px (大)
├── 内边距: 16px 24px
├── 圆角: 8px
├── 字体: 14px Medium
└── 图标: 20px, 间距8px

Secondary Button (描边)
├── 同上尺寸
├── 边框: 1px solid #2D2D30
└── 背景: transparent

Ghost Button (文字)
├── 无边框无背景
└── Hover显示浅色背景
```

#### 输入组件
```
Text Input
├── 高度: 44px
├── 内边距: 12px 16px
├── 背景: #121214
├── 边框: 1px solid #2D2D30
├── 圆角: 8px
├── 字体: 14px Regular
└── 占位符: #4B5563

Large Input (Onboarding专用)
├── 高度: 64px
├── 字体: 24px Light
├── 边框: 仅底部 1px
└── 背景: transparent
```

#### 卡片组件
```
Standard Card
├── 背景: #121214
├── 边框: 1px solid #2D2D30
├── 圆角: 12px
├── 内边距: 24px
├── 阴影: shadow-card
└── Hover: translateY(-2px), shadow-hover

Insight Card (洞察卡片)
├── 同上 + 左侧4px色条
├── Power: #10B981 (绿)
├── Pressure: #EF4444 (红)
├── Trouble: #F59E0B (黄)
└── Enjoy: #D4AF37 (金)
```

#### 标签组件
```
Tag / Badge
├── 高度: 24px
├── 内边距: 4px 8px
├── 圆角: 4px
├── 字体: 12px Medium
├── 背景: #1A1A1D
└── 边框: 1px solid #2D2D30

Status Badge
├── 圆形: 8px直径
├── 在线: #10B981
├── 逆行: #EF4444
└── 脉冲动画
```

### 4.2 业务组件

#### 星盘组件 (AstrologyChart)
```
结构:
├── 外圈: 黄道12星座环
│   ├── 宽度: 40px
│   ├── 分割线: 1px #2D2D30
│   └── 星座符号: 16px, #9CA3AF
├── 中圈: 宫位区域
│   ├── 宫位线: 1px #2D2D30
│   └── 宫位号: 12px, #4B5563
├── 内圈: 行星位置
│   ├── 本命行星: #D4AF37 (金)
│   ├── 行运行星: #C0C0C0 (银)
│   └── 行星符号: 14px
└── 相位线:
    ├── 拱/六合: #10B981, 1px
    ├── 冲/刑: #EF4444, 1px
    └── 合相: #3B82F6, 1px

尺寸:
├── Dashboard: 400-600px (响应式)
├── Profile: 500-700px
└── 最小: 300px
```

#### 相位网格 (AspectGrid)
```
结构: 下三角矩阵
├── 格子尺寸: 32x32px
├── 行星标签: 左侧和顶部
├── 相位符号: 居中显示
└── 颜色编码:
    ├── 拱/六合: bg #10B981/10
    ├── 冲/刑: bg #EF4444/10
    └── 合相: bg #3B82F6/10

交互:
├── Hover: 高亮整行整列
└── Click: 显示详情Tooltip
```

#### 元素平衡表 (ElementalMatrix)
```
结构: 4x3表格
├── 行: Fire / Earth / Air / Water
├── 列: Cardinal / Fixed / Mutable
├── 格子: 显示落入的行星符号
└── 空格: 显示 "-"

视觉:
├── 元素图标: 24px, 对应颜色
├── Fire: #EF4444
├── Earth: #10B981
├── Air: #3B82F6
└── Water: #8B5CF6
```

#### 时间轴选择器 (TimelineSelector)
```
结构: 水平滚动
├── 日期项: 64px宽
├── 选中态: 金色背景, 白色文字
├── 今日: "Today"标签
└── 范围: ±3天

交互:
├── 点击切换
├── 滑动切换 (触摸设备)
└── 选中动画: scale + 背景渐变
```

#### 维度卡片 (DimensionCard)
```
结构:
├── 图标: 32px, 对应颜色
├── 标题: 16px Medium
├── 摘要: 14px, 2行截断
├── 强度指示: 进度条或星级
└── 箭头: 指示可展开

类型:
├── Emotion: 💧 #8B5CF6
├── Interaction: ❤️ #EF4444
├── Work: ⚡ #F59E0B
└── Karma: 🌙 #3B82F6

交互:
├── Hover: 边框变金色
└── Click: 打开右侧抽屉
```

#### 深度分析抽屉 (DetailDrawer)
```
结构:
├── 宽度: 480px
├── 背景: #0A0A0B
├── 头部: 标题 + 关闭按钮
├── 内容区: 滚动
│   ├── Summary
│   ├── Key Influences (占星依据)
│   └── Advice (行动建议)
└── 底部: 付费解锁按钮 (如需)

动画:
├── 入场: slideIn from right, 300ms
├── 遮罩: fadeIn, 200ms
└── 关闭: 点击遮罩或X按钮
```

---

## 5. 页面设计详细说明

| 页面名称 | 页面目标 | 布局结构 | 关键元素 | 交互逻辑 | 状态变化 |
|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|
| Landing | 建立神秘感，吸引进入 | 全屏居中，深空背景 | 双轨道动画、Logo、标题、Enter按钮 | 点击按钮跳转Onboarding | 有Token时自动跳过 |
| Onboarding | 收集出生数据 | 全屏居中，三步流程 | 进度指示器、大输入框、Proceed/Seal按钮 | 逐步填写，最后提交 | Step 1→2→3，动画切换 |
| Dashboard | 展示每日宇宙天气 | 头部+左右分栏 | 身份头部、双圆盘、四象限卡片、宜忌列表 | 点击View Details跳转Profile | 每日内容缓存 |
| Profile-Natal | 展示本命星盘 | Tab切换，上中下三区 | 星盘、洞察卡片、相位网格、元素表、行星列表 | Hover/点击查看详情 | 深度洞察需付费 |
| Profile-Updates | 展示行运影响 | Tab切换，时间轴+内容 | 时间轴、双圆盘、天象列表、4维度卡片 | 切换日期、点击卡片开抽屉 | ±3天切换，深度分析付费 |
| Synastry-Selection | 选择分析对象 | 列表+底部控制栏 | 灵魂卡片列表、+Add按钮、关系类型、Analyze按钮 | 选2人后点击分析 | 选中高亮，按钮激活 |
| Synastry-Report | 展示关系分析 | 5Tab切换 | Tab导航、各视图内容、详情抽屉 | Tab切换、点击开抽屉 | Snapshot付费，其余免费 |
| Oracle | AI占星问答 | 状态机切换 | 分类Tab、灵感矩阵、输入框、结果展示 | 提问→Loading→结果→封印 | idle/loading/result三态 |
| Settings | 用户配置 | 左右分栏 | 身份信息、语言切换、Save按钮 | 修改后Save | 脏检查，Save高亮 |

---

## 6. 特殊视觉效果

### 6.1 深空背景
```css
.bg-void {
  background:
    radial-gradient(ellipse at center, #121214 0%, #0A0A0B 100%);
}

.bg-stars {
  background-image:
    radial-gradient(2px 2px at 20px 30px, #ffffff20, transparent),
    radial-gradient(2px 2px at 40px 70px, #ffffff15, transparent),
    radial-gradient(1px 1px at 90px 40px, #ffffff25, transparent),
    radial-gradient(2px 2px at 130px 80px, #ffffff10, transparent);
  background-size: 200px 200px;
  animation: twinkle 4s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
```

### 6.2 金色光晕
```css
.gold-glow {
  box-shadow:
    0 0 20px rgba(212, 175, 55, 0.3),
    0 0 40px rgba(212, 175, 55, 0.1);
}

.gold-glow-pulse {
  animation: glow-pulse 4s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(212, 175, 55, 0.4);
  }
}
```

### 6.3 轨道动画
```css
.orbit-inner {
  animation: spin 20s linear infinite;
}

.orbit-outer {
  animation: spin 40s linear infinite reverse;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 6.4 噪点纹理
```css
.noise-overlay {
  background-image: url("data:image/svg+xml,..."); /* SVG噪点 */
  opacity: 0.03;
  pointer-events: none;
}
```

---

## 7. 响应式设计

### 7.1 断点设置
| 断点 | 宽度 | 说明 |
|:-----|:-----|:-----|
| Desktop XL | ≥1440px | 最大宽度布局 |
| Desktop | ≥1024px | 标准桌面布局 |
| Tablet | ≥768px | 平板适配（预留） |
| Mobile | <768px | 暂不支持 |

### 7.2 布局适配（Desktop）
| 组件 | 1440px+ | 1024-1439px |
|:-----|:--------|:------------|
| 侧边导航 | 240px展开 | 72px收起 |
| 内容区 | 最大1200px | 自适应 |
| 星盘尺寸 | 600px | 400-500px |
| 卡片列表 | 3列 | 2列 |

---

## 8. 开发交付说明

### 8.1 设计资产
```
/assets
├── /icons          # Lucide图标库 + 自定义图标
├── /zodiac         # 12星座SVG符号
├── /planets        # 10+行星SVG符号
├── /aspects        # 5+相位SVG符号
├── /elements       # 4元素图腾SVG
└── /ui             # Logo、装饰性图形
```

### 8.2 技术建议
- **框架**：React 18+
- **样式**：Tailwind CSS + CSS Variables
- **动画**：Framer Motion
- **图表**：D3.js (星盘SVG渲染)
- **图标**：Lucide React
- **字体**：Inter (Google Fonts)

### 8.3 Tailwind配置建议
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#0A0A0B',
          light: '#121214',
          lighter: '#1A1A1D',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F4D03F',
          glow: 'rgba(212, 175, 55, 0.3)',
        },
        harmony: '#10B981',
        friction: '#EF4444',
        neutral: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'spin-slower': 'spin 40s linear infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
      },
    },
  },
}
```

### 8.4 实现注意事项
1. **星盘渲染**：使用SVG + D3.js，确保矢量清晰
2. **性能优化**：星点背景使用CSS而非Canvas，减少重绘
3. **动画性能**：使用transform和opacity，避免触发重排
4. **字体加载**：Inter字体预加载，避免FOUT
5. **暗色模式**：全站暗色，无需切换
6. **无障碍**：确保对比度符合WCAG AA标准（金色文字需注意）

---

*文档版本：v1.0*
*最后更新：2025-12-10*
*设计风格：神秘极简主义（Mystical Minimalism）*
*参考：Co-Star + 深空宇宙意象*
