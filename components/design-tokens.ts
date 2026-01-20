// INPUT: 设计系统 Token 定义
// OUTPUT: 导出所有设计 token 常量（颜色、间距、圆角、动画等）
// POS: 设计系统核心配置文件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

/**
 * 占星智慧设计系统 Token
 *
 * 设计理念："线性黑 x 暗金" - 现代感、易读性、神秘感
 *
 * 使用指南：
 * 1. 所有组件应使用此文件中的 token，而非硬编码值
 * 2. 主题切换通过 CSS 变量实现，此处定义语义化类名
 * 3. 遵循 8pt 网格系统进行间距设计
 */

// ============================================
// 圆角系统 (Border Radius)
// ============================================
export const RADIUS = {
  sm: 'rounded',        // 4px - 小型元素（tag, chip）
  md: 'rounded-lg',     // 8px - 输入框、小按钮
  lg: 'rounded-xl',     // 12px - 卡片、中型容器
  xl: 'rounded-2xl',    // 16px - 大型卡片、面板
  '2xl': 'rounded-3xl', // 24px - 超大容器、全屏弹窗
  full: 'rounded-full', // 圆形
} as const;

// ============================================
// 间距系统 (Spacing) - 8pt 网格
// ============================================
export const SPACING = {
  // 基础间距
  xs: '2',    // 8px
  sm: '3',    // 12px
  md: '4',    // 16px
  lg: '6',    // 24px
  xl: '8',    // 32px
  '2xl': '12', // 48px

  // 组件内边距
  card: 'p-6',           // 卡片内边距
  cardCompact: 'p-4',    // 紧凑卡片
  section: 'mb-12',      // 区块间距
  sectionCompact: 'mb-8', // 紧凑区块间距

  // 间隙
  gapXs: 'gap-1.5',      // 6px
  gapSm: 'gap-2',        // 8px
  gapMd: 'gap-3',        // 12px
  gapLg: 'gap-4',        // 16px
  gapXl: 'gap-6',        // 24px
} as const;

// ============================================
// 动画时长 (Animation Duration)
// ============================================
export const DURATION = {
  fast: 'duration-150',   // 快速交互（按钮、hover）
  normal: 'duration-300', // 常规过渡（展开、切换）
  slow: 'duration-500',   // 慢速动画（页面过渡）
  loading: 'duration-1000', // 加载动画
} as const;

// ============================================
// 缓动函数 (Easing)
// ============================================
export const EASING = {
  default: 'ease-out',
  smooth: 'ease-in-out',
  bouncy: 'cubic-bezier(0.16, 1, 0.3, 1)', // 用于 slide-up
} as const;

// ============================================
// 边框透明度 (Border Opacity)
// ============================================
export const BORDER_OPACITY = {
  subtle: '/10',    // 最弱 - 背景分隔
  light: '/20',     // 轻度 - 卡片边框
  medium: '/30',    // 中度 - hover 状态
  strong: '/50',    // 强调 - 焦点边框
  solid: '/70',     // 实线 - 激活状态
} as const;

// ============================================
// 背景透明度 (Background Opacity)
// ============================================
export const BG_OPACITY = {
  subtle: '/5',     // 微弱背景
  light: '/10',     // 轻度背景
  medium: '/20',    // 中度背景（hover）
  strong: '/40',    // 强调背景
  solid: '/60',     // 实心背景（卡片）
} as const;

// ============================================
// 阴影系统 (Shadows)
// ============================================
export const SHADOW = {
  none: 'shadow-none',
  sm: 'shadow-sm',           // 微小阴影
  card: 'shadow-card',       // 卡片阴影
  glow: 'shadow-glow',       // 金色光晕
  '2xl': 'shadow-2xl',       // 大阴影（模态框）
} as const;

