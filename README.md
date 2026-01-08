<!-- INPUT: 项目说明、运行方式与环境变量约定。 -->
<!-- OUTPUT: 根目录主说明文档。 -->
<!-- POS: 项目对外说明入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 运行与部署 AI Studio 应用

**重要约定**：任何功能、架构、写法更新必须在工作结束后更新相关目录的子文档（各目录的 FOLDER.md 与对应说明文档）。

本仓库包含本地运行应用所需的全部内容。

在 AI Studio 查看应用：https://ai.studio/apps/drive/1qofnbmAyKU93vEEwcxFojkef9_yWZKqJ

## 架构概览

项目采用前后端分离架构：

- **前端**：React + TypeScript + Vite
- **后端**：Node.js + Express + TypeScript（位于 `backend/` 目录）

## 本地运行

**前置条件：** Node.js 18+

### 1. 启动后端服务

```bash
cd backend
npm install
npm run dev
```

后端默认运行在 `http://localhost:3001`。

### 2. 启动前端服务

```bash
# 在项目根目录
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`。

## 环境变量

### 前端 (.env.local)

- `VITE_API_BASE_URL`：后端 API 地址（默认 `http://localhost:3001/api`）

### 后端 (backend/.env)

- `PORT`：服务端口（默认 3001）
- `DEEPSEEK_API_KEY`：DeepSeek API 密钥（全工程统一）
- `DEEPSEEK_BASE_URL`：DeepSeek API 地址（可选）
- `REDIS_URL`：Redis 连接 URL（可选，有内存 fallback）

后端会同时读取 `backend/.env` 与项目根目录的 `.env.local`，便于共享同一套 DeepSeek 配置。

## 目录结构

```
oracle/
├── backend/           # 后端服务
│   ├── src/
│   │   ├── api/       # API 路由
│   │   ├── services/  # 业务服务
│   │   ├── data/      # 数据源定义
│   │   ├── prompts/   # Prompt 管理
│   │   └── cache/     # 缓存层
│   └── package.json
├── components/        # React 组件
│   └── cbt/           # CBT 功能组件
├── services/          # 前端服务层
│   ├── apiClient.ts   # 后端 API 客户端
│   └── cbt/           # CBT 服务
├── pages/             # 页面组件
└── types.ts           # 类型定义
```
