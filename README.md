# 太虚之门 (The Void)

一款现代心理占星Web应用，将精准天文计算与AI深度洞察相结合。

## 功能特性

- **入口与注册**：沉浸式仪式风格的用户注册流程
- **控制台**：每日宇宙天气，行运双圆盘可视化
- **个人档案**：本命星盘分析与心理洞察
- **行运追踪**：4维度行运分析
- **合盘分析**：关系兼容性分析
- **神谕**：AI占星问答（3次免费，之后付费）
- **双语支持**：完整的中英文支持

## 技术栈

### 前端
- React 18 + TypeScript
- Vite（构建工具）
- Tailwind CSS（样式）
- Framer Motion（动画）
- Zustand（状态管理）
- i18next（国际化）
- Lucide React（图标）

### 后端
- Vercel Serverless Functions
- Supabase（PostgreSQL + 认证）
- DeepSeek API（AI基础模型）
- Gemini 3.0 Pro（AI高阶报告）

### 占星计算
- swisseph-js（天文计算）
- 自定义SVG星盘渲染

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm
- Supabase 账号
- DeepSeek API 密钥

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/oracle.git
cd oracle

# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

### 环境变量

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI APIs
DEEPSEEK_API_KEY=your-deepseek-api-key
GEMINI_API_KEY=your-gemini-api-key

# 地理编码（可选）
VITE_MAPBOX_TOKEN=your-mapbox-token
```

### 数据库配置

1. 创建新的 Supabase 项目
2. 在 SQL Editor 中运行 `supabase/schema.sql`
3. 启用行级安全策略（已包含在schema中）

## 项目结构

```
oracle/
├── api/                    # Vercel Serverless Functions
│   ├── daily.ts           # 每日洞察 API
│   ├── oracle.ts          # AI问答 API
│   ├── synastry.ts        # 合盘分析 API
│   └── depth.ts           # 深度报告 API
├── src/
│   ├── components/        # React 组件
│   │   ├── Layout.tsx     # 应用外壳与导航
│   │   └── AstrologyChart.tsx  # SVG星盘组件
│   ├── pages/             # 页面组件
│   │   ├── Landing.tsx    # 入口页
│   │   ├── Onboarding.tsx # 注册流程
│   │   ├── Dashboard.tsx  # 控制台
│   │   ├── Profile.tsx    # 个人档案
│   │   ├── Oracle.tsx     # 神谕
│   │   ├── Synastry.tsx   # 合盘
│   │   └── Settings.tsx   # 设置
│   ├── lib/               # 工具库
│   │   ├── supabase.ts    # Supabase 客户端
│   │   └── astrology.ts   # 占星计算
│   ├── store.ts           # Zustand 状态管理
│   ├── i18n.ts            # 国际化翻译
│   ├── App.tsx            # 路由配置
│   ├── main.tsx           # 入口文件
│   └── index.css          # 全局样式
├── supabase/
│   └── schema.sql         # 数据库Schema
├── tailwind.config.js     # Tailwind 配置
├── vite.config.ts         # Vite 配置
└── package.json
```

## API 接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/daily?date=YYYY-MM-DD` | 获取每日洞察 |
| POST | `/api/oracle` | 提交神谕问题 |
| POST | `/api/synastry` | 生成合盘报告 |
| POST | `/api/depth` | 生成深度报告 |

## 设计系统

详见 `DESIGN_SPEC.md`，包含完整的设计规范：
- 色彩系统（深空黑 + 暖金色）
- 字体规范（Inter + JetBrains Mono）
- 组件样式
- 动效指南

## 部署

### Vercel（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Vercel 环境变量配置
在 Vercel 项目设置中添加 `.env.example` 中的所有变量。

## 开发路线图

### P0（MVP）
- [x] 入口页面
- [x] 注册流程
- [x] 控制台
- [x] 个人档案 - 本命星盘
- [x] 设置

### P1
- [x] 个人档案 - 行运追踪
- [x] 神谕

### P2
- [x] 合盘分析
- [ ] 用户认证（Supabase集成）
- [ ] 支付集成

### P3
- [ ] CBT心理日记
- [ ] 占星知识库
- [ ] 移动端应用（iOS/Android）

## 贡献指南

1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 发起 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

---

由 The Void Team 用 ✨ 构建