// ============================================
// 字体大小层级 (Font Size Scale)
// ============================================
export const FONT_SIZE = {
  // UI 元素
  caption: 'text-[10px]', // 标签、徽章
  label: 'text-xs',       // 按钮、标签 (12px)
  body: 'text-sm',        // 正文 (14px)
  bodyLg: 'text-base',    // 大正文 (16px)

  // 标题
  h6: 'text-base',        // 小标题 (16px)
  h5: 'text-lg',          // 节标题 (18px)
  h4: 'text-xl',          // 区块标题 (20px)
  h3: 'text-2xl',         // 页面副标题 (24px)
  h2: 'text-3xl',         // 页面标题 (30px)
  h1: 'text-4xl',         // 主标题 (36px)

  // 展示
  display: 'text-5xl',    // 大数字/英雄区 (48px)
  hero: 'text-6xl',       // 超大展示 (60px)
} as const;

// ============================================
// 字重层级 (Font Weight)
// ============================================
export const FONT_WEIGHT = {
  normal: 'font-normal',    // 400 - 正文
  medium: 'font-medium',    // 500 - 强调
  semibold: 'font-semibold', // 600 - 标题
  bold: 'font-bold',        // 700 - 重点标题
  black: 'font-black',      // 900 - 超级强调
} as const;

// ============================================
// 深色模式类名映射 (Dark Mode Classes)
// ============================================
export const THEME_CLASSES = {
  dark: {
    container: 'bg-space-950 text-star-50',
    card: 'bg-space-900/60 border border-space-700/70 shadow-card backdrop-blur-lg',
    cardHover: 'hover:border-accent/50 hover:bg-space-900/70',
    input: 'bg-space-900/70 border-gold-500/20 text-star-50 placeholder-star-400/60',
    heading: 'text-star-50',
    body: 'text-star-200',
    muted: 'text-star-400',
    divider: 'border-gold-500/15',
    accent: 'text-accent',
    accentBg: 'bg-accent/10',
  },
  light: {
    container: 'bg-paper-100 text-paper-900',
    card: 'bg-paper-100/85 border border-paper-300/80 shadow-sm backdrop-blur',
    cardHover: 'hover:border-accent/40 hover:bg-paper-100/70',
    input: 'bg-white/90 border-paper-300 text-paper-900 placeholder-paper-400',
    heading: 'text-paper-900',
    body: 'text-paper-400',
    muted: 'text-paper-400',
    divider: 'border-paper-300',
    accent: 'text-accent',
    accentBg: 'bg-accent/10',
  },
} as const;

// ============================================
// 焦点样式 (Focus Styles)
// ============================================
export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-space-950';

// ============================================
// 移动端触摸目标 (Touch Target)
// ============================================
export const TOUCH_TARGET = 'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0';
export const TOUCH_TARGET_ALWAYS = 'min-h-[44px] min-w-[44px]';

// ============================================
// 可访问性 (Accessibility)
// ============================================
export const MOTION_REDUCE = 'motion-reduce:transition-none motion-reduce:animate-none';

// ============================================
// 常用组合类 (Utility Combinations)
// ============================================
export const UTILITY = {
  // 截断文本
  truncate: 'truncate',
  lineClamp2: 'line-clamp-2',
  lineClamp3: 'line-clamp-3',

  // 滚动条隐藏
  noScrollbar: 'no-scrollbar',

  // 居中
  center: 'flex items-center justify-center',

  // 覆盖层
  overlay: 'fixed inset-0 bg-black/40 backdrop-blur-sm',

  // 玻璃效果
  glass: 'backdrop-blur-lg',
  glassMd: 'backdrop-blur-md',
  glassSm: 'backdrop-blur-sm',
} as const;

// ============================================
// Z-Index 层级系统
// ============================================
export const Z_INDEX = {
  base: 'z-0',
  content: 'z-10',
  header: 'z-20',
  dropdown: 'z-30',
  modal: 'z-[100]',
  modalDetail: 'z-[200]',
  tooltip: 'z-[300]',
  toast: 'z-[400]',
} as const;

// ============================================
// 按钮变体样式
// ============================================
export const BUTTON_VARIANTS = {
  primary: {
    base: 'bg-gradient-primary text-space-950 font-semibold shadow-glow border border-transparent',
    hover: 'hover:opacity-95',
  },
  secondary: {
    dark: 'bg-space-800/70 text-star-50 border border-gold-500/20',
    light: 'bg-white text-paper-900 border border-paper-300',
    hover: {
      dark: 'hover:bg-space-700/70 hover:border-accent/60',
      light: 'hover:bg-paper-100 hover:border-accent/50',
    },
  },
  outline: {
    dark: 'bg-transparent text-star-50 border border-gold-500/20',
    light: 'bg-transparent text-paper-900 border border-paper-300',
    hover: {
      dark: 'hover:border-accent/60',
      light: 'hover:border-accent/50',
    },
  },
  ghost: {
    base: 'bg-transparent text-accent border-none shadow-none',
    hover: 'hover:bg-space-700/50 hover:text-accent-hover',
  },
} as const;

// ============================================
// 按钮尺寸
// ============================================
export const BUTTON_SIZES = {
  sm: 'h-8 min-h-[44px] md:min-h-0 px-3 text-xs',
  md: 'h-10 min-h-[44px] md:min-h-0 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

// ============================================
// 语义化颜色类名 (增强版 - 支持状态反馈)
// ============================================
export const SEMANTIC_COLORS = {
  success: {
    text: 'text-success',
    bg: 'bg-success',
    bgLight: 'bg-success/10',
    bgMedium: 'bg-success/20',
    border: 'border-success',
    borderLight: 'border-success/30',
    hover: 'hover:bg-success/15',
    // 使用场景：成功消息、完成状态、正向反馈
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning',
    bgLight: 'bg-warning/10',
    bgMedium: 'bg-warning/20',
    border: 'border-warning',
    borderLight: 'border-warning/30',
    hover: 'hover:bg-warning/15',
    // 使用场景：警告提示、需要注意的信息、中性提醒
  },
  danger: {
    text: 'text-danger',
    bg: 'bg-danger',
    bgLight: 'bg-danger/10',
    bgMedium: 'bg-danger/20',
    border: 'border-danger',
    borderLight: 'border-danger/30',
    hover: 'hover:bg-danger/15',
    // 使用场景：错误消息、删除操作、危险警告
  },
  info: {
    text: 'text-info',
    bg: 'bg-info',
    bgLight: 'bg-info/10',
    bgMedium: 'bg-info/20',
    border: 'border-info',
    borderLight: 'border-info/30',
    hover: 'hover:bg-info/15',
    // 使用场景：提示信息、帮助文本、中性通知
  },
} as const;

// ============================================
// 功能域色彩系统 (Feature-based Colors)
// ============================================
export const FEATURE_COLORS = {
  // 占星功能 - 神秘紫色系
  astrology: {
    primary: 'text-mystic-500',
    primaryBg: 'bg-mystic-500',
    light: 'bg-mystic-500/10',
    medium: 'bg-mystic-500/20',
    border: 'border-mystic-500/30',
    hover: 'hover:bg-mystic-500/15 hover:border-mystic-500/40',
    gradient: 'bg-gradient-to-br from-mystic-600 to-mystic-400',
    // 使用场景：星盘、本命盘、合盘、Wiki占星内容
  },

  // 心理学/CBT功能 - 专业蓝色系
  psychology: {
    primary: 'text-psycho-500',
    primaryBg: 'bg-psycho-500',
    light: 'bg-psycho-500/10',
    medium: 'bg-psycho-500/20',
    border: 'border-psycho-500/30',
    hover: 'hover:bg-psycho-500/15 hover:border-psycho-500/40',
    gradient: 'bg-gradient-to-br from-psycho-600 to-psycho-400',
    // 使用场景：CBT日记、情绪追踪、心理分析
  },

  // 报告/洞察 - 暗金色系（保持现有品牌色）
  insights: {
    primary: 'text-accent',
    primaryBg: 'bg-accent',
    light: 'bg-accent/10',
    medium: 'bg-accent/20',
    border: 'border-accent/30',
    hover: 'hover:bg-accent/15 hover:border-accent/40',
    gradient: 'bg-gradient-primary',
    glow: 'shadow-glow',
    // 使用场景：报告生成、深度分析、付费功能
  },
} as const;

// ============================================
// 色彩层次系统 (60/30/10 规则)
// ============================================
export const COLOR_HIERARCHY = {
  // 主导色 (60%) - 背景和��面积使用
  dominant: {
    dark: 'bg-space-950 text-star-50',
    light: 'bg-paper-100 text-paper-900',
  },

  // 次要色 (30%) - 卡片、容器、分组
  secondary: {
    dark: 'bg-space-900/60 text-star-200',
    light: 'bg-paper-50 text-paper-600',
  },

  // 强调色 (10%) - 按钮、链接、重要元素
  accent: {
    primary: 'text-accent bg-accent',
    astrology: 'text-mystic-500 bg-mystic-500',
    psychology: 'text-psycho-500 bg-psycho-500',
  },
} as const;

// ============================================
// 交互状态色彩 (Interactive States)
// ============================================
export const INTERACTIVE_STATES = {
  // 链接状态
  link: {
    default: 'text-accent underline-offset-4',
    hover: 'hover:text-accent-hover hover:underline',
    visited: 'visited:text-accent/80',
  },

  // 按钮状态（增强版）
  button: {
    primary: {
      default: 'bg-gradient-primary text-space-950',
      hover: 'hover:opacity-95 hover:shadow-glow',
      active: 'active:opacity-90 active:scale-[0.98]',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    },
    astrology: {
      default: 'bg-mystic-500 text-white',
      hover: 'hover:bg-mystic-600 hover:shadow-[0_0_20px_-6px_rgba(168,85,247,0.4)]',
      active: 'active:bg-mystic-700 active:scale-[0.98]',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    },
    psychology: {
      default: 'bg-psycho-500 text-white',
      hover: 'hover:bg-psycho-600 hover:shadow-[0_0_20px_-6px_rgba(59,130,246,0.4)]',
      active: 'active:bg-psycho-700 active:scale-[0.98]',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    },
  },

  // 卡片状态
  card: {
    default: 'border-space-700/70',
    hover: 'hover:border-accent/50 hover:bg-space-900/70',
    active: 'border-accent/70 bg-space-900/80',
    disabled: 'opacity-60 cursor-not-allowed',
  },

  // 输入框状态
  input: {
    default: 'border-gold-500/20 focus:border-accent/50',
    error: 'border-danger/50 focus:border-danger',
    success: 'border-success/50 focus:border-success',
    disabled: 'opacity-60 cursor-not-allowed bg-space-900/30',
  },
} as const;

// ============================================
// 数据可视化色彩 (Data Visualization)
// ============================================
export const DATA_VIZ_COLORS = {
  // 情绪色谱（用于CBT情绪追踪）
  mood: {
    veryPositive: 'bg-emerald-500 text-white',
    positive: 'bg-green-500 text-white',
    neutral: 'bg-amber-500 text-white',
    negative: 'bg-orange-500 text-white',
    veryNegative: 'bg-red-500 text-white',
  },

  // 行星色彩（用于占星图表）
  planets: {
    sun: 'text-amber-400',
    moon: 'text-slate-300',
    mercury: 'text-cyan-400',
    venus: 'text-pink-400',
    mars: 'text-red-500',
    jupiter: 'text-purple-400',
    saturn: 'text-indigo-500',
    uranus: 'text-sky-400',
    neptune: 'text-blue-400',
    pluto: 'text-violet-600',
  },

  // 图表色板（多色数据集）
  chart: [
    'bg-mystic-500',
    'bg-psycho-500',
    'bg-accent',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-violet-500',
  ],
} as const;

// ============================================
// 类型导出
// ============================================
export type Theme = 'dark' | 'light';
export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;
